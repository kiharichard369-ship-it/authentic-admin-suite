import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets } from "lucide-react";
import heroImg from "@/assets/login-hero.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Maji & Co. Platform" },
      { name: "description", content: "Sign in to the multi-business management platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("super@platform.co.ke");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    // Demo: route based on email prefix
    if (email.startsWith("super")) navigate({ to: "/super-admin/dashboard" });
    else setError("Only the super admin role is wired up in this build.");
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
              <div className="font-display text-xl leading-none">Maji & Co.</div>
              <div className="text-xs text-muted-foreground mt-0.5">Business Platform</div>
            </div>
          </div>

          <h1 className="text-3xl mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to manage your shops, kitchen and deliveries.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input
                id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full">Sign in</Button>

            <p className="text-xs text-muted-foreground text-center pt-4">
              Accounts are created by your administrator. No public registration.
            </p>
          </form>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden">
        <img
          src={heroImg} alt="" width={1280} height={1600}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-accent/20" />
        <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
          <p className="font-display text-3xl leading-tight max-w-md">
            One umbrella for water retail, the kitchen and every delivery on the road.
          </p>
        </div>
      </div>
    </div>
  );
}
