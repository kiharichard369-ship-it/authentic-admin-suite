import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck, Route as RouteIcon, Users, MapPin, Fuel, FileText } from "lucide-react";

export const Route = createFileRoute("/delivery-admin/dashboard")({
  head: () => ({ meta: [{ title: "Water Delivery — Admin" }] }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("maji-session-v1");
    const s = raw ? JSON.parse(raw) : null;
    if (!s) { window.location.href = "/login"; throw new Error("redirect"); }
    const allowed = ["super_admin","driver"];
    if (!allowed.includes(s.role)) { window.location.href = "/login"; throw new Error("redirect"); }
  },
  component: DeliveryAdminLanding,
});

const modules = [
  { icon: RouteIcon, name: "Active routes", desc: "Live lorry tracking, ETA, completed stops." },
  { icon: Users, name: "Drivers", desc: "Schedules, trip history, performance scores." },
  { icon: MapPin, name: "Drop points", desc: "Estates, offices and recurring customers." },
  { icon: Fuel, name: "Fuel & expenses", desc: "Diesel logs, repairs and per-trip costing." },
  { icon: FileText, name: "Reports", desc: "Litres delivered, route P&L, driver payouts." },
];

function DeliveryAdminLanding() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link to="/super-admin/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Super Admin
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl">Water Delivery</h1>
            <p className="text-sm text-muted-foreground">Admin workspace · all modules visible to Super Admin</p>
          </div>
        </div>

        <Badge variant="secondary" className="mb-8">Coming soon · pages scaffold below</Badge>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ icon: Icon, name, desc }) => (
            <Card key={name} className="hover:border-primary transition-colors">
              <CardContent className="p-5">
                <Icon className="h-6 w-6 text-primary mb-3" />
                <div className="font-medium mb-1">{name}</div>
                <p className="text-xs text-muted-foreground">{desc}</p>
                <Button size="sm" variant="outline" className="mt-4 w-full" disabled>Open module</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
