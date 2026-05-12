import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { SuperAdminSidebar } from "@/components/super-admin/Sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getSession, ROLE_HOME, type Session } from "@/lib/auth";

export const Route = createFileRoute("/super-admin")({
  component: SuperAdminLayout,
});

function SuperAdminLayout() {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    setSessionState(s);
    setReady(true);
    if (!s) navigate({ to: "/login" });
    else if (s.role !== "super_admin") navigate({ to: ROLE_HOME[s.role] });
  }, [navigate]);

  if (!ready || !session || session.role !== "super_admin") return null;

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
            <Badge variant="secondary" className="hidden sm:inline-flex">Super Admin</Badge>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">SA</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

