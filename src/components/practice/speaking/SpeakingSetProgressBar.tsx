import type { SpeakingSetProgress } from "@/lib/speakingSetStructure";
import { cn } from "@/lib/utils";

type Props = {
  progress: SpeakingSetProgress;
  promptLabel?: string;
  setTitle?: string;
  className?: string;
};

/**
 * Slim progress rail under the workspace header. The question number, level and
 * prompt label now live in the task banner / question box, so this only carries
 * the "how far through the set am I" signal.
 */
export function SpeakingSetProgressBar({ progress, className }: Props) {
  const { currentInSet, totalInSet } = progress;
  const percent = totalInSet > 0 ? Math.round((currentInSet / totalInSet) * 100) : 0;

  return (
    <div
      className={cn("h-1 w-full shrink-0 bg-slate-200", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={`Set progress: ${currentInSet} of ${totalInSet}`}
    >
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
