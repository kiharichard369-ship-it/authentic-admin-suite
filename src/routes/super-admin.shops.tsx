import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Users as UsersIcon, Truck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shops as _mock_shops } from "@/lib/mock-data";
import { fetchShops } from "@/lib/platform-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/super-admin/shops")({
  head: () => ({ meta: [{ title: "Shop Branches — Super Admin" }] }),
  component: Shops,
});

function Shops() {
  const shops = useLive(["platform","shops"] as const, fetchShops, _mock_shops as any);
  return (
    <div>
      <PageHeader
        title="Water Retail shops"
        subtitle="Add branches, assign staff and reassign drivers between shops."
        actions={
          <Sheet>
            <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add branch</Button></SheetTrigger>
            <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
              <SheetHeader className="mb-6 px-0"><SheetTitle>Add new shop branch</SheetTitle></SheetHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Shop name</Label><Input placeholder="e.g. Lavington Branch" /></div>
                <div className="space-y-2"><Label>Location / address</Label><Input placeholder="e.g. Lavington, Nairobi" /></div>
                <div className="space-y-2">
                  <Label>Assign admin</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Existing water admin or create new" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ Create new admin account</SelectItem>
                      <SelectItem value="mary">Mary Wanjiku</SelectItem>
                      <SelectItem value="peter">Peter Otieno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Notes (optional)</Label><Textarea rows={3} /></div>
              </div>
              <SheetFooter className="mt-8 px-0"><Button className="w-full">Create branch</Button></SheetFooter>
            </SheetContent>
          </Sheet>
        }
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
                <Row label="Admin" value={s.admin} />
                <Row label="Cashiers" value={<span className="inline-flex items-center"><UsersIcon className="h-3 w-3 mr-1" />{s.cashiers}</span>} />
                <Row label="Drivers" value={<span className="inline-flex items-center"><Truck className="h-3 w-3 mr-1" />{s.drivers}</span>} />
                <Row label="Created" value={s.created} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm" variant="outline">Assign staff</Button>
                <Button size="sm" variant="outline">Analytics</Button>
                <Button size="sm" variant="ghost" className="text-destructive ml-auto">
                  {s.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>
  );
}
