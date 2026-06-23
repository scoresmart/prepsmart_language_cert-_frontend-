/**
 * LanguageCert International ESOL (IESOL) speaking format.
 * Sourced from scoring.env / official "Assessing Speaking Performance" handbook.
 *
 * Scoring: 4 criteria × 0–3 = 12 raw marks → scaled to 0–50
 * Pass 25–37 | High Pass 38–50
 */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const SPEAKING_SCALED_MAX_SCORE = 50;

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

/** Official part titles (Table 1 — IESOL exam structure) */
export const SPEAKING_PART_TITLES: Record<string, string> = {
  "1": "Personal Information",
  "2": "Situational Role Plays",
  "3": "Exchanging Information & Discussion",
  "4": "Long Turn",
};

/** Task focus per part (Table 2 — exam format) */
export const SPEAKING_PART_FOCUS: Record<string, string> = {
  "1":
    "Communicate personal information and opinions. Spell your name, give your country of origin, and answer up to five questions on familiar topics.",
  "2":
    "Respond appropriately in real-life situations using functional language. Two or three situations are presented — respond to and initiate interactions.",
  "3":
    "Co-operate to reach agreement or discuss a topic. At B1/B2: hold a short discussion to plan, arrange, or decide using a written prompt.",
  "4":
    "Present a connected spoken response on a topic. After preparation time, talk about the examiner's topic, then answer follow-up questions.",
};

/** Part 4 long-turn recording duration by CEFR level (official handbook) */
const PART4_RECORD_SECONDS: Record<CefrLevel, number> = {
  A1: 30,
  A2: 60,
  B1: 90,
  B2: 120,
  C1: 120,
  C2: 180,
};

/** Practice recording limits for Parts 1–3 (interactive tasks simulated as single response) */
const PART_PREP_RECORD: Record<string, { prep: number; record: number }> = {
  "1": { prep: 5, record: 45 },
  "2": { prep: 5, record: 90 },
  "3": { prep: 5, record: 120 },
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
  if (part === "4") {
    return { prepSeconds: 30, recordSeconds: PART4_RECORD_SECONDS[cefr], level: cefr };
  }
  const base = PART_PREP_RECORD[part] ?? PART_PREP_RECORD["1"];
  return { prepSeconds: base.prep, recordSeconds: base.record, level: cefr };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (rem === 0) return `${mins} minute${mins === 1 ? "" : "s"}`;
  return `${mins} min ${rem}s`;
}

export function getSpeakingInstruction(part: string, level?: string | null): string {
  const { prepSeconds, recordSeconds, level: cefr } = getSpeakingPartTiming(part, level);
  const focus = SPEAKING_PART_FOCUS[part] ?? SPEAKING_PART_FOCUS["1"];

  if (part === "4") {
    return `${focus} Listen to the examiner, prepare for ${prepSeconds} seconds, then record your long turn (up to ${formatDuration(recordSeconds)} at ${cefr} level).`;
  }

  return `${focus} Listen to the examiner, prepare for ${prepSeconds} seconds, then record your response (up to ${formatDuration(recordSeconds)}).`;
}

/** Static fallback when question level is unknown */
export const SPEAKING_INSTRUCTIONS: Record<string, string> = {
  "1": getSpeakingInstruction("1"),
  "2": getSpeakingInstruction("2"),
  "3": getSpeakingInstruction("3"),
  "4": getSpeakingInstruction("4", "B2"),
};

/** @deprecated Use getSpeakingPartTiming(part, level) */
export const SPEAKING_PREP_SECONDS = 5;

/** @deprecated Use getSpeakingPartTiming(part, level) */
export const SPEAKING_RECORD_SECONDS = 45;
