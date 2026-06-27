import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Smartphone, Banknote, TrendingUp, Droplet, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchDailyRevenue, fetchDeliveryKpis } from "@/lib/delivery-data";
import { dailyRevenue as _mock_dailyRevenue, deliveryKpis as _mock_kpis } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/revenue")({
  head: () => ({ meta: [{ title: "Daily Revenue — Water Delivery" }] }),
  component: RevenuePage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

async function saveRevenue(data: {
  mpesa: number; cash: number; startingStockLitres: number;
  finishingStockLitres: number; outstandingDebt: number;
}) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("delivery_daily_revenue_log")
    .upsert({
      date: today,
      mpesa: data.mpesa,
      cash: data.cash,
      total: data.mpesa + data.cash,
      starting_stock_litres: data.startingStockLitres,
      finishing_stock_litres: data.finishingStockLitres,
      outstanding_debt: data.outstandingDebt,
    }, { onConflict: "vendor_id,date" });
  if (error) throw error;
}

function RevenuePage() {
  const qc = useQueryClient();

  const { data: daily = _mock_dailyRevenue, isLoading: loadingDaily } = useQuery({
    queryKey: ["delivery", "dailyRevenue"],
    queryFn: fetchDailyRevenue,
  });
  const { data: kpis = _mock_kpis } = useQuery({
    queryKey: ["delivery", "kpis"],
    queryFn: fetchDeliveryKpis,
  });

  const [mpesa,         setMpesa]         = useState("");
  const [cash,          setCash]           = useState("");
  const [startLitres,   setStartLitres]   = useState("");
  const [finishLitres,  setFinishLitres]  = useState("");
  const [debt,          setDebt]           = useState("");

  // Pre-fill form when live data loads
  useState(() => {
    if (!loadingDaily) {
      setMpesa(String(daily.mpesa   || ""));
      setCash(String(daily.cash     || ""));
      setStartLitres(String(daily.startingStockLitres  || ""));
      setFinishLitres(String(daily.finishingStockLitres || ""));
      setDebt(String(daily.outstandingDebt             || ""));
    }
  });

  const save = useMutation({
    mutationFn: () =>
      saveRevenue({
        mpesa: parseFloat(mpesa) || 0,
        cash:  parseFloat(cash)  || 0,
        startingStockLitres:  parseInt(startLitres)  || 0,
        finishingStockLitres: parseInt(finishLitres) || 0,
        outstandingDebt:      parseFloat(debt)       || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery", "dailyRevenue"] });
      qc.invalidateQueries({ queryKey: ["delivery", "kpis"] });
      toast.success("Daily revenue saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = new Date().toISOString().slice(0, 10);
  const totalCalc = (parseFloat(mpesa) || 0) + (parseFloat(cash) || 0);

  return (
    <div>
      <PageHeader
        title="Daily revenue entry"
        subtitle={`Today · ${today}`}
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <Save className="h-4 w-4 mr-1" />}
            Save entry
          </Button>
        }
      />

      {/* Live KPI strip from dispatch data */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Tile icon={TrendingUp} label="Dispatches today"   value={String(kpis.activeDispatches)} />
        <Tile icon={Droplet}    label="Litres delivered"   value={`${kpis.litresDelivered.toLocaleString()} L`} />
        <Tile icon={Smartphone} label="Active dispatches"  value={String(kpis.activeDispatches)} />
        <Tile icon={Banknote}   label="Pending debt"       value={fmt(kpis.pendingDebt)} highlight />
      </div>

      {/* Manual entry form */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>End-of-day revenue</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>M-Pesa received (KES)</Label>
              <Input type="number" min={0} value={mpesa} onChange={(e) => setMpesa(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Cash received (KES)</Label>
              <Input type="number" min={0} value={cash} onChange={(e) => setCash(e.target.value)} placeholder="0" />
            </div>
            <div className="rounded-lg bg-secondary/50 p-4 flex items-center justify-between">
              <span className="text-sm font-medium">Combined total</span>
              <span className="font-display text-2xl tabular-nums">{fmt(totalCalc)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stock movement</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Starting stock (litres)</Label>
              <Input type="number" min={0} value={startLitres} onChange={(e) => setStartLitres(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Finishing stock (litres)</Label>
              <Input type="number" min={0} value={finishLitres} onChange={(e) => setFinishLitres(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Outstanding debt (KES)</Label>
              <Input type="number" min={0} value={debt} onChange={(e) => setDebt(e.target.value)} placeholder="0" />
            </div>
            {startLitres && finishLitres && (
              <div className="rounded-lg bg-secondary/50 p-4 flex items-center justify-between">
                <span className="text-sm font-medium">Litres delivered</span>
                <span className="font-display text-2xl tabular-nums">
                  {Math.max(0, (parseInt(startLitres) || 0) - (parseInt(finishLitres) || 0)).toLocaleString()} L
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous entry summary */}
      {!loadingDaily && daily.total > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Last saved entry — {daily.date}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <Pair label="M-Pesa"          value={fmt(daily.mpesa)} />
            <Pair label="Cash"            value={fmt(daily.cash)} />
            <Pair label="Total"           value={fmt(daily.total)} />
            <Pair label="Stock out"       value={`${daily.startingStockLitres} L → ${daily.finishingStockLitres} L`} />
            <Pair label="Outstanding debt" value={fmt(daily.outstandingDebt)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value, highlight }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-destructive/40" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${highlight ? "text-destructive" : "text-muted-foreground"}`} />
        </div>
        <div className="font-display text-2xl mt-2 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-medium tabular-nums">{value}</div>
    </div>
  );
}
