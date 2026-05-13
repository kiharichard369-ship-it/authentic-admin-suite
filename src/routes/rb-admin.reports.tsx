import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { hourlyRevenue, dishMix, rbKpis } from "@/lib/rb-mock";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/rb-admin/reports")({
  head: () => ({ meta: [{ title: "Reports — R&B" }] }),
  component: ReportsPage,
});

const COLORS = ["var(--color-chart-1)","var(--color-chart-2)","var(--color-chart-3)","var(--color-chart-4)","var(--color-chart-5)"];
const fmt = (n: number) => "KES " + n.toLocaleString();

function ReportsPage() {
  const reports = [
    { name: "Daily covers & revenue", desc: "Covers, revenue and avg ticket per service" },
    { name: "Dish mix", desc: "Best & worst sellers, by category" },
    { name: "Kitchen performance", desc: "Avg prep time, late tickets, idle minutes" },
    { name: "Butchery yield", desc: "Sold vs waste, per cut, per day" },
    { name: "Staff tips & service", desc: "Tip pool, table assignments, covers per waiter" },
  ];
  return (
    <div>
      <PageHeader title="Reports" subtitle={`Today: ${fmt(rbKpis.todayRevenue)} · ${rbKpis.covers} covers · avg ${fmt(rbKpis.avgTicket)}`} />
      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle>Revenue split (today)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="restaurant" fill="var(--color-chart-1)" />
                <Bar dataKey="butchery" fill="var(--color-chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dish mix</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={dishMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {dishMix.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
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
