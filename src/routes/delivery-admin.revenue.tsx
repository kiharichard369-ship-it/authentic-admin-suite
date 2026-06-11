import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Smartphone, Banknote, TrendingUp, Droplet, AlertCircle, Download } from "lucide-react";
import { dailyRevenue as _mock_dailyRevenue } from "@/lib/delivery-mock";
import { fetchDailyRevenue } from "@/lib/delivery-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/delivery-admin/revenue")({
  head: () => ({ meta: [{ title: "Daily Revenue — Water Delivery" }] }),
  component: RevenuePage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function RevenuePage() {
  const dailyRevenue = useLive(["delivery","dailyRevenue"] as const, fetchDailyRevenue, _mock_dailyRevenue as any);
  return (
    <div>
      <PageHeader
        title="Daily Revenue"
        subtitle={`Service date: ${dailyRevenue.date}`}
        actions={<Button variant="outline"><Download className="h-4 w-4 mr-1" /> Export PDF</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Tile icon={Smartphone} label="M-Pesa revenue" value={fmt(dailyRevenue.mpesa)} />
        <Tile icon={Banknote} label="Cash revenue" value={fmt(dailyRevenue.cash)} />
        <Tile icon={TrendingUp} label="Combined total" value={fmt(dailyRevenue.total)} highlight />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Droplet className="h-4 w-4" /> Starting stock (litres)</CardTitle></CardHeader>
          <CardContent>
            <div className="font-display text-3xl tabular-nums">{dailyRevenue.startingStockLitres.toLocaleString()} L</div>
            <p className="text-xs text-muted-foreground mt-1">Lorry load at open of business</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Droplet className="h-4 w-4" /> Finishing stock (litres)</CardTitle></CardHeader>
          <CardContent>
            <div className="font-display text-3xl tabular-nums">{dailyRevenue.finishingStockLitres.toLocaleString()} L</div>
            <p className="text-xs text-muted-foreground mt-1">Lorry load at close of business</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/40">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" /> Outstanding debt</CardTitle></CardHeader>
          <CardContent>
            <div className="font-display text-3xl tabular-nums">{fmt(dailyRevenue.outstandingDebt)}</div>
            <p className="text-xs text-muted-foreground mt-1">Unpaid deliveries today</p>
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
