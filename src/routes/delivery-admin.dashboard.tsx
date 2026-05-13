import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Droplet, Truck, MapPin, Fuel } from "lucide-react";
import { fleet, deliveryKpis, litresByDay, routes, drivers } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Water Delivery" }] }),
  component: Dash,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function Dash() {
  return (
    <div>
      <PageHeader title={`Habari, ${fleet.manager.split(" ")[0]}`} subtitle={`${fleet.name} · ${fleet.base}`}
        actions={<>
          <Link to="/delivery-admin/routes"><Button variant="outline"><Truck className="h-4 w-4 mr-1"/> Active routes</Button></Link>
          <Link to="/delivery-admin/drops"><Button><MapPin className="h-4 w-4 mr-1"/> New drop</Button></Link>
        </>}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat icon={TrendingUp} label="Revenue today" value={fmt(deliveryKpis.todayRevenue)} hint={`${deliveryKpis.completedDrops} drops`} />
        <Stat icon={Droplet} label="Litres delivered" value={deliveryKpis.litresDelivered.toLocaleString()+" L"} hint="Across all routes" />
        <Stat icon={Truck} label="Active routes" value={String(deliveryKpis.activeRoutes)} hint={`${deliveryKpis.pendingDrops} pending drops`} />
        <Stat icon={Fuel} label="Fuel today" value={fmt(deliveryKpis.fuelToday)} hint="Diesel + repairs" highlight />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Litres delivered (7d)</CardTitle><Badge variant="outline">Last week</Badge></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={litresByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="litres" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Drivers on duty</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {drivers.filter(d=>d.status!=="off").map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.vehicle}</div>
                </div>
                <Badge variant={d.status === "on_route" ? "default" : "secondary"}>{d.status.replace("_"," ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Active routes</CardTitle><Link to="/delivery-admin/routes" className="text-xs text-primary hover:underline">View all →</Link></CardHeader>
        <CardContent className="divide-y">
          {routes.filter(r=>r.status!=="completed").map(r => (
            <div key={r.id} className="flex items-center gap-4 py-3 text-sm">
              <span className="w-20 font-medium">{r.id}</span>
              <span className="flex-1">{r.driver} · {r.vehicle}</span>
              <span className="text-muted-foreground">{r.completed}/{r.drops} drops</span>
              <span className="tabular-nums">{r.litres} L</span>
              <Badge variant="outline">ETA {r.eta}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, highlight }: { icon: any; label: string; value: string; hint: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${highlight ? "text-accent" : "text-muted-foreground"}`} />
        </div>
        <div className="font-display text-3xl mt-2">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{hint}</div>
      </CardContent>
    </Card>
  );
}
