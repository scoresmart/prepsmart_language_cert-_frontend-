import * as React from "react";
import { Activity, BarChart3, Headphones, Mic, PenLine, BookOpen, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { WeeklyPerformanceChart } from "@/components/dashboard/WeeklyPerformanceChart";
import { ModulePerformanceDetail } from "@/components/dashboard/ModulePerformanceDetail";
import { Skeleton } from "@/components/ui/skeleton";
import type { PerformanceAnalytics } from "@/hooks/usePerformanceAnalytics";
import type { ModuleAnalytics, PerformanceModule } from "@/lib/performanceAnalytics";

type Tab = "overview" | PerformanceModule;

type Props = {
  analytics?: PerformanceAnalytics;
  loading?: boolean;
};

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string; gradient: string }[] = [
  { id: "overview", label: "Overview", icon: BarChart3, color: "from-cyan-500 to-blue-500", gradient: "from-cyan-500 to-blue-500" },
  { id: "speaking", label: "Speaking", icon: Mic, color: "from-blue-500 to-indigo-500", gradient: "from-blue-500 to-indigo-500" },
  { id: "writing", label: "Writing", icon: PenLine, color: "from-amber-500 to-orange-500", gradient: "from-amber-500 to-orange-500" },
  { id: "reading", label: "Reading", icon: BookOpen, color: "from-teal-500 to-emerald-500", gradient: "from-teal-500 to-emerald-500" },
  { id: "listening", label: "Listening", icon: Headphones, color: "from-pink-500 to-rose-500", gradient: "from-pink-500 to-rose-500" },
];

function formatPct(value: number | null): string {
  return value != null ? `${value.toFixed(1)}%` : "—";
}

function statsForModule(data: ModuleAnalytics) {
  return [
    { label: "7-Day Average", value: formatPct(data.sevenDayAvg), icon: TrendingUp },
    { label: "Today's Score", value: formatPct(data.todayAvg), icon: Activity },
    { label: "Best Score", value: formatPct(data.highest), icon: BarChart3 },
    { label: "Total Attempts", value: String(data.totalAttempts), icon: Mic },
  ];
}

export function PerformanceOverview({ analytics, loading }: Props) {
  const [active, setActive] = React.useState<Tab>("overview");

  const current =
    active === "overview" ? analytics?.overview : analytics?.modules[active];

  const stats = current ? statsForModule(current) : statsForModule({
    totalAttempts: 0,
    sevenDayAvg: null,
    todayAvg: null,
    highest: null,
    weekPoints: [],
    recentAttempts: [],
    criteria: [],
    practiced: 0,
    totalQuestions: 0,
  });

  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#12121f] p-6 shadow-xl shadow-black/40">
      <div className="pointer-events-none absolute right-0 top-0 size-64 rounded-full bg-blue-600/5 blur-3xl" />

      <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Performance Overview</p>
          <h2 className="font-display text-2xl font-bold text-white">Your LC Journey</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300",
                  isActive
                    ? "bg-white text-gray-900 shadow-lg scale-105"
                    : "border border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95",
                )}
              >
                {isActive && (
                  <span className={cn("absolute inset-0 bg-gradient-to-r opacity-20", tab.color)} />
                )}
                <Icon className="relative size-3.5" />
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Icon className="size-4 text-cyan-400" />
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-white/45">{stat.label}</p>
                <p className="mt-0.5 text-lg font-bold text-white">{loading ? "…" : stat.value}</p>
              </div>
            );
          })}
        </div>

        {active === "overview" && analytics && !loading && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["speaking", "writing", "reading", "listening"] as const).map((mod) => {
              const m = analytics.modules[mod];
              const tab = TABS.find((t) => t.id === mod)!;
              const Icon = tab.icon;
              const pct = m.totalQuestions > 0 ? Math.round((m.practiced / m.totalQuestions) * 100) : 0;
              return (
                <button
                  key={mod}
                  type="button"
                  onClick={() => setActive(mod)}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-all hover:border-cyan-500/30 hover:bg-white/10"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-cyan-300" />
                    <span className="text-xs font-semibold text-white">{tab.label}</span>
                  </div>
                  <p className="mt-1 text-lg font-bold text-white">
                    {m.sevenDayAvg != null ? `${m.sevenDayAvg.toFixed(0)}%` : "—"}
                  </p>
                  <p className="text-[10px] text-white/45">
                    {m.practiced}/{m.totalQuestions} · {pct}% done
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f1a]/60 backdrop-blur-sm transition-all duration-500">
          {loading ? (
            <Skeleton className="m-1 h-72 w-full rounded-xl bg-white/5" />
          ) : active === "overview" && analytics ? (
            analytics.overview.totalAttempts === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="font-display text-lg font-bold text-white">No practice attempts yet</p>
                <p className="max-w-sm text-sm text-white/50">
                  Complete speaking, writing, reading, or listening practice to see your performance chart and analysis.
                </p>
                <Link
                  to="/practice"
                  className="mt-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-lg hover:scale-105"
                >
                  Start LC Practice
                </Link>
              </div>
            ) : (
              <WeeklyPerformanceChart
                points={analytics.overview.weekPoints}
                sevenDayAvg={analytics.overview.sevenDayAvg}
                dark
                maxScore={100}
                unitLabel="%"
                passLine={65}
                passLabel="Target 65%"
                title="All modules — last 7 days"
                subtitle="Combined average score percentage"
              />
            )
          ) : active !== "overview" && analytics ? (
            <ModulePerformanceDetail
              module={active}
              label={activeTab.label}
              color={activeTab.gradient}
              analytics={analytics.modules[active]}
              loading={loading}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-white/40">Unable to load analytics</div>
          )}
        </div>
      </div>
    </div>
  );
}
