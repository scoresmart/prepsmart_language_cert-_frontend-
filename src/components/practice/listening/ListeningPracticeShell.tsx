import type { ReactNode } from "react";

import { LISTENING_INSTRUCTIONS, LISTENING_PART_TITLES } from "@/lib/listeningInstructions";
import { PRACTICE_CONTENT_FRAME, PracticeBottomBar } from "@/components/practice/PracticeActionButtons";
import { PracticeTaskHeader } from "@/components/practice/PracticeTaskHeader";
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
  const partTitle = LISTENING_PART_TITLES[activePart] ?? `Listening Part ${activePart}`;

  return (
    <div className="w-full bg-slate-100">
      <div className={PRACTICE_CONTENT_FRAME}>
        <PracticeTaskHeader
          module="listening"
          part={activePart}
          title={partTitle}
          description={LISTENING_INSTRUCTIONS[activePart]}
          setIndex={setIndex}
          totalSets={totalSets}
        />

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
