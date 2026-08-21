import { BookOpen, Headphones, Mic, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { practiceModuleTheme, type PracticeModuleKey } from "@/lib/practiceModuleTheme";
import { cn } from "@/lib/utils";

const MODULE_ICON: Record<PracticeModuleKey, LucideIcon> = {
  speaking: Mic,
  writing: PenLine,
  listening: Headphones,
  reading: BookOpen,
};

type Props = {
  module: PracticeModuleKey;
  /** Part key as the module names it — "1", "1a", 3… */
  part: string | number;
  /** Task name shown as the headline, e.g. "Discursive Essay". */
  title: string;
  /** Briefing line under the headline. */
  description?: string;
  /** Overrides the icon-tile label (speaking uses RA / RP / DP / TP). */
  abbrev?: string;
  setIndex?: number;
  totalSets?: number;
  className?: string;
};

/**
 * The gradient task card that heads every practice workspace. One gradient per
 * module; the item counter sits in the card rather than in a separate bar.
 */
export function PracticeTaskHeader({
  module,
  part,
  title,
  description,
  abbrev,
  setIndex = 1,
  totalSets = 1,
  className,
}: Props) {
  const theme = practiceModuleTheme(module);
  const Icon = MODULE_ICON[module] ?? Mic;
  const tileLabel = abbrev ?? `${theme.abbrevPrefix}${part}`;

  return (
    <header
      className={cn(
        "shrink-0 bg-gradient-to-r px-4 py-4 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)] sm:px-6 sm:py-5",
        theme.gradient,
        className,
      )}
    >
      <div className="flex items-start gap-3 sm:gap-5">
        <div className="flex size-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-white/25 bg-white/15 text-white sm:size-16">
          <Icon className="size-4 sm:size-5" aria-hidden />
          <span className="text-[10px] font-bold uppercase leading-none tracking-wide sm:text-xs">
            {tileLabel}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h2 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">{title}</h2>
            <span className="shrink-0 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold tabular-nums text-white sm:text-sm">
              {theme.countLabel} {setIndex} / {totalSets}
            </span>
          </div>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-white/95 sm:mt-1.5 sm:text-base">
              {description}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
