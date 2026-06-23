import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { partBadge, PracticePartHeaderBanner } from "@/components/practice/PracticePartHeaderBanner";
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
}: Props) {
  const hasPrev = setIndex > 1;
  const hasNext = setIndex < totalSets;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-t border-slate-200 bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">PrepSmart LC</p>
            <p className="text-sm font-bold text-white">LanguageCert Academic — Speaking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 text-xs text-white/60 sm:flex">
            <Mic className="size-3.5" />
            <span>
              Question {setIndex} / {totalSets}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!hasPrev}
            onClick={onPrevious}
            className="h-8 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 disabled:opacity-40"
          >
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!hasNext}
            onClick={onNext}
            className="h-8 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      </header>

      <div className="flex h-full min-h-0 flex-1 flex-col md:flex-row">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
            <div className="shrink-0 space-y-2 border-b border-slate-100 px-4 py-3 md:px-6">
              <PracticePartHeaderBanner
                module="speaking"
                partLabel={`Speaking Part ${activePart}`}
                title={SPEAKING_PART_TITLES[activePart] ?? "Speaking Practice"}
                instructions={level ? getSpeakingInstruction(activePart, level) : SPEAKING_INSTRUCTIONS[activePart]}
                badge={partBadge("speaking", activePart)}
                icon={Mic}
              />
              <div className="flex items-center justify-end gap-1 sm:hidden">
                <Button type="button" variant="ghost" size="sm" disabled={!hasPrev} onClick={onPrevious} className="h-8 px-2">
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs tabular-nums text-slate-500">
                  {setIndex}/{totalSets}
                </span>
                <Button type="button" variant="ghost" size="sm" disabled={!hasNext} onClick={onNext} className="h-8 px-2">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">{children}</div>

            {footer && (
              <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 md:px-6">
                {footer}
              </div>
            )}
          </main>

          {sidebar}
      </div>
    </div>
  );
}
