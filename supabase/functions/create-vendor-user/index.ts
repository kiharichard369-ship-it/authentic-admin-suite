// Supabase Edge Function: create-vendor-user
//
// Creates a Supabase Auth user (with a password set by the calling admin)
// and attaches them to a vendor as a member with the given role.
// Runs server-side with the SERVICE ROLE key — never exposed to the browser.
//
// Deploy: supabase functions deploy create-vendor-user
// Caller auth: requires a valid Supabase session (vendor_admin / water_admin /
// super_admin). The function re-checks the caller's role server-side before
// creating anything, so this cannot be abused even if called directly.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  name: string;
  email: string;
  password: string;
  role: "vendor_admin" | "water_admin" | "water_cashier" | "driver";
  vendorId: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    // Client scoped to the CALLER's JWT — used only to verify who's asking.
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) {
      return json({ error: "Invalid or expired session" }, 401);
    }

    const body: Body = await req.json();
    const { name, email, password, role, vendorId } = body;

    if (!name?.trim() || !email?.trim() || !password || password.length < 8 || !role || !vendorId) {
      return json({ error: "Missing or invalid fields. Password must be at least 8 characters." }, 400);
    }

    // Admin client (service role) — used for the actual privileged operations.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── Authorize the caller ────────────────────────────────────────────────
    // Allowed if: platform super admin, OR a vendor_admin/water_admin/
    // delivery admin who is a member of THIS vendor.
    const { data: isPlatformAdmin } = await admin.rpc("is_platform_admin", { _uid: caller.id });

    let authorized = !!isPlatformAdmin;

    if (!authorized) {
      const { data: membership } = await admin
        .from("vendor_members")
        .select("role, vendor_id")
        .eq("user_id", caller.id)
        .eq("vendor_id", vendorId)
        .maybeSingle();

      authorized = !!membership && ["vendor_admin", "water_admin"].includes(membership.role);
    }

    if (!authorized) {
      return json({ error: "You don't have permission to create users for this vendor." }, 403);
    }

    // ── Create the auth user ────────────────────────────────────────────────
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
    });

    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Failed to create user" }, 400);
    }

    // ── Attach as a vendor member ───────────────────────────────────────────
    const { error: memberErr } = await admin.from("vendor_members").insert({
      user_id: created.user.id,
      vendor_id: vendorId,
      role,
    });

    if (memberErr) {
      // Roll back the auth user if membership insert fails, to avoid orphans
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: memberErr.message }, 400);
    }

    return json({ ok: true, userId: created.user.id });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
