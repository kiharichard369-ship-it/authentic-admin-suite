import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { businesses } from "@/lib/mock-data";

export const Route = createFileRoute("/super-admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Super Admin" }] }),
  component: Analytics,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const revenueSeries = days.map((d, i) => ({
  day: d,
  Water: 30000 + i * 2400 + (i % 2) * 4000,
  Delivery: 12000 + i * 900,
}));

const topProducts = [
  { name: "5L Bottled Water", sold: 412, revenue: 82400 },
  { name: "20L Refill", sold: 188, revenue: 28200 },
  { name: "1L Bottled Water", sold: 380, revenue: 22800 },
  { name: "10L Refill", sold: 156, revenue: 12480 },
  { name: "PET Bottle 1.5L", sold: 142, revenue: 4260 },
  { name: "Caps", sold: 88, revenue: 1760 },
];

function Analytics() {
  return (
    <div>
      <PageHeader
        title="Cross-vendor analytics"
        subtitle="Compare Water Retail and Delivery performance across all vendors on the platform."
        actions={
          <>
            <Select defaultValue="30d">
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline"><FileText className="h-4 w-4 mr-1" /> PDF</Button>
            <Button><Download className="h-4 w-4 mr-1" /> CSV</Button>
          </>
        }
      />

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All arms</TabsTrigger>
          <TabsTrigger value="water">Water Retail</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Revenue by business arm</CardTitle></CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                    <Legend />
                    <Line type="monotone" dataKey="Water" stroke="var(--color-chart-1)" strokeWidth={2} />
                    <Line type="monotone" dataKey="Delivery" stroke="var(--color-chart-2)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Revenue split</CardTitle></CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={businesses} dataKey="today" nameKey="name" innerRadius={60} outerRadius={100}>
                      {businesses.map((b, i) => <Cell key={i} fill={`var(--color-chart-${i + 1})`} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Transaction volume</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                    <Bar dataKey="Water" stackId="a" fill="var(--color-chart-1)" />
                    <Bar dataKey="Delivery" stackId="a" fill="var(--color-chart-2)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Top products & dishes</CardTitle></CardHeader>
              <CardContent className="divide-y">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex justify-between items-center py-2.5 text-sm">
                    <span className="flex items-center gap-3">
                      <span className="text-muted-foreground tabular-nums w-5">{i + 1}.</span>
                      <span className="font-medium">{p.name}</span>
                    </span>
                    <span className="text-muted-foreground tabular-nums">KES {p.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {["water", "rb", "delivery"].map((t) => (
          <TabsContent key={t} value={t}>
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Per-business analytics view (litres sold, covers, kg sold by meat type, kitchen turnaround) — same charts scoped to this arm.
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
