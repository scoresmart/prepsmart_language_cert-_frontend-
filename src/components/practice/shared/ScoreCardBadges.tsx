import { cn } from "@/lib/utils";
import type { CEFRLevel, PracticeGrade } from "@/lib/scoringTypes";
import { gradeStyles } from "@/lib/speakingScoreUtils";

function cefrLevelStyles(level: CEFRLevel) {
  const map: Record<CEFRLevel, string> = {
    A1: "border-slate-500 bg-white text-slate-900 ring-slate-200",
    A2: "border-emerald-500 bg-emerald-50 text-emerald-950 ring-emerald-200",
    B1: "border-cyan-500 bg-cyan-50 text-cyan-950 ring-cyan-200",
    B2: "border-indigo-500 bg-indigo-50 text-indigo-950 ring-indigo-200",
    C1: "border-violet-500 bg-violet-50 text-violet-950 ring-violet-200",
    C2: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-950 ring-fuchsia-200",
  };
  return map[level];
}

export function CefrLevelBadge({ level }: { level: CEFRLevel }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "flex size-[4.5rem] items-center justify-center rounded-full border-[3px] ring-4 shadow-lg sm:size-20",
          cefrLevelStyles(level),
        )}
        aria-label={`CEFR level ${level}`}
      >
        <span className="text-2xl font-black tracking-tight sm:text-3xl">{level}</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">Scored at</p>
    </div>
  );
}

export function GradeBadge({ grade, className }: { grade: PracticeGrade; className?: string }) {
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", gradeStyles(grade), className)}>
      {grade}
    </span>
  );
}
