import { Progress } from "@/components/ui/progress";
import type { SpeakingSetProgress } from "@/lib/speakingSetStructure";
import { cn } from "@/lib/utils";

type Props = {
  progress: SpeakingSetProgress;
  promptLabel?: string;
  setTitle?: string;
  className?: string;
};

export function SpeakingSetProgressBar({ progress, promptLabel, setTitle, className }: Props) {
  const { currentInSet, totalInSet, currentInPart, totalInPart, partNumber, mode } = progress;
  const percent = totalInSet > 0 ? Math.round((currentInSet / totalInSet) * 100) : 0;

  return (
    <div className={cn("shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50/40 px-3 py-2.5 md:px-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Set progress
          </p>
          {setTitle && (
            <p className="truncate text-xs font-medium text-slate-800 sm:text-sm">{setTitle}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums text-slate-900">
            {currentInSet}
            <span className="font-normal text-slate-400"> / {totalInSet}</span>
          </p>
          <p className="text-[10px] font-medium text-cyan-700 sm:text-xs">{percent}% complete</p>
        </div>
      </div>

      <Progress
        value={percent}
        className="mt-2 h-2 bg-slate-200/80 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-600"
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 sm:text-xs">
        {mode === "question_set_15" ? (
          <span>
            Question <span className="font-semibold text-slate-700">{currentInSet}</span> of {totalInSet}
          </span>
        ) : (
          <span>
            Part <span className="font-semibold text-slate-700">{partNumber}</span>
            {" · "}
            Step <span className="font-semibold text-slate-700">{currentInPart}</span> of {totalInPart}
          </span>
        )}
        {promptLabel && (
          <>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="font-medium text-cyan-800">{promptLabel}</span>
          </>
        )}
      </div>
    </div>
  );
}
