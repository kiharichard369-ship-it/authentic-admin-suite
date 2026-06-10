// Mock auth + role-based permissions. Multi-tenant SaaS.
// Backend: Supabase (JWT custom claims `role` + `vendor_id`; `is_platform_admin`
// for super admins). Each non-super user belongs to exactly one vendor (tenant).

export type Role =
  | "super_admin"      // platform owner — sees all vendors
  | "vendor_admin"     // tenant owner — full access to their vendor's Water + Delivery
  | "water_admin"      // tenant water-arm manager
  | "water_cashier"    // tenant water POS operator
  | "driver";          // tenant delivery driver

export type Permission =
  // Water Retail
  | "water.dashboard" | "water.pos" | "water.stock" | "water.customers"
  | "water.cashiers" | "water.requests" | "water.refunds" | "water.expenses"
  | "water.revenue" | "water.reports"
  // Delivery
  | "delivery.dashboard" | "delivery.dispatch" | "delivery.gps"
  | "delivery.drivers" | "delivery.debts" | "delivery.credits"
  | "delivery.fuel" | "delivery.revenue" | "delivery.reports"
  // Platform (super admin only)
  | "platform.vendors" | "platform.users" | "platform.shops" | "platform.analytics"
  | "platform.assets" | "platform.payments" | "platform.expenses"
  | "platform.reports" | "platform.debts";

const WATER_PERMS: Permission[] = [
  "water.dashboard","water.pos","water.stock","water.customers",
  "water.cashiers","water.requests","water.refunds","water.expenses",
  "water.revenue","water.reports",
];
const DELIVERY_PERMS: Permission[] = [
  "delivery.dashboard","delivery.dispatch","delivery.gps","delivery.drivers",
  "delivery.debts","delivery.credits","delivery.fuel","delivery.revenue","delivery.reports",
];
const PLATFORM_PERMS: Permission[] = [
  "platform.vendors","platform.users","platform.shops","platform.analytics",
  "platform.assets","platform.payments","platform.expenses","platform.reports","platform.debts",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [...WATER_PERMS, ...DELIVERY_PERMS, ...PLATFORM_PERMS],
  vendor_admin: [...WATER_PERMS, ...DELIVERY_PERMS],
  water_admin: WATER_PERMS,
  water_cashier: ["water.dashboard","water.pos","water.customers","water.refunds"],
  driver: ["delivery.dashboard","delivery.dispatch","delivery.debts","delivery.credits","delivery.fuel"],
};

export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/super-admin/dashboard",
  vendor_admin: "/water-admin/dashboard",
  water_admin: "/water-admin/dashboard",
  water_cashier: "/water-admin/pos",
  driver: "/delivery-admin/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  vendor_admin: "Vendor Admin",
  water_admin: "Water Retail Admin",
  water_cashier: "Water Cashier",
  driver: "Driver",
};

export type Session = {
  role: Role;
  name: string;
  email: string;
  vendorId: string | null;     // null for super_admin
  vendorName: string | null;
};

const KEY = "maji-session-v2";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch { return null; }
}

export function setSession(s: Session) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

export function can(session: Session | null, perm: Permission): boolean {
  if (!session) return false;
  return ROLE_PERMISSIONS[session.role]?.includes(perm) ?? false;
}

// Demo: derive role + vendor from an email prefix so the login screen can route any role.
// Format: <role-prefix>[@<vendor-slug>].mirie.co.ke
//   super@mirie.co.ke              → super_admin (no vendor)
//   vendor@acme.mirie.co.ke        → vendor_admin of "acme"
//   water@acme.mirie.co.ke         → water_admin of "acme"
//   cashier@acme.mirie.co.ke       → water_cashier of "acme"
//   driver@acme.mirie.co.ke        → driver of "acme"
export function parseDemoEmail(email: string): { role: Role; vendorSlug: string | null } | null {
  const [user, host] = email.toLowerCase().split("@");
  if (!user || !host) return null;
  const prefixMap: Record<string, Role> = {
    super: "super_admin",
    vendor: "vendor_admin",
    water: "water_admin",
    cashier: "water_cashier",
    driver: "driver",
  };
  const role = prefixMap[user];
  if (!role) return null;
  if (role === "super_admin") return { role, vendorSlug: null };
  // Vendor slug is the subdomain in host: <slug>.mirie.co.ke; default to "acme".
  const parts = host.split(".");
  const slug = parts.length >= 3 ? parts[0] : "acme";
  return { role, vendorSlug: slug };
}
