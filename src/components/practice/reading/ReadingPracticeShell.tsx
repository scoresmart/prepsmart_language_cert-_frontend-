import type { ReactNode } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { PRACTICE_CONTENT_FRAME, PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import { READING_PART_TITLES } from "@/lib/readingInstructions";

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
  const partTitle = READING_PART_TITLES[activePart];

  return (
    <div className="w-full bg-slate-100">
      <div className={PRACTICE_CONTENT_FRAME}>
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-3 py-2 md:px-4">
          <div className="flex items-center gap-2">
            <div className="hidden size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 sm:flex">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="hidden size-3.5 text-emerald-400 sm:block" aria-hidden />
              <div>
                <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-emerald-400 sm:block">
                  ScoreSmart LC
                </p>
                <p className="text-xs font-bold text-white sm:text-sm">
                  Reading — Set {setIndex}/{totalSets}
                  {partTitle ? <span className="font-medium text-white/70"> · {partTitle}</span> : null}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex w-full flex-col bg-white">
          {layout === "split" ? (
            <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-3 md:p-5">{leftPanel}</div>
              <div className="p-3 md:p-5">{rightPanel}</div>
            </div>
          ) : (
            <div className="space-y-5 p-3 pt-5 md:p-5 md:pt-6">{children}</div>
          )}

          <PracticeBottomBar
            center={footer}
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
