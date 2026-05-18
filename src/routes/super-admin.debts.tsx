import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { AlertCircle, Coins, Truck, Droplets } from "lucide-react";
import { debts } from "@/lib/delivery-mock";
import { customers as waterCustomers } from "@/lib/water-mock";

export const Route = createFileRoute("/super-admin/debts")({
  head: () => ({ meta: [{ title: "Debts & Credits — Super Admin" }] }),
  component: DebtsOverview,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function DebtsOverview() {
  const deliveryOutstanding = debts
    .filter((d) => d.status !== "paid")
    .reduce((a, b) => a + b.amount, 0);
  const retailOutstanding = waterCustomers.reduce((a, b) => a + (b.balance || 0), 0);
  const totalOutstanding = deliveryOutstanding + retailOutstanding;

  return (
    <div>
      <PageHeader
        title="Debts & Credits — Platform overview"
        subtitle="Outstanding balances across all business arms. Drill into an arm for collection actions."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Stat label="Total outstanding" value={fmt(totalOutstanding)} icon={AlertCircle} highlight />
        <Stat label="Delivery debts" value={fmt(deliveryOutstanding)} icon={Truck}
          hint={`${debts.filter(d => d.status !== "paid").length} open records`} />
        <Stat label="Retail customer balances" value={fmt(retailOutstanding)} icon={Droplets}
          hint={`${waterCustomers.filter(c => (c.balance || 0) > 0).length} accounts`} />
      </div>

      <Tabs defaultValue="delivery">
        <TabsList className="mb-6">
          <TabsTrigger value="delivery">Water Delivery</TabsTrigger>
          <TabsTrigger value="retail">Water Retail</TabsTrigger>
          <TabsTrigger value="rb">R&amp;B</TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unpaid deliveries tracked per dispatch & driver.</p>
            <Link to="/delivery-admin/debts"><Button variant="outline" size="sm">Open delivery debts →</Button></Link>
          </div>
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Debt</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell className="font-medium">{d.customer}</TableCell>
                      <TableCell>{d.driver}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(d.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">{d.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === "paid" ? "default" : d.status === "partial" ? "secondary" : "destructive"}>
                          {d.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retail" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Retail customer balances (carry-forwards & store credit).</p>
            <Link to="/water-admin/customers"><Button variant="outline" size="sm">Open retail customers →</Button></Link>
          </div>
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Last visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waterCustomers
                    .filter((c) => (c.balance || 0) > 0)
                    .map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(c.balance)}</TableCell>
                        <TableCell className="text-muted-foreground">{c.lastVisit}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rb">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Coins className="h-4 w-4" /> R&amp;B is cash & M-Pesa only</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The take-away counter does not extend credit. No outstanding debts are tracked for this arm.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({
  label, value, icon: Icon, hint, highlight,
}: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; hint?: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-destructive/40" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${highlight ? "text-destructive" : "text-muted-foreground"}`} />
        </div>
        <div className="font-display text-2xl mt-2 tabular-nums">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}
