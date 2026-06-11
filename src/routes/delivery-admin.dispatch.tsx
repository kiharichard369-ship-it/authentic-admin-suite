import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Plus } from "lucide-react";
import { dispatches as _mock_dispatches } from "@/lib/delivery-mock";
import { fetchDispatches } from "@/lib/delivery-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/delivery-admin/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch tracking — Water Delivery" }] }),
  component: DispatchPage,
});

function DispatchPage() {
  const dispatches = useLive(["delivery","dispatches"] as const, fetchDispatches, _mock_dispatches);
  return (
    <div>
      <PageHeader
        title="Dispatch tracking"
        subtitle="Product, time of dispatch, time of delivery, time of return."
        actions={<Button><Plus className="h-4 w-4 mr-1" /> New dispatch</Button>}
      />

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispatch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Driver / Vehicle</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Out</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Returned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatches.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.id}</TableCell>
                  <TableCell className="font-medium">{d.product}</TableCell>
                  <TableCell className="text-sm">
                    <div>{d.driver}</div>
                    <div className="text-xs text-muted-foreground">{d.vehicle}</div>
                  </TableCell>
                  <TableCell>{d.customer}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.dispatchedAt}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.deliveredAt}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.returnedAt}</TableCell>
                  <TableCell><Badge variant={d.status === "returned" ? "secondary" : "default"}>{d.status}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={d.paid ? "outline" : "destructive"} className="text-[10px]">{d.payment} · {d.paid ? "Paid" : "Unpaid"}</Badge>
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
