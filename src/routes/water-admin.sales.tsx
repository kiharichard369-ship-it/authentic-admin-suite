import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Plus } from "lucide-react";
import { transactions } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/sales")({
  head: () => ({ meta: [{ title: "Sales — Water Retail" }] }),
  component: SalesPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function SalesPage() {
  const [method, setMethod] = useState("all");
  const [q, setQ] = useState("");

  const filtered = transactions.filter((t) =>
    (method === "all" || t.method.toLowerCase() === method) &&
    (q === "" || t.id.toLowerCase().includes(q.toLowerCase()) || t.cashier.toLowerCase().includes(q.toLowerCase()))
  );

  const total = filtered.filter((t) => t.status === "paid").reduce((a, b) => a + b.amount, 0);

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="All transactions recorded today at this branch."
        actions={
          <>
            <Button variant="outline"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            <Button><Plus className="h-4 w-4 mr-1" /> New sale</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Net revenue" value={fmt(total)} />
        <Stat label="Transactions" value={String(filtered.length)} />
        <Stat label="Average sale" value={fmt(filtered.length ? Math.round(total / filtered.length) : 0)} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input placeholder="Search by ID or cashier" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="m-pesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="tabular-nums text-muted-foreground">{t.time}</TableCell>
                  <TableCell className="font-medium">{t.id}</TableCell>
                  <TableCell>{t.cashier}</TableCell>
                  <TableCell className="max-w-xs truncate">{t.items}</TableCell>
                  <TableCell><Badge variant="secondary">{t.method}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={t.status === "refunded" ? "destructive" : "outline"}>{t.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fmt(t.amount)}</TableCell>
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
