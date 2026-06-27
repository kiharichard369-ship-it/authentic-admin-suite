import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Loader2, CreditCard, Download } from "lucide-react";
import { toast } from "sonner";
import { listCustomers, createCustomer, updateCustomerBalance, type Customer } from "@/lib/water-data";
import { customers as _mock } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Water Retail" }] }),
  component: CustomersPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();
const TYPE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  "Walk-in": "outline", Estate: "secondary", Business: "default", Institution: "default",
};

function CustomersPage() {
  const qc = useQueryClient();
  const [q, setQ]               = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [balanceCustomer, setBalanceCustomer] = useState<Customer | null>(null);

  const { data: customers = _mock as any[], isLoading } = useQuery({
    queryKey: ["water", "customers"],
    queryFn: listCustomers,
  });

  const filtered = customers.filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (q && !`${c.name} ${c.phone ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const totalSpent   = customers.reduce((a, c) => a + c.spent,   0);
  const totalBalance = customers.reduce((a, c) => a + c.balance, 0);
  const withBalance  = customers.filter(c => c.balance > 0).length;

  const exportCSV = () => {
    const csv = ["Name,Phone,Type,Visits,Spent,Balance,Last Visit",
      ...customers.map(c =>
        `"${c.name}",${c.phone ?? ""},${c.type},${c.visits},${c.spent},${c.balance},${c.lastVisit ?? ""}`
      )
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        actions={
          <>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <AddCustomerSheet onCreated={() => qc.invalidateQueries({ queryKey: ["water", "customers"] })} />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total customers"    value={String(customers.length)} />
        <Stat label="Total revenue"      value={fmt(totalSpent)} />
        <Stat label="Outstanding credit" value={fmt(totalBalance)} hint={`${withBalance} accounts`} highlight={totalBalance > 0} />
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Input
            placeholder="Search by name or phone…"
            value={q} onChange={e => setQ(e.target.value)}
            className="max-w-xs"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Customer type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Walk-in">Walk-in</SelectItem>
              <SelectItem value="Estate">Estate</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Institution">Institution</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Visits</TableHead>
              <TableHead className="text-right">Total spent</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Last visit</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={TYPE_VARIANT[c.type] ?? "outline"}>{c.type}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{c.visits}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.spent)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.balance > 0
                    ? <span className="text-accent font-medium">{fmt(c.balance)}</span>
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{c.lastVisit ?? "—"}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline"
                    onClick={() => setBalanceCustomer(c)}>
                    <CreditCard className="h-3 w-3 mr-1" /> Credit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  {q || typeFilter !== "all" ? "No customers match your filter." : "No customers yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Balance adjustment dialog */}
      {balanceCustomer && (
        <BalanceDialog
          customer={balanceCustomer}
          onClose={() => setBalanceCustomer(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["water", "customers"] });
            setBalanceCustomer(null);
          }}
        />
      )}
    </div>
  );
}

function BalanceDialog({ customer, onClose, onSaved }: {
  customer: Customer; onClose: () => void; onSaved: () => void;
}) {
  const [mode, setMode]   = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");

  const m = useMutation({
    mutationFn: () => {
      const a = parseFloat(amount);
      if (!isFinite(a) || a <= 0) throw new Error("Enter a valid positive amount");
      const newBalance = mode === "add"
        ? customer.balance + a
        : Math.max(0, customer.balance - a);
      return updateCustomerBalance(customer.id, newBalance);
    },
    onSuccess: () => { toast.success("Balance updated"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const preview = (() => {
    const a = parseFloat(amount) || 0;
    return mode === "add" ? customer.balance + a : Math.max(0, customer.balance - a);
  })();

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust credit — {customer.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-secondary/50 p-3 text-sm flex justify-between">
            <span className="text-muted-foreground">Current balance</span>
            <span className="font-display text-lg tabular-nums">KES {customer.balance.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant={mode === "add" ? "default" : "outline"} onClick={() => setMode("add")}>+ Add credit</Button>
            <Button variant={mode === "deduct" ? "default" : "outline"} onClick={() => setMode("deduct")}>− Deduct</Button>
          </div>
          <div className="space-y-2">
            <Label>Amount (KES) *</Label>
            <Input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
          </div>
          {amount && (
            <div className="text-sm text-muted-foreground">
              New balance: <span className="font-medium text-foreground tabular-nums">KES {preview.toLocaleString()}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !amount}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCustomerSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen]   = useState(false);
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType]   = useState<Customer["type"]>("Walk-in");
  const [balance, setBalance] = useState("0");

  const m = useMutation({
    mutationFn: () => createCustomer({
      name, phone: phone || null, type, balance: parseFloat(balance) || 0,
    }),
    onSuccess: () => {
      toast.success(`Customer "${name}" added`);
      setOpen(false); setName(""); setPhone(""); setType("Walk-in"); setBalance("0");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button><UserPlus className="h-4 w-4 mr-1" /> Add customer</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Add customer</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full name / business name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Waweru Estate" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000" />
          </div>
          <div className="space-y-2">
            <Label>Customer type *</Label>
            <Select value={type} onValueChange={v => setType(v as Customer["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Walk-in">Walk-in</SelectItem>
                <SelectItem value="Estate">Estate</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Institution">Institution</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Opening credit balance (KES)</Label>
            <Input type="number" min={0} value={balance} onChange={e => setBalance(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Leave 0 for new accounts with no carry-forward.</p>
          </div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !name.trim()}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Add customer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, hint, highlight }: {
  label: string; value: string; hint?: string; highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-2xl mt-1">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}
