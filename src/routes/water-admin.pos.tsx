import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Minus, Trash2, Receipt as ReceiptIcon, User, Coins, Loader2 } from "lucide-react";
import { WATER_CATEGORIES, type WaterCategory } from "@/lib/water-mock";
import { hasSupabase } from "@/lib/supabase";
import { listProducts, listCustomers, recordSale, type Product, type CartLine } from "@/lib/water-data";
import { getSession } from "@/lib/auth";

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

function PosPage() {
  const qc = useQueryClient();
  const session = getSession();

  const { data: products = [] } = useQuery({ queryKey: ["water_products"], queryFn: listProducts });
  const { data: customers = [] } = useQuery({ queryKey: ["water_customers"], queryFn: listCustomers });

  const [tab, setTab] = useState<WaterCategory>("REFILL");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountId, setDiscountId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [creditApplied, setCreditApplied] = useState(0);
  const [payOpen, setPayOpen] = useState<null | "cash" | "mpesa">(null);
  const [amountPaid, setAmountPaid] = useState("");

  const customer = customers.find((c) => c.id === customerId);
  const creditAvailable = customer?.balance ?? 0;

  const add = (p: Product) => {
    if (p.price == null) return;
    setCart((c) => {
      const ex = c.find((l) => l.productId === p.id);
      return ex
        ? c.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + 1 } : l))
        : [...c, { productId: p.id, name: p.name, unitPrice: p.price!, qty: 1 }];
    });
  };
  const dec = (id: string) =>
    setCart((c) => c.flatMap((l) => (l.productId === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l])));
  const inc = (id: string) => setCart((c) => c.map((l) => (l.productId === id ? { ...l, qty: l.qty + 1 } : l)));
  const remove = (id: string) => setCart((c) => c.filter((l) => l.productId !== id));

  const subtotal = useMemo(() => cart.reduce((a, l) => a + l.unitPrice * l.qty, 0), [cart]);
  const pct = PRESET_DISCOUNTS.find((d) => d.id === discountId)?.percent ?? 0;
  const discountAmt = Math.round((subtotal * pct) / 100);
  const afterDiscount = subtotal - discountAmt;
  const total = Math.max(0, afterDiscount - creditApplied);

  const visible = products.filter((p) => p.category === tab);

  const sale = useMutation({
    mutationFn: async (method: "cash" | "mpesa") => {
      const paid = Number(amountPaid) || total;
      if (paid < total) throw new Error("Amount paid is less than total due");
      return recordSale({
        customerId: customerId || null,
        cashierName: session?.name ?? "Cashier",
        lines: cart,
        discountPct: pct,
        discountAmount: discountAmt,
        creditApplied,
        total,
        amountPaid: paid,
        method,
      });
    },
    onSuccess: ({ transactionId, overpayment }) => {
      toast.success(
        overpayment > 0
          ? `Sale ${transactionId.slice(0, 8)} · ${fmt(overpayment)} added to credit`
          : `Sale recorded · ${transactionId.slice(0, 8)}`,
      );
      setCart([]); setDiscountId(""); setCustomerId(""); setCreditApplied(0);
      setPayOpen(null); setAmountPaid("");
      qc.invalidateQueries({ queryKey: ["water_products"] });
      qc.invalidateQueries({ queryKey: ["water_customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Point of Sale" subtitle="Click product tiles. Cashiers cannot edit prices or stock items." />

      {!hasSupabase && (
        <div className="mb-4 rounded-md border border-dashed bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          Demo mode — sales mutate in-memory only. Configure <code className="font-mono">.env</code> to persist.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as WaterCategory)}>
            <TabsList className="flex-wrap h-auto">
              {WATER_CATEGORIES.map((c) => (
                <TabsTrigger key={c.id} value={c.id}>{c.label}</TabsTrigger>
              ))}
            </TabsList>
            {WATER_CATEGORIES.map((c) => (
              <TabsContent key={c.id} value={c.id}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {visible.map((p) => {
                    const tbc = p.price == null;
                    const oos = p.stock <= 0;
                    return (
                      <button
                        key={p.id}
                        disabled={tbc || oos}
                        onClick={() => add(p)}
                        className="text-left bg-card border rounded-lg p-3 hover:border-primary hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium leading-tight">{p.name}</div>
                          <Badge variant="outline" className="text-[9px]">{c.label}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">per {p.unit}</div>
                        <div className="font-display text-lg mt-2 tabular-nums">{tbc ? "TBC" : fmt(p.price!)}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">{p.stock} in stock</div>
                      </button>
                    );
                  })}
                  {visible.length === 0 && (
                    <div className="col-span-full text-sm text-muted-foreground py-8 text-center">No items in this category.</div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium flex items-center gap-2"><ReceiptIcon className="h-4 w-4" /> Cart</div>
              <Badge variant="outline">{cart.length} items</Badge>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Customer (optional)
              </div>
              <select
                value={customerId}
                onChange={(e) => { setCustomerId(e.target.value); setCreditApplied(0); }}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Walk-in</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.balance > 0 ? ` · KES ${c.balance.toLocaleString()} credit` : ""}
                  </option>
                ))}
              </select>
              {creditAvailable > 0 && creditApplied === 0 && (
                <Button size="sm" variant="outline" className="w-full gap-1"
                  onClick={() => setCreditApplied(Math.min(creditAvailable, afterDiscount))}>
                  <Coins className="h-3.5 w-3.5" /> Apply KES {creditAvailable.toLocaleString()} credit
                </Button>
              )}
              {creditApplied > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  Credit applied: KES {creditApplied.toLocaleString()} ·{" "}
                  <button onClick={() => setCreditApplied(0)} className="underline">remove</button>
                </div>
              )}
            </div>

            <div className="divide-y border rounded-md min-h-[120px]">
              {cart.length === 0 && <div className="text-sm text-muted-foreground p-4 text-center">Empty cart — tap a tile</div>}
              {cart.map((l) => (
                <div key={l.productId} className="flex items-center gap-2 p-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{l.name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{fmt(l.unitPrice)} × {l.qty}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dec(l.productId)}><Minus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => inc(l.productId)}><Plus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(l.productId)}><Trash2 className="h-3 w-3" /></Button>
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
              {creditApplied > 0 && <Row label="Credit applied" value={`- ${fmt(creditApplied)}`} muted />}
              <div className="flex justify-between font-medium text-base pt-1 border-t">
                <span>Total due</span><span className="tabular-nums">{fmt(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={cart.length === 0} onClick={() => { setAmountPaid(String(total)); setPayOpen("cash"); }}>Cash</Button>
              <Button disabled={cart.length === 0} onClick={() => { setAmountPaid(String(total)); setPayOpen("mpesa"); }}>M-Pesa STK</Button>
            </div>
            <p className="text-[10px] text-muted-foreground">On success: receipts (CUSTOMER + BUSINESS). Overpayment converts to customer credit.</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={payOpen !== null} onOpenChange={(o) => !o && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{payOpen === "mpesa" ? "Confirm M-Pesa payment" : "Confirm cash payment"}</DialogTitle>
            <DialogDescription>
              Total due {fmt(total)}. Overpayment is added to {customer?.name ?? "the customer's"} credit balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="amt">Amount received (KES)</Label>
              <Input id="amt" type="number" min={total} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
              {Number(amountPaid) > total && (
                <p className="text-[11px] text-emerald-700">Overpayment {fmt(Number(amountPaid) - total)} → credit</p>
              )}
              {Number(amountPaid) < total && amountPaid !== "" && (
                <p className="text-[11px] text-destructive">Below total due</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(null)}>Cancel</Button>
            <Button onClick={() => payOpen && sale.mutate(payOpen)} disabled={sale.isPending || Number(amountPaid) < total}>
              {sale.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Confirm sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
