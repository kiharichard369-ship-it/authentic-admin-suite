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
import { Fuel, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchFuelLogs, fetchDrivers } from "@/lib/delivery-data";
import { fuelLogs as _mock_fuelLogs, drivers as _mock_drivers } from "@/lib/delivery-mock";

export const Route = createFileRoute("/delivery-admin/fuel")({
  head: () => ({ meta: [{ title: "Fuel log — Water Delivery" }] }),
  component: FuelPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

async function logFuel(input: {
  driver: string; vehicle: string; litres: number; amount: number; station: string;
}) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("delivery_fuel_logs").insert({
    driver: input.driver,
    vehicle: input.vehicle,
    litres: input.litres,
    amount: input.amount,
    station: input.station,
    date: new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
}

function FuelPage() {
  const qc = useQueryClient();

  const { data: fuelLogs = _mock_fuelLogs, isLoading } = useQuery({
    queryKey: ["delivery", "fuelLogs"],
    queryFn: fetchFuelLogs,
  });
  const { data: drivers = _mock_drivers } = useQuery({
    queryKey: ["delivery", "drivers"],
    queryFn: fetchDrivers,
  });

  const totalLitres = fuelLogs.reduce((a, b) => a + b.litres, 0);
  const totalCost   = fuelLogs.reduce((a, b) => a + b.amount, 0);
  const avgPerLitre = totalLitres ? Math.round(totalCost / totalLitres) : 0;

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Fuel log"
        subtitle="Every fuelling event across the entire fleet."
        actions={
          <LogFuelSheet
            drivers={drivers}
            onCreated={() => qc.invalidateQueries({ queryKey: ["delivery", "fuelLogs"] })}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total litres"       value={`${totalLitres.toLocaleString()} L`} />
        <Stat label="Total fuel spend"   value={fmt(totalCost)} highlight />
        <Stat label="Avg per litre"      value={fmt(avgPerLitre)} />
      </div>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Litres</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Station</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelLogs.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="text-muted-foreground tabular-nums">{f.date}</TableCell>
                  <TableCell className="font-medium">{f.driver}</TableCell>
                  <TableCell><Badge variant="secondary">{f.vehicle}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{f.litres} L</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{fmt(f.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{f.station}</TableCell>
                </TableRow>
              ))}
              {fuelLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No fuel entries yet. Log the first one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LogFuelSheet({ drivers, onCreated }: { drivers: any[]; onCreated: () => void }) {
  const [open, setOpen]     = useState(false);
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [litres, setLitres] = useState("");
  const [amount, setAmount] = useState("");
  const [station, setStation] = useState("");

  const m = useMutation({
    mutationFn: () =>
      logFuel({
        driver, vehicle,
        litres: parseFloat(litres),
        amount: parseFloat(amount),
        station,
      }),
    onSuccess: () => {
      toast.success("Fuel entry logged");
      setOpen(false);
      setDriver(""); setVehicle(""); setLitres(""); setAmount(""); setStation("");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> Log fuel</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Log fuel expense</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Driver *</Label>
            <Select value={driver} onValueChange={(v) => {
              setDriver(v);
              const d = drivers.find((d) => d.name === v);
              if (d) setVehicle(d.vehicle || "");
            }}>
              <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Auto-filled from driver" />
          </div>
          <div className="space-y-2">
            <Label>Litres fuelled *</Label>
            <Input type="number" min={0} step={0.1} value={litres} onChange={(e) => setLitres(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Amount paid (KES) *</Label>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Petrol station</Label>
            <Input value={station} onChange={(e) => setStation(e.target.value)} placeholder="e.g. Total Nakuru" />
          </div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button
            className="w-full"
            onClick={() => m.mutate()}
            disabled={m.isPending || !driver || !litres || !amount}
          >
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Log fuel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          {highlight && <Fuel className="h-4 w-4 text-accent" />}
        </div>
        <div className="font-display text-2xl mt-2 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
