import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { tickets } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/kitchen")({
  head: () => ({ meta: [{ title: "Kitchen — R&B" }] }),
  component: KitchenPage,
});

const variant: Record<string, "default"|"secondary"|"outline"> = {
  ready: "default", preparing: "secondary", queued: "outline",
};

function KitchenPage() {
  return (
    <div>
      <PageHeader title="Kitchen tickets" subtitle="Drag-free workflow: queued → preparing → ready" />
      <div className="grid gap-4 md:grid-cols-3">
        {(["queued","preparing","ready"] as const).map(col => (
          <div key={col}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg capitalize">{col}</h3>
              <Badge variant="outline">{tickets.filter(t=>t.status===col).length}</Badge>
            </div>
            <div className="space-y-3">
              {tickets.filter(t=>t.status===col).map(t => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{t.id}</div>
                      <Badge variant={variant[t.status]}>{t.elapsed}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Table {t.table} · placed {t.placed}</div>
                    <ul className="text-sm space-y-1">{t.items.map((i,x)=>(<li key={x}>• {i}</li>))}</ul>
                    <Button size="sm" className="w-full mt-3" variant={col === "ready" ? "outline" : "default"}>
                      {col === "queued" ? "Start preparing" : col === "preparing" ? "Mark ready" : "Sent out"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
