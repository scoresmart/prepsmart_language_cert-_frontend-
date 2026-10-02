// Stripe Checkout + Customer Portal for PrepSmart LC Pro.
// Deployed to Supabase project sepzceaicoldqhyxxzff as `lc-billing` (verify_jwt = true).
// Secrets (LC_-prefixed: the project is shared with stripe-renewal-webhook): LC_STRIPE_SECRET_KEY. Optional: LC_SITE_URL (defaults to the caller's Origin).
// The price is looked up by LC_PRICE_LOOKUP_KEY, so test and live mode only differ by the key.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LC_PRICE_LOOKUP_KEY = "lc_portal_monthly";
/** Tags Stripe objects so lc-stripe-webhook ignores the account's other products. */
const LC_APP_TAG = "prepsmart_lc";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fail(message: string, status = 400) {
  return json({ success: false, error: message }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Method not allowed", 405);

  const stripeKey = Deno.env.get("LC_STRIPE_SECRET_KEY");
  if (!stripeKey) return fail("Billing is not configured", 500);
  const stripe = new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return fail("Unauthorized", 401);
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return fail("Unauthorized", 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action = String(body.action ?? "checkout");
  const siteUrl = (Deno.env.get("LC_SITE_URL") || req.headers.get("Origin") || "").replace(/\/+$/, "");
  if (!/^https?:\/\//.test(siteUrl)) return fail("Cannot determine return URL");

  try {
    const { data: existing } = await admin
      .from("lc_stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (action === "portal") {
      if (!existing) return fail("No billing account yet", 404);
      const portal = await stripe.billingPortal.sessions.create({
        customer: existing.stripe_customer_id,
        return_url: `${siteUrl}/subscription`,
      });
      return json({ success: true, url: portal.url });
    }

    if (action !== "checkout") return fail(`Unknown action: ${action}`);

    let customerId = existing?.stripe_customer_id as string | undefined;
    if (customerId) {
      // Don't sell a second subscription to someone who already has one running.
      const { data: live } = await admin
        .from("lc_stripe_subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due"])
        .limit(1);
      if (live?.length) return fail("You already have an active subscription", 409);
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { app: LC_APP_TAG, user_id: user.id },
      });
      customerId = customer.id;
      const { error } = await admin
        .from("lc_stripe_customers")
        .insert({ user_id: user.id, stripe_customer_id: customerId });
      if (error) throw error;
    }

    const prices = await stripe.prices.list({ lookup_keys: [LC_PRICE_LOOKUP_KEY], active: true, limit: 1 });
    const price = prices.data[0];
    if (!price) {
      // Log which account/mode the key belongs to and the exact lookup keys Stripe has (JSON-quoted, so stray
      // whitespace typed into the dashboard shows up) — a key from the wrong account or a mistyped lookup key
      // otherwise looks identical from here.
      const account = await stripe.accounts.retrieve().catch(() => null);
      const mode = stripeKey.includes("_live_") ? "live" : "test";
      const archived = await stripe.prices.list({ lookup_keys: [LC_PRICE_LOOKUP_KEY], limit: 1 }).catch(() => null);
      const keyed = await stripe.prices.list({ active: true, limit: 100 }).catch(() => null);
      const keys = (keyed?.data ?? []).filter((p) => p.lookup_key).map((p) => `${p.id}=${JSON.stringify(p.lookup_key)}`);
      console.error("lc-billing: price lookup failed", { mode, account: account?.id, archived: archived?.data[0]?.id, keys });
      return fail(`No active Stripe price with lookup key ${LC_PRICE_LOOKUP_KEY}`, 500);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: price.id, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { app: LC_APP_TAG, user_id: user.id },
      subscription_data: { metadata: { app: LC_APP_TAG, user_id: user.id } },
      success_url: `${siteUrl}/subscription?checkout=success`,
      cancel_url: `${siteUrl}/subscription?checkout=cancelled`,
    });
    return json({ success: true, url: session.url });
  } catch (err) {
    console.error("lc-billing error", err);
    return fail(err instanceof Error ? err.message : "Billing request failed", 500);
  }
});
