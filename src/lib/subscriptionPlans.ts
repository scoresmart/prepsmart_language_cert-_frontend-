import type { LucideIcon } from "lucide-react";
import { BarChart3, Bot, Headphones, Mic, PenLine, Sparkles, Zap } from "lucide-react";

export type SubscriptionPlanId = "monthly";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  price: string;
  priceNote: string;
  cadence: string;
  badge?: string;
  highlight: boolean;
  savings?: string;
  features: string[];
};

/** Billed through Stripe price lookup key `lc_portal_monthly` (see supabase/functions/lc-billing). */
export const LC_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    name: "LC Portal Pro",
    price: "AU$25",
    priceNote: "Billed monthly · cancel anytime",
    cadence: "per month",
    highlight: true,
    features: [
      "Unlimited LC Speaking, Writing, Reading & Listening",
      "Real exam-style practice tasks & mock tests",
      "AI-powered feedback on submissions",
      "Progress dashboard & weekly analytics",
      "Vocabulary hub & word lists",
    ],
  },
];

export const LC_PRO_HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: Mic, label: "Speaking practice" },
  { icon: PenLine, label: "Writing tasks" },
  { icon: Headphones, label: "Listening drills" },
  { icon: BarChart3, label: "Performance analytics" },
  { icon: Bot, label: "AI tutor support" },
  { icon: Zap, label: "Unlimited attempts" },
  { icon: Sparkles, label: "LC exam simulations" },
];
