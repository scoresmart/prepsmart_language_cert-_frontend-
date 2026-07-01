import * as React from "react";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { completeMockSectionSubmit, isMockDeferScoring } from "@/lib/mockTestRecorder";
import type { MockPendingSection } from "@/lib/mockTestPendingTypes";
import { useMockTestRunOptional } from "@/providers/MockTestRunContext";

export function useMockDeferredPracticeSubmit(
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>,
  buildPending: () => MockPendingSection,
  immediateSave: () => Promise<unknown>,
) {
  const mock = useMockTestRunOptional();
  const defer = isMockDeferScoring();
  const { isSubmitting, runSubmit } = useSubmitLock();

  const handleSubmit = () => {
    void runSubmit(async () => {
      setSubmitted(true);
      const deferred = await completeMockSectionSubmit(buildPending());
      if (!deferred) {
        await immediateSave();
      }
    });
  };

  return {
    handleSubmit,
    isSubmitting,
    deferResults: defer,
    isLastStep: mock?.isLastStep ?? false,
  };
}

/** In mock tests, lock answers after submit but do not reveal correct answers until results. */
export function mockShowAnswers(submitted: boolean, deferResults: boolean) {
  return submitted && !deferResults;
}
