import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/super-admin/payments")({
  head: () => ({ meta: [{ title: "Payment Configuration — Super Admin" }] }),
  component: Payments,
});

type MpesaConfig = {
  id?: string;
  business_id: string;
  shortcode: string;
  passkey: string;
  consumer_key: string;
  consumer_secret: string;
  confirmation_url: string;
  validation_url: string;
  environment: "sandbox" | "production";
  mpesa_enabled: boolean;
  cash_enabled: boolean;
};

const DEFAULTS: Record<string, Partial<MpesaConfig>> = {
  water: {
    business_id: "water", shortcode: "174379", environment: "sandbox",
    mpesa_enabled: true, cash_enabled: true,
    passkey: "", consumer_key: "", consumer_secret: "",
    confirmation_url: "https://api.platform.co.ke/mpesa/confirm",
    validation_url: "https://api.platform.co.ke/mpesa/validate",
  },
  delivery: {
    business_id: "delivery", shortcode: "174381", environment: "sandbox",
    mpesa_enabled: false, cash_enabled: true,
    passkey: "", consumer_key: "", consumer_secret: "",
    confirmation_url: "https://api.platform.co.ke/mpesa/confirm",
    validation_url: "https://api.platform.co.ke/mpesa/validate",
  },
};

async function loadConfig(businessId: string): Promise<Partial<MpesaConfig>> {
  if (!hasSupabase || !supabase) return DEFAULTS[businessId] ?? {};
  const { data } = await supabase
    .from("platform_payment_config")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  return data ?? (DEFAULTS[businessId] ?? {});
}

async function saveConfig(cfg: Partial<MpesaConfig>): Promise<void> {
  if (!hasSupabase || !supabase) return;
  const { error } = await supabase
    .from("platform_payment_config")
    .upsert(cfg, { onConflict: "business_id" });
  if (error) throw error;
}

async function loadAuditLog() {
  if (!hasSupabase || !supabase) {
    return [
      { who: "Super Admin", when: "2026-05-08 14:22", what: "Updated Water Retail Passkey" },
      { who: "Super Admin", when: "2026-04-30 09:15", what: "Switched Water Retail to Production" },
      { who: "Super Admin", when: "2026-04-12 11:05", what: "Created Delivery sandbox config" },
    ];
  }
  const { data } = await supabase
    .from("platform_payment_audit")
    .select("who,when,what")
    .order("when", { ascending: false })
    .limit(20);
  return data ?? [];
}

const businessConfigs = [
  { id: "water",    name: "Water Retail",   noPayments: false },
  { id: "delivery", name: "Water Delivery", noPayments: true },
];

function Payments() {
  const [auditLog, setAuditLog] = useState<any[]>([]);
  useEffect(() => { loadAuditLog().then(setAuditLog); }, []);

  return (
    <div>
      <PageHeader
        title="Payment configuration"
        subtitle="M-Pesa Daraja credentials per business arm. Changes take effect immediately."
      />
      <Tabs defaultValue="config">
        <TabsList className="mb-6">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>
        <TabsContent value="config" className="space-y-6">
          {businessConfigs.map((b) => <ConfigSection key={b.id} {...b} />)}
        </TabsContent>
        <TabsContent value="audit">
          <Card>
            <CardContent className="divide-y">
              {auditLog.map((r, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div><span className="font-medium">{r.who}</span> — {r.what}</div>
                  <div className="text-muted-foreground tabular-nums">{r.when}</div>
                </div>
              ))}
              {auditLog.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No audit entries yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConfigSection({ id, name, noPayments }: { id: string; name: string; noPayments?: boolean }) {
  const [cfg, setCfg]       = useState<Partial<MpesaConfig>>(DEFAULTS[id] ?? {});
  const [loading, setLoad]  = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig(id).then((v) => { setCfg(v); setLoad(false); });
  }, [id]);

  const update = (k: keyof MpesaConfig, v: any) => setCfg((c) => ({ ...c, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig({ ...cfg, business_id: id });
      toast.success(`${name} config saved`);
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Card>
      <CardContent className="p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display">{name}</CardTitle>
            <CardDescription>M-Pesa Daraja credentials</CardDescription>
          </div>
          {noPayments && <Badge variant="secondary">No direct payments</Badge>}
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <Field label="M-Pesa Shortcode (Paybill / Till)"
          value={cfg.shortcode ?? ""} onChange={(v) => update("shortcode", v)} />
        <Field label="Passkey" value={cfg.passkey ?? ""} onChange={(v) => update("passkey", v)} mask />
        <Field label="Consumer Key" value={cfg.consumer_key ?? ""} onChange={(v) => update("consumer_key", v)} mask />
        <Field label="Consumer Secret" value={cfg.consumer_secret ?? ""} onChange={(v) => update("consumer_secret", v)} mask />
        <Field label="Confirmation URL" value={cfg.confirmation_url ?? ""} onChange={(v) => update("confirmation_url", v)} />
        <Field label="Validation URL"   value={cfg.validation_url ?? ""}   onChange={(v) => update("validation_url", v)} />
        <div className="space-y-2">
          <Label>Environment</Label>
          <Select value={cfg.environment ?? "sandbox"} onValueChange={(v) => update("environment", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-6 pt-2 border-t">
          <ToggleRow label="Enable M-Pesa" checked={cfg.mpesa_enabled ?? true} onChange={(v) => update("mpesa_enabled", v)} />
          <ToggleRow label="Enable Cash"   checked={cfg.cash_enabled  ?? true} onChange={(v) => update("cash_enabled",  v)} />
          <Button className="ml-auto" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save section
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, mask }: {
  label: string; value: string; onChange: (v: string) => void; mask?: boolean;
}) {
  const [show, setShow] = useState(!mask);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={mask && !show ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {mask && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={onChange} />
      <Label>{label}</Label>
    </div>
  );
}
