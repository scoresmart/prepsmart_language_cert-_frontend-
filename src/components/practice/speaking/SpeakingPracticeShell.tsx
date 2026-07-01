import type { ReactNode } from "react";
import { Mic, Sparkles } from "lucide-react";
import { partBadge, PracticePartHeaderBanner } from "@/components/practice/PracticePartHeaderBanner";
import { PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import { SPEAKING_INSTRUCTIONS, SPEAKING_PART_TITLES, getSpeakingInstruction } from "@/lib/speakingInstructions";

type Props = {
  activePart: string;
  level?: string;
  setIndex?: number;
  totalSets?: number;
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
  onPrevious,
  onNext,
  sidebar,
  children,
  footer,
  footerTop,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-t border-slate-200 bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-3 py-2 md:px-4">
        <div className="flex items-center gap-2">
          <div className="hidden size-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 sm:flex">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div>
            <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-blue-400 sm:block">
              PrepSmart LC
            </p>
            <p className="text-xs font-bold text-white sm:text-sm">
              Speaking — Q {setIndex}/{totalSets}
            </p>
          </div>
        </div>
      </header>

      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="shrink-0 border-b border-slate-100 px-3 py-2 md:px-4 md:py-2.5">
            <PracticePartHeaderBanner
              module="speaking"
              partLabel={`Speaking Part ${activePart}`}
              title={SPEAKING_PART_TITLES[activePart] ?? "Speaking Practice"}
              instructions={level ? getSpeakingInstruction(activePart, level) : SPEAKING_INSTRUCTIONS[activePart]}
              badge={partBadge("speaking", activePart)}
              icon={Mic}
              compact
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 md:p-3">
            <div className="flex h-full w-full min-h-0 flex-col">{children}</div>
          </div>

          <PracticeBottomBar
            left={footer}
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
  );
}
