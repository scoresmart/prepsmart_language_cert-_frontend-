import type { ReactNode } from "react";
import { PRACTICE_CONTENT_FRAME, PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import { PracticeTaskHeader } from "@/components/practice/PracticeTaskHeader";
import { READING_INSTRUCTIONS, READING_PART_TITLES } from "@/lib/readingInstructions";

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
  const partTitle = READING_PART_TITLES[activePart] ?? `Reading Part ${activePart}`;

  return (
    <div className="w-full bg-slate-100">
      <div className={PRACTICE_CONTENT_FRAME}>
        <PracticeTaskHeader
          module="reading"
          part={activePart}
          title={partTitle}
          description={READING_INSTRUCTIONS[activePart]}
          setIndex={setIndex}
          totalSets={totalSets}
        />

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
