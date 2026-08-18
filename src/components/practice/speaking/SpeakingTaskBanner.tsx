import { Mic } from "lucide-react";
import {
  SPEAKING_PART_ABBREV,
  SPEAKING_PART_TITLES,
  getSpeakingBannerDescription,
} from "@/lib/speakingInstructions";
import { cn } from "@/lib/utils";

/** One gradient per speaking part, all in the same task-card style. */
const PART_GRADIENT: Record<string, string> = {
  "1": "from-[#4f5bd5] via-[#6366f1] to-[#8b5cf6]",
  "2": "from-[#0d9488] via-[#10b981] to-[#22c55e]",
  "3": "from-[#ef3d5e] via-[#f04d78] to-[#ec4899]",
  "4": "from-[#f97316] via-[#f4604f] to-[#ec4899]",
};

type Props = {
  part: string;
  level?: string | null;
  /** Overrides the auto-generated briefing line. */
  description?: string;
  className?: string;
};

export function SpeakingTaskBanner({ part, level, description, className }: Props) {
  const title = SPEAKING_PART_TITLES[part] ?? `Speaking Part ${part}`;
  const abbrev = SPEAKING_PART_ABBREV[part] ?? part;
  const gradient = PART_GRADIENT[part] ?? PART_GRADIENT["1"];
  const text = description ?? getSpeakingBannerDescription(part, level);

  return (
    <div
      className={cn(
        "shrink-0 rounded-2xl bg-gradient-to-r px-4 py-4 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)] sm:px-6 sm:py-5",
        gradient,
        className,
      )}
    >
      <div className="flex items-start gap-3 sm:gap-5">
        <div className="flex size-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-white/25 bg-white/15 text-white sm:size-16">
          <Mic className="size-4 sm:size-5" aria-hidden />
          <span className="text-[10px] font-bold leading-none tracking-wide sm:text-xs">
            {abbrev}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-extrabold leading-tight text-white sm:text-2xl">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/95 sm:mt-1.5 sm:text-[15px]">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
