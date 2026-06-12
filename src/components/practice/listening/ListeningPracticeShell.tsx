import type { ReactNode } from "react";

import { Link } from "react-router-dom";

import { ChevronLeft, ChevronRight, Headphones, LayoutList, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { LISTENING_INSTRUCTIONS, LISTENING_PARTS, LISTENING_PART_TITLES } from "@/lib/listeningInstructions";

import { partStartUrl } from "@/lib/practiceRoutes";

import { partBadge, PracticePartHeaderBanner } from "@/components/practice/PracticePartHeaderBanner";

import { ListeningAudioPlayer } from "./ListeningAudioPlayer";



type Props = {

  activePart: number;

  audioUrl: string | null;

  setIndex?: number;

  totalSets?: number;

  onOpenNavigator?: () => void;

  onPrevious?: () => void;

  onNext?: () => void;

  children: ReactNode;

  footer?: ReactNode;

};



export function ListeningPracticeShell({

  activePart,

  audioUrl,

  setIndex = 1,

  totalSets = 1,

  onOpenNavigator,

  onPrevious,

  onNext,

  children,

  footer,

}: Props) {

  const instructions = LISTENING_INSTRUCTIONS[activePart] ?? "";

  const hasPrev = setIndex > 1;

  const hasNext = setIndex < totalSets;



  return (

    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border-t border-slate-200 bg-white">

      <header className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-4 py-3 md:px-6">

        <div className="flex items-center gap-2">

          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500">

            <Sparkles className="size-4 text-white" />

          </div>

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">PrepSmart LC</p>

            <p className="text-sm font-bold text-white">LanguageCert Academic — Listening</p>

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

          <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">

            <Headphones className="size-3.5" />

            <span>

              Set {setIndex} / {totalSets}

            </span>

          </div>

        </div>

      </header>



      <div className="flex flex-1 flex-col md:flex-row min-h-0">

        <aside className="shrink-0 border-b border-slate-200 bg-slate-50 md:w-52 md:border-b-0 md:border-r">

          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible">

            {LISTENING_PARTS.map(({ part, label }) => {

              const active = part === activePart;

              return (

                <Link

                  key={part}

                  to={partStartUrl("listening", String(part))}

                  className={cn(

                    "relative flex shrink-0 items-center px-4 py-3.5 text-sm font-medium transition md:px-5",

                    active

                      ? "bg-slate-700 text-white md:bg-slate-600"

                      : "text-slate-600 hover:bg-slate-100",

                  )}

                >

                  {label}

                  {active && (

                    <span

                      className="absolute right-0 top-1/2 hidden size-0 -translate-y-1/2 border-y-[10px] border-y-transparent border-l-[10px] border-l-slate-600 md:block"

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

                className="text-left text-xs font-medium text-cyan-700 hover:text-cyan-900"

              >

                View all question sets →

              </button>

            </div>

          )}

        </aside>



        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">

          <div className="shrink-0 space-y-3 border-b border-slate-100 px-4 py-4 md:px-8">
            <PracticePartHeaderBanner
              module="listening"
              partLabel={`Listening Part ${activePart}`}
              title={LISTENING_PART_TITLES[activePart] ?? "Listening Practice"}
              instructions={instructions}
              badge={partBadge("listening", String(activePart))}
              icon={Headphones}
            />
            <div className="flex items-center justify-end gap-1 sm:hidden">
              <Button type="button" variant="ghost" size="sm" disabled={!hasPrev} onClick={onPrevious} className="h-8 px-2">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs tabular-nums text-slate-500">
                {setIndex} / {totalSets}
              </span>
              <Button type="button" variant="ghost" size="sm" disabled={!hasNext} onClick={onNext} className="h-8 px-2">
                <ChevronRight className="size-4" />
              </Button>
              {onOpenNavigator && (
                <Button type="button" variant="outline" size="sm" onClick={onOpenNavigator} className="ml-1 h-8">
                  <LayoutList className="size-3.5" />
                </Button>
              )}
            </div>
          </div>



          <div className="border-b border-slate-100 bg-slate-50/50 px-4 md:px-8">

            {audioUrl ? (

              <ListeningAudioPlayer src={audioUrl} />

            ) : (

              <div className="py-8 text-center text-sm text-slate-400">No audio available for this set.</div>

            )}

          </div>



          <div className="flex-1 space-y-4 p-4 md:p-8 md:pt-6">{children}</div>



          {footer && (

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur md:px-8">

              {footer}

            </div>

          )}

        </main>

      </div>

    </div>

  );

}


