import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Valid-shaped placeholders so `createClient` never throws when `.env` is missing (avoids a blank page). */
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
/** Supabase demo-style anon JWT shape (not a real project — replace with your anon key in `.env`). */
const PLACEHOLDER_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const supabaseConfigured = Boolean(envUrl && envAnon);

const url = envUrl || PLACEHOLDER_URL;
const anon = envAnon || PLACEHOLDER_ANON;

if (!supabaseConfigured) {
  console.warn(
    "[PrepSmart LC] Using placeholder Supabase URL/key. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env — PostgREST must expose schema `lc`.",
  );
}

/** One storage namespace per Supabase host so switching projects / keys does not reuse a broken session ("Invalid ID"). */
function authStorageKey(supabaseUrl: string): string {
  try {
    const { hostname } = new URL(supabaseUrl);
    return `prepsmart-lc-auth-${hostname.replace(/[^a-z0-9-]/gi, "-")}`;
  } catch {
    return "prepsmart-lc-auth";
  }
}

/**
 * Main client — uses `public` schema so auth + all tables work out of the box.
 * If your project uses a custom `lc` schema, expose it in Supabase Dashboard →
 * Settings → API → Extra schemas and change `schema` back to "lc".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, any, any> = createClient(url, anon, {
  db: { schema: "public" },
  auth: {
    storage: localStorage,
    storageKey: authStorageKey(url),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
