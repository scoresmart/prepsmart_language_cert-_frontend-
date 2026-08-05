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

/** Shared centered material width — side gaps like PTE practice. */
export const PRACTICE_CONTENT_FRAME =
  "mx-auto flex min-h-0 w-full max-w-6xl flex-col bg-white lg:max-w-7xl";

/** Fill available height (writing / speaking panes). */
export const PRACTICE_CONTENT_FRAME_FILL =
  "mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col bg-white lg:max-w-7xl";

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

/** Center actions: purple Submit + white Re-do. */
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
  /** Center actions (Submit / Re-do / word count). */
  center?: ReactNode;
  /** @deprecated use `center` — kept for existing call sites. */
  left?: ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  setIndex?: number;
  totalSets?: number;
  top?: ReactNode;
};

/**
 * Bottom nav: Previous (left) · Submit/actions (center) · Next (right).
 */
export function PracticeBottomBar({
  center,
  left,
  onPrevious,
  onNext,
  setIndex = 1,
  totalSets = 1,
  top,
}: BottomBarProps) {
  const hasPrev = setIndex > 1;
  const hasNext = setIndex < totalSets;
  const middle = center ?? left;

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5 md:px-5">
      {top}
      <div className="grid grid-cols-[minmax(5.5rem,1fr)_auto_minmax(5.5rem,1fr)] items-center gap-2">
        <div className="justify-self-start">
          <PracticeNavButton disabled={!hasPrev} onClick={onPrevious}>
            <ChevronLeft className="size-4" />
            Previous
          </PracticeNavButton>
        </div>

        <div className="flex max-w-[min(100vw-12rem,28rem)] flex-wrap items-center justify-center gap-2 justify-self-center">
          {middle}
        </div>

        <div className="justify-self-end">
          <PracticeNavButton disabled={!hasNext} onClick={onNext}>
            Next
            <ChevronRight className="size-4" />
          </PracticeNavButton>
        </div>
      </div>
    </div>
  );
}
