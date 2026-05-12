import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Phone } from "lucide-react";
import { customers } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Water Retail" }] }),
  component: CustomersPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function CustomersPage() {
  const [q, setQ] = useState("");
  const filtered = customers.filter((c) =>
    !q || `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase())
  );
  const totalSpent = customers.reduce((a, c) => a + c.spent, 0);
  const owing = customers.filter((c) => c.balance > 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Estates, businesses and recurring walk-ins served by this branch."
        actions={<Button><Plus className="h-4 w-4 mr-1" /> Add customer</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total customers" value={String(customers.length)} />
        <Stat label="Lifetime revenue" value={fmt(totalSpent)} />
        <Stat label="Outstanding balance" value={fmt(owing.reduce((a, c) => a + c.balance, 0))} highlight={owing.length > 0} />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Input placeholder="Search by name or phone" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Visits</TableHead>
              <TableHead className="text-right">Lifetime spend</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Last visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground"><span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span></TableCell>
                <TableCell><Badge variant="secondary">{c.type}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{c.visits}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.spent)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.balance > 0 ? <span className="text-destructive font-medium">{fmt(c.balance)}</span> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.lastVisit}</TableCell>
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
