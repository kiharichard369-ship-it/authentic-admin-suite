import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { branchExpenses as _mock_branchExpenses } from "@/lib/water-mock";
import { fetchBranchExpenses } from "@/lib/water-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/water-admin/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Water Retail" }] }),
  component: ExpensesPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();
const tone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  logged: "outline",
  reviewed: "secondary",
  rejected: "destructive",
};

function ExpensesPage() {
  const branchExpenses = useLive(["water","branchExpenses"] as const, fetchBranchExpenses, _mock_branchExpenses);
  const total = branchExpenses.filter((e) => e.status !== "rejected").reduce((a, b) => a + b.amount, 0);

  return (
    <div>
      <PageHeader
        title="Branch Expenses"
        subtitle="Operational costs logged at this shop."
        actions={<Button><Plus className="h-4 w-4 mr-1" /> Log expense</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total this week" value={fmt(total)} />
        <Stat label="Entries" value={String(branchExpenses.length)} />
        <Stat label="Awaiting review" value={String(branchExpenses.filter((e) => e.status === "logged").length)} />
      </div>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchExpenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground">{e.date}</TableCell>
                  <TableCell>{e.staff}</TableCell>
                  <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate">{e.description}</TableCell>
                  <TableCell><Badge variant={tone[e.status]}>{e.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fmt(e.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </CardContent></Card>
  );
}
