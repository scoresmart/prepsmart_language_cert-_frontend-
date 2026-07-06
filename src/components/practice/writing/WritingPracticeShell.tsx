import type { ReactNode } from "react";
import { PenLine, Sparkles } from "lucide-react";
import { partBadge, PracticePartHeaderBanner } from "@/components/practice/PracticePartHeaderBanner";
import { PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import { WRITING_INSTRUCTIONS, WRITING_PART_TITLES } from "@/lib/writingInstructions";

type Props = {
  activePart: string;
  setIndex?: number;
  totalSets?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  layout?: "single" | "split";
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
  compactBanner = false,
  leftPanel,
  rightPanel,
  children,
  footer,
  footerTop,
}: Props) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden border-t border-slate-200 bg-white">
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
              Writing — Set {setIndex}/{totalSets}
              {compactBanner && (
                <span className="font-medium text-white/70">
                  {" "}
                  · Part {activePart}
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
          {!compactBanner && (
            <div className="shrink-0 border-b border-slate-100 px-3 py-2 md:px-4 md:py-2.5">
              <PracticePartHeaderBanner
                module="writing"
                partLabel={`Writing Part ${activePart}`}
                title={WRITING_PART_TITLES[activePart] ?? "Writing Practice"}
                instructions={WRITING_INSTRUCTIONS[activePart]}
                badge={partBadge("writing", activePart)}
                icon={PenLine}
                compact
              />
            </div>
          )}

          {layout === "split" ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
              <div className="min-h-[280px] overflow-y-auto border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/80 p-3 md:p-4 lg:border-b-0 lg:border-r">
                {leftPanel}
              </div>
              <div className="flex min-h-[360px] flex-col overflow-hidden bg-white p-3 md:p-4">
                {rightPanel}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 md:p-4">{children}</div>
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
