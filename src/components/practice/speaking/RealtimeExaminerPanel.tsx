import { PhoneOff, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RealtimeExamState } from "@/hooks/useRealtimeExam";
import { speakingImagePublicUrl } from "@/lib/speakingExamForm";
import { SpeakingLiveWave, type LiveSpeaker } from "@/components/practice/speaking/SpeakingLiveWave";

const PHASE_LABEL: Record<string, string> = {
  idle: "Mic ready",
  connecting: "Connecting to the examiner…",
  greeting: "Examiner is introducing the test",
  examiner: "Examiner is speaking",
  asking: "Examiner is speaking",
  listening: "Your turn — speak now",
  answering: "Listening to your answer",
  preparing: "Preparation time — think, don't speak yet",
  nudging: "Examiner is checking if you're there",
  no_response: "No answer detected",
  closing: "Examiner is closing the test",
  ended: "Test complete",
};

const PARTS = [
  { n: 1, label: "Questions" },
  { n: 2, label: "Role play" },
  { n: 3, label: "Picture" },
  { n: 4, label: "Topic" },
];

function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

type Props = {
  state: RealtimeExamState;
  setTitle?: string;
  level?: string;
  estimatedMinutes: number;
  onStart: () => void;
  onStop: () => void;
  onRetry: () => void;
};

/**
 * The live examiner, rendered as one white card: header and progress at the
 * top, the gradient speaking wave in the middle, notices and controls below.
 */
export function RealtimeExaminerPanel({
  state,
  setTitle,
  level,
  estimatedMinutes,
  onStart,
  onStop,
  onRetry,
}: Props) {
  const preparing = state.prepareLeft > 0;
  const image = speakingImagePublicUrl(state.imageUrl);
  const showImage = Boolean(image) && state.part === 3 && state.running;

  const candidateActive = state.candidateSpeaking || state.micLevel > 0.04;
  const speaker: LiveSpeaker = state.examinerSpeaking
    ? "examiner"
    : state.running && !preparing && candidateActive
      ? "candidate"
      : "idle";

  const waveLabel = state.connecting
    ? "Connecting to the examiner…"
    : preparing
      ? `Preparation time — ${state.prepareLeft}s left`
      : state.examinerSpeaking
        ? "Examiner is speaking"
        : candidateActive && state.running
          ? "Listening to your answer"
          : (PHASE_LABEL[state.phase] ?? state.phase);

  const waveHint = preparing
    ? "Think about your answer — don't speak yet."
    : state.running
      ? state.segmentLabel || undefined
      : state.phase === "ended"
        ? undefined
        : "Your microphone stays on for the whole test.";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_-18px_rgba(15,23,42,0.35)] sm:p-6">
        {/* -------------------------------------------------------- header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span
                  className={cn(
                    "absolute inline-flex size-full rounded-full opacity-75",
                    state.running ? "animate-ping bg-rose-500" : "bg-slate-300",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex size-2.5 rounded-full",
                    state.running ? "bg-rose-600" : "bg-slate-400",
                  )}
                />
              </span>
              <h3 className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-base font-bold text-transparent sm:text-lg">
                Live examiner {state.running ? "— test in progress" : ""}
              </h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {setTitle ?? "LanguageCert Academic Speaking"}
              {level ? ` · ${level}` : ""} · four parts · about {estimatedMinutes} minutes
            </p>
          </div>

          <div className="text-right">
            <p className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {formatClock(state.elapsedMs)}
            </p>
            <p className="text-xs font-medium text-slate-500">{state.progress}% complete</p>
          </div>
        </div>

        {/* ------------------------------------------------------ progress */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between">
            {PARTS.map((p) => (
              <span
                key={p.n}
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  state.part === p.n
                    ? "text-slate-900"
                    : state.part > p.n
                      ? "text-emerald-600"
                      : "text-slate-400",
                )}
              >
                Part {p.n} · {p.label}
              </span>
            ))}
          </div>
        </div>

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* --------------------------------------- live speaking indicator */}
        <SpeakingLiveWave
          speaker={speaker}
          level={state.micLevel}
          active={state.running || state.connecting}
          label={waveLabel}
          hint={waveHint}
        />

        {/* --------------------------------------------- part 3 picture */}
        {showImage && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2">
              <h4 className="text-sm font-semibold text-slate-900">Look at this picture</h4>
            </div>
            <img
              src={image!}
              alt="Describe this"
              className="max-h-64 w-full bg-slate-50 object-contain"
            />
          </div>
        )}

        {state.nudgeLevel > 0 && state.phase !== "ended" && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            {state.nudgeLevel >= state.nudgeMax
              ? "No answer after three checks — the test is ending and your answers so far have been saved."
              : `The examiner can't hear you (check ${state.nudgeLevel} of ${state.nudgeMax}). Check your microphone and answer when you're ready.`}
          </p>
        )}

        {state.error && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
            {state.error}
          </p>
        )}

        {/* -------------------------------------------------------- results */}
        {state.phase === "ended" && state.summary && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              {state.endReason === "no_response"
                ? "Test ended — no answers were detected."
                : "Test complete and saved."}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {state.summary.questionsAnswered} of {state.summary.questionsAsked} answered ·{" "}
              {state.summary.questionsSkipped} skipped · {formatClock(state.summary.durationMs)} ·{" "}
              {state.summary.turns} turns recorded
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- actions */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {!state.running && state.phase !== "ended" && (
            <Button
              onClick={onStart}
              disabled={state.connecting}
              className="gap-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 hover:from-sky-600 hover:via-indigo-600 hover:to-purple-600"
            >
              <Play className="size-4" />
              {state.connecting ? "Connecting…" : "Start speaking test"}
            </Button>
          )}

          {state.running && (
            <Button onClick={onStop} variant="outline" className="gap-2">
              <PhoneOff className="size-4" />
              End test early
            </Button>
          )}

          {state.phase === "ended" && (
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <Play className="size-4" />
              Take it again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
