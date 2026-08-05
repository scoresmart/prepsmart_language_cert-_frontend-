import type { ReactNode } from "react";
import { PenLine, Sparkles } from "lucide-react";
import { PRACTICE_CONTENT_FRAME_FILL, PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import { WRITING_PART_TITLES } from "@/lib/writingInstructions";

type Props = {
  activePart: string;
  setIndex?: number;
  totalSets?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  layout?: "single" | "split";
  /** @deprecated Banner removed — part title now lives in the dark header. */
  compactBanner?: boolean;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  footerTop?: ReactNode;
};

export function WritingPracticeShell({
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
  const partTitle = WRITING_PART_TITLES[activePart];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-100">
      <div className={PRACTICE_CONTENT_FRAME_FILL}>
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-3 py-2 md:px-4">
          <div className="flex items-center gap-2">
            <div className="hidden size-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 sm:flex">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <PenLine className="hidden size-3.5 text-blue-400 sm:block" aria-hidden />
              <div>
                <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-blue-400 sm:block">
                  ScoreSmart LC
                </p>
                <p className="text-xs font-bold text-white sm:text-sm">
                  Writing — Set {setIndex}/{totalSets}
                  {partTitle ? <span className="font-medium text-white/70"> · {partTitle}</span> : null}
                  <span className="font-medium text-white/70"> · Part {activePart}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
          {layout === "split" ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
              <div className="min-h-[280px] overflow-y-auto border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/80 p-3 pt-5 md:p-4 md:pt-6 lg:border-b-0 lg:border-r">
                {leftPanel}
              </div>
              <div className="flex min-h-[360px] flex-col overflow-hidden bg-white p-3 pt-5 md:p-4 md:pt-6">
                {rightPanel}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 pt-5 md:p-4 md:pt-6">{children}</div>
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
