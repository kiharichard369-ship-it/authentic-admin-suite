import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Receipt, Package, Beef, Flame } from "lucide-react";
import { venue, rbKpis, hourlyRevenue, recentOrders, cashiers } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — R&B Take-away" }] }),
  component: Dash,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function Dash() {
  const activeCashiers = cashiers.filter(c => c.active).length;
  return (
    <div>
      <PageHeader
        title={`Karibu, ${venue.manager.split(" ")[0]}`}
        subtitle={`${venue.name} · ${venue.location} · Take-away only`}
        actions={
          <>
            <Link to="/rb-admin/stock"><Button variant="outline"><Package className="h-4 w-4 mr-1"/> Stock</Button></Link>
            <Link to="/rb-admin/pos"><Button><Receipt className="h-4 w-4 mr-1"/> Open POS</Button></Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat icon={TrendingUp} label="Revenue today" value={fmt(rbKpis.todayRevenue)} hint={`${rbKpis.ordersToday} orders · avg ${fmt(rbKpis.avgTicket)}`} />
        <Stat icon={Beef} label="RAW sold" value={fmt(rbKpis.rawSold)} hint="Uncooked chicken" />
        <Stat icon={Flame} label="COOKED sold" value={fmt(rbKpis.cookedSold)} hint="Ready take-away" highlight />
        <Stat icon={Receipt} label="Cashiers active" value={`${activeCashiers}/${cashiers.length}`} hint="Max 6 per shift" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Hourly revenue (RAW vs COOKED)</CardTitle><Badge variant="outline">Today</Badge></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="raw" stackId="a" fill="var(--color-chart-2)" />
                <Bar dataKey="cooked" stackId="a" fill="var(--color-chart-1)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent orders</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div className="min-w-0">
                  <div className="font-medium">{o.id} · {o.time}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[180px]">{o.items}</div>
                </div>
                <div className="text-right">
                  <Badge variant={o.category === "RAW" ? "secondary" : "default"} className="text-[10px]">{o.category}</Badge>
                  <div className="tabular-nums text-xs mt-1">{fmt(o.total)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
