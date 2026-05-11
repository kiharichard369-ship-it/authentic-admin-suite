import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { WaterAdminSidebar } from "@/components/water-admin/Sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { branch } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin")({
  component: WaterAdminLayout,
});

function WaterAdminLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      <WaterAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center gap-4 px-4 md:px-8">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search transactions, products, cashiers…" className="pl-9 bg-background" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/water-admin/dashboard" className="relative p-2 rounded-md hover:bg-secondary">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex">{branch.name}</Badge>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">MW</AvatarFallback>
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
