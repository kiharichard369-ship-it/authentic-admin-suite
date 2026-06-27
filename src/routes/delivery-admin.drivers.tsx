import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Star, Phone, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchDrivers } from "@/lib/delivery-data";
import { drivers as _mock_drivers } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/drivers")({
  head: () => ({ meta: [{ title: "Drivers — Water Delivery" }] }),
  component: DriversPage,
});

const variant: Record<string, "default" | "secondary" | "outline"> = {
  on_route: "default", loading: "secondary", off: "outline",
};

async function addDriver(input: { name: string; phone: string; vehicle: string }) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("delivery_drivers_full").insert({
    name: input.name, phone: input.phone, vehicle: input.vehicle, trips: 0, rating: 5.0, status: "off",
  });
  if (error) throw error;
}

async function toggleDriverStatus(id: string, current: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const next = current === "off" ? "loading" : "off";
  const { error } = await supabase.from("delivery_drivers_full").update({ status: next }).eq("id", id);
  if (error) throw error;
}

function DriversPage() {
  const qc = useQueryClient();
  const { data: drivers = _mock_drivers, isLoading } = useQuery({
    queryKey: ["delivery", "drivers"],
    queryFn: fetchDrivers,
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => toggleDriverStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["delivery", "drivers"] }); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Drivers"
        subtitle={`${drivers.length} drivers · ${drivers.filter(d => d.status !== "off").length} on duty`}
        actions={<AddDriverSheet onCreated={() => qc.invalidateQueries({ queryKey: ["delivery", "drivers"] })} />}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {drivers.map((d) => (
          <Card key={d.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {d.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{d.phone}</div>
                </div>
                <Badge variant={variant[d.status] ?? "outline"} className="capitalize">{d.status.replace("_", " ")}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                <div><div className="font-display text-xl">{d.trips}</div><div className="text-xs text-muted-foreground">trips</div></div>
                <div><div className="font-display text-xl flex items-center justify-center gap-1"><Star className="h-4 w-4 text-accent" />{d.rating}</div><div className="text-xs text-muted-foreground">rating</div></div>
                <div><div className="font-display text-sm mt-1">{d.vehicle || "—"}</div><div className="text-xs text-muted-foreground">vehicle</div></div>
              </div>
              <Button size="sm" variant="outline" className="w-full"
                disabled={toggleStatus.isPending}
                onClick={() => toggleStatus.mutate({ id: d.id, status: d.status })}>
                {d.status === "off" ? "Set to loading" : "Set to off duty"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddDriverSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");

  const m = useMutation({
    mutationFn: () => addDriver({ name, phone, vehicle }),
    onSuccess: () => { toast.success(`Driver "${name}" added`); setOpen(false); setName(""); setPhone(""); setVehicle(""); onCreated(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add driver</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Add driver</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Full name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. James Kamau" /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" /></div>
          <div className="space-y-2"><Label>Vehicle registration</Label><Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. KBZ 001A" /></div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !name}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Add driver
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
