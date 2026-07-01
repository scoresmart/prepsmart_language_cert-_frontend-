import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Purple submit — same across listening, reading, writing, and speaking. */
export const PRACTICE_SUBMIT_CLASS =
  "bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50";

/** White background, black text — redo, previous, next. */
export const PRACTICE_NAV_CLASS =
  "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 disabled:opacity-40";

export type PracticeSubmitLabelVariant = "answers" | "answer" | "submit";

export function practiceSubmitLabel(
  isLastStep: boolean,
  deferResults: boolean,
  isSubmitting: boolean,
  variant: PracticeSubmitLabelVariant = "answers",
): string {
  if (isSubmitting) return "Submitting…";
  if (deferResults && isLastStep) return "Submit mock test";
  if (variant === "answer") return "Submit Answer";
  if (variant === "submit") return "Submit";
  return "Submit Answers";
}

type SubmitProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PracticeSubmitButton({ className, children, ...props }: SubmitProps) {
  return (
    <Button type="button" size="sm" className={cn("gap-2", PRACTICE_SUBMIT_CLASS, className)} {...props}>
      {children}
    </Button>
  );
}

type NavProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PracticeNavButton({ className, children, ...props }: NavProps) {
  return (
    <Button type="button" size="sm" className={cn("gap-1.5", PRACTICE_NAV_CLASS, className)} {...props}>
      {children}
    </Button>
  );
}

type TaskFooterProps = {
  canSubmit: boolean;
  isSubmitting: boolean;
  submitted: boolean;
  deferResults?: boolean;
  isLastStep?: boolean;
  onSubmit: () => void;
  onRedo: () => void;
  submitVariant?: PracticeSubmitLabelVariant;
  showSubmit?: boolean;
  showRedo?: boolean;
};

/** Standard left-side actions: purple Submit + white Re-do. */
export function PracticeTaskFooterActions({
  canSubmit,
  isSubmitting,
  submitted,
  deferResults = false,
  isLastStep = false,
  onSubmit,
  onRedo,
  submitVariant = "answers",
  showSubmit = true,
  showRedo = true,
}: TaskFooterProps) {
  return (
    <>
      {showSubmit && !submitted && (
        <PracticeSubmitButton onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
          <Send className="size-4" />
          {practiceSubmitLabel(isLastStep, deferResults, isSubmitting, submitVariant)}
        </PracticeSubmitButton>
      )}
      {showRedo && (!submitted || !deferResults) && (
        <PracticeNavButton onClick={onRedo} className="gap-2">
          <RotateCcw className="size-4" />
          Re-do
        </PracticeNavButton>
      )}
    </>
  );
}

type BottomBarProps = {
  left?: ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  setIndex?: number;
  totalSets?: number;
  top?: ReactNode;
};

export function PracticeBottomBar({
  left,
  onPrevious,
  onNext,
  setIndex = 1,
  totalSets = 1,
  top,
}: BottomBarProps) {
  const hasPrev = setIndex > 1;
  const hasNext = setIndex < totalSets;

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2 md:px-4">
      {top}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">{left}</div>
        <div className="flex items-center gap-2">
          <PracticeNavButton disabled={!hasPrev} onClick={onPrevious}>
            <ChevronLeft className="size-4" />
            Previous
          </PracticeNavButton>
          <PracticeNavButton disabled={!hasNext} onClick={onNext}>
            Next
            <ChevronRight className="size-4" />
          </PracticeNavButton>
        </div>
      </div>
    </div>
  );
}
