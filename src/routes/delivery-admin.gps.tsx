import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { MapPin, Wifi } from "lucide-react";
import { gpsVehicles as _mock_gpsVehicles } from "@/lib/delivery-mock";
import { fetchGpsVehicles } from "@/lib/delivery-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/delivery-admin/gps")({
  head: () => ({ meta: [{ title: "GPS live map — Water Delivery" }] }),
  component: GpsPage,
});

function GpsPage() {
  const gpsVehicles = useLive(["delivery","gpsVehicles"] as const, fetchGpsVehicles, _mock_gpsVehicles as any);
  return (
    <div>
      <PageHeader
        title="GPS live map"
        subtitle="Pluggable adapter — production GPS provider to be confirmed with client."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="relative h-[480px] bg-gradient-to-br from-muted via-secondary to-muted">
            {/* Faux map grid */}
            <div className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }} />
            {gpsVehicles.map((v, i) => (
              <div key={v.id} className="absolute"
                style={{
                  left: `${20 + i * 25}%`,
                  top: `${30 + (i % 2) * 25}%`,
                }}
              >
                <div className={`relative ${v.status === "moving" ? "animate-pulse" : ""}`}>
                  <div className="h-4 w-4 rounded-full bg-primary ring-4 ring-primary/30" />
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card border rounded px-2 py-1 text-xs shadow">
                    {v.id} · {v.driver}
                  </div>
                </div>
              </div>
            ))}
            <Badge variant="secondary" className="absolute top-4 left-4"><Wifi className="h-3 w-3 mr-1" /> Adapter: mock</Badge>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Vehicles</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {gpsVehicles.map((v) => (
              <div key={v.id} className="border-b pb-2 last:border-0 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{v.id}</div>
                  <Badge variant={v.status === "moving" ? "default" : "secondary"}>{v.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{v.driver}</div>
                <div className="text-xs text-muted-foreground tabular-nums mt-1">
                  {v.lat.toFixed(4)}, {v.lng.toFixed(4)} · {v.speed} km/h · {v.heading} · last ping {v.lastPing}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
