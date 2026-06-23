// Super-admin onboarding helpers. All calls go through SECURITY DEFINER RPCs
// in db/onboarding.sql which enforce `is_platform_admin(auth.uid())`.

import { supabase, hasSupabase } from "./supabase";
import type { VendorPlan } from "./vendors";

export type OnboardVendorInput = {
  name: string;
  slug: string;
  plan: VendorPlan;
  contactEmail: string;
  contactPhone?: string;
  adminEmail: string;
};

export type OnboardVendorResult = {
  vendorId: string;
  adminUserId: string;
};

export async function findAuthUserByEmail(email: string): Promise<string | null> {
  if (!hasSupabase || !supabase) return null;
  const { data, error } = await supabase.rpc("find_auth_user_by_email", { p_email: email });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function createVendorWithAdmin(input: OnboardVendorInput): Promise<OnboardVendorResult> {
  if (!hasSupabase || !supabase) {
    throw new Error("Lovable Cloud is not configured. Add Supabase credentials to .env.");
  }
  const { data, error } = await supabase.rpc("create_vendor_with_admin", {
    p_name:          input.name,
    p_slug:          input.slug,
    p_plan:          input.plan,
    p_contact_email: input.contactEmail,
    p_contact_phone: input.contactPhone ?? "",
    p_admin_email:   input.adminEmail,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Vendor was not created.");
  return {
    vendorId: row.out_vendor_id ?? row.vendor_id,
    adminUserId: row.out_admin_user_id ?? row.admin_user_id,
  };
}

export async function platformVendorCount(): Promise<number> {
  if (!hasSupabase || !supabase) return 0;
  const { data, error } = await supabase.rpc("platform_vendor_count");
  if (error) throw error;
  return (data as number | null) ?? 0;
}
