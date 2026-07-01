/** Bridge so practice submit handlers record mock scores without UI changes. */

import type { MockPendingSection } from "@/lib/mockTestPendingTypes";
import { recordMockPendingSection } from "@/lib/mockTestSessionStorage";

let activeTestId: string | null = null;
let activeSectionKey: string | null = null;
let deferScoring = false;
let isLastStep = false;
let onFinish: (() => Promise<void>) | null = null;

export function setMockTestContext(testId: string | null, sectionKey: string | null) {
  activeTestId = testId;
  activeSectionKey = sectionKey;
}

export function setMockTestRunOptions(options: {
  deferScoring?: boolean;
  isLastStep?: boolean;
  onFinish?: (() => Promise<void>) | null;
}) {
  if (options.deferScoring !== undefined) deferScoring = options.deferScoring;
  if (options.isLastStep !== undefined) isLastStep = options.isLastStep;
  if (options.onFinish !== undefined) onFinish = options.onFinish;
}

export function isMockTestActive() {
  return Boolean(activeTestId && activeSectionKey);
}

export function isMockDeferScoring() {
  return deferScoring && isMockTestActive();
}

export function notifyMockTestScore(questionType: string, score: number, total: number) {
  if (!activeTestId || !activeSectionKey || deferScoring) return;
  import("@/lib/mockTestSessionStorage").then(({ recordMockSectionScore }) => {
    recordMockSectionScore(activeTestId!, activeSectionKey!, questionType, score, total);
  });
}

/** Skip placeholder 0 scores for AI-graded sections until Azure/Claude returns. */
export function notifyMockTestScoreFromAttempt(
  questionType: string,
  score: number,
  total: number,
) {
  if (!isMockTestActive() || deferScoring) return;
  if (score === 0 && /^(writing_|speaking_)/.test(questionType)) return;
  notifyMockTestScore(questionType, score, total);
}

/** Record Writing (Claude) score on mock test results sheet. */
export function notifyMockWritingAiScore(taskType: "task1" | "task2", rawTotalOutOf12: number) {
  if (!isMockTestActive() || deferScoring) return;
  const scaled = Math.round((rawTotalOutOf12 / 12) * 25);
  notifyMockTestScore(`writing_${taskType}`, scaled, 25);
}

/** Record Speaking (Azure + Claude) score on mock test results sheet. */
export function notifyMockSpeakingAiScore(part: string, scaledTotal: number) {
  if (!isMockTestActive() || deferScoring) return;
  notifyMockTestScore(`speaking_part_${part}`, scaledTotal, 50);
}

/** Store answers during mock test; score at end on last submit. Returns true if deferred. */
export async function completeMockSectionSubmit(pending: MockPendingSection): Promise<boolean> {
  if (!deferScoring || !activeTestId || !activeSectionKey) return false;

  recordMockPendingSection(activeTestId, activeSectionKey, pending);

  if (isLastStep && onFinish) {
    await onFinish();
  }
  return true;
}
