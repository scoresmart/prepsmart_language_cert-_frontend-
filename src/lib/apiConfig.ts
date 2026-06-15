/**
 * Resolves the API base URL for local dev vs Vercel production.
 * Production uses same-origin /api/v1 (proxied by api/[...slug].ts → Railway).
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (import.meta.env.PROD) {
    return "/api/v1";
  }

  return "http://localhost:5000/api/v1";
}

export function isProductionMisconfigured(): boolean {
  if (!import.meta.env.PROD) return false;
  const url = getApiBaseUrl();
  return url.includes("localhost") || url.includes("127.0.0.1");
}
