import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReadingScoreCard } from "@/components/practice/reading/ReadingScoreCard";
import type { ObjectiveScoreResult } from "@/lib/objectiveScoreUtils";

export function useReadingResultsDialog(submitted: boolean, deferResults: boolean) {
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
};

export function ReadingResultsDialog({ open, onOpenChange, result }: Props) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">Your Results</DialogTitle>
        </DialogHeader>
        <ReadingScoreCard result={result} />
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
