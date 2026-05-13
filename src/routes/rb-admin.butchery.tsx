import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cuts } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/butchery")({
  head: () => ({ meta: [{ title: "Butchery — R&B" }] }),
  component: ButcheryPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function ButcheryPage() {
  const totalKg = cuts.reduce((s,c)=>s+c.stockKg,0);
  const soldKg = cuts.reduce((s,c)=>s+c.soldToday,0);
  const revenue = cuts.reduce((s,c)=>s+c.soldToday*c.pricePerKg,0);

  return (
    <div>
      <PageHeader title="Butchery counter" subtitle="Cuts on display, weights and yield" actions={<Button>+ Log sale</Button>} />
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Stat label="Stock on display" value={`${totalKg.toFixed(1)} kg`} />
        <Stat label="Sold today" value={`${soldKg.toFixed(1)} kg`} />
        <Stat label="Counter revenue" value={fmt(revenue)} highlight />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Cut</TableHead><TableHead>Price/kg</TableHead><TableHead>Stock</TableHead><TableHead>Sold</TableHead><TableHead>Yield</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {cuts.map(c => {
                const pct = (c.soldToday / (c.soldToday + c.stockKg)) * 100;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="tabular-nums">{fmt(c.pricePerKg)}</TableCell>
                    <TableCell className="tabular-nums">{c.stockKg.toFixed(1)} kg</TableCell>
                    <TableCell className="tabular-nums">{c.soldToday.toFixed(1)} kg</TableCell>
                    <TableCell className="w-48"><Progress value={pct} /></TableCell>
                    <TableCell><Badge variant={c.stockKg < 8 ? "destructive" : "secondary"}>{c.stockKg < 8 ? "Low" : "OK"}</Badge></TableCell>
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

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-3xl mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}
