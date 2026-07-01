import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { LCPracticeDropdown } from "@/components/layout/LCPracticeDropdown";
import { difficultyLabel } from "@/lib/practiceNavigation";
import { Badge } from "@/components/ui/badge";

type Props = {
  questionIndex: number;
  totalQuestions: number;
  practicedCount: number;
  pendingCount: number;
};

export function PracticeWorkspaceBar({
  questionIndex,
  totalQuestions,
  practicedCount,
  pendingCount,
}: Props) {
  const difficulty = difficultyLabel(questionIndex);

  return (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <LCPracticeDropdown triggerVariant="workspace" align="left" />
          <span className="text-slate-300">|</span>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Home className="size-4 shrink-0" />
            Home
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">
            Question {questionIndex}
            <span className="font-normal text-slate-400"> / {totalQuestions}</span>
          </span>
          <Badge variant="outline" className="text-xs capitalize">
            {difficulty}
          </Badge>
          <span className="hidden text-xs text-slate-500 sm:inline">
            <span className="font-medium text-emerald-600">{practicedCount} practiced</span>
            {" · "}
            <span className="font-medium text-amber-600">{pendingCount} pending</span>
          </span>
        </div>
      </div>
    </header>
  );
}
