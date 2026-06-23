// Real Supabase login resolver. Signs the user in, then derives their role
// from platform_admins / vendor_members. Falls back to demo prefix mode when
// Supabase is not configured.

import { supabase, hasSupabase } from "./supabase";
import {
  ROLE_LABEL, setSession,
  type BusinessType, type Role, type Session,
} from "./auth";

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

  // 1. Platform admin?
  const { data: isAdmin, error: adminErr } = await supabase.rpc("is_platform_admin", { _uid: uid });
  if (adminErr) console.warn("[auth] is_platform_admin rpc failed:", adminErr.message);

  if (isAdmin === true) {
    const session: Session = {
      role: "super_admin",
      email,
      name: ROLE_LABEL.super_admin,
      vendorId: null,
      vendorName: null,
      businessType: null,
    };
    setSession(session);
    return { ok: true, session };
  }

  // 2. Vendor member?
  const { data: vm, error: vmErr } = await supabase.rpc("my_vendor_membership");
  if (vmErr) console.warn("[auth] my_vendor_membership rpc failed:", vmErr.message);

  const row = Array.isArray(vm) ? vm[0] : vm;
  if (row && row.role) {
    const role = row.role as Role;
    const session: Session = {
      role,
      email,
      name: ROLE_LABEL[role] ?? email,
      vendorId: row.vendor_id ?? null,
      vendorName: row.vendor_name ?? null,
      businessType: (row.business_type as BusinessType | undefined) ?? "both",
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
