import { AlertCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PracticeGrade, ScoringPhase, SpeakingScoreResult, WritingScoreResult } from "@/lib/scoringTypes";
import { WritingErrorsPanel } from "@/components/practice/writing/WritingErrorsPanel";

function formatScoringError(error?: string | null): string {
  if (!error) return "Please try again in a moment.";
  const creditMatch = error.match(/credit balance is too low/i);
  if (creditMatch) {
    return "Scoring is temporarily unavailable. Please try again later or contact support.";
  }
  const jsonStart = error.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(error.slice(jsonStart)) as { error?: { message?: string }; message?: string };
      const msg = parsed.error?.message ?? parsed.message;
      if (msg) return msg;
    } catch {
      /* use raw */
    }
  }
  return error.replace(/^\d{3}\s*/, "");
}

function gradeStyles(grade: PracticeGrade) {
  if (grade === "High Pass") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (grade === "Pass") return "border-cyan-200 bg-cyan-50 text-cyan-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function CriterionRow({ label, score, note }: { label: string; score: number; note: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">{score}/3</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{note}</p>
    </div>
  );
}

export function PracticeScoreResult({
  phase,
  error,
  writing,
  speaking,
  responseText,
  recordingUrl,
  className,
}: {
  phase: ScoringPhase;
  error?: string | null;
  writing?: WritingScoreResult | null;
  speaking?: SpeakingScoreResult | null;
  responseText?: string;
  recordingUrl?: string | null;
  className?: string;
}) {
  if (phase === "idle") return null;

  if (phase === "scoring") {
    return null;
  }

  if (phase === "error") {
    return (
      <div className={cn("rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-center", className)}>
        <AlertCircle className="mx-auto size-7 text-red-500" />
        <p className="mt-3 text-sm font-semibold text-red-800">Scoring failed</p>
        <p className="mt-1 text-xs text-red-700">{formatScoringError(error)}</p>
      </div>
    );
  }

  const result = writing ?? speaking;
  if (!result) return null;

  const isWriting = result.type === "writing";
  const grade = result.grade;
  const scoreDisplay = isWriting
    ? `${result.scores.total}/12`
    : `${result.scores.scaledTotal}/50`;

  return (
    <div className={cn("space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-violet-100">
          <Trophy className="size-5 text-violet-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-slate-900">Score {scoreDisplay}</p>
        </div>
        <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", gradeStyles(grade))}>
          {grade}
        </span>
      </div>

      {!isWriting && speaking && (
        <>
          {recordingUrl && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-slate-700">Your recording</p>
              <audio controls src={recordingUrl} className="mt-2 w-full" preload="metadata" />
            </div>
          )}
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Transcript: </span>
            {speaking.transcript || "(empty)"}
          </div>
        </>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {isWriting && writing ? (
          <>
            <CriterionRow label="Task fulfilment" score={writing.scores.taskFulfilment} note={writing.feedback.taskFulfilment} />
            <CriterionRow label="Grammar" score={writing.scores.grammar} note={writing.feedback.grammar} />
            <CriterionRow label="Vocabulary" score={writing.scores.vocabulary} note={writing.feedback.vocabulary} />
            <CriterionRow label="Organisation" score={writing.scores.organisation} note={writing.feedback.organisation} />
          </>
        ) : speaking ? (
          <>
            <CriterionRow label="Task & coherence" score={speaking.scores.taskFulfilmentCoherence} note={speaking.feedback.taskFulfilmentCoherence} />
            <CriterionRow label="Grammar" score={speaking.scores.grammar} note={speaking.feedback.grammar} />
            <CriterionRow label="Vocabulary" score={speaking.scores.vocabulary} note={speaking.feedback.vocabulary} />
            <CriterionRow label="Pronunciation & fluency" score={speaking.scores.pronunciationFluency} note={speaking.feedback.pronunciationFluency} />
          </>
        ) : null}
      </div>

      {isWriting && writing && (
        <WritingErrorsPanel responseText={responseText} errors={writing.errors} />
      )}

      <div className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2.5">
        <p className="text-xs font-semibold text-violet-900">Overall feedback</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{result.feedback.overall}</p>
      </div>
    </div>
  );
}
