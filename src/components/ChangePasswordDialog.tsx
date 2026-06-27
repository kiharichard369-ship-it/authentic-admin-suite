import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/lib/auth-login";
import { hasSupabase } from "@/lib/supabase";

export function ChangePasswordDialog() {
  const [open, setOpen]           = useState(false);
  const [current, setCurrent]     = useState("");
  const [next, setNext]           = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showNext, setShowNext]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const reset = () => {
    setCurrent(""); setNext(""); setConfirm(""); setError(""); setLoading(false);
  };

  const handleSave = async () => {
    setError("");
    if (!next || next.length < 8) {
      setError("New password must be at least 8 characters."); return;
    }
    if (next !== confirm) {
      setError("Passwords do not match."); return;
    }

    if (!hasSupabase) {
      toast.success("Password updated (demo mode — no real change).");
      setOpen(false); reset(); return;
    }

    setLoading(true);
    const err = await changePassword(next);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      toast.success("Password changed successfully.");
      setOpen(false); reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors text-left">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Change password
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Current password</Label>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Your current password"
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label>New password</Label>
            <div className="relative">
              <Input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNext(!showNext)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirm new password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !next || !confirm}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
