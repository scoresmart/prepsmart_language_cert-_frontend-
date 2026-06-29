import type { CEFRLevel } from "@/lib/scoringTypes";

const VALID: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Map question labels (Easy/Medium/Hard) and CEFR strings to a valid scoring level. */
export function normalizeCefrLevel(level?: string | null, fallback: CEFRLevel = "B1"): CEFRLevel {
  const raw = (level ?? "").trim().toUpperCase();
  if (VALID.includes(raw as CEFRLevel)) return raw as CEFRLevel;

  const lower = (level ?? "").trim().toLowerCase();
  if (lower.includes("easy") || lower.includes("beginner")) return "A2";
  if (lower.includes("medium") || lower.includes("intermediate")) return "B1";
  if (lower.includes("hard") || lower.includes("advanced")) return "B2";

  return fallback;
}
