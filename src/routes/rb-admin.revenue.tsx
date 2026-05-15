import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Smartphone, Banknote, TrendingUp, PackageOpen, PackageCheck, Download } from "lucide-react";
import { dailyRevenue, rbKpis } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/revenue")({
  head: () => ({ meta: [{ title: "Daily Revenue — R&B" }] }),
  component: RevenuePage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function RevenuePage() {
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

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PackageOpen className="h-4 w-4" /> Starting stock value</CardTitle></CardHeader>
          <CardContent>
            <div className="font-display text-3xl tabular-nums">{fmt(dailyRevenue.startingStockValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Recorded at open of business</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PackageCheck className="h-4 w-4" /> Finishing stock value</CardTitle></CardHeader>
          <CardContent>
            <div className="font-display text-3xl tabular-nums">{fmt(dailyRevenue.finishingStockValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Recorded at close of business</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Category breakdown</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="p-4 border rounded-md">
            <Badge variant="secondary">RAW</Badge>
            <div className="font-display text-2xl mt-2 tabular-nums">{fmt(rbKpis.rawSold)}</div>
            <p className="text-xs text-muted-foreground">Uncooked chicken sales</p>
          </div>
          <div className="p-4 border rounded-md">
            <Badge>COOKED</Badge>
            <div className="font-display text-2xl mt-2 tabular-nums">{fmt(rbKpis.cookedSold)}</div>
            <p className="text-xs text-muted-foreground">Ready take-away sales</p>
          </div>
        </CardContent>
      </Card>
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
