import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, FileText } from "lucide-react";
import { hourlySales, waterKpis } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Water Retail" }] }),
  component: ReportsPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

const reports = [
  { id: "r1", name: "Daily sales summary", desc: "Sales, refunds and net per cashier." },
  { id: "r2", name: "Stock movement", desc: "Opening, sold, received, closing per SKU." },
  { id: "r3", name: "Cashier performance", desc: "Transactions and revenue by cashier." },
  { id: "r4", name: "Branch P&L", desc: "Revenue minus operational expenses." },
];

function ReportsPage() {
  const [range, setRange] = useState("today");
  const [active, setActive] = useState(reports[0].id);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and export branch performance reports."
        actions={
          <>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline"><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Available reports</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.id} onClick={() => setActive(r.id)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  active === r.id ? "border-primary bg-primary/5" : "hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <FileText className="h-4 w-4 text-primary" /> {r.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1 ml-6">{r.desc}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{reports.find((r) => r.id === active)?.name}</CardTitle>
            <Badge variant="outline">{range}</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Mini label="Revenue" value={fmt(waterKpis.todayRevenue)} />
              <Mini label="Transactions" value={String(waterKpis.txns)} />
              <Mini label="Litres" value={waterKpis.todayLitres + " L"} />
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="text-xs text-muted-foreground mt-4">
              Preview only — export to PDF or CSV for the full breakdown.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-xl mt-1">{value}</div>
    </div>
  );
}
