import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PracticeScoreResult } from "@/components/practice/PracticeScoreResult";
import type { ScoringPhase, SpeakingScoreResult, WritingScoreResult } from "@/lib/scoringTypes";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: ScoringPhase;
  error?: string | null;
  writing?: WritingScoreResult | null;
  speaking?: SpeakingScoreResult | null;
  responseText?: string;
  recordingUrl?: string | null;
};

export function PracticeScoringDialog({
  open,
  onOpenChange,
  phase,
  error,
  writing,
  speaking,
  responseText,
  recordingUrl,
}: Props) {
  const calculating = phase === "scoring";
  const canDismiss = phase === "done" || phase === "error";

  return (
    <Dialog open={open} onOpenChange={canDismiss ? onOpenChange : undefined}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl"
        onPointerDownOutside={(e) => calculating && e.preventDefault()}
        onEscapeKeyDown={(e) => calculating && e.preventDefault()}
      >
        {calculating ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <Loader2 className="size-5 animate-spin text-violet-600" />
                Calculating score
              </DialogTitle>
              <DialogDescription>
                Please wait while we calculate your score. This usually takes a few seconds.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-violet-500" />
              </div>
              <p className="text-center text-xs text-slate-500">
                Please don&apos;t close or refresh this window — your score will appear here automatically.
              </p>
            </div>
          </>
        ) : (
          <PracticeScoreResult
            phase={phase}
            error={error}
            writing={writing}
            speaking={speaking}
            responseText={responseText}
            recordingUrl={recordingUrl}
            className="border-0 p-0 shadow-none"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
