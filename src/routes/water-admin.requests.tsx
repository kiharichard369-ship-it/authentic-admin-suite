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
  const { error } = await supabase.from("water_stock_requests").insert({ items, note, status: "pending" });
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

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader
        title="Stock Requests"
        subtitle="Replenishment requests sent to the main warehouse."
        actions={<NewRequestSheet onCreated={() => qc.invalidateQueries({ queryKey: ["water", "stockRequests"] })} />}
      />
      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Items</TableHead>
                <TableHead>Status</TableHead><TableHead>Note</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockRequests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="text-muted-foreground">{r.date}</TableCell>
                  <TableCell>{r.items}</TableCell>
                  <TableCell><Badge variant={tone[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{r.note || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ id: r.id, status: "approved" })} disabled={statusMut.isPending}>Approve</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => statusMut.mutate({ id: r.id, status: "rejected" })} disabled={statusMut.isPending}>Reject</Button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ id: r.id, status: "delivered" })} disabled={statusMut.isPending}>Mark delivered</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NewRequestSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState("");
  const [note, setNote] = useState("");

  const m = useMutation({
    mutationFn: () => createRequest(items, note),
    onSuccess: () => { toast.success("Stock request submitted"); setOpen(false); setItems(""); setNote(""); onCreated(); },
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
            <Input value={items} onChange={(e) => setItems(e.target.value)} placeholder="e.g. 20L caps ×500, 5L bottles ×200" />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Urgency, delivery window…" />
          </div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !items}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Submit request
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
