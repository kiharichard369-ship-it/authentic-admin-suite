import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Minus, Trash2, Receipt as ReceiptIcon, Beef, Flame, Package } from "lucide-react";
import { rawStock, cookedStock, processedStock, discounts, type RbCategory, type RbItem } from "@/lib/rb-mock";

export const Route = createFileRoute("/rb-admin/pos")({
  head: () => ({ meta: [{ title: "Take-away POS — R&B" }] }),
  component: PosPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

type CartLine = { id: string; name: string; price: number; qty: number; category: RbCategory };

const TABS: { id: RbCategory; label: string; icon: typeof Beef; items: RbItem[] }[] = [
  { id: "COOKED", label: "COOKED", icon: Flame, items: cookedStock },
  { id: "RAW", label: "RAW", icon: Beef, items: rawStock },
  { id: "PROCESSED", label: "PROCESSED", icon: Package, items: processedStock },
];

function PosPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountId, setDiscountId] = useState<string>("");
  const [tab, setTab] = useState<RbCategory>("COOKED");

  const add = (p: RbItem) => {
    setCart((c) => {
      const ex = c.find((l) => l.id === p.id);
      return ex ? c.map((l) => l.id === p.id ? { ...l, qty: l.qty + 1 } : l) : [...c, { id: p.id, name: p.name, price: p.price, qty: 1, category: p.category }];
    });
  };
  const dec = (id: string) => setCart((c) => c.flatMap((l) => l.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l]));
  const inc = (id: string) => setCart((c) => c.map((l) => l.id === id ? { ...l, qty: l.qty + 1 } : l));
  const remove = (id: string) => setCart((c) => c.filter((l) => l.id !== id));

  const subtotal = useMemo(() => cart.reduce((a, l) => a + l.price * l.qty, 0), [cart]);
  const discountPct = discounts.find((d) => d.id === discountId)?.percent ?? 0;
  const discountAmt = Math.round(subtotal * discountPct / 100);
  const total = subtotal - discountAmt;

  return (
    <div>
      <PageHeader title="Take-away POS" subtitle="Click product tiles. Cashiers cannot edit prices." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as RbCategory)}>
            <TabsList className="flex-wrap h-auto">
              {TABS.map(({ id, label, icon: Icon }) => (
                <TabsTrigger key={id} value={id} className="gap-2"><Icon className="h-4 w-4" /> {label}</TabsTrigger>
              ))}
            </TabsList>
            {TABS.map(({ id, items }) => (
              <TabsContent key={id} value={id}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {items.map((p) => {
                    const oos = p.stock <= 0;
                    return (
                      <button key={p.id} disabled={oos} onClick={() => add(p)}
                        className="text-left bg-card border rounded-lg p-3 hover:border-primary hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium leading-tight">{p.name}</div>
                          <Badge variant={p.category === "RAW" ? "secondary" : p.category === "PROCESSED" ? "outline" : "default"} className="text-[9px]">{p.category}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">per {p.unit} · {p.sub}</div>
                        <div className="font-display text-lg mt-2 tabular-nums">{fmt(p.price)}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{p.stock} {p.unit} in stock</div>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
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
                  <Badge variant={l.category === "RAW" ? "secondary" : l.category === "PROCESSED" ? "outline" : "default"} className="text-[9px]">{l.category}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{l.name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{fmt(l.price)} × {l.qty}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dec(l.id)}><Minus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => inc(l.id)}><Plus className="h-3 w-3" /></Button>
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
            <p className="text-[10px] text-muted-foreground">Sale auto-records: date, time, items, qty, total, cashier. Two receipts auto-generated (CUSTOMER + BUSINESS) with RAW/COOKED/PROCESSED badge per line.</p>
          </CardContent>
        </Card>
      </div>
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
