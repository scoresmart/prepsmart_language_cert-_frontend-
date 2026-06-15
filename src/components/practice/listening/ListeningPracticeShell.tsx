import type { ReactNode } from "react";

import { ChevronLeft, ChevronRight, Headphones, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { LISTENING_INSTRUCTIONS, LISTENING_PART_TITLES } from "@/lib/listeningInstructions";

import { partBadge, PracticePartHeaderBanner } from "@/components/practice/PracticePartHeaderBanner";
import { ListeningAudioPlayer } from "./ListeningAudioPlayer";



type Props = {

  activePart: number;

  audioUrl: string | null;
  audioResetKey?: string;

  setIndex?: number;

  totalSets?: number;

  onPrevious?: () => void;

  onNext?: () => void;

  children: ReactNode;

  footer?: ReactNode;

};



export function ListeningPracticeShell({

  activePart,

  audioUrl,
  audioResetKey,

  setIndex = 1,

  totalSets = 1,

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

          <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">

            <Headphones className="size-3.5" />

            <span>

              Set {setIndex} / {totalSets}

            </span>

          </div>

        </div>

      </header>



      <div className="flex h-full min-h-0 flex-1 flex-col md:flex-row">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">

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
            </div>
          </div>



          <div className="border-b border-slate-100 bg-slate-50/50 px-4 md:px-8">

            {audioUrl ? (

              <ListeningAudioPlayer src={audioUrl} resetKey={audioResetKey ?? audioUrl} />

            ) : (

              <div className="py-8 text-center text-sm text-slate-400">No audio available for this set.</div>

            )}

          </div>



          <div className="flex min-h-0 flex-1 flex-col space-y-4 p-4 md:p-8 md:pt-6">{children}</div>



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


