import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Store, BarChart3, Boxes,
  CreditCard, Receipt, FileText, Droplets, LogOut,
} from "lucide-react";

const items = [
  { to: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/super-admin/users", label: "Users & Roles", icon: Users },
  { to: "/super-admin/shops", label: "Shop Branches", icon: Store },
  { to: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/super-admin/assets", label: "Assets", icon: Boxes },
  { to: "/super-admin/payments", label: "Payment Config", icon: CreditCard },
  { to: "/super-admin/expenses", label: "Expenses", icon: Receipt },
  { to: "/super-admin/reports", label: "Reports", icon: FileText },
];

export function SuperAdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Link to="/super-admin/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Maji & Co.</div>
            <div className="text-xs text-sidebar-foreground/60 mt-0.5">Super Admin</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <Link
          to="/login"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Link>
      </div>
    </aside>
  );
}
