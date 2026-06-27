import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fetchRefunds } from "@/lib/water-data";
import { refunds as _mock } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/refunds")({
  head: () => ({ meta: [{ title: "Refunds — Water Retail" }] }),
  component: RefundsPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();
const STATUS_CLASS: Record<string, string> = {
  approved: "bg-success text-success-foreground",
  pending:  "bg-accent text-accent-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

async function createRefund(input: {
  customer: string; cashier: string; reason: string; amount: number;
}) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const vendorId = getSession()?.vendorId;
  if (!vendorId) throw new Error("No vendor session");
  const { error } = await supabase.from("water_refunds").insert({
    vendor_id: vendorId,
    customer: input.customer || "Walk-in",
    cashier: input.cashier,
    reason: input.reason,
    amount: input.amount,
    status: "pending",
  });
  if (error) throw error;
}

async function setRefundStatus(id: string, status: "approved" | "rejected") {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("water_refunds").update({ status }).eq("id", id);
  if (error) throw error;
}

function RefundsPage() {
  const qc = useQueryClient();
  const { data: refunds = _mock, isLoading } = useQuery({
    queryKey: ["water", "refunds"],
    queryFn: fetchRefunds,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) => setRefundStatus(id, status),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["water", "refunds"] });
      toast.success(`Refund ${v.status}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total   = refunds.filter(r => r.status === "approved").reduce((a, r) => a + r.amount, 0);
  const pending = refunds.filter(r => r.status === "pending").length;

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Refunds"
        subtitle="Cashier-initiated refunds — admin review and approval."
        actions={<LogRefundSheet onCreated={() => qc.invalidateQueries({ queryKey: ["water", "refunds"] })} />}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total refunds"    value={String(refunds.length)} />
        <Stat label="Approved value"   value={fmt(total)} />
        <Stat label="Pending review"   value={String(pending)} highlight={pending > 0} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refunds.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-muted-foreground tabular-nums text-sm">
                  {typeof r.date === "string" ? r.date.slice(0, 10) : r.date}
                </TableCell>
                <TableCell className="font-medium">{r.customer}</TableCell>
                <TableCell className="text-muted-foreground">{r.cashier}</TableCell>
                <TableCell className="max-w-[180px] truncate text-sm">{r.reason}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{fmt(r.amount)}</TableCell>
                <TableCell>
                  <Badge className={STATUS_CLASS[r.status]}>{r.status}</Badge>
                </TableCell>
                <TableCell>
                  {r.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline"
                        disabled={statusMut.isPending}
                        onClick={() => statusMut.mutate({ id: r.id, status: "approved" })}>
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive"
                        disabled={statusMut.isPending}
                        onClick={() => statusMut.mutate({ id: r.id, status: "rejected" })}>
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {refunds.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No refunds logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function LogRefundSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen]         = useState(false);
  const [customer, setCustomer] = useState("");
  const [cashier, setCashier]   = useState("");
  const [reason, setReason]     = useState("");
  const [amount, setAmount]     = useState("");

  const m = useMutation({
    mutationFn: () => createRefund({
      customer, cashier, reason, amount: parseFloat(amount),
    }),
    onSuccess: () => {
      toast.success("Refund request logged");
      setOpen(false); setCustomer(""); setCashier(""); setReason(""); setAmount("");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> Log refund</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Log refund request</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Customer name</Label>
            <Input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Walk-in if unknown" />
          </div>
          <div className="space-y-2">
            <Label>Cashier who processed *</Label>
            <Input value={cashier} onChange={e => setCashier(e.target.value)} placeholder="Name of cashier" />
          </div>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this refund being requested?" />
          </div>
          <div className="space-y-2">
            <Label>Amount (KES) *</Label>
            <Input type="number" min={0} step={0.5} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !cashier.trim() || !reason.trim() || !amount}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Submit refund
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
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-2xl mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
