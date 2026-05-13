import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { DeliveryAdminSidebar } from "@/components/delivery-admin/Sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fleet } from "@/lib/delivery-mock";
import { getSession, ROLE_LABEL, type Session } from "@/lib/auth";

export const Route = createFileRoute("/delivery-admin")({ component: DeliveryLayout });

function DeliveryLayout() {
  const navigate = useNavigate();
  const [session, setS] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    setS(s); setReady(true);
    const allowed = s && ["super_admin","driver"].includes(s.role);
    if (!allowed) navigate({ to: "/login" });
  }, [navigate]);

  if (!ready || !session) return null;
  const initials = session.name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase();
  const isSuper = session.role === "super_admin";

  return (
    <div className="min-h-screen flex bg-background">
      <DeliveryAdminSidebar role={session.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center gap-4 px-4 md:px-8">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search routes, drivers, drops…" className="pl-9 bg-background" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {isSuper && <Badge variant="outline" className="hidden sm:inline-flex border-primary text-primary">Viewing as Super Admin</Badge>}
            <Link to="/delivery-admin/dashboard" className="relative p-2 rounded-md hover:bg-secondary">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex">{fleet.base}</Badge>
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium">{session.name}</span>
              <span className="text-[11px] text-muted-foreground">{ROLE_LABEL[session.role]}</span>
            </div>
            <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary text-primary-foreground">{initials || "U"}</AvatarFallback></Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
