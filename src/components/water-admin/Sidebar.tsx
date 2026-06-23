import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Receipt, Package, Users, ClipboardList, Wallet, FileText, Droplets, LogOut, UserCircle, RefreshCcw, ShieldCheck, TrendingUp } from "lucide-react";
import { can, clearSession, type Role, type Permission } from "@/lib/auth";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; perm: Permission };

const items: Item[] = [
  { to: "/water-admin/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "water.dashboard" },
  { to: "/water-admin/pos", label: "POS", icon: Receipt, perm: "water.pos" },
  { to: "/water-admin/stock", label: "Stock & Pricing", icon: Package, perm: "water.stock" },
  { to: "/water-admin/customers", label: "Customers", icon: UserCircle, perm: "water.customers" },
  { to: "/water-admin/cashiers", label: "Cashiers", icon: Users, perm: "water.cashiers" },
  { to: "/water-admin/requests", label: "Stock Requests", icon: ClipboardList, perm: "water.requests" },
  { to: "/water-admin/refunds", label: "Refunds", icon: RefreshCcw, perm: "water.refunds" },
  { to: "/water-admin/expenses", label: "Expenses", icon: Wallet, perm: "water.expenses" },
  { to: "/water-admin/revenue", label: "Daily Revenue", icon: TrendingUp, perm: "water.revenue" },
  { to: "/water-admin/reports", label: "Reports", icon: FileText, perm: "water.reports" },
];

export function WaterAdminSidebar({ role }: { role: Role }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const session = { role, email: "", name: "", vendorId: null, vendorName: null, businessType: null };
  const visible = items.filter((i) => can(session, i.perm));
  const isSuper = role === "super_admin";

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Link to="/water-admin/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Water Retail</div>
            <div className="text-xs text-sidebar-foreground/60 mt-0.5">Branch Workspace</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visible.map(({ to, label, icon: Icon }) => {
          const active = path.startsWith(to);
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                       : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {isSuper && (
          <Link to="/super-admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
            <ShieldCheck className="h-4 w-4" /> Super Admin view
          </Link>
        )}
        <Link to="/login" onClick={() => clearSession()} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Sign out
        </Link>
      </div>
    </aside>
  );
}
