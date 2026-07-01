import type { PracticeGrade } from "@/lib/scoringTypes";

export function extractReadAloudText(content: string | null | undefined): string | null {
  if (!content) return null;
  const match = content.match(/【Read aloud text】\s*([\s\S]*?)(?=【|$)/i);
  return match?.[1]?.trim() ?? null;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

export function compareTranscriptToReference(transcript: string, reference: string) {
  const refWords = reference.split(/\s+/).map(normalizeWord).filter(Boolean);
  const spokenWords = transcript.split(/\s+/).map(normalizeWord).filter(Boolean);
  const spokenSet = new Set(spokenWords);

  let matched = 0;
  for (const word of refWords) {
    if (spokenSet.has(word)) matched += 1;
  }

  const total = refWords.length;
  const percent = total > 0 ? (matched / total) * 100 : null;
  return { matched, total, percent };
}

export function scoreRingColor(ratio: number): string {
  if (ratio >= 0.75) return "#10b981";
  if (ratio >= 0.5) return "#f59e0b";
  return "#ef4444";
}

export function gradeStyles(grade: PracticeGrade) {
  if (grade === "High Pass") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (grade === "Pass") return "border-cyan-200 bg-cyan-50 text-cyan-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function criterionPercent(score: number, max = 3): number {
  return Math.round((Math.max(0, Math.min(score, max)) / max) * 100);
}
