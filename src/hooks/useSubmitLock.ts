import * as React from "react";

/**
 * Prevents duplicate concurrent runs of an async submit handler (e.g. double-click).
 * Uses a ref for a synchronous guard before React state updates.
 */
export function useSubmitLock() {
  const inFlightRef = React.useRef(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const runSubmit = React.useCallback(async (fn: () => Promise<void>) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsSubmitting(true);
    try {
      await fn();
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, runSubmit };
}

/** For MCQ / gap-fill runners: reveal answers and persist once per click. */
export function useSubmitAnswers(
  setRevealed: React.Dispatch<React.SetStateAction<boolean>>,
  save: () => Promise<unknown>,
) {
  const { isSubmitting, runSubmit } = useSubmitLock();
  const handleSubmit = () => {
    void runSubmit(async () => {
      setRevealed(true);
      await save();
    });
  };
  return { handleSubmit, isSubmitting };
}
