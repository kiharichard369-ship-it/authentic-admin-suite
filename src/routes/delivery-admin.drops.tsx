import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { drops } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/drops")({
  head: () => ({ meta: [{ title: "Drop points — Water Delivery" }] }),
  component: DropsPage,
});

const variant: Record<string, "default"|"secondary"|"outline"|"destructive"> = { delivered: "default", in_progress: "secondary", pending: "outline" };

function DropsPage() {
  return (
    <div>
      <PageHeader title="Drop points" subtitle={`${drops.length} stops scheduled today`} actions={<Button>+ New drop</Button>} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Drop</TableHead><TableHead>Customer</TableHead><TableHead>Address</TableHead><TableHead>Litres</TableHead><TableHead>Route</TableHead><TableHead>Recurring</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {drops.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.id}</TableCell>
                  <TableCell>{d.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{d.address}</TableCell>
                  <TableCell className="tabular-nums">{d.litres} L</TableCell>
                  <TableCell>{d.route}</TableCell>
                  <TableCell>{d.recurring ? <Badge variant="secondary">Recurring</Badge> : <span className="text-muted-foreground text-xs">One-off</span>}</TableCell>
                  <TableCell><Badge variant={variant[d.status]} className="capitalize">{d.status.replace("_"," ")}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
