import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

function requireProductionEnv(name: string, value: string | undefined) {
  if (!value?.trim() || value.includes("YOUR_PROJECT") || value === "your_anon_key") {
    throw new Error(
      `[build] Missing ${name}. Add it in Vercel → Settings → Environment Variables (Production), then redeploy.`,
    );
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (mode === "production" && process.env.VERCEL === "1") {
    requireProductionEnv("VITE_SUPABASE_URL", supabaseUrl);
    requireProductionEnv("VITE_SUPABASE_ANON_KEY", supabaseAnonKey);
  }

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: { port: 5174, host: true },
  };
});
