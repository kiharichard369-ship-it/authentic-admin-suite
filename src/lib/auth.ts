// Mock auth + role-based permissions. Replace with real auth (Lovable Cloud) later.

export type Role =
  | "super_admin"
  | "water_admin"
  | "water_cashier"
  | "driver"
  | "rb_admin"
  | "rb_cashier"
  | "waiter"
  | "kitchen"
  | "butcher";

export type Permission =
  // Water Retail modules
  | "water.dashboard" | "water.sales" | "water.stock" | "water.customers"
  | "water.cashiers" | "water.requests" | "water.refunds" | "water.expenses" | "water.reports"
  // R&B modules
  | "rb.dashboard" | "rb.tables" | "rb.kitchen" | "rb.butchery" | "rb.menu" | "rb.reports"
  // Delivery modules
  | "delivery.dashboard" | "delivery.routes" | "delivery.drivers" | "delivery.drops" | "delivery.fuel" | "delivery.reports"
  // Platform modules
  | "platform.users" | "platform.shops" | "platform.analytics" | "platform.assets"
  | "platform.payments" | "platform.expenses" | "platform.reports";

const ALL_PERMS: Permission[] = [
  "water.dashboard","water.sales","water.stock","water.customers","water.cashiers","water.requests","water.refunds","water.expenses","water.reports",
  "rb.dashboard","rb.tables","rb.kitchen","rb.butchery","rb.menu","rb.reports",
  "delivery.dashboard","delivery.routes","delivery.drivers","delivery.drops","delivery.fuel","delivery.reports",
  "platform.users","platform.shops","platform.analytics","platform.assets","platform.payments","platform.expenses","platform.reports",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL_PERMS,
  water_admin: [
    "water.dashboard","water.sales","water.stock","water.customers",
    "water.cashiers","water.requests","water.refunds","water.expenses","water.reports",
  ],
  water_cashier: ["water.dashboard","water.sales","water.customers","water.refunds"],
  rb_admin: ["rb.dashboard","rb.tables","rb.kitchen","rb.butchery","rb.menu","rb.reports"],
  rb_cashier: ["rb.dashboard","rb.tables"],
  waiter: ["rb.dashboard","rb.tables"],
  kitchen: ["rb.dashboard","rb.kitchen"],
  butcher: ["rb.dashboard","rb.butchery"],
  driver: ["delivery.dashboard","delivery.routes","delivery.drops"],
};

export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/super-admin/dashboard",
  water_admin: "/water-admin/dashboard",
  water_cashier: "/water-admin/sales",
  rb_admin: "/rb-admin/dashboard",
  rb_cashier: "/rb-admin/dashboard",
  waiter: "/rb-admin/dashboard",
  kitchen: "/rb-admin/dashboard",
  butcher: "/rb-admin/dashboard",
  driver: "/delivery-admin/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  water_admin: "Water Retail Admin",
  water_cashier: "Water Cashier",
  rb_admin: "Restaurant & Butchery Admin",
  rb_cashier: "R&B Cashier",
  waiter: "Waiter",
  kitchen: "Kitchen",
  butcher: "Butcher",
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
    rb: "rb_admin",
    rbcashier: "rb_cashier",
    waiter: "waiter",
    kitchen: "kitchen",
    butcher: "butcher",
  };
  return map[prefix] ?? null;
}
