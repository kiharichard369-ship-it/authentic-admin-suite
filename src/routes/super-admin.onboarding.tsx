import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2, Mail, CheckCircle2, ArrowLeft, ArrowRight, Loader2, UserCircle,
} from "lucide-react";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { hasSupabase } from "@/lib/supabase";
import {
  createVendorWithAdmin, findAuthUserByEmail, type OnboardVendorInput,
} from "@/lib/onboarding";
import type { VendorPlan } from "@/lib/vendors";

export const Route = createFileRoute("/super-admin/onboarding")({
  head: () => ({ meta: [{ title: "Onboard a vendor — Super Admin" }] }),
  component: OnboardingPage,
});

type Step = 1 | 2 | 3 | 4;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1: business
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<VendorPlan>("starter");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Step 2: admin
  const [adminEmail, setAdminEmail] = useState("");
  const [adminLookup, setAdminLookup] = useState<{
    state: "idle" | "checking" | "found" | "missing" | "error";
    msg?: string;
  }>({ state: "idle" });

  // Step 4: result
  const [result, setResult] = useState<{ vendorId: string; adminEmail: string; name: string } | null>(null);

  const step1Valid = useMemo(
    () => name.trim().length >= 2 && /^[a-z0-9-]{2,32}$/.test(slug) && /\S+@\S+\.\S+/.test(contactEmail),
    [name, slug, contactEmail],
  );
  const step2Valid = adminLookup.state === "found";

  async function checkAdmin() {
    if (!/\S+@\S+\.\S+/.test(adminEmail)) {
      setAdminLookup({ state: "missing", msg: "Enter a valid email." });
      return;
    }
    if (!hasSupabase) {
      setAdminLookup({ state: "error", msg: "Cloud is not configured." });
      return;
    }
    setAdminLookup({ state: "checking" });
    try {
      const uid = await findAuthUserByEmail(adminEmail.trim());
      if (uid) setAdminLookup({ state: "found", msg: uid });
      else setAdminLookup({
        state: "missing",
        msg: "No auth user with this email. Create them in Authentication → Users first.",
      });
    } catch (e: any) {
      setAdminLookup({ state: "error", msg: e?.message ?? "Lookup failed" });
    }
  }

  const submit = useMutation({
    mutationFn: (input: OnboardVendorInput) => createVendorWithAdmin(input),
    onSuccess: (res) => {
      setResult({ vendorId: res.vendorId, adminEmail: adminEmail.trim(), name });
      setStep(4);
      toast.success(`Vendor "${name}" created`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create vendor"),
  });

  function finish() {
    submit.mutate({
      name: name.trim(),
      slug,
      plan,
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim() || undefined,
      adminEmail: adminEmail.trim(),
    });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Onboard a vendor"
        subtitle="Create a business workspace and assign its first admin in three steps."
      />

      <Stepper step={step} />

      <Card className="mt-6">
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <SectionHeading icon={Building2} title="Business details" hint="What you'll see in invoices and exports." />
              <div className="space-y-2">
                <Label>Business name</Label>
                <Input value={name}
                  onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }}
                  placeholder="e.g. Crystal Springs Water" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="crystal-springs" />
                  <p className="text-xs text-muted-foreground">Lowercase, dashes only. Used in URLs and exports.</p>
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
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business contact email</Label>
                  <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="owner@example.co.ke" />
                </div>
                <div className="space-y-2">
                  <Label>Phone (optional)</Label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+254 700 000 000" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <SectionHeading icon={UserCircle} title="Assign the vendor admin"
                hint="This person manages the vendor workspace and invites their own staff." />
              <div className="space-y-2">
                <Label>Admin email</Label>
                <div className="flex gap-2">
                  <Input type="email" value={adminEmail}
                    onChange={(e) => { setAdminEmail(e.target.value); setAdminLookup({ state: "idle" }); }}
                    placeholder="admin@example.co.ke" />
                  <Button type="button" variant="outline" onClick={checkAdmin}
                    disabled={adminLookup.state === "checking"}>
                    {adminLookup.state === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The user must already exist in Authentication → Users. Create them there first, then verify here.
                </p>
              </div>

              {adminLookup.state === "found" && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-success/10 text-success text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  User found. They'll be assigned <span className="font-medium">vendor_admin</span> for {name || "this vendor"}.
                </div>
              )}
              {(adminLookup.state === "missing" || adminLookup.state === "error") && adminLookup.msg && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {adminLookup.msg}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <SectionHeading icon={Mail} title="Review & confirm" hint="Nothing is created until you confirm." />
              <ReviewRow label="Business name" value={name} />
              <ReviewRow label="Slug" value={slug} mono />
              <ReviewRow label="Plan" value={<Badge variant="outline" className="capitalize">{plan}</Badge>} />
              <ReviewRow label="Business contact" value={contactEmail} />
              {contactPhone && <ReviewRow label="Phone" value={contactPhone} />}
              <ReviewRow label="Vendor admin" value={adminEmail} />
            </div>
          )}

          {step === 4 && result && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-success/15 text-success grid place-items-center">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-display">Vendor "{result.name}" is live</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {result.adminEmail} has been assigned as <span className="font-medium">vendor_admin</span>.
                They can sign in now and start configuring their water and delivery operations.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" onClick={() => {
                  setStep(1); setName(""); setSlug(""); setContactEmail(""); setContactPhone("");
                  setAdminEmail(""); setAdminLookup({ state: "idle" }); setResult(null);
                }}>Onboard another</Button>
                <Button onClick={() => navigate({ to: "/super-admin/vendors" })}>Go to vendors</Button>
              </div>
            </div>
          )}

          {step !== 4 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, (s - 1) as Step))} disabled={step === 1}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              {step < 3 && (
                <Button onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}>
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {step === 3 && (
                <Button onClick={finish} disabled={submit.isPending}>
                  {submit.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creating…</> : "Create vendor"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!hasSupabase && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Lovable Cloud isn't configured — onboarding requires database access.
        </p>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const items = [
    { n: 1, label: "Business" },
    { n: 2, label: "Vendor admin" },
    { n: 3, label: "Review" },
  ];
  return (
    <ol className="flex items-center gap-2">
      {items.map((it, i) => {
        const done = step > it.n || step === 4;
        const active = step === it.n;
        return (
          <li key={it.n} className="flex items-center gap-2 flex-1">
            <div className={`h-7 w-7 grid place-items-center rounded-full text-xs font-medium ${
              done ? "bg-success text-success-foreground"
                   : active ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
            }`}>
              {done ? <CheckCircle2 className="h-4 w-4" /> : it.n}
            </div>
            <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>{it.label}</span>
            {i < items.length - 1 && <div className="flex-1 h-px bg-border mx-2" />}
          </li>
        );
      })}
    </ol>
  );
}

function SectionHeading({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 pb-2 border-b">
      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary grid place-items-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
