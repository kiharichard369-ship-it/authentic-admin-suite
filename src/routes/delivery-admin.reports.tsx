import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Download, FileText, Loader2 } from "lucide-react";
import { supabase, hasSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/delivery-admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Water Delivery" }] }),
  component: DeliveryReports,
});

const reportTypes = [
  { v: "daily",   l: "Daily revenue summary (M-Pesa + Cash + Litres)" },
  { v: "driver",  l: "Driver performance (trips, rating, fuel)" },
  { v: "dispatch",l: "Dispatch log (product, customer, delivery time)" },
  { v: "debt",    l: "Debt collection report" },
  { v: "fuel",    l: "Fuel expense report by driver and vehicle" },
];

type Row = { date: string; driver: string; litres: number; total: number };
type Summary = { totalRevenue: number; totalLitres: number; totalDispatches: number; rows: Row[] };

async function generateReport(type: string, range: string): Promise<Summary> {
  if (!hasSupabase || !supabase) {
    return {
      totalRevenue: 284500, totalLitres: 18400, totalDispatches: 42,
      rows: [
        { date: new Date().toISOString().slice(0, 10), driver: "James Kamau",  litres: 5000, total: 12500 },
        { date: new Date().toISOString().slice(0, 10), driver: "Peter Mwangi",  litres: 3500, total: 8750 },
        { date: new Date().toISOString().slice(0, 10), driver: "Samuel Ochieng", litres: 5000, total: 12500 },
      ],
    };
  }

  const from = (() => {
    const d = new Date();
    if (range === "today")  d.setHours(0, 0, 0, 0);
    else if (range === "week")  d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 30);
    return d.toISOString();
  })();

  const { data: dispatches } = await supabase
    .from("delivery_dispatches_full")
    .select("dispatched_at,driver,litres")
    .gte("dispatched_at", from);

  const { data: revenue } = await supabase
    .from("delivery_daily_revenue_log")
    .select("date,total")
    .gte("date", from.slice(0, 10));

  const driverMap: Record<string, { litres: number; total: number; date: string }> = {};
  for (const d of dispatches ?? []) {
    if (!driverMap[d.driver]) driverMap[d.driver] = { litres: 0, total: 0, date: (d.dispatched_at as string).slice(0, 10) };
    driverMap[d.driver].litres += Number(d.litres);
  }
  const revTotal = (revenue ?? []).reduce((a, r) => a + Number(r.total), 0);
  const litresTotal = Object.values(driverMap).reduce((a, d) => a + d.litres, 0);

  const rows: Row[] = Object.entries(driverMap).map(([driver, v]) => ({
    date: v.date, driver, litres: v.litres, total: 0,
  }));

  return {
    totalRevenue: revTotal,
    totalLitres: litresTotal,
    totalDispatches: (dispatches ?? []).length,
    rows,
  };
}

function DeliveryReports() {
  const [type,    setType]    = useState("daily");
  const [range,   setRange]   = useState("month");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      setSummary(await generateReport(type, range));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports — Water Delivery"
        subtitle="Generate and export delivery performance and financial reports."
      />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Configure report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Report type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportTypes.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date range</Label>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={loading}>
              {loading
                ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                : <Sparkles className="h-4 w-4 mr-1" />}
              Generate
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview</CardTitle>
            {summary && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" /> PDF</Button>
                <Button size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!summary ? (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                Configure and generate a report to preview it here.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <ReportStat label="Total revenue"    value={`KES ${summary.totalRevenue.toLocaleString()}`} />
                  <ReportStat label="Litres delivered" value={`${summary.totalLitres.toLocaleString()} L`} />
                  <ReportStat label="Dispatches"       value={String(summary.totalDispatches)} />
                </div>
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b">
                    <tr>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left">Driver</th>
                      <th className="text-right">Litres</th>
                      <th className="text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summary.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 tabular-nums">{r.date}</td>
                        <td>{r.driver}</td>
                        <td className="text-right tabular-nums">{r.litres.toLocaleString()} L</td>
                        <td className="text-right tabular-nums">
                          {r.total > 0 ? `KES ${r.total.toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-xl mt-1">{value}</div>
    </div>
  );
}
