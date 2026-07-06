import type { ReactNode } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { partBadge, PracticePartHeaderBanner } from "@/components/practice/PracticePartHeaderBanner";
import { PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import {
  READING_INSTRUCTIONS,
  READING_PART_TITLES,
} from "@/lib/readingInstructions";

type Props = {
  activePart: string;
  setIndex?: number;
  totalSets?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  layout?: "single" | "split";
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  footerTop?: ReactNode;
};

export function ReadingPracticeShell({
  activePart,
  setIndex = 1,
  totalSets = 1,
  onPrevious,
  onNext,
  layout = "single",
  leftPanel,
  rightPanel,
  children,
  footer,
  footerTop,
}: Props) {
  const instructions = READING_INSTRUCTIONS[activePart] ?? "";

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden border-t border-slate-200 bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-3 py-2 md:px-4">
        <div className="flex items-center gap-2">
          <div className="hidden size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 sm:flex">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div>
            <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-emerald-400 sm:block">
              PrepSmart LC
            </p>
            <p className="text-xs font-bold text-white sm:text-sm">
              Reading — Set {setIndex}/{totalSets}
            </p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
          <div className="shrink-0 border-b border-slate-100 px-3 py-2 md:px-4 md:py-2.5">
            <PracticePartHeaderBanner
              module="reading"
              partLabel={`Reading Part ${activePart.toUpperCase()}`}
              title={READING_PART_TITLES[activePart] ?? "Reading Practice"}
              instructions={instructions}
              badge={partBadge("reading", activePart)}
              icon={BookOpen}
              compact
            />
          </div>

          {layout === "split" ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="min-h-[240px] overflow-y-auto p-3 md:p-4">{leftPanel}</div>
              <div className="min-h-[240px] overflow-y-auto p-3 md:p-4">{rightPanel}</div>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto p-3 md:p-4">{children}</div>
          )}

          <PracticeBottomBar
            left={footer}
            top={footerTop}
            onPrevious={onPrevious}
            onNext={onNext}
            setIndex={setIndex}
            totalSets={totalSets}
          />
        </main>
      </div>
    </div>
  );
}
