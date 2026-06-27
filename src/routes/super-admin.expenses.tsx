import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchPlatformExpenses } from "@/lib/platform-data";
import { expenses as _mock_expenses } from "@/lib/mock-data";

export const Route = createFileRoute("/super-admin/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Super Admin" }] }),
  component: Expenses,
});

async function rejectExpense(id: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("platform_expenses").update({ status: "rejected" }).eq("id", id);
  if (error) throw error;
}

async function reviewExpense(id: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("platform_expenses").update({ status: "reviewed" }).eq("id", id);
  if (error) throw error;
}

function Expenses() {
  const qc = useQueryClient();
  const { data: expenses = _mock_expenses, isLoading } = useQuery({
    queryKey: ["platform", "expenses"],
    queryFn: fetchPlatformExpenses,
  });

  const reject = useMutation({
    mutationFn: (id: string) => rejectExpense(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform", "expenses"] }); toast.success("Expense rejected"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: (id: string) => reviewExpense(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform", "expenses"] }); toast.success("Marked as reviewed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const total   = expenses.filter((e) => e.status !== "rejected").reduce((s, e) => s + e.amount, 0);
  const fuel    = expenses.filter((e) => e.category === "Fuel"    && e.status !== "rejected").reduce((s, e) => s + e.amount, 0);
  const repairs = expenses.filter((e) => e.category === "Repairs" && e.status !== "rejected").reduce((s, e) => s + e.amount, 0);
  const other   = expenses.filter((e) => e.category === "Other"   && e.status !== "rejected").reduce((s, e) => s + e.amount, 0);

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Expense overview"
        subtitle="Driver and shop expenses across the entire platform."
        actions={
          <>
            <Button variant="outline"><FileText className="h-4 w-4 mr-1" /> PDF</Button>
            <Button><Download className="h-4 w-4 mr-1" /> CSV</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Sum label="Total fuel"    value={fuel} />
        <Sum label="Total repairs" value={repairs} />
        <Sum label="Other"         value={other} />
        <Sum label="Grand total"   value={total} highlight />
      </div>
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select defaultValue="30d">
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead><TableHead>Driver / Staff</TableHead><TableHead>Shop</TableHead>
              <TableHead>Category</TableHead><TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id} className={e.status === "rejected" ? "opacity-60" : ""}>
                <TableCell className="text-muted-foreground tabular-nums">{e.date}</TableCell>
                <TableCell className="font-medium">{e.staff}</TableCell>
                <TableCell>{e.shop}</TableCell>
                <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">KES {e.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={
                    e.status === "logged"   ? "bg-warning text-warning-foreground" :
                    e.status === "reviewed" ? "bg-success text-success-foreground" :
                    "bg-destructive text-destructive-foreground"
                  }>{e.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {e.status === "logged" && (
                      <Button size="sm" variant="outline" onClick={() => review.mutate(e.id)} disabled={review.isPending}>Review</Button>
                    )}
                    {e.status !== "rejected" && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => reject.mutate(e.id)} disabled={reject.isPending}>Reject</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Sum({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary" : ""}>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-2xl mt-1 tabular-nums">KES {value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
