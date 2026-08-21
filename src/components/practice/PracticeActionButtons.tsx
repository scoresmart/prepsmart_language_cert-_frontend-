import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Deep navy submit — same across listening, reading, writing, and speaking. */
export const PRACTICE_SUBMIT_CLASS =
  "bg-[#1e3a8a] text-white shadow-sm hover:bg-[#1b3479] disabled:opacity-50";

/** White background, slate text — redo and previous. */
export const PRACTICE_NAV_CLASS =
  "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40";

/** Filled navy — the forward step, so it reads as the primary move. */
export const PRACTICE_NEXT_CLASS =
  "bg-[#1e3a8a] text-white shadow-sm hover:bg-[#1b3479] disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-100";

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
    <Button
      type="button"
      className={cn("h-10 gap-2 px-5 text-sm font-semibold", PRACTICE_SUBMIT_CLASS, className)}
      {...props}
    >
      {children}
    </Button>
  );
}

type NavProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PracticeNavButton({ className, children, ...props }: NavProps) {
  return (
    <Button
      type="button"
      className={cn("h-10 gap-1.5 px-4 text-sm font-semibold", PRACTICE_NAV_CLASS, className)}
      {...props}
    >
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
 * Bottom action card: Submit / Re-do on the left, Previous · Next on the right.
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
  const actions = center ?? left;

  return (
    <div className="shrink-0 bg-slate-50 px-3 py-3 md:px-5 md:py-4">
      {top}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-[0_6px_20px_-14px_rgba(15,23,42,0.4)] md:px-4">
        <div className="flex flex-wrap items-center gap-2">{actions}</div>

        <div className="flex items-center gap-2">
          <PracticeNavButton disabled={!hasPrev} onClick={onPrevious}>
            <ChevronLeft className="size-4" />
            Previous
          </PracticeNavButton>
          <PracticeNavButton
            disabled={!hasNext}
            onClick={onNext}
            className={PRACTICE_NEXT_CLASS}
          >
            Next
            <ChevronRight className="size-4" />
          </PracticeNavButton>
        </div>
      </div>
    </div>
  );
}
