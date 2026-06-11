import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileText, Sparkles } from "lucide-react";

export const Route = createFileRoute("/super-admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Super Admin" }] }),
  component: Reports,
});

const reportTypes = [
  { v: "daily", l: "Daily sales summary (all vendors)" },
  { v: "vendor-revenue", l: "Revenue & MRR by vendor" },
  { v: "water-bottle", l: "Water Retail: sales by bottle size and shop" },
  { v: "water-delivery", l: "Delivery log (driver, litres, stops)" },
  { v: "driver-exp", l: "Driver expense report by shop and category" },
  { v: "user-activity", l: "User activity log (logins, role changes)" },
  { v: "refunds", l: "Refund report (all vendors)" },
];

function Reports() {
  const [generated, setGenerated] = useState(false);

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
              <Select defaultValue="daily">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportTypes.map((r) => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date range</Label>
              <Select defaultValue="month">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select defaultValue="all">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All shops</SelectItem>
                  <SelectItem value="s1">Kileleshwa</SelectItem>
                  <SelectItem value="s2">Westlands</SelectItem>
                  <SelectItem value="s3">Karen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setGenerated(true)}>
              <Sparkles className="h-4 w-4 mr-1" /> Generate report
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview</CardTitle>
            {generated && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1" /> PDF</Button>
                <Button size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!generated ? (
              <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                Configure and generate a report to preview it here.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Stat label="Total revenue" value="KES 1,284,500" />
                  <Stat label="Transactions" value="2,841" />
                  <Stat label="Avg ticket" value="KES 452" />
                </div>
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b">
                    <tr><th className="text-left py-2">Date</th><th className="text-left">Business</th><th className="text-right">Txns</th><th className="text-right">Revenue</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["2026-05-11", "Water Retail", 132, 48200],
                      ["2026-05-11", "Water Delivery", 24, 18300],
                      ["2026-05-10", "Water Retail", 128, 46100],
                      ["2026-05-10", "Water Delivery", 27, 20100],
                    ].map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 tabular-nums">{r[0]}</td>
                        <td>{r[1]}</td>
                        <td className="text-right tabular-nums">{r[2]}</td>
                        <td className="text-right tabular-nums">KES {(r[3] as number).toLocaleString()}</td>
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
