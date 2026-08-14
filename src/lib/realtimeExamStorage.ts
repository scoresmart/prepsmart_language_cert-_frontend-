import type { RealtimeExamSummary, RealtimeTranscriptTurn } from "@/lib/realtimeExamClient";

/**
 * Client-side auto-save for realtime speaking exams.
 *
 * The bridge writes the authoritative transcript to disk, but the browser keeps
 * its own running copy so a refresh mid-exam does not look like lost work to the
 * candidate.
 */

export type RealtimeExamDraft = {
  sessionId: string | null;
  setId: string | null;
  setTitle: string | null;
  level: string | null;
  updatedAt: string;
  transcript: RealtimeTranscriptTurn[];
};

export type RealtimeExamRecord = RealtimeExamDraft & {
  summary: RealtimeExamSummary | null;
  endReason: string | null;
  completedAt: string;
};

const draftKey = (key: string) => `realtime-exam-draft:${key}`;
const recordKey = (key: string) => `realtime-exam-result:${key}`;

export function saveRealtimeExamDraft(key: string, draft: RealtimeExamDraft) {
  try {
    sessionStorage.setItem(draftKey(key), JSON.stringify(draft));
  } catch {
    /* quota or private mode — the bridge copy is authoritative anyway */
  }
}

export function loadRealtimeExamDraft(key: string): RealtimeExamDraft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RealtimeExamDraft;
    return Array.isArray(parsed?.transcript) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearRealtimeExamDraft(key: string) {
  try {
    sessionStorage.removeItem(draftKey(key));
  } catch {
    /* noop */
  }
}

export function saveRealtimeExamResult(key: string, record: RealtimeExamRecord) {
  try {
    sessionStorage.setItem(recordKey(key), JSON.stringify(record));
    sessionStorage.removeItem(draftKey(key));
  } catch {
    /* noop */
  }
}

export function loadRealtimeExamResult(key: string): RealtimeExamRecord | null {
  try {
    const raw = sessionStorage.getItem(recordKey(key));
    return raw ? (JSON.parse(raw) as RealtimeExamRecord) : null;
  } catch {
    return null;
  }
}
