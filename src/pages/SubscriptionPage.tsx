import { format, parseISO } from "date-fns";
import { Crown, Sparkles, Zap } from "lucide-react";
import { LC_PRO_HIGHLIGHTS } from "@/lib/subscriptionPlans";
import { pickAccessibleSubscription } from "@/lib/subscription";
import { useLcSubscriptions } from "@/hooks/useLcSubscription";
import { useAuth } from "@/providers/AuthContext";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SubscriptionPage() {
  const { user } = useAuth();
  const { data: subs, isLoading } = useLcSubscriptions(user?.id);
  const active = pickAccessibleSubscription(subs);

  return (
    <div className="relative space-y-8 p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 size-96 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 size-80 rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      <div className="relative space-y-2 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
          <Crown className="size-3.5" />
          PrepSmart LC Pro
        </div>
        <h1 className="font-display text-3xl font-extrabold text-white md:text-4xl">
          Subscription <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">Plans</span>
        </h1>
        <p className="max-w-2xl text-sm text-white/55">
          Unlock full Language Cert practice — Speaking, Writing, Reading, Listening, mock tests, and AI feedback.
          Practice Language Cert like a real exam with PrepSmart LC Pro.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#1a1a2e]/90 p-5 backdrop-blur-md md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Current access</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-6 w-48 bg-white/10" />
            ) : active ? (
              <>
                <p className="mt-1 font-display text-xl font-bold capitalize text-white">{active.plan} plan</p>
                <p className="text-sm text-white/50">
                  Active until {format(parseISO(active.current_period_end), "d MMM yyyy")}
                </p>
              </>
            ) : (
              <p className="mt-1 font-display text-xl font-bold text-white">Free tier</p>
            )}
          </div>
          {active ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-1.5 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
              <Sparkles className="size-4" />
              Pro active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-white/60 ring-1 ring-white/10">
              Upgrade to unlock all tasks
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="mb-5 flex items-center gap-2">
          <Zap className="size-5 text-amber-400" />
          <h2 className="font-display text-xl font-bold text-white">Choose your plan</h2>
        </div>
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : (
          <SubscriptionPlans activePlanId={active?.plan ?? null} />
        )}
      </div>

      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#12121f] p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-white">Everything in Pro</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {LC_PRO_HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5",
                "transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-white/10",
              )}
            >
              <Icon className="size-4 shrink-0 text-cyan-400" />
              <span className="text-xs font-medium text-white/75">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
