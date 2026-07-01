import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { runBatchMockTestScoring } from "@/lib/mockTestBatchScoring";
import { MOCK_TEST_STEPS } from "@/lib/mockTestFormat";
import { mockTestResultsUrl } from "@/lib/mockTestRoutes";
import { setMockTestRunOptions } from "@/lib/mockTestRecorder";

export type MockScoringProgress = {
  current: number;
  total: number;
  sectionLabel: string;
};

export function MockTestScoringDialog({
  open,
  progress,
}: {
  open: boolean;
  progress: MockScoringProgress | null;
}) {
  const pct =
    progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : undefined;

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md border-white/10 bg-[#1a1a2e] text-white [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-100">
            <Loader2 className="size-5 animate-spin text-cyan-400" />
            Calculating your score
          </DialogTitle>
          <DialogDescription className="text-white/55">
            Please wait while we score your mock test. Writing and speaking sections may take a little longer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-white/70">
          {progress ? (
            <>
              <p>
                Scoring section {progress.current} of {progress.total}
                {pct != null ? ` (${pct}%)` : ""}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${pct ?? 10}%` }}
                />
              </div>
              <p className="text-xs text-white/40">{progress.sectionLabel}</p>
            </>
          ) : (
            <p>Preparing…</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type MockTestRunContextValue = {
  testId: string;
  sectionKey: string;
  deferScoring: boolean;
  isLastStep: boolean;
  finishMockTest: () => Promise<void>;
  scoringOpen: boolean;
  scoringProgress: MockScoringProgress | null;
};

const MockTestRunContext = React.createContext<MockTestRunContextValue | null>(null);

export function useMockTestRunOptional() {
  return React.useContext(MockTestRunContext);
}

export function useMockDeferScoring() {
  return useMockTestRunOptional()?.deferScoring ?? false;
}

type ProviderProps = {
  testId: string;
  sectionKey: string;
  stepIndex: number;
  children: React.ReactNode;
};

export function MockTestRunProvider({ testId, sectionKey, stepIndex, children }: ProviderProps) {
  const navigate = useNavigate();
  const [scoringOpen, setScoringOpen] = React.useState(false);
  const [scoringProgress, setScoringProgress] = React.useState<MockScoringProgress | null>(null);

  const isLastStep = stepIndex >= MOCK_TEST_STEPS.length;

  const finishMockTest = React.useCallback(async () => {
    setScoringOpen(true);
    setScoringProgress({ current: 0, total: 1, sectionLabel: "Starting…" });
    try {
      await runBatchMockTestScoring(testId, (p) => setScoringProgress(p));
      navigate(mockTestResultsUrl(testId));
    } catch (error) {
      console.error("[MockTest] batch scoring failed", error);
      setScoringOpen(false);
      setScoringProgress(null);
      throw error;
    }
  }, [testId, navigate]);

  React.useEffect(() => {
    setMockTestRunOptions({ deferScoring: true, isLastStep, onFinish: finishMockTest });
    return () => setMockTestRunOptions({ deferScoring: false, isLastStep: false, onFinish: null });
  }, [isLastStep, finishMockTest]);

  const value = React.useMemo(
    () => ({
      testId,
      sectionKey,
      deferScoring: true,
      isLastStep,
      finishMockTest,
      scoringOpen,
      scoringProgress,
    }),
    [testId, sectionKey, isLastStep, finishMockTest, scoringOpen, scoringProgress],
  );

  return (
    <MockTestRunContext.Provider value={value}>
      {children}
      <MockTestScoringDialog open={scoringOpen} progress={scoringProgress} />
    </MockTestRunContext.Provider>
  );
}
