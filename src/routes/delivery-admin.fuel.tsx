import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fuelLogs as _mock_fuelLogs } from "@/lib/delivery-mock";
import { fetchFuelLogs } from "@/lib/delivery-data";


import { useLive } from "@/lib/use-live";
export const Route = createFileRoute("/delivery-admin/fuel")({
  head: () => ({ meta: [{ title: "Fuel — Water Delivery" }] }),
  component: FuelPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function FuelPage() {
  const fuelLogs = useLive(["delivery","fuelLogs"] as const, fetchFuelLogs, _mock_fuelLogs);
  const total = fuelLogs.reduce((s,f)=>s+f.amount,0);
  const litres = fuelLogs.reduce((s,f)=>s+f.litres,0);
  return (
    <div>
      <PageHeader title="Fuel & expenses" subtitle="Diesel logs, repairs and per-trip costs" actions={<Button>+ Log expense</Button>} />
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Stat label="Total this period" value={fmt(total)} highlight />
        <Stat label="Litres pumped" value={`${litres} L`} />
        <Stat label="Avg / litre" value={fmt(Math.round(total/litres))} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Ref</TableHead><TableHead>Date</TableHead><TableHead>Driver</TableHead><TableHead>Vehicle</TableHead><TableHead>Litres</TableHead><TableHead>Amount</TableHead><TableHead>Station</TableHead></TableRow></TableHeader>
            <TableBody>
              {fuelLogs.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.id}</TableCell>
                  <TableCell>{f.date}</TableCell>
                  <TableCell>{f.driver}</TableCell>
                  <TableCell>{f.vehicle}</TableCell>
                  <TableCell className="tabular-nums">{f.litres} L</TableCell>
                  <TableCell className="tabular-nums font-medium">{fmt(f.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{f.station}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-3xl mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}
