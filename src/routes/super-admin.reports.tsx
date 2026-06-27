import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileText, Sparkles, Loader2 } from "lucide-react";
import { supabase, hasSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/super-admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Super Admin" }] }),
  component: Reports,
});

const reportTypes = [
  { v: "daily",          l: "Daily sales summary (all vendors)" },
  { v: "vendor-revenue", l: "Revenue & MRR by vendor" },
  { v: "water-bottle",   l: "Water Retail: sales by bottle size and shop" },
  { v: "water-delivery", l: "Delivery log (driver, litres, stops)" },
  { v: "driver-exp",     l: "Driver expense report by shop and category" },
  { v: "user-activity",  l: "User activity log (logins, role changes)" },
  { v: "refunds",        l: "Refund report (all vendors)" },
];

type ReportRow = { date: string; business: string; txns: number; revenue: number };
type ReportSummary = { totalRevenue: number; totalTxns: number; avgTicket: number; rows: ReportRow[] };

async function generateReport(type: string, range: string, scope: string): Promise<ReportSummary> {
  if (!hasSupabase || !supabase) {
    // Mock preview data
    return {
      totalRevenue: 1284500,
      totalTxns: 2841,
      avgTicket: 452,
      rows: [
        { date: new Date().toISOString().slice(0, 10), business: "Water Retail",   txns: 132, revenue: 48200 },
        { date: new Date().toISOString().slice(0, 10), business: "Water Delivery", txns: 24,  revenue: 18300 },
      ],
    };
  }

  const now  = new Date();
  const from = (() => {
    const d = new Date(now);
    if (range === "today")     d.setHours(0, 0, 0, 0);
    else if (range === "week") d.setDate(d.getDate() - 7);
    else if (range === "month" || range === "30d") d.setDate(d.getDate() - 30);
    else d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();

  const { data: txData } = await supabase
    .from("water_transactions")
    .select("created_at,total")
    .gte("created_at", from);

  const { data: delivData } = await supabase
    .from("delivery_daily_revenue_log")
    .select("date,total,mpesa,cash")
    .gte("date", from.slice(0, 10));

  // Group water txns by date
  const waterByDay: Record<string, { txns: number; revenue: number }> = {};
  for (const r of txData ?? []) {
    const key = (r.created_at as string).slice(0, 10);
    if (!waterByDay[key]) waterByDay[key] = { txns: 0, revenue: 0 };
    waterByDay[key].txns    += 1;
    waterByDay[key].revenue += Number(r.total);
  }

  const rows: ReportRow[] = [];
  for (const [date, v] of Object.entries(waterByDay)) {
    rows.push({ date, business: "Water Retail", txns: v.txns, revenue: Math.round(v.revenue) });
  }
  for (const r of delivData ?? []) {
    rows.push({ date: r.date, business: "Water Delivery", txns: 0, revenue: Number(r.total) });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalTxns    = rows.reduce((s, r) => s + r.txns, 0);
  const avgTicket    = totalTxns ? Math.round(totalRevenue / totalTxns) : 0;

  return { totalRevenue, totalTxns, avgTicket, rows };
}

function Reports() {
  const [reportType, setReportType]     = useState("daily");
  const [range, setRange]               = useState("month");
  const [scope, setScope]               = useState("all");
  const [loading, setLoading]           = useState(false);
  const [summary, setSummary]           = useState<ReportSummary | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateReport(reportType, range, scope);
      setSummary(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports & exports"
        subtitle="Generate on-demand reports across the platform — preview then download."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Configure report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Report type</Label>
              <Select value={reportType} onValueChange={setReportType}>
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
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All shops</SelectItem>
                  <SelectItem value="water">Water Retail only</SelectItem>
                  <SelectItem value="delivery">Delivery only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Generate report
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
                  <Stat label="Total revenue" value={`KES ${summary.totalRevenue.toLocaleString()}`} />
                  <Stat label="Transactions"  value={summary.totalTxns.toLocaleString()} />
                  <Stat label="Avg ticket"    value={`KES ${summary.avgTicket.toLocaleString()}`} />
                </div>
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b">
                    <tr>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left">Business</th>
                      <th className="text-right">Txns</th>
                      <th className="text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summary.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 tabular-nums">{r.date}</td>
                        <td>{r.business}</td>
                        <td className="text-right tabular-nums">{r.txns || "—"}</td>
                        <td className="text-right tabular-nums">KES {r.revenue.toLocaleString()}</td>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-xl mt-1">{value}</div>
    </div>
  );
}
