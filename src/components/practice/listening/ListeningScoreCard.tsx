import { Check, Headphones, Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ObjectiveScoreResult } from "@/lib/objectiveScoreUtils";
import { scoreRingColor } from "@/lib/speakingScoreUtils";
import { GradeBadge } from "@/components/practice/shared/ScoreCardBadges";
import { ScoreDonut } from "@/components/practice/speaking/ScoreDonut";

export type ListeningBreakdownItem = {
  label: string;
  score: number;
  max: number;
};

type Props = {
  result: ObjectiveScoreResult;
  partNumber: number;
  partTitle: string;
  breakdown?: ListeningBreakdownItem[];
  answerSummary?: React.ReactNode;
  className?: string;
};

function ScoreBreakdownBar({ label, score, max }: ListeningBreakdownItem) {
  const ratio = max > 0 ? Math.max(0, Math.min(score, max)) / max : 0;
  const color = scoreRingColor(ratio);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold tabular-nums text-slate-900">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${ratio * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ResultItemCard({
  label,
  studentAnswer,
  correctAnswer,
  isCorrect,
}: {
  label: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4",
        isCorrect ? "border-emerald-200" : "border-rose-200",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <Lightbulb className="size-3.5 text-amber-500" />
          {label}
        </h3>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold",
            isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
          )}
        >
          {isCorrect ? (
            <>
              <Check className="size-3" />
              Correct
            </>
          ) : (
            <>
              <X className="size-3" />
              Wrong
            </>
          )}
        </span>
      </div>
      <p
        className={cn(
          "text-xs leading-relaxed",
          isCorrect ? "text-emerald-800" : "text-rose-700",
        )}
      >
        Your answer: <span className="font-semibold">{studentAnswer || "—"}</span>
      </p>
      {!isCorrect && (
        <p className="mt-1 text-xs leading-relaxed text-emerald-700">
          Correct: <span className="font-semibold">{correctAnswer}</span>
        </p>
      )}
    </div>
  );
}

export function ListeningScoreCard({
  result,
  partNumber,
  partTitle,
  breakdown,
  answerSummary,
  className,
}: Props) {
  const { score, total, percentage, grade, unitLabel, items } = result;
  const breakdownRows =
    breakdown ??
    items.map((item) => ({
      label: item.label,
      score: item.isCorrect ? 1 : 0,
      max: 1,
    }));

  return (
    <div className={cn("space-y-5", className)}>
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Headphones className="size-5 text-cyan-600" />
              Listening Part {partNumber} Score Report
            </p>
            <p className="text-xs text-slate-500">{partTitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <GradeBadge grade={grade} />
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overall</p>
              <p className="text-3xl font-black tabular-nums leading-none text-cyan-600">
                {score}
                <span className="text-lg font-bold text-slate-400">/{total}</span>
              </p>
              <span className="mt-1 inline-block rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-800">
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {answerSummary && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">Your answers</p>
            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-400" />
                Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-rose-400" />
                Incorrect
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
            {answerSummary}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5">
          <ScoreDonut label="Overall Score" score={score} max={total} size={120} />
          <p className="mt-2 text-xs font-semibold text-slate-500">{unitLabel}</p>
          <span className="mt-1 rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-800">
            {percentage}%
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-bold text-slate-800">Score breakdown</p>
          <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
            {breakdownRows.map((row) => (
              <ScoreBreakdownBar key={row.label} {...row} />
            ))}
          </div>
          <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            LanguageCert Listening · Part {partNumber}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Lightbulb className="size-4 text-amber-500" />
          Detailed results
        </p>
        {items.map((item) => (
          <ResultItemCard key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}
