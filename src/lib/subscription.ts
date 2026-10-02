import { addDays, isAfter, parseISO } from "date-fns";
import type { LcSubscription } from "@/types/lc";

/** Paid access survives a few days past its end date while Stripe retries a failed renewal. Trials get none. */
const GRACE_DAYS = 3;

/** Stand-in period end for access granted without an expiry date (open-ended admin grants). */
export const LC_OPEN_ENDED_EXPIRY = "9999-12-31T00:00:00.000Z";

export function isOpenEnded(sub: LcSubscription | null): boolean {
  return sub?.current_period_end === LC_OPEN_ENDED_EXPIRY;
}

/** Subscription row that currently allows LC practice (includes grace after period end). */
export function pickAccessibleSubscription(rows: LcSubscription[] | null | undefined): LcSubscription | null {
  if (!rows?.length) return null;
  const now = new Date();
  const sorted = [...rows].sort(
    (a, b) => parseISO(b.current_period_end).getTime() - parseISO(a.current_period_end).getTime(),
  );
  for (const s of sorted) {
    if (s.status !== "active" && s.status !== "trialing" && s.status !== "past_due") continue;
    const graceEnd = addDays(parseISO(s.current_period_end), s.plan === "trial" ? 0 : GRACE_DAYS);
    if (!isAfter(now, graceEnd)) return s;
  }
  return null;
}

export function hasLcPracticeAccess(subs: LcSubscription[] | null | undefined): boolean {
  return pickAccessibleSubscription(subs) !== null;
}

export function subscriptionDaysRemaining(sub: LcSubscription | null): number | null {
  if (!sub || isOpenEnded(sub)) return null;
  const end = parseISO(sub.current_period_end);
  const now = new Date();
  const ms = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
