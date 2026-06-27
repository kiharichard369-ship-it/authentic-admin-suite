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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchBranchExpenses } from "@/lib/water-data";
import { branchExpenses as _mock_branchExpenses } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Water Retail" }] }),
  component: ExpensesPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();
const tone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  logged: "outline", reviewed: "secondary", rejected: "destructive",
};

async function logExpense(input: { staff: string; category: string; description: string; amount: number }) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("water_branch_expenses").insert({
    staff: input.staff, category: input.category,
    description: input.description, amount: input.amount, status: "logged",
  });
  if (error) throw error;
}

async function updateExpenseStatus(id: string, status: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("water_branch_expenses").update({ status }).eq("id", id);
  if (error) throw error;
}

function ExpensesPage() {
  const qc = useQueryClient();
  const { data: branchExpenses = _mock_branchExpenses, isLoading } = useQuery({
    queryKey: ["water", "branchExpenses"],
    queryFn: fetchBranchExpenses,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateExpenseStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["water", "branchExpenses"] }); toast.success("Expense updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const total   = branchExpenses.filter((e) => e.status !== "rejected").reduce((a, b) => a + b.amount, 0);
  const pending = branchExpenses.filter((e) => e.status === "logged").length;

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Branch Expenses"
        subtitle="Operational costs logged at this shop."
        actions={<LogExpenseSheet onCreated={() => qc.invalidateQueries({ queryKey: ["water", "branchExpenses"] })} />}
      />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total this period" value={fmt(total)} />
        <Stat label="Entries" value={String(branchExpenses.length)} />
        <Stat label="Awaiting review" value={String(pending)} />
      </div>
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Staff</TableHead><TableHead>Category</TableHead>
                <TableHead>Description</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchExpenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground">{e.date}</TableCell>
                  <TableCell>{e.staff}</TableCell>
                  <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate">{e.description}</TableCell>
                  <TableCell><Badge variant={tone[e.status]}>{e.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fmt(e.amount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {e.status === "logged" && (
                        <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ id: e.id, status: "reviewed" })} disabled={statusMut.isPending}>Review</Button>
                      )}
                      {e.status !== "rejected" && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => statusMut.mutate({ id: e.id, status: "rejected" })} disabled={statusMut.isPending}>Reject</Button>
                      )}
                    </div>
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

function LogExpenseSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState("");
  const [category, setCategory] = useState("Other");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const m = useMutation({
    mutationFn: () => logExpense({ staff, category, description, amount: parseFloat(amount) }),
    onSuccess: () => { toast.success("Expense logged"); setOpen(false); setStaff(""); setDescription(""); setAmount(""); onCreated(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Log expense</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Log branch expense</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Staff member *</Label><Input value={staff} onChange={(e) => setStaff(e.target.value)} placeholder="Name of person who incurred this" /></div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Fuel">Fuel</SelectItem>
                <SelectItem value="Supplies">Supplies</SelectItem>
                <SelectItem value="Repairs">Repairs</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="space-y-2"><Label>Amount (KES) *</Label><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !staff || !amount}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Log expense
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </CardContent></Card>
  );
}
