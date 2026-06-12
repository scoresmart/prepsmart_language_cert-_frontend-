import * as React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PracticeWorkspaceLayout } from "@/components/layout/PracticeWorkspaceLayout";
import { PracticeMyAttemptsSection } from "@/components/practice/PracticeMyAttemptsSection";
import { PracticeWorkspaceBar } from "@/components/practice/PracticeWorkspaceBar";
import { QuestionNavigatorPanel } from "@/components/practice/QuestionNavigatorPanel";
import { usePracticeAttempts, usePracticeQuestions } from "@/hooks/usePracticeQuestions";
import { parseQuestionIndex } from "@/lib/practiceNavigation";
import { getPartLabel, getSectionLabel } from "@/lib/practiceQuestions";
import {
  isPracticeModule,
  moduleUrl,
  slugToPart,
  workspaceUrl,
} from "@/lib/practiceRoutes";
import {
  ListeningSection,
  ReadingSection,
  WritingRunner,
} from "@/pages/PracticeSectionPage";

export function PracticeQuestionPage() {
  const { module = "", partSlug = "", questionIndex: indexParam } = useParams<{
    module: string;
    partSlug: string;
    questionIndex: string;
  }>();
  const navigate = useNavigate();
  const part = slugToPart(partSlug) ?? "";
  const questionIndex = parseQuestionIndex(indexParam);
  const [navOpen, setNavOpen] = React.useState(false);
  const [attemptKey, setAttemptKey] = React.useState(0);

  const { questions, total, isLoading, questionType } = usePracticeQuestions(module, part);
  const attemptsQ = usePracticeAttempts(questionType);
  const completedIds = React.useMemo(
    () => new Set((attemptsQ.data ?? []).map((a) => a.question_set_id)),
    [attemptsQ.data],
  );

  const practicedCount = questions.filter((q) => completedIds.has(q.id)).length;
  const pendingCount = questions.length - practicedCount;
  const currentQuestion = questions[questionIndex - 1];

  const clampedIndex = total > 0 ? Math.min(Math.max(1, questionIndex), total) : questionIndex;

  React.useEffect(() => {
    if (!isPracticeModule(module) || !part) return;
    if (total > 0 && questionIndex !== clampedIndex) {
      navigate(workspaceUrl(module, part, clampedIndex), { replace: true });
    }
  }, [total, questionIndex, clampedIndex, module, part, navigate]);

  const goTo = (index: number) => {
    setAttemptKey((k) => k + 1);
    navigate(workspaceUrl(module, part, index));
  };

  const handleAttemptSaved = React.useCallback(() => {
    void attemptsQ.refetch();
  }, [attemptsQ]);

  if (!isPracticeModule(module) || !part) {
    return <Navigate to="/practice" replace />;
  }

  if (module === "speaking") {
    return <Navigate to={moduleUrl(module)} replace />;
  }

  if (isLoading) {
    return (
      <PracticeWorkspaceLayout>
        <div className="flex flex-1 items-center justify-center gap-2 text-slate-400">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Loading question…</span>
        </div>
      </PracticeWorkspaceLayout>
    );
  }

  if (total === 0) {
    return <Navigate to={moduleUrl(module)} replace />;
  }

  const sectionLabel = getSectionLabel(module);
  const partLabel = getPartLabel(module, part);

  return (
    <PracticeWorkspaceLayout>
      <PracticeWorkspaceBar
        module={module}
        part={part}
        questionIndex={clampedIndex}
        totalQuestions={total}
        practicedCount={practicedCount}
        pendingCount={pendingCount}
        onOpenNavigator={() => setNavOpen(true)}
      />

      <QuestionNavigatorPanel
        open={navOpen}
        onClose={() => setNavOpen(false)}
        sectionLabel={sectionLabel}
        partLabel={partLabel}
        questions={questions}
        currentIndex={clampedIndex}
        completedIds={completedIds}
        onSelect={goTo}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {module === "listening" && (
            <ListeningSection
              part={part}
              questionIndex={clampedIndex}
              totalSets={total}
              attemptKey={attemptKey}
              onRetry={() => setAttemptKey((k) => k + 1)}
              onOpenNavigator={() => setNavOpen(true)}
              onPrevious={() => goTo(clampedIndex - 1)}
              onNext={() => goTo(clampedIndex + 1)}
              onAttemptSaved={handleAttemptSaved}
            />
          )}
          {module === "reading" && (
            <ReadingSection
              part={part}
              questionIndex={clampedIndex}
              totalSets={total}
              attemptKey={attemptKey}
              onRetry={() => setAttemptKey((k) => k + 1)}
              onOpenNavigator={() => setNavOpen(true)}
              onPrevious={() => goTo(clampedIndex - 1)}
              onNext={() => goTo(clampedIndex + 1)}
              onAttemptSaved={handleAttemptSaved}
            />
          )}
          {module === "writing" && (
            <WritingRunner
              part={part}
              questionIndex={clampedIndex}
              totalSets={total}
              attemptKey={attemptKey}
              onRetry={() => setAttemptKey((k) => k + 1)}
              setIndex={clampedIndex}
              onOpenNavigator={() => setNavOpen(true)}
              onPrevious={() => goTo(clampedIndex - 1)}
              onNext={() => goTo(clampedIndex + 1)}
              onAttemptSaved={handleAttemptSaved}
            />
          )}
        </div>

        <div className="max-h-[38vh] shrink-0 overflow-y-auto border-t border-slate-200 bg-slate-50 px-4 py-4 md:px-6">
          <PracticeMyAttemptsSection
            module={module}
            questions={questions}
            attempts={attemptsQ.data ?? []}
            currentQuestionId={currentQuestion?.id}
            onSelectQuestion={goTo}
          />
        </div>
      </div>
    </PracticeWorkspaceLayout>
  );
}
