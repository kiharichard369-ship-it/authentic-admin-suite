import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { UserPlus, Phone, Loader2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fetchCashiers } from "@/lib/water-data";
import { cashiers as _mock_cashiers } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/cashiers")({
  head: () => ({ meta: [{ title: "Cashiers — Water Retail" }] }),
  component: CashiersPage,
});

const fmt  = (n: number) => "KES " + n.toLocaleString();
const init = (n: string) => n.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

const ALL_SHIFTS = ["Morning", "Afternoon", "Evening", "Night"];

// ── mutations ────────────────────────────────────────────────────────────────

async function upsertCashier(input: {
  id?: string; name: string; phone: string; shifts: string[];
}) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const vendorId = getSession()?.vendorId;
  if (!vendorId) throw new Error("No vendor session");

  const payload = {
    vendor_id: vendorId,
    name:      input.name,
    phone:     input.phone || null,
    shift:     input.shifts,   // text[] column
  };

  if (input.id) {
    const { error } = await supabase.from("water_cashiers")
      .update({ name: payload.name, phone: payload.phone, shift: payload.shift })
      .eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("water_cashiers")
      .insert({ ...payload, status: "off" });
    if (error) throw error;
  }
}

async function toggleShift(id: string, current: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const next = current === "on_shift" ? "off" : "on_shift";
  const { error } = await supabase.from("water_cashiers").update({ status: next }).eq("id", id);
  if (error) throw error;
}

async function removeCashier(id: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("water_cashiers").delete().eq("id", id);
  if (error) throw error;
}

// ── helpers to normalise the shift column (array OR legacy string) ────────────
function toShiftArray(shift: unknown): string[] {
  if (Array.isArray(shift)) return shift as string[];
  if (typeof shift === "string" && shift) return [shift];
  return [];
}

// ── page ─────────────────────────────────────────────────────────────────────

function CashiersPage() {
  const qc = useQueryClient();
  const { data: cashiers = _mock_cashiers, isLoading } = useQuery({
    queryKey: ["water", "cashiers"],
    queryFn:  fetchCashiers,
  });

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => toggleShift(id, status),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["water", "cashiers"] }); toast.success("Shift updated"); },
    onError:    (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeCashier(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["water", "cashiers"] }); toast.success("Cashier removed"); },
    onError:    (e: Error) => toast.error(e.message),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["water", "cashiers"] });
  const onShift = cashiers.filter(c => c.status === "on_shift").length;

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Cashiers"
        subtitle={`${cashiers.length} cashiers · ${onShift} on shift now`}
        actions={<CashierSheet onSaved={refresh} />}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cashiers.map((c) => {
          const shifts = toShiftArray((c as any).shift);
          return (
            <Card key={c.id}>
              <CardContent className="p-5">
                {/* Header row */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {init(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      {c.phone ? <><Phone className="h-3 w-3" />{c.phone}</> : "No phone"}
                    </div>
                  </div>
                  <Badge variant={c.status === "on_shift" ? "default" : "secondary"}>
                    {c.status === "on_shift" ? "On shift" : "Off"}
                  </Badge>
                </div>

                {/* Assigned shifts */}
                <div className="mb-3">
                  <div className="text-xs text-muted-foreground mb-1">Assigned shifts</div>
                  {shifts.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {shifts.map(s => (
                        <Badge key={s} variant="outline" className="text-[11px]">{s}</Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">None assigned</span>
                  )}
                </div>

                {/* Today's stats */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Sales today</div>
                    <div className="font-display text-lg">{fmt(c.todaySales)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Transactions</div>
                    <div className="font-display text-lg">{c.txns}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1"
                    onClick={() => toggle.mutate({ id: c.id, status: c.status })}
                    disabled={toggle.isPending}>
                    {c.status === "on_shift" ? "End shift" : "Start shift"}
                  </Button>
                  <CashierSheet cashier={{ ...c, shifts }} onSaved={refresh} />
                  <Button variant="ghost" size="sm" className="text-destructive px-2"
                    onClick={() => { if (confirm(`Remove ${c.name}?`)) remove.mutate(c.id); }}
                    disabled={remove.isPending}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {cashiers.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            No cashiers yet. Add your first cashier.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add / Edit sheet ──────────────────────────────────────────────────────────

function CashierSheet({
  cashier,
  onSaved,
}: {
  cashier?: { id: string; name: string; phone: string; shifts: string[] };
  onSaved: () => void;
}) {
  const isEdit = !!cashier;

  const [open,   setOpen]   = useState(false);
  const [name,   setName]   = useState(cashier?.name   ?? "");
  const [phone,  setPhone]  = useState(cashier?.phone  ?? "");
  const [shifts, setShifts] = useState<string[]>(cashier?.shifts ?? []);

  const resetForm = () => {
    setName(cashier?.name   ?? "");
    setPhone(cashier?.phone ?? "");
    setShifts(cashier?.shifts ?? []);
  };

  const toggleShiftSelection = (s: string) =>
    setShifts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const m = useMutation({
    mutationFn: () => upsertCashier({ id: cashier?.id, name, phone, shifts }),
    onSuccess: () => {
      toast.success(isEdit ? `${name} updated` : `${name} added`);
      setOpen(false);
      resetForm();
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) resetForm(); }}>
      <SheetTrigger asChild>
        {isEdit
          ? <Button size="sm" variant="ghost" className="px-2"><Pencil className="h-4 w-4" /></Button>
          : <Button><UserPlus className="h-4 w-4 mr-1" /> Add cashier</Button>}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0">
          <SheetTitle>{isEdit ? `Edit — ${cashier!.name}` : "Add cashier"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Full name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amina Waweru" />
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 700 000 000" />
          </div>

          <div className="space-y-3">
            <Label>Assigned shifts</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Select all shifts this cashier can work — they can be on multiple shifts.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ALL_SHIFTS.map(s => (
                <label
                  key={s}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors
                    ${shifts.includes(s) ? "border-primary bg-primary/5" : "hover:bg-secondary"}`}
                >
                  <Checkbox
                    checked={shifts.includes(s)}
                    onCheckedChange={() => toggleShiftSelection(s)}
                  />
                  <span className="text-sm font-medium">{s}</span>
                </label>
              ))}
            </div>
            {shifts.length === 0 && (
              <p className="text-xs text-destructive">Select at least one shift.</p>
            )}
          </div>
        </div>

        <SheetFooter className="mt-8 px-0">
          <Button
            className="w-full"
            onClick={() => m.mutate()}
            disabled={m.isPending || !name.trim() || shifts.length === 0}
          >
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {isEdit ? "Save changes" : "Add cashier"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
