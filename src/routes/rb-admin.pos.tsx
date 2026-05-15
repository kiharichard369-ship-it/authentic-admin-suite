import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Minus, Trash2, Receipt as ReceiptIcon, Beef, Flame } from "lucide-react";
import { rawStock, cookedStock, discounts } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/pos")({
  head: () => ({ meta: [{ title: "Take-away POS — R&B" }] }),
  component: PosPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

type CartLine = { id: string; name: string; price: number; qty: number; category: "RAW" | "COOKED" };

function PosPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountId, setDiscountId] = useState<string>("");
  const [tab, setTab] = useState<"RAW" | "COOKED">("COOKED");

  const add = (id: string, name: string, price: number, category: "RAW" | "COOKED") => {
    setCart((c) => {
      const ex = c.find((l) => l.id === id);
      return ex ? c.map((l) => l.id === id ? { ...l, qty: l.qty + 1 } : l) : [...c, { id, name, price, qty: 1, category }];
    });
  };
  const dec = (id: string) => setCart((c) => c.flatMap((l) => l.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l]));
  const remove = (id: string) => setCart((c) => c.filter((l) => l.id !== id));

  const subtotal = useMemo(() => cart.reduce((a, l) => a + l.price * l.qty, 0), [cart]);
  const discountPct = discounts.find((d) => d.id === discountId)?.percent ?? 0;
  const discountAmt = Math.round(subtotal * discountPct / 100);
  const total = subtotal - discountAmt;

  return (
    <div>
      <PageHeader title="Take-away POS" subtitle="Click product tiles to build the order. Cashiers cannot edit prices." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "RAW" | "COOKED")}>
            <TabsList>
              <TabsTrigger value="COOKED" className="gap-2"><Flame className="h-4 w-4" /> COOKED</TabsTrigger>
              <TabsTrigger value="RAW" className="gap-2"><Beef className="h-4 w-4" /> RAW</TabsTrigger>
            </TabsList>
            <TabsContent value="COOKED">
              <Grid items={cookedStock} category="COOKED" onAdd={add} />
            </TabsContent>
            <TabsContent value="RAW">
              <Grid items={rawStock} category="RAW" onAdd={add} />
            </TabsContent>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2"><ReceiptIcon className="h-4 w-4" /> Order</div>
              <Badge variant="outline">{cart.length} items</Badge>
            </div>
            <div className="divide-y border rounded-md min-h-[160px]">
              {cart.length === 0 && <div className="text-sm text-muted-foreground p-4 text-center">Empty cart — tap a tile</div>}
              {cart.map((l) => (
                <div key={l.id} className="flex items-center gap-2 p-2 text-sm">
                  <Badge variant={l.category === "RAW" ? "secondary" : "default"} className="text-[9px]">{l.category}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{l.name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{fmt(l.price)} × {l.qty}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dec(l.id)}><Minus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => add(l.id, l.name, l.price, l.category)}><Plus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(l.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Discount (preset only)</div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant={discountId === "" ? "default" : "outline"} onClick={() => setDiscountId("")}>None</Button>
                {discounts.map((d) => (
                  <Button key={d.id} size="sm" variant={discountId === d.id ? "default" : "outline"} onClick={() => setDiscountId(d.id)}>{d.label}</Button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-sm border-t pt-3">
              <Row label="Subtotal" value={fmt(subtotal)} />
              {discountAmt > 0 && <Row label={`Discount (${discountPct}%)`} value={`- ${fmt(discountAmt)}`} muted />}
              <div className="flex justify-between font-medium text-base pt-1 border-t">
                <span>Total</span><span className="tabular-nums">{fmt(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={cart.length === 0}>Cash</Button>
              <Button disabled={cart.length === 0}>M-Pesa STK</Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Sale auto-records: date, time, items, qty, total, cashier. Two receipts auto-generated (CUSTOMER + BUSINESS).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Grid({ items, category, onAdd }: { items: { id: string; name: string; price: number; unit: string }[]; category: "RAW" | "COOKED"; onAdd: (id: string, name: string, price: number, c: "RAW" | "COOKED") => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
      {items.map((p) => (
        <button key={p.id} onClick={() => onAdd(p.id, p.name, p.price, category)}
          className="text-left bg-card border rounded-lg p-3 hover:border-primary hover:shadow-sm transition-all">
          <div className="text-sm font-medium leading-tight">{p.name}</div>
          <div className="text-xs text-muted-foreground mt-1">per {p.unit}</div>
          <div className="font-display text-lg mt-2 tabular-nums">{fmt(p.price)}</div>
        </button>
      ))}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span><span className="tabular-nums">{value}</span>
    </div>
  );
}
