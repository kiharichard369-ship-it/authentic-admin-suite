import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, ClipboardList, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { listProducts, type Product } from "@/lib/water-data";
import { products as mockProducts } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/stock")({
  head: () => ({ meta: [{ title: "Stock & Pricing — Water Retail" }] }),
  component: StockPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

// All categories are free-form text — vendor defines their own
const DEFAULT_CATEGORIES = ["Refill", "New Bottle", "Caps", "PET", "Jerrican", "Other"];

// ─── mutations ───────────────────────────────────────────────────────────────

async function upsertProduct(input: {
  id?: string;
  sku: string; name: string; category: string;
  price: number | null; stock: number; reorder: number; unit: string;
}) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const vendorId = getSession()?.vendorId;
  if (!vendorId) throw new Error("No vendor session");

  if (input.id) {
    // Update existing
    const { error } = await supabase.from("water_products").update({
      sku: input.sku, name: input.name, category: input.category,
      price: input.price, stock: input.stock, reorder: input.reorder, unit: input.unit,
    }).eq("id", input.id).eq("vendor_id", vendorId);
    if (error) throw error;
  } else {
    // Create new
    const { error } = await supabase.from("water_products").insert({
      vendor_id: vendorId,
      sku: input.sku, name: input.name, category: input.category,
      price: input.price, stock: input.stock, reorder: input.reorder, unit: input.unit,
    });
    if (error) throw error;
  }
}

async function adjustStock(id: string, delta: number, currentStock: number) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const newStock = Math.max(0, currentStock + delta);
  const { error } = await supabase.from("water_products").update({ stock: newStock }).eq("id", id);
  if (error) throw error;
}

// ─── page ────────────────────────────────────────────────────────────────────

function StockPage() {
  const qc = useQueryClient();
  const { data: products = mockProducts as any[], isLoading } = useQuery({
    queryKey: ["water", "products"],
    queryFn: listProducts,
  });

  const [activeTab, setActiveTab] = useState("all");

  // Derive categories from actual products (vendor's own list)
  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category))).sort()];

  const visible = activeTab === "all" ? products : products.filter((p) => p.category === activeTab);
  const lowCount   = products.filter((p) => p.stock <= p.reorder).length;
  const totalValue = products.reduce((a, b) => a + (b.price ?? 0) * b.stock, 0);

  const refresh = () => qc.invalidateQueries({ queryKey: ["water", "products"] });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Stock & Pricing"
        subtitle="Each product, price, quantity and unit is set by your branch. Admin only."
        actions={
          <>
            <Link to="/water-admin/requests">
              <Button variant="outline"><ClipboardList className="h-4 w-4 mr-1" /> Request stock</Button>
            </Link>
            <ProductSheet onSaved={refresh} />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Products in catalogue" value={String(products.length)} />
        <Stat label="Low / out of stock"    value={String(lowCount)} highlight={lowCount > 0} />
        <Stat label="Inventory value"       value={fmt(totalValue)} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto mb-4">
          {categories.map((c) => (
            <TabsTrigger key={c} value={c} className="capitalize">{c === "all" ? "All" : c}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Stock level</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">Reorder at</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => {
                    const pct = Math.min(100, Math.round((p.stock / Math.max(1, p.reorder * 2)) * 100));
                    const low = p.stock <= p.reorder;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{p.category}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.price == null ? <Badge variant="outline">TBC</Badge> : fmt(p.price)}
                        </TableCell>
                        <TableCell className="w-44">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2 flex-1" />
                            {low && <Badge variant="destructive" className="text-[10px] shrink-0">Low</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.stock} <span className="text-xs text-muted-foreground">{p.unit}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{p.reorder}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <StockAdjustDialog product={p} onSaved={refresh} />
                            <ProductSheet product={p} onSaved={refresh} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {visible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No products yet. Add your first product to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Product create / edit sheet ─────────────────────────────────────────────

function ProductSheet({ product, onSaved }: { product?: Product; onSaved: () => void }) {
  const isEdit = !!product;
  const [open, setOpen]         = useState(false);
  const [sku, setSku]           = useState(product?.sku ?? "");
  const [name, setName]         = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "Refill");
  const [customCat, setCustomCat] = useState("");
  const [price, setPrice]       = useState(product?.price != null ? String(product.price) : "");
  const [stock, setStock]       = useState(String(product?.stock ?? 0));
  const [reorder, setReorder]   = useState(String(product?.reorder ?? 10));
  const [unit, setUnit]         = useState(product?.unit ?? "litres");

  const resetForm = () => {
    setSku(product?.sku ?? "");
    setName(product?.name ?? "");
    setCategory(product?.category ?? "Refill");
    setCustomCat("");
    setPrice(product?.price != null ? String(product.price) : "");
    setStock(String(product?.stock ?? 0));
    setReorder(String(product?.reorder ?? 10));
    setUnit(product?.unit ?? "litres");
  };

  const effectiveCategory = category === "__custom__" ? customCat.trim() : category;

  const m = useMutation({
    mutationFn: () => upsertProduct({
      id:       product?.id,
      sku:      sku.trim(),
      name:     name.trim(),
      category: effectiveCategory,
      price:    price === "" ? null : parseFloat(price),
      stock:    parseInt(stock) || 0,
      reorder:  parseInt(reorder) || 0,
      unit:     unit.trim(),
    }),
    onSuccess: () => {
      toast.success(isEdit ? "Product updated" : "Product added");
      setOpen(false);
      resetForm();
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const valid = name.trim() && sku.trim() && unit.trim() &&
    (category !== "__custom__" || customCat.trim());

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <SheetTrigger asChild>
        {isEdit
          ? <Button size="sm" variant="outline"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
          : <Button><Plus className="h-4 w-4 mr-1" /> New product</Button>
        }
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-6 px-0">
          <SheetTitle>{isEdit ? `Edit — ${product!.name}` : "Add new product"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. REF-20L" />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">+ Custom…</SelectItem>
                </SelectContent>
              </Select>
              {category === "__custom__" && (
                <Input
                  className="mt-1"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                  placeholder="Category name"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 20 L Refill" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Unit of measure *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="litres">Litres</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="bottle">Bottle</SelectItem>
                  <SelectItem value="each">Each</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price (KES)</Label>
              <Input
                type="number" min={0} step={0.5}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Leave blank = TBC"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Current stock *</Label>
              <Input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reorder level *</Label>
              <Input type="number" min={0} value={reorder} onChange={(e) => setReorder(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Alert when stock ≤ this</p>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !valid}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {isEdit ? "Save changes" : "Add product"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Quick stock adjustment dialog ───────────────────────────────────────────

function StockAdjustDialog({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const [open, setOpen]   = useState(false);
  const [delta, setDelta] = useState("");
  const [mode, setMode]   = useState<"add" | "remove">("add");

  const m = useMutation({
    mutationFn: () => {
      const d = parseInt(delta);
      if (!Number.isFinite(d) || d <= 0) throw new Error("Enter a positive number");
      return adjustStock(product.id, mode === "add" ? d : -d, product.stock);
    },
    onSuccess: () => {
      toast.success("Stock updated");
      setOpen(false); setDelta(""); onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const preview = (() => {
    const d = parseInt(delta) || 0;
    const result = mode === "add" ? product.stock + d : Math.max(0, product.stock - d);
    return result;
  })();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Adjust stock</Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust stock — {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-secondary/60 p-3 text-sm">
            <span className="text-muted-foreground">Current stock:</span>
            <span className="font-display text-lg">{product.stock} {product.unit}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === "add" ? "default" : "outline"}
              onClick={() => setMode("add")}
            >+ Add</Button>
            <Button
              variant={mode === "remove" ? "default" : "outline"}
              onClick={() => setMode("remove")}
            >− Remove</Button>
          </div>
          <div className="space-y-2">
            <Label>Quantity ({product.unit})</Label>
            <Input
              type="number" min={1}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
          {delta && (
            <div className="text-sm text-muted-foreground">
              New stock will be: <span className="font-medium text-foreground">{preview} {product.unit}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !delta}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
