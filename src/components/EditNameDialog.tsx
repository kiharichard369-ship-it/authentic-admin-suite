import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, hasSupabase } from "@/lib/supabase";
import { getSession, setSession } from "@/lib/auth";

/** Lets the logged-in user edit their own display name. Updates
 *  auth.users.user_metadata.name in Supabase (so it survives future
 *  logins via my_vendor_membership/my_display_name) and immediately
 *  patches the local session so the UI reflects it without a reload. */
export function EditNameDialog({ onSaved }: { onSaved?: (name: string) => void }) {
  const session = getSession();
  const [open, setOpen]       = useState(false);
  const [name, setName]       = useState(session?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const reset = () => {
    setName(session?.name ?? "");
    setError("");
    setLoading(false);
  };

  const handleSave = async () => {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }

    if (!hasSupabase || !supabase) {
      const s = getSession();
      if (s) setSession({ ...s, name: trimmed });
      toast.success("Name updated (demo mode).");
      setOpen(false);
      onSaved?.(trimmed);
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ data: { name: trimmed } });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    const s = getSession();
    if (s) setSession({ ...s, name: trimmed });
    toast.success("Name updated.");
    setOpen(false);
    onSaved?.(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-secondary transition-colors text-left">
          <User className="h-4 w-4 text-muted-foreground" />
          Edit name
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit your name</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This is what appears in greetings and across the dashboard.
            </p>
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save name
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
