import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Coins, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchCredits } from "@/lib/delivery-data";
import { credits as _mock_credits } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/credits")({
  head: () => ({ meta: [{ title: "Credit / carry-forward — Water Delivery" }] }),
  component: CreditsPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

async function recordCredit(input: { customer: string; phone: string; source: string; balance: number; note: string }) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("delivery_credits").insert({
    customer: input.customer, phone: input.phone, source: input.source,
    balance: input.balance, note: input.note, last_updated: new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
}

async function applyCredit(id: string, currentBalance: number, applyAmount: number) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const newBalance = Math.max(0, currentBalance - applyAmount);
  const { error } = await supabase.from("delivery_credits")
    .update({ balance: newBalance, last_updated: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) throw error;
}

function CreditsPage() {
  const qc = useQueryClient();
  const { data: credits = _mock_credits, isLoading } = useQuery({
    queryKey: ["delivery", "credits"],
    queryFn: fetchCredits,
  });

  const applyMut = useMutation({
    mutationFn: ({ id, balance }: { id: string; balance: number }) => {
      const amtStr = prompt("Amount to apply (KES):");
      if (!amtStr) return Promise.resolve();
      const amt = parseFloat(amtStr);
      if (!isFinite(amt) || amt <= 0) throw new Error("Invalid amount");
      return applyCredit(id, balance, amt);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["delivery", "credits"] }); toast.success("Credit applied"); },
    onError: (e: Error) => { if (e.message) toast.error(e.message); },
  });

  const total = credits.reduce((a, b) => a + b.balance, 0);

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Credit / carry-forward"
        subtitle="Overpayments held as credit — applicable to both Water Retail and Water Delivery."
        actions={<RecordCreditSheet onCreated={() => qc.invalidateQueries({ queryKey: ["delivery", "credits"] })} />}
      />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total credit on file"   value={fmt(total)} highlight />
        <Stat label="Customers with credit"  value={String(credits.length)} />
        <Stat label="Sources"                value="Retail + Delivery" />
      </div>
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Source</TableHead>
                <TableHead className="text-right">Balance</TableHead><TableHead>Last update</TableHead>
                <TableHead>Note</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                  <TableCell><Badge variant="outline">{c.source}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fmt(c.balance)}</TableCell>
                  <TableCell className="text-muted-foreground">{c.lastUpdated}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.note}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline"
                      disabled={applyMut.isPending || c.balance === 0}
                      onClick={() => applyMut.mutate({ id: c.id, balance: c.balance })}>
                      Apply
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RecordCreditSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Delivery");
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");

  const m = useMutation({
    mutationFn: () => recordCredit({ customer, phone, source, balance: parseFloat(balance), note }),
    onSuccess: () => {
      toast.success("Credit recorded");
      setOpen(false); setCustomer(""); setPhone(""); setBalance(""); setNote("");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Record credit</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Record credit / carry-forward</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Customer *</Label><Input value={customer} onChange={(e) => setCustomer(e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254…" /></div>
          <div className="space-y-2">
            <Label>Source</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="Delivery">Delivery</option>
              <option value="Retail">Retail</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
          <div className="space-y-2"><Label>Credit balance (KES) *</Label><Input type="number" min={0} value={balance} onChange={(e) => setBalance(e.target.value)} /></div>
          <div className="space-y-2"><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Overpayment from 12 Jun delivery" /></div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !customer || !balance}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Record credit
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          {highlight && <Coins className="h-4 w-4 text-accent" />}
        </div>
        <div className="font-display text-2xl mt-2 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
