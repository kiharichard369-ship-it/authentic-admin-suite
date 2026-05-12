import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { refunds } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/refunds")({
  head: () => ({ meta: [{ title: "Refunds — Water Retail" }] }),
  component: RefundsPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

const STATUS: Record<string, string> = {
  approved: "bg-success text-success-foreground",
  pending: "bg-accent text-accent-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

function RefundsPage() {
  const total = refunds.filter((r) => r.status === "approved").reduce((a, r) => a + r.amount, 0);
  const pending = refunds.filter((r) => r.status === "pending");

  return (
    <div>
      <PageHeader
        title="Refunds"
        subtitle="Review and approve cashier-initiated refunds for this branch."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Refunds this month" value={String(refunds.length)} />
        <Stat label="Approved value" value={fmt(total)} />
        <Stat label="Pending review" value={String(pending.length)} highlight={pending.length > 0} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Refund ID</TableHead>
              <TableHead>Original txn</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refunds.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.txn}</TableCell>
                <TableCell className="text-muted-foreground text-sm tabular-nums">{r.date}</TableCell>
                <TableCell>{r.customer}</TableCell>
                <TableCell className="text-muted-foreground">{r.cashier}</TableCell>
                <TableCell className="max-w-xs truncate text-sm">{r.reason}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{fmt(r.amount)}</TableCell>
                <TableCell><Badge className={STATUS[r.status]}>{r.status}</Badge></TableCell>
                <TableCell>
                  {r.status === "pending" ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">Approve</Button>
                      <Button size="sm" variant="ghost">Reject</Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-2xl mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
