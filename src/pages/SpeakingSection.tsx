import * as React from "react";

import { useQuery } from "@tanstack/react-query";

import { Loader2 } from "lucide-react";

import { api } from "@/lib/api";

import { saveLocalRecording, getLocalRecording } from "@/lib/practiceAttemptStorage";
import { normalizeCefrLevel } from "@/lib/normalizeCefrLevel";
import { convertBlobToWav16kMono } from "@/lib/convertRecordingToWav";
import { notifyMockTestScoreFromAttempt, notifyMockSpeakingAiScore, completeMockSectionSubmit, isMockDeferScoring } from "@/lib/mockTestRecorder";
import { MockSectionSavedNotice } from "@/components/mock-test/MockSectionSavedNotice";
import { useMockTestRunOptional } from "@/providers/MockTestRunContext";
import {
  isMicrophoneStreamActive,
  microphoneErrorMessage,
  requestMicrophoneAccess,
  stopMicrophoneStream,
} from "@/lib/microphoneAccess";

import { fetchPracticeQuestions, type SpeakingQuestion } from "@/lib/practiceQuestions";

import type { SpeakingSet } from "@/lib/api";
import {
  flattenPartPrompts,
  flatPromptToPracticeQuestion,
  getSetPromptProgress,
  type SpeakingSetPracticeQuestion,
} from "@/lib/speakingSetStructure";

import {

  getSpeakingPartTiming,

} from "@/lib/speakingInstructions";

import { normalizeSpeakingQuestion } from "@/lib/speakingQuestionStructure";

import { SpeakingPracticeShell } from "@/components/practice/speaking/SpeakingPracticeShell";

import { useSpeakingPracticeStateOptional, SpeakingSidebarPanel } from "@/components/practice/speaking/SpeakingPracticeContext";

import { SpeakingQuestionPanel } from "@/components/practice/speaking/SpeakingQuestionPanel";

import { PracticeScoringDialog } from "@/components/practice/PracticeScoringDialog";
import { SpeakingSetScorecardDialog } from "@/components/practice/speaking/SpeakingSetScorecardDialog";
import { PracticeTaskFooterActions, PracticeNavButton } from "@/components/practice/PracticeActionButtons";
import { useSubmitLock } from "@/hooks/useSubmitLock";

import type { ScoringPhase, SpeakingScoreResult } from "@/lib/scoringTypes";
import { extractReadAloudText } from "@/lib/speakingScoreUtils";
import {
  kindInstruction,
  loadSpeakingSetScores,
  saveSpeakingSetPromptScore,
  type SpeakingSetPromptScoreEntry,
} from "@/lib/speakingSetScoreStorage";

import type { RecordingPhase } from "@/components/practice/speaking/UserRecordingBox";



type SectionProps = {

  part: string;

  questionIndex: number;

  totalSets: number;

  attemptKey: number;

  onRetry: () => void;

  onPrevious?: () => void;

  onNext?: () => void;

  onAttemptSaved?: () => void;

};



async function persistAttempt(

  body: { question_type: string; question_set_id: string; score: number; total: number },

  onAttemptSaved?: () => void,

): Promise<string | null> {

  try {

    const res = await api.practice.saveAttempt(body);

    notifyMockTestScoreFromAttempt(body.question_type, body.score, body.total);

    onAttemptSaved?.();

    return res.data?.id ?? null;

  } catch {

    return null;

  }

}



function SpeakingRunner({

  part,

  questionIndex,

  totalSets,

  attemptKey,

  onRetry,

  onPrevious,

  onNext,

  onAttemptSaved,

}: SectionProps) {

  const [promptIndex, setPromptIndex] = React.useState(0);
  const [promptRevision, setPromptRevision] = React.useState(0);

  const q = useQuery({

    queryKey: ["speaking-runner", part, questionIndex, promptIndex],

    queryFn: async () => {

      const items = await fetchPracticeQuestions("speaking", part);

      const raw = items[questionIndex - 1]?.raw;

      if (!raw) return undefined;

      if ("structure" in raw && (raw as SpeakingSet).structure) {

        const set = raw as SpeakingSet;

        const prompts = flattenPartPrompts(part, set.structure);

        const prompt = prompts[promptIndex];

        if (!prompt) return undefined;

        return {

          mode: "set" as const,

          set,

          prompts,

          question: flatPromptToPracticeQuestion(set, part, prompt, prompts.length),

        };

      }

      const legacy = raw as SpeakingQuestion;

      return {

        mode: "legacy" as const,

        question: normalizeSpeakingQuestion(legacy, questionIndex),

      };

    },

    staleTime: 5 * 60_000,

  });



  const question = q.data?.mode === "set" ? q.data.question : q.data?.question;

  const speakingSet = q.data?.mode === "set" ? q.data.set : null;

  const prompts = q.data?.mode === "set" ? q.data.prompts : [];

  const hasMorePrompts = q.data?.mode === "set" && promptIndex < prompts.length - 1;

  const setQuestion = question as SpeakingSetPracticeQuestion | undefined;

  const hasMoreRecordingPrompts =
    q.data?.mode === "set" &&
    prompts.slice(promptIndex + 1).some((p) => p.requiresRecording);

  const isLastRecordingInPart =
    q.data?.mode === "set" && Boolean(setQuestion?.prompt?.requiresRecording) && !hasMoreRecordingPrompts;

  const setProgress =
    speakingSet && q.data?.mode === "set"
      ? getSetPromptProgress(speakingSet.structure, part, promptIndex)
      : undefined;

  const requiresRecording =
    q.data?.mode !== "set" || Boolean(setQuestion?.prompt?.requiresRecording);

  const partTiming = React.useMemo(() => {
    if (q.data?.mode === "set" && setQuestion?.prompt) {
      return {
        prepSeconds: setQuestion.prompt.prepSeconds ?? 0,
        recordSeconds: setQuestion.prompt.recordSeconds || 30,
      };
    }
    return getSpeakingPartTiming(part, question?.level);
  }, [q.data?.mode, setQuestion?.prompt, part, question?.level]);

  const [phase, setPhase] = React.useState<RecordingPhase>("waiting");

  const [prepareLeft, setPrepareLeft] = React.useState(partTiming.prepSeconds);

  const [recordLeft, setRecordLeft] = React.useState(partTiming.recordSeconds);

  const [recordingBlob, setRecordingBlob] = React.useState<Blob | null>(null);
  const [playbackStarted, setPlaybackStarted] = React.useState(false);

  const [micStream, setMicStream] = React.useState<MediaStream | null>(null);

  const micStreamRef = React.useRef<MediaStream | null>(null);

  const [micReady, setMicReady] = React.useState(false);

  const [micError, setMicError] = React.useState<string | null>(null);

  const { isSubmitting, runSubmit } = useSubmitLock();
  const mockRun = useMockTestRunOptional();
  const deferResults = isMockDeferScoring();

  const [submitted, setSubmitted] = React.useState(false);
  const [instructionDone, setInstructionDone] = React.useState(false);

  const [scoringPhase, setScoringPhase] = React.useState<ScoringPhase>("idle");

  const [speakingScore, setSpeakingScore] = React.useState<SpeakingScoreResult | null>(null);

  const [recordingUrl, setRecordingUrl] = React.useState<string | null>(null);

  const [scoringError, setScoringError] = React.useState<string | null>(null);

  const scoringInFlightRef = React.useRef(false);
  const stopRecordingRef = React.useRef<(() => void) | null>(null);
  const [scoringDialogOpen, setScoringDialogOpen] = React.useState(false);
  const [setScorecardOpen, setSetScorecardOpen] = React.useState(false);
  const [setScoreEntries, setSetScoreEntries] = React.useState<SpeakingSetPromptScoreEntry[]>([]);
  const pendingScoreCountRef = React.useRef(0);

  const speakingPractice = useSpeakingPracticeStateOptional();

  const setSpeakingPracticeState = speakingPractice?.setState;



  React.useEffect(() => {

    setSpeakingPracticeState?.({

      phase,

      prepareSecondsLeft: prepareLeft,

      recordSecondsLeft: recordLeft,

      maxDuration: partTiming.recordSeconds,

    });

  }, [phase, prepareLeft, recordLeft, partTiming.recordSeconds, setSpeakingPracticeState]);



  const stopMic = React.useCallback(() => {

    stopMicrophoneStream(micStreamRef.current);

    micStreamRef.current = null;

    setMicStream(null);

    setMicReady(false);

  }, []);



  const ensureMicAccess = React.useCallback(async (): Promise<boolean> => {

    if (isMicrophoneStreamActive(micStreamRef.current)) {

      setMicReady(true);

      setMicError(null);

      return true;

    }



    stopMic();



    try {

      const stream = await requestMicrophoneAccess();

      micStreamRef.current = stream;

      setMicStream(stream);

      setMicReady(true);

      setMicError(null);

      return true;

    } catch (error) {

      setMicError(microphoneErrorMessage(error));

      setMicReady(false);

      return false;

    }

  }, [stopMic]);



  React.useEffect(() => {

    setPromptIndex(0);

    setPromptRevision(0);

  }, [questionIndex, attemptKey, part]);



  React.useEffect(() => {

    if (!question) return;

    setPhase("waiting");

    setPrepareLeft(partTiming.prepSeconds);

    setRecordLeft(partTiming.recordSeconds);

    setRecordingBlob(null);
    setPlaybackStarted(false);

    setSubmitted(false);
    setInstructionDone(false);

    setScoringPhase("idle");

    setSpeakingScore(null);

    setScoringError(null);

    setScoringDialogOpen(false);

    setRecordingUrl(null);

    scoringInFlightRef.current = false;

    stopMic();

    setMicError(null);

  }, [question?.id, attemptKey, promptRevision, stopMic, partTiming.prepSeconds, partTiming.recordSeconds]);

  React.useEffect(() => () => stopMic(), [stopMic]);

  const startPreparing = React.useCallback(() => {
    if (!requiresRecording) {
      setInstructionDone(true);
      return;
    }

    setPhase("preparing");
    setPrepareLeft(partTiming.prepSeconds);
    void ensureMicAccess();
  }, [ensureMicAccess, partTiming.prepSeconds, requiresRecording]);

  React.useEffect(() => {
    if (!requiresRecording && question && !question.audio_url) {
      setInstructionDone(true);
    }
  }, [requiresRecording, question?.id, question?.audio_url]);

  // Recording prompts with no examiner audio still need prep/record flow
  React.useEffect(() => {
    if (!question || !requiresRecording || phase !== "waiting") return;
    if (!question.audio_url) {
      startPreparing();
    }
  }, [question?.id, question?.audio_url, requiresRecording, phase, startPreparing]);

  React.useEffect(() => {
    if (submitted && !deferResults && scoringPhase !== "idle" && !speakingSet) {
      setScoringDialogOpen(true);
    }
  }, [submitted, deferResults, scoringPhase, speakingSet]);

  React.useEffect(() => {
    if (!speakingSet?.id) return;
    const partNum = parseInt(part, 10) || 1;
    setSetScoreEntries(
      loadSpeakingSetScores(speakingSet.id).filter((e) => e.partNumber === partNum),
    );
  }, [speakingSet?.id, part]);

  const revealPartScorecard = React.useCallback(() => {
    if (!speakingSet) return;
    const partNum = parseInt(part, 10) || 1;
    const all = loadSpeakingSetScores(speakingSet.id);
    // After Part 4, show the full set; earlier parts show this part only
    const entries = partNum === 4 ? all : all.filter((e) => e.partNumber === partNum);
    if (!entries.length) return;
    setSetScoreEntries(entries);
    setScoringPhase(pendingScoreCountRef.current > 0 ? "scoring" : "done");
    setSetScorecardOpen(true);
  }, [speakingSet, part]);

  const handleStartRecording = React.useCallback(async () => {

    const ok = await ensureMicAccess();

    if (!ok) return;

    setPhase("recording");

    setRecordLeft(partTiming.recordSeconds);

  }, [ensureMicAccess, partTiming.recordSeconds]);



  React.useEffect(() => {

    if (phase !== "preparing") return;

    if (prepareLeft <= 0) return;

    const t = window.setTimeout(() => setPrepareLeft((s) => s - 1), 1000);

    return () => window.clearTimeout(t);

  }, [phase, prepareLeft]);



  React.useEffect(() => {

    if (phase !== "preparing" || prepareLeft > 0 || !micReady || micError) return;

    void handleStartRecording();

  }, [phase, prepareLeft, micReady, micError, handleStartRecording]);



  React.useEffect(() => {

    if (phase !== "recording") return;

    if (recordLeft <= 0) {
      stopRecordingRef.current?.();
      return;
    }

    const t = window.setTimeout(() => setRecordLeft((s) => s - 1), 1000);

    return () => window.clearTimeout(t);

  }, [phase, recordLeft]);



  const submitRecordingForScoring = React.useCallback(
    async (blob: Blob) => {
      if (!question) return;
      // Legacy single-question mode: block overlapping score requests
      if (!speakingSet && scoringInFlightRef.current) return;

      if (blob.size === 0) {
        setMicError("Recording was empty. Please try again.");
        setPhase("waiting");
        setSubmitted(false);
        return;
      }

      scoringInFlightRef.current = true;
      setSubmitted(true);
      setSpeakingScore(null);
      setScoringError(null);

      await saveLocalRecording(question.id, blob);
      const playback = await getLocalRecording(question.id);
      setRecordingUrl(playback);

      const isSetMode = Boolean(speakingSet);
      // Per-prompt attempt id so each question keeps its own score in the set
      const attemptSetId = question.id;
      const promptMeta = setQuestion?.prompt;
      const revealScorecardNow = isSetMode && isLastRecordingInPart && !hasMorePrompts;

      const deferred = await completeMockSectionSubmit({
        kind: "speaking",
        questionType: `speaking_part_${part}`,
        questionSetId: speakingSet?.id ?? question.id,
        part,
        level: question.level,
        title: question.title,
        content: question.content,
        recordingQuestionId: question.id,
      });
      if (deferred) {
        setScoringPhase("idle");
        scoringInFlightRef.current = false;
        return;
      }

      // Set mode: score on backend quietly; scorecard only after the part is finished
      if (isSetMode) {
        if (revealScorecardNow) {
          setScoringPhase("scoring");
          setSetScorecardOpen(true);
        } else {
          setScoringPhase("idle");
        }
      } else {
        setScoringPhase("scoring");
        setScoringDialogOpen(true);
      }

      pendingScoreCountRef.current += 1;

      let uploadBlob: Blob;
      try {
        uploadBlob = await convertBlobToWav16kMono(blob);
      } catch (convertError) {
        const msg =
          convertError instanceof Error ? convertError.message : "Could not process your recording.";
        pendingScoreCountRef.current = Math.max(0, pendingScoreCountRef.current - 1);
        setScoringError(msg);
        setScoringPhase("error");
        scoringInFlightRef.current = false;
        if (!isSetMode) setScoringDialogOpen(true);
        return;
      }

      const attemptId = await persistAttempt(
        {
          question_type: `speaking_part_${part}`,
          question_set_id: attemptSetId,
          score: 0,
          total: 50,
        },
        onAttemptSaved,
      );

      try {
        const cefrLevel = normalizeCefrLevel(question.level);
        const formData = new FormData();
        formData.append("audio", uploadBlob, "recording.wav");
        formData.append("level", cefrLevel);
        formData.append("task_description", `${question.title}\n\n${question.content}`);
        if (attemptId) formData.append("attempt_id", attemptId);

        const res = await api.scoring.speakingAudio(formData);
        notifyMockSpeakingAiScore(part, res.data.scores.scaledTotal);
        onAttemptSaved?.();

        if (isSetMode && speakingSet && promptMeta) {
          const entry: SpeakingSetPromptScoreEntry = {
            promptKey: question.id,
            partNumber: parseInt(part, 10) || 1,
            promptLabel: promptMeta.promptLabel,
            promptKind: promptMeta.kind,
            title: question.title,
            instruction: kindInstruction(promptMeta.kind),
            score: res.data,
            recordingUrl: playback,
            referenceText:
              promptMeta.kind === "read_aloud"
                ? promptMeta.read_text ?? extractReadAloudText(question.content)
                : null,
          };
          const all = saveSpeakingSetPromptScore(speakingSet.id, entry);
          const partNum = parseInt(part, 10) || 1;
          setSetScoreEntries(
            partNum === 4 ? all : all.filter((e) => e.partNumber === partNum),
          );

          pendingScoreCountRef.current = Math.max(0, pendingScoreCountRef.current - 1);
          if (revealScorecardNow) {
            setScoringPhase(pendingScoreCountRef.current > 0 ? "scoring" : "done");
            setSetScorecardOpen(true);
          } else {
            setScoringPhase("idle");
          }
        } else {
          setSpeakingScore(res.data);
          setScoringPhase("done");
          setScoringDialogOpen(true);
          pendingScoreCountRef.current = Math.max(0, pendingScoreCountRef.current - 1);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Scoring failed";
        pendingScoreCountRef.current = Math.max(0, pendingScoreCountRef.current - 1);

        if (isSetMode && speakingSet && promptMeta) {
          const entry: SpeakingSetPromptScoreEntry = {
            promptKey: question.id,
            partNumber: parseInt(part, 10) || 1,
            promptLabel: promptMeta.promptLabel,
            promptKind: promptMeta.kind,
            title: question.title,
            instruction: kindInstruction(promptMeta.kind),
            score: null,
            error: message,
            recordingUrl: playback,
          };
          const all = saveSpeakingSetPromptScore(speakingSet.id, entry);
          const partNum = parseInt(part, 10) || 1;
          setSetScoreEntries(
            partNum === 4 ? all : all.filter((e) => e.partNumber === partNum),
          );
          if (revealScorecardNow) {
            setScoringError(message);
            setScoringPhase(pendingScoreCountRef.current > 0 ? "scoring" : "done");
            setSetScorecardOpen(true);
          }
        } else {
          setScoringError(message);
          setScoringPhase("error");
          setScoringDialogOpen(true);
        }
      } finally {
        scoringInFlightRef.current = false;
      }
    },
    [
      question,
      part,
      onAttemptSaved,
      speakingSet,
      setQuestion?.prompt,
      isLastRecordingInPart,
      hasMorePrompts,
    ],
  );

  const handleRecordingComplete = React.useCallback(
    (blob: Blob) => {
      const validBlob = blob.size > 0 ? blob : null;
      setRecordingBlob(validBlob);
      setPlaybackStarted(false);
      setPhase("recorded");
    },
    [],
  );

  const advanceToNextPrompt = () => {
    if (!hasMorePrompts) return;
    setPromptIndex((i) => i + 1);
    setPromptRevision((r) => r + 1);
  };

  const finishPartOrAdvance = () => {
    if (hasMorePrompts) {
      advanceToNextPrompt();
      return;
    }
    if (speakingSet) {
      revealPartScorecard();
      return;
    }
    onNext?.();
  };

  const handleSubmit = () => {
    if (!question || submitted || isSubmitting || !recordingBlob || !playbackStarted) return;
    void runSubmit(() => submitRecordingForScoring(recordingBlob));
  };



  if (q.isLoading) {

    return (

      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-slate-400">

        <Loader2 className="size-5 animate-spin" />

        <span className="text-sm">Loading question…</span>

      </div>

    );

  }



  if (!question) {

    return (

      <div className="flex flex-1 items-center justify-center py-24 text-sm text-slate-400">

        No question found.

      </div>

    );

  }



  const footerTop =
    submitted && deferResults ? (
      <div className="mb-2 w-full">
        <MockSectionSavedNotice isLastStep={mockRun?.isLastStep} />
      </div>
    ) : submitted && speakingSet && !isLastRecordingInPart ? (
      <p className="mb-2 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
        Answer saved and scoring on the backend. No score popup yet — your scorecard opens when you
        finish this part (full set scorecard after Part 4).
      </p>
    ) : phase === "recorded" && !playbackStarted && !submitted ? (
      <p className="mb-2 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
        Your recording will play automatically. Submit unlocks once playback starts — you may submit before it finishes.
      </p>
    ) : null;

  const canSubmit = phase === "recorded" && !submitted && Boolean(recordingBlob) && playbackStarted;

  const footer = !requiresRecording ? (
    <PracticeNavButton
      onClick={finishPartOrAdvance}
      disabled={!instructionDone && Boolean(question.audio_url)}
      className="gap-2"
    >
      {hasMorePrompts ? "Continue" : speakingSet ? "View scorecard" : "Finish"}
    </PracticeNavButton>
  ) : submitted && hasMorePrompts ? (
    <PracticeNavButton onClick={advanceToNextPrompt} className="gap-2">
      Next question in set
    </PracticeNavButton>
  ) : submitted && speakingSet && isLastRecordingInPart && !hasMorePrompts ? (
    <PracticeNavButton onClick={revealPartScorecard} className="gap-2">
      View scorecard
    </PracticeNavButton>
  ) : (
    <PracticeTaskFooterActions
      canSubmit={canSubmit}
      isSubmitting={isSubmitting}
      submitted={submitted}
      deferResults={deferResults}
      isLastStep={mockRun?.isLastStep}
      onSubmit={handleSubmit}
      onRedo={() => onRetry()}
      submitVariant="submit"
    />
  );



  return (

    <>

    <PracticeScoringDialog
      open={scoringDialogOpen}
      onOpenChange={setScoringDialogOpen}
      phase={scoringPhase}
      error={scoringError}
      speaking={speakingScore}
      recordingUrl={recordingUrl}
      referenceText={question ? extractReadAloudText(question.content) : null}
    />

    <SpeakingSetScorecardDialog
      open={setScorecardOpen}
      onOpenChange={setSetScorecardOpen}
      phase={scoringPhase}
      error={scoringError}
      setTitle={speakingSet?.title ?? "Speaking set"}
      partLabel={
        parseInt(part, 10) === 4
          ? "Full set results"
          : `Part ${part} results (finish Part 4 for the full set scorecard)`
      }
      entries={setScoreEntries}
    />

    <SpeakingPracticeShell

      activePart={part}

      level={question.level}

      setIndex={questionIndex}

      totalSets={totalSets}

      setProgress={setProgress}

      setTitle={speakingSet?.title}

      promptLabel={setQuestion?.prompt?.promptLabel}

      onPrevious={onPrevious}

      onNext={onNext}

      footer={footer}

      footerTop={footerTop}

      sidebar={<SpeakingSidebarPanel />}

    >

      <SpeakingQuestionPanel
        question={question}
        questionIndex={questionIndex}
        totalSets={totalSets}
        attemptKey={attemptKey + promptRevision}
        phase={phase}
        prepareSecondsLeft={prepareLeft}
        recordSecondsLeft={recordLeft}
        maxDuration={partTiming.recordSeconds}
        promptLabel={setQuestion?.prompt?.promptLabel}
        promptKind={setQuestion?.prompt?.kind}
        requiresRecording={requiresRecording}
        readAloudText={
          setQuestion?.prompt?.kind === "read_aloud" ? setQuestion.prompt.read_text : undefined
        }
        presentationTopic={
          setQuestion?.prompt?.kind === "presentation" ? setQuestion.prompt.topic : undefined
        }
        audioStream={micStream}
        micReady={micReady}
        micError={micError}
        onStartPreparing={startPreparing}
        onStartRecording={() => {
          void handleStartRecording();
        }}
        onRecordingComplete={handleRecordingComplete}
        onRetryMic={() => {
          void ensureMicAccess();
        }}
        onExaminerPlaying={(playing) => {
          if (playing && requiresRecording) void ensureMicAccess();
        }}
        onRegisterRecordingStop={(stop) => {
          stopRecordingRef.current = stop;
        }}
        recordingBlob={recordingBlob}
        onPlaybackStarted={() => setPlaybackStarted(true)}
      />

    </SpeakingPracticeShell>

    </>

  );

}



export function SpeakingSection(props: SectionProps) {

  return <SpeakingRunner {...props} />;

}

