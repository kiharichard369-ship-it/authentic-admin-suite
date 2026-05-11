import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { expenses } from "@/lib/mock-data";

export const Route = createFileRoute("/super-admin/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Super Admin" }] }),
  component: Expenses,
});

function Expenses() {
  const total = expenses.filter((e) => e.status !== "rejected").reduce((s, e) => s + e.amount, 0);
  const fuel = expenses.filter((e) => e.category === "Fuel" && e.status !== "rejected").reduce((s, e) => s + e.amount, 0);
  const repairs = expenses.filter((e) => e.category === "Repairs" && e.status !== "rejected").reduce((s, e) => s + e.amount, 0);
  const other = expenses.filter((e) => e.category === "Other" && e.status !== "rejected").reduce((s, e) => s + e.amount, 0);

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
        <Sum label="Total fuel" value={fuel} />
        <Sum label="Total repairs" value={repairs} />
        <Sum label="Other" value={other} />
        <Sum label="Grand total" value={total} highlight />
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
          <Select defaultValue="all-biz"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-biz">All businesses</SelectItem>
              <SelectItem value="water">Water Retail</SelectItem>
              <SelectItem value="delivery">Water Delivery</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-shop"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-shop">All shops</SelectItem>
              <SelectItem value="kil">Kileleshwa</SelectItem>
              <SelectItem value="wes">Westlands</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-cat"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-cat">All categories</SelectItem>
              <SelectItem value="fuel">Fuel</SelectItem>
              <SelectItem value="repairs">Repairs</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Driver / Staff</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
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
                    e.status === "logged" ? "bg-warning text-warning-foreground" :
                    e.status === "reviewed" ? "bg-success text-success-foreground" :
                    "bg-destructive text-destructive-foreground"
                  }>{e.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {e.status !== "rejected" && (
                    <Button size="sm" variant="ghost" className="text-destructive">Reject</Button>
                  )}
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
