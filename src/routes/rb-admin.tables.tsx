import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { tables } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/tables")({
  head: () => ({ meta: [{ title: "Tables & Orders — R&B" }] }),
  component: TablesPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();
const color: Record<string,string> = {
  occupied: "bg-primary/15 border-primary text-primary",
  free: "bg-secondary border-border text-muted-foreground",
  reserved: "bg-accent/15 border-accent text-accent",
};

function TablesPage() {
  const occupied = tables.filter(t => t.status === "occupied");
  const total = occupied.reduce((s,t)=>s+t.bill,0);

  return (
    <div>
      <PageHeader title="Tables & orders" subtitle={`${occupied.length} of ${tables.length} tables in service`} actions={<Button>+ New order</Button>} />
      <div className="grid gap-3 mb-8 md:grid-cols-3 lg:grid-cols-5">
        {tables.map(t => (
          <Card key={t.id} className={`border-2 ${color[t.status]}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-display text-xl">{t.id}</div>
                <Badge variant="outline" className="capitalize">{t.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-3">{t.seats} seats · {t.waiter}</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.opened || "—"}</span>
                <span className="font-medium tabular-nums">{t.bill ? fmt(t.bill) : "—"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Open bill total</div>
            <div className="font-display text-3xl tabular-nums">{fmt(total)}</div>
          </div>
          <Button variant="outline">Print floor map</Button>
        </CardContent>
      </Card>
    </div>
  );
}
