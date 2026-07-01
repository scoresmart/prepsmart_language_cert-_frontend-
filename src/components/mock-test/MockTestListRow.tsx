import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Clock, Play } from "lucide-react";
import type { MockTest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatMockTestDuration,
  getMockTestAttemptStatus,
  getMockTestDifficulty,
  getMockTestDurationMinutes,
  getMockTestQuestionCount,
  getMockTestResumeStepIndex,
  inferMockTestKind,
  type MockTestAttemptStatus,
  type MockTestDifficulty,
} from "@/lib/mockTestCatalogMeta";
import { initMockSession } from "@/lib/mockTestSessionStorage";
import { mockTestIntroUrl, mockTestResultsUrl, mockTestStepUrl } from "@/lib/mockTestRoutes";

function DifficultyBadge({ level }: { level: MockTestDifficulty }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        level === "Hard" && "bg-rose-500/90 text-white",
        level === "Medium" && "bg-amber-400 text-amber-950",
        level === "Easy" && "bg-emerald-500/90 text-white",
      )}
    >
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: MockTestAttemptStatus }) {
  if (status === "none") return null;
  if (status === "attempted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[11px] font-bold text-white">
        <CheckCircle2 className="size-3" />
        Attempted
      </span>
    );
  }
  return (
    <span className="rounded-md bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">
      In Progress
    </span>
  );
}

type RowProps = {
  test: MockTest;
  index: number;
  showDivider?: boolean;
};

export function MockTestListRow({ test, index, showDivider = true }: RowProps) {
  const kind = inferMockTestKind(test.title);
  const difficulty = getMockTestDifficulty(test, index);
  const status = getMockTestAttemptStatus(test.id);
  const duration = formatMockTestDuration(getMockTestDurationMinutes(kind));
  const questionCount = getMockTestQuestionCount(kind);
  const isResume = status === "in_progress";

  const actionUrl = isResume
    ? mockTestStepUrl(test.id, getMockTestResumeStepIndex(test.id))
    : mockTestIntroUrl(test.id);

  const handleAction = () => {
    initMockSession(test.id, test.title);
  };

  return (
    <li className={cn(showDivider && "border-b border-white/10 last:border-0")}>
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-white sm:text-lg">{test.title}</h3>
            <DifficultyBadge level={difficulty} />
            <StatusBadge status={status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              {duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5 shrink-0" />
              {questionCount} Questions
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <Button
            asChild
            className="h-10 min-w-[7.5rem] gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-md hover:bg-blue-500"
          >
            <Link to={actionUrl} onClick={handleAction}>
              <Play className="size-4 fill-current" />
              {isResume ? "Resume" : "Start"}
            </Link>
          </Button>
        </div>
      </div>
    </li>
  );
}

type ResultsRowProps = {
  testId: string;
  title: string;
  status: MockTestAttemptStatus;
  dateLabel: string;
};

export function MockTestResultsListRow({ testId, title, status, dateLabel }: ResultsRowProps) {
  return (
    <li className="border-b border-white/10 last:border-0">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{title}</h3>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-xs text-white/45">{dateLabel}</p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-white/20 bg-transparent text-white hover:bg-white/10"
        >
          <Link to={mockTestResultsUrl(testId)}>View results</Link>
        </Button>
      </div>
    </li>
  );
}
