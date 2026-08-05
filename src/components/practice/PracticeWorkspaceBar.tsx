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
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:max-w-7xl">
        <Link to="/dashboard" className="relative z-10 shrink-0 transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="PrepSmart LC" className="size-7 object-contain" />
        </Link>

        <nav className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 sm:gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Home className="size-4 shrink-0" />
            Home
          </Link>
          <LCPracticeDropdown triggerVariant="workspace" align="center" />
        </nav>

        <div className="relative z-10 ml-auto flex flex-wrap items-center justify-end gap-2">
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
