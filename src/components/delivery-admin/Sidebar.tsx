import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Truck as TruckIcon, Users, Fuel, FileText, Truck, LogOut, ShieldCheck, MapPin, AlertCircle, Coins, TrendingUp } from "lucide-react";
import { can, clearSession, type Role, type Permission } from "@/lib/auth";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; perm: Permission };

const items: Item[] = [
  { to: "/delivery-admin/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "delivery.dashboard" },
  { to: "/delivery-admin/dispatch", label: "Dispatch tracking", icon: TruckIcon, perm: "delivery.dispatch" },
  { to: "/delivery-admin/gps", label: "GPS live map", icon: MapPin, perm: "delivery.gps" },
  { to: "/delivery-admin/drivers", label: "Drivers", icon: Users, perm: "delivery.drivers" },
  { to: "/delivery-admin/debts", label: "Debt module", icon: AlertCircle, perm: "delivery.debts" },
  { to: "/delivery-admin/credits", label: "Credit / carry-forward", icon: Coins, perm: "delivery.credits" },
  { to: "/delivery-admin/fuel", label: "Fuel & expenses", icon: Fuel, perm: "delivery.fuel" },
  { to: "/delivery-admin/revenue", label: "Daily Revenue", icon: TrendingUp, perm: "delivery.revenue" },
  { to: "/delivery-admin/reports", label: "Reports", icon: FileText, perm: "delivery.reports" },
];

export function DeliveryAdminSidebar({ role }: { role: Role }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const session = { role, email: "", name: "" };
  const visible = items.filter((i) => can(session, i.perm));
  const isSuper = role === "super_admin";

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Link to="/delivery-admin/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Water Delivery</div>
            <div className="text-xs text-sidebar-foreground/60 mt-0.5">Fleet operations</div>
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
