import { format, parseISO } from "date-fns";
import { CalendarDays, CreditCard, Medal, Target } from "lucide-react";
import { ActivitySummary } from "@/components/dashboard/ActivitySummary";
import { StatCard } from "@/components/dashboard/StatCard";
import { WeeklyPerformanceChart } from "@/components/dashboard/WeeklyPerformanceChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { supabaseConfigured } from "@/lib/supabase/client";
import { subscriptionDaysRemaining } from "@/lib/subscription";
import { useAuth } from "@/providers/AuthContext";

function examSubtext(days: number | null) {
  if (days == null) return "Set your exam date in settings.";
  if (days < 0) return "Exam date has passed — keep practicing.";
  if (days < 3) return "Exam week — stay sharp!";
  if (days < 7) return "Crunch time!";
  return "Plenty of time — pace yourself.";
}

export function DashboardPage() {
  const { user, profile, profileLoading } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useDashboardStats(user?.id, profile);

  if (!supabaseConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Supabase not configured</p>
        <p className="mt-2 text-muted-foreground">
          Copy <code className="rounded bg-muted px-1">.env.example</code> to <code className="rounded bg-muted px-1">.env</code>{" "}
          and set your project URL and anon key. Expose the <code className="rounded bg-muted px-1">lc</code> schema in
          Supabase API settings, then run the SQL migration in <code className="rounded bg-muted px-1">supabase/migrations</code>.
        </p>
      </div>
    );
  }

  if (error) {
    const msg = (error as Error).message ?? String(error);
    const isSchemaLc =
      /invalid schema:\s*lc/i.test(msg) || /schema.*lc.*not/i.test(msg) || msg.includes("PGRST106");

    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">Could not load dashboard</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{msg}</p>
        {isSchemaLc ? (
          <div className="mt-4 space-y-3 rounded-lg border bg-background/80 p-4 text-foreground">
            <p className="font-medium">Fix: enable the <code className="rounded bg-muted px-1">lc</code> schema in Supabase</p>
            <ol className="list-decimal space-y-2 pl-4 text-muted-foreground">
              <li>
                Open <strong>Project Settings → API</strong>. Under <strong>Data API Settings</strong>, find{" "}
                <strong>Exposed schemas</strong> and add <code className="rounded bg-muted px-1">lc</code> (keep{" "}
                <code className="rounded bg-muted px-1">public</code> if you need it). Save.
              </li>
              <li>
                In <strong>SQL Editor</strong>, run the migration file{" "}
                <code className="rounded bg-muted px-1">supabase/migrations/20260424000000_lc_schema.sql</code> so the{" "}
                <code className="rounded bg-muted px-1">lc</code> schema and tables exist.
              </li>
              <li>
                Click <strong>Retry</strong> below (or refresh the page).
              </li>
            </ol>
          </div>
        ) : null}
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const loading = isLoading || profileLoading || isFetching;

  const days = data?.daysUntilExam ?? null;
  const sub = data?.activeSubscription ?? null;
  const subDays = subscriptionDaysRemaining(sub);
  const renewLabel = sub ? format(parseISO(sub.current_period_end), "d MMM yyyy") : "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-foreground md:text-4xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}. Track speaking & writing readiness for
          LanguageCert (B1–C2).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Days until exam"
              value={days != null ? String(Math.max(0, days)) : "—"}
              subtitle={examSubtext(days)}
              icon={CalendarDays}
              iconClassName="bg-orange-500"
            />
            <StatCard
              title="Subscription"
              value={sub && subDays != null ? `${subDays} days left` : "No active plan"}
              subtitle={sub ? `Renews ${renewLabel}` : "Subscribe to unlock full practice."}
              icon={CreditCard}
              iconClassName="bg-sky-600"
            />
            <StatCard
              title="Today's average"
              value={data?.todayAvg != null ? `${data.todayAvg.toFixed(1)}/45` : "—"}
              subtitle={
                data?.sevenDayAvg != null ? `7-day avg: ${data.sevenDayAvg.toFixed(1)}/45` : "7-day avg: —/45"
              }
              icon={Target}
              iconClassName="bg-emerald-600"
            />
            <StatCard
              title="Highest score"
              value={data?.highest != null ? `${data.highest.toFixed(1)}/45` : "—/45"}
              subtitle="Best across dialogues & rapid reviews"
              icon={Medal}
              iconClassName="bg-violet-600"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {loading || !data ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : (
            <ActivitySummary
              dialogueDone={data.dialogueDone}
              dialogueAvail={data.dialogueAvail}
              rapidDone={data.rapidDone}
              rapidAvail={data.rapidAvail}
              totalAttempts={data.totalAttempts}
            />
          )}
        </div>
        <div className="lg:col-span-2">
          {loading || !data ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : (
            <WeeklyPerformanceChart points={data.weekPoints} sevenDayAvg={data.sevenDayAvg} />
          )}
        </div>
      </div>
    </div>
  );
}
