// Mock auth + role-based permissions. Aligned with v2 prompts.
// Backend will be hosted on Supabase later (JWT custom claims: role, business_id, shop_id).

export type Role =
  | "super_admin"
  | "water_admin"
  | "water_cashier"
  | "driver"
  | "rb_manager"
  | "rb_cashier";

export type Permission =
  // Water Retail modules
  | "water.dashboard" | "water.pos" | "water.stock" | "water.customers"
  | "water.cashiers" | "water.requests" | "water.refunds" | "water.expenses"
  | "water.revenue" | "water.reports"
  // R&B (take-away) modules
  | "rb.dashboard" | "rb.pos" | "rb.stock" | "rb.cashiers" | "rb.revenue" | "rb.reports"
  // Delivery modules
  | "delivery.dashboard" | "delivery.dispatch" | "delivery.gps"
  | "delivery.drivers" | "delivery.debts" | "delivery.credits"
  | "delivery.fuel" | "delivery.revenue" | "delivery.reports"
  // Platform modules (super admin only)
  | "platform.users" | "platform.shops" | "platform.analytics" | "platform.assets"
  | "platform.payments" | "platform.expenses" | "platform.reports" | "platform.debts";

const ALL_PERMS: Permission[] = [
  "water.dashboard","water.pos","water.stock","water.customers","water.cashiers","water.requests","water.refunds","water.expenses","water.revenue","water.reports",
  "rb.dashboard","rb.pos","rb.stock","rb.cashiers","rb.revenue","rb.reports",
  "delivery.dashboard","delivery.dispatch","delivery.gps","delivery.drivers","delivery.debts","delivery.credits","delivery.fuel","delivery.revenue","delivery.reports",
  "platform.users","platform.shops","platform.analytics","platform.assets","platform.payments","platform.expenses","platform.reports","platform.debts",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL_PERMS,
  water_admin: [
    "water.dashboard","water.pos","water.stock","water.customers",
    "water.cashiers","water.requests","water.refunds","water.expenses",
    "water.revenue","water.reports",
  ],
  // Cashier: POS + customers + refunds (initiate). No stock/price editing.
  water_cashier: ["water.dashboard","water.pos","water.customers","water.refunds"],
  rb_manager: ["rb.dashboard","rb.pos","rb.stock","rb.cashiers","rb.revenue","rb.reports"],
  rb_cashier: ["rb.dashboard","rb.pos"],
  driver: ["delivery.dashboard","delivery.dispatch","delivery.debts","delivery.credits","delivery.fuel"],
};

export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/super-admin/dashboard",
  water_admin: "/water-admin/dashboard",
  water_cashier: "/water-admin/pos",
  rb_manager: "/rb-admin/dashboard",
  rb_cashier: "/rb-admin/pos",
  driver: "/delivery-admin/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  water_admin: "Water Retail Admin",
  water_cashier: "Water Cashier",
  rb_manager: "R&B Manager",
  rb_cashier: "R&B Cashier",
  driver: "Driver",
};

export type Session = { role: Role; name: string; email: string };

const KEY = "maji-session-v1";

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

// Demo: derive role from an email prefix so the login screen can route any role.
export function roleFromEmail(email: string): Role | null {
  const prefix = email.split("@")[0]?.toLowerCase() ?? "";
  const map: Record<string, Role> = {
    super: "super_admin",
    water: "water_admin",
    cashier: "water_cashier",
    driver: "driver",
    rb: "rb_manager",
    rbcashier: "rb_cashier",
  };
  return map[prefix] ?? null;
}
