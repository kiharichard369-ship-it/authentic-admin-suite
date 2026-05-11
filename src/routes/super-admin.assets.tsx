import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRightLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assets } from "@/lib/mock-data";

export const Route = createFileRoute("/super-admin/assets")({
  head: () => ({ meta: [{ title: "Assets — Super Admin" }] }),
  component: Assets,
});

function Assets() {
  return (
    <div>
      <PageHeader
        title="Asset management"
        subtitle="Lorries, equipment and other assets across all shops."
        actions={<Button><Plus className="h-4 w-4 mr-1" /> Add asset</Button>}
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Shop assigned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Last service</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell><Badge variant="secondary">{a.type}</Badge></TableCell>
                <TableCell>{a.shop}</TableCell>
                <TableCell>
                  <Badge className={
                    a.status === "in_transit" ? "bg-warning text-warning-foreground" :
                    a.status === "active" ? "bg-success text-success-foreground" :
                    "bg-secondary text-secondary-foreground"
                  }>{a.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{a.mileage ? `${a.mileage.toLocaleString()} km` : "—"}</TableCell>
                <TableCell className="text-muted-foreground">{a.lastService ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{a.added}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" disabled={a.status === "in_transit"}>
                    <ArrowRightLeft className="h-3 w-3 mr-1" /> Reassign
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground mt-3">
        Vehicles cannot be reassigned mid-trip. Mileage and service dates draw from the latest driver entry.
      </p>
    </div>
  );
}
