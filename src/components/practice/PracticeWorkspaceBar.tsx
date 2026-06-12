import { Link } from "react-router-dom";
import { ArrowLeft, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPartLabel, getSectionLabel } from "@/lib/practiceQuestions";
import { moduleUrl } from "@/lib/practiceRoutes";
import { difficultyLabel } from "@/lib/practiceNavigation";
import { Badge } from "@/components/ui/badge";
type Props = {
  module: string;
  part: string;
  questionIndex: number;
  totalQuestions: number;
  practicedCount: number;
  pendingCount: number;
  onOpenNavigator: () => void;
};

export function PracticeWorkspaceBar({
  module,
  part,
  questionIndex,
  totalQuestions,
  practicedCount,
  pendingCount,
  onOpenNavigator,
}: Props) {
  const difficulty = difficultyLabel(questionIndex);

  return (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={moduleUrl(module)}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="size-4" />
            {getSectionLabel(module)}
          </Link>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <span className="text-sm font-medium text-slate-700">{getPartLabel(module, part)}</span>
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
          <Button
            type="button"
            size="sm"
            onClick={onOpenNavigator}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <LayoutList className="size-4" />
            Question Navigator
          </Button>
        </div>
      </div>
    </header>
  );
}
