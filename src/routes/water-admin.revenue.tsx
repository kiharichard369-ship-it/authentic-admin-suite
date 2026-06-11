import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Smartphone, Banknote, TrendingUp, Droplet, Download } from "lucide-react";
import { products } from "@/lib/water-mock";
import { waterKpis as _mock_waterKpis, branch as _mock_branch } from "@/lib/water-mock";
import { fetchWaterKpis, fetchBranch } from "@/lib/water-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/water-admin/revenue")({
  head: () => ({ meta: [{ title: "Daily Revenue — Water Retail" }] }),
  component: RevenuePage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function RevenuePage() {
  const waterKpis = useLive(["water","waterKpis"] as const, fetchWaterKpis, _mock_waterKpis);
  const branch = useLive(["water","branch"] as const, fetchBranch, _mock_branch);
  // Mock split: assume 65% M-Pesa / 35% cash for the day.
  const mpesa = Math.round(waterKpis.todayRevenue * 0.65);
  const cash = waterKpis.todayRevenue - mpesa;
  const stockValue = products.reduce((a, b) => a + (b.price ?? 0) * b.stock, 0);
  const startingStock = Math.round(stockValue * 1.4);
  const finishingStock = stockValue;

  return (
    <div>
      <PageHeader
        title="Daily Revenue"
        subtitle={`${branch.name} · ${new Date().toISOString().slice(0, 10)}`}
        actions={<Button variant="outline"><Download className="h-4 w-4 mr-1" /> Export PDF</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Tile icon={Smartphone} label="M-Pesa revenue" value={fmt(mpesa)} />
        <Tile icon={Banknote} label="Cash revenue" value={fmt(cash)} />
        <Tile icon={TrendingUp} label="Combined total" value={fmt(waterKpis.todayRevenue)} highlight />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Droplet className="h-4 w-4" /> Starting stock (open of business)</CardTitle></CardHeader>
          <CardContent>
            <div className="font-display text-3xl tabular-nums">{fmt(startingStock)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lorry-on-hand value at 07:00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Droplet className="h-4 w-4" /> Finishing stock (close of business)</CardTitle></CardHeader>
          <CardContent>
            <div className="font-display text-3xl tabular-nums">{fmt(finishingStock)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lorry-on-hand value at close</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent bg-accent/5" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${highlight ? "text-accent" : "text-muted-foreground"}`} />
        </div>
        <div className="font-display text-3xl mt-2 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
