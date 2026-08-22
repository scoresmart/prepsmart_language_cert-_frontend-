import * as React from "react";
import { ChevronDown, ChevronUp, Loader2, Mic, RefreshCw, Sparkles, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CefrLevelBadge, GradeBadge } from "@/components/practice/shared/ScoreCardBadges";
import { ScoreDonut } from "@/components/practice/speaking/ScoreDonut";
import { api } from "@/lib/api";
import { practiceModuleTheme } from "@/lib/practiceModuleTheme";
import type { ScoringPhase, SpeakingScoreResult } from "@/lib/scoringTypes";
import type { RealtimeExamSummary, RealtimeTranscriptTurn } from "@/lib/realtimeExamClient";
import type { ExamSegment } from "@/lib/speakingExamSegments";
import {
  MIN_SCOREABLE_WORDS,
  candidateTranscript,
  examScoringLevel,
  examTaskDescription,
  formatExamClock,
  partBreakdown,
  wordCount,
} from "@/lib/realtimeExamScore";
import { cn } from "@/lib/utils";

type Props = {
  transcript: RealtimeTranscriptTurn[];
  summary: RealtimeExamSummary | null;
  segments?: ExamSegment[];
  setTitle?: string | null;
  level?: string | null;
  attemptId?: string | null;
  endReason?: string | null;
  className?: string;
};

const CRITERIA = [
  { key: "taskFulfilmentCoherence", label: "Task & Coherence" },
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "pronunciationFluency", label: "Pronunciation & Fluency" },
] as const;

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/25 bg-white/15 px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">{label}</p>
      <p className="mt-0.5 text-lg font-black tabular-nums leading-none text-white">{value}</p>
      {hint && <p className="mt-1 text-[10px] font-medium text-white/70">{hint}</p>}
    </div>
  );
}

function FeedbackBlock({
  title,
  score,
  max,
  body,
}: {
  title: string;
  score: number;
  max: number;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
          {score}/{max}
        </span>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{body}</p>
    </div>
  );
}

/**
 * The scorecard for one live-examiner test.
 *
 * The examiner streams transcripts as it goes, so there is no audio file to
 * upload — the whole conversation is marked as text through
 * `POST /scoring/speaking/transcript`. Marking is fired once per finished
 * session and can be retried by hand when the API is unreachable.
 */
export function RealtimeExamScorecard({
  transcript,
  summary,
  segments = [],
  setTitle,
  level,
  attemptId,
  endReason,
  className,
}: Props) {
  const [phase, setPhase] = React.useState<ScoringPhase>("idle");
  const [score, setScore] = React.useState<SpeakingScoreResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  const scoringLevel = examScoringLevel(level);
  const spokenText = React.useMemo(() => candidateTranscript(transcript), [transcript]);
  const spokenWords = wordCount(spokenText);
  const tooShort = spokenWords < MIN_SCOREABLE_WORDS;
  const parts = React.useMemo(
    () => partBreakdown(transcript, segments, summary),
    [transcript, segments, summary],
  );
  const theme = practiceModuleTheme("speaking");

  React.useEffect(() => {
    if (tooShort) {
      setPhase("idle");
      return;
    }

    let cancelled = false;
    setPhase("scoring");
    setError(null);

    void (async () => {
      try {
        const res = await api.scoring.speakingTranscript({
          task_description: examTaskDescription({ setTitle, level: scoringLevel, turns: transcript }),
          transcript: spokenText,
          level: scoringLevel,
          ...(attemptId ? { attempt_id: attemptId } : {}),
        });
        if (cancelled) return;
        if (!res.data) throw new Error("The marker returned no score.");
        setScore(res.data);
        setPhase("done");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not reach the scoring service.");
        setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // `attempt` is the manual retry trigger; the transcript itself never
    // changes once the exam has ended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenText, scoringLevel, attemptId, tooShort, attempt]);

  const durationMs = summary?.durationMs ?? 0;
  const answered = summary?.questionsAnswered ?? 0;
  const asked = summary?.questionsAsked ?? 0;
  const skipped = summary?.questionsSkipped ?? 0;
  const partsReached = parts.filter((p) => p.reached).length;

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white", className)}>
      {/* ------------------------------------------------------------ hero */}
      <div className={cn("bg-gradient-to-r p-4 sm:p-5", theme.gradient)}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 shrink-0 text-white/90" aria-hidden />
              <h3 className="text-lg font-extrabold leading-tight text-white sm:text-xl">
                Speaking scorecard
              </h3>
            </div>
            <p className="mt-1 text-xs font-medium text-white/85 sm:text-sm">
              {setTitle ?? "LanguageCert Academic Speaking"} · live examiner ·{" "}
              {endReason === "no_response"
                ? "ended with no answers detected"
                : "full four-part test"}
            </p>
          </div>

          {phase === "done" && score && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">
                  Overall
                </p>
                <p className="text-4xl font-black tabular-nums leading-none text-white">
                  {score.scores.scaledTotal}
                  <span className="text-xl font-bold text-white/70">/50</span>
                </p>
                <GradeBadge grade={score.grade} className="mt-2 border-white/40 bg-white/95" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Duration" value={formatExamClock(durationMs)} />
          <StatTile label="Answered" value={`${answered}/${asked}`} hint={`${skipped} skipped`} />
          <StatTile label="Parts" value={`${partsReached}/4`} hint="reached" />
          <StatTile label="You spoke" value={`${spokenWords}`} hint="words" />
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {/* ----------------------------------------------- part breakdown */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {parts.map((p) => (
            <div
              key={p.part}
              className={cn(
                "rounded-xl border px-3 py-2.5",
                p.reached ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50",
              )}
            >
              <p
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wide",
                  p.reached ? "text-indigo-600" : "text-slate-400",
                )}
              >
                Part {p.part}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-sm font-semibold",
                  p.reached ? "text-slate-900" : "text-slate-400",
                )}
              >
                {p.label}
              </p>
              <p className="mt-1 text-[11px] tabular-nums text-slate-500">
                {p.reached ? `${p.answers} answer${p.answers === 1 ? "" : "s"} · ${p.words} words` : "Not reached"}
              </p>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------------- states */}
        {tooShort && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">Not enough speech to mark</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Only {spokenWords} word{spokenWords === 1 ? "" : "s"} were recognised, so there is
              nothing for the marker to score. Check your microphone and take the test again.
            </p>
          </div>
        )}

        {phase === "scoring" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
              <Loader2 className="size-4 animate-spin text-indigo-600" />
              Marking your test…
            </p>
            <div className="mx-auto mt-3 h-1.5 w-2/3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-500" />
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              Your answers are already saved — this only calculates the score.
            </p>
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-semibold text-rose-900">Score not calculated</p>
            <p className="mt-1 text-xs leading-relaxed text-rose-800">{error}</p>
            <p className="mt-1 text-xs text-rose-700/90">
              Your conversation is saved and nothing is lost — only the marking failed.
            </p>
            <Button
              variant="outline"
              className="mt-3 h-9 gap-2 border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
              onClick={() => setAttempt((n) => n + 1)}
            >
              <RefreshCw className="size-4" />
              Try marking again
            </Button>
          </div>
        )}

        {/* ------------------------------------------------------- results */}
        {phase === "done" && score && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <CefrLevelBadge level={score.level} />
              {CRITERIA.map((c) => (
                <ScoreDonut key={c.key} label={c.label} score={score.scores[c.key]} max={3} />
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {CRITERIA.map((c) => (
                <FeedbackBlock
                  key={c.key}
                  title={c.label}
                  score={score.scores[c.key]}
                  max={3}
                  body={score.feedback[c.key]}
                />
              ))}
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-900">
                Overall feedback
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{score.feedback.overall}</p>
              <p className="mt-2 text-xs text-indigo-800/80">
                Marked at <span className="font-black text-indigo-900">{score.level}</span> · raw{" "}
                {score.scores.rawTotal}/12 · scaled {score.scores.scaledTotal}/50 ·{" "}
                <span className="font-semibold">{score.grade}</span>
                {score.grade === "High Pass" && " (38+)"}
                {score.grade === "Pass" && " (25–37)"}
                {score.grade === "Below Pass" && " (below 25)"}
              </p>
            </div>
          </>
        )}

        {/* ---------------------------------------------------- transcript */}
        {transcript.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
            >
              <span className="text-sm font-bold text-slate-800">
                Conversation transcript
                <span className="ml-2 font-medium text-slate-500">({transcript.length} turns)</span>
              </span>
              {showTranscript ? (
                <ChevronUp className="size-4 shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-slate-400" />
              )}
            </button>

            {showTranscript && (
              <div className="max-h-80 space-y-2 overflow-y-auto bg-white p-3">
                {transcript.map((turn, i) => (
                  <div
                    key={`${turn.at}-${i}`}
                    className={cn(
                      "flex gap-2.5 rounded-lg px-3 py-2",
                      turn.role === "examiner" ? "bg-slate-50" : "bg-indigo-50/70",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                        turn.role === "examiner"
                          ? "bg-slate-200 text-slate-600"
                          : "bg-indigo-500 text-white",
                      )}
                    >
                      {turn.role === "examiner" ? (
                        <User className="size-3.5" />
                      ) : (
                        <Mic className="size-3.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {turn.role === "examiner" ? "Examiner" : "You"}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                        {turn.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
