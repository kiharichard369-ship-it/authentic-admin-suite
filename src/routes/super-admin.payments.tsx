import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/super-admin/payments")({
  head: () => ({ meta: [{ title: "Payment Configuration — Super Admin" }] }),
  component: Payments,
});

const businessConfigs = [
  { id: "water", name: "Water Retail", shortcode: "174379" },
  { id: "rb", name: "Restaurant & Butchery", shortcode: "174380" },
  { id: "delivery", name: "Water Delivery", shortcode: "174381", noPayments: true },
];

function Payments() {
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
              {[
                { who: "Super Admin", when: "2026-05-08 14:22", what: "Updated Restaurant Passkey" },
                { who: "Super Admin", when: "2026-04-30 09:15", what: "Switched Water Retail to Production" },
                { who: "Super Admin", when: "2026-04-12 11:05", what: "Created Delivery sandbox config" },
              ].map((r, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-sm">
                  <div><span className="font-medium">{r.who}</span> — {r.what}</div>
                  <div className="text-muted-foreground tabular-nums">{r.when}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConfigSection({ name, shortcode, noPayments }: { id: string; name: string; shortcode: string; noPayments?: boolean }) {
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
        <Field label="M-Pesa Shortcode (Paybill / Till)" defaultValue={shortcode} />
        <Field label="Passkey" defaultValue="••••••••••••••••" mask />
        <Field label="Consumer Key" defaultValue="••••••••••••••••" mask />
        <Field label="Consumer Secret" defaultValue="••••••••••••••••" mask />
        <Field label="Confirmation URL" defaultValue="https://api.platform.co.ke/mpesa/confirm" />
        <Field label="Validation URL" defaultValue="https://api.platform.co.ke/mpesa/validate" />
        <div className="space-y-2">
          <Label>Environment</Label>
          <Select defaultValue="sandbox">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">Sandbox</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-6 pt-2 border-t">
          <ToggleRow label="Enable M-Pesa" defaultChecked />
          <ToggleRow label="Enable Cash" defaultChecked />
          <Button className="ml-auto"><Save className="h-4 w-4 mr-1" /> Save section</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, defaultValue, mask }: { label: string; defaultValue: string; mask?: boolean }) {
  const [show, setShow] = useState(!mask);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input type={mask && !show ? "password" : "text"} defaultValue={defaultValue} />
        {mask && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Switch defaultChecked={defaultChecked} />
      <Label>{label}</Label>
    </div>
  );
}
