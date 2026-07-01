import type { PracticeGrade } from "@/lib/scoringTypes";

export type ObjectiveResultItem = {
  label: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

export type ObjectiveScoreResult = {
  score: number;
  total: number;
  percentage: number;
  grade: PracticeGrade;
  unitLabel: string;
  items: ObjectiveResultItem[];
};

export function objectiveGrade(score: number, total: number): PracticeGrade {
  if (total <= 0) return "Below Pass";
  const pct = (score / total) * 100;
  if (pct >= 75) return "High Pass";
  if (pct >= 50) return "Pass";
  return "Below Pass";
}

export function buildObjectiveResult(
  items: ObjectiveResultItem[],
  unitLabel: string,
): ObjectiveScoreResult {
  const score = items.filter((item) => item.isCorrect).length;
  const total = items.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return {
    score,
    total,
    percentage,
    grade: objectiveGrade(score, total),
    unitLabel,
    items,
  };
}
