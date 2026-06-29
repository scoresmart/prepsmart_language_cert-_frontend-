import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

/** Active Supabase project for PrepSmart LC (users + LC data live here). */
const LC_SUPABASE_REF = "sepzceaicoldqhyxxzff";
const LC_SUPABASE_URL = `https://${LC_SUPABASE_REF}.supabase.co`;

/** Deprecated migration target — must not be used for LC auth in production. */
const DEPRECATED_SUPABASE_REF = "ajfhzylokauqcjrokizx";

function requireProductionEnv(name: string, value: string | undefined) {
  if (!value?.trim() || value.includes("YOUR_PROJECT") || value === "your_anon_key") {
    throw new Error(
      `[build] Missing ${name}. Add it in Vercel → Settings → Environment Variables (Production), then redeploy.`,
    );
  }
}

function jwtProjectRef(token: string | undefined): string | null {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = JSON.parse(
      Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { ref?: string };
    return json.ref ?? null;
  } catch {
    return null;
  }
}

/** Read .env.production directly so Vercel process.env cannot override canonical values. */
function readEnvProduction(): Record<string, string> {
  const filePath = path.resolve(process.cwd(), ".env.production");
  if (!existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function resolveProductionSupabase(
  url: string | undefined,
  anon: string | undefined,
): { url: string; anon: string } {
  const canonical = readEnvProduction();
  const canonicalUrl = canonical.VITE_SUPABASE_URL || LC_SUPABASE_URL;
  const canonicalAnon = canonical.VITE_SUPABASE_ANON_KEY || anon || "";

  const urlWrong =
    !url?.includes(LC_SUPABASE_REF) || url.includes(DEPRECATED_SUPABASE_REF);
  const anonRef = jwtProjectRef(anon);
  const anonWrong = anonRef != null && anonRef !== LC_SUPABASE_REF;

  if (urlWrong || anonWrong) {
    console.warn(
      `[build] Supabase env mismatch (url=${url ?? "missing"}, anon ref=${anonRef ?? "unknown"}). ` +
        `Using LC project ${LC_SUPABASE_REF} from .env.production.`,
    );
    return { url: canonicalUrl, anon: canonicalAnon };
  }

  return { url: url!, anon: anon! };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  let supabaseUrl = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  let supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (mode === "production") {
    const resolved = resolveProductionSupabase(supabaseUrl, supabaseAnonKey);
    supabaseUrl = resolved.url;
    supabaseAnonKey = resolved.anon;
    process.env.VITE_SUPABASE_URL = supabaseUrl;
    process.env.VITE_SUPABASE_ANON_KEY = supabaseAnonKey;

    if (process.env.VERCEL === "1") {
      requireProductionEnv("VITE_SUPABASE_URL", supabaseUrl);
      requireProductionEnv("VITE_SUPABASE_ANON_KEY", supabaseAnonKey);
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: { port: 5174, host: true },
    define:
      mode === "production"
        ? {
            "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
            "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
          }
        : undefined,
  };
});
