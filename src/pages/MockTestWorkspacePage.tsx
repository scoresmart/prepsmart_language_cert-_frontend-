import * as React from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeWorkspaceLayout } from "@/components/layout/PracticeWorkspaceLayout";
import { PracticeNavigatorTab } from "@/components/practice/PracticeNavigatorTab";
import { PracticePartSidebar } from "@/components/practice/PracticePartSidebar";
import { PracticeWorkspaceBar } from "@/components/practice/PracticeWorkspaceBar";
import { QuestionNavigatorPanel } from "@/components/practice/QuestionNavigatorPanel";
import { SpeakingPracticeProvider } from "@/components/practice/speaking/SpeakingPracticeContext";
import { api } from "@/lib/api";
import {
  MOCK_TEST_STEPS,
  mockTestNavigatorItems,
  READING_STEP_TO_PART_TYPE,
} from "@/lib/mockTestFormat";
import { setMockTestContext } from "@/lib/mockTestRecorder";
import {
  mockTestCatalogUrl,
  mockTestResultsUrl,
  mockTestStepUrl,
  parseMockStepIndex,
} from "@/lib/mockTestRoutes";
import { initMockSession, loadMockSession } from "@/lib/mockTestSessionStorage";
import type { MockTestStructure } from "@/lib/mockTestTypes";
import { practiceQuestionFrameClass } from "@/lib/practiceNavigation";
import {
  toListeningQuestion,
  toReadingQuestionFromSection,
  readingQuestionToWritingShape,
  toWritingQuestion,
} from "@/lib/mockTestTypes";
import { MockTestRunProvider } from "@/providers/MockTestRunContext";
import {
  ListeningSection,
  ReadingSection,
  WritingRunner,
} from "@/pages/PracticeSectionPage";
import { SpeakingSection } from "@/pages/SpeakingSection";

const MOCK_NAV_ITEMS = mockTestNavigatorItems();
const TOTAL_STEPS = MOCK_TEST_STEPS.length;

function resolveListeningQuestion(structure: MockTestStructure, step: (typeof MOCK_TEST_STEPS)[number]) {
  const section = structure.sections.listening.find((s) => String(s.part) === step.part);
  return section ? toListeningQuestion(section) : null;
}

function resolveReadingQuestion(structure: MockTestStructure, step: (typeof MOCK_TEST_STEPS)[number]) {
  const partType = READING_STEP_TO_PART_TYPE[step.part] ?? `part${step.part}`;
  const section = structure.sections.reading.find((s) => s.part_type === partType);
  const rq = section ? toReadingQuestionFromSection(section) : null;
  return rq ? readingQuestionToWritingShape(rq) : null;
}

function resolveWritingQuestion(structure: MockTestStructure, step: (typeof MOCK_TEST_STEPS)[number]) {
  const section = structure.sections.writing.find((s) => String(s.task) === step.part);
  const taskType = step.part === "1" ? "task1" : "task2";
  return section ? toWritingQuestion(section, taskType) : null;
}

function mockCompletedStepIds(testId: string): Set<string> {
  const session = loadMockSession(testId);
  const keys = new Set<string>();
  for (const k of Object.keys(session?.pendingSections ?? {})) keys.add(k);
  for (const k of Object.keys(session?.sections ?? {})) keys.add(k);
  return keys;
}

export function MockTestWorkspacePage() {
  const { testId = "", stepIndex: stepParam } = useParams<{ testId: string; stepIndex: string }>();
  const navigate = useNavigate();
  const stepIndex = parseMockStepIndex(stepParam);
  const step = MOCK_TEST_STEPS[stepIndex - 1];
  const stepModule = step?.module ?? "listening";
  const stepPart = step?.part ?? "1";
  const [navOpen, setNavOpen] = React.useState(false);
  const [attemptKey, setAttemptKey] = React.useState(0);

  const structureQ = useQuery({
    queryKey: ["mock-test-structure", testId],
    queryFn: async () => {
      const res = await api.tests.structure(testId);
      return res.data as MockTestStructure;
    },
    enabled: Boolean(testId),
  });

  const structure = structureQ.data;
  const testTitle = structure?.title ?? "Mock Test";
  const completedIds = React.useMemo(() => mockCompletedStepIds(testId), [testId, stepIndex, attemptKey]);
  const practicedCount = completedIds.size;
  const pendingCount = TOTAL_STEPS - practicedCount;
  const questionFrameClass = practiceQuestionFrameClass(stepModule, stepPart);

  const goStep = React.useCallback(
    (index: number) => {
      setAttemptKey((k) => k + 1);
      navigate(mockTestStepUrl(testId, index));
    },
    [navigate, testId],
  );

  const sectionNavProps = {
    setIndex: stepIndex,
    totalSets: TOTAL_STEPS,
    onPrevious: stepIndex > 1 ? () => goStep(stepIndex - 1) : undefined,
    onNext: stepIndex < TOTAL_STEPS ? () => goStep(stepIndex + 1) : undefined,
  };

  React.useEffect(() => {
    if (!testId || !step) return;
    initMockSession(testId, testTitle);
    setMockTestContext(testId, step.key);
    return () => setMockTestContext(null, null);
  }, [testId, step, testTitle]);

  if (!testId || !step) return <Navigate to={mockTestCatalogUrl()} replace />;

  if (structureQ.isLoading) {
    return (
      <PracticeWorkspaceLayout>
        <div className="flex flex-1 items-center justify-center gap-2 text-slate-400">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Loading mock test…</span>
        </div>
      </PracticeWorkspaceLayout>
    );
  }

  if (!structure) {
    return (
      <PracticeWorkspaceLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="font-semibold text-slate-800">Mock test not found</p>
          <Link to={mockTestCatalogUrl()} className="text-sm text-violet-600 hover:underline">
            ← Back to mock tests
          </Link>
        </div>
      </PracticeWorkspaceLayout>
    );
  }

  const listeningQuestion =
    step.module === "listening" ? resolveListeningQuestion(structure, step) : null;
  const readingQuestion =
    step.module === "reading" ? resolveReadingQuestion(structure, step) : null;
  const writingQuestion =
    step.module === "writing" ? resolveWritingQuestion(structure, step) : null;

  const missingConfigured =
    step.module === "listening"
      ? !listeningQuestion?.id
      : step.module === "reading"
        ? !readingQuestion?.id
        : step.module === "writing"
          ? !writingQuestion?.id
          : false;

  const renderSection = () => {
    if (missingConfigured) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-lg font-semibold text-slate-800">{step.label} not configured</p>
          <p className="max-w-md text-sm text-slate-500">
            This section has no question set assigned in Admin → Mock Tests. Skip to continue or ask
            your tutor to complete the mock test assembly.
          </p>
          {stepIndex < TOTAL_STEPS ? (
            <Button onClick={() => goStep(stepIndex + 1)}>Skip to next section</Button>
          ) : (
            <Button onClick={() => navigate(mockTestResultsUrl(testId))}>View results</Button>
          )}
        </div>
      );
    }

    if (step.module === "listening" && listeningQuestion) {
      return (
        <ListeningSection
          part={step.part}
          questionIndex={1}
          attemptKey={attemptKey}
          fixedQuestion={listeningQuestion}
          onRetry={() => setAttemptKey((k) => k + 1)}
          {...sectionNavProps}
        />
      );
    }
    if (step.module === "reading" && readingQuestion) {
      return (
        <ReadingSection
          part={step.part}
          questionIndex={1}
          attemptKey={attemptKey}
          fixedQuestion={readingQuestion}
          onRetry={() => setAttemptKey((k) => k + 1)}
          {...sectionNavProps}
        />
      );
    }
    if (step.module === "writing" && writingQuestion) {
      return (
        <div className="h-full min-h-0">
          <WritingRunner
            part={step.part}
            questionIndex={1}
            attemptKey={attemptKey}
            fixedQuestion={writingQuestion}
            onRetry={() => setAttemptKey((k) => k + 1)}
            {...sectionNavProps}
          />
        </div>
      );
    }
    if (step.module === "speaking") {
      return (
        <div className="h-full min-h-0">
          <SpeakingSection
            part={step.part}
            questionIndex={1}
            attemptKey={attemptKey}
            onRetry={() => setAttemptKey((k) => k + 1)}
            {...sectionNavProps}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <MockTestRunProvider testId={testId} sectionKey={step.key} stepIndex={stepIndex} testTitle={testTitle}>
      <PracticeWorkspaceLayout>
        <PracticeWorkspaceBar
          questionIndex={stepIndex}
          totalQuestions={TOTAL_STEPS}
          practicedCount={practicedCount}
          pendingCount={pendingCount}
        />

        <PracticeNavigatorTab open={navOpen} onOpen={() => setNavOpen(true)} />

        <QuestionNavigatorPanel
          open={navOpen}
          onClose={() => setNavOpen(false)}
          sectionLabel={testTitle}
          partLabel={step.label}
          questions={MOCK_NAV_ITEMS}
          currentIndex={stepIndex}
          completedIds={completedIds}
          onSelect={goStep}
        />

        <SpeakingPracticeProvider>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
            <PracticePartSidebar onOpenNavigator={() => setNavOpen(true)} />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className={questionFrameClass}>{renderSection()}</div>
              </div>
            </div>
          </div>
        </SpeakingPracticeProvider>
      </PracticeWorkspaceLayout>
    </MockTestRunProvider>
  );
}
