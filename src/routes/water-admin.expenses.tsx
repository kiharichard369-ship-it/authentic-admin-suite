import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fetchBranchExpenses } from "@/lib/water-data";
import { branchExpenses as _mock } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Water Retail" }] }),
  component: ExpensesPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();
const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  logged: "outline", reviewed: "secondary", rejected: "destructive",
};
const CATEGORIES = ["Fuel", "Supplies", "Repairs", "Utilities", "Salaries", "Transport", "Other"];

async function logExpense(input: {
  staff: string; category: string; description: string; amount: number;
}) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const vendorId = getSession()?.vendorId;
  if (!vendorId) throw new Error("No vendor session");
  const { error } = await supabase.from("water_branch_expenses").insert({
    vendor_id: vendorId,
    staff: input.staff, category: input.category,
    description: input.description || null, amount: input.amount, status: "logged",
  });
  if (error) throw error;
}

async function updateStatus(id: string, status: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("water_branch_expenses").update({ status }).eq("id", id);
  if (error) throw error;
}

function ExpensesPage() {
  const qc = useQueryClient();
  const [catFilter, setCatFilter] = useState("all");

  const { data: expenses = _mock, isLoading } = useQuery({
    queryKey: ["water", "branchExpenses"],
    queryFn: fetchBranchExpenses,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["water", "branchExpenses"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = catFilter === "all" ? expenses : expenses.filter(e => e.category === catFilter);
  const total   = expenses.filter(e => e.status !== "rejected").reduce((a, b) => a + b.amount, 0);
  const pending = expenses.filter(e => e.status === "logged").length;

  // Group totals by category for the summary row
  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat && e.status !== "rejected").reduce((a, b) => a + b.amount, 0),
  })).filter(x => x.total > 0);

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Branch Expenses"
        subtitle="All operational costs logged at this branch."
        actions={
          <>
            <Button variant="outline" onClick={() => {
              const csv = ["Date,Staff,Category,Description,Amount,Status",
                ...expenses.map(e => `${e.date},${e.staff},${e.category},"${e.description}",${e.amount},${e.status}`)
              ].join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              a.download = `expenses-${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <LogExpenseSheet onCreated={() => qc.invalidateQueries({ queryKey: ["water", "branchExpenses"] })} />
          </>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="border-primary/30">
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Total this period</div>
            <div className="font-display text-2xl mt-1 tabular-nums">{fmt(total)}</div>
          </CardContent>
        </Card>
        <Card className={pending > 0 ? "border-accent" : ""}>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Awaiting review</div>
            <div className="font-display text-2xl mt-1">{pending}</div>
          </CardContent>
        </Card>
        {byCategory.slice(0, 2).map(({ cat, total: t }) => (
          <Card key={cat}>
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">{cat}</div>
              <div className="font-display text-2xl mt-1 tabular-nums">{fmt(t)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {["all", ...CATEGORIES].map(c => (
          <Button key={c} size="sm"
            variant={catFilter === c ? "default" : "outline"}
            onClick={() => setCatFilter(c)}
            className="capitalize">{c === "all" ? "All" : c}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((e) => (
                <TableRow key={e.id} className={e.status === "rejected" ? "opacity-50" : ""}>
                  <TableCell className="text-muted-foreground tabular-nums">{e.date}</TableCell>
                  <TableCell>{e.staff}</TableCell>
                  <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{e.description || "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fmt(e.amount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {e.status === "logged" && (
                        <Button size="sm" variant="outline"
                          onClick={() => statusMut.mutate({ id: e.id, status: "reviewed" })}
                          disabled={statusMut.isPending}>Review</Button>
                      )}
                      {e.status !== "rejected" && (
                        <Button size="sm" variant="ghost" className="text-destructive"
                          onClick={() => statusMut.mutate({ id: e.id, status: "rejected" })}
                          disabled={statusMut.isPending}>Reject</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No expenses logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LogExpenseSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen]           = useState(false);
  const [staff, setStaff]         = useState("");
  const [category, setCategory]   = useState("Other");
  const [description, setDescription] = useState("");
  const [amount, setAmount]       = useState("");

  const m = useMutation({
    mutationFn: () => logExpense({
      staff, category, description, amount: parseFloat(amount),
    }),
    onSuccess: () => {
      toast.success("Expense logged");
      setOpen(false); setStaff(""); setDescription(""); setAmount("");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Log expense</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Log branch expense</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Staff member *</Label>
            <Input value={staff} onChange={e => setStaff(e.target.value)} placeholder="Who incurred this expense" />
          </div>
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the expense" />
          </div>
          <div className="space-y-2">
            <Label>Amount (KES) *</Label>
            <Input type="number" min={0} step={0.5} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
          </div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !staff.trim() || !amount}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Log expense
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
