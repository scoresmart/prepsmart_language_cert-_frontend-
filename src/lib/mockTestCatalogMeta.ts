import type { MockTest } from "@/lib/api";
import {
  MOCK_EXAM_TOTAL_MINUTES,
  MOCK_LISTENING_PARTS,
  MOCK_MODULE_TIMINGS,
  MOCK_READING_PARTS,
  MOCK_SPEAKING_PARTS,
  MOCK_TEST_STEPS,
  MOCK_WRITING_TASKS,
} from "@/lib/mockTestFormat";
import { loadMockSession, type MockTestSession } from "@/lib/mockTestSessionStorage";

export type MockTestKind = "full" | "speaking" | "writing" | "reading" | "listening";
export type MockTestDifficulty = "Easy" | "Medium" | "Hard";
export type MockTestAttemptStatus = "none" | "in_progress" | "attempted";

const KIND_ORDER: MockTestKind[] = ["full", "speaking", "writing", "reading", "listening"];

const SECTIONAL_META: Record<
  Exclude<MockTestKind, "full">,
  { minutes: number; questions: number }
> = {
  listening: {
    minutes: MOCK_MODULE_TIMINGS.listening,
    questions: MOCK_LISTENING_PARTS.reduce((sum, p) => sum + p.questions, 0),
  },
  reading: {
    minutes: MOCK_MODULE_TIMINGS.reading,
    questions: MOCK_READING_PARTS.reduce((sum, p) => sum + p.questions, 0),
  },
  writing: {
    minutes: MOCK_MODULE_TIMINGS.writing,
    questions: MOCK_WRITING_TASKS.length,
  },
  speaking: {
    minutes: MOCK_MODULE_TIMINGS.speaking,
    questions: MOCK_SPEAKING_PARTS.length,
  },
};

const FULL_QUESTION_COUNT =
  MOCK_LISTENING_PARTS.reduce((sum, p) => sum + p.questions, 0) +
  MOCK_READING_PARTS.reduce((sum, p) => sum + p.questions, 0) +
  MOCK_WRITING_TASKS.length +
  MOCK_SPEAKING_PARTS.length;

export function inferMockTestKind(title: string): MockTestKind {
  const t = title.toLowerCase();
  if (t.includes("speaking")) return "speaking";
  if (t.includes("writing")) return "writing";
  if (t.includes("reading")) return "reading";
  if (t.includes("listening")) return "listening";
  return "full";
}

export function sortMockTests(tests: MockTest[]): MockTest[] {
  return [...tests].sort((a, b) => {
    const kindA = inferMockTestKind(a.title);
    const kindB = inferMockTestKind(b.title);
    const orderA = KIND_ORDER.indexOf(kindA);
    const orderB = KIND_ORDER.indexOf(kindB);
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" });
  });
}

export function getMockTestDifficulty(test: MockTest, index: number): MockTestDifficulty {
  const t = test.title.toLowerCase();
  if (t.includes("hard")) return "Hard";
  if (t.includes("easy")) return "Easy";
  if (t.includes("medium")) return "Medium";
  return index % 3 === 2 ? "Hard" : "Medium";
}

export function getMockTestDurationMinutes(kind: MockTestKind): number {
  if (kind === "full") return MOCK_EXAM_TOTAL_MINUTES;
  return SECTIONAL_META[kind].minutes;
}

export function formatMockTestDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins} min`;
}

export function getMockTestQuestionCount(kind: MockTestKind): number {
  if (kind === "full") return FULL_QUESTION_COUNT;
  return SECTIONAL_META[kind].questions;
}

export function getMockTestAttemptStatus(testId: string): MockTestAttemptStatus {
  const session = loadMockSession(testId);
  if (!session) return "none";
  return resolveSessionStatus(session);
}

export function resolveSessionStatus(session: MockTestSession): MockTestAttemptStatus {
  if (session.status === "completed" || session.scoredAt) return "attempted";
  const answered = Object.keys(session.sections).length;
  const pending = Object.keys(session.pendingSections ?? {}).length;
  if (session.status === "in_progress" || answered > 0 || pending > 0) return "in_progress";
  return "none";
}

export function getMockTestResumeStepIndex(testId: string): number {
  const session = loadMockSession(testId);
  if (!session) return 1;
  for (let i = 0; i < MOCK_TEST_STEPS.length; i++) {
    const key = MOCK_TEST_STEPS[i].key;
    if (!session.sections[key] && !session.pendingSections?.[key]) return i + 1;
  }
  return MOCK_TEST_STEPS.length;
}
