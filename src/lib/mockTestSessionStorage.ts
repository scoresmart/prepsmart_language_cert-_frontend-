import type { MockPendingSection } from "@/lib/mockTestPendingTypes";

export type MockSectionScore = {
  score: number;
  total: number;
  questionType: string;
};

export type MockTestSession = {
  testId: string;
  testTitle: string;
  startedAt: string;
  sections: Record<string, MockSectionScore>;
  pendingSections?: Record<string, MockPendingSection>;
  status?: "in_progress" | "scoring" | "completed";
  scoredAt?: string;
};

function storageKey(testId: string) {
  return `prepsmart-lc-mock-session-${testId}`;
}

export function loadMockSession(testId: string): MockTestSession | null {
  try {
    const raw = sessionStorage.getItem(storageKey(testId));
    if (!raw) return null;
    return JSON.parse(raw) as MockTestSession;
  } catch {
    return null;
  }
}

export function listAllMockSessions(): MockTestSession[] {
  const sessions: MockTestSession[] = [];
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith("prepsmart-lc-mock-session-")) continue;
      const testId = key.slice("prepsmart-lc-mock-session-".length);
      const session = loadMockSession(testId);
      if (session) sessions.push(session);
    }
  } catch {
    return sessions;
  }
  return sessions.sort(
    (a, b) => new Date(b.scoredAt ?? b.startedAt).getTime() - new Date(a.scoredAt ?? a.startedAt).getTime(),
  );
}

export function saveMockSession(session: MockTestSession) {
  sessionStorage.setItem(storageKey(session.testId), JSON.stringify(session));
}

export function initMockSession(testId: string, testTitle: string): MockTestSession {
  const existing = loadMockSession(testId);
  if (existing) return existing;
  const session: MockTestSession = {
    testId,
    testTitle,
    startedAt: new Date().toISOString(),
    sections: {},
    pendingSections: {},
    status: "in_progress",
  };
  saveMockSession(session);
  return session;
}

export function recordMockPendingSection(
  testId: string,
  sectionKey: string,
  pending: MockPendingSection,
) {
  const session = loadMockSession(testId);
  if (!session) return;
  if (!session.pendingSections) session.pendingSections = {};
  session.pendingSections[sectionKey] = pending;
  saveMockSession(session);
}

export function recordMockSectionScore(
  testId: string,
  sectionKey: string,
  questionType: string,
  score: number,
  total: number,
) {
  const session = loadMockSession(testId);
  if (!session) return;
  session.sections[sectionKey] = { score, total, questionType };
  saveMockSession(session);
}

export function sumSectionScores(
  session: MockTestSession | null,
  keys: string[],
): { score: number; total: number } {
  if (!session) return { score: 0, total: 0 };
  return keys.reduce(
    (acc, key) => {
      const row = session.sections[key];
      if (!row) return acc;
      return { score: acc.score + row.score, total: acc.total + row.total };
    },
    { score: 0, total: 0 },
  );
}

export function sumAllMockScores(session: MockTestSession | null): { score: number; total: number } {
  if (!session) return { score: 0, total: 0 };
  return Object.values(session.sections).reduce(
    (acc, row) => ({ score: acc.score + row.score, total: acc.total + row.total }),
    { score: 0, total: 0 },
  );
}
