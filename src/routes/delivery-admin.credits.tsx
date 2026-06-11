import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Coins, Plus } from "lucide-react";
import { credits as _mock_credits } from "@/lib/delivery-mock";
import { fetchCredits } from "@/lib/delivery-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/delivery-admin/credits")({
  head: () => ({ meta: [{ title: "Credit / carry-forward — Water Delivery" }] }),
  component: CreditsPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function CreditsPage() {
  const credits = useLive(["delivery","credits"] as const, fetchCredits, _mock_credits);
  const total = credits.reduce((a, b) => a + b.balance, 0);
  return (
    <div>
      <PageHeader
        title="Credit / carry-forward"
        subtitle="Overpayments held as credit — applicable to both Water Retail and Water Delivery."
        actions={<Button><Plus className="h-4 w-4 mr-1" /> Record credit</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total credit on file" value={fmt(total)} highlight />
        <Stat label="Customers with credit" value={String(credits.length)} />
        <Stat label="Sources" value="Retail + Delivery" />
      </div>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credit</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Last update</TableHead>
                <TableHead>Note</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell className="font-medium">{c.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                  <TableCell><Badge variant="outline">{c.source}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fmt(c.balance)}</TableCell>
                  <TableCell className="text-muted-foreground">{c.lastUpdated}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.note}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">Apply</Button>
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
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          {highlight && <Coins className="h-4 w-4 text-accent" />}
        </div>
        <div className="font-display text-2xl mt-2 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
