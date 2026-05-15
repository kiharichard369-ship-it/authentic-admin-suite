import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { UserPlus } from "lucide-react";
import { cashiers } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/cashiers")({
  head: () => ({ meta: [{ title: "Cashiers — R&B" }] }),
  component: CashiersPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function CashiersPage() {
  const active = cashiers.filter((c) => c.active).length;
  return (
    <div>
      <PageHeader
        title="Cashiers"
        subtitle={`${active} active · max 6 cashiers per the operating model`}
        actions={<Button disabled={active >= 6}><UserPlus className="h-4 w-4 mr-1" /> Invite cashier</Button>}
      />

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead className="text-right">Orders today</TableHead>
                <TableHead className="text-right">Sales today</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashiers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                  <TableCell>{c.shift}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(c.sales)}</TableCell>
                  <TableCell><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">Manage</Button>
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
