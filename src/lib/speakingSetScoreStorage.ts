import type { SpeakingScoreResult } from "@/lib/scoringTypes";
import type { SpeakingPromptKind } from "@/lib/speakingSetStructure";

export type SpeakingSetPromptScoreEntry = {
  promptKey: string;
  partNumber: number;
  promptLabel: string;
  promptKind: SpeakingPromptKind;
  title: string;
  instruction: string;
  score: SpeakingScoreResult | null;
  error?: string | null;
  recordingUrl?: string | null;
  referenceText?: string | null;
};

const storageKey = (setId: string) => `speaking-set-scores:${setId}`;

export function loadSpeakingSetScores(setId: string): SpeakingSetPromptScoreEntry[] {
  try {
    const raw = sessionStorage.getItem(storageKey(setId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SpeakingSetPromptScoreEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSpeakingSetPromptScore(setId: string, entry: SpeakingSetPromptScoreEntry) {
  const existing = loadSpeakingSetScores(setId).filter((e) => e.promptKey !== entry.promptKey);
  existing.push(entry);
  existing.sort((a, b) => a.partNumber - b.partNumber || a.promptLabel.localeCompare(b.promptLabel));
  sessionStorage.setItem(storageKey(setId), JSON.stringify(existing));
  return existing;
}

export function clearSpeakingSetScores(setId: string) {
  sessionStorage.removeItem(storageKey(setId));
}

export function averageScaledScore(entries: SpeakingSetPromptScoreEntry[]): number | null {
  const scored = entries.filter((e) => e.score);
  if (!scored.length) return null;
  const sum = scored.reduce((acc, e) => acc + (e.score?.scores.scaledTotal ?? 0), 0);
  return Math.round(sum / scored.length);
}

export function kindInstruction(kind: SpeakingPromptKind): string {
  switch (kind) {
    case "question":
      return "Part 1 interview question — scored on clarity, grammar, vocabulary, and relevance.";
    case "role_play":
      return "Part 2 role play — scored on natural conversation, politeness, and task completion.";
    case "read_aloud":
      return "Part 3 read aloud — scored on pronunciation, fluency, and accuracy vs the text.";
    case "follow_up":
      return "Follow-up question — scored on how fully and clearly you answered.";
    case "presentation":
      return "Part 4 presentation — scored on organisation, content, grammar, and fluency.";
    default:
      return "Speaking response — scored on LanguageCert Academic criteria.";
  }
}
