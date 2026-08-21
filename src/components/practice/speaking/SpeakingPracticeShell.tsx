import type { ReactNode } from "react";
import { PRACTICE_CONTENT_FRAME_FILL, PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import { PracticeTaskHeader } from "@/components/practice/PracticeTaskHeader";
import { SpeakingSetProgressBar } from "@/components/practice/speaking/SpeakingSetProgressBar";
import {
  SPEAKING_PART_ABBREV,
  SPEAKING_PART_TITLES,
  getSpeakingBannerDescription,
} from "@/lib/speakingInstructions";
import type { SpeakingSetProgress } from "@/lib/speakingSetStructure";

type Props = {
  activePart: string;
  level?: string;
  setIndex?: number;
  totalSets?: number;
  setProgress?: SpeakingSetProgress;
  setTitle?: string;
  promptLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  sidebar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  footerTop?: ReactNode;
};

export function SpeakingPracticeShell({
  activePart,
  level,
  setIndex = 1,
  totalSets = 1,
  setProgress,
  setTitle,
  promptLabel,
  onPrevious,
  onNext,
  sidebar,
  children,
  footer,
  footerTop,
}: Props) {
  const partTitle = SPEAKING_PART_TITLES[activePart] ?? `Speaking Part ${activePart}`;
  const abbrev = SPEAKING_PART_ABBREV[activePart] ?? activePart;
  const briefing = getSpeakingBannerDescription(activePart, level);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-100">
      <div className={PRACTICE_CONTENT_FRAME_FILL}>
        <PracticeTaskHeader
          module="speaking"
          part={activePart}
          title={partTitle}
          description={briefing}
          abbrev={abbrev}
          setIndex={setIndex}
          totalSets={totalSets}
        />

        {setProgress ? (
          <SpeakingSetProgressBar
            progress={setProgress}
            promptLabel={promptLabel}
            setTitle={setTitle}
          />
        ) : null}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-4 md:p-4 md:pt-5">
              <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
            </div>

            <PracticeBottomBar
              center={footer}
              top={footerTop}
              onPrevious={onPrevious}
              onNext={onNext}
              setIndex={setIndex}
              totalSets={totalSets}
            />
          </main>

          {sidebar ? (
            <div className="hidden shrink-0 border-l border-slate-200 bg-slate-50 md:flex md:w-72 lg:w-80">
              {sidebar}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
