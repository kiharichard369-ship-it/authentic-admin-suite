import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { WaterAdminSidebar } from "@/components/water-admin/Sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { branch as _mock_branch } from "@/lib/water-mock";
import { fetchBranch } from "@/lib/water-data";

import { getSession, ROLE_LABEL, type Session } from "@/lib/auth";

import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/water-admin")({
  component: WaterAdminLayout,
});

function WaterAdminLayout() {
  const branch = useLive(["water","branch"] as const, fetchBranch, _mock_branch as any);
  const navigate = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    setSessionState(s);
    setReady(true);
    const allowed = s && (s.role === "super_admin" || s.role === "water_admin" || s.role === "water_cashier");
    if (s === null || !allowed) navigate({ to: "/login" });
  }, [navigate]);

  if (!ready || !session) return null;

  const initials = session.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const isSuper = session.role === "super_admin";

  return (
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
            <Badge variant="secondary" className="hidden sm:inline-flex">{branch.name}</Badge>
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium">{session.name}</span>
              <span className="text-[11px] text-muted-foreground">{ROLE_LABEL[session.role]}</span>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">{initials || "U"}</AvatarFallback>
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
