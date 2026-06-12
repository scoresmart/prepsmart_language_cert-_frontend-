import * as React from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LC_SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from "@/lib/subscriptionPlans";

type Props = {
  activePlanId?: SubscriptionPlanId | string | null;
  onSelectPlan?: (planId: SubscriptionPlanId) => void;
  compact?: boolean;
};

export function SubscriptionPlans({ activePlanId, onSelectPlan, compact }: Props) {
  const [loading, setLoading] = React.useState<SubscriptionPlanId | null>(null);

  const handleSelect = async (plan: SubscriptionPlan) => {
    setLoading(plan.id);
    if (onSelectPlan) {
      onSelectPlan(plan.id);
      setLoading(null);
      return;
    }
    await new Promise((r) => setTimeout(r, 600));
    setLoading(null);
    toast.info(`${plan.name} selected — Stripe checkout will be connected in the next release.`, {
      description: "Contact support to activate your PrepSmart LC Pro plan manually.",
      duration: 6000,
    });
  };

  return (
    <div className={cn("grid gap-5", compact ? "md:grid-cols-1" : "md:grid-cols-3")}>
      {LC_SUBSCRIPTION_PLANS.map((plan, i) => {
        const isActive = activePlanId === plan.id;
        const isLoading = loading === plan.id;

        return (
          <div
            key={plan.id}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-3xl border p-6 transition-all duration-500",
              plan.highlight
                ? "border-cyan-500/40 bg-gradient-to-b from-cyan-500/10 via-[#1a1a2e] to-[#12121f] shadow-xl shadow-cyan-900/20 hover:-translate-y-2 hover:shadow-cyan-900/40"
                : "border-white/10 bg-[#1a1a2e]/80 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg",
              isActive && "ring-2 ring-emerald-400/60",
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {plan.badge && (
              <span
                className={cn(
                  "absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  plan.highlight
                    ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-gray-900"
                    : "bg-amber-400/20 text-amber-300",
                )}
              >
                {plan.badge}
              </span>
            )}

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">PrepSmart LC</p>
              <h3 className="mt-1 font-display text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-xs text-white/45">{plan.priceNote}</p>
            </div>

            <div className="mb-5">
              <div className="flex items-end gap-1">
                <span className="font-display text-4xl font-extrabold text-white">{plan.price}</span>
                <span className="mb-1 text-sm text-white/45">/{plan.cadence.replace("per ", "")}</span>
              </div>
              {plan.savings && (
                <p className="mt-1 text-xs font-semibold text-emerald-400">{plan.savings}</p>
              )}
            </div>

            <ul className="mb-6 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-white/70">
                  <Check className="mt-0.5 size-4 shrink-0 text-cyan-400" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={isActive || isLoading}
              onClick={() => handleSelect(plan)}
              className={cn(
                "relative w-full overflow-hidden rounded-full py-2.5 text-sm font-bold transition-all duration-300 active:scale-95",
                plan.highlight
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-900/30 hover:scale-[1.02] hover:shadow-xl"
                  : "border border-white/20 bg-white/5 text-white hover:bg-white/10",
                isActive && "cursor-default opacity-70",
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing…
                </span>
              ) : isActive ? (
                "Current plan"
              ) : (
                <>
                  {plan.highlight && (
                    <Sparkles className="mr-1 inline size-3.5 animate-pulse" />
                  )}
                  Get {plan.name}
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
