import { supabase, hasSupabase } from "./supabase";
import {
  ROLE_LABEL, setSession,
  type BusinessType, type Role, type Session,
} from "./auth";

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; error: string };

function resolveDisplayName(user: { email?: string; user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata ?? {};
  const fromMeta = typeof meta["name"] === "string" ? meta["name"].trim() : "";
  if (fromMeta) return fromMeta;
  return (user.email ?? "").split("@")[0] ?? "User";
}

export async function loginWithSupabase(email: string, password: string): Promise<LoginResult> {
  if (!hasSupabase || !supabase) return { ok: false, error: "Supabase is not configured." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: error?.message ?? "Invalid email or password." };

  const uid = data.user.id;
  const displayName = resolveDisplayName(data.user);

  const { data: isAdmin } = await supabase.rpc("is_platform_admin", { _uid: uid });

  if (isAdmin === true) {
    const session: Session = {
      role: "super_admin",
      email,
      name: displayName || ROLE_LABEL.super_admin,
      vendorId: null, vendorName: null, businessType: null,
      branchId: null, branchName: null,
    };
    setSession(session);
    return { ok: true, session };
  }

  const { data: vm, error: vmErr } = await supabase.rpc("my_vendor_membership");
  if (vmErr) console.warn("[auth] my_vendor_membership rpc failed:", vmErr.message);

  const row = Array.isArray(vm) ? vm[0] : vm;
  if (row && row.role) {
    const role = row.role as Role;
    const name = (row.display_name as string | undefined)?.trim() || displayName || email.split("@")[0];
    const session: Session = {
      role,
      email,
      name,
      vendorId:    row.vendor_id    ?? null,
      vendorName:  row.vendor_name  ?? null,
      businessType: (row.business_type as BusinessType | undefined) ?? "both",
      branchId:    row.branch_id   ?? null,
      branchName:  row.branch_name ?? null,
    };
    setSession(session);
    return { ok: true, session };
  }

  await supabase.auth.signOut();
  return { ok: false, error: "This account has no platform or vendor role assigned. Contact your administrator." };
}

export async function changePassword(newPassword: string): Promise<string | null> {
  if (!hasSupabase || !supabase) return "Supabase is not configured.";
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? error.message : null;
}
