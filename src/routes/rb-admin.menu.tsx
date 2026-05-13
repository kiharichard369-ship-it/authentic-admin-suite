import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { menu } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/menu")({
  head: () => ({ meta: [{ title: "Menu — R&B" }] }),
  component: MenuPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function MenuPage() {
  const cats = Array.from(new Set(menu.map(m => m.category)));
  return (
    <div>
      <PageHeader title="Menu & pricing" subtitle={`${menu.length} items across ${cats.length} categories`} actions={<Button>+ Add item</Button>} />
      {cats.map(cat => (
        <div key={cat} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-display text-xl">{cat}</h2>
            <Badge variant="outline">{menu.filter(m=>m.category===cat).length}</Badge>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Available</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {menu.filter(m=>m.category===cat).map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="tabular-nums">{fmt(m.price)}</TableCell>
                      <TableCell><Switch defaultChecked={m.available} /></TableCell>
                      <TableCell><Button size="sm" variant="ghost">Edit</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
