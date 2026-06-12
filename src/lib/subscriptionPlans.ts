import type { LucideIcon } from "lucide-react";
import { BarChart3, Bot, Headphones, Mic, PenLine, Sparkles, Zap } from "lucide-react";

export type SubscriptionPlanId = "monthly" | "quarterly" | "annual";

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

export const LC_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    name: "Monthly Pro",
    price: "AU$49",
    priceNote: "Billed monthly",
    cadence: "per month",
    highlight: false,
    features: [
      "Unlimited LC Speaking, Writing, Reading & Listening",
      "Real exam-style practice tasks",
      "AI-powered feedback on submissions",
      "Progress dashboard & weekly analytics",
    ],
  },
  {
    id: "quarterly",
    name: "Quarterly Pro",
    price: "AU$129",
    priceNote: "Billed every 3 months",
    cadence: "every 3 months",
    badge: "Most Popular",
    highlight: true,
    savings: "Save 12%",
    features: [
      "Everything in Monthly Pro",
      "Mock test access & sectional tests",
      "Priority AI tutor responses",
      "Vocabulary hub & word lists",
    ],
  },
  {
    id: "annual",
    name: "Annual Pro",
    price: "AU$399",
    priceNote: "Billed once per year",
    cadence: "per year",
    badge: "Best Value",
    highlight: false,
    savings: "Save 32%",
    features: [
      "Everything in Quarterly Pro",
      "Full LC question bank access",
      "Exam-day study planner",
      "Tutor feedback credits included",
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
