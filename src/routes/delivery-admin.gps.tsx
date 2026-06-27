import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { MapPin, Navigation, RefreshCw, Loader2 } from "lucide-react";
import { fetchGpsVehicles } from "@/lib/delivery-data";
import { gpsVehicles as _mock_gps } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/gps")({
  head: () => ({ meta: [{ title: "GPS tracking — Water Delivery" }] }),
  component: GpsPage,
});

function GpsPage() {
  const { data: vehicles = _mock_gps, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["delivery", "gps"],
    queryFn: fetchGpsVehicles,
    refetchInterval: 30_000, // auto-refresh every 30 s
  });

  const moving = vehicles.filter((v) => v.status === "moving").length;

  return (
    <div>
      <PageHeader
        title="GPS tracking"
        subtitle="Live vehicle positions updated every 30 seconds from the GPS device feed."
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <RefreshCw className="h-4 w-4 mr-1" />}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Vehicles tracked" value={String(vehicles.length)} />
        <Stat label="Moving now"       value={String(moving)} />
        <Stat label="Auto-refresh"     value="Every 30 s" />
      </div>

      {/* Map placeholder — wire a real Leaflet/Google Maps component here */}
      <Card className="mb-6">
        <CardContent className="p-0 relative overflow-hidden rounded-lg">
          <div className="bg-secondary/40 h-[340px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <MapPin className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">Map view</p>
            <p className="text-xs max-w-xs text-center">
              Integrate Leaflet or Google Maps here and plot each vehicle using its{" "}
              <code className="text-xs bg-secondary px-1 rounded">lat</code> /{" "}
              <code className="text-xs bg-secondary px-1 rounded">lng</code> from the{" "}
              <code className="text-xs bg-secondary px-1 rounded">delivery_gps_vehicles</code> table.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{v.driver}</CardTitle>
                  <Badge variant={v.status === "moving" ? "default" : "secondary"} className="capitalize">
                    {v.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Lat / Lng"  value={`${v.lat.toFixed(5)}, ${v.lng.toFixed(5)}`} mono />
                <Row label="Speed"      value={`${v.speed} km/h`} />
                <Row label="Heading"    value={v.heading} />
                <Row label="Last ping"  value={v.lastPing} />
                <a
                  href={`https://maps.google.com/?q=${v.lat},${v.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <Navigation className="h-3 w-3 mr-1" /> Open in Maps
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
          {vehicles.length === 0 && (
            <div className="col-span-3 py-16 text-center text-muted-foreground">
              No GPS vehicles in the database yet. Insert rows into{" "}
              <code className="text-xs bg-secondary px-1 rounded">delivery_gps_vehicles</code>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </CardContent></Card>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`font-medium truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
