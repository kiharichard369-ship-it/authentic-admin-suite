import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Phone, Pencil, Loader2 } from "lucide-react";
import { hasSupabase } from "@/lib/supabase";
import {
  listCustomers, createCustomer, updateCustomerBalance, type Customer,
} from "@/lib/water-data";

export const Route = createFileRoute("/water-admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Water Retail" }] }),
  component: CustomersPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

const newSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  type: z.enum(["Walk-in", "Estate", "Business", "Institution"]),
  balance: z.number().min(0).max(1_000_000),
});

function CustomersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["water_customers"],
    queryFn: listCustomers,
  });

  const filtered = customers.filter(
    (c) => !q || `${c.name} ${c.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()),
  );
  const totalSpent = customers.reduce((a, c) => a + c.spent, 0);
  const owing = customers.filter((c) => c.balance > 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Estates, businesses and recurring walk-ins served by this branch."
        actions={<AddCustomerDialog onCreated={() => qc.invalidateQueries({ queryKey: ["water_customers"] })} />}
      />

      {!hasSupabase && (
        <div className="mb-4 rounded-md border border-dashed bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          Demo mode — using in-memory data. Add your Supabase keys to <code className="font-mono">.env</code> to persist.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total customers" value={String(customers.length)} />
        <Stat label="Lifetime revenue" value={fmt(totalSpent)} />
        <Stat
          label="Outstanding credit"
          value={fmt(owing.reduce((a, c) => a + c.balance, 0))}
          highlight={owing.length > 0}
        />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Input
            placeholder="Search by name or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
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
              <TableHead className="text-right">Lifetime spend</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Last visit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No customers yet.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {c.phone}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell><Badge variant="secondary">{c.type}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{c.visits}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(c.spent)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.balance > 0 ? (
                    <span className="text-destructive font-medium">{fmt(c.balance)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.lastVisit ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <EditBalanceDialog customer={c} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddCustomerDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<Customer["type"]>("Walk-in");
  const [balance, setBalance] = useState("0");

  const m = useMutation({
    mutationFn: async () => {
      const parsed = newSchema.parse({
        name, phone, type, balance: Number(balance) || 0,
      });
      return createCustomer({
        name: parsed.name,
        phone: parsed.phone || null,
        type: parsed.type,
        balance: parsed.balance,
      });
    },
    onSuccess: () => {
      toast.success("Customer added");
      onCreated();
      setOpen(false);
      setName(""); setPhone(""); setType("Walk-in"); setBalance("0");
    },
    onError: (e: unknown) => {
      const msg = e instanceof z.ZodError ? e.issues[0].message : (e as Error).message;
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> Add customer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>Walk-in, estate, business or institution accounts.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254…" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Customer["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Estate">Estate</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Institution">Institution</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="balance">Opening credit balance (KES)</Label>
            <Input id="balance" type="number" min={0} value={balance} onChange={(e) => setBalance(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Positive = store credit owed to customer.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditBalanceDialog({ customer }: { customer: Customer }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(customer.balance));
  const [reason, setReason] = useState("");

  const m = useMutation({
    mutationFn: async () => {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) throw new Error("Balance must be a non-negative number");
      if (n > 1_000_000) throw new Error("Balance is too large");
      await updateCustomerBalance(customer.id, n);
    },
    onSuccess: () => {
      toast.success(`Balance updated · ${reason || "manual adjustment"}`);
      qc.invalidateQueries({ queryKey: ["water_customers"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(String(customer.balance)); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><Pencil className="h-3 w-3 mr-1" /> Edit balance</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust balance · {customer.name}</DialogTitle>
          <DialogDescription>Current credit: {fmt(customer.balance)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bal">New balance (KES)</Label>
            <Input id="bal" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason (logged)</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Refund issued, manual top-up…" maxLength={200} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Save
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
