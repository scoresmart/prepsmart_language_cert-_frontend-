import type { ReactNode } from "react";
import { PRACTICE_CONTENT_FRAME_FILL, PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import { PracticeTaskHeader } from "@/components/practice/PracticeTaskHeader";
import { WRITING_INSTRUCTIONS, WRITING_PART_TITLES } from "@/lib/writingInstructions";

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
  const partTitle = WRITING_PART_TITLES[activePart] ?? `Writing Part ${activePart}`;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-100">
      <div className={PRACTICE_CONTENT_FRAME_FILL}>
        <PracticeTaskHeader
          module="writing"
          part={activePart}
          title={partTitle}
          description={WRITING_INSTRUCTIONS[activePart]}
          setIndex={setIndex}
          totalSets={totalSets}
        />

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
