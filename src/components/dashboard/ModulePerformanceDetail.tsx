import { format } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { WeeklyPerformanceChart } from "@/components/dashboard/WeeklyPerformanceChart";
import {
  formatQuestionTypeLabel,
  moduleForQuestionType,
  type ModuleAnalytics,
  type PerformanceModule,
} from "@/lib/performanceAnalytics";
import { moduleUrl } from "@/lib/practiceRoutes";
import { cn } from "@/lib/utils";

type Props = {
  module: PerformanceModule;
  label: string;
  color: string;
  analytics: ModuleAnalytics;
  loading?: boolean;
};

function scoreLabel(score: number, total: number): string {
  if (total <= 0) return "—";
  const pct = Math.round((score / total) * 100);
  return `${score}/${total} (${pct}%)`;
}

export function ModulePerformanceDetail({ module, label, analytics, loading, color }: Props) {
  const completionPct =
    analytics.totalQuestions > 0
      ? Math.round((analytics.practiced / analytics.totalQuestions) * 100)
      : 0;

  return (
    <div className="space-y-5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{label} — detailed analysis</h3>
          <p className="text-xs text-white/45">
            {analytics.practiced} of {analytics.totalQuestions} questions practiced · {analytics.totalAttempts} attempts
          </p>
        </div>
        <Link
          to={moduleUrl(module)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-4 py-1.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-105",
            color,
          )}
        >
          Practice {label} <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-white/60">Question coverage</span>
          <span className="font-bold text-white">{completionPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", color)}
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {analytics.criteria.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">AI criteria average</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {analytics.criteria.map((c) => (
              <div key={c.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white/75">{c.label}</span>
                  <span className="text-sm font-bold text-white">
                    {c.avg}/{c.max}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${Math.min(100, (c.avg / c.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <WeeklyPerformanceChart
        points={analytics.weekPoints}
        sevenDayAvg={analytics.sevenDayAvg}
        dark
        maxScore={100}
        unitLabel="%"
        passLine={65}
        passLabel="Target 65%"
        title={`${label} — last 7 days`}
        subtitle="Average score percentage per day"
      />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">Recent attempts</p>
        {loading ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : analytics.recentAttempts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
            No {label.toLowerCase()} attempts yet. Start practicing to see your analysis here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/50">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Section</th>
                  <th className="px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {analytics.recentAttempts.map((a) => {
                  const mod = moduleForQuestionType(a.question_type);
                  const grade = (a.score_details as { grade?: string } | null)?.grade;
                  return (
                    <tr key={a.id} className="bg-white/[0.02] hover:bg-white/5">
                      <td className="px-3 py-2.5 text-white/70">
                        {format(new Date(a.created_at), "d MMM yyyy")}
                      </td>
                      <td className="px-3 py-2.5 text-white/85">
                        {mod ? (
                          <Link to={moduleUrl(mod)} className="hover:text-cyan-300 hover:underline">
                            {formatQuestionTypeLabel(a.question_type)}
                          </Link>
                        ) : (
                          formatQuestionTypeLabel(a.question_type)
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-white">
                        {a.total > 0 ? scoreLabel(a.score, a.total) : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {grade ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              grade === "High Pass" && "bg-emerald-500/20 text-emerald-300",
                              grade === "Pass" && "bg-cyan-500/20 text-cyan-300",
                              grade === "Below Pass" && "bg-amber-500/20 text-amber-300",
                            )}
                          >
                            {grade}
                          </span>
                        ) : (
                          <span className="text-white/40">{a.scoring_status ?? "recorded"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
