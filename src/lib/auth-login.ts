// Real Supabase login resolver. Signs the user in, then derives their role
// from platform_admins / vendor_members. Falls back to demo prefix mode when
// Supabase is not configured.

import { supabase, hasSupabase } from "./supabase";
import { ROLE_LABEL, setSession, type Role, type Session } from "./auth";

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; error: string };

export async function loginWithSupabase(email: string, password: string): Promise<LoginResult> {
  if (!hasSupabase || !supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Invalid email or password." };
  }
  const uid = data.user.id;

  // 1. Platform admin? Use SECURITY DEFINER RPC to bypass RLS on platform_admins
  //    (the table intentionally has no policy for `authenticated`).
  const { data: isAdmin, error: adminErr } = await supabase.rpc("is_platform_admin", { _uid: uid });
  if (adminErr) console.warn("[auth] is_platform_admin rpc failed:", adminErr.message);

  if (isAdmin === true) {
    const session: Session = {
      role: "super_admin",
      email,
      name: ROLE_LABEL.super_admin,
      vendorId: null,
      vendorName: null,
    };
    setSession(session);
    return { ok: true, session };
  }

  // 2. Vendor member?
  const { data: vm } = await supabase
    .from("vendor_members")
    .select("role, vendor_id, vendors(name)")
    .eq("user_id", uid)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (vm) {
    const role = vm.role as Role;
    const session: Session = {
      role,
      email,
      name: ROLE_LABEL[role] ?? email,
      vendorId: vm.vendor_id,
      vendorName: (vm as any).vendors?.name ?? null,
    };
    setSession(session);
    return { ok: true, session };
  }

  await supabase.auth.signOut();
  return {
    ok: false,
    error: "This account has no platform or vendor role assigned. Contact your administrator.",
  };
}
