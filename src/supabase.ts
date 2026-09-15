import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (client) return client;

  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  return client;
}
