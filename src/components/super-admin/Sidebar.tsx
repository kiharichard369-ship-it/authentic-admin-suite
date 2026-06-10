import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Users, Store, BarChart3, Boxes,
  CreditCard, Receipt, FileText, Droplets, LogOut,
  ChevronDown, Truck, Package, ClipboardList,
  Wallet, RefreshCcw, Coins, AlertCircle, Route as RouteIcon,
  MapPin, Fuel, UserCircle, TrendingUp, Building2,
} from "lucide-react";

const platformItems = [
  { to: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/super-admin/vendors", label: "Vendors", icon: Building2 },
  { to: "/super-admin/users", label: "Users & Roles", icon: Users },
  { to: "/super-admin/shops", label: "Shop Branches", icon: Store },
  { to: "/super-admin/customers", label: "Customers", icon: UserCircle },
  { to: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/super-admin/assets", label: "Assets", icon: Boxes },
  { to: "/super-admin/payments", label: "Payment Config", icon: CreditCard },
  { to: "/super-admin/debts", label: "Debts & Credits", icon: AlertCircle },
  { to: "/super-admin/expenses", label: "Expenses", icon: Receipt },
  { to: "/super-admin/reports", label: "Reports", icon: FileText },
];

type ArmItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
type Arm = { id: string; name: string; icon: React.ComponentType<{ className?: string }>; items: ArmItem[] };

const arms: Arm[] = [
  {
    id: "water",
    name: "Water Retail",
    icon: Droplets,
    items: [
      { to: "/water-admin/dashboard", label: "Branch dashboard", icon: LayoutDashboard },
      { to: "/water-admin/pos", label: "POS", icon: Receipt },
      { to: "/water-admin/stock", label: "Stock & pricing", icon: Package },
      { to: "/water-admin/customers", label: "Customers", icon: UserCircle },
      { to: "/water-admin/cashiers", label: "Cashiers", icon: Users },
      { to: "/water-admin/requests", label: "Stock requests", icon: ClipboardList },
      { to: "/water-admin/refunds", label: "Refunds", icon: RefreshCcw },
      { to: "/water-admin/expenses", label: "Expenses", icon: Wallet },
      { to: "/water-admin/revenue", label: "Daily revenue", icon: TrendingUp },
      { to: "/water-admin/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    id: "delivery",
    name: "Water Delivery",
    icon: Truck,
    items: [
      { to: "/delivery-admin/dashboard", label: "Fleet dashboard", icon: LayoutDashboard },
      { to: "/delivery-admin/dispatch", label: "Dispatch tracking", icon: RouteIcon },
      { to: "/delivery-admin/gps", label: "GPS live map", icon: MapPin },
      { to: "/delivery-admin/drivers", label: "Drivers", icon: Users },
      { to: "/delivery-admin/debts", label: "Debt module", icon: AlertCircle },
      { to: "/delivery-admin/credits", label: "Credit / carry-forward", icon: Coins },
      { to: "/delivery-admin/fuel", label: "Fuel & expenses", icon: Fuel },
      { to: "/delivery-admin/revenue", label: "Daily revenue", icon: TrendingUp },
      { to: "/delivery-admin/reports", label: "Reports", icon: FileText },
    ],
  },
];

export function SuperAdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState<Record<string, boolean>>(() => ({
    water: path.startsWith("/water-admin"),
    delivery: path.startsWith("/delivery-admin"),
  }));

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <Link to="/super-admin/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Mirie Platform</div>
            <div className="text-xs text-sidebar-foreground/60 mt-0.5">Super Admin</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
          Platform
        </div>
        {platformItems.map(({ to, label, icon: Icon }) => {
          const active = path.startsWith(to);
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                       : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}

        <div className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
          Vendor workspace (preview)
        </div>
        {arms.map((arm) => {
          const isOpen = open[arm.id];
          const Icon = arm.icon;
          return (
            <div key={arm.id} className="space-y-1">
              <button type="button"
                onClick={() => setOpen((s) => ({ ...s, [arm.id]: !s[arm.id] }))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{arm.name}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5">
                  {arm.items.map(({ to, label, icon: SubIcon }, i) => {
                    const active = path === to;
                    return (
                      <Link key={`${arm.id}-${i}`} to={to}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                          active ? "bg-sidebar-primary/15 text-sidebar-primary-foreground font-medium"
                                 : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}>
                        <SubIcon className="h-3.5 w-3.5" />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <Link to="/login" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Sign out
        </Link>
      </div>
    </aside>
  );
}
