import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, LayoutList, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { partStartUrl } from "@/lib/practiceRoutes";
import { partBadge, PracticePartHeaderBanner } from "@/components/practice/PracticePartHeaderBanner";
import { WRITING_INSTRUCTIONS, WRITING_PARTS, WRITING_PART_TITLES } from "@/lib/writingInstructions";

type Props = {
  activePart: string;
  setIndex?: number;
  totalSets?: number;
  onOpenNavigator?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function WritingPracticeShell({
  activePart,
  setIndex = 1,
  totalSets = 1,
  onOpenNavigator,
  onPrevious,
  onNext,
  children,
  footer,
}: Props) {
  const hasPrev = setIndex > 1;
  const hasNext = setIndex < totalSets;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border-t border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">PrepSmart LC</p>
            <p className="text-sm font-bold text-white">LanguageCert Academic — Writing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenNavigator && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onOpenNavigator}
              className="hidden h-8 gap-1.5 bg-white/10 text-white hover:bg-white/20 sm:flex"
            >
              <LayoutList className="size-3.5" />
              Navigator
            </Button>
          )}
          <div className="hidden items-center gap-2 text-xs text-white/60 sm:flex">
            <PenLine className="size-3.5" />
            <span>
              Set {setIndex} / {totalSets}
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

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="shrink-0 border-b border-slate-200 bg-slate-50 md:w-52 md:border-b-0 md:border-r">
          <p className="hidden px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 md:block">
            Writing
          </p>
          <nav className="flex overflow-x-auto md:flex-col md:overflow-visible">
            {WRITING_PARTS.map(({ part, label }) => {
              const active = part === activePart;
              return (
                <Link
                  key={part}
                  to={partStartUrl("writing", part)}
                  className={cn(
                    "relative flex shrink-0 items-center px-4 py-3.5 text-sm font-medium transition md:px-5",
                    active
                      ? "bg-slate-800 text-white md:bg-slate-700"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {label}
                  {active && (
                    <span
                      className="absolute right-0 top-1/2 hidden size-0 -translate-y-1/2 border-y-[10px] border-y-transparent border-l-[10px] border-l-slate-700 md:block"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </nav>
          {onOpenNavigator && (
            <div className="hidden border-t border-slate-200 p-3 md:block">
              <button
                type="button"
                onClick={onOpenNavigator}
                className="text-left text-xs font-medium text-blue-700 hover:text-blue-900"
              >
                View all question sets →
              </button>
            </div>
          )}
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-3 border-b border-slate-100 px-4 py-4 md:px-6">
            <PracticePartHeaderBanner
              module="writing"
              partLabel={`Writing Part ${activePart}`}
              title={WRITING_PART_TITLES[activePart] ?? "Writing Practice"}
              instructions={WRITING_INSTRUCTIONS[activePart]}
              badge={partBadge("writing", activePart)}
              icon={PenLine}
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
              {onOpenNavigator && (
                <Button type="button" variant="outline" size="sm" onClick={onOpenNavigator} className="h-8">
                  <LayoutList className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>

          {footer && (
            <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-6">
              {footer}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
