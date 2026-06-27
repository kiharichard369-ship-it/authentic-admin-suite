import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Users as UsersIcon, Truck, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchShops } from "@/lib/platform-data";
import { shops as _mock_shops } from "@/lib/mock-data";
import { useLive } from "@/lib/use-live";

export const Route = createFileRoute("/super-admin/shops")({
  head: () => ({ meta: [{ title: "Shop Branches — Super Admin" }] }),
  component: Shops,
});

async function createShop(input: { name: string; location: string; notes: string }) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("platform_shops").insert({
    name: input.name, location: input.location, notes: input.notes, status: "active",
  });
  if (error) throw error;
}

async function toggleShopStatus(id: string, current: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const next = current === "active" ? "inactive" : "active";
  const { error } = await supabase.from("platform_shops").update({ status: next }).eq("id", id);
  if (error) throw error;
}

function Shops() {
  const qc = useQueryClient();
  const { data: shops = _mock_shops, isLoading } = useQuery({
    queryKey: ["platform", "shops"],
    queryFn: fetchShops,
  });

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => toggleShopStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform", "shops"] }); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Water Retail shops"
        subtitle="Add branches, assign staff and manage shop status."
        actions={<AddShopSheet onCreated={() => qc.invalidateQueries({ queryKey: ["platform", "shops"] })} />}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shops.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="font-display">{s.name}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" /> {s.location}
                  </div>
                </div>
                <Badge className={s.status === "active" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                  {s.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                <Row label="Admin"    value={s.admin} />
                <Row label="Cashiers" value={<span className="inline-flex items-center"><UsersIcon className="h-3 w-3 mr-1" />{s.cashiers}</span>} />
                <Row label="Drivers"  value={<span className="inline-flex items-center"><Truck className="h-3 w-3 mr-1" />{s.drivers}</span>} />
                <Row label="Created"  value={s.created} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm" variant="outline">Assign staff</Button>
                <Button size="sm" variant="ghost" className="text-destructive ml-auto"
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate({ id: s.id, status: s.status })}>
                  {s.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {shops.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">No shops yet. Create the first branch.</div>
        )}
      </div>
    </div>
  );
}

function AddShopSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const m = useMutation({
    mutationFn: () => createShop({ name, location, notes }),
    onSuccess: () => {
      toast.success(`Branch "${name}" created`);
      setOpen(false); setName(""); setLocation(""); setNotes("");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add branch</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Add new shop branch</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Shop name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kileleshwa Branch" /></div>
          <div className="space-y-2"><Label>Location / address *</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kileleshwa, Nairobi" /></div>
          <div className="space-y-2"><Label>Notes (optional)</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !name || !location}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create branch
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
