import type { CEFRLevel } from "@/lib/scoringTypes";
import type { RealtimeExamSummary, RealtimeTranscriptTurn } from "@/lib/realtimeExamClient";
import type { ExamSegment } from "@/lib/speakingExamSegments";

/**
 * Turns a finished live-examiner conversation into something the AI marker can
 * score.
 *
 * The marker only ever sees text — it never hears the audio — so the examiner's
 * own questions have to travel with the answers, otherwise "on task" is
 * unjudgeable.
 */

export const REALTIME_PART_LABEL: Record<number, string> = {
  1: "Interview",
  2: "Role play",
  3: "Picture",
  4: "Topic talk",
};

const VALID_LEVELS: readonly string[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** The backend rejects anything outside the CEFR set, so clamp before sending. */
export function examScoringLevel(raw?: string | null): CEFRLevel {
  const up = (raw ?? "").trim().toUpperCase();
  return VALID_LEVELS.includes(up) ? (up as CEFRLevel) : "B1";
}

export function candidateTurns(turns: RealtimeTranscriptTurn[]): RealtimeTranscriptTurn[] {
  return turns.filter((t) => t.role === "candidate" && t.text.trim());
}

export function candidateTranscript(turns: RealtimeTranscriptTurn[]): string {
  return candidateTurns(turns)
    .map((t) => t.text.trim())
    .join("\n");
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Below this there is nothing worth marking — scoring silence wastes a call. */
export const MIN_SCOREABLE_WORDS = 12;

/** Keep the brief well inside the marker's context budget. */
const MAX_QUESTIONS_IN_BRIEF = 24;
const MAX_QUESTION_CHARS = 220;

export function examTaskDescription(opts: {
  setTitle?: string | null;
  level: CEFRLevel;
  turns: RealtimeTranscriptTurn[];
}): string {
  const asked = opts.turns
    .filter((t) => t.role === "examiner" && t.text.trim())
    .slice(0, MAX_QUESTIONS_IN_BRIEF)
    .map((t, i) => {
      const text = t.text.trim();
      const clipped =
        text.length > MAX_QUESTION_CHARS ? `${text.slice(0, MAX_QUESTION_CHARS)}…` : text;
      return `${i + 1}. ${clipped}`;
    })
    .join("\n");

  return [
    `LanguageCert Academic Speaking — full four-part live examiner test${
      opts.setTitle ? ` (${opts.setTitle})` : ""
    }, target level ${opts.level}.`,
    "Part 1 is personal interview questions, Part 2 a role play, Part 3 describing a picture, Part 4 a short prepared talk with follow-up questions.",
    "Mark the candidate's replies as one continuous test rather than as isolated answers.",
    asked ? `Examiner questions asked:\n${asked}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export type PartBreakdown = {
  part: number;
  label: string;
  reached: boolean;
  answers: number;
  words: number;
};

/**
 * Per-part activity, resolved by mapping each transcript turn back to the
 * segment it belongs to. Falls back to `partsReached` when the segment list
 * isn't available (a recovered draft, for instance).
 */
export function partBreakdown(
  turns: RealtimeTranscriptTurn[],
  segments: ExamSegment[] = [],
  summary?: RealtimeExamSummary | null,
): PartBreakdown[] {
  const reachedFromSummary = new Set(summary?.partsReached ?? []);
  const tally = new Map<number, { answers: number; words: number }>();

  for (const turn of candidateTurns(turns)) {
    const part = segments[turn.segmentIndex]?.part;
    if (!part) continue;
    const row = tally.get(part) ?? { answers: 0, words: 0 };
    row.answers += 1;
    row.words += wordCount(turn.text);
    tally.set(part, row);
  }

  return [1, 2, 3, 4].map((part) => {
    const row = tally.get(part);
    return {
      part,
      label: REALTIME_PART_LABEL[part] ?? `Part ${part}`,
      reached: Boolean(row) || reachedFromSummary.has(part),
      answers: row?.answers ?? 0,
      words: row?.words ?? 0,
    };
  });
}

export function formatExamClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
