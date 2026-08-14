import * as React from "react";

import { AlertTriangle, Hourglass, Loader2, Mic, PhoneOff, Play, Radio, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RealtimeExamState } from "@/hooks/useRealtimeExam";
import { speakingImagePublicUrl } from "@/lib/speakingExamForm";

const PHASE_LABEL: Record<string, string> = {
  idle: "Ready to begin",
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

function MicMeter({ level, active }: { level: number; active: boolean }) {
  const bars = 12;
  const lit = Math.min(bars, Math.round(level * bars * 1.6));
  return (
    <div className="flex items-end gap-[3px]" aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-all duration-75",
            i < lit && active ? "bg-emerald-500" : "bg-slate-200",
          )}
          style={{ height: `${6 + i * 1.4}px` }}
        />
      ))}
    </div>
  );
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

export function RealtimeExaminerPanel({
  state,
  setTitle,
  level,
  estimatedMinutes,
  onStart,
  onStop,
  onRetry,
}: Props) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.transcript.length]);

  const micLive = state.running && !state.connecting;
  const preparing = state.prepareLeft > 0;
  const image = speakingImagePublicUrl(state.imageUrl);
  const showImage = Boolean(image) && state.part === 3 && state.running;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* ---------------------------------------------------------- header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
              <h3 className="text-base font-semibold text-slate-900">
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
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
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
      </div>

      {/* ----------------------------------------------------------- state */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
          preparing
            ? "border-sky-200 bg-sky-50 text-sky-800"
            : state.phase === "listening" || state.phase === "answering"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : state.phase === "nudging" || state.phase === "no_response"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-slate-50 text-slate-700",
        )}
      >
        {state.connecting ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : preparing ? (
          <Hourglass className="size-4 shrink-0" />
        ) : state.examinerSpeaking ? (
          <Volume2 className="size-4 shrink-0 animate-pulse" />
        ) : state.phase === "nudging" || state.phase === "no_response" ? (
          <AlertTriangle className="size-4 shrink-0" />
        ) : (
          <Radio className="size-4 shrink-0" />
        )}

        <span className="flex-1">
          {preparing
            ? `Preparation time — ${state.prepareLeft}s left. Think about your answer; the examiner is waiting.`
            : state.examinerSpeaking
              ? "Examiner is speaking — listen"
              : (PHASE_LABEL[state.phase] ?? state.phase)}
        </span>

        {micLive && !preparing && (
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Mic className={cn("size-3.5", state.candidateSpeaking ? "text-emerald-600" : "text-slate-400")} />
            <MicMeter level={state.micLevel} active={state.candidateSpeaking || state.micLevel > 0.02} />
            <span>mic on</span>
          </span>
        )}
      </div>

      {state.segmentLabel && state.running && !preparing && (
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{state.segmentLabel}</p>
      )}

      {state.nudgeLevel > 0 && state.phase !== "ended" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {state.nudgeLevel >= state.nudgeMax
            ? "No answer after three checks — the test is ending and your answers so far have been saved."
            : `The examiner can't hear you (check ${state.nudgeLevel} of ${state.nudgeMax}). Check your microphone and answer when you're ready.`}
        </p>
      )}

      {state.error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
          {state.error}
        </p>
      )}

      {/* -------------------------------------------- part 3 picture */}
      {showImage && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-2">
            <h4 className="text-sm font-semibold text-slate-900">Look at this picture</h4>
          </div>
          <img src={image!} alt="Describe this" className="max-h-72 w-full bg-slate-50 object-contain" />
        </div>
      )}

      {/* ------------------------------------------------------ transcript */}
      <div className="flex min-h-[240px] flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h4 className="text-sm font-semibold text-slate-900">Live transcript</h4>
          <p className="text-xs text-slate-500">Saved automatically as you speak.</p>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {state.transcript.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              {state.running
                ? "Waiting for the examiner to begin…"
                : "Start the test and your conversation will appear here."}
            </p>
          ) : (
            state.transcript.map((turn, i) => (
              <div
                key={`${turn.at}-${i}`}
                className={cn("flex flex-col gap-1", turn.role === "candidate" && "items-end")}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {turn.role === "examiner" ? "Examiner" : "You"}
                </span>
                <p
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    turn.role === "examiner" ? "bg-slate-100 text-slate-800" : "bg-slate-900 text-white",
                  )}
                >
                  {turn.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --------------------------------------------------------- results */}
      {state.phase === "ended" && state.summary && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
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

      {/* --------------------------------------------------------- actions */}
      <div className="flex flex-wrap items-center gap-3">
        {!state.running && state.phase !== "ended" && (
          <Button onClick={onStart} className="gap-2">
            <Play className="size-4" />
            Start speaking test
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

        {!state.running && state.phase !== "ended" && (
          <p className="text-xs text-slate-500">
            Your microphone stays on for the whole test — just speak when the examiner finishes.
          </p>
        )}
      </div>
    </div>
  );
}
