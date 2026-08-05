import type { ReactNode } from "react";
import { Mic, Sparkles } from "lucide-react";
import { PRACTICE_CONTENT_FRAME_FILL, PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import { SpeakingSetProgressBar } from "@/components/practice/speaking/SpeakingSetProgressBar";
import { SPEAKING_PART_TITLES } from "@/lib/speakingInstructions";
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
  const partTitle = SPEAKING_PART_TITLES[activePart];

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-slate-100">
      <div className={PRACTICE_CONTENT_FRAME_FILL}>
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-3 py-2 md:px-4">
          <div className="flex items-center gap-2">
            <div className="hidden size-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 sm:flex">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <Mic className="hidden size-3.5 text-blue-400 sm:block" aria-hidden />
              <div>
                <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-blue-400 sm:block">
                  ScoreSmart LC
                </p>
                <p className="text-xs font-bold text-white sm:text-sm">
                  Speaking — Q {setIndex}/{totalSets}
                  {partTitle ? <span className="font-medium text-white/70"> · {partTitle}</span> : null}
                </p>
              </div>
            </div>
          </div>
        </header>

        {setProgress ? (
          <SpeakingSetProgressBar
            progress={setProgress}
            promptLabel={promptLabel}
            setTitle={setTitle}
          />
        ) : null}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 pt-4 md:p-3 md:pt-5">
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
