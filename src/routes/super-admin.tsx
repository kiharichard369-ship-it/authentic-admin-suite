import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import { SuperAdminSidebar } from "@/components/super-admin/Sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getSession, clearSession, ROLE_HOME, ROLE_LABEL, type Session } from "@/lib/auth";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

export const Route = createFileRoute("/super-admin")({
  component: SuperAdminLayout,
});

function SuperAdminLayout() {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady]          = useState(false);

  useEffect(() => {
    const s = getSession();
    setSessionState(s);
    setReady(true);
    if (!s) navigate({ to: "/login" });
    else if (s.role !== "super_admin") navigate({ to: ROLE_HOME[s.role] });
  }, [navigate]);

  if (!ready || !session || session.role !== "super_admin") return null;

  const initials = session.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SA";

  const handleSignOut = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center gap-4 px-4 md:px-8">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search users, shops, transactions…" className="pl-9 bg-background" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/super-admin/dashboard" className="relative p-2 rounded-md hover:bg-secondary">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex">Platform Admin</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
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
                </div>
                <DropdownMenuSeparator />
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
  );
}
