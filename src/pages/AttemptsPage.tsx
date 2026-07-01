import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { PracticeAttemptRow } from "@/components/practice/PracticeMyAttemptsSection";
import {
  attemptPercent,
  formatQuestionTypeLabel,
  moduleForQuestionType,
  resolveAttemptScore,
} from "@/lib/performanceAnalytics";
import { moduleUrl } from "@/lib/practiceRoutes";
import { cn } from "@/lib/utils";

const MODULE_COLORS: Record<string, string> = {
  speaking: "bg-blue-500/90 text-white",
  writing: "bg-amber-500/90 text-amber-950",
  reading: "bg-emerald-500/90 text-white",
  listening: "bg-pink-500/90 text-white",
};

function scoreTextClass(pct: number | null): string {
  if (pct == null) return "text-white/50";
  if (pct >= 70) return "text-emerald-400";
  if (pct >= 50) return "text-amber-400";
  return "text-rose-400";
}

function AttemptRow({ attempt }: { attempt: PracticeAttemptRow }) {
  const module = moduleForQuestionType(attempt.question_type);
  const { score, total } = resolveAttemptScore(attempt);
  const pct = attemptPercent(score, total);
  const moduleLabel = module ? module.charAt(0).toUpperCase() + module.slice(1) : "Practice";
  const practiceLink = module ? moduleUrl(module) : "/practice";

  return (
    <li className="border-b border-white/10 last:border-0">
      <Link
        to={practiceLink}
        className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {module && (
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase", MODULE_COLORS[module])}>
                {moduleLabel}
              </span>
            )}
            <span className="text-sm font-semibold text-white">{formatQuestionTypeLabel(attempt.question_type)}</span>
          </div>
          <p className="mt-1 text-xs text-white/45">
            {format(new Date(attempt.created_at), "dd MMM yyyy, HH:mm")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {total > 0 ? (
            <>
              <p className={cn("text-lg font-bold tabular-nums", scoreTextClass(pct))}>
                {score}/{total}
              </p>
              {pct != null && (
                <p className={cn("text-xs font-semibold tabular-nums", scoreTextClass(pct))}>{Math.round(pct)}%</p>
              )}
            </>
          ) : (
            <span className="text-xs text-white/40">Submitted</span>
          )}
        </div>
      </Link>
    </li>
  );
}

export function AttemptsPage() {
  const q = useQuery({
    queryKey: ["practice-attempts-all"],
    queryFn: async () => {
      const res = await api.practice.myAttempts();
      return res.data ?? [];
    },
  });

  const attempts = q.data ?? [];

  return (
    <div className="relative min-h-full p-4 md:p-6 lg:p-8">
      <div className="relative mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/40">
          <header className="border-b border-white/10 px-5 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-white">My Attempts</h1>
            <p className="mt-1 text-xs text-white/40">Your recent practice submissions across all modules</p>
          </header>

          {q.isLoading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-white/50">
              <Loader2 className="size-5 animate-spin text-blue-400" />
              <span className="text-sm">Loading attempts…</span>
            </div>
          ) : attempts.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <BookOpen className="mx-auto size-10 text-white/20" />
              <p className="mt-4 font-semibold text-white/80">No attempts yet</p>
              <p className="mt-1 text-sm text-white/45">Complete a practice question to see your scores here.</p>
              <Link
                to="/practice"
                className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Start practicing
              </Link>
            </div>
          ) : (
            <ul>{attempts.map((attempt) => <AttemptRow key={attempt.id} attempt={attempt} />)}</ul>
          )}
        </div>
      </div>
    </div>
  );
}
