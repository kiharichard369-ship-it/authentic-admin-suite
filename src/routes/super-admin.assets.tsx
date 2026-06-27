import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ArrowRightLeft, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchAssets } from "@/lib/platform-data";
import { assets as _mock_assets } from "@/lib/mock-data";

export const Route = createFileRoute("/super-admin/assets")({
  head: () => ({ meta: [{ title: "Assets — Super Admin" }] }),
  component: Assets,
});

async function addAsset(input: { name: string; type: string; shop: string; mileage: string }) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("platform_assets").insert({
    name: input.name, type: input.type, shop: input.shop,
    mileage: input.mileage ? parseInt(input.mileage) : null,
    status: "active", added: new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
}

async function reassignAsset(id: string, shop: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("platform_assets").update({ shop }).eq("id", id);
  if (error) throw error;
}

function Assets() {
  const qc = useQueryClient();
  const { data: assets = _mock_assets, isLoading } = useQuery({
    queryKey: ["platform", "assets"],
    queryFn: fetchAssets,
  });

  const reassign = useMutation({
    mutationFn: ({ id, shop }: { id: string; shop: string }) => reassignAsset(id, shop),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform", "assets"] }); toast.success("Asset reassigned"); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Asset management"
        subtitle="Lorries, equipment and other assets across all shops."
        actions={<AddAssetSheet onCreated={() => qc.invalidateQueries({ queryKey: ["platform", "assets"] })} />}
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead><TableHead>Type</TableHead><TableHead>Shop assigned</TableHead>
              <TableHead>Status</TableHead><TableHead>Mileage</TableHead><TableHead>Last service</TableHead>
              <TableHead>Added</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell><Badge variant="secondary">{a.type}</Badge></TableCell>
                <TableCell>{a.shop}</TableCell>
                <TableCell>
                  <Badge className={
                    a.status === "in_transit" ? "bg-warning text-warning-foreground" :
                    a.status === "active" ? "bg-success text-success-foreground" :
                    "bg-secondary text-secondary-foreground"
                  }>{a.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell className="tabular-nums">{a.mileage ? `${a.mileage.toLocaleString()} km` : "—"}</TableCell>
                <TableCell className="text-muted-foreground">{a.lastService ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{a.added}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" disabled={a.status === "in_transit"}
                    onClick={() => { const shop = prompt("New shop name:"); if (shop) reassign.mutate({ id: a.id, shop }); }}>
                    <ArrowRightLeft className="h-3 w-3 mr-1" /> Reassign
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground mt-3">
        Vehicles cannot be reassigned mid-trip. Mileage and service dates draw from the latest driver entry.
      </p>
    </div>
  );
}

function AddAssetSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Vehicle");
  const [shop, setShop] = useState("");
  const [mileage, setMileage] = useState("");

  const m = useMutation({
    mutationFn: () => addAsset({ name, type, shop, mileage }),
    onSuccess: () => { toast.success("Asset added"); setOpen(false); setName(""); setShop(""); setMileage(""); onCreated(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add asset</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Add new asset</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Asset name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. KCC 001T — 5,000L Lorry" /></div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Vehicle">Vehicle</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Assigned shop</Label><Input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="e.g. Kileleshwa Branch" /></div>
          <div className="space-y-2"><Label>Mileage (km)</Label><Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="0" /></div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !name}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Add asset
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
