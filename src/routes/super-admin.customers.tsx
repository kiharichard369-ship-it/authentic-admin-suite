import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Users as UsersIcon, Wallet, ArrowRight } from "lucide-react";
import { listCustomers } from "@/lib/water-data";
import { hasSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/super-admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Super Admin" }] }),
  component: SuperCustomers,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function SuperCustomers() {
  const [q, setQ] = useState("");
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["water_customers"],
    queryFn: listCustomers,
  });

  const filtered = customers
    .filter((c) => !q || `${c.name} ${c.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.spent - a.spent);

  const totalSpent = customers.reduce((a, c) => a + c.spent, 0);
  const totalCredit = customers.reduce((a, c) => a + c.balance, 0);

  return (
    <div>
      <PageHeader
        title="Customers — platform view"
        subtitle="Read-only roll-up across business arms. Edit balances from the branch workspace."
        actions={
          <Link to="/water-admin/customers">
            <Button variant="outline">Open branch customers <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </Link>
        }
      />

      {!hasSupabase && (
        <div className="mb-4 rounded-md border border-dashed bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          Demo mode — using in-memory data. Wire <code className="font-mono">.env</code> for live data.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat icon={UsersIcon} label="Total customers" value={String(customers.length)} />
        <Stat icon={Wallet} label="Lifetime revenue (Water Retail)" value={fmt(totalSpent)} />
        <Stat icon={Wallet} label="Outstanding credit" value={fmt(totalCredit)} highlight={totalCredit > 0} />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Input
            placeholder="Search by name or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Visits</TableHead>
              <TableHead className="text-right">Lifetime spend</TableHead>
              <TableHead className="text-right">Credit balance</TableHead>
              <TableHead>Last visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            )}
            {!isLoading && filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span> : "—"}
                </TableCell>
                <TableCell><Badge variant="secondary">{c.type}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{c.visits}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.spent)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.balance > 0 ? <span className="text-destructive font-medium">{fmt(c.balance)}</span> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.lastVisit ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, highlight,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${highlight ? "text-accent" : "text-muted-foreground"}`} />
        </div>
        <div className="font-display text-2xl mt-2 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
