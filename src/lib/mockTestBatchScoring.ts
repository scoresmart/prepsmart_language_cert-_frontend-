import { api } from "@/lib/api";
import { getLocalRecordingBlob } from "@/lib/practiceAttemptStorage";
import { convertBlobToWav16kMono } from "@/lib/convertRecordingToWav";
import { normalizeCefrLevel } from "@/lib/normalizeCefrLevel";
import { DEFAULT_WRITING_LEVEL } from "@/lib/scoringTypes";
import {
  loadMockSession,
  recordMockSectionScore,
  saveMockSession,
  type MockTestSession,
} from "@/lib/mockTestSessionStorage";
import type { MockPendingSection } from "@/lib/mockTestPendingTypes";

const LABELS = ["A", "B", "C", "D", "E", "F"];

function scoreMcq(pending: Extract<MockPendingSection, { kind: "mcq" }>): { score: number; total: number } {
  const total = pending.items.length;
  if (pending.labelMode === "index") {
    const score = pending.items.filter((item, i) => {
      const ans = pending.answers[i];
      const expected = pending.labelLetters?.[Number(item.correctAnswer)] ?? LABELS[Number(item.correctAnswer)];
      return ans === expected;
    }).length;
    return { score, total };
  }
  const score = pending.items.filter((item, i) => pending.answers[i] === String(item.correctAnswer)).length;
  return { score, total };
}

function scoreGapFill(pending: Extract<MockPendingSection, { kind: "gap_fill" }>): { score: number; total: number } {
  const total = pending.correctAnswers.length;
  const score = pending.correctAnswers.filter(
    (ans, i) => (pending.inputs[i] ?? "").trim().toLowerCase() === ans.trim().toLowerCase(),
  ).length;
  return { score, total };
}

function scoreMapping(pending: Extract<MockPendingSection, { kind: "mapping" }>): { score: number; total: number } {
  const gaps = Object.keys(pending.correctMapping);
  const score = gaps.filter((g) => pending.selections[g] === pending.correctMapping[g]).length;
  return { score, total: gaps.length };
}

function scoreStatementMatch(
  pending: Extract<MockPendingSection, { kind: "statement_match" }>,
): { score: number; total: number } {
  const total = pending.statements.length;
  const score = pending.statements.filter((s, i) => pending.answers[i] === s.correctAnswer).length;
  return { score, total };
}

async function persistAttempt(body: {
  question_type: string;
  question_set_id: string;
  score: number;
  total: number;
}): Promise<string | null> {
  try {
    const res = await api.practice.saveAttempt(body);
    return res.data?.id ?? null;
  } catch {
    return null;
  }
}

async function scorePendingSection(
  _sectionKey: string,
  pending: MockPendingSection,
): Promise<{ score: number; total: number }> {
  switch (pending.kind) {
    case "mcq":
      return scoreMcq(pending);
    case "gap_fill":
      return scoreGapFill(pending);
    case "mapping":
      return scoreMapping(pending);
    case "statement_match":
      return scoreStatementMatch(pending);
    case "writing": {
      const attemptId = await persistAttempt({
        question_type: pending.questionType,
        question_set_id: pending.questionSetId,
        score: 0,
        total: 12,
      });
      const res = await api.scoring.writing({
        question_text: pending.questionText,
        candidate_response: pending.text,
        level: DEFAULT_WRITING_LEVEL,
        task_type: pending.taskType,
        attempt_id: attemptId ?? undefined,
      });
      const scaled = Math.round((res.data.scores.total / 12) * 25);
      return { score: scaled, total: 25 };
    }
    case "speaking": {
      const blob = await getLocalRecordingBlob(pending.recordingQuestionId);
      if (!blob || blob.size === 0) {
        return { score: 0, total: 50 };
      }
      const uploadBlob = await convertBlobToWav16kMono(blob);
      const attemptId = await persistAttempt({
        question_type: pending.questionType,
        question_set_id: pending.questionSetId,
        score: 0,
        total: 50,
      });
      const formData = new FormData();
      formData.append("audio", uploadBlob, "recording.wav");
      formData.append("level", normalizeCefrLevel(pending.level));
      formData.append("task_description", `${pending.title}\n\n${pending.content}`);
      if (attemptId) formData.append("attempt_id", attemptId);
      const res = await api.scoring.speakingAudio(formData);
      return { score: res.data.scores.scaledTotal, total: 50 };
    }
    default:
      return { score: 0, total: 0 };
  }
}

export type MockBatchScoringProgress = {
  current: number;
  total: number;
  sectionLabel: string;
};

/** Score all pending sections and write results to session storage. */
export async function runBatchMockTestScoring(
  testId: string,
  onProgress?: (progress: MockBatchScoringProgress) => void,
): Promise<MockTestSession> {
  const session = loadMockSession(testId);
  if (!session) {
    throw new Error("Mock test session not found.");
  }

  session.status = "scoring";
  saveMockSession(session);

  const entries = Object.entries(session.pendingSections ?? {});
  const total = entries.length;

  for (let i = 0; i < entries.length; i++) {
    const [sectionKey, pending] = entries[i];
    onProgress?.({ current: i + 1, total, sectionLabel: sectionKey });

    const { score, total: sectionTotal } = await scorePendingSection(sectionKey, pending);
    recordMockSectionScore(testId, sectionKey, pending.questionType, score, sectionTotal);
  }

  const updated = loadMockSession(testId)!;
  updated.status = "completed";
  updated.scoredAt = new Date().toISOString();
  saveMockSession(updated);
  return updated;
}
