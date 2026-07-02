import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Save, Loader2, CreditCard, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/water-admin/payments")({
  head: () => ({ meta: [{ title: "Payment Setup — Water Retail" }] }),
  component: PaymentsPage,
});

type PaymentConfig = {
  shortcode:       string;
  passkey:         string;
  consumer_key:    string;
  consumer_secret: string;
  callback_url:    string;
  environment:     "sandbox" | "production";
  mpesa_enabled:   boolean;
  cash_enabled:    boolean;
  paybill_display: string;
  account_display: string;
};

const DEFAULTS: PaymentConfig = {
  shortcode: "", passkey: "", consumer_key: "", consumer_secret: "",
  callback_url: "", environment: "sandbox",
  mpesa_enabled: true, cash_enabled: true,
  paybill_display: "", account_display: "",
};

async function loadConfig(): Promise<PaymentConfig> {
  if (!hasSupabase || !supabase) return DEFAULTS;
  const vendorId = getSession()?.vendorId;
  if (!vendorId) return DEFAULTS;
  const { data } = await supabase
    .from("water_payment_config")
    .select("*")
    .eq("vendor_id", vendorId)
    .maybeSingle();
  if (!data) return DEFAULTS;
  return {
    shortcode:       data.shortcode       ?? "",
    passkey:         data.passkey         ?? "",
    consumer_key:    data.consumer_key    ?? "",
    consumer_secret: data.consumer_secret ?? "",
    callback_url:    data.callback_url    ?? "",
    environment:     (data.environment as "sandbox" | "production") ?? "sandbox",
    mpesa_enabled:   data.mpesa_enabled   ?? true,
    cash_enabled:    data.cash_enabled    ?? true,
    paybill_display: data.paybill_display ?? "",
    account_display: data.account_display ?? "",
  };
}

async function saveConfig(cfg: PaymentConfig): Promise<void> {
  if (!hasSupabase || !supabase) throw new Error("No Supabase connection");
  const vendorId = getSession()?.vendorId;
  if (!vendorId) throw new Error("No vendor session");
  const { error } = await supabase
    .from("water_payment_config")
    .upsert({ vendor_id: vendorId, ...cfg, updated_at: new Date().toISOString() },
      { onConflict: "vendor_id" });
  if (error) throw error;
}

function PaymentsPage() {
  const [cfg, setCfg]       = useState<PaymentConfig>(DEFAULTS);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    loadConfig().then(c => { setCfg(c); setLoad(false); });
  }, []);

  const update = <K extends keyof PaymentConfig>(k: K, v: PaymentConfig[K]) =>
    setCfg(prev => ({ ...prev, [k]: v }));

  const save = useMutation({
    mutationFn: () => saveConfig(cfg),
    onSuccess: () => toast.success("Payment configuration saved"),
    onError:   (e: Error) => toast.error(e.message),
  });

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const prodWarning = cfg.environment === "production" && (!cfg.shortcode || !cfg.passkey);

  return (
    <div>
      <PageHeader
        title="Payment Setup"
        subtitle="M-Pesa Daraja credentials and payment methods for this business. Used by all branches and the POS."
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <Save    className="h-4 w-4 mr-1" />}
            Save configuration
          </Button>
        }
      />

      {prodWarning && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <Info className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">
            Environment is set to <strong>Production</strong> but shortcode or passkey is missing.
            The POS will fail to prompt M-Pesa until these are filled in.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* M-Pesa Daraja credentials */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display">M-Pesa Daraja</CardTitle>
                <CardDescription>STK Push credentials from the Safaricom developer portal</CardDescription>
              </div>
              <Badge variant={cfg.environment === "production" ? "default" : "secondary"} className="capitalize">
                {cfg.environment}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Environment</Label>
              <Select value={cfg.environment} onValueChange={v => update("environment", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (testing)</SelectItem>
                  <SelectItem value="production">Production (live)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Field label="Paybill / Shortcode *"
              value={cfg.shortcode} onChange={v => update("shortcode", v)}
              placeholder="e.g. 174379" />

            <Field label="Lipa na M-Pesa Passkey *"
              value={cfg.passkey} onChange={v => update("passkey", v)}
              placeholder="Passkey from Daraja portal" mask />

            <Field label="Consumer Key *"
              value={cfg.consumer_key} onChange={v => update("consumer_key", v)}
              placeholder="App consumer key" mask />

            <Field label="Consumer Secret *"
              value={cfg.consumer_secret} onChange={v => update("consumer_secret", v)}
              placeholder="App consumer secret" mask />

            <Field label="STK Push Callback URL"
              value={cfg.callback_url} onChange={v => update("callback_url", v)}
              placeholder="https://api.yourdomain.co.ke/mpesa/callback" />
          </CardContent>
        </Card>

        {/* Payment methods + display config */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Enabled payment methods</CardTitle>
              <CardDescription>Control which methods appear on the POS for all branches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">M-Pesa</div>
                  <div className="text-xs text-muted-foreground mt-0.5">STK Push to customer's phone</div>
                </div>
                <Switch
                  checked={cfg.mpesa_enabled}
                  onCheckedChange={v => update("mpesa_enabled", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">Cash</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Manual cash collection at the counter</div>
                </div>
                <Switch
                  checked={cfg.cash_enabled}
                  onCheckedChange={v => update("cash_enabled", v)}
                />
              </div>
              {!cfg.mpesa_enabled && !cfg.cash_enabled && (
                <p className="text-xs text-destructive">At least one payment method must be enabled.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">POS display text</CardTitle>
              <CardDescription>Shown on the M-Pesa payment prompt at the counter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label='Paybill display (e.g. "Pay to: 247247")'
                value={cfg.paybill_display} onChange={v => update("paybill_display", v)}
                placeholder="Pay to: 247247" />
              <Field label='Account display (e.g. "Account: UHAI WATER")'
                value={cfg.account_display} onChange={v => update("account_display", v)}
                placeholder="Account: UHAI WATER" />
              {(cfg.paybill_display || cfg.account_display) && (
                <div className="rounded-lg bg-secondary/50 p-4 space-y-1 text-sm">
                  <div className="text-xs text-muted-foreground mb-2">Preview — customer sees:</div>
                  <div className="font-medium">{cfg.paybill_display || "Pay to: —"}</div>
                  <div className="text-muted-foreground">{cfg.account_display || "Account: —"}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> How this is used
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>These credentials are stored securely in the database and loaded at checkout — not in your <code className="text-xs bg-secondary px-1 rounded">.env</code> file.</p>
              <p>The POS will show only the enabled payment methods. For M-Pesa, the STK Push is triggered server-side so the passkey never touches the browser.</p>
              <p>Individual branches can override the paybill/shortcode from the <strong>Branches</strong> page if they collect to a different till.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mask }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; mask?: boolean;
}) {
  const [show, setShow] = useState(!mask);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={mask && !show ? "password" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
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
