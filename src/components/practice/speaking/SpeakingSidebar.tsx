import { Lightbulb, Timer } from "lucide-react";
import type { RecordingPhase } from "./UserRecordingBox";
import { cn } from "@/lib/utils";

type Props = {
  tips: string[];
  phase: RecordingPhase;
  prepareSecondsLeft?: number;
  recordSecondsLeft: number;
  maxDuration: number;
  className?: string;
};

function phaseLabel(phase: RecordingPhase): string {
  if (phase === "waiting") return "Waiting";
  if (phase === "preparing") return "Preparing";
  if (phase === "recording") return "Recording";
  if (phase === "recorded") return "Recorded";
  return "Idle";
}

export function SpeakingSidebar({
  tips,
  phase,
  prepareSecondsLeft = 0,
  recordSecondsLeft,
  maxDuration,
  className,
}: Props) {
  const elapsed = maxDuration - recordSecondsLeft;

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col self-stretch border-t border-slate-200 bg-slate-50 p-4 md:w-72 md:border-l md:border-t-0",
        className,
      )}
    >
      <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Lightbulb className="size-4 text-amber-500" />
          Speaking Tips
        </div>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-600">
          {tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Timer className="size-4 text-cyan-600" />
          Recording Status
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">State</dt>
            <dd className="font-semibold text-slate-800">{phaseLabel(phase)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Duration</dt>
            <dd className="font-semibold tabular-nums text-slate-800">
              {phase === "preparing"
                ? `Prepare ${prepareSecondsLeft}s`
                : phase === "recording" || phase === "recorded"
                  ? `${elapsed}s / ${maxDuration}s`
                  : `0s / ${maxDuration}s`}
            </dd>
          </div>
        </dl>
        <div className="mt-auto pt-6 text-xs leading-relaxed text-slate-400">
          Allow microphone access when prompted. Listen to the examiner first — after the audio ends
          you have 5 seconds to prepare, then recording starts automatically once the mic is enabled.
        </div>
      </div>
    </aside>
  );
}
