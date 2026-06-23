import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets } from "lucide-react";
import heroImg from "@/assets/login-hero.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABEL, parseDemoEmail, sessionHome, setSession, clearSession } from "@/lib/auth";
import { getVendorBySlug } from "@/lib/vendors";
import { hasSupabase } from "@/lib/supabase";
import { loginWithSupabase } from "@/lib/auth-login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Mirie Platform" },
      { name: "description", content: "Multi-tenant SaaS for water retail and delivery operators." },
    ],
  }),
  component: LoginPage,
});

const DEMO_ACCOUNTS: { email: string; label: string }[] = [
  { email: "super@mirie.co.ke",         label: "Super Admin (platform)" },
  { email: "vendor@acme.mirie.co.ke",   label: "Vendor Admin · Acme" },
  { email: "water@acme.mirie.co.ke",    label: "Water Admin · Acme" },
  { email: "cashier@acme.mirie.co.ke",  label: "Water Cashier · Acme" },
  { email: "driver@acme.mirie.co.ke",   label: "Driver · Acme" },
  { email: "vendor@blue.mirie.co.ke",   label: "Vendor Admin · Blue Springs" },
];

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("super@mirie.co.ke");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Email and password are required."); return; }

    setLoading(true);
    try {
      // 1. Real Supabase auth when configured.
      if (hasSupabase) {
        const result = await loginWithSupabase(email, password);
        if (result.ok) {
          navigate({ to: sessionHome(result.session) });
          return;
        }
        // Fall through to demo prefix only for the seeded demo emails.
        const parsed = parseDemoEmail(email);
        if (!parsed) { setError(result.error); return; }
      }

      // 2. Demo fallback (no Supabase, or demo email + Supabase rejected it).
      const parsed = parseDemoEmail(email);
      if (!parsed) { setError("Unknown account. Try one of the demo accounts below."); return; }

      let vendorId: string | null = null;
      let vendorName: string | null = null;
      if (parsed.vendorSlug) {
        const v = await getVendorBySlug(parsed.vendorSlug);
        vendorId = v?.id ?? null;
        vendorName = v?.name ?? parsed.vendorSlug;
      }
      const session = {
        role: parsed.role,
        email,
        name: ROLE_LABEL[parsed.role],
        vendorId,
        vendorName,
        businessType: "both" as const,
      };
      clearSession();
      setSession(session);
      navigate({ to: sessionHome(session) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl leading-none">Mirie</div>
              <div className="text-xs text-muted-foreground mt-0.5">SaaS for water operators</div>
            </div>
          </div>

          <h1 className="text-3xl mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to run your shop, drivers and customer accounts in one place.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Demo accounts</div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => setEmail(a.email)}
                  className="text-left text-xs px-2 py-1.5 rounded-md hover:bg-secondary transition-colors"
                >
                  <div className="font-medium">{a.label}</div>
                  <div className="text-muted-foreground truncate">{a.email}</div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              New vendors are provisioned by the platform Super Admin from{" "}
              <span className="font-medium">Vendors</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden">
        <img src={heroImg} alt="" width={1280} height={1600} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-accent/20" />
        <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
          <p className="font-display text-3xl leading-tight max-w-md">
            One platform for every water retailer and every delivery on the road.
          </p>
        </div>
      </div>
    </div>
  );
}
