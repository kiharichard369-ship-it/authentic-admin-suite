import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/routes")({
  head: () => ({ meta: [{ title: "Routes — Water Delivery" }] }),
  component: RoutesPage,
});

const variant: Record<string, "default"|"secondary"|"outline"> = { in_transit: "default", loading: "secondary", completed: "outline" };

function RoutesPage() {
  return (
    <div>
      <PageHeader title="Active routes" subtitle="Live tracking of all dispatched lorries" actions={<Button>+ Dispatch route</Button>} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Route</TableHead><TableHead>Driver</TableHead><TableHead>Vehicle</TableHead><TableHead>Status</TableHead><TableHead>Progress</TableHead><TableHead>Litres</TableHead><TableHead>ETA</TableHead></TableRow></TableHeader>
            <TableBody>
              {routes.map(r => {
                const pct = (r.completed / r.drops) * 100;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.id}</TableCell>
                    <TableCell>{r.driver}</TableCell>
                    <TableCell>{r.vehicle}</TableCell>
                    <TableCell><Badge variant={variant[r.status]} className="capitalize">{r.status.replace("_"," ")}</Badge></TableCell>
                    <TableCell className="w-48">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="flex-1" />
                        <span className="text-xs text-muted-foreground tabular-nums">{r.completed}/{r.drops}</span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{r.litres} L</TableCell>
                    <TableCell>{r.eta}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
