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

import {

  getSpeakingPartTiming,

} from "@/lib/speakingInstructions";

import { normalizeSpeakingQuestion } from "@/lib/speakingQuestionStructure";

import { SpeakingPracticeShell } from "@/components/practice/speaking/SpeakingPracticeShell";

import { useSpeakingPracticeStateOptional, SpeakingSidebarPanel } from "@/components/practice/speaking/SpeakingPracticeContext";

import { SpeakingQuestionPanel } from "@/components/practice/speaking/SpeakingQuestionPanel";

import { PracticeScoringDialog } from "@/components/practice/PracticeScoringDialog";
import { PracticeTaskFooterActions } from "@/components/practice/PracticeActionButtons";
import { useSubmitLock } from "@/hooks/useSubmitLock";

import type { ScoringPhase, SpeakingScoreResult } from "@/lib/scoringTypes";
import { extractReadAloudText } from "@/lib/speakingScoreUtils";

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

  const q = useQuery({

    queryKey: ["speaking-runner", part, questionIndex],

    queryFn: async () => {

      const items = await fetchPracticeQuestions("speaking", part);

      const raw = items[questionIndex - 1]?.raw as SpeakingQuestion | undefined;

      return raw ? normalizeSpeakingQuestion(raw, questionIndex) : undefined;

    },

    staleTime: 5 * 60_000,

  });



  const question = q.data;

  const partTiming = React.useMemo(
    () => getSpeakingPartTiming(part, question?.level),
    [part, question?.level],
  );

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

  const [scoringPhase, setScoringPhase] = React.useState<ScoringPhase>("idle");

  const [speakingScore, setSpeakingScore] = React.useState<SpeakingScoreResult | null>(null);

  const [recordingUrl, setRecordingUrl] = React.useState<string | null>(null);

  const [scoringError, setScoringError] = React.useState<string | null>(null);

  const scoringInFlightRef = React.useRef(false);
  const stopRecordingRef = React.useRef<(() => void) | null>(null);
  const [scoringDialogOpen, setScoringDialogOpen] = React.useState(false);

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

    if (!question) return;

    setPhase("waiting");

    setPrepareLeft(partTiming.prepSeconds);

    setRecordLeft(partTiming.recordSeconds);

    setRecordingBlob(null);
    setPlaybackStarted(false);

    setSubmitted(false);

    setScoringPhase("idle");

    setSpeakingScore(null);

    setScoringError(null);

    setScoringDialogOpen(false);

    setRecordingUrl(null);

    scoringInFlightRef.current = false;

    stopMic();

    setMicError(null);

  }, [question?.id, attemptKey, stopMic, partTiming.prepSeconds, partTiming.recordSeconds]);

  React.useEffect(() => {
    if (submitted && !deferResults && scoringPhase !== "idle") {
      setScoringDialogOpen(true);
    }
  }, [submitted, deferResults, scoringPhase]);

  React.useEffect(() => () => stopMic(), [stopMic]);



  const startPreparing = React.useCallback(() => {

    setPhase("preparing");

    setPrepareLeft(partTiming.prepSeconds);

    void ensureMicAccess();

  }, [ensureMicAccess, partTiming.prepSeconds]);



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
      if (!question || scoringInFlightRef.current) return;

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

      const deferred = await completeMockSectionSubmit({
        kind: "speaking",
        questionType: `speaking_part_${part}`,
        questionSetId: question.id,
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

      setScoringPhase("scoring");

      let uploadBlob: Blob;
      try {
        uploadBlob = await convertBlobToWav16kMono(blob);
      } catch (convertError) {
        const msg =
          convertError instanceof Error ? convertError.message : "Could not process your recording.";
        throw new Error(msg);
      }

      const attemptId = await persistAttempt(
        {
          question_type: `speaking_part_${part}`,
          question_set_id: question.id,
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
        setSpeakingScore(res.data);
        notifyMockSpeakingAiScore(part, res.data.scores.scaledTotal);
        setScoringPhase("done");
        onAttemptSaved?.();
        scoringInFlightRef.current = false;
      } catch (error) {
        setScoringError(error instanceof Error ? error.message : "Scoring failed");
        setScoringPhase("error");
        scoringInFlightRef.current = false;
      }
    },
    [question, part, onAttemptSaved],
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
    ) : phase === "recorded" && !playbackStarted && !submitted ? (
      <p className="mb-2 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
        Your recording will play automatically. Submit unlocks once playback starts — you may submit before it finishes.
      </p>
    ) : null;

  const canSubmit = phase === "recorded" && !submitted && Boolean(recordingBlob) && playbackStarted;

  const footer = (
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

    <SpeakingPracticeShell

      activePart={part}

      level={question.level}

      setIndex={questionIndex}

      totalSets={totalSets}

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
        attemptKey={attemptKey}
        phase={phase}
        prepareSecondsLeft={prepareLeft}
        recordSecondsLeft={recordLeft}
        maxDuration={partTiming.recordSeconds}
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
          if (playing) void ensureMicAccess();
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

