import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { UserPlus, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchCashiers } from "@/lib/water-data";
import { cashiers as _mock_cashiers } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/cashiers")({
  head: () => ({ meta: [{ title: "Cashiers — Water Retail" }] }),
  component: CashiersPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();
const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("");

async function addCashier(input: { name: string; phone: string; shift: string }) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("water_cashiers").insert({ name: input.name, phone: input.phone, shift: input.shift, status: "off" });
  if (error) throw error;
}

async function toggleCashierShift(id: string, current: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const next = current === "on_shift" ? "off" : "on_shift";
  const { error } = await supabase.from("water_cashiers").update({ status: next }).eq("id", id);
  if (error) throw error;
}

function CashiersPage() {
  const qc = useQueryClient();
  const { data: cashiers = _mock_cashiers, isLoading } = useQuery({
    queryKey: ["water", "cashiers"],
    queryFn: fetchCashiers,
  });

  const toggleShift = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => toggleCashierShift(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["water", "cashiers"] }); toast.success("Shift status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Cashiers"
        subtitle={`${cashiers.length} cashiers · ${cashiers.filter(c => c.status === "on_shift").length} on shift now`}
        actions={<AddCashierSheet onCreated={() => qc.invalidateQueries({ queryKey: ["water", "cashiers"] })} />}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cashiers.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">{initials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </div>
                </div>
                <Badge variant={c.status === "on_shift" ? "default" : "secondary"}>
                  {c.status === "on_shift" ? "On shift" : "Off"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-3">Shift: {c.shift || "—"}</div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Sales today</div>
                  <div className="font-display text-lg">{fmt(c.todaySales)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Transactions</div>
                  <div className="font-display text-lg">{c.txns}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1"
                  onClick={() => toggleShift.mutate({ id: c.id, status: c.status })}
                  disabled={toggleShift.isPending}>
                  {c.status === "on_shift" ? "End shift" : "Start shift"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddCashierSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shift, setShift] = useState("Morning");

  const m = useMutation({
    mutationFn: () => addCashier({ name, phone, shift }),
    onSuccess: () => { toast.success(`Cashier "${name}" added`); setOpen(false); setName(""); setPhone(""); onCreated(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><UserPlus className="h-4 w-4 mr-1" /> Add cashier</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Add cashier</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Full name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amina Waweru" /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" /></div>
          <div className="space-y-2">
            <Label>Default shift</Label>
            <Select value={shift} onValueChange={setShift}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Morning">Morning</SelectItem>
                <SelectItem value="Afternoon">Afternoon</SelectItem>
                <SelectItem value="Evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !name}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Add cashier
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
