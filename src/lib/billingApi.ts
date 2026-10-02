import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/** Supabase edge function in supabase/functions/lc-billing. */
const FUNCTION_NAME = "lc-billing";

async function redirectUrl(action: "checkout" | "portal"): Promise<string> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body: { action } });
  if (error) {
    let message = error.message;
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      if (body?.error) message = body.error;
    }
    throw new Error(message);
  }
  if (!data?.url) throw new Error(data?.error ?? "Billing request failed");
  return data.url as string;
}

export const billingApi = {
  /** Stripe Checkout for LC Pro; access is granted by lc-stripe-webhook once Stripe confirms payment. */
  startCheckout: async () => {
    window.location.assign(await redirectUrl("checkout"));
  },
  /** Stripe Customer Portal: update card, view invoices, cancel. */
  openPortal: async () => {
    window.location.assign(await redirectUrl("portal"));
  },
};
