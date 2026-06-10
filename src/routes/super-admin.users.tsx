import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Plus, MoreHorizontal } from "lucide-react";
import { users } from "@/lib/mock-data";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/super-admin/users")({
  head: () => ({ meta: [{ title: "Users & Roles — Super Admin" }] }),
  component: UsersPage,
});

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  vendor_admin: "Vendor Admin",
  water_admin: "Water Admin",
  water_cashier: "Water Cashier",
  driver: "Driver",
};

function UsersPage() {
  const [q, setQ] = useState("");
  const [bizFilter, setBizFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

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
          <Sheet>
            <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Create user</Button></SheetTrigger>
            <CreateUserSheet />
          </Sheet>
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Business arm</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
                      <DropdownMenuItem>Edit role</DropdownMenuItem>
                      <DropdownMenuItem>Reset password</DropdownMenuItem>
                      <DropdownMenuItem>{u.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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

function CreateUserSheet() {
  return (
    <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
      <SheetHeader className="mb-6 px-0">
        <SheetTitle>Create user account</SheetTitle>
      </SheetHeader>
      <div className="space-y-4">
        <div className="space-y-2"><Label>Full name</Label><Input placeholder="e.g. Jane Achieng" /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="jane@platform.co.ke" /></div>
        <div className="space-y-2"><Label>Temporary password</Label><Input type="text" placeholder="Auto-generated" /></div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Business arm</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Select business" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="water">Water Retail</SelectItem>
              <SelectItem value="delivery">Water Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Shop assignment</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Select shop (if applicable)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="s1">Kileleshwa Branch</SelectItem>
              <SelectItem value="s2">Westlands Branch</SelectItem>
              <SelectItem value="s3">Karen Branch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Label htmlFor="invite">Send invite email</Label>
          <Switch id="invite" defaultChecked />
        </div>
      </div>
      <SheetFooter className="mt-8 px-0">
        <Button className="w-full">Create account</Button>
      </SheetFooter>
    </SheetContent>
  );
}
