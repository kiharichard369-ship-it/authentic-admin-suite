import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Receipt, Package, Users, FileText, UtensilsCrossed, LogOut, ShieldCheck, TrendingUp } from "lucide-react";
import { can, clearSession, type Role, type Permission } from "@/lib/auth";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; perm: Permission };

const items: Item[] = [
  { to: "/rb-admin/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "rb.dashboard" },
  { to: "/rb-admin/pos", label: "Take-away POS", icon: Receipt, perm: "rb.pos" },
  { to: "/rb-admin/stock", label: "Stock (Raw / Cooked)", icon: Package, perm: "rb.stock" },
  { to: "/rb-admin/cashiers", label: "Cashiers", icon: Users, perm: "rb.cashiers" },
  { to: "/rb-admin/revenue", label: "Daily Revenue", icon: TrendingUp, perm: "rb.revenue" },
  { to: "/rb-admin/reports", label: "Reports", icon: FileText, perm: "rb.reports" },
];

export function RbAdminSidebar({ role }: { role: Role }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const session = { role, email: "", name: "" };
  const visible = items.filter((i) => can(session, i.perm));
  const isSuper = role === "super_admin";

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Link to="/rb-admin/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">R&B Take-away</div>
            <div className="text-xs text-sidebar-foreground/60 mt-0.5">Manager workspace</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
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
