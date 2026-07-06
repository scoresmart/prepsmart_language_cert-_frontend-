import type { ReactNode } from "react";

import { Headphones, Sparkles } from "lucide-react";

import { LISTENING_INSTRUCTIONS, LISTENING_PART_TITLES } from "@/lib/listeningInstructions";

import { partBadge, PracticePartHeaderBanner } from "@/components/practice/PracticePartHeaderBanner";
import { PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
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
  const instructions = LISTENING_INSTRUCTIONS[activePart] ?? "";

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden border-t border-slate-200 bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#1a1a2e] via-[#1e2240] to-[#151528] px-3 py-2 md:px-4">
        <div className="flex items-center gap-2">
          <div className="hidden size-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 sm:flex">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div>
            <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-cyan-400 sm:block">
              PrepSmart LC
            </p>
            <p className="text-xs font-bold text-white sm:text-sm">
              Listening — Set {setIndex}/{totalSets}
            </p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
          <div className="shrink-0 border-b border-slate-100 px-3 py-2 md:px-4 md:py-2.5">
            <PracticePartHeaderBanner
              module="listening"
              partLabel={`Listening Part ${activePart}`}
              title={LISTENING_PART_TITLES[activePart] ?? "Listening Practice"}
              instructions={instructions}
              badge={partBadge("listening", String(activePart))}
              icon={Headphones}
              compact
            />
          </div>

          <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 px-3 md:px-4">
            {audioUrl ? (
              <ListeningAudioPlayer src={audioUrl} resetKey={audioResetKey ?? audioUrl} />
            ) : (
              <div className="py-6 text-center text-sm text-slate-400">No audio available for this set.</div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto p-3 md:p-4">{children}</div>

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
