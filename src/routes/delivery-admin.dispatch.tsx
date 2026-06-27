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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchDispatches, fetchDrivers } from "@/lib/delivery-data";
import { dispatches as _mock_dispatches, drivers as _mock_drivers } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch tracking — Water Delivery" }] }),
  component: DispatchPage,
});

async function createDispatch(input: { product: string; driver: string; vehicle: string; customer: string; litres: number; payment: string }) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("delivery_dispatches_full").insert({
    product: input.product, driver: input.driver, vehicle: input.vehicle,
    customer: input.customer, litres: input.litres, payment: input.payment,
    status: "dispatched", paid: false, dispatched_at: new Date().toISOString(),
  });
  if (error) throw error;
}

async function markDelivered(id: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("delivery_dispatches_full")
    .update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

async function markReturned(id: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("delivery_dispatches_full")
    .update({ status: "returned", returned_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

async function markPaid(id: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("delivery_dispatches_full").update({ paid: true }).eq("id", id);
  if (error) throw error;
}

function DispatchPage() {
  const qc = useQueryClient();
  const { data: dispatches = _mock_dispatches, isLoading } = useQuery({ queryKey: ["delivery", "dispatches"], queryFn: fetchDispatches });
  const { data: drivers = _mock_drivers } = useQuery({ queryKey: ["delivery", "drivers"], queryFn: fetchDrivers });

  const mut = (fn: (id: string) => Promise<void>, successMsg: string) => useMutation({
    mutationFn: fn,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["delivery", "dispatches"] }); toast.success(successMsg); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delivered = mut(markDelivered, "Marked as delivered");
  const returned  = mut(markReturned,  "Marked as returned");
  const paid      = mut(markPaid,      "Marked as paid");

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Dispatch tracking"
        subtitle="Product, time of dispatch, time of delivery, time of return."
        actions={<NewDispatchSheet drivers={drivers} onCreated={() => qc.invalidateQueries({ queryKey: ["delivery", "dispatches"] })} />}
      />
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead><TableHead>Driver / Vehicle</TableHead><TableHead>Customer</TableHead>
                <TableHead className="text-right">Litres</TableHead><TableHead className="text-right">Out</TableHead>
                <TableHead className="text-right">Delivered</TableHead><TableHead className="text-right">Returned</TableHead>
                <TableHead>Status</TableHead><TableHead>Payment</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatches.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.product}</TableCell>
                  <TableCell className="text-sm"><div>{d.driver}</div><div className="text-xs text-muted-foreground">{d.vehicle}</div></TableCell>
                  <TableCell>{d.customer}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.litres} L</TableCell>
                  <TableCell className="text-right tabular-nums">{d.dispatchedAt}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.deliveredAt}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.returnedAt}</TableCell>
                  <TableCell><Badge variant={d.status === "returned" ? "secondary" : "default"}>{d.status}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={d.paid ? "outline" : "destructive"} className="text-[10px]">
                      {d.payment} · {d.paid ? "Paid" : "Unpaid"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {d.status === "dispatched" && <Button size="sm" variant="outline" onClick={() => delivered.mutate(d.id)} disabled={delivered.isPending}>Delivered</Button>}
                      {d.status === "delivered"  && <Button size="sm" variant="outline" onClick={() => returned.mutate(d.id)}  disabled={returned.isPending}>Returned</Button>}
                      {!d.paid && <Button size="sm" variant="ghost" onClick={() => paid.mutate(d.id)} disabled={paid.isPending}>Mark paid</Button>}
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

function NewDispatchSheet({ drivers, onCreated }: { drivers: any[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState("");
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [customer, setCustomer] = useState("");
  const [litres, setLitres] = useState("");
  const [payment, setPayment] = useState("cash");

  const m = useMutation({
    mutationFn: () => createDispatch({ product, driver, vehicle, customer, litres: parseInt(litres), payment }),
    onSuccess: () => {
      toast.success("Dispatch created");
      setOpen(false); setProduct(""); setDriver(""); setVehicle(""); setCustomer(""); setLitres("");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedDriver = drivers.find(d => d.name === driver);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New dispatch</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-6 px-0"><SheetTitle>New dispatch</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Product *</Label><Input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g. 5,000L Water" /></div>
          <div className="space-y-2">
            <Label>Driver *</Label>
            <Select value={driver} onValueChange={(v) => {
              setDriver(v);
              const d = drivers.find(d => d.name === v);
              if (d) setVehicle(d.vehicle || "");
            }}>
              <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
              <SelectContent>
                {drivers.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Vehicle</Label><Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Auto-filled from driver" /></div>
          <div className="space-y-2"><Label>Customer *</Label><Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name / estate" /></div>
          <div className="space-y-2"><Label>Litres *</Label><Input type="number" min={0} value={litres} onChange={(e) => setLitres(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !product || !driver || !customer || !litres}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Dispatch
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
