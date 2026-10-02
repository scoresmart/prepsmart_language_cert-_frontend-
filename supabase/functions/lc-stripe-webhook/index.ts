// Stripe webhook for PrepSmart LC Pro.
// Deployed to Supabase project sepzceaicoldqhyxxzff as `lc-stripe-webhook` (verify_jwt = false —
// Stripe can't send a Supabase JWT; every request is authenticated by its Stripe signature instead).
// Secrets (LC_-prefixed: the project is shared with stripe-renewal-webhook): LC_STRIPE_SECRET_KEY, LC_STRIPE_WEBHOOK_SECRET.
//
// The Stripe account is shared with other products, so only subscriptions tagged
// metadata.app = "prepsmart_lc" (set by lc-billing) are processed; everything else gets a 200 and is ignored.
// Each event re-fetches the subscription from Stripe, so out-of-order or repeated deliveries are harmless.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.7.0";

const LC_APP_TAG = "prepsmart_lc";
const LC_SUBJECT = "Language Cert";
/** Statuses that extend access. past_due doesn't: the student keeps what they paid for while Stripe retries. */
const ENTITLED = new Set(["active", "trialing"]);

const stripeKey = Deno.env.get("LC_STRIPE_SECRET_KEY");
const stripe = stripeKey ? new Stripe(stripeKey, { httpClient: Stripe.createFetchHttpClient() }) : null;
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}

function subscriptionIdFromEvent(event: Stripe.Event): string | null {
  const obj = event.data.object as unknown as Record<string, unknown>;
  switch (event.type) {
    case "checkout.session.completed":
      return (obj as unknown as Stripe.Checkout.Session).mode === "subscription"
        ? idOf((obj as unknown as Stripe.Checkout.Session).subscription)
        : null;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return String(obj.id);
    case "invoice.paid":
    case "invoice.payment_failed": {
      // `subscription` on API versions before 2025-03-31, `parent.subscription_details` after.
      const parent = obj.parent as { subscription_details?: { subscription?: string } } | undefined;
      return idOf(obj.subscription as string | null) ?? parent?.subscription_details?.subscription ?? null;
    }
    default:
      return null;
  }
}

async function resolveUserId(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.user_id) return sub.metadata.user_id;
  const { data } = await admin
    .from("lc_stripe_customers")
    .select("user_id")
    .eq("stripe_customer_id", idOf(sub.customer))
    .maybeSingle();
  return data?.user_id ?? null;
}

async function grantAccess(userId: string, periodEnd: Date) {
  const { data: row, error: readError } = await admin
    .from("student_access")
    .select("id,course_type,course_expiry_at")
    .eq("student_id", userId)
    .eq("subject", LC_SUBJECT)
    .maybeSingle();
  if (readError) throw readError;

  if (!row) {
    const { error } = await admin.from("student_access").insert({
      student_id: userId,
      subject: LC_SUBJECT,
      status: "active",
      practice_portal_only: true,
      course_start_date: new Date().toISOString().slice(0, 10),
      course_expiry_at: periodEnd.toISOString(),
    });
    // Stripe fires several events for one checkout at once; if a parallel delivery created the row first,
    // fall through to the update path instead of failing.
    if (error?.code === "23505") return grantAccess(userId, periodEnd);
    if (error) throw error;
    return;
  }

  const isTrial = row.course_type === "trial";
  const current = row.course_expiry_at ? new Date(row.course_expiry_at) : null;
  // A non-trial row with no expiry is an open-ended admin grant — never shorten it.
  const openEnded = !isTrial && current === null;
  const expiry = openEnded ? null : current && current > periodEnd ? current : periodEnd;

  const { error } = await admin
    .from("student_access")
    .update({
      status: "active",
      course_expiry_at: expiry ? expiry.toISOString() : null,
      // cap_free_trial_access clamps trial rows to 24h, so a paying trial user must leave 'trial'.
      ...(isTrial ? { course_type: "smart_quad" } : {}),
    })
    .eq("id", row.id);
  if (error) throw error;
}

async function syncSubscription(stripe: Stripe, subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.metadata?.app !== LC_APP_TAG) return "ignored (not an LC subscription)";

  const userId = await resolveUserId(sub);
  if (!userId) throw new Error(`No LC user for subscription ${sub.id}`);

  const item = sub.items.data[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const periodEndUnix =
    (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? item?.current_period_end;
  const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;

  const { error } = await admin.from("lc_stripe_subscriptions").upsert(
    {
      stripe_subscription_id: sub.id,
      user_id: userId,
      stripe_customer_id: idOf(sub.customer),
      price_id: item?.price?.id ?? null,
      status: sub.status,
      current_period_end: periodEnd?.toISOString() ?? null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) throw error;

  if (ENTITLED.has(sub.status) && periodEnd) {
    await grantAccess(userId, periodEnd);
    return `granted ${userId} until ${periodEnd.toISOString()}`;
  }
  // Cancelled / unpaid / past_due: leave student_access alone; access lapses at the paid-through date.
  return `recorded ${sub.status} for ${userId}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("LC_STRIPE_WEBHOOK_SECRET");
  if (!stripe || !secret) {
    console.error("lc-stripe-webhook: LC_STRIPE_SECRET_KEY / LC_STRIPE_WEBHOOK_SECRET not set");
    return new Response("Webhook not configured", { status: 500 });
  }
  const signature = req.headers.get("Stripe-Signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret, undefined, cryptoProvider);
  } catch (err) {
    console.error("lc-stripe-webhook: bad signature", err instanceof Error ? err.message : err);
    return new Response("Invalid signature", { status: 400 });
  }

  const subscriptionId = subscriptionIdFromEvent(event);
  if (!subscriptionId) return Response.json({ received: true, ignored: event.type });

  try {
    const result = await syncSubscription(stripe, subscriptionId);
    console.log(`lc-stripe-webhook: ${event.type} ${event.id} → ${result}`);
    return Response.json({ received: true, result });
  } catch (err) {
    // Non-2xx makes Stripe retry with backoff.
    console.error(`lc-stripe-webhook: ${event.type} ${event.id} failed`, err);
    return new Response("Processing failed", { status: 500 });
  }
});
