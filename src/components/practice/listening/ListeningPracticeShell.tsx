import type { ReactNode } from "react";

import { Headphones, Sparkles } from "lucide-react";

import { LISTENING_PART_TITLES } from "@/lib/listeningInstructions";
import { PRACTICE_CONTENT_FRAME, PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
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
  footerTop?: ReactNode;
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
  footerTop,
}: Props) {
  const partTitle = LISTENING_PART_TITLES[activePart];

  return (
    <div className="w-full bg-slate-100">
      <div className={PRACTICE_CONTENT_FRAME}>
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-3 py-2 md:px-4">
          <div className="flex items-center gap-2">
            <div className="hidden size-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 sm:flex">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="hidden size-3.5 text-cyan-400 sm:block" aria-hidden />
              <div>
                <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-cyan-400 sm:block">
                  ScoreSmart LC
                </p>
                <p className="text-xs font-bold text-white sm:text-sm">
                  Listening — Set {setIndex}/{totalSets}
                  {partTitle ? <span className="font-medium text-white/70"> · {partTitle}</span> : null}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex w-full flex-col bg-white">
          <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 px-3 md:px-4">
            {audioUrl ? (
              <ListeningAudioPlayer src={audioUrl} resetKey={audioResetKey ?? audioUrl} />
            ) : (
              <div className="py-6 text-center text-sm text-slate-400">No audio available for this set.</div>
            )}
          </div>

          <div className="space-y-5 p-3 pt-5 md:p-5 md:pt-6">{children}</div>

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
