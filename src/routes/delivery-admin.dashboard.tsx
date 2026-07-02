import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Droplet, Truck, Fuel, AlertCircle, MapPin } from "lucide-react";
import { fleet as _mock_fleet, deliveryKpis as _mock_deliveryKpis, litresByDay as _mock_litresByDay, dispatches as _mock_dispatches, drivers as _mock_drivers } from "@/lib/delivery-mock";
import { fetchFleet, fetchDeliveryKpis, fetchLitresByDay, fetchDispatches, fetchDrivers } from "@/lib/delivery-data";
import { getSession } from "@/lib/auth";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/delivery-admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Water Delivery" }] }),
  component: Dash,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function Dash() {
  const session = getSession();
  const firstName = (session?.name ?? "there").trim().split(" ")[0];
  const fleet = useLive(["delivery","fleet"] as const, fetchFleet, _mock_fleet);
  const deliveryKpis = useLive(["delivery","deliveryKpis"] as const, fetchDeliveryKpis, _mock_deliveryKpis);
  const litresByDay = useLive(["delivery","litresByDay"] as const, fetchLitresByDay, _mock_litresByDay);
  const dispatches = useLive(["delivery","dispatches"] as const, fetchDispatches, _mock_dispatches);
  const drivers = useLive(["delivery","drivers"] as const, fetchDrivers, _mock_drivers);
  const active = dispatches.filter((d) => d.status !== "returned");
  return (
    <div>
      <PageHeader title={`Hello, ${firstName}`} subtitle={`${fleet.name}${fleet.base ? " · " + fleet.base : ""}`}
        actions={<>
          <Link to="/delivery-admin/dispatch"><Button variant="outline"><Truck className="h-4 w-4 mr-1"/> Dispatch tracking</Button></Link>
          <Link to="/delivery-admin/gps"><Button><MapPin className="h-4 w-4 mr-1"/> GPS map</Button></Link>
        </>}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat icon={TrendingUp} label="Revenue today" value={fmt(deliveryKpis.todayRevenue)} hint={`M-Pesa ${fmt(deliveryKpis.mpesaToday)}`} />
        <Stat icon={Droplet} label="Litres delivered" value={deliveryKpis.litresDelivered.toLocaleString()+" L"} hint={`${deliveryKpis.activeDispatches} dispatches active`} />
        <Stat icon={AlertCircle} label="Outstanding debt" value={fmt(deliveryKpis.pendingDebt)} hint="Unpaid deliveries" highlight />
        <Stat icon={Fuel} label="Fuel today" value={fmt(deliveryKpis.fuelToday)} hint="Diesel + repairs" />
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
            {drivers.filter((d) => d.status !== "off").map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.vehicle}</div>
                </div>
                <Badge variant={d.status === "on_route" ? "default" : "secondary"}>{d.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Active dispatches</CardTitle><Link to="/delivery-admin/dispatch" className="text-xs text-primary hover:underline">View all →</Link></CardHeader>
        <CardContent className="divide-y">
          {active.map((d) => (
            <div key={d.id} className="flex items-center gap-4 py-3 text-sm">
              <span className="w-24 font-medium">{d.id}</span>
              <span className="flex-1 truncate">{d.driver} · {d.customer}</span>
              <span className="text-muted-foreground tabular-nums">{d.litres} L</span>
              <Badge variant="outline">Out {d.dispatchedAt}</Badge>
              <Badge variant={d.paid ? "default" : "destructive"}>{d.paid ? "Paid" : "Unpaid"}</Badge>
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
