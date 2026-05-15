import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { hourlyRevenue, rbKpis, cashiers } from "@/lib/rb-mock";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/rb-admin/reports")({
  head: () => ({ meta: [{ title: "Reports — R&B" }] }),
  component: ReportsPage,
});

const COLORS = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)"];
const fmt = (n: number) => "KES " + n.toLocaleString();

function ReportsPage() {
  const splitData = [
    { name: "RAW", value: rbKpis.rawSold },
    { name: "COOKED", value: rbKpis.cookedSold },
  ];
  const reports = [
    { name: "Daily revenue & orders", desc: "Total revenue, M-Pesa vs Cash, order count" },
    { name: "RAW vs COOKED mix", desc: "Sales split by stock category" },
    { name: "Sales by cashier", desc: "Who sold most — orders and value" },
    { name: "Stock movement", desc: "Opening, sales, closing per item" },
    { name: "Discounts applied", desc: "Discount type, cashier, value" },
  ];
  return (
    <div>
      <PageHeader title="Reports" subtitle={`Today: ${fmt(rbKpis.todayRevenue)} · ${rbKpis.ordersToday} orders · avg ${fmt(rbKpis.avgTicket)}`} />
      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle>Hourly revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="raw" fill="var(--color-chart-2)" />
                <Bar dataKey="cooked" fill="var(--color-chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>RAW vs COOKED</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={splitData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {splitData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>Sales by cashier</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {cashiers.filter(c => c.active).map(c => (
            <div key={c.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.shift} shift · {c.orders} orders</div>
              </div>
              <div className="tabular-nums font-medium">{fmt(c.sales)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {reports.map(r => (
          <Card key={r.name}>
            <CardContent className="p-5">
              <FileText className="h-6 w-6 text-primary mb-3" />
              <div className="font-medium">{r.name}</div>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{r.desc}</p>
              <Button variant="outline" size="sm" className="w-full"><Download className="h-3 w-3 mr-1" /> Download</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
