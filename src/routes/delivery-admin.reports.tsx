import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { litresByDay as _mock_litresByDay, deliveryKpis as _mock_deliveryKpis } from "@/lib/delivery-mock";
import { fetchLitresByDay, fetchDeliveryKpis } from "@/lib/delivery-data";

import { FileText, Download } from "lucide-react";

import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/delivery-admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Water Delivery" }] }),
  component: ReportsPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function ReportsPage() {
  const litresByDay = useLive(["delivery","litresByDay"] as const, fetchLitresByDay, _mock_litresByDay);
  const deliveryKpis = useLive(["delivery","deliveryKpis"] as const, fetchDeliveryKpis, _mock_deliveryKpis);
  const reports = [
    { name: "Litres delivered", desc: "Daily / weekly volume per route" },
    { name: "Route P&L", desc: "Revenue minus fuel & driver cost per route" },
    { name: "Driver payouts", desc: "Trips, bonuses and commissions" },
    { name: "Fuel efficiency", desc: "Litres per km, station price tracking" },
    { name: "Customer drop history", desc: "Recurring vs one-off, lifetime litres" },
  ];
  return (
    <div>
      <PageHeader title="Reports" subtitle={`Today: ${deliveryKpis.litresDelivered.toLocaleString()} L · ${fmt(deliveryKpis.todayRevenue)}`} />
      <Card className="mb-8">
        <CardHeader><CardTitle>Litres delivered (7-day)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={litresByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="litres" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
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
