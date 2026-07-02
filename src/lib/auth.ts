export type Role =
  | "super_admin"
  | "vendor_admin"
  | "water_admin"
  | "water_branch_manager"
  | "water_cashier"
  | "driver";

export type Permission =
  | "water.dashboard" | "water.pos" | "water.stock" | "water.customers"
  | "water.cashiers" | "water.requests" | "water.refunds" | "water.expenses"
  | "water.revenue" | "water.reports" | "water.branches" | "water.payments"
  | "delivery.dashboard" | "delivery.dispatch" | "delivery.gps"
  | "delivery.drivers" | "delivery.debts" | "delivery.credits"
  | "delivery.fuel" | "delivery.revenue" | "delivery.reports"
  | "platform.vendors" | "platform.users" | "platform.shops" | "platform.analytics"
  | "platform.assets" | "platform.payments" | "platform.expenses"
  | "platform.reports" | "platform.debts";

const WATER_PERMS: Permission[] = [
  "water.dashboard","water.pos","water.stock","water.customers",
  "water.cashiers","water.requests","water.refunds","water.expenses",
  "water.revenue","water.reports","water.branches","water.payments",
];
const DELIVERY_PERMS: Permission[] = [
  "delivery.dashboard","delivery.dispatch","delivery.gps","delivery.drivers",
  "delivery.debts","delivery.credits","delivery.fuel","delivery.revenue","delivery.reports",
];
const PLATFORM_PERMS: Permission[] = [
  "platform.vendors","platform.users","platform.shops","platform.analytics",
  "platform.assets","platform.payments","platform.expenses","platform.reports","platform.debts",
];

// Branch manager: everything water EXCEPT adding branches and payment config
const BRANCH_MANAGER_PERMS: Permission[] = [
  "water.dashboard","water.pos","water.stock","water.customers",
  "water.cashiers","water.requests","water.refunds","water.expenses",
  "water.revenue","water.reports",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin:          [...WATER_PERMS, ...DELIVERY_PERMS, ...PLATFORM_PERMS],
  vendor_admin:         [...WATER_PERMS, ...DELIVERY_PERMS],
  water_admin:          WATER_PERMS,
  water_branch_manager: BRANCH_MANAGER_PERMS,
  water_cashier:        ["water.dashboard","water.pos","water.customers","water.refunds"],
  driver:               ["delivery.dashboard","delivery.dispatch","delivery.debts","delivery.credits","delivery.fuel"],
};

// Can this role delete records? Only admins and above.
export const CAN_DELETE: Partial<Record<Role, true>> = {
  super_admin: true,
  vendor_admin: true,
  water_admin: true,
};

export type BusinessType = "water" | "delivery" | "both";

export const ROLE_HOME: Record<Role, string> = {
  super_admin:          "/super-admin/dashboard",
  vendor_admin:         "/water-admin/dashboard",
  water_admin:          "/water-admin/dashboard",
  water_branch_manager: "/water-admin/dashboard",
  water_cashier:        "/water-admin/pos",
  driver:               "/delivery-admin/dashboard",
};

export function sessionHome(s: Pick<Session, "role" | "businessType">): string {
  if (s.role === "vendor_admin") {
    if (s.businessType === "delivery") return "/delivery-admin/dashboard";
    return "/water-admin/dashboard";
  }
  return ROLE_HOME[s.role];
}

export const ROLE_LABEL: Record<Role, string> = {
  super_admin:          "Super Admin",
  vendor_admin:         "Vendor Admin",
  water_admin:          "Water Retail Admin",
  water_branch_manager: "Branch Manager",
  water_cashier:        "Water Cashier",
  driver:               "Driver",
};

export type Session = {
  role: Role;
  name: string;
  email: string;
  vendorId:    string | null;
  vendorName:  string | null;
  businessType: BusinessType | null;
  branchId:    string | null;   // null = vendor-wide (admin/owner)
  branchName:  string | null;
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

export function canDelete(session: Session | null): boolean {
  if (!session) return false;
  return !!CAN_DELETE[session.role];
}

export function parseDemoEmail(email: string): { role: Role; vendorSlug: string | null } | null {
  const [user, host] = email.toLowerCase().split("@");
  if (!user || !host) return null;
  const prefixMap: Record<string, Role> = {
    super:   "super_admin",
    vendor:  "vendor_admin",
    water:   "water_admin",
    branch:  "water_branch_manager",
    cashier: "water_cashier",
    driver:  "driver",
  };
  const role = prefixMap[user];
  if (!role) return null;
  if (role === "super_admin") return { role, vendorSlug: null };
  const parts = host.split(".");
  const slug = parts.length >= 3 ? parts[0] : "acme";
  return { role, vendorSlug: slug };
}
