import * as React from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeWorkspaceLayout } from "@/components/layout/PracticeWorkspaceLayout";
import { PracticePartSidebar } from "@/components/practice/PracticePartSidebar";
import { MockTestWorkspaceBar } from "@/components/mock-test/MockTestWorkspaceBar";
import { SpeakingPracticeProvider } from "@/components/practice/speaking/SpeakingPracticeContext";
import { api } from "@/lib/api";
import { MOCK_TEST_STEPS, READING_STEP_TO_PART_TYPE } from "@/lib/mockTestFormat";
import { setMockTestContext } from "@/lib/mockTestRecorder";
import { MockTestRunProvider } from "@/providers/MockTestRunContext";
import {
  mockTestCatalogUrl,
  mockTestResultsUrl,
  mockTestStepUrl,
  parseMockStepIndex,
} from "@/lib/mockTestRoutes";
import { initMockSession } from "@/lib/mockTestSessionStorage";
import type { MockTestStructure } from "@/lib/mockTestTypes";
import {
  toListeningQuestion,
  toReadingQuestionFromSection,
  readingQuestionToWritingShape,
  toWritingQuestion,
} from "@/lib/mockTestTypes";
import {
  ListeningSection,
  ReadingSection,
  WritingRunner,
} from "@/pages/PracticeSectionPage";
import { SpeakingSection } from "@/pages/SpeakingSection";

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

export function MockTestWorkspacePage() {
  const { testId = "", stepIndex: stepParam } = useParams<{ testId: string; stepIndex: string }>();
  const navigate = useNavigate();
  const stepIndex = parseMockStepIndex(stepParam);
  const step = MOCK_TEST_STEPS[stepIndex - 1];
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

  React.useEffect(() => {
    if (!testId || !step) return;
    initMockSession(testId, testTitle);
    setMockTestContext(testId, step.key);
    return () => setMockTestContext(null, null);
  }, [testId, step?.key, testTitle]);

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

  const goStep = (index: number) => {
    setAttemptKey((k) => k + 1);
    navigate(mockTestStepUrl(testId, index));
  };

  const questionFrameClass =
    step.module === "speaking"
      ? "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      : step.module === "writing" && step.part === "1"
        ? "flex h-[calc(100dvh-3.5rem-3.25rem)] min-w-0 shrink-0 flex-col overflow-hidden"
        : "flex min-h-[calc(100dvh-3.5rem-3.25rem)] min-w-0 shrink-0 flex-col";

  return (
    <MockTestRunProvider testId={testId} sectionKey={step.key} stepIndex={stepIndex}>
    <PracticeWorkspaceLayout>
      <MockTestWorkspaceBar
        testTitle={testTitle}
        stepIndex={stepIndex}
        stepLabel={step.label}
      />

      <div className="flex h-full min-h-0 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-1.5 sm:px-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={stepIndex <= 1}
          onClick={() => goStep(stepIndex - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous section
        </Button>
        {stepIndex >= MOCK_TEST_STEPS.length ? (
          <p className="text-xs text-slate-500">Submit the last section to calculate your score.</p>
        ) : (
          <Button
            type="button"
            size="sm"
            className="gap-1 bg-violet-600 hover:bg-violet-700"
            onClick={() => goStep(stepIndex + 1)}
          >
            Next section
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>

      <SpeakingPracticeProvider>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <PracticePartSidebar onOpenNavigator={() => {}} />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                className={
                  step.module === "speaking"
                    ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                    : "min-h-0 flex-1 overflow-y-auto"
                }
              >
                {missingConfigured ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
                    <p className="text-lg font-semibold text-slate-800">{step.label} not configured</p>
                    <p className="max-w-md text-sm text-slate-500">
                      This section has no question set assigned in Admin → Mock Tests. Skip to continue or ask
                      your tutor to complete the mock test assembly.
                    </p>
                    {stepIndex < MOCK_TEST_STEPS.length ? (
                      <Button onClick={() => goStep(stepIndex + 1)}>Skip to next section</Button>
                    ) : (
                      <Button onClick={() => navigate(mockTestResultsUrl(testId))}>View results</Button>
                    )}
                  </div>
                ) : (
                  <div className={questionFrameClass}>
                    {step.module === "listening" && listeningQuestion && (
                      <ListeningSection
                        part={step.part}
                        questionIndex={1}
                        totalSets={1}
                        attemptKey={attemptKey}
                        fixedQuestion={listeningQuestion}
                        onRetry={() => setAttemptKey((k) => k + 1)}
                      />
                    )}
                    {step.module === "reading" && readingQuestion && (
                      <ReadingSection
                        part={step.part}
                        questionIndex={1}
                        totalSets={1}
                        attemptKey={attemptKey}
                        fixedQuestion={readingQuestion}
                        onRetry={() => setAttemptKey((k) => k + 1)}
                      />
                    )}
                    {step.module === "writing" && writingQuestion && (
                      <div className="h-full min-h-0">
                        <WritingRunner
                          part={step.part}
                          questionIndex={1}
                          totalSets={1}
                          attemptKey={attemptKey}
                          fixedQuestion={writingQuestion}
                          setIndex={1}
                          onRetry={() => setAttemptKey((k) => k + 1)}
                        />
                      </div>
                    )}
                    {step.module === "speaking" && (
                      <div className="h-full min-h-0">
                        <SpeakingSection
                          part={step.part}
                          questionIndex={1}
                          totalSets={1}
                          attemptKey={attemptKey}
                          onRetry={() => setAttemptKey((k) => k + 1)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SpeakingPracticeProvider>
    </PracticeWorkspaceLayout>
    </MockTestRunProvider>
  );
}
