import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Plus, Beef, Flame } from "lucide-react";
import { rawStock, cookedStock } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/stock")({
  head: () => ({ meta: [{ title: "Stock & Pricing — R&B" }] }),
  component: StockPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function StockPage() {
  const rawValue = rawStock.reduce((a, b) => a + b.price * b.stock, 0);
  const cookedValue = cookedStock.reduce((a, b) => a + b.price * b.stock, 0);
  return (
    <div>
      <PageHeader
        title="Stock & Pricing"
        subtitle="RAW (uncooked) and COOKED (ready take-away). Manager can edit prices; cashiers cannot."
        actions={<Button><Plus className="h-4 w-4 mr-1" /> New item</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="RAW value" value={fmt(rawValue)} />
        <Stat label="COOKED value" value={fmt(cookedValue)} />
        <Stat label="Total inventory" value={fmt(rawValue + cookedValue)} highlight />
      </div>

      <Tabs defaultValue="cooked">
        <TabsList>
          <TabsTrigger value="cooked" className="gap-2"><Flame className="h-4 w-4" /> COOKED</TabsTrigger>
          <TabsTrigger value="raw" className="gap-2"><Beef className="h-4 w-4" /> RAW</TabsTrigger>
        </TabsList>
        <TabsContent value="cooked"><StockTable items={cookedStock} /></TabsContent>
        <TabsContent value="raw"><StockTable items={rawStock} /></TabsContent>
      </Tabs>
    </div>
  );
}

function StockTable({ items }: { items: { id: string; name: string; unit: string; price: number; stock: number; soldToday: number }[] }) {
  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">In stock</TableHead>
              <TableHead className="text-right">Sold today</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.unit}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(p.price)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.stock} {p.stock < 5 && <Badge variant="destructive" className="ml-2 text-[10px]">Low</Badge>}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{p.soldToday}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-2xl mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
