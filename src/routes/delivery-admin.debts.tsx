import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Plus, AlertCircle } from "lucide-react";
import { debts } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/debts")({
  head: () => ({ meta: [{ title: "Debt module — Water Delivery" }] }),
  component: DebtsPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function DebtsPage() {
  const outstanding = debts.filter((d) => d.status !== "paid").reduce((a, b) => a + b.amount, 0);
  const unpaidCount = debts.filter((d) => d.status === "unpaid").length;
  return (
    <div>
      <PageHeader
        title="Debt module"
        subtitle="Unpaid deliveries — recorded with customer, driver, dispatch and amount."
        actions={<Button><Plus className="h-4 w-4 mr-1" /> Record debt</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total outstanding" value={fmt(outstanding)} highlight />
        <Stat label="Unpaid records" value={String(unpaidCount)} />
        <Stat label="All debt entries" value={String(debts.length)} />
      </div>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Debt</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Dispatch</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.id}</TableCell>
                  <TableCell className="font-medium">{d.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{d.phone}</TableCell>
                  <TableCell className="font-mono text-xs">{d.dispatch}</TableCell>
                  <TableCell>{d.driver}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(d.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{d.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "paid" ? "default" : d.status === "partial" ? "secondary" : "destructive"}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {d.status !== "paid" && <Button size="sm" variant="outline">Mark paid</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-destructive/40" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          {highlight && <AlertCircle className="h-4 w-4 text-destructive" />}
        </div>
        <div className="font-display text-2xl mt-2 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
