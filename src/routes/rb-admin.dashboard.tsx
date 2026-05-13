import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, Coffee, ChefHat, Beef, ClipboardList } from "lucide-react";
import { venue, rbKpis, hourlyRevenue, tickets, tables } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Restaurant & Butchery" }] }),
  component: Dash,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function Dash() {
  const occupied = tables.filter(t => t.status === "occupied").length;
  return (
    <div>
      <PageHeader
        title={`Karibu, ${venue.manager.split(" ")[0]}`}
        subtitle={`${venue.name} · ${venue.location}`}
        actions={
          <>
            <Link to="/rb-admin/tables"><Button variant="outline"><Coffee className="h-4 w-4 mr-1"/> Open tables</Button></Link>
            <Link to="/rb-admin/kitchen"><Button><ChefHat className="h-4 w-4 mr-1"/> Kitchen view</Button></Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat icon={TrendingUp} label="Revenue today" value={fmt(rbKpis.todayRevenue)} hint={`${rbKpis.covers} covers`} />
        <Stat icon={Users} label="Tables occupied" value={`${occupied}/${tables.length}`} hint={`${rbKpis.openTables} open bills`} />
        <Stat icon={ChefHat} label="In kitchen" value={String(rbKpis.ticketsInKitchen)} hint="Active tickets" />
        <Stat icon={Beef} label="Butchery" value={fmt(rbKpis.butcheryRevenue)} hint="Counter sales today" highlight />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Hourly revenue</CardTitle><Badge variant="outline">Today</Badge></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="restaurant" stackId="a" fill="var(--color-chart-1)" radius={[0,0,0,0]} />
                <Bar dataKey="butchery" stackId="a" fill="var(--color-chart-2)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4"/> Live kitchen tickets</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {tickets.slice(0,5).map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">{t.id} · Table {t.table}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[180px]">{t.items.join(", ")}</div>
                </div>
                <Badge variant={t.status === "ready" ? "default" : t.status === "preparing" ? "secondary" : "outline"}>{t.elapsed}</Badge>
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
