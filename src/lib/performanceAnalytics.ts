import { eachDayOfInterval, format, isSameDay, startOfDay, subDays } from "date-fns";
import type { WeekPoint } from "@/components/dashboard/WeeklyPerformanceChart";

export type PerformanceModule = "speaking" | "writing" | "reading" | "listening";
export type PerformanceTab = "overview" | PerformanceModule;

export type PracticeAttemptRow = {
  id: string;
  question_type: string;
  question_set_id: string;
  score: number;
  total: number;
  score_details?: Record<string, unknown> | null;
  scoring_status?: string | null;
  created_at: string;
};

export type ModuleAnalytics = {
  totalAttempts: number;
  sevenDayAvg: number | null;
  todayAvg: number | null;
  highest: number | null;
  weekPoints: WeekPoint[];
  recentAttempts: PracticeAttemptRow[];
  criteria: { label: string; avg: number; max: number }[];
  practiced: number;
  totalQuestions: number;
};

export function moduleForQuestionType(questionType: string): PerformanceModule | null {
  if (/speaking/i.test(questionType)) return "speaking";
  if (/writing/i.test(questionType)) return "writing";
  if (/reading/i.test(questionType)) return "reading";
  if (/listening/i.test(questionType)) return "listening";
  return null;
}

export function attemptPercent(score: number, total: number): number | null {
  if (total <= 0) return null;
  return (Number(score) / Number(total)) * 100;
}

export function formatQuestionTypeLabel(questionType: string): string {
  return questionType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function filterByModule(attempts: PracticeAttemptRow[], module: PerformanceTab): PracticeAttemptRow[] {
  if (module === "overview") return attempts;
  return attempts.filter((a) => moduleForQuestionType(a.question_type) === module);
}

function buildWeekPoints(attempts: PracticeAttemptRow[]): WeekPoint[] {
  const today = startOfDay(new Date());
  const last7 = eachDayOfInterval({ start: subDays(today, 6), end: today });
  const scored = attempts.filter((a) => a.total > 0);

  return last7.map((day) => {
    const dayAttempts = scored.filter((a) => isSameDay(new Date(a.created_at), day));
    const avg =
      dayAttempts.length > 0
        ? dayAttempts.reduce((sum, a) => sum + (attemptPercent(a.score, a.total) ?? 0), 0) / dayAttempts.length
        : null;
    return { date: day, label: format(day, "EEE"), avg };
  });
}

function extractCriteria(attempts: PracticeAttemptRow[], module: PerformanceTab): ModuleAnalytics["criteria"] {
  const scored = filterByModule(attempts, module).filter(
    (a) => a.scoring_status === "completed" && a.score_details && typeof a.score_details === "object",
  );

  const sums = new Map<string, { total: number; count: number; max: number }>();

  for (const attempt of scored) {
    const details = attempt.score_details as Record<string, unknown>;
    const type = details.type as string | undefined;
    const scores = details.scores as Record<string, number> | undefined;
    if (!scores) continue;

    if (type === "writing" && (module === "writing" || module === "overview")) {
      for (const [key, label] of [
        ["taskFulfilment", "Task Fulfilment"],
        ["grammar", "Grammar"],
        ["vocabulary", "Vocabulary"],
        ["organisation", "Organisation"],
      ] as const) {
        const val = scores[key];
        if (typeof val !== "number") continue;
        const prev = sums.get(label) ?? { total: 0, count: 0, max: 3 };
        sums.set(label, { total: prev.total + val, count: prev.count + 1, max: 3 });
      }
    }

    if (type === "speaking" && (module === "speaking" || module === "overview")) {
      for (const [key, label] of [
        ["taskFulfilmentCoherence", "Task & Coherence"],
        ["grammar", "Grammar"],
        ["vocabulary", "Vocabulary"],
        ["pronunciationFluency", "Pronunciation & Fluency"],
      ] as const) {
        const val = scores[key];
        if (typeof val !== "number") continue;
        const prev = sums.get(label) ?? { total: 0, count: 0, max: 3 };
        sums.set(label, { total: prev.total + val, count: prev.count + 1, max: 3 });
      }
    }
  }

  return Array.from(sums.entries())
    .map(([label, { total, count, max }]) => ({
      label,
      avg: Math.round((total / count) * 10) / 10,
      max,
    }))
    .slice(0, module === "overview" ? 0 : 4);
}

export function computeModuleAnalytics(
  attempts: PracticeAttemptRow[],
  module: PerformanceTab,
  progress?: { practiced: number; total: number },
): ModuleAnalytics {
  const filtered = filterByModule(attempts, module);
  const scored = filtered.filter((a) => a.total > 0);
  const today = startOfDay(new Date());

  const todayScored = scored.filter((a) => isSameDay(new Date(a.created_at), today));
  const last7Scored = scored.filter((a) => new Date(a.created_at) >= subDays(today, 6));

  const avgPct = (rows: PracticeAttemptRow[]) => {
    if (!rows.length) return null;
    return rows.reduce((sum, a) => sum + (attemptPercent(a.score, a.total) ?? 0), 0) / rows.length;
  };

  const percentages = scored.map((a) => attemptPercent(a.score, a.total)).filter((v): v is number => v != null);

  return {
    totalAttempts: filtered.length,
    sevenDayAvg: avgPct(last7Scored),
    todayAvg: avgPct(todayScored),
    highest: percentages.length ? Math.max(...percentages) : null,
    weekPoints: buildWeekPoints(scored),
    recentAttempts: filtered.slice(0, 6),
    criteria: extractCriteria(attempts, module),
    practiced: progress?.practiced ?? 0,
    totalQuestions: progress?.total ?? 0,
  };
}
