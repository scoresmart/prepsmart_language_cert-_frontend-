/**
 * LanguageCert Academic Speaking format (~14 minutes, 4 parts, B1–C2).
 * Conducted with an interlocutor; tests spoken English in academic and study-related situations.
 *
 * Scoring: 4 criteria × 0–3 = 12 raw marks → scaled to 0–50
 */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const SPEAKING_SCALED_MAX_SCORE = 50;

export const SPEAKING_EXAM_OVERVIEW =
  "LanguageCert Academic Speaking takes about 14 minutes and has 4 parts. An interlocutor tests how well you speak in academic and everyday study-related situations (B1–C2).";

export const SPEAKING_CRITERIA = [
  "Task Fulfilment & Coherence",
  "Accuracy & Range of Grammar",
  "Accuracy & Range of Vocabulary",
  "Pronunciation, Intonation & Fluency",
] as const;

export const SPEAKING_PARTS = [
  { part: "1", label: "Speaking Part 1" },
  { part: "2", label: "Speaking Part 2" },
  { part: "3", label: "Speaking Part 3" },
  { part: "4", label: "Speaking Part 4" },
] as const;

/** Official LanguageCert Academic part titles */
export const SPEAKING_PART_TITLES: Record<string, string> = {
  "1": "Questions",
  "2": "Role Play",
  "3": "Read Aloud",
  "4": "Presentation",
};

/** Short badges shown on attempt cards (e.g. RA for Read Aloud). */
export const SPEAKING_PART_ABBREV: Record<string, string> = {
  "1": "Q",
  "2": "RP",
  "3": "RA",
  "4": "PR",
};

export function speakingPartFromQuestionType(questionType: string): string | null {
  const match = /speaking_part_(\d+)/i.exec(questionType);
  return match?.[1] ?? null;
}

/** Task focus per part — LanguageCert Academic */
export const SPEAKING_PART_FOCUS: Record<string, string> = {
  "1":
    "Give or spell your name, say your country, then answer up to 5 questions. Use 2–3 sentences per answer (direct answer + reason or example).",
  "2":
    "Complete 2 academic-related role plays. Respond naturally and initiate interaction — greet, explain, request, and ask follow-up questions.",
  "3":
    "Prepare for 30 seconds, read a short academic text aloud clearly (pause at punctuation), then answer follow-up questions (opinion + reason + example).",
  "4":
    "Prepare for 1 minute, give a presentation for up to 2 minutes on an academic topic (introduction → 2 points with examples → conclusion), then answer follow-up questions.",
};

/** Part 4 presentation recording duration by CEFR level */
const PART4_RECORD_SECONDS: Record<CefrLevel, number> = {
  A1: 60,
  A2: 90,
  B1: 120,
  B2: 120,
  C1: 150,
  C2: 180,
};

/** Official Academic prep/record timings per part */
const PART_PREP_RECORD: Record<string, { prep: number; record: number | ((cefr: CefrLevel) => number) }> = {
  "1": { prep: 5, record: 60 },
  "2": { prep: 10, record: 120 },
  "3": { prep: 30, record: 120 },
  "4": { prep: 60, record: (cefr) => PART4_RECORD_SECONDS[cefr] },
};

export function normalizeCefrLevel(level?: string | null): CefrLevel {
  const upper = (level ?? "B1").trim().toUpperCase();
  if (upper === "A1" || upper === "A2" || upper === "B1" || upper === "B2" || upper === "C1" || upper === "C2") {
    return upper;
  }
  return "B1";
}

export function getSpeakingPartTiming(part: string, level?: string | null) {
  const cefr = normalizeCefrLevel(level);
  const base = PART_PREP_RECORD[part] ?? PART_PREP_RECORD["1"];
  const recordSeconds =
    typeof base.record === "function" ? base.record(cefr) : base.record;
  return { prepSeconds: base.prep, recordSeconds, level: cefr };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (rem === 0) return `${mins} minute${mins === 1 ? "" : "s"}`;
  return `${mins} min ${rem}s`;
}

export function getSpeakingInstruction(part: string, level?: string | null): string {
  const { prepSeconds, recordSeconds } = getSpeakingPartTiming(part, level);
  const focus = SPEAKING_PART_FOCUS[part] ?? SPEAKING_PART_FOCUS["1"];
  return `${focus} Listen to the examiner, prepare for ${formatDuration(prepSeconds)}, then record (up to ${formatDuration(recordSeconds)}).`;
}

export const SPEAKING_INSTRUCTIONS: Record<string, string> = {
  "1": getSpeakingInstruction("1"),
  "2": getSpeakingInstruction("2"),
  "3": getSpeakingInstruction("3"),
  "4": getSpeakingInstruction("4", "B2"),
};

/** @deprecated Use getSpeakingPartTiming(part, level) */
export const SPEAKING_PREP_SECONDS = 5;

/** @deprecated Use getSpeakingPartTiming(part, level) */
export const SPEAKING_RECORD_SECONDS = 60;
