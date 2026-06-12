import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { difficultyLabel } from "@/lib/practiceNavigation";

type Props = {
  sectionLabel: string;
  partLabel?: string;
  instructions?: string;
  questionIndex: number;
  totalQuestions: number;
  accentClass?: string;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
};

const DIFFICULTY_STYLES = {
  Easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Hard: "bg-rose-100 text-rose-700 border-rose-200",
} as const;

export function PracticeQuestionNavigator({
  sectionLabel,
  partLabel,
  instructions,
  questionIndex,
  totalQuestions,
  accentClass = "from-rose-500 to-pink-600",
  onPrevious,
  onNext,
  className,
}: Props) {
  const difficulty = difficultyLabel(questionIndex);
  const hasPrev = questionIndex > 1;
  const hasNext = questionIndex < totalQuestions;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Task banner */}
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-r px-5 py-4 text-white shadow-md",
          accentClass,
        )}
      >
        <h1 className="text-lg font-bold md:text-xl">
          {sectionLabel}
          {partLabel ? ` — ${partLabel}` : ""}
        </h1>
        {instructions && (
          <p className="mt-1 text-sm text-white/90 leading-relaxed">{instructions}</p>
        )}
      </div>

      {/* Question counter + difficulty */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <span className="text-sm font-semibold text-slate-800">
            Question {questionIndex}
            <span className="font-normal text-slate-400"> / {totalQuestions}</span>
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn("text-xs font-semibold", DIFFICULTY_STYLES[difficulty])}
        >
          {difficulty}
        </Badge>
      </div>

      {/* Prev / Next */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrev}
          onClick={onPrevious}
          className="gap-1"
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!hasNext}
          onClick={onNext}
          className="gap-1 bg-slate-800 hover:bg-slate-900"
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
