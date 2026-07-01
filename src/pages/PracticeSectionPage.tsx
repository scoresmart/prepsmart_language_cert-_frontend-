import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type WritingQuestion, type ListeningQuestion, type ReadingQuestion } from "@/lib/api";
import { PracticeScoringDialog } from "@/components/practice/PracticeScoringDialog";
import { PracticeTaskFooterActions } from "@/components/practice/PracticeActionButtons";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ListeningPracticeShell } from "@/components/practice/listening/ListeningPracticeShell";
import { ListeningMcqBlock } from "@/components/practice/listening/ListeningMcqBlock";
import { ReadingPracticeShell } from "@/components/practice/reading/ReadingPracticeShell";
import { ReadingMcqBlock } from "@/components/practice/reading/ReadingMcqBlock";
import {
  ReadingGapDrop,
  ReadingPassageBlock,
  ReadingSentenceCard,
} from "@/components/practice/reading/ReadingDragDrop";
import { ReadingStatementSelect } from "@/components/practice/reading/ReadingTextSelect";
import { WritingPracticeShell } from "@/components/practice/writing/WritingPracticeShell";
import {
  WritingPart1AnswerPanel,
  WritingPart1TaskPanel,
} from "@/components/practice/writing/WritingPart1SplitView";
import { WritingWordCountBar } from "@/components/practice/writing/WritingWordCountBar";
import { WritingRichEditor } from "@/components/practice/writing/WritingRichEditor";
import { WRITING_WORD_LIMITS } from "@/lib/writingInstructions";
import {
  normalizeListeningPart3Data,
  normalizeListeningPart4Data,
} from "@/lib/listeningQuestionData";
import { saveLocalAnswer } from "@/lib/practiceAttemptStorage";
import { notifyMockTestScoreFromAttempt, notifyMockWritingAiScore } from "@/lib/mockTestRecorder";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useMockDeferredPracticeSubmit, mockShowAnswers } from "@/hooks/useMockDeferredPracticeSubmit";
import { MockSectionSavedNotice } from "@/components/mock-test/MockSectionSavedNotice";
import { completeMockSectionSubmit, isMockDeferScoring } from "@/lib/mockTestRecorder";
import { useMockTestRunOptional } from "@/providers/MockTestRunContext";
import { DEFAULT_WRITING_LEVEL, type ScoringPhase, type WritingScoreResult } from "@/lib/scoringTypes";

type AttemptBody = {
  question_type: string;
  question_set_id: string;
  score: number;
  total: number;
};

async function persistAttempt(body: AttemptBody, onAttemptSaved?: () => void): Promise<string | null> {
  try {
    const res = await api.practice.saveAttempt(body);
    notifyMockTestScoreFromAttempt(body.question_type, body.score, body.total);
    onAttemptSaved?.();
    return res.data?.id ?? null;
  } catch {
    return null;
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://sepzceaicoldqhyxxzff.supabase.co";

function getImageUrl(f?: string | null): string | null {
  if (!f || f.startsWith("{") || f.startsWith("[")) return null;
  if (f.startsWith("http")) return f;
  return `${SUPABASE_URL}/storage/v1/object/public/writing-task-images/${f}`;
}

function getAudioUrl(f?: string | null): string | null {
  if (!f?.trim()) return null;
  const trimmed = f.trim();
  if (trimmed.startsWith("http")) return trimmed;
  const path = trimmed.replace(/^legacy-listening\//, "");
  return `${SUPABASE_URL}/storage/v1/object/public/listening-audio/${path}`;
}

function parseJson<T>(s: string | null | undefined): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

// ── Shared components ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
      <Loader2 className="size-5 animate-spin" />
      <span className="text-sm">Loading question…</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-slate-50 py-20 text-center text-slate-400">
      <p className="text-sm font-medium">No questions available for {label} yet.</p>
      <p className="text-xs mt-1">Ask your admin to add question sets.</p>
    </div>
  );
}

interface ResultsScreenProps {
  score: number;
  total: number;
  children?: React.ReactNode;
}

function SectionOutcome({
  revealed,
  deferResults,
  score,
  total,
}: {
  revealed: boolean;
  deferResults: boolean;
  isLastStep: boolean;
  score: number;
  total: number;
  onRetry: () => void;
}) {
  if (!revealed) return null;
  if (deferResults) return null;
  return <ResultsScreen score={score} total={total} />;
}

function practiceFooterTop(submitted: boolean, deferResults: boolean, isLastStep: boolean) {
  if (!submitted || !deferResults) return undefined;
  return (
    <div className="mb-2 w-full">
      <MockSectionSavedNotice isLastStep={isLastStep} />
    </div>
  );
}

function practiceTaskFooter(p: {
  canSubmit: boolean;
  isSubmitting: boolean;
  submitted: boolean;
  deferResults: boolean;
  isLastStep: boolean;
  onSubmit: () => void;
  onRedo: () => void;
  submitVariant?: "answers" | "answer" | "submit";
  enabled?: boolean;
}) {
  if (p.enabled === false) return undefined;
  return (
    <PracticeTaskFooterActions
      canSubmit={p.canSubmit}
      isSubmitting={p.isSubmitting}
      submitted={p.submitted}
      deferResults={p.deferResults}
      isLastStep={p.isLastStep}
      onSubmit={p.onSubmit}
      onRedo={p.onRedo}
      submitVariant={p.submitVariant}
    />
  );
}

function ResultsScreen({ score, total, children }: ResultsScreenProps) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const colour = pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-br from-slate-50 to-white shadow-sm">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <Trophy className={cn("size-10 mx-auto", colour)} />
          <p className="text-3xl font-bold text-slate-800">{score} / {total}</p>
          <p className={cn("text-lg font-semibold", colour)}>{pct}%</p>
          <p className="text-sm text-slate-500">
            {pct >= 70 ? "Great work!" : pct >= 50 ? "Good effort — keep practising!" : "Keep going — practice makes perfect!"}
          </p>
        </CardContent>
      </Card>
      {children}
    </div>
  );
}

// ── Writing Runner ─────────────────────────────────────────────────────────────

type WritingNavProps = {
  setIndex?: number;
  totalSets?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onAttemptSaved?: () => void;
};

export function WritingRunner({
  part,
  questionIndex = 1,
  attemptKey = 0,
  onRetry,
  setIndex,
  totalSets,
  onPrevious,
  onNext,
  onAttemptSaved,
  fixedQuestion,
}: {
  part: string;
  questionIndex?: number;
  attemptKey?: number;
  onRetry?: () => void;
  fixedQuestion?: WritingQuestion;
} & WritingNavProps) {
  const taskType = part === "1" ? "task1" : "task2";
  const [text, setText] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [scoringPhase, setScoringPhase] = React.useState<ScoringPhase>("idle");
  const [writingScore, setWritingScore] = React.useState<WritingScoreResult | null>(null);
  const [scoringError, setScoringError] = React.useState<string | null>(null);
  const [scoringDialogOpen, setScoringDialogOpen] = React.useState(false);
  const { isSubmitting, runSubmit } = useSubmitLock();
  const mockRun = useMockTestRunOptional();
  const deferResults = isMockDeferScoring();

  const q = useQuery({
    queryKey: ["practice", "writing", taskType],
    queryFn: async () => {
      const res = await api.writing.list(taskType as "task1" | "task2");
      return res.data ?? [];
    },
    enabled: !fixedQuestion,
  });

  const questions = fixedQuestion ? [fixedQuestion] : (q.data ?? []);
  const question = questions[questionIndex - 1];

  React.useEffect(() => {
    setText("");
    setSubmitted(false);
    setScoringPhase("idle");
    setWritingScore(null);
    setScoringError(null);
    setScoringDialogOpen(false);
  }, [questionIndex, attemptKey, question?.id]);

  React.useEffect(() => {
    if (submitted && !deferResults && scoringPhase !== "idle") {
      setScoringDialogOpen(true);
    }
  }, [submitted, deferResults, scoringPhase]);

  const handleSubmit = () => {
    if (!question || submitted) return;
    void runSubmit(async () => {
      saveLocalAnswer(question.id, text);

      const deferred = await completeMockSectionSubmit({
        kind: "writing",
        questionType: `writing_${taskType}`,
        questionSetId: question.id,
        taskType: taskType as "task1" | "task2",
        text,
        questionText: question.question_text,
      });
      if (deferred) {
        setSubmitted(true);
        return;
      }

      setSubmitted(true);
      setScoringPhase("scoring");
      setWritingScore(null);
      setScoringError(null);

      const attemptId = await persistAttempt(
        {
          question_type: `writing_${taskType}`,
          question_set_id: question.id,
          score: 0,
          total: 12,
        },
        onAttemptSaved,
      );

      try {
        const res = await api.scoring.writing({
          question_text: question.question_text,
          candidate_response: text,
          level: DEFAULT_WRITING_LEVEL,
          task_type: taskType,
          attempt_id: attemptId ?? undefined,
        });
        setWritingScore(res.data);
        notifyMockWritingAiScore(taskType as "task1" | "task2", res.data.scores.total);
        setScoringPhase("done");
      } catch (error) {
        setScoringError(error instanceof Error ? error.message : "Scoring failed");
        setScoringPhase("error");
      }
    });
  };

  const handleRetry = () => {
    setText("");
    setSubmitted(false);
    setScoringPhase("idle");
    setWritingScore(null);
    setScoringError(null);
    onRetry?.();
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (!fixedQuestion && q.isLoading) return <LoadingState />;
  if (!question) return <EmptyState label={`Writing Task ${part}`} />;

  const imageUrl = getImageUrl(question.image_path);
  const limits = WRITING_WORD_LIMITS[part] ?? WRITING_WORD_LIMITS["1"];
  const { min: minWords, max: maxWords } = limits;
  const canSubmit = wordCount >= minWords && wordCount <= maxWords;

  const shellProps = {
    activePart: part,
    setIndex: setIndex ?? questionIndex,
    totalSets,
    onPrevious,
    onNext,
  };

  const scoringDialog = (
    <PracticeScoringDialog
      open={scoringDialogOpen}
      onOpenChange={setScoringDialogOpen}
      phase={scoringPhase}
      error={scoringError}
      writing={writingScore}
      responseText={text}
    />
  );

  if (part === "1") {
    return (
      <>
      {scoringDialog}
      <WritingPracticeShell
        {...shellProps}
        layout="split"
        compactBanner
        leftPanel={
          <WritingPart1TaskPanel
            imageUrl={imageUrl}
            questionText={question.question_text}
            minWords={minWords}
            maxWords={maxWords}
          />
        }
        rightPanel={
          <WritingPart1AnswerPanel
            minWords={minWords}
            maxWords={maxWords}
            wordCount={wordCount}
            text={text}
            submitted={submitted}
            attemptKey={`${question.id}-${attemptKey}`}
            onChange={setText}
            onRetry={handleRetry}
            scoreSlot={
              submitted && !deferResults && scoringPhase === "done" ? (
                <p className="text-center text-sm text-slate-500">
                  Your score is shown in the popup. Close it to continue practising.
                </p>
              ) : undefined
            }
          />
        }
        footer={
          <>
            {!submitted && (
              <WritingWordCountBar count={wordCount} min={minWords} max={maxWords} className="max-w-[220px] shrink-0" />
            )}
            {practiceTaskFooter({
              canSubmit,
              isSubmitting,
              submitted,
              deferResults,
              isLastStep: mockRun?.isLastStep ?? false,
              onSubmit: handleSubmit,
              onRedo: handleRetry,
              submitVariant: "answer",
            })}
          </>
        }
        footerTop={practiceFooterTop(submitted, deferResults, mockRun?.isLastStep ?? false)}
      />
      </>
    );
  }

  return (
    <>
    {scoringDialog}
    <WritingPracticeShell
      {...shellProps}
      footer={practiceTaskFooter({
        canSubmit,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep: mockRun?.isLastStep ?? false,
        onSubmit: handleSubmit,
        onRedo: handleRetry,
        submitVariant: "answer",
      })}
      footerTop={practiceFooterTop(submitted, deferResults, mockRun?.isLastStep ?? false)}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-lg border border-slate-300 bg-slate-100 p-4 md:p-5">
          <h2 className="text-base font-bold text-slate-800">Writing Part {part}</h2>
          {imageUrl && (
            <div className="mt-4 overflow-hidden rounded border border-slate-200 bg-white">
              <img src={imageUrl} alt="Task stimulus" className="max-h-72 w-full object-contain" />
            </div>
          )}
          <div className="mt-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {question.question_text}
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">
            Write between {minWords} and {maxWords} words.
          </p>
        </div>

        {submitted && !deferResults && scoringPhase === "done" ? (
          <p className="text-center text-sm text-slate-500">
            Your score is shown in the popup. Close it to continue practising.
          </p>
        ) : !submitted ? (
          <WritingRichEditor
            value={text}
            onChange={setText}
            minWords={minWords}
            maxWords={maxWords}
            resetKey={`${question.id}-${attemptKey}`}
          />
        ) : null}
      </div>
    </WritingPracticeShell>
    </>
  );
}

type Q1A = { questionText: string; options: string[]; correctAnswer: number };

type ReadingNavProps = {
  setIndex?: number;
  totalSets?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onAttemptSaved?: () => void;
};

function Reading1ARunner({
  question,
  onRetry,
  setIndex,
  totalSets,
  onPrevious,
  onNext,
  onAttemptSaved,
}: { question: WritingQuestion; onRetry: () => void } & ReadingNavProps) {
  const items = parseJson<Q1A[]>(question.image_path) ?? [];
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const LABELS = ["A", "B", "C", "D", "E", "F"];

  const score = items.filter((item, i) => answers[i] === LABELS[item.correctAnswer]).length;
  const allAnswered = items.length > 0 && items.every((_, i) => answers[i]);

  const { handleSubmit, isSubmitting, deferResults, isLastStep } = useMockDeferredPracticeSubmit(
    setSubmitted,
    () => ({
      kind: "mcq",
      questionType: "reading_part_1a",
      questionSetId: question.id,
      answers,
      items: items.map((item) => ({ correctAnswer: item.correctAnswer })),
      labelMode: "index",
      labelLetters: LABELS,
    }),
    () =>
      persistAttempt(
        {
          question_type: "reading_part_1a",
          question_set_id: question.id,
          score,
          total: items.length,
        },
        onAttemptSaved,
      ),
  );
  const showAnswers = mockShowAnswers(submitted, deferResults);

  return (
    <ReadingPracticeShell
      activePart="1a"
      setIndex={setIndex}
      totalSets={totalSets}
      onPrevious={onPrevious}
      onNext={onNext}
      footer={practiceTaskFooter({
        canSubmit: allAnswered,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep,
        onSubmit: handleSubmit,
        onRedo: onRetry,
        enabled: items.length > 0,
      })}
      footerTop={practiceFooterTop(submitted, deferResults, isLastStep)}
    >
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm italic text-slate-400">No questions found in this set.</p>
      ) : (
        <>
          {items.map((item, qi) => (
            <ReadingMcqBlock
              key={qi}
              number={qi + 1}
              prompt={item.questionText}
              options={item.options.map((opt, oi) => ({ label: LABELS[oi], text: opt }))}
              selected={answers[qi]}
              revealed={showAnswers}
              correctAnswer={LABELS[item.correctAnswer]}
              onSelect={(label) => !submitted && setAnswers((prev) => ({ ...prev, [qi]: label }))}
            />
          ))}
          {submitted && (
            <SectionOutcome
              revealed={submitted}
              deferResults={deferResults}
              isLastStep={isLastStep}
              score={score}
              total={items.length}
              onRetry={onRetry}
            />
          )}
        </>
      )}
    </ReadingPracticeShell>
  );
}

// ── Reading Part 1B — Gap Fill ────────────────────────────────────────────────

type Q1B = { options: string[]; correctAnswer: number };

function Reading1BRunner({
  question,
  onRetry,
  setIndex,
  totalSets,
  onPrevious,
  onNext,
  onAttemptSaved,
}: { question: WritingQuestion; onRetry: () => void } & ReadingNavProps) {
  const gapOptions = parseJson<Q1B[]>(question.image_path) ?? [];
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const LABELS = ["A", "B", "C", "D", "E", "F"];

  const parts = React.useMemo(() => question.question_text.split(/\(\d+\)……+/g), [question.question_text]);
  const score = gapOptions.filter((g, i) => answers[i] === LABELS[g.correctAnswer]).length;
  const allAnswered = gapOptions.length > 0 && gapOptions.every((_, i) => answers[i]);
  const gapStartNum = 1;

  const { handleSubmit, isSubmitting, deferResults, isLastStep } = useMockDeferredPracticeSubmit(
    setSubmitted,
    () => ({
      kind: "mcq",
      questionType: "reading_part_1b",
      questionSetId: question.id,
      answers,
      items: gapOptions.map((g) => ({ correctAnswer: g.correctAnswer })),
      labelMode: "index",
      labelLetters: LABELS,
    }),
    () =>
      persistAttempt(
        {
          question_type: "reading_part_1b",
          question_set_id: question.id,
          score,
          total: gapOptions.length,
        },
        onAttemptSaved,
      ),
  );
  const showAnswers = mockShowAnswers(submitted, deferResults);

  const leftPanel = (
    <div className="rounded border border-slate-300 bg-white p-4 md:p-5">
      <p className="text-sm leading-loose text-slate-700">
        {parts.map((part, pi) => (
          <React.Fragment key={pi}>
            {part}
            {pi < gapOptions.length && (
              <span className="mx-1 inline-block font-bold text-slate-500">
                ({gapStartNum + pi})…………
              </span>
            )}
          </React.Fragment>
        ))}
      </p>
    </div>
  );

  const rightPanel = (
    <div className="space-y-4">
      {gapOptions.map((gap, gi) => (
        <ReadingMcqBlock
          key={gi}
          number={gapStartNum + gi}
          options={gap.options.map((opt, oi) => ({ label: LABELS[oi], text: opt }))}
          selected={answers[gi]}
          revealed={showAnswers}
          correctAnswer={LABELS[gap.correctAnswer]}
          onSelect={(label) => !submitted && setAnswers((prev) => ({ ...prev, [gi]: label }))}
        />
      ))}
      {submitted && (
        <SectionOutcome
          revealed={showAnswers}
          deferResults={deferResults}
          isLastStep={isLastStep}
          score={score}
          total={gapOptions.length}
          onRetry={onRetry}
        />
      )}
    </div>
  );

  return (
    <ReadingPracticeShell
      activePart="1b"
      layout="split"
      setIndex={setIndex}
      totalSets={totalSets}
      onPrevious={onPrevious}
      onNext={onNext}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      footer={practiceTaskFooter({
        canSubmit: allAnswered,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep,
        onSubmit: handleSubmit,
        onRedo: onRetry,
      })}
      footerTop={practiceFooterTop(submitted, deferResults, isLastStep)}
    />
  );
}

// ── Reading Part 2 — Sentence Insertion ───────────────────────────────────────

type Q2Data = { passage: string; answers: string[]; correctMapping: Record<string, string> };

function Reading2Runner({
  question,
  onRetry,
  setIndex,
  totalSets,
  onPrevious,
  onNext,
  onAttemptSaved,
}: { question: WritingQuestion; onRetry: () => void } & ReadingNavProps) {
  const data = parseJson<Q2Data>(question.image_path);
  const [selections, setSelections] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [activeGap, setActiveGap] = React.useState<string | null>(null);

  if (!data) return <p className="py-8 text-center text-sm italic text-slate-400">Invalid question data.</p>;

  const gaps = Object.keys(data.correctMapping).sort((a, b) => Number(a) - Number(b));
  const sentenceLabels = data.answers.map((_, i) => String.fromCharCode(65 + i));
  const score = gaps.filter((g) => selections[g] === data.correctMapping[g]).length;
  const allAnswered = gaps.length > 0 && gaps.every((g) => selections[g]);
  const usedLabels = new Set(Object.values(selections));
  const passageParts = data.passage.split(/\[(\d+)\]/g);

  const assignSentence = (gapNum: string, label: string) => {
    if (submitted) return;
    setSelections((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k] === label) delete next[k];
      });
      next[gapNum] = label;
      return next;
    });
    setActiveGap(null);
  };

  const { handleSubmit, isSubmitting, deferResults, isLastStep } = useMockDeferredPracticeSubmit(
    setSubmitted,
    () => ({
      kind: "mapping",
      questionType: "reading_part_2",
      questionSetId: question.id,
      selections,
      correctMapping: data.correctMapping,
    }),
    () =>
      persistAttempt(
        {
          question_type: "reading_part_2",
          question_set_id: question.id,
          score,
          total: gaps.length,
        },
        onAttemptSaved,
      ),
  );
  const showAnswers = mockShowAnswers(submitted, deferResults);

  const leftPanel = (
    <div className="rounded border border-slate-300 bg-white p-4 md:p-5">
      <p className="text-sm leading-loose text-slate-700">
        {passageParts.map((part, pi) => {
          if (pi % 2 === 0) return <span key={pi}>{part}</span>;
          const gapNum = part;
          const correct = data.correctMapping[gapNum];
          const selected = selections[gapNum];
          return (
            <ReadingGapDrop
              key={pi}
              gapId={gapNum}
              value={selected}
              label={correct}
              revealed={showAnswers}
              correct={selected === correct}
              onDrop={assignSentence}
              onClear={() => !submitted && setSelections((prev) => {
                const next = { ...prev };
                delete next[gapNum];
                return next;
              })}
            />
          );
        })}
      </p>
    </div>
  );

  const rightPanel = (
    <div className="space-y-3">
      {data.answers.map((sentence, i) => {
        const label = sentenceLabels[i];
        return (
          <ReadingSentenceCard
            key={label}
            label={label}
            text={sentence}
            used={usedLabels.has(label)}
            onClick={() => {
              if (submitted || !activeGap) return;
              assignSentence(activeGap, label);
            }}
          />
        );
      })}
      <p className="text-xs text-slate-500">
        Drag a sentence into a gap, or tap a gap then tap a sentence.
      </p>
      {!submitted && (
        <div className="flex flex-wrap gap-2 pt-2">
          {gaps.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGap(activeGap === g ? null : g)}
              className={cn(
                "rounded border px-2 py-1 text-xs font-bold",
                activeGap === g ? "border-cyan-500 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-600",
              )}
            >
              Gap [{g}]
            </button>
          ))}
        </div>
      )}
      {submitted && (
        <SectionOutcome
          revealed={showAnswers}
          deferResults={deferResults}
          isLastStep={isLastStep}
          score={score}
          total={gaps.length}
          onRetry={onRetry}
        />
      )}
    </div>
  );

  return (
    <ReadingPracticeShell
      activePart="2"
      layout="split"
      setIndex={setIndex}
      totalSets={totalSets}
      onPrevious={onPrevious}
      onNext={onNext}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      footer={practiceTaskFooter({
        canSubmit: allAnswered,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep,
        onSubmit: handleSubmit,
        onRedo: onRetry,
      })}
      footerTop={practiceFooterTop(submitted, deferResults, isLastStep)}
    />
  );
}

// ── Reading Part 3 — Multiple Passage Matching ────────────────────────────────

type Q3Data = {
  passages: { label: string; text: string }[];
  statements: { text: string; correctAnswer: string }[];
};

function Reading3Runner({
  question,
  onRetry,
  setIndex,
  totalSets,
  onPrevious,
  onNext,
  onAttemptSaved,
}: { question: WritingQuestion; onRetry: () => void } & ReadingNavProps) {
  const data = parseJson<Q3Data>(question.image_path);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  if (!data) return <p className="py-8 text-center text-sm italic text-slate-400">Invalid question data.</p>;

  const score = data.statements.filter((s, i) => answers[i] === s.correctAnswer).length;
  const allAnswered = data.statements.length > 0 && data.statements.every((_, i) => answers[i]);
  const textOptions = data.passages.map((p) => p.label);

  const { handleSubmit, isSubmitting, deferResults, isLastStep } = useMockDeferredPracticeSubmit(
    setSubmitted,
    () => ({
      kind: "statement_match",
      questionType: "reading_part_3",
      questionSetId: question.id,
      answers,
      statements: data.statements,
    }),
    () =>
      persistAttempt(
        {
          question_type: "reading_part_3",
          question_set_id: question.id,
          score,
          total: data.statements.length,
        },
        onAttemptSaved,
      ),
  );
  const showAnswers = mockShowAnswers(submitted, deferResults);

  const leftPanel = (
    <div className="space-y-4">
      {data.passages.map((p) => (
        <ReadingPassageBlock key={p.label} label={p.label} text={p.text} />
      ))}
    </div>
  );

  const rightPanel = (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-700">In which text does the writer say the following:</p>
      {data.statements.map((stmt, i) => (
        <ReadingStatementSelect
          key={i}
          index={i + 1}
          text={stmt.text}
          options={textOptions}
          value={answers[i]}
          revealed={showAnswers}
          correct={stmt.correctAnswer}
          onChange={(label) => !submitted && setAnswers((prev) => ({ ...prev, [i]: label }))}
        />
      ))}
      {submitted && (
        <SectionOutcome
          revealed={showAnswers}
          deferResults={deferResults}
          isLastStep={isLastStep}
          score={score}
          total={data.statements.length}
          onRetry={onRetry}
        />
      )}
    </div>
  );

  return (
    <ReadingPracticeShell
      activePart="3"
      layout="split"
      setIndex={setIndex}
      totalSets={totalSets}
      onPrevious={onPrevious}
      onNext={onNext}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      footer={practiceTaskFooter({
        canSubmit: allAnswered,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep,
        onSubmit: handleSubmit,
        onRedo: onRetry,
      })}
      footerTop={practiceFooterTop(submitted, deferResults, isLastStep)}
    />
  );
}

// ── Reading Part 4 — Reading Comprehension ────────────────────────────────────

type Q4Data = {
  passageTitle?: string;
  passage: string;
  questions: { text: string; options: Record<string, string>; correctAnswer: string }[];
};

function Reading4Runner({
  question,
  onRetry,
  setIndex,
  totalSets,
  onPrevious,
  onNext,
  onAttemptSaved,
}: { question: WritingQuestion; onRetry: () => void } & ReadingNavProps) {
  const data = parseJson<Q4Data>(question.image_path);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  if (!data) return <p className="py-8 text-center text-sm italic text-slate-400">Invalid question data.</p>;

  const score = data.questions.filter((q, i) => answers[i] === q.correctAnswer).length;
  const allAnswered = data.questions.every((_, i) => answers[i]);

  const { handleSubmit, isSubmitting, deferResults, isLastStep } = useMockDeferredPracticeSubmit(
    setSubmitted,
    () => ({
      kind: "mcq",
      questionType: "reading_part_4",
      questionSetId: question.id,
      answers,
      items: data.questions.map((q) => ({ correctAnswer: q.correctAnswer })),
    }),
    () =>
      persistAttempt(
        {
          question_type: "reading_part_4",
          question_set_id: question.id,
          score,
          total: data.questions.length,
        },
        onAttemptSaved,
      ),
  );
  const showAnswers = mockShowAnswers(submitted, deferResults);

  const leftPanel = (
    <div className="rounded border border-slate-300 bg-white p-4 md:p-5">
      {data.passageTitle && (
        <h3 className="mb-3 text-base font-bold text-slate-800">{data.passageTitle}</h3>
      )}
      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{data.passage}</p>
    </div>
  );

  const rightPanel = (
    <div className="space-y-4">
      {data.questions.map((q, qi) => (
        <ReadingMcqBlock
          key={qi}
          number={qi + 1}
          prompt={q.text}
          options={Object.entries(q.options).map(([label, text]) => ({ label, text }))}
          selected={answers[qi]}
          revealed={showAnswers}
          correctAnswer={q.correctAnswer}
          onSelect={(label) => !submitted && setAnswers((prev) => ({ ...prev, [qi]: label }))}
        />
      ))}
      {submitted && (
        <SectionOutcome
          revealed={showAnswers}
          deferResults={deferResults}
          isLastStep={isLastStep}
          score={score}
          total={data.questions.length}
          onRetry={onRetry}
        />
      )}
    </div>
  );

  return (
    <ReadingPracticeShell
      activePart="4"
      layout="split"
      setIndex={setIndex}
      totalSets={totalSets}
      onPrevious={onPrevious}
      onNext={onNext}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      footer={practiceTaskFooter({
        canSubmit: allAnswered,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep,
        onSubmit: handleSubmit,
        onRedo: onRetry,
      })}
      footerTop={practiceFooterTop(submitted, deferResults, isLastStep)}
    />
  );
}

// ── Reading Section Router ────────────────────────────────────────────────────

function toWritingShape(rq: ReadingQuestion): WritingQuestion {
  return {
    id: rq.id,
    task_type: "task1",
    question_text: rq.title || rq.passage || "",
    image_path: rq.questions ? JSON.stringify(rq.questions) : null,
    created_by: rq.created_by,
    created_at: rq.created_at,
    updated_at: rq.updated_at,
  };
}

export function ReadingSection({
  part,
  questionIndex = 1,
  attemptKey = 0,
  totalSets,
  onRetry,
  onPrevious,
  onNext,
  onAttemptSaved,
  fixedQuestion,
}: {
  part: string;
  questionIndex?: number;
  attemptKey?: number;
  totalSets?: number;
  onRetry?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onAttemptSaved?: () => void;
  fixedQuestion?: WritingQuestion;
}) {
  const partTypeMap: Record<string, "part1a" | "part1b" | "part2" | "part3" | "part4"> = {
    "1a": "part1a",
    "1b": "part1b",
    "2": "part2",
    "3": "part3",
    "4": "part4",
  };
  const partType = partTypeMap[part] ?? "part1a";

  const q = useQuery({
    queryKey: ["practice", "reading", partType],
    queryFn: async () => {
      const res = await api.reading.list({ part_type: partType, page: 1, limit: 500 });
      return (res.data?.questions ?? []).map(toWritingShape);
    },
    enabled: !fixedQuestion,
  });

  const questions = fixedQuestion ? [fixedQuestion] : (q.data ?? []);
  const question = questions[questionIndex - 1];
  const runnerKey = `${question?.id ?? "none"}-${attemptKey}`;

  if (!fixedQuestion && q.isLoading) return <LoadingState />;
  if (!question) return <EmptyState label={`Reading Part ${part.toUpperCase()}`} />;

  const navProps: ReadingNavProps = {
    setIndex: questionIndex,
    totalSets: totalSets ?? questions.length,
    onPrevious,
    onNext,
    onAttemptSaved,
  };

  if (part === "1a") return <Reading1ARunner key={runnerKey} question={question} onRetry={() => onRetry?.()} {...navProps} />;
  if (part === "1b") return <Reading1BRunner key={runnerKey} question={question} onRetry={() => onRetry?.()} {...navProps} />;
  if (part === "2") return <Reading2Runner key={runnerKey} question={question} onRetry={() => onRetry?.()} {...navProps} />;
  if (part === "3") return <Reading3Runner key={runnerKey} question={question} onRetry={() => onRetry?.()} {...navProps} />;
  if (part === "4") return <Reading4Runner key={runnerKey} question={question} onRetry={() => onRetry?.()} {...navProps} />;
  return <EmptyState label={`Reading Part ${part}`} />;
}

// ── Listening Part 1 — Short Exchanges ───────────────────────────────────────

type L1Item = { optionA: string; optionB: string; optionC: string; correctAnswer: string };

type ListeningNavProps = {
  setIndex?: number;
  totalSets?: number;
  attemptKey?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onAttemptSaved?: () => void;
};

function Listening1Runner({
  question,
  onRetry,
  setIndex,
  totalSets,
  attemptKey = 0,
  onPrevious,
  onNext,
  onAttemptSaved,
}: { question: ListeningQuestion; onRetry: () => void } & ListeningNavProps) {
  const items = (question.questions ?? []) as unknown as L1Item[];
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const audioUrl = getAudioUrl(question.audio_path);
  const OPTS: (keyof L1Item)[] = ["optionA", "optionB", "optionC"];
  const LABELS = ["A", "B", "C"];
  const score = items.filter((item, i) => answers[i] === item.correctAnswer).length;
  const allAnswered = items.length > 0 && items.every((_, i) => answers[i]);

  const { handleSubmit, isSubmitting, deferResults, isLastStep } = useMockDeferredPracticeSubmit(
    setSubmitted,
    () => ({
      kind: "mcq",
      questionType: "listening_part_1",
      questionSetId: question.id,
      answers,
      items: items.map((item) => ({ correctAnswer: item.correctAnswer })),
    }),
    () =>
      persistAttempt(
        {
          question_type: "listening_part_1",
          question_set_id: question.id,
          score,
          total: items.length,
        },
        onAttemptSaved,
      ),
  );
  const showAnswers = mockShowAnswers(submitted, deferResults);

  return (
    <ListeningPracticeShell
      activePart={1}
      audioUrl={audioUrl}
      audioResetKey={`${question.id}-${attemptKey}`}
      setIndex={setIndex}
      totalSets={totalSets}
      onPrevious={onPrevious}
      onNext={onNext}
      footer={practiceTaskFooter({
        canSubmit: allAnswered,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep,
        onSubmit: handleSubmit,
        onRedo: onRetry,
        enabled: items.length > 0,
      })}
      footerTop={practiceFooterTop(submitted, deferResults, isLastStep)}
    >
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic py-8 text-center">No questions found in this set.</p>
      ) : (
        <>
          {items.map((item, qi) => (
            <ListeningMcqBlock
              key={qi}
              number={qi + 1}
              options={OPTS.map((opt, oi) => ({ label: LABELS[oi], text: String(item[opt]) }))}
              selected={answers[qi]}
              revealed={showAnswers}
              correctAnswer={item.correctAnswer}
              onSelect={(label) => !submitted && setAnswers((prev) => ({ ...prev, [qi]: label }))}
            />
          ))}
          {submitted && (
            <SectionOutcome
              revealed={submitted}
              deferResults={deferResults}
              isLastStep={isLastStep}
              score={score}
              total={items.length}
              onRetry={onRetry}
            />
          )}
        </>
      )}
    </ListeningPracticeShell>
  );
}

// ── Listening Part 2 — Conversations ─────────────────────────────────────────

type L2Conversation = {
  context: string;
  questions: { questionText: string; optionA: string; optionB: string; optionC: string; correctAnswer: string }[];
};

function Listening2Runner({
  question,
  onRetry,
  setIndex,
  totalSets,
  attemptKey = 0,
  onPrevious,
  onNext,
  onAttemptSaved,
}: { question: ListeningQuestion; onRetry: () => void } & ListeningNavProps) {
  const conversations = (question.questions ?? []) as unknown as L2Conversation[];
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const audioUrl = getAudioUrl(question.audio_path);
  const LABELS = ["A", "B", "C"];

  const allSubQuestions = conversations.flatMap((c, ci) =>
    (c.questions ?? []).map((q, qi) => ({ ci, qi, q }))
  );
  const score = allSubQuestions.filter(({ ci, qi, q }) => answers[`${ci}-${qi}`] === q.correctAnswer).length;
  const allAnswered = allSubQuestions.length > 0 && allSubQuestions.every(({ ci, qi }) => answers[`${ci}-${qi}`]);

  const { handleSubmit, isSubmitting, deferResults, isLastStep } = useMockDeferredPracticeSubmit(
    setSubmitted,
    () => ({
      kind: "mcq",
      questionType: "listening_part_2",
      questionSetId: question.id,
      answers: Object.fromEntries(
        allSubQuestions.map(({ ci, qi }, idx) => [idx, answers[`${ci}-${qi}`] ?? ""]),
      ),
      items: allSubQuestions.map(({ q }) => ({ correctAnswer: q.correctAnswer })),
    }),
    () =>
      persistAttempt(
        {
          question_type: "listening_part_2",
          question_set_id: question.id,
          score,
          total: allSubQuestions.length,
        },
        onAttemptSaved,
      ),
  );
  const showAnswers = mockShowAnswers(submitted, deferResults);

  let questionNum = 0;

  return (
    <ListeningPracticeShell
      activePart={2}
      audioUrl={audioUrl}
      audioResetKey={`${question.id}-${attemptKey}`}
      setIndex={setIndex}
      totalSets={totalSets}
      onPrevious={onPrevious}
      onNext={onNext}
      footer={practiceTaskFooter({
        canSubmit: allAnswered,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep,
        onSubmit: handleSubmit,
        onRedo: onRetry,
        enabled: allSubQuestions.length > 0,
      })}
      footerTop={practiceFooterTop(submitted, deferResults, isLastStep)}
    >
      {conversations.map((conv, ci) => (
        <div key={ci} className="space-y-4">
          <div className="rounded border border-slate-300 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversation {ci + 1}</p>
            <p className="mt-1 text-sm text-slate-700 italic">{conv.context}</p>
          </div>
          {(conv.questions ?? []).map((sq, qi) => {
            questionNum += 1;
            const num = questionNum;
            return (
              <ListeningMcqBlock
                key={`${ci}-${qi}`}
                number={num}
                prompt={sq.questionText}
                options={(["optionA", "optionB", "optionC"] as const).map((opt, oi) => ({
                  label: LABELS[oi],
                  text: sq[opt],
                }))}
                selected={answers[`${ci}-${qi}`]}
                revealed={showAnswers}
                correctAnswer={sq.correctAnswer}
                onSelect={(label) =>
                  !submitted && setAnswers((prev) => ({ ...prev, [`${ci}-${qi}`]: label }))
                }
              />
            );
          })}
        </div>
      ))}
      {submitted && (
        <SectionOutcome
          revealed={showAnswers}
          deferResults={deferResults}
          isLastStep={isLastStep}
          score={score}
          total={allSubQuestions.length}
          onRetry={onRetry}
        />
      )}
    </ListeningPracticeShell>
  );
}

// ── Listening Part 3 — Note Completion ───────────────────────────────────────

function Listening3Runner({
  question,
  onRetry,
  setIndex,
  totalSets,
  attemptKey = 0,
  onPrevious,
  onNext,
  onAttemptSaved,
}: { question: ListeningQuestion; onRetry: () => void } & ListeningNavProps) {
  const data = normalizeListeningPart3Data(question.questions);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const audioUrl = getAudioUrl(question.audio_path);
  const answers = data?.answers ?? [];
  const score = answers.filter((ans, i) =>
    (inputs[i] ?? "").trim().toLowerCase() === ans.trim().toLowerCase()
  ).length;
  const allFilled = answers.length > 0 && answers.every((_, i) => (inputs[i] ?? "").trim());

  const { handleSubmit, isSubmitting, deferResults, isLastStep } = useMockDeferredPracticeSubmit(
    setSubmitted,
    () => ({
      kind: "gap_fill",
      questionType: "listening_part_3",
      questionSetId: question.id,
      inputs,
      correctAnswers: answers,
    }),
    () =>
      persistAttempt(
        {
          question_type: "listening_part_3",
          question_set_id: question.id,
          score,
          total: answers.length,
        },
        onAttemptSaved,
      ),
  );
  const showAnswers = mockShowAnswers(submitted, deferResults);

  if (!data) {
    return (
      <ListeningPracticeShell
        activePart={3}
        audioUrl={audioUrl}
        audioResetKey={`${question.id}-${attemptKey}`}
        setIndex={setIndex}
        totalSets={totalSets}
        onPrevious={onPrevious}
        onNext={onNext}
      >
        <p className="py-8 text-center text-sm italic text-slate-400">Invalid question data.</p>
      </ListeningPracticeShell>
    );
  }

  const parts = data.questionText.split(/\[___(\d+)___\]/g);

  return (
    <ListeningPracticeShell
      activePart={3}
      audioUrl={audioUrl}
      audioResetKey={`${question.id}-${attemptKey}`}
      setIndex={setIndex}
      totalSets={totalSets}
      onPrevious={onPrevious}
      onNext={onNext}
      footer={practiceTaskFooter({
        canSubmit: allFilled,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep,
        onSubmit: handleSubmit,
        onRedo: onRetry,
      })}
      footerTop={practiceFooterTop(submitted, deferResults, isLastStep)}
    >
      <div className="border border-slate-200 bg-white">
        {data.title && (
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-700">{data.title}</p>
          </div>
        )}
        <div className="px-4 py-5">
          <p className="text-sm text-slate-700 leading-loose">
            {parts.map((part, pi) => {
              if (pi % 2 === 0) return <span key={pi}>{part}</span>;
              const idx = parseInt(part) - 1;
              const correct = answers[idx] ?? "";
              const val = inputs[idx] ?? "";
              const isCorrect = val.trim().toLowerCase() === correct.trim().toLowerCase();
              return (
                <span key={pi} className="inline-flex items-center gap-1 mx-1">
                  <input
                    type="text"
                    disabled={submitted}
                    value={val}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                    placeholder={`(${idx + 1})`}
                    className={cn(
                      "border rounded px-2 py-1 text-sm w-32 text-center",
                      showAnswers
                        ? isCorrect ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-rose-400 bg-rose-50 text-rose-800"
                        : "border-slate-300 bg-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-200",
                    )}
                  />
                  {showAnswers && !isCorrect && (
                    <span className="text-xs text-emerald-700 font-medium">✓ {correct}</span>
                  )}
                </span>
              );
            })}
          </p>
        </div>
      </div>
      {submitted && (
        <SectionOutcome
          revealed={showAnswers}
          deferResults={deferResults}
          isLastStep={isLastStep}
          score={score}
          total={answers.length}
          onRetry={onRetry}
        />
      )}
    </ListeningPracticeShell>
  );
}

// ── Listening Part 4 — Extended Discussion ────────────────────────────────────

function Listening4Runner({
  question,
  onRetry,
  setIndex,
  totalSets,
  attemptKey = 0,
  onPrevious,
  onNext,
  onAttemptSaved,
}: { question: ListeningQuestion; onRetry: () => void } & ListeningNavProps) {
  const data = normalizeListeningPart4Data(question.questions);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const audioUrl = getAudioUrl(question.audio_path);
  const qs = data?.questions ?? [];
  const score = qs.filter((q, i) => answers[i] === q.correctAnswer).length;
  const allAnswered = qs.length > 0 && qs.every((_, i) => answers[i] !== undefined);
  const LABELS = ["A", "B", "C", "D", "E"];

  const { handleSubmit, isSubmitting, deferResults, isLastStep } = useMockDeferredPracticeSubmit(
    setSubmitted,
    () => ({
      kind: "mcq",
      questionType: "listening_part_4",
      questionSetId: question.id,
      answers: Object.fromEntries(
        qs.map((_, i) => [i, answers[i] !== undefined ? LABELS[answers[i]!] : ""]),
      ),
      items: qs.map((q) => ({ correctAnswer: LABELS[q.correctAnswer] })),
    }),
    () =>
      persistAttempt(
        {
          question_type: "listening_part_4",
          question_set_id: question.id,
          score,
          total: qs.length,
        },
        onAttemptSaved,
      ),
  );
  const showAnswers = mockShowAnswers(submitted, deferResults);

  if (!data || qs.length === 0) {
    return (
      <ListeningPracticeShell
        activePart={4}
        audioUrl={audioUrl}
        audioResetKey={`${question.id}-${attemptKey}`}
        setIndex={setIndex}
        totalSets={totalSets}
        onPrevious={onPrevious}
        onNext={onNext}
      >
        <p className="py-8 text-center text-sm italic text-slate-400">Invalid question data.</p>
      </ListeningPracticeShell>
    );
  }

  return (
    <ListeningPracticeShell
      activePart={4}
      audioUrl={audioUrl}
      audioResetKey={`${question.id}-${attemptKey}`}
      setIndex={setIndex}
      totalSets={totalSets}
      onPrevious={onPrevious}
      onNext={onNext}
      footer={practiceTaskFooter({
        canSubmit: allAnswered,
        isSubmitting,
        submitted,
        deferResults,
        isLastStep,
        onSubmit: handleSubmit,
        onRedo: onRetry,
        enabled: qs.length > 0,
      })}
      footerTop={practiceFooterTop(submitted, deferResults, isLastStep)}
    >
      {data.description && (
        <div className="rounded border border-slate-300 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700 italic">{data.description}</p>
        </div>
      )}
      {qs.map((q, qi) => (
        <ListeningMcqBlock
          key={qi}
          number={qi + 1}
          prompt={q.questionText}
          options={(q.options ?? []).map((opt, oi) => ({ label: LABELS[oi], text: opt }))}
          selected={answers[qi] !== undefined ? LABELS[answers[qi]] : undefined}
          revealed={showAnswers}
          correctAnswer={LABELS[q.correctAnswer]}
          onSelect={(label) => {
            const idx = LABELS.indexOf(label);
            if (!submitted && idx >= 0) setAnswers((prev) => ({ ...prev, [qi]: idx }));
          }}
        />
      ))}
      {submitted && (
        <SectionOutcome
          revealed={showAnswers}
          deferResults={deferResults}
          isLastStep={isLastStep}
          score={score}
          total={qs.length}
          onRetry={onRetry}
        />
      )}
    </ListeningPracticeShell>
  );
}

// ── Listening Section Router ──────────────────────────────────────────────────

export function ListeningSection({
  part,
  questionIndex = 1,
  totalSets,
  attemptKey = 0,
  onRetry,
  onPrevious,
  onNext,
  onAttemptSaved,
  fixedQuestion,
}: {
  part: string;
  questionIndex?: number;
  totalSets?: number;
  attemptKey?: number;
  onRetry?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onAttemptSaved?: () => void;
  fixedQuestion?: ListeningQuestion;
}) {
  const partNum = parseInt(part) || 1;

  const q = useQuery({
    queryKey: ["practice", "listening", partNum],
    queryFn: async () => {
      const res = await api.listening.list({ part_number: partNum, page: 1, limit: 500 });
      return res.data?.questions ?? [];
    },
    enabled: !fixedQuestion,
  });

  const questions = fixedQuestion ? [fixedQuestion] : (q.data ?? []);
  const question = questions[questionIndex - 1];
  const runnerKey = `${question?.id ?? "none"}-${attemptKey}`;
  const navProps: ListeningNavProps = {
    setIndex: questionIndex,
    totalSets: totalSets ?? questions.length,
    attemptKey,
    onPrevious,
    onNext,
    onAttemptSaved,
  };

  if (!fixedQuestion && q.isLoading) return <LoadingState />;
  if (!question) return <EmptyState label={`Listening Part ${part}`} />;

  if (partNum === 1) return <Listening1Runner key={runnerKey} question={question} onRetry={() => onRetry?.()} {...navProps} />;
  if (partNum === 2) return <Listening2Runner key={runnerKey} question={question} onRetry={() => onRetry?.()} {...navProps} />;
  if (partNum === 3) return <Listening3Runner key={runnerKey} question={question} onRetry={() => onRetry?.()} {...navProps} />;
  if (partNum === 4) return <Listening4Runner key={runnerKey} question={question} onRetry={() => onRetry?.()} {...navProps} />;
  return <EmptyState label={`Listening Part ${part}`} />;
}

