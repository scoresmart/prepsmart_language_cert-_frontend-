import * as React from "react";

import { useQuery } from "@tanstack/react-query";

import { Loader2, RotateCcw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { api } from "@/lib/api";

import { PRACTICE_TIPS } from "@/lib/practiceTips";

import { saveLocalRecording } from "@/lib/practiceAttemptStorage";
import { notifyMockTestScoreFromAttempt, notifyMockSpeakingAiScore } from "@/lib/mockTestRecorder";
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

import { useSpeakingPracticeStateOptional } from "@/components/practice/speaking/SpeakingPracticeContext";

import { SpeakingQuestionPanel } from "@/components/practice/speaking/SpeakingQuestionPanel";

import { SpeakingSidebar } from "@/components/practice/speaking/SpeakingSidebar";

import { PracticeScoreResult } from "@/components/practice/PracticeScoreResult";

import type { ScoringPhase, SpeakingScoreResult } from "@/lib/scoringTypes";

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

  const [micStream, setMicStream] = React.useState<MediaStream | null>(null);

  const micStreamRef = React.useRef<MediaStream | null>(null);

  const [micReady, setMicReady] = React.useState(false);

  const [micError, setMicError] = React.useState<string | null>(null);

  const [submitting, setSubmitting] = React.useState(false);

  const [submitted, setSubmitted] = React.useState(false);

  const [scoringPhase, setScoringPhase] = React.useState<ScoringPhase>("idle");

  const [speakingScore, setSpeakingScore] = React.useState<SpeakingScoreResult | null>(null);

  const [scoringError, setScoringError] = React.useState<string | null>(null);

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

    setSubmitted(false);

    setScoringPhase("idle");

    setSpeakingScore(null);

    setScoringError(null);

    stopMic();

    setMicError(null);

  }, [question?.id, attemptKey, stopMic, partTiming.prepSeconds, partTiming.recordSeconds]);



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

      setPhase("recorded");

      return;

    }

    const t = window.setTimeout(() => setRecordLeft((s) => s - 1), 1000);

    return () => window.clearTimeout(t);

  }, [phase, recordLeft]);



  const handleRecordingComplete = React.useCallback((blob: Blob) => {

    setRecordingBlob(blob.size > 0 ? blob : null);

    setPhase("recorded");

  }, []);



  const handleSubmit = async () => {

    if (!question || submitting) return;

    setSubmitting(true);

    setSubmitted(true);

    setScoringPhase("scoring");

    setSpeakingScore(null);

    setScoringError(null);

    if (recordingBlob) {

      await saveLocalRecording(question.id, recordingBlob);

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

      if (!recordingBlob || recordingBlob.size === 0) {

        throw new Error("No recording found. Please record your answer before submitting.");

      }

      const formData = new FormData();

      formData.append("audio", recordingBlob, "recording.webm");

      formData.append("level", question.level);

      formData.append("task_description", `${question.title}\n\n${question.content}`);

      if (attemptId) formData.append("attempt_id", attemptId);

      const res = await api.scoring.speakingAudio(formData);

      setSpeakingScore(res.data);

      notifyMockSpeakingAiScore(part, res.data.scores.scaledTotal);

      setScoringPhase("done");

    } catch (error) {

      setScoringError(error instanceof Error ? error.message : "Scoring failed");

      setScoringPhase("error");

    } finally {

      setSubmitting(false);

    }

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



  const footer = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={phase !== "recorded" || submitting || submitted}
        className="gap-2 bg-violet-600 hover:bg-violet-700"
      >
        <Send className="size-4" />
        {submitting ? "Submitting…" : submitted ? (scoringPhase === "scoring" ? "Scoring…" : "Submitted") : "Submit"}
      </Button>
      <Button type="button" variant="outline" onClick={() => { onRetry(); }} className="gap-2">
        <RotateCcw className="size-4" />
        Re-do
      </Button>
    </div>
  );



  return (

    <SpeakingPracticeShell

      activePart={part}

      level={question.level}

      setIndex={questionIndex}

      totalSets={totalSets}

      onPrevious={onPrevious}

      onNext={onNext}

      footer={footer}

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

      />



      {submitted && (

        <div className="mx-auto mt-4 w-full max-w-3xl px-1">

          <PracticeScoreResult

            phase={scoringPhase}

            error={scoringError}

            speaking={speakingScore}

          />

        </div>

      )}



      <div className="mx-auto w-full max-w-3xl md:hidden">

        <SpeakingSidebar

          tips={PRACTICE_TIPS.speaking}

          phase={phase}

          prepareSecondsLeft={prepareLeft}

          recordSecondsLeft={recordLeft}

          maxDuration={partTiming.recordSeconds}

          className="mt-2 rounded-xl border border-slate-200"

        />

      </div>

    </SpeakingPracticeShell>

  );

}



export function SpeakingSection(props: SectionProps) {

  return <SpeakingRunner {...props} />;

}

