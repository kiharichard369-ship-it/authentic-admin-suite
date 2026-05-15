import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Plus, Minus, Trash2, Receipt as ReceiptIcon } from "lucide-react";
import { products } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/pos")({
  head: () => ({ meta: [{ title: "POS — Water Retail" }] }),
  component: PosPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

const PRESET_DISCOUNTS = [
  { id: "d1", label: "Loyalty 5%", percent: 5 },
  { id: "d2", label: "Bulk 10%", percent: 10 },
  { id: "d3", label: "Estate 15%", percent: 15 },
];

type CartLine = { id: string; name: string; price: number; qty: number };

function PosPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountId, setDiscountId] = useState<string>("");

  const add = (id: string, name: string, price: number) => {
    setCart((c) => {
      const ex = c.find((l) => l.id === id);
      return ex ? c.map((l) => l.id === id ? { ...l, qty: l.qty + 1 } : l) : [...c, { id, name, price, qty: 1 }];
    });
  };
  const dec = (id: string) => setCart((c) => c.flatMap((l) => l.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l]));
  const remove = (id: string) => setCart((c) => c.filter((l) => l.id !== id));

  const subtotal = useMemo(() => cart.reduce((a, l) => a + l.price * l.qty, 0), [cart]);
  const pct = PRESET_DISCOUNTS.find((d) => d.id === discountId)?.percent ?? 0;
  const discountAmt = Math.round(subtotal * pct / 100);
  const total = subtotal - discountAmt;

  return (
    <div>
      <PageHeader title="Point of Sale" subtitle="Click product tiles. Cashiers cannot edit prices or stock items." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((p) => (
              <button key={p.id} onClick={() => add(p.id, p.name, p.price)}
                className="text-left bg-card border rounded-lg p-3 hover:border-primary hover:shadow-sm transition-all">
                <div className="text-sm font-medium leading-tight">{p.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.sku} · per {p.unit.replace(/s$/, "")}</div>
                <div className="font-display text-lg mt-2 tabular-nums">{fmt(p.price)}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{p.stock} in stock</div>
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2"><ReceiptIcon className="h-4 w-4" /> Cart</div>
              <Badge variant="outline">{cart.length} items</Badge>
            </div>
            <div className="divide-y border rounded-md min-h-[160px]">
              {cart.length === 0 && <div className="text-sm text-muted-foreground p-4 text-center">Empty cart — tap a tile</div>}
              {cart.map((l) => (
                <div key={l.id} className="flex items-center gap-2 p-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{l.name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{fmt(l.price)} × {l.qty}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dec(l.id)}><Minus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => add(l.id, l.name, l.price)}><Plus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(l.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Discount (preset only)</div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant={discountId === "" ? "default" : "outline"} onClick={() => setDiscountId("")}>None</Button>
                {PRESET_DISCOUNTS.map((d) => (
                  <Button key={d.id} size="sm" variant={discountId === d.id ? "default" : "outline"} onClick={() => setDiscountId(d.id)}>{d.label}</Button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-sm border-t pt-3">
              <Row label="Subtotal" value={fmt(subtotal)} />
              {discountAmt > 0 && <Row label={`Discount (${pct}%)`} value={`- ${fmt(discountAmt)}`} muted />}
              <div className="flex justify-between font-medium text-base pt-1 border-t">
                <span>Total</span><span className="tabular-nums">{fmt(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={cart.length === 0}>Cash</Button>
              <Button disabled={cart.length === 0}>M-Pesa STK</Button>
            </div>
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
