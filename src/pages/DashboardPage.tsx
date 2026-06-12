import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { OverallPracticeCard, DEFAULT_SKILLS } from "@/components/dashboard/OverallPracticeCard";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { usePracticeProgress } from "@/hooks/usePracticeProgress";
import { supabaseConfigured } from "@/lib/supabase/client";
import { subscriptionDaysRemaining } from "@/lib/subscription";
import { useAuth } from "@/providers/AuthContext";

export function DashboardPage() {
  const { user, profile, profileLoading } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useDashboardStats(user?.id, profile);
  const progressQ = usePracticeProgress(Boolean(user?.id));

  if (!supabaseConfigured) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-medium">Supabase not configured</p>
          <p className="mt-2 text-muted-foreground">
            Copy <code className="rounded bg-muted px-1">.env.example</code> to{" "}
            <code className="rounded bg-muted px-1">.env</code> and set your project URL and anon key.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const msg = (error as Error).message ?? String(error);
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
          <p className="font-medium text-destructive">Could not load dashboard</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">{msg}</p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const loading = isLoading || profileLoading || isFetching || progressQ.isLoading;
  const username = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const days = data?.daysUntilExam ?? null;
  const sub = data?.activeSubscription ?? null;
  const subDays = subscriptionDaysRemaining(sub);

  const moduleKeys = ["speaking", "writing", "reading", "listening"] as const;
  const skillData = DEFAULT_SKILLS.map((s, i) => {
    const key = moduleKeys[i];
    const mod = progressQ.data?.modules[key];
    return {
      ...s,
      done: mod?.practiced ?? 0,
      total: mod?.total ?? 0,
    };
  });

  const totalDone = progressQ.data?.overall.practiced ?? skillData.reduce((s, k) => s + k.done, 0);
  const totalAvail = progressQ.data?.overall.total ?? skillData.reduce((s, k) => s + k.total, 0);

  return (
    <div className="relative space-y-6 p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 size-96 rounded-full bg-cyan-600/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 size-80 rounded-full bg-emerald-600/5 blur-3xl" />
      </div>

      <div className="relative space-y-6">
        <WelcomeBanner
          username={username}
          studyStreak={0}
          questionsDone={totalDone}
          daysToExam={days}
          loading={loading}
          targetLevel="B2 Level"
        />

        <OverallPracticeCard
          done={totalDone}
          total={totalAvail}
          skills={skillData}
          loading={loading}
        />

        <PerformanceOverview
          weekPoints={data?.weekPoints ?? []}
          sevenDayAvg={data?.sevenDayAvg ?? null}
          todayAvg={data?.todayAvg ?? null}
          highest={data?.highest ?? null}
          totalAttempts={data?.totalAttempts ?? 0}
          loading={loading}
        />

        {!loading && !sub && (
          <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 p-5 backdrop-blur-sm sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-yellow-200">Unlock full LC practice access</p>
              <p className="mt-0.5 text-sm text-yellow-200/60">
                Subscribe to access all {totalAvail.toLocaleString()} questions and detailed feedback.
              </p>
            </div>
            <Link
              to="/subscription"
              className="mt-3 inline-block shrink-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 px-5 py-2 text-sm font-bold text-gray-900 shadow-lg transition-all hover:scale-105 active:scale-95 sm:mt-0"
            >
              View Plans
            </Link>
          </div>
        )}

        {sub && subDays != null && subDays <= 7 && (
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-orange-200">Subscription expiring soon</p>
              <p className="mt-0.5 text-sm text-orange-200/60">
                Your plan expires in {subDays} day{subDays !== 1 ? "s" : ""} on{" "}
                {format(parseISO(sub.current_period_end), "d MMM yyyy")}.
              </p>
            </div>
            <Link
              to="/subscription"
              className="mt-3 inline-block shrink-0 rounded-full bg-orange-400 px-5 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 sm:mt-0"
            >
              Renew Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
