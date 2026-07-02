import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import { WaterAdminSidebar } from "@/components/water-admin/Sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { branch as _mock_branch } from "@/lib/water-mock";
import { fetchBranch } from "@/lib/water-data";
import { getSession, clearSession, ROLE_LABEL, type Session } from "@/lib/auth";
import { TenantProvider } from "@/lib/tenant-context";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { EditNameDialog } from "@/components/EditNameDialog";
import { useLive } from "@/lib/use-live";

export const Route = createFileRoute("/water-admin")({
  component: WaterAdminLayout,
});

function WaterAdminLayout() {
  const navigate  = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady]          = useState(false);

  useEffect(() => {
    const s = getSession();
    setSessionState(s);
    setReady(true);
    const roleOk = s && ["super_admin", "vendor_admin", "water_admin", "water_branch_manager", "water_cashier"].includes(s.role);
    const typeOk = !s || s.role !== "vendor_admin" ||
      s.businessType === "water" || s.businessType === "both" || s.businessType === null;
    if (!s || !roleOk || !typeOk) navigate({ to: "/login" });
  }, [navigate]);

  // Scope branch fetch by this vendor — include vendorId in query key so
  // different tenants never share each other's cached branch row.
  const vendorId  = session?.vendorId  ?? null;
  const branchId  = session?.branchId  ?? null;
  const branchName = session?.branchName ?? null;
  const branch   = useLive(
    ["water", "branch", vendorId] as const,
    fetchBranch,
    _mock_branch,
  );

  if (!ready || !session) return null;

  const initials = session.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const isSuper  = session.role === "super_admin";

  const handleSignOut = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  return (
    <TenantProvider vendorId={vendorId} vendorName={session.vendorName} branchId={branchId} branchName={branchName}>
      <div className="min-h-screen flex bg-background">
        <WaterAdminSidebar role={session.role} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card flex items-center gap-4 px-4 md:px-8">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search transactions, products, cashiers…" className="pl-9 bg-background" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              {isSuper && (
                <Badge variant="outline" className="hidden sm:inline-flex border-primary text-primary">
                  Viewing as Super Admin
                </Badge>
              )}
              <Link to="/water-admin/dashboard" className="relative p-2 rounded-md hover:bg-secondary">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              </Link>
              {/* Branch name badge — scoped to this vendor */}
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {branchName ?? branch.name}
              </Badge>
              {/* User avatar + dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {initials || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start leading-tight">
                      <span className="text-sm font-medium">{session.name}</span>
                      <span className="text-[11px] text-muted-foreground">{ROLE_LABEL[session.role]}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-2 text-sm">
                    <div className="font-medium truncate">{session.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{session.email}</div>
                    {session.vendorName && (
                      <div className="text-xs text-muted-foreground mt-0.5">{session.vendorName}</div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                    <EditNameDialog />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                    <ChangePasswordDialog />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </TenantProvider>
  );
}
