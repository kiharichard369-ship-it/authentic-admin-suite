import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreHorizontal, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { fetchUsers } from "@/lib/platform-data";
import { users as _mock_users } from "@/lib/mock-data";

export const Route = createFileRoute("/super-admin/users")({
  head: () => ({ meta: [{ title: "Users & Roles — Super Admin" }] }),
  component: UsersPage,
});

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", vendor_admin: "Vendor Admin",
  water_admin: "Water Admin", water_cashier: "Water Cashier", driver: "Driver",
};

async function createUser(input: { name: string; email: string; role: string; business: string; sendInvite: boolean }) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  // Create auth user via admin API (requires service role or edge function in production)
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    email_confirm: true,
    user_metadata: { name: input.name, role: input.role, business: input.business },
  });
  if (error) throw error;
  return data;
}

async function setUserStatus(id: string, status: "active" | "inactive") {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.from("platform_users").update({ status }).eq("id", id);
  if (error) throw error;
}

async function deleteUser(id: string) {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw error;
}

function UsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [bizFilter, setBizFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users = _mock_users, isLoading } = useQuery({
    queryKey: ["platform", "users"],
    queryFn: fetchUsers,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) => setUserStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform", "users"] }); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform", "users"] }); toast.success("User deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = users.filter((u) => {
    if (bizFilter !== "all" && u.business !== bizFilter) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Users & roles"
        subtitle={`${users.length} accounts across all businesses`}
        actions={
          <AddUserSheet onCreated={() => qc.invalidateQueries({ queryKey: ["platform", "users"] })} />
        }
      />
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <Input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={bizFilter} onValueChange={setBizFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Business arm" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All businesses</SelectItem>
              <SelectItem value="Water Retail">Water Retail</SelectItem>
              <SelectItem value="Water Delivery">Water Delivery</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
              <TableHead>Business</TableHead><TableHead>Shop</TableHead><TableHead>Status</TableHead>
              <TableHead>Last login</TableHead><TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…</TableCell></TableRow>}
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge variant="secondary">{ROLE_LABELS[u.role] ?? u.role}</Badge></TableCell>
                <TableCell>{u.business}</TableCell>
                <TableCell>{u.shop}</TableCell>
                <TableCell>
                  <Badge className={u.status === "active" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}>
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums text-sm">{u.lastLogin}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => statusMut.mutate({ id: u.id, status: u.status === "active" ? "inactive" : "active" })}>
                        {u.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete ${u.name}?`)) deleteMut.mutate(u.id); }}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddUserSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("water_cashier");
  const [business, setBusiness] = useState("water");
  const [sendInvite, setSendInvite] = useState(true);

  const m = useMutation({
    mutationFn: () => createUser({ name, email, role, business, sendInvite }),
    onSuccess: () => {
      toast.success(`Account created for ${email}`);
      setOpen(false); setName(""); setEmail(""); setRole("water_cashier");
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Create user</Button></SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-6 px-0"><SheetTitle>Create user account</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Full name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Achieng" /></div>
          <div className="space-y-2"><Label>Email *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.co.ke" /></div>
          <div className="space-y-2">
            <Label>Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Business arm *</Label>
            <Select value={business} onValueChange={setBusiness}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="water">Water Retail</SelectItem>
                <SelectItem value="delivery">Water Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="invite">Send invite email</Label>
            <Switch id="invite" checked={sendInvite} onCheckedChange={setSendInvite} />
          </div>
        </div>
        <SheetFooter className="mt-8 px-0">
          <Button className="w-full" onClick={() => m.mutate()} disabled={m.isPending || !name || !email}>
            {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create account
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
