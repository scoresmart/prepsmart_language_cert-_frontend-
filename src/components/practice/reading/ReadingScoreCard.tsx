import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ObjectiveScoreResult } from "@/lib/objectiveScoreUtils";
import { GradeBadge } from "@/components/practice/shared/ScoreCardBadges";

type Props = {
  result: ObjectiveScoreResult;
  className?: string;
};

function scoreColour(pct: number) {
  if (pct >= 75) return "text-emerald-600";
  if (pct >= 50) return "text-amber-600";
  return "text-rose-600";
}

export function ReadingScoreCard({ result, className }: Props) {
  const { score, total, percentage, grade, unitLabel, items } = result;
  const colour = scoreColour(percentage);

  return (
    <div className={cn("space-y-5", className)}>
      <div className="text-center">
        <p className={cn("text-4xl font-black tabular-nums", colour)}>
          {score} / {total}
        </p>
        <p className="mt-1 text-sm text-slate-500">{unitLabel}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span
            className={cn(
              "inline-flex size-14 items-center justify-center rounded-full border-[3px] border-violet-300 bg-violet-50 text-sm font-black text-violet-800 ring-4 ring-violet-100",
            )}
          >
            {percentage}%
          </span>
          <GradeBadge grade={grade} />
        </div>
      </div>

      <div className="space-y-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-xl border px-4 py-3",
              item.isCorrect
                ? "border-emerald-200 bg-emerald-50/80"
                : "border-rose-200 bg-rose-50/80",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">{item.label}</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  item.isCorrect
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-600 text-white",
                )}
              >
                {item.isCorrect ? (
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
                "mt-2 text-sm font-medium",
                item.isCorrect ? "text-emerald-800" : "text-rose-700",
              )}
            >
              Your answer: {item.studentAnswer || "—"}
            </p>
            {!item.isCorrect && (
              <p className="mt-1 text-sm font-medium text-emerald-700">
                Correct: {item.correctAnswer}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
