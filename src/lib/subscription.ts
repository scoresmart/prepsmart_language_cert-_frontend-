import { addDays, isAfter, parseISO } from "date-fns";
import type { LcSubscription } from "@/types/lc";

const GRACE_DAYS = 3;

/** Subscription row that currently allows LC practice (includes grace after period end). */
export function pickAccessibleSubscription(rows: LcSubscription[] | null | undefined): LcSubscription | null {
  if (!rows?.length) return null;
  const now = new Date();
  const sorted = [...rows].sort(
    (a, b) => parseISO(b.current_period_end).getTime() - parseISO(a.current_period_end).getTime(),
  );
  for (const s of sorted) {
    if (s.status !== "active" && s.status !== "trialing" && s.status !== "past_due") continue;
    const graceEnd = addDays(parseISO(s.current_period_end), GRACE_DAYS);
    if (!isAfter(now, graceEnd)) return s;
  }
  return null;
}

export function hasLcPracticeAccess(subs: LcSubscription[] | null | undefined): boolean {
  return pickAccessibleSubscription(subs) !== null;
}

export function subscriptionDaysRemaining(sub: LcSubscription | null): number | null {
  if (!sub) return null;
  const end = parseISO(sub.current_period_end);
  const now = new Date();
  const ms = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
