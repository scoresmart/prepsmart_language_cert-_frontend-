import { BookOpen, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WritingScoreResult } from "@/lib/scoringTypes";
import { scoreRingColor } from "@/lib/speakingScoreUtils";
import { CefrLevelBadge, GradeBadge } from "@/components/practice/shared/ScoreCardBadges";
import { ScoreDonut } from "@/components/practice/speaking/ScoreDonut";
import { WritingErrorsPanel, HighlightedWritingAnswer } from "@/components/practice/writing/WritingErrorsPanel";

type Props = {
  writing: WritingScoreResult;
  responseText?: string;
  className?: string;
};

function ScoreBreakdownBar({ label, score, max }: { label: string; score: number; max: number }) {
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

function FeedbackCard({
  title,
  score,
  max,
  children,
}: {
  title: string;
  score: number;
  max: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <Lightbulb className="size-3.5 text-amber-500" />
          {title}
        </h3>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
          {score}/{max}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

export function WritingScoreCard({ writing, responseText, className }: Props) {
  const { scores, feedback, grade, wordCount, taskType, level } = writing;
  const total = scores.total;
  const overallPct = total > 0 ? Math.round((total / 12) * 100) : 0;
  const taskLabel = taskType === "task1" ? "Task 1" : "Task 2";
  const spellingCount = (writing.errors ?? []).filter((e) => e.type === "spelling").length;
  const grammarCount = (writing.errors ?? []).filter((e) => e.type !== "spelling").length;

  const breakdown = [
    { label: "Task fulfilment", score: scores.taskFulfilment, max: 3 },
    { label: "Organisation", score: scores.organisation, max: 3 },
    { label: "Grammar", score: scores.grammar, max: 3 },
    { label: "Vocabulary", score: scores.vocabulary, max: 3 },
  ] as const;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-violet-50/40 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <BookOpen className="size-5 text-violet-600" />
              Writing Score Report
            </p>
            <p className="text-xs text-slate-500">
              LanguageCert {taskLabel} · {level} level
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <CefrLevelBadge level={level} />
            <div className="flex flex-col items-start sm:items-end">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overall score</p>
              <p className="text-3xl font-black tabular-nums leading-none text-violet-600">
                {total}
                <span className="text-lg font-bold text-slate-400">/12</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">
                  {overallPct}%
                </span>
                <GradeBadge grade={grade} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {responseText && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-800">Your answer</p>
            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-rose-400" />
                Spelling
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-400" />
                Grammar
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
            <HighlightedWritingAnswer text={responseText} errors={writing.errors} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{wordCount} words</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5">
          <ScoreDonut label="Overall" score={total} max={12} size={120} />
          <p className="mt-2 text-xs font-semibold text-slate-500">Overall Score</p>
          <span className="mt-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">
            {overallPct}%
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-bold text-slate-800">Score breakdown</p>
          <div className="space-y-3">
            {breakdown.map(({ label, score, max }) => (
              <ScoreBreakdownBar key={label} label={label} score={score} max={max} />
            ))}
          </div>
          <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            LanguageCert Writing
          </p>
        </div>
      </div>

      {(writing.errors?.length ?? 0) > 0 && (
        <WritingErrorsPanel responseText={responseText} errors={writing.errors} />
      )}

      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Lightbulb className="size-4 text-amber-500" />
          AI detailed feedback
        </p>
        <FeedbackCard title="Task fulfilment" score={scores.taskFulfilment} max={3}>
          {feedback.taskFulfilment}
        </FeedbackCard>
        <FeedbackCard title="Organisation" score={scores.organisation} max={3}>
          {feedback.organisation}
        </FeedbackCard>
        <FeedbackCard title="Grammar" score={scores.grammar} max={3}>
          {feedback.grammar}
          {grammarCount > 0 && (
            <span className="mt-1 block text-amber-700">
              {grammarCount} grammar issue{grammarCount === 1 ? "" : "s"} flagged in your answer.
            </span>
          )}
        </FeedbackCard>
        <FeedbackCard title="Vocabulary" score={scores.vocabulary} max={3}>
          {feedback.vocabulary}
          {spellingCount > 0 && (
            <span className="mt-1 block text-rose-700">
              {spellingCount} spelling mistake{spellingCount === 1 ? "" : "s"} detected — see corrections above.
            </span>
          )}
        </FeedbackCard>
      </div>

      <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3">
        <p className="text-xs font-semibold text-violet-900">Overall feedback</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{feedback.overall}</p>
        <p className="mt-2 text-xs text-violet-800/80">
          Scored at <span className="font-black text-violet-900">{level}</span> level · {total}/12 · Grade:{" "}
          <span className="font-semibold">{grade}</span>
          {grade === "High Pass" && " (10+)"}
          {grade === "Pass" && " (6–9)"}
          {grade === "Below Pass" && " (below 6)"}
        </p>
      </div>
    </div>
  );
}
