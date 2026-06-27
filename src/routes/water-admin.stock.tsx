import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ClipboardList } from "lucide-react";
import { products as mockProducts, WATER_CATEGORIES, type WaterCategory, type WaterProduct } from "@/lib/water-mock";
import { listProducts } from "@/lib/water-data";
import { useLive } from "@/lib/use-live";

export const Route = createFileRoute("/water-admin/stock")({
  head: () => ({ meta: [{ title: "Stock & Pricing — Water Retail" }] }),
  component: StockPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function StockPage() {
  const products = useLive(["water", "products"] as const, listProducts, mockProducts);

  const lowCount   = products.filter((p) => p.stock <= p.reorder).length;
  const totalValue = products.reduce((a, b) => a + (b.price ?? 0) * b.stock, 0);

  return (
    <div>
      <PageHeader
        title="Stock & Pricing"
        subtitle="Refill · New · Caps · PET · Jerricans. Admin can edit prices; cashiers cannot."
        actions={
          <>
            <Link to="/water-admin/requests"><Button variant="outline"><ClipboardList className="h-4 w-4 mr-1" /> Request stock</Button></Link>
            <Button><Plus className="h-4 w-4 mr-1" /> New product</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Products tracked" value={String(products.length)} />
        <Stat label="Low stock"        value={String(lowCount)}        highlight={lowCount > 0} />
        <Stat label="Inventory value"  value={fmt(totalValue)} />
      </div>

      <Tabs defaultValue="REFILL">
        <TabsList className="flex-wrap h-auto">
          {WATER_CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>{c.label}</TabsTrigger>
          ))}
        </TabsList>
        {WATER_CATEGORIES.map((c) => (
          <TabsContent key={c.id} value={c.id}>
            <StockTable items={products.filter((p) => p.category === (c.id as WaterCategory))} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function StockTable({ items }: { items: WaterProduct[] }) {
  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Stock level</TableHead>
              <TableHead className="text-right">On hand</TableHead>
              <TableHead className="text-right">Reorder</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => {
              const pct = Math.min(100, Math.round((p.stock / (p.reorder * 2)) * 100));
              const low = p.stock <= p.reorder;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.price == null ? <Badge variant="outline">TBC</Badge> : fmt(p.price)}
                  </TableCell>
                  <TableCell className="w-48">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2" />
                      {low && <Badge variant="destructive" className="text-xs">Low</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.stock} <span className="text-xs text-muted-foreground">{p.unit}</span></TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{p.reorder}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline">Edit</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : ""}><CardContent className="p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </CardContent></Card>
  );
}
