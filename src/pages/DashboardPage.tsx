import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  Flame,
  Headphones,
  Info,
  Mic,
  PenLine,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { supabaseConfigured } from "@/lib/supabase/client";
import { subscriptionDaysRemaining } from "@/lib/subscription";
import { useAuth } from "@/providers/AuthContext";
import { WeeklyPerformanceChart } from "@/components/dashboard/WeeklyPerformanceChart";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

type Module = {
  label: string;
  icon: React.ElementType;
  color: string;
  ring: string;
  bg: string;
  to: string;
  done: number;
  total: number;
};

/* ─── sub-components ──────────────────────────────────────────────────────── */

function TargetRings({ targetBand }: { targetBand: number }) {
  const bands = [8, 7, 6, 5, 4, 3];
  const labels = ["C1", "B2", "B1", "A2", "A1", ""];
  const colors = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#8b5cf6"];
  const sizes = [96, 84, 72, 60, 48, 36];

  return (
    <div className="relative flex items-center justify-center">
      {bands.map((band, i) => (
        <div
          key={band}
          className="absolute rounded-full border-2 flex items-center justify-center"
          style={{
            width: sizes[i],
            height: sizes[i],
            borderColor: band === targetBand ? colors[0] : `${colors[i]}40`,
            backgroundColor: band === targetBand ? `${colors[0]}15` : "transparent",
          }}
        />
      ))}
      {/* Center needle */}
      <div className="relative z-10 flex size-8 flex-col items-center justify-center">
        <div className="h-5 w-0.5 rounded-full bg-green-500" style={{ transformOrigin: "bottom", transform: "rotate(-30deg)" }} />
      </div>
      {/* Band labels */}
      {bands.map((band, i) => (
        <span
          key={`label-${band}`}
          className="absolute text-[9px] font-bold"
          style={{
            color: band === targetBand ? colors[0] : `${colors[i]}99`,
            top: `calc(50% - ${sizes[i] / 2}px - 2px)`,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {labels[i]}
        </span>
      ))}
      {/* Target label */}
      <div
        className="absolute bottom-0 flex items-center gap-1 rounded-full px-2 py-0.5"
        style={{ background: "#22c55e20", border: "1px solid #22c55e50" }}
      >
        <div className="size-1.5 rounded-full bg-green-500" />
        <span className="text-[10px] font-semibold text-green-400">B2 Level</span>
        <Info className="size-2.5 text-green-400/70" />
      </div>
    </div>
  );
}

function ModuleCard({ mod }: { mod: Module }) {
  const pct = mod.total > 0 ? Math.round((mod.done / mod.total) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <Link to={mod.to} className="group relative flex flex-col items-center">
        {/* Outer ring */}
        <div
          className="relative flex items-center justify-center rounded-full p-1 transition-transform group-hover:scale-105"
          style={{ background: `conic-gradient(${mod.ring} ${pct * 3.6}deg, #e5e7eb ${pct * 3.6}deg)` }}
        >
          <div className={cn("flex size-20 flex-col items-center justify-center rounded-full", mod.bg)}>
            <mod.icon className="size-6 text-white" />
            <span className="mt-0.5 text-[10px] font-semibold text-white">{mod.label}</span>
            <span className="text-[8px] text-white/70">{mod.total.toLocaleString()} Qs</span>
          </div>
        </div>
        {/* Dots */}
        <span
          className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-white shadow"
          style={{ background: mod.ring }}
        />
      </Link>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{pct}% · {mod.done}/{mod.total}</p>
        <Link to={mod.to} className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600">
          Start <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ─── main page ───────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const { user, profile, profileLoading } = useAuth();
  const { data, isLoading, error, refetch, isFetching } = useDashboardStats(user?.id, profile);

  /* ── error / config states ── */
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

  const loading = isLoading || profileLoading || isFetching;
  const username = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const days = data?.daysUntilExam ?? null;
  const sub = data?.activeSubscription ?? null;
  const subDays = subscriptionDaysRemaining(sub);
  const targetBand = 8; // could come from profile.target_level
  const studyStreak = 0; // placeholder – add streak logic when available

  const modules: Module[] = [
    {
      label: "Speaking",
      icon: Mic,
      color: "#3b82f6",
      ring: "#3b82f6",
      bg: "bg-blue-500",
      to: "/practice/speaking",
      done: data?.dialogueDone ?? 0,
      total: data?.dialogueAvail ?? 0,
    },
    {
      label: "Writing",
      icon: PenLine,
      color: "#f59e0b",
      ring: "#f59e0b",
      bg: "bg-amber-500",
      to: "/practice/writing",
      done: data?.rapidDone ?? 0,
      total: data?.rapidAvail ?? 0,
    },
    {
      label: "Reading",
      icon: BookOpen,
      color: "#14b8a6",
      ring: "#14b8a6",
      bg: "bg-teal-500",
      to: "/practice/reading",
      done: 0,
      total: 0,
    },
    {
      label: "Listening",
      icon: Headphones,
      color: "#ec4899",
      ring: "#ec4899",
      bg: "bg-pink-500",
      to: "/practice/listening",
      done: 0,
      total: 0,
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ── Welcome Banner ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, #0f4c3a 0%, #1a7a5e 30%, #0e9f73 60%, #0d7d5b 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 right-24 size-32 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Left content */}
          <div className="flex-1">
            {/* Welcome chip */}
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <span>✨</span> Welcome back!
            </div>

            <p className="text-base text-white/80">
              Hi {username}! <span>👋</span>
            </p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight md:text-3xl">
              Let's Target{" "}
              <span className="text-yellow-400">B2 Level</span>
            </h1>

            <button
              type="button"
              className="mt-3 flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/20"
            >
              <Target className="size-4" />
              Set Target Score
            </button>

            {/* Stats row */}
            <div className="mt-5 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur">
                <Flame className="size-4 text-orange-300" />
                <div>
                  <p className="text-[10px] font-medium text-white/60">Study Streak</p>
                  <p className="text-sm font-bold">{studyStreak} Days</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur">
                <Zap className="size-4 text-yellow-300" />
                <div>
                  <p className="text-[10px] font-medium text-white/60">Questions Done</p>
                  <p className="text-sm font-bold">{data?.totalAttempts ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur">
                <CalendarDays className="size-4 text-blue-300" />
                <div>
                  <p className="text-[10px] font-medium text-white/60">Days to Exam</p>
                  {loading ? (
                    <Skeleton className="mt-0.5 h-4 w-16 bg-white/20" />
                  ) : days != null ? (
                    <p className="text-sm font-bold">{Math.max(0, days)} Days</p>
                  ) : (
                    <Link to="/settings" className="text-sm font-bold underline underline-offset-2 hover:text-yellow-300">
                      Set Date
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* CTA bar */}
            <div className="mt-5 flex flex-col gap-3 rounded-xl bg-white/10 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Start strong and stay consistent! 💪</p>
                <p className="text-xs text-white/60">Practice regularly and watch your skills improve.</p>
              </div>
              <Link
                to="/practice/speaking"
                className="flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-gray-800 shadow transition-all hover:bg-gray-100 hover:shadow-md"
              >
                Start Practice Now <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Right: Target rings */}
          <div className="hidden lg:flex lg:items-center lg:pr-6 lg:pt-4">
            <TargetRings targetBand={targetBand} />
          </div>
        </div>
      </div>

      {/* ── Practice Modules ───────────────────────────────────── */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50">
              <Zap className="size-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white">Practice Modules</h2>
              <p className="text-xs text-gray-500">Choose a skill to improve</p>
            </div>
          </div>
          <Link to="/attempts" className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600">
            View all <ArrowRight className="size-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-around">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="size-24 rounded-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {modules.map((mod) => (
              <ModuleCard key={mod.label} mod={mod} />
            ))}
          </div>
        )}
      </div>

      {/* ── Performance Chart ──────────────────────────────────── */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-card">
        <h2 className="mb-4 text-base font-bold text-gray-800 dark:text-white">Weekly Performance</h2>
        {loading || !data ? (
          <Skeleton className="h-56 w-full rounded-xl" />
        ) : (
          <WeeklyPerformanceChart points={data.weekPoints} sevenDayAvg={data.sevenDayAvg} />
        )}
      </div>

      {/* ── Subscription Banner ────────────────────────────────── */}
      {!loading && !sub && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-yellow-300 bg-yellow-50 p-5 dark:border-yellow-500/30 dark:bg-yellow-500/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-yellow-800 dark:text-yellow-300">Unlock full practice access</p>
            <p className="mt-0.5 text-sm text-yellow-700/70 dark:text-yellow-400/60">
              Subscribe to access all {(data?.dialogueAvail ?? 0) + (data?.rapidAvail ?? 0)} questions and detailed feedback.
            </p>
          </div>
          <Link
            to="/subscription"
            className="shrink-0 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-yellow-900 shadow transition-colors hover:bg-yellow-300"
          >
            View Plans
          </Link>
        </div>
      )}

      {sub && subDays != null && subDays <= 7 && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-500/30 dark:bg-orange-500/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-orange-800 dark:text-orange-300">Subscription expiring soon</p>
            <p className="mt-0.5 text-sm text-orange-700/70 dark:text-orange-400/60">
              Your plan expires in {subDays} day{subDays !== 1 ? "s" : ""} on{" "}
              {format(parseISO(sub.current_period_end), "d MMM yyyy")}.
            </p>
          </div>
          <Link
            to="/subscription"
            className="shrink-0 rounded-lg bg-orange-400 px-4 py-2 text-sm font-bold text-white shadow transition-colors hover:bg-orange-300"
          >
            Renew Now
          </Link>
        </div>
      )}
    </div>
  );
}

