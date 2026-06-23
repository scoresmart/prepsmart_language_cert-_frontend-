import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Override when `lc` is exposed in Supabase → Settings → API → Exposed schemas. Defaults to `public`. */
const dbSchema = (import.meta.env.VITE_SUPABASE_DB_SCHEMA as string | undefined)?.trim() || "public";

/** Valid-shaped placeholders for local dev only — never used in production builds. */
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const isProd = import.meta.env.PROD;
const hasRealConfig =
  Boolean(envUrl && envAnon) &&
  envUrl !== PLACEHOLDER_URL &&
  !envUrl.includes("YOUR_PROJECT") &&
  envAnon !== "your_anon_key";

export const supabaseConfigured = hasRealConfig;
export const supabaseDbSchema = dbSchema;

const url = hasRealConfig ? envUrl! : isProd ? envUrl || PLACEHOLDER_URL : envUrl || PLACEHOLDER_URL;
const anon = hasRealConfig ? envAnon! : isProd ? envAnon || PLACEHOLDER_ANON : envAnon || PLACEHOLDER_ANON;

if (!hasRealConfig) {
  const msg =
    "[PrepSmart LC] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables, then redeploy.";
  if (isProd) console.error(msg);
  else console.warn(msg);
} else if (dbSchema === "public") {
  console.info(
    "[PrepSmart LC] Using `public` schema. To use isolated LC tables, run the lc migration, expose schema `lc` in Supabase API settings, then set VITE_SUPABASE_DB_SCHEMA=lc in .env.",
  );
}

function authStorageKey(supabaseUrl: string): string {
  try {
    const { hostname } = new URL(supabaseUrl);
    return `prepsmart-lc-auth-${hostname.replace(/[^a-z0-9-]/gi, "-")}`;
  } catch {
    return "prepsmart-lc-auth";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, any, any> = createClient(url, anon, {
  db: { schema: dbSchema },
  auth: {
    storage: localStorage,
    storageKey: authStorageKey(url),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});
