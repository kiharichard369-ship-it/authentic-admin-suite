// Tenant (vendor) registry. Mock data + Supabase pass-through.
// Vendors are the unit of multi-tenancy: each vendor owns its own Water Retail
// and Delivery operations. Super Admin provisions vendors from the platform.

import { supabase, hasSupabase } from "./supabase";

export type VendorStatus = "active" | "suspended" | "pending";
export type VendorPlan = "starter" | "growth" | "scale";

export type Vendor = {
  id: string;
  name: string;
  slug: string;
  status: VendorStatus;
  plan: VendorPlan;
  contactEmail: string;
  contactPhone: string | null;
  members: number;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Mock vendor list — used in demo mode (no Supabase configured).
// ---------------------------------------------------------------------------
const seed: Vendor[] = [
  {
    id: "v-acme", slug: "acme", name: "Acme Maji Co.",
    status: "active", plan: "growth",
    contactEmail: "owner@acme.co.ke", contactPhone: "+254 700 111 222",
    members: 6, createdAt: "2026-01-12",
  },
  {
    id: "v-blue", slug: "blue", name: "Blue Springs Water",
    status: "active", plan: "scale",
    contactEmail: "ops@bluesprings.co.ke", contactPhone: "+254 711 333 444",
    members: 11, createdAt: "2026-02-04",
  },
  {
    id: "v-pure", slug: "pure", name: "Pure Drop Refill",
    status: "pending", plan: "starter",
    contactEmail: "hello@puredrop.co.ke", contactPhone: null,
    members: 1, createdAt: "2026-05-09",
  },
];

const mem: Vendor[] = seed.map((v) => ({ ...v }));

function uid(prefix = "v") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listVendors(): Promise<Vendor[]> {
  if (!hasSupabase || !supabase) return [...mem];
  const { data, error } = await supabase
    .from("vendors")
    .select("id,name,slug,status,plan,contact_email,contact_phone,created_at,vendor_members(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id, name: r.name, slug: r.slug, status: r.status, plan: r.plan,
    contactEmail: r.contact_email, contactPhone: r.contact_phone,
    members: r.vendor_members?.[0]?.count ?? 0,
    createdAt: r.created_at,
  }));
}

export async function getVendorBySlug(slug: string): Promise<Vendor | null> {
  if (!hasSupabase || !supabase) return mem.find((v) => v.slug === slug) ?? null;
  const { data } = await supabase.from("vendors").select("*").eq("slug", slug).maybeSingle();
  return (data as any) ?? null;
}

export type CreateVendorInput = {
  name: string;
  slug: string;
  plan: VendorPlan;
  contactEmail: string;
  contactPhone?: string;
};

export async function createVendor(input: CreateVendorInput): Promise<Vendor> {
  if (!hasSupabase || !supabase) {
    const v: Vendor = {
      id: uid(), slug: input.slug, name: input.name,
      status: "active", plan: input.plan,
      contactEmail: input.contactEmail, contactPhone: input.contactPhone ?? null,
      members: 1, createdAt: new Date().toISOString().slice(0, 10),
    };
    mem.unshift(v);
    return v;
  }
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      name: input.name, slug: input.slug, plan: input.plan,
      contact_email: input.contactEmail, contact_phone: input.contactPhone ?? null,
      status: "active",
    })
    .select("id,name,slug,status,plan,contact_email,contact_phone,created_at")
    .single();
  if (error) throw error;
  // NOTE: Inviting the first vendor_admin user (auth.admin.inviteUserByEmail
  // + vendor_members insert) requires the service role and is done in a
  // server function — wire `src/lib/vendors.functions.ts` when promoting
  // this to production.
  return {
    id: data.id, name: data.name, slug: data.slug, status: data.status, plan: data.plan,
    contactEmail: data.contact_email, contactPhone: data.contact_phone,
    members: 1, createdAt: data.created_at,
  };
}

export async function setVendorStatus(id: string, status: VendorStatus): Promise<void> {
  if (!hasSupabase || !supabase) {
    const v = mem.find((x) => x.id === id);
    if (v) v.status = status;
    return;
  }
  const { error } = await supabase.from("vendors").update({ status }).eq("id", id);
  if (error) throw error;
}
