import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { LcStripeSubscription, LcSubscription } from "@/types/lc";
import { LC_OPEN_ENDED_EXPIRY } from "@/lib/subscription";

import { isRecoverableDbError } from "@/lib/supabase/errors";

const LC_SUBJECT = "Language Cert";

/**
 * LC access lives in the shared `student_access` table (one row per student with subject = 'Language Cert'),
 * written by the admin panel and by the lc-stripe-webhook function. It's mapped onto LcSubscription so the
 * paywall helpers in lib/subscription stay source-agnostic.
 */
export async function fetchLcAccess(userId: string): Promise<LcSubscription[]> {
  const { data, error } = await supabase
    .from("student_access")
    .select("id,student_id,status,course_type,course_start_date,course_expiry_at,created_at")
    .eq("student_id", userId)
    .eq("subject", LC_SUBJECT)
    .maybeSingle();
  if (error) {
    if (isRecoverableDbError(error)) {
      console.warn("[PrepSmart LC] student_access unavailable:", error);
      return [];
    }
    throw error;
  }
  if (!data) return [];
  return [
    {
      id: data.id,
      user_id: data.student_id,
      plan: data.course_type === "trial" ? "trial" : "pro",
      status: data.status === "active" ? "active" : "cancelled",
      current_period_start: data.course_start_date ?? data.created_at,
      current_period_end: data.course_expiry_at ?? LC_OPEN_ENDED_EXPIRY,
      stripe_subscription_id: null,
      stripe_customer_id: null,
      cancelled_at: null,
      created_at: data.created_at,
    },
  ];
}

export function useLcSubscriptions(userId: string | undefined, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ["lc", "subscriptions", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchLcAccess(userId as string),
    refetchInterval: options?.refetchInterval,
  });
}

/** The student's own Stripe subscription, if they've ever checked out (drives "Manage billing"). */
export function useLcStripeSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ["lc", "stripe-subscription", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lc_stripe_subscriptions")
        .select("stripe_subscription_id,status,current_period_end,cancel_at_period_end")
        .eq("user_id", userId as string)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        if (isRecoverableDbError(error)) return null;
        throw error;
      }
      return data as LcStripeSubscription | null;
    },
  });
}
