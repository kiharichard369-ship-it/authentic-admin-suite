import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { useLive } from "@/lib/use-live";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  TrendingUp, Droplet, Receipt, AlertCircle, Users as UsersIcon, Plus, ClipboardList,
} from "lucide-react";
import { products } from "@/lib/water-mock";
import { branch as _mock_branch, waterKpis as _mock_waterKpis, hourlySales as _mock_hourlySales, transactions as _mock_transactions, cashiers as _mock_cashiers } from "@/lib/water-mock";
import { fetchBranch, fetchWaterKpis, fetchHourlySales, fetchTransactions, fetchCashiers } from "@/lib/water-data";


export const Route = createFileRoute("/water-admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Water Retail" }] }),
  component: Dashboard,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function Dashboard() {
  const branch = useLive(["water","branch"] as const, fetchBranch, _mock_branch as any);
  const waterKpis = useLive(["water","waterKpis"] as const, fetchWaterKpis, _mock_waterKpis as any);
  const hourlySales = useLive(["water","hourlySales"] as const, fetchHourlySales, _mock_hourlySales as any);
  const transactions = useLive(["water","transactions"] as const, fetchTransactions, _mock_transactions as any);
  const cashiers = useLive(["water","cashiers"] as const, fetchCashiers, _mock_cashiers as any);
  const lowStock = products.filter((p) => p.stock <= p.reorder);

  return (
    <div>
      <PageHeader
        title={`Habari, ${branch.manager.split(" ")[0]}`}
        subtitle={`${branch.name} · ${branch.address}`}
        actions={
          <>
            <Link to="/water-admin/requests"><Button variant="outline"><ClipboardList className="h-4 w-4 mr-1" /> New stock request</Button></Link>
            <Link to="/water-admin/pos"><Button><Plus className="h-4 w-4 mr-1" /> Open POS</Button></Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat icon={TrendingUp} label="Revenue today" value={fmt(waterKpis.todayRevenue)} hint={`${waterKpis.txns} transactions`} />
        <Stat icon={Droplet} label="Litres dispensed" value={waterKpis.todayLitres.toLocaleString() + " L"} hint="Refill + new bottles" />
        <Stat icon={UsersIcon} label="Cashiers on shift" value={String(waterKpis.cashiersOnShift)} hint="Morning shift" />
        <Stat icon={AlertCircle} label="Low stock items" value={String(lowStock.length)} hint="At or below reorder" highlight />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's sales by hour</CardTitle>
            <Badge variant="outline">Live</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={hourlySales}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cashier performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {cashiers.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.shift}</div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums">{fmt(c.todaySales)}</div>
                  <div className="text-xs text-muted-foreground">{c.txns} txns</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Link to="/water-admin/revenue" className="text-xs text-primary hover:underline">View revenue →</Link>
          </CardHeader>
          <CardContent className="divide-y">
            {transactions.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-4 py-3 text-sm">
                <span className="text-muted-foreground tabular-nums w-12">{t.time}</span>
                <span className="text-foreground/80 w-20 truncate">{t.id}</span>
                <span className="flex-1 truncate">{t.items}</span>
                <Badge variant={t.status === "refunded" ? "destructive" : "secondary"} className="w-20 justify-center">{t.method}</Badge>
                <span className="tabular-nums w-24 text-right font-medium">{fmt(t.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-accent/40">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-accent" /> Low stock alerts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 && (
              <div className="text-sm text-muted-foreground">All items above reorder level.</div>
            )}
            {lowStock.map((p) => (
              <div key={p.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="outline">{p.stock} {p.unit}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Reorder at {p.reorder}</div>
              </div>
            ))}
            <Link to="/water-admin/requests" className="block pt-2">
              <Button variant="outline" className="w-full">Request stock</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, highlight }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint: string; highlight?: boolean;
}) {
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
