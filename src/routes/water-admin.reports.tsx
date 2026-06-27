import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Download, FileText, Loader2 } from "lucide-react";
import { supabase, hasSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/water-admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Water Retail" }] }),
  component: WaterReports,
});

const reportTypes = [
  { v: "daily-sales",  l: "Daily sales summary (by cashier & method)" },
  { v: "product-mix",  l: "Product mix report (litres by SKU)" },
  { v: "cashier-perf", l: "Cashier performance report" },
  { v: "stock",        l: "Stock movement report" },
  { v: "customer",     l: "Top customers by spend" },
  { v: "refunds",      l: "Refunds log" },
  { v: "expenses",     l: "Branch expenses summary" },
];

type Row   = { label: string; value1: string; value2: string };
type Summary = { totalRevenue: number; totalTxns: number; rows: Row[] };

async function generateReport(type: string, range: string): Promise<Summary> {
  if (!hasSupabase || !supabase) {
    return {
      totalRevenue: 142800,
      totalTxns: 312,
      rows: [
        { label: "Cash",  value1: "142 txns", value2: "KES 49,700" },
        { label: "M-Pesa", value1: "170 txns", value2: "KES 93,100" },
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

  if (type === "daily-sales" || type === "cashier-perf") {
    const { data, error } = await supabase
      .from("water_transactions")
      .select("total,method,cashier_name")
      .gte("created_at", from);
    if (error) throw error;

    const byMethod: Record<string, { txns: number; total: number }> = {};
    const byCashier: Record<string, { txns: number; total: number }> = {};
    for (const r of data ?? []) {
      const m = r.method ?? "unknown";
      if (!byMethod[m])  byMethod[m]  = { txns: 0, total: 0 };
      byMethod[m].txns++;
      byMethod[m].total += Number(r.total);
      const c = r.cashier_name ?? "Unknown";
      if (!byCashier[c]) byCashier[c] = { txns: 0, total: 0 };
      byCashier[c].txns++;
      byCashier[c].total += Number(r.total);
    }

    const source = type === "cashier-perf" ? byCashier : byMethod;
    const rows: Row[] = Object.entries(source).map(([label, v]) => ({
      label,
      value1: `${v.txns} txns`,
      value2: `KES ${Math.round(v.total).toLocaleString()}`,
    }));

    const totalRevenue = Object.values(source).reduce((a, v) => a + v.total, 0);
    const totalTxns    = Object.values(source).reduce((a, v) => a + v.txns, 0);
    return { totalRevenue: Math.round(totalRevenue), totalTxns, rows };
  }

  if (type === "product-mix") {
    const { data, error } = await supabase
      .from("water_transaction_items")
      .select("product_name,qty,line_total");
    if (error) throw error;

    const byProduct: Record<string, { qty: number; total: number }> = {};
    for (const r of data ?? []) {
      if (!byProduct[r.product_name]) byProduct[r.product_name] = { qty: 0, total: 0 };
      byProduct[r.product_name].qty   += r.qty;
      byProduct[r.product_name].total += Number(r.line_total);
    }

    const rows: Row[] = Object.entries(byProduct)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([label, v]) => ({
        label,
        value1: `${v.qty} units`,
        value2: `KES ${Math.round(v.total).toLocaleString()}`,
      }));

    const totalRevenue = Object.values(byProduct).reduce((a, v) => a + v.total, 0);
    const totalTxns    = Object.values(byProduct).reduce((a, v) => a + v.qty, 0);
    return { totalRevenue: Math.round(totalRevenue), totalTxns, rows };
  }

  if (type === "refunds") {
    const { data, error } = await supabase
      .from("water_refunds")
      .select("customer,cashier,amount,status,reason")
      .gte("created_at", from);
    if (error) throw error;

    const rows: Row[] = (data ?? []).map((r) => ({
      label:  r.customer ?? "Walk-in",
      value1: r.reason   ?? "—",
      value2: `KES ${Number(r.amount).toLocaleString()} · ${r.status}`,
    }));

    const totalRevenue = (data ?? []).filter(r => r.status === "approved").reduce((a, r) => a + Number(r.amount), 0);
    return { totalRevenue: Math.round(totalRevenue), totalTxns: rows.length, rows };
  }

  if (type === "expenses") {
    const { data, error } = await supabase
      .from("water_branch_expenses")
      .select("category,amount,staff,status")
      .gte("created_at", from);
    if (error) throw error;

    const byCat: Record<string, number> = {};
    for (const r of data ?? []) {
      if (!byCat[r.category]) byCat[r.category] = 0;
      byCat[r.category] += Number(r.amount);
    }

    const rows: Row[] = Object.entries(byCat).map(([label, total]) => ({
      label,
      value1: `${(data ?? []).filter(r => r.category === label).length} entries`,
      value2: `KES ${Math.round(total).toLocaleString()}`,
    }));
    const totalRevenue = Object.values(byCat).reduce((a, v) => a + v, 0);
    return { totalRevenue: Math.round(totalRevenue), totalTxns: (data ?? []).length, rows };
  }

  // fallback
  return { totalRevenue: 0, totalTxns: 0, rows: [] };
}

function WaterReports() {
  const [type,    setType]    = useState("daily-sales");
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
        title="Reports — Water Retail"
        subtitle="On-demand reports for sales, stock, cashiers, refunds and expenses."
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
                <div className="grid grid-cols-2 gap-4">
                  <ReportStat label="Total revenue"    value={`KES ${summary.totalRevenue.toLocaleString()}`} />
                  <ReportStat label="Total txns / qty" value={String(summary.totalTxns)} />
                </div>
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b">
                    <tr>
                      <th className="text-left py-2">Category</th>
                      <th className="text-right">Volume</th>
                      <th className="text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summary.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 font-medium">{r.label}</td>
                        <td className="text-right tabular-nums text-muted-foreground">{r.value1}</td>
                        <td className="text-right tabular-nums">{r.value2}</td>
                      </tr>
                    ))}
                    {summary.rows.length === 0 && (
                      <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No data for this period.</td></tr>
                    )}
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
