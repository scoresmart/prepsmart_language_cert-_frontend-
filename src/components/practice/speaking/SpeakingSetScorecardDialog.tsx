import * as React from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpeakingScoreCard } from "@/components/practice/speaking/SpeakingScoreCard";
import {
  averageScaledScore,
  kindInstruction,
  type SpeakingSetPromptScoreEntry,
} from "@/lib/speakingSetScoreStorage";
import type { ScoringPhase } from "@/lib/scoringTypes";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: ScoringPhase;
  error?: string | null;
  setTitle: string;
  partLabel: string;
  entries: SpeakingSetPromptScoreEntry[];
};

export function SpeakingSetScorecardDialog({
  open,
  onOpenChange,
  phase,
  error,
  setTitle,
  partLabel,
  entries,
}: Props) {
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);
  const calculating = phase === "scoring";
  const canDismiss = phase === "done" || phase === "error";
  const avg = averageScaledScore(entries);
  const scoredCount = entries.filter((e) => e.score).length;

  React.useEffect(() => {
    if (open && entries.length === 1) setExpandedKey(entries[0].promptKey);
  }, [open, entries]);

  return (
    <Dialog open={open} onOpenChange={canDismiss ? onOpenChange : undefined}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-3xl"
        onPointerDownOutside={(e) => calculating && e.preventDefault()}
        onEscapeKeyDown={(e) => calculating && e.preventDefault()}
      >
        {calculating ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <Loader2 className="size-5 animate-spin text-violet-600" />
                Calculating your set scores
              </DialogTitle>
              <DialogDescription>
                Scoring each answer on the backend. Your scorecard will appear when all responses are ready.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-violet-500" />
              </div>
              <p className="text-center text-xs text-slate-500">
                Please don&apos;t close this window — scores are being calculated for each question.
              </p>
            </div>
          </>
        ) : phase === "error" && !entries.some((e) => e.score) ? (
          <>
            <DialogHeader>
              <DialogTitle>Scoring failed</DialogTitle>
              <DialogDescription>{error || "Could not calculate scores. Please try again."}</DialogDescription>
            </DialogHeader>
          </>
        ) : (
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Speaking set scorecard</DialogTitle>
              <DialogDescription>
                {setTitle} · {partLabel}. Scores appear only after you finish answering — each row is one
                question or task.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Average across answered items
                  </p>
                  <p className="mt-1 text-3xl font-black tabular-nums text-indigo-600">
                    {avg != null ? avg : "—"}
                    <span className="text-lg font-bold text-slate-400">/50</span>
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  {scoredCount} of {entries.length} item{entries.length === 1 ? "" : "s"} scored
                </p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                How to read this scorecard: each card below is one examiner prompt you answered. Open a
                card to see Task &amp; Coherence, Grammar, Vocabulary, and Pronunciation for that specific
                question.
              </p>
            </div>

            <div className="space-y-3">
              {entries.map((entry, index) => {
                const openRow = expandedKey === entry.promptKey;
                return (
                  <div
                    key={entry.promptKey}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                      onClick={() => setExpandedKey(openRow ? null : entry.promptKey)}
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{entry.promptLabel}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{entry.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{kindInstruction(entry.promptKind)}</p>
                        {entry.error && (
                          <p className="mt-1 text-[11px] font-medium text-red-600">{entry.error}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <p className="text-[10px] font-semibold uppercase text-slate-400">Score</p>
                          <p className="text-lg font-bold tabular-nums text-indigo-600">
                            {entry.score ? entry.score.scores.scaledTotal : "—"}
                            <span className="text-xs font-medium text-slate-400">/50</span>
                          </p>
                        </div>
                        {openRow ? (
                          <ChevronUp className="size-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="size-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {openRow && entry.score && (
                      <div className={cn("border-t border-slate-100 bg-slate-50/50 px-3 py-4")}>
                        <p className="mb-3 rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-[11px] leading-relaxed text-cyan-900">
                          <span className="font-semibold">This score is for:</span> {entry.promptLabel}
                          {entry.instruction ? ` — “${entry.instruction.slice(0, 120)}${entry.instruction.length > 120 ? "…" : ""}”` : ""}
                        </p>
                        <SpeakingScoreCard
                          speaking={entry.score}
                          recordingUrl={entry.recordingUrl}
                          referenceText={entry.referenceText}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
