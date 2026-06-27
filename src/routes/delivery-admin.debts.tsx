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
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchDebts } from "@/lib/delivery-data";
import { debts as _mock_debts } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/debts")({
  head: () => ({ meta: [{ title: "Debt module — Water Delivery" }] }),
  component: DebtsPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

async function recordDebt(input: { customer: string; phone: string; driver: string; amount: number; dueDate: string; note: string }) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("delivery_debts").insert({
    customer: input.customer, phone: input.phone, driver: input.driver,
    amount: input.amount, due_date: input.dueDate, note: input.note, status: "unpaid",
  });
  if (error) throw error;
}

async function markDebtPaid(id: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("delivery_debts").update({ status: "paid" }).eq("id", id);
  if (error) throw error;
}

function DebtsPage() {
  const qc = useQueryClient();
  const { data: debts = _mock_debts, isLoading } = useQuery({
    queryKey: ["delivery", "debts"],
    queryFn: fetchDebts,
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => markDebtPaid(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["delivery", "debts"] }); toast.success("Marked as paid"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const outstanding = debts.filter(d => d.status !== "paid").reduce((a, b) => a + b.amount, 0);
  const unpaidCount = debts.filter(d => d.status === "unpaid").length;

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Debt module"
        subtitle="Unpaid deliveries — recorded with customer, driver, dispatch and amount."
        actions={<RecordDebtSheet onCreated={() => qc.invalidateQueries({ queryKey: ["delivery", "debts"] })} />}
      />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total outstanding" value={fmt(outstanding)} highlight />
        <Stat label="Unpaid records"    value={String(unpaidCount)} />
        <Stat label="All debt entries"  value={String(debts.length)} />
      </div>
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Driver</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead>Due</TableHead>
                <TableHead>Status</TableHead><TableHead>Note</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{d.phone}</TableCell>
                  <TableCell>{d.driver}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(d.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{d.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === "paid" ? "default" : d.status === "partial" ? "secondary" : "destructive"}>{d.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{d.note}</TableCell>
                  <TableCell className="text-right">
                    {d.status !== "paid" && (
                      <Button size="sm" variant="outline" onClick={() => markPaid.mutate(d.id)} disabled={markPaid.isPending}>Mark paid</Button>
                    )}
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

function RecordDebtSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [driver, setDriver] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  const m = useMutation({
    mutationFn: () => recordDebt({ customer, phone, driver, amount: parseFloat(amount), dueDate, note }),
    onSuccess: () => { toast.success("Debt recorded"); setOpen(false); setCustomer(""); setPhone(""); setDriver(""); setAmount(""); setDueDate(""); setNote(""); onCreated(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Record debt</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Record debt</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Customer *</Label><Input value={customer} onChange={(e) => setCustomer(e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254…" /></div>
          <div className="space-y-2"><Label>Driver</Label><Input value={driver} onChange={(e) => setDriver(e.target.value)} /></div>
          <div className="space-y-2"><Label>Amount (KES) *</Label><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-2"><Label>Due date *</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Note</Label><Input value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !customer || !amount || !dueDate}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Record debt
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-destructive/40" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          {highlight && <AlertCircle className="h-4 w-4 text-destructive" />}
        </div>
        <div className="font-display text-2xl mt-2 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
