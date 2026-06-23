/** Bridge so practice submit handlers record mock scores without UI changes. */

let activeTestId: string | null = null;
let activeSectionKey: string | null = null;

export function setMockTestContext(testId: string | null, sectionKey: string | null) {
  activeTestId = testId;
  activeSectionKey = sectionKey;
}

export function isMockTestActive() {
  return Boolean(activeTestId && activeSectionKey);
}

export function notifyMockTestScore(questionType: string, score: number, total: number) {
  if (!activeTestId || !activeSectionKey) return;
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
  if (!isMockTestActive()) return;
  if (score === 0 && /^(writing_|speaking_)/.test(questionType)) return;
  notifyMockTestScore(questionType, score, total);
}

/** Record Writing (Claude) score on mock test results sheet. */
export function notifyMockWritingAiScore(taskType: "task1" | "task2", rawTotalOutOf12: number) {
  if (!isMockTestActive()) return;
  const scaled = Math.round((rawTotalOutOf12 / 12) * 25);
  notifyMockTestScore(`writing_${taskType}`, scaled, 25);
}

/** Record Speaking (Azure + Claude) score on mock test results sheet. */
export function notifyMockSpeakingAiScore(part: string, scaledTotal: number) {
  if (!isMockTestActive()) return;
  notifyMockTestScore(`speaking_part_${part}`, scaledTotal, 50);
}
