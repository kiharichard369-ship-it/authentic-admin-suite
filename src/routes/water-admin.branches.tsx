import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { MapPin, Plus, Users, Loader2, Eye, EyeOff, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { createVendorUser } from "@/lib/create-vendor-user";

export const Route = createFileRoute("/water-admin/branches")({
  head: () => ({ meta: [{ title: "Branches — Water Retail" }] }),
  component: BranchesPage,
});

// ── Types ────────────────────────────────────────────────────────────────────
type Branch = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  paybill: string | null;
  manager_user_id: string | null;
  manager_name: string | null;
  cashier_count: number;
  created_at: string;
};

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchBranches(): Promise<Branch[]> {
  if (!hasSupabase || !supabase) return [];
  const vendorId = getSession()?.vendorId;
  if (!vendorId) return [];

  const { data, error } = await supabase
    .from("water_branches")
    .select(`
      id, name, code, address, paybill, manager_user_id, created_at,
      water_cashiers(count)
    `)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id:              r.id,
    name:            r.name,
    code:            r.code,
    address:         r.address,
    paybill:         r.paybill,
    manager_user_id: r.manager_user_id,
    manager_name:    null, // resolved separately if needed
    cashier_count:   r.water_cashiers?.[0]?.count ?? 0,
    created_at:      r.created_at?.slice(0, 10),
  }));
}

async function createBranch(input: {
  name: string; code: string; address: string; paybill: string;
}): Promise<string> {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const vendorId = getSession()?.vendorId;
  if (!vendorId) throw new Error("No vendor session");

  const { data, error } = await supabase
    .from("water_branches")
    .insert({
      vendor_id: vendorId,
      name:      input.name,
      code:      input.code  || null,
      address:   input.address || null,
      paybill:   input.paybill || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function createManagerAccount(input: {
  branchId: string;
  name: string; email: string; password: string;
}) {
  const vendorId = getSession()?.vendorId;
  if (!vendorId) throw new Error("No vendor session");

  // Create auth account + vendor_members row with water_branch_manager role
  await createVendorUser({
    name:      input.name,
    email:     input.email,
    password:  input.password,
    role:      "water_branch_manager",
    vendorId,
    branchId:  input.branchId,
  });

  // Update the branch row to record who the manager is
  const { data: user } = await supabase!.from("vendor_members")
    .select("user_id")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (user) {
    await supabase!.from("water_branches")
      .update({ manager_user_id: user.user_id })
      .eq("id", input.branchId);
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
function BranchesPage() {
  const qc = useQueryClient();
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["water", "branches"],
    queryFn: fetchBranches,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["water", "branches"] });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Each branch has its own manager, cashiers and operational data. The business owner sees across all branches."
        actions={<AddBranchSheet onCreated={refresh} />}
      />

      {branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <GitBranch className="h-7 w-7" />
            </div>
            <div>
              <div className="font-display text-lg">No branches yet</div>
              <div className="text-sm text-muted-foreground mt-1">
                Add your first branch and appoint its manager.
              </div>
            </div>
            <AddBranchSheet onCreated={refresh} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Stat label="Total branches"   value={String(branches.length)} />
            <Stat label="With managers"    value={String(branches.filter(b => b.manager_user_id).length)} />
            <Stat label="Branches missing manager" value={String(branches.filter(b => !b.manager_user_id).length)}
              highlight={branches.some(b => !b.manager_user_id)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-8">
            {branches.map(b => (
              <BranchCard key={b.id} branch={b} onUpdated={refresh} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Branch card ───────────────────────────────────────────────────────────────
function BranchCard({ branch, onUpdated }: { branch: Branch; onUpdated: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-display">{branch.name}</CardTitle>
            {branch.code && (
              <div className="text-xs text-muted-foreground mt-0.5">Code: {branch.code}</div>
            )}
          </div>
          <Badge variant={branch.manager_user_id ? "default" : "destructive"} className="text-xs">
            {branch.manager_user_id ? "Has manager" : "No manager"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {branch.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {branch.address}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" />
          {branch.cashier_count} cashier{branch.cashier_count !== 1 ? "s" : ""}
        </div>
        <div className="text-xs text-muted-foreground">Created {branch.created_at}</div>

        {!branch.manager_user_id && (
          <div className="pt-2">
            <AppointManagerSheet branchId={branch.id} branchName={branch.name} onDone={onUpdated} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Add branch sheet (step 1: branch details, step 2: appoint manager) ────────
function AddBranchSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen]       = useState(false);
  const [step, setStep]       = useState<1 | 2>(1);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("");

  // Step 1 fields
  const [name, setName]       = useState("");
  const [code, setCode]       = useState("");
  const [address, setAddress] = useState("");
  const [paybill, setPaybill] = useState("");

  const reset = () => {
    setStep(1); setBranchId(null); setBranchName("");
    setName(""); setCode(""); setAddress(""); setPaybill("");
  };

  const createBranchMut = useMutation({
    mutationFn: () => createBranch({ name, code, address, paybill }),
    onSuccess: (id) => {
      setBranchId(id);
      setBranchName(name);
      setStep(2);
      toast.success(`Branch "${name}" created`);
      onCreated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) reset(); }}>
      <SheetTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> Add branch</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-2 px-0">
          <SheetTitle>
            {step === 1 ? "Add new branch" : `Appoint manager — ${branchName}`}
          </SheetTitle>
          <div className="flex items-center gap-2 mt-2">
            <StepDot active={step === 1} done={step === 2} n={1} label="Branch details" />
            <div className="flex-1 h-px bg-border" />
            <StepDot active={step === 2} done={false} n={2} label="Appoint manager" />
          </div>
        </SheetHeader>

        {step === 1 && (
          <>
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Branch name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kileleshwa Branch" />
              </div>
              <div className="space-y-2">
                <Label>Branch code</Label>
                <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. KLW" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Othaya Rd, Kileleshwa" />
              </div>
              <div className="space-y-2">
                <Label>Branch paybill / till (optional override)</Label>
                <Input value={paybill} onChange={e => setPaybill(e.target.value)} placeholder="Leave blank to use business-wide setting" />
                <p className="text-[11px] text-muted-foreground">Branch-specific payment shortcode. Overrides the business payment config for this branch.</p>
              </div>
            </div>
            <SheetFooter className="mt-8 px-0">
              <Button className="w-full" onClick={() => createBranchMut.mutate()}
                disabled={createBranchMut.isPending || !name.trim()}>
                {createBranchMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create branch & continue
              </Button>
            </SheetFooter>
          </>
        )}

        {step === 2 && branchId && (
          <AppointManagerForm
            branchId={branchId}
            branchName={branchName}
            onDone={() => { setOpen(false); reset(); onCreated(); }}
            onSkip={() => { setOpen(false); reset(); }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Appoint manager sheet (standalone — for existing branches without one) ────
function AppointManagerSheet({ branchId, branchName, onDone }: {
  branchId: string; branchName: string; onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Users className="h-3.5 w-3.5 mr-1" /> Appoint manager
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="mb-6 px-0">
          <SheetTitle>Appoint manager — {branchName}</SheetTitle>
        </SheetHeader>
        <AppointManagerForm
          branchId={branchId}
          branchName={branchName}
          onDone={() => { setOpen(false); onDone(); }}
          onSkip={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

// ── Appoint manager form (shared between create flow and standalone sheet) ────
function AppointManagerForm({ branchId, branchName, onDone, onSkip }: {
  branchId: string; branchName: string;
  onDone: () => void; onSkip: () => void;
}) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);

  const m = useMutation({
    mutationFn: () => createManagerAccount({ branchId, name, email, password }),
    onSuccess: () => {
      toast.success(`Manager account created — ${email} can now log in to ${branchName}`);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const valid = name.trim() && email.trim() && password.length >= 8;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Create a login account for the branch manager. They will see only <strong>{branchName}</strong>'s data.
      </p>
      <div className="space-y-2">
        <Label>Full name *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Achieng" />
      </div>
      <div className="space-y-2">
        <Label>Login email *</Label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.co.ke" />
      </div>
      <div className="space-y-2">
        <Label>Initial password *</Label>
        <div className="relative">
          <Input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <button type="button" onClick={() => setShowPwd(!showPwd)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">Share this with them — they can change it on first login.</p>
      </div>
      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={onSkip}>Skip for now</Button>
        <Button className="flex-1" onClick={() => m.mutate()} disabled={m.isPending || !valid}>
          {m.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Appoint manager
        </Button>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function StepDot({ active, done, n, label }: { active: boolean; done: boolean; n: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
        done   ? "bg-primary border-primary text-primary-foreground" :
        active ? "border-primary text-primary" : "border-muted text-muted-foreground"
      }`}>{n}</div>
      <span className={`text-[10px] ${active || done ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
    </div>
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
