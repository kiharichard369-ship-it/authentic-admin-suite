import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Search, Plus, Minus, Trash2, Printer, RotateCcw, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";
import { listProducts, listCustomers, recordSale, type CartLine, type Customer } from "@/lib/water-data";
import { products as mockProducts, customers as mockCustomers, WATER_CATEGORIES } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/pos")({
  head: () => ({ meta: [{ title: "POS — Water Retail" }] }),
  component: POSPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

const PRESET_DISCOUNTS = [
  { label: "5%", value: 5 }, { label: "10%", value: 10 },
  { label: "15%", value: 15 }, { label: "20%", value: 20 },
];

function POSPage() {
  const qc = useQueryClient();
  const session = getSession();

  // ── data ──────────────────────────────────────────────────────────────────
  const { data: products = mockProducts as any[] } = useQuery({
    queryKey: ["water", "products"],
    queryFn: listProducts,
  });
  const { data: customers = mockCustomers as any[] } = useQuery({
    queryKey: ["water", "customers"],
    queryFn: listCustomers,
  });

  // ── cart state ─────────────────────────────────────────────────────────────
  const [cart, setCart]               = useState<CartLine[]>([]);
  const [searchQ, setSearchQ]         = useState("");
  const [activeCategory, setCategory] = useState("all");
  const [selectedCustomer, setCustomer] = useState<Customer | null>(null);
  const [discountPct, setDiscountPct] = useState(0);
  const [amountPaid, setAmountPaid]   = useState("");
  const [method, setMethod]           = useState<"cash" | "mpesa">("cash");
  const [creditApplied, setCreditApplied] = useState(0);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale]       = useState<{ id: string; total: number; change: number } | null>(null);

  // ── derived totals ─────────────────────────────────────────────────────────
  const subtotal = cart.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const discountAmt = Math.round(subtotal * (discountPct / 100));
  const afterDiscount = subtotal - discountAmt;
  const afterCredit   = Math.max(0, afterDiscount - creditApplied);
  const total         = afterCredit;
  const paid          = parseFloat(amountPaid) || 0;
  const change        = Math.max(0, paid - total);

  // ── product grid ───────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p: any) => p.category))).sort();
    return ["all", ...cats];
  }, [products]);

  const visibleProducts = useMemo(() => {
    return products.filter((p: any) => {
      if (p.stock <= 0) return false;
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (searchQ && !p.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    });
  }, [products, activeCategory, searchQ]);

  // ── cart helpers ───────────────────────────────────────────────────────────
  const addToCart = (p: any) => {
    if (p.price == null) { toast.error(`${p.name} has no price set yet`); return; }
    setCart(prev => {
      const ex = prev.find(l => l.productId === p.id);
      if (ex) {
        if (ex.qty >= p.stock) { toast.error("Not enough stock"); return prev; }
        return prev.map(l => l.productId === p.id ? { ...l, qty: l.qty + 1 } : l);
      }
      return [...prev, { productId: p.id, name: p.name, unitPrice: p.price, qty: 1 }];
    });
  };

  const adjustQty = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(l => l.productId === productId ? { ...l, qty: l.qty + delta } : l)
      .filter(l => l.qty > 0)
    );
  };

  const clearCart = () => {
    setCart([]); setCustomer(null); setDiscountPct(0);
    setAmountPaid(""); setCreditApplied(0); setMethod("cash");
  };

  const applyCredit = () => {
    if (!selectedCustomer || selectedCustomer.balance <= 0) return;
    const apply = Math.min(selectedCustomer.balance, total);
    setCreditApplied(apply);
    setAmountPaid(String(Math.max(0, total - apply)));
  };

  // ── sale mutation ──────────────────────────────────────────────────────────
  const saleMut = useMutation({
    mutationFn: () => {
      if (cart.length === 0) throw new Error("Cart is empty");
      if (paid < total) throw new Error(`Amount paid (${fmt(paid)}) is less than total (${fmt(total)})`);
      return recordSale({
        customerId:     selectedCustomer?.id ?? null,
        cashierName:    session?.name ?? "POS",
        lines:          cart,
        discountPct,
        discountAmount: discountAmt,
        creditApplied,
        total,
        amountPaid:     paid,
        method,
      });
    },
    onSuccess: (result) => {
      setLastSale({ id: result.transactionId, total, change: result.overpayment });
      setReceiptOpen(true);
      qc.invalidateQueries({ queryKey: ["water", "products"] });
      qc.invalidateQueries({ queryKey: ["water", "customers"] });
      qc.invalidateQueries({ queryKey: ["water", "transactions"] });
      qc.invalidateQueries({ queryKey: ["water", "waterKpis"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 overflow-hidden">
      {/* Left: product grid */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9" placeholder="Search products…"
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
            />
          </div>
        </div>
        <Tabs value={activeCategory} onValueChange={setCategory}>
          <TabsList className="flex-wrap h-auto mb-3">
            {categories.map(c => (
              <TabsTrigger key={c} value={c} className="capitalize text-xs">
                {c === "all" ? "All" : c}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeCategory} className="overflow-y-auto flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {visibleProducts.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="text-left rounded-lg border bg-card p-3 hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
                >
                  <div className="font-medium text-sm leading-tight mb-2">{p.name}</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-lg font-display">
                        {p.price == null ? <span className="text-xs text-muted-foreground">TBC</span> : fmt(p.price)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">/{p.unit}</div>
                    </div>
                    <Badge variant={p.stock <= p.reorder ? "destructive" : "secondary"} className="text-[10px]">
                      {p.stock} {p.unit}
                    </Badge>
                  </div>
                </button>
              ))}
              {visibleProducts.length === 0 && (
                <div className="col-span-4 py-12 text-center text-muted-foreground text-sm">
                  {products.length === 0
                    ? "No products yet — add products in Stock & Pricing first."
                    : "No products match your search."}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right: cart + checkout */}
      <div className="w-80 flex flex-col gap-3 overflow-y-auto shrink-0">
        {/* Customer selector */}
        <Card>
          <CardContent className="p-3">
            <Label className="text-xs text-muted-foreground mb-1 block">Customer (optional)</Label>
            <Select
              value={selectedCustomer?.id ?? ""}
              onValueChange={id => {
                const c = customers.find((x: any) => x.id === id) ?? null;
                setCustomer(c as any);
                setCreditApplied(0);
                setAmountPaid("");
              }}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Walk-in customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Walk-in</SelectItem>
                {(customers as Customer[]).map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}{c.balance > 0 ? ` · cr ${fmt(c.balance)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomer?.balance > 0 && (
              <Button size="sm" variant="outline" className="w-full mt-2 text-xs" onClick={applyCredit}>
                Apply credit ({fmt(selectedCustomer.balance)})
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Cart items */}
        <Card className="flex-1">
          <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Cart ({cart.length})
            </CardTitle>
            {cart.length > 0 && (
              <Button size="sm" variant="ghost" className="text-destructive h-7 px-2" onClick={clearCart}>
                <RotateCcw className="h-3 w-3 mr-1" /> Clear
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {cart.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Tap a product to add it
              </p>
            )}
            {cart.map(l => (
              <div key={l.productId} className="flex items-center gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">{l.name}</div>
                  <div className="text-[11px] text-muted-foreground">{fmt(l.unitPrice)} each</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => adjustQty(l.productId, -1)}
                    className="h-6 w-6 rounded border flex items-center justify-center hover:bg-secondary">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs tabular-nums">{l.qty}</span>
                  <button onClick={() => adjustQty(l.productId, 1)}
                    className="h-6 w-6 rounded border flex items-center justify-center hover:bg-secondary">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="tabular-nums text-xs w-16 text-right">{fmt(l.unitPrice * l.qty)}</span>
                <button onClick={() => setCart(prev => prev.filter(x => x.productId !== l.productId))}
                  className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Totals + checkout */}
        <Card>
          <CardContent className="p-3 space-y-2 text-sm">
            <Row label="Subtotal" value={fmt(subtotal)} />

            {/* Discount */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-muted-foreground text-xs mr-auto">Discount</span>
              {PRESET_DISCOUNTS.map(d => (
                <button key={d.value}
                  onClick={() => setDiscountPct(discountPct === d.value ? 0 : d.value)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${discountPct === d.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"}`}>
                  {d.label}
                </button>
              ))}
              {discountPct > 0 && <span className="text-destructive text-xs ml-1">−{fmt(discountAmt)}</span>}
            </div>

            {creditApplied > 0 && <Row label="Credit applied" value={`−${fmt(creditApplied)}`} className="text-accent" />}
            <Separator />
            <Row label="Total" value={fmt(total)} bold />

            {/* Payment method */}
            <div className="grid grid-cols-2 gap-1 pt-1">
              <button onClick={() => setMethod("cash")}
                className={`text-xs py-1.5 rounded border transition-colors ${method === "cash" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"}`}>
                Cash
              </button>
              <button onClick={() => setMethod("mpesa")}
                className={`text-xs py-1.5 rounded border transition-colors ${method === "mpesa" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"}`}>
                M-Pesa
              </button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Amount paid (KES)</Label>
              <Input
                type="number" min={0} value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder={String(total)}
                className="h-8 text-sm"
              />
            </div>

            {paid > 0 && paid >= total && (
              <Row label="Change" value={fmt(change)} className="text-success" />
            )}

            <Button
              className="w-full mt-2"
              disabled={cart.length === 0 || saleMut.isPending || paid < total}
              onClick={() => saleMut.mutate()}
            >
              {saleMut.isPending
                ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                : <ShoppingCart className="h-4 w-4 mr-1" />}
              Charge {fmt(total)}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Receipt dialog */}
      {receiptOpen && lastSale && (
        <Dialog open onOpenChange={v => { if (!v) { setReceiptOpen(false); clearCart(); } }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">✓ Sale Complete</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                <Row label="Transaction" value={`#${lastSale.id.slice(-6).toUpperCase()}`} />
                <Row label="Total charged" value={fmt(lastSale.total)} bold />
                {lastSale.change > 0 && <Row label="Change" value={fmt(lastSale.change)} className="text-accent" />}
                {selectedCustomer && <Row label="Customer" value={selectedCustomer.name} />}
                <Row label="Payment" value={method === "mpesa" ? "M-Pesa" : "Cash"} />
              </div>
              {cart.length > 0 && (
                <div className="text-xs text-muted-foreground border rounded p-2 space-y-1">
                  {cart.map(l => (
                    <div key={l.productId} className="flex justify-between">
                      <span>{l.name} ×{l.qty}</span>
                      <span>{fmt(l.unitPrice * l.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { window.print(); }}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              <Button onClick={() => { setReceiptOpen(false); clearCart(); }}>
                New sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Row({ label, value, bold, className }: {
  label: string; value: string; bold?: boolean; className?: string;
}) {
  return (
    <div className={`flex justify-between items-center ${className ?? ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-display text-base" : "tabular-nums"}>{value}</span>
    </div>
  );
}
