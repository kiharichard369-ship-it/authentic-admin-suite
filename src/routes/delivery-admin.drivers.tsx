import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Star, Phone } from "lucide-react";
import { drivers as _mock_drivers } from "@/lib/delivery-mock";
import { fetchDrivers } from "@/lib/delivery-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/delivery-admin/drivers")({
  head: () => ({ meta: [{ title: "Drivers — Water Delivery" }] }),
  component: DriversPage,
});

const variant: Record<string, "default"|"secondary"|"outline"> = { on_route: "default", loading: "secondary", off: "outline" };

function DriversPage() {
  const drivers = useLive(["delivery","drivers"] as const, fetchDrivers, _mock_drivers);
  return (
    <div>
      <PageHeader title="Drivers" subtitle={`${drivers.length} drivers · ${drivers.filter(d=>d.status!=="off").length} on duty`} actions={<Button>+ Add driver</Button>} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {drivers.map(d => (
          <Card key={d.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar><AvatarFallback className="bg-primary text-primary-foreground">{d.name.split(" ").map(p=>p[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{d.phone}</div>
                </div>
                <Badge variant={variant[d.status]} className="capitalize">{d.status.replace("_"," ")}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div><div className="font-display text-xl">{d.trips}</div><div className="text-xs text-muted-foreground">trips</div></div>
                <div><div className="font-display text-xl flex items-center justify-center gap-1"><Star className="h-4 w-4 text-accent" />{d.rating}</div><div className="text-xs text-muted-foreground">rating</div></div>
                <div><div className="font-display text-xl">{d.vehicle === "—" ? "—" : "✓"}</div><div className="text-xs text-muted-foreground">{d.vehicle}</div></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
