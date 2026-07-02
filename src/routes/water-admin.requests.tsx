import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { fetchStockRequests } from "@/lib/water-data";
import { stockRequests as _mock_stockRequests } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/requests")({
  head: () => ({ meta: [{ title: "Stock Requests — Water Retail" }] }),
  component: RequestsPage,
});

const tone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline", approved: "secondary", delivered: "default", rejected: "destructive",
};

async function createRequest(items: string, note: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const vendorId = getSession()?.vendorId;
  if (!vendorId) throw new Error("No vendor session");
  const { error } = await supabase.from("water_stock_requests").insert({
    vendor_id: vendorId, branch_id: getSession()?.branchId ?? null,
    items, note: note || null, status: "pending",
  });
  if (error) throw error;
}

async function updateRequestStatus(id: string, status: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("water_stock_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

function RequestsPage() {
  const qc = useQueryClient();
  const { data: stockRequests = _mock_stockRequests, isLoading } = useQuery({
    queryKey: ["water", "stockRequests"],
    queryFn: fetchStockRequests,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateRequestStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["water", "stockRequests"] }); toast.success("Request updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending   = stockRequests.filter(r => r.status === "pending").length;
  const delivered = stockRequests.filter(r => r.status === "delivered").length;

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Stock Requests"
        subtitle="Replenishment requests to the warehouse. Admin can approve or reject."
        actions={<NewRequestSheet onCreated={() => qc.invalidateQueries({ queryKey: ["water", "stockRequests"] })} />}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total requests"    value={String(stockRequests.length)} />
        <Stat label="Pending approval"  value={String(pending)} highlight={pending > 0} />
        <Stat label="Delivered"         value={String(delivered)} />
      </div>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Items requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockRequests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground tabular-nums">{r.date}</TableCell>
                  <TableCell className="font-medium max-w-xs">{r.items}</TableCell>
                  <TableCell><Badge variant={tone[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{r.note || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline"
                            onClick={() => statusMut.mutate({ id: r.id, status: "approved" })}
                            disabled={statusMut.isPending}>Approve</Button>
                          <Button size="sm" variant="ghost" className="text-destructive"
                            onClick={() => statusMut.mutate({ id: r.id, status: "rejected" })}
                            disabled={statusMut.isPending}>Reject</Button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <Button size="sm" variant="outline"
                          onClick={() => statusMut.mutate({ id: r.id, status: "delivered" })}
                          disabled={statusMut.isPending}>Mark delivered</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {stockRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No requests yet.
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

function NewRequestSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen]   = useState(false);
  const [items, setItems] = useState("");
  const [note, setNote]   = useState("");

  const m = useMutation({
    mutationFn: () => createRequest(items, note),
    onSuccess: () => {
      toast.success("Stock request submitted");
      setOpen(false); setItems(""); setNote("");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New request</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6">
        <SheetHeader className="mb-6 px-0"><SheetTitle>New stock request</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Items requested *</Label>
            <Textarea
              rows={3}
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="e.g. 20L caps ×500, 5L PET bottles ×200, 1L refill ×100"
            />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Urgency, preferred delivery window…" />
          </div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !items.trim()}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Submit request
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
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-display text-2xl mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
