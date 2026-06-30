// Calls the create-vendor-user Edge Function to create a real Supabase Auth
// account (with admin-set password) and attach it to a vendor with a role.

import { supabase, hasSupabase } from "./supabase";

export type CreateVendorUserInput = {
  name: string;
  email: string;
  password: string;
  role: "vendor_admin" | "water_admin" | "water_cashier" | "driver";
  vendorId: string;
};

export async function createVendorUser(input: CreateVendorUserInput): Promise<void> {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const { data, error } = await supabase.functions.invoke("create-vendor-user", {
    body: input,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    // supabase-js wraps non-2xx responses in error.context; try to surface the real message
    const ctxMsg = (error as any)?.context?.error;
    throw new Error(ctxMsg || error.message || "Failed to create user");
  }
  if (data?.error) throw new Error(data.error);
}
