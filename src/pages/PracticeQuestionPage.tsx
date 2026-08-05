import * as React from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PracticeWorkspaceLayout } from "@/components/layout/PracticeWorkspaceLayout";
import { PracticeMyAttemptsSection } from "@/components/practice/PracticeMyAttemptsSection";
import { PracticeNavigatorTab } from "@/components/practice/PracticeNavigatorTab";
import { SpeakingPracticeProvider } from "@/components/practice/speaking/SpeakingPracticeContext";
import { PracticeWorkspaceBar } from "@/components/practice/PracticeWorkspaceBar";
import { QuestionNavigatorPanel } from "@/components/practice/QuestionNavigatorPanel";
import { usePracticeAttempts, usePracticeQuestions } from "@/hooks/usePracticeQuestions";
import { parseQuestionIndex, practiceQuestionFrameClass } from "@/lib/practiceNavigation";
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
import { SpeakingSection } from "@/pages/SpeakingSection";

export function PracticeQuestionPage() {
  const { module = "", partSlug = "", questionIndex: indexParam } = useParams<{
    module: string;
    partSlug: string;
    questionIndex: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const part = slugToPart(partSlug) ?? "";
  const questionIndex = parseQuestionIndex(indexParam);
  const [navOpen, setNavOpen] = React.useState(false);
  const [attemptKey, setAttemptKey] = React.useState(0);

  const { questions, total, isLoading, isError, error, needsSignIn, refetch, questionType } = usePracticeQuestions(module, part);
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
    const state = location.state as { openNavigator?: boolean } | null;
    if (state?.openNavigator) {
      setNavOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

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

  if (needsSignIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "Request failed";
    const isAuthError = /authentication|sign in|expired token|invalid or expired/i.test(message);

    return (
      <PracticeWorkspaceLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-lg font-semibold text-slate-800">Could not load questions</p>
          <p className="max-w-md text-sm text-slate-500">
            {isAuthError
              ? "Your session has expired or you are not signed in. Please sign in again to load practice questions."
              : message.includes("Network error")
                ? message
                : "Ensure the backend is running on port 5000, then try again."}
          </p>
          {isAuthError ? (
            <Link to="/login" state={{ from: location.pathname }} className="text-sm font-medium text-violet-700 hover:text-violet-900">
              Sign in
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
            >
              Retry
            </button>
          )}
        </div>
      </PracticeWorkspaceLayout>
    );
  }

  if (total === 0) {
    return (
      <PracticeWorkspaceLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-lg font-semibold text-slate-800">
            No {getSectionLabel(module).toLowerCase()} questions yet
          </p>
          <p className="max-w-md text-sm text-slate-500">
            {module === "speaking"
              ? `Add and publish speaking questions for Part ${part} in Admin → Speaking, then return here.`
              : module === "writing"
                ? `Add writing questions for Task ${part} in Admin → Writing, then return here.`
                : module === "listening"
                  ? `Add listening sets for Part ${part} in Admin → Listening, then return here.`
                  : module === "reading"
                    ? `Add reading sets for Part ${part} in Admin → Reading, then return here.`
                    : "No questions are available for this part yet."}
          </p>
          <a
            href={moduleUrl(module)}
            className="text-sm font-medium text-cyan-700 hover:text-cyan-900"
          >
            ← Back to {getSectionLabel(module)}
          </a>
        </div>
      </PracticeWorkspaceLayout>
    );
  }

  const sectionLabel = getSectionLabel(module);
  const partLabel = getPartLabel(module, part);
  const questionFrameClass = practiceQuestionFrameClass(module, part);

  return (
    <PracticeWorkspaceLayout>
      <PracticeWorkspaceBar
        questionIndex={clampedIndex}
        totalQuestions={total}
        practicedCount={practicedCount}
        pendingCount={pendingCount}
      />

      <PracticeNavigatorTab open={navOpen} onOpen={() => setNavOpen(true)} />

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

      <SpeakingPracticeProvider>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={questionFrameClass}>
            {module === "speaking" && (
              <SpeakingSection
                part={part}
                questionIndex={clampedIndex}
                totalSets={total}
                attemptKey={attemptKey}
                onRetry={() => setAttemptKey((k) => k + 1)}
                onPrevious={() => goTo(clampedIndex - 1)}
                onNext={() => goTo(clampedIndex + 1)}
                onAttemptSaved={handleAttemptSaved}
              />
            )}
            {module === "listening" && (
              <ListeningSection
                part={part}
                questionIndex={clampedIndex}
                totalSets={total}
                attemptKey={attemptKey}
                onRetry={() => setAttemptKey((k) => k + 1)}
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
                onPrevious={() => goTo(clampedIndex - 1)}
                onNext={() => goTo(clampedIndex + 1)}
                onAttemptSaved={handleAttemptSaved}
              />
            )}
          </div>

          <PracticeMyAttemptsSection
            module={module}
            questions={questions}
            attempts={attemptsQ.data ?? []}
            currentQuestionId={currentQuestion?.id}
            onSelectQuestion={goTo}
          />
        </div>
      </SpeakingPracticeProvider>
    </PracticeWorkspaceLayout>
  );
}
