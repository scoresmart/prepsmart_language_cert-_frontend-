import * as React from "react";
import { Activity, BarChart3, Headphones, Mic, PenLine, BookOpen, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeeklyPerformanceChart, type WeekPoint } from "@/components/dashboard/WeeklyPerformanceChart";
import { Skeleton } from "@/components/ui/skeleton";

type Tab = "overview" | "speaking" | "writing" | "reading" | "listening";

type Props = {
  weekPoints: WeekPoint[];
  sevenDayAvg: number | null;
  todayAvg: number | null;
  highest: number | null;
  totalAttempts: number;
  loading?: boolean;
};

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: "overview", label: "Overview", icon: BarChart3, color: "from-cyan-500 to-blue-500" },
  { id: "speaking", label: "Speaking", icon: Mic, color: "from-blue-500 to-indigo-500" },
  { id: "writing", label: "Writing", icon: PenLine, color: "from-amber-500 to-orange-500" },
  { id: "reading", label: "Reading", icon: BookOpen, color: "from-teal-500 to-emerald-500" },
  { id: "listening", label: "Listening", icon: Headphones, color: "from-pink-500 to-rose-500" },
];

export function PerformanceOverview({
  weekPoints,
  sevenDayAvg,
  todayAvg,
  highest,
  totalAttempts,
  loading,
}: Props) {
  const [active, setActive] = React.useState<Tab>("overview");
  const [pulseKey, setPulseKey] = React.useState(0);

  const handleTab = (id: Tab) => {
    setActive(id);
    setPulseKey((k) => k + 1);
  };

  const stats = [
    { label: "7-Day Average", value: sevenDayAvg != null ? `${sevenDayAvg.toFixed(1)}/45` : "—", icon: TrendingUp },
    { label: "Today's Score", value: todayAvg != null ? `${todayAvg.toFixed(1)}/45` : "—", icon: Activity },
    { label: "Best Score", value: highest != null ? `${highest.toFixed(1)}/45` : "—", icon: BarChart3 },
    { label: "Total Attempts", value: String(totalAttempts), icon: Mic },
  ];

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
                onClick={() => handleTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300",
                  isActive
                    ? "bg-white text-gray-900 shadow-lg scale-105"
                    : "border border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95",
                )}
              >
                {isActive && (
                  <span
                    className={cn("absolute inset-0 bg-gradient-to-r opacity-20", tab.color)}
                    key={pulseKey}
                  />
                )}
                <Icon className="relative size-3.5" />
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={`${active}-${pulseKey}`}
        className="animate-fade-in-up space-y-5"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.label}
                type="button"
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-white/10 hover:shadow-lg hover:shadow-cyan-900/10 active:scale-95"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Icon className="size-4 text-cyan-400 transition-transform duration-300 group-hover:scale-110" />
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-white/45">{stat.label}</p>
                <p className="mt-0.5 text-lg font-bold text-white">
                  {loading ? "…" : stat.value}
                </p>
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f1a]/60 p-1 backdrop-blur-sm transition-all duration-500">
          {loading || !weekPoints.length ? (
            <Skeleton className="h-64 w-full rounded-xl bg-white/5" />
          ) : active === "overview" ? (
            <WeeklyPerformanceChart points={weekPoints} sevenDayAvg={sevenDayAvg} dark />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-white/5 to-transparent p-8 text-center">
              <div className={cn("rounded-2xl bg-gradient-to-br p-4", TABS.find((t) => t.id === active)?.color)}>
                {React.createElement(TABS.find((t) => t.id === active)!.icon, { className: "size-8 text-white" })}
              </div>
              <p className="font-display text-lg font-bold capitalize text-white">{active} Performance</p>
              <p className="max-w-sm text-sm text-white/50">
                Detailed {active} analytics will appear here as you complete more LC practice sessions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
