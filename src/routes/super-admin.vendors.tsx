import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Building2, CheckCircle2, PauseCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { listVendors, createVendor, setVendorStatus, type VendorPlan, type VendorStatus } from "@/lib/vendors";

export const Route = createFileRoute("/super-admin/vendors")({
  head: () => ({ meta: [{ title: "Vendors — Super Admin" }] }),
  component: VendorsPage,
});

const PLAN_LABEL: Record<VendorPlan, string> = {
  starter: "Starter", growth: "Growth", scale: "Scale",
};
const STATUS_BADGE: Record<VendorStatus, { label: string; cls: string; icon: any }> = {
  active:    { label: "Active",    cls: "bg-success text-success-foreground",     icon: CheckCircle2 },
  suspended: { label: "Suspended", cls: "bg-destructive text-destructive-foreground", icon: PauseCircle },
  pending:   { label: "Pending",   cls: "bg-muted text-muted-foreground",          icon: Clock },
};

function VendorsPage() {
  const qc = useQueryClient();
  const { data: vendors = [], isLoading } = useQuery({ queryKey: ["vendors"], queryFn: listVendors });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VendorStatus }) => setVendorStatus(id, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success(`Vendor ${v.status}`);
    },
  });

  const active = vendors.filter((v) => v.status === "active").length;
  const pending = vendors.filter((v) => v.status === "pending").length;
  const totalMembers = vendors.reduce((a, v) => a + v.members, 0);

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle="Tenants on the Mirie platform. Each vendor runs an isolated Water Retail + Delivery workspace."
        actions={<CreateVendorDialog onCreated={() => qc.invalidateQueries({ queryKey: ["vendors"] })} />}
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Active vendors" value={String(active)} icon={Building2} />
        <Stat label="Pending onboarding" value={String(pending)} icon={Clock} />
        <Stat label="Users across vendors" value={String(totalMembers)} icon={CheckCircle2} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading vendors…</TableCell></TableRow>
              )}
              {!isLoading && vendors.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No vendors yet. Create the first one.</TableCell></TableRow>
              )}
              {vendors.map((v) => {
                const s = STATUS_BADGE[v.status];
                const Icon = s.icon;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{v.slug}</TableCell>
                    <TableCell><Badge variant="outline">{PLAN_LABEL[v.plan]}</Badge></TableCell>
                    <TableCell>
                      <Badge className={s.cls}><Icon className="h-3 w-3 mr-1" />{s.label}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{v.members}</TableCell>
                    <TableCell className="text-sm">
                      <div>{v.contactEmail}</div>
                      {v.contactPhone && <div className="text-xs text-muted-foreground">{v.contactPhone}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">{v.createdAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {v.status !== "active" && (
                            <DropdownMenuItem onClick={() => setStatus.mutate({ id: v.id, status: "active" })}>
                              Activate
                            </DropdownMenuItem>
                          )}
                          {v.status !== "suspended" && (
                            <DropdownMenuItem onClick={() => setStatus.mutate({ id: v.id, status: "suspended" })}>
                              Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>Invite owner</DropdownMenuItem>
                          <DropdownMenuItem>View members</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-display text-3xl mt-2">{value}</div>
      </CardContent>
    </Card>
  );
}

function CreateVendorDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<VendorPlan>("starter");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const create = useMutation({
    mutationFn: () => createVendor({ name, slug, plan, contactEmail: email, contactPhone: phone || undefined }),
    onSuccess: () => {
      toast.success(`Vendor "${name}" created. Invite sent to ${email}.`);
      setOpen(false);
      setName(""); setSlug(""); setEmail(""); setPhone(""); setPlan("starter");
      onCreated();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create vendor"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> Create vendor</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a new vendor (tenant)</DialogTitle></DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (!name || !slug || !email) return; create.mutate(); }}
        >
          <div className="space-y-2">
            <Label>Business name</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} placeholder="e.g. Crystal Springs Water" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="crystal-springs" />
            <p className="text-xs text-muted-foreground">Used in invoices, exports and login URLs.</p>
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v as VendorPlan)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Owner email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.co.ke" />
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}
