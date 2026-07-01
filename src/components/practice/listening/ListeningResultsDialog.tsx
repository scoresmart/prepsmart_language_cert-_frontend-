import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ListeningScoreCard,
  type ListeningBreakdownItem,
} from "@/components/practice/listening/ListeningScoreCard";
import type { ObjectiveScoreResult } from "@/lib/objectiveScoreUtils";

export function useListeningResultsDialog(submitted: boolean, deferResults: boolean) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (submitted && !deferResults) setOpen(true);
  }, [submitted, deferResults]);

  return { open, setOpen };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ObjectiveScoreResult | null;
  partNumber: number;
  partTitle: string;
  breakdown?: ListeningBreakdownItem[];
  answerSummary?: React.ReactNode;
};

export function ListeningResultsDialog({
  open,
  onOpenChange,
  result,
  partNumber,
  partTitle,
  breakdown,
  answerSummary,
}: Props) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Listening Part {partNumber} Score Report</DialogTitle>
        </DialogHeader>
        <ListeningScoreCard
          result={result}
          partNumber={partNumber}
          partTitle={partTitle}
          breakdown={breakdown}
          answerSummary={answerSummary}
        />
        <Button
          type="button"
          className="w-full bg-slate-800 hover:bg-slate-900"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
