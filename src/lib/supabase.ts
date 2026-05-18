// Browser Supabase client. Reads VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
// from the .env file. When unset, `supabase` is null and data hooks fall back
// to the in-memory mocks so the demo keeps working without a backend.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

export const hasSupabase = Boolean(url && key && !url.includes("YOUR-PROJECT-REF"));

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "mirie-sb-auth" },
    })
  : null;
