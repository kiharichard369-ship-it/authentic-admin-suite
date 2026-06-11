import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { stockRequests as _mock_stockRequests } from "@/lib/water-mock";
import { fetchStockRequests } from "@/lib/water-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/water-admin/requests")({
  head: () => ({ meta: [{ title: "Stock Requests — Water Retail" }] }),
  component: RequestsPage,
});

const tone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "secondary",
  delivered: "default",
  rejected: "destructive",
};

function RequestsPage() {
  const stockRequests = useLive(["water","stockRequests"] as const, fetchStockRequests, _mock_stockRequests);
  return (
    <div>
      <PageHeader
        title="Stock Requests"
        subtitle="Replenishment requests sent to the main warehouse."
        actions={<Button><Plus className="h-4 w-4 mr-1" /> New request</Button>}
      />

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockRequests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.id}</TableCell>
                  <TableCell className="text-muted-foreground">{r.date}</TableCell>
                  <TableCell>{r.items}</TableCell>
                  <TableCell><Badge variant={tone[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{r.note || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
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
