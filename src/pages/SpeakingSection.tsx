import * as React from "react";

import { useQuery } from "@tanstack/react-query";

import { Loader2, RotateCcw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { api } from "@/lib/api";

import { PRACTICE_TIPS } from "@/lib/practiceTips";

import { saveLocalRecording } from "@/lib/practiceAttemptStorage";

import { fetchPracticeQuestions, type SpeakingQuestion } from "@/lib/practiceQuestions";

import {

  SPEAKING_PREP_SECONDS,

  SPEAKING_RECORD_SECONDS,

} from "@/lib/speakingInstructions";

import { normalizeSpeakingQuestion } from "@/lib/speakingQuestionStructure";

import { SpeakingPracticeShell } from "@/components/practice/speaking/SpeakingPracticeShell";

import { useSpeakingPracticeStateOptional } from "@/components/practice/speaking/SpeakingPracticeContext";

import { SpeakingQuestionPanel } from "@/components/practice/speaking/SpeakingQuestionPanel";

import { SpeakingSidebar } from "@/components/practice/speaking/SpeakingSidebar";

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

) {

  try {

    await api.practice.saveAttempt(body);

    onAttemptSaved?.();

  } catch {

    /* silent */

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



  const [phase, setPhase] = React.useState<RecordingPhase>("waiting");

  const [prepareLeft, setPrepareLeft] = React.useState(SPEAKING_PREP_SECONDS);

  const [recordLeft, setRecordLeft] = React.useState(SPEAKING_RECORD_SECONDS);

  const [recordingBlob, setRecordingBlob] = React.useState<Blob | null>(null);

  const [submitting, setSubmitting] = React.useState(false);

  const [submitted, setSubmitted] = React.useState(false);

  const speakingPractice = useSpeakingPracticeStateOptional();

  const setSpeakingPracticeState = speakingPractice?.setState;



  React.useEffect(() => {

    setSpeakingPracticeState?.({

      phase,

      prepareSecondsLeft: prepareLeft,

      recordSecondsLeft: recordLeft,

      maxDuration: SPEAKING_RECORD_SECONDS,

    });

  }, [phase, prepareLeft, recordLeft, setSpeakingPracticeState]);



  React.useEffect(() => {

    if (!question) return;

    setPhase("waiting");

    setPrepareLeft(SPEAKING_PREP_SECONDS);

    setRecordLeft(SPEAKING_RECORD_SECONDS);

    setRecordingBlob(null);

    setSubmitted(false);

  }, [question?.id, attemptKey]);



  const startPreparing = React.useCallback(() => {

    setPhase("preparing");

    setPrepareLeft(SPEAKING_PREP_SECONDS);

  }, []);



  const handleStartRecording = React.useCallback(() => {

    setPhase("recording");

    setRecordLeft(SPEAKING_RECORD_SECONDS);

  }, []);



  React.useEffect(() => {

    if (phase !== "preparing") return;

    if (prepareLeft <= 0) {

      handleStartRecording();

      return;

    }

    const t = window.setTimeout(() => setPrepareLeft((s) => s - 1), 1000);

    return () => window.clearTimeout(t);

  }, [phase, prepareLeft, handleStartRecording]);



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

    if (recordingBlob) {

      await saveLocalRecording(question.id, recordingBlob);

    }

    await persistAttempt(

      {

        question_type: `speaking_part_${part}`,

        question_set_id: question.id,

        score: 0,

        total: question.max_score,

      },

      onAttemptSaved,

    );

    setSubmitted(true);

    setSubmitting(false);

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
        {submitting ? "Submitting…" : submitted ? "Submitted" : "Submit"}
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

        maxDuration={SPEAKING_RECORD_SECONDS}

        onStartPreparing={startPreparing}

        onStartRecording={handleStartRecording}

        onRecordingComplete={handleRecordingComplete}

      />



      <div className="mx-auto w-full max-w-3xl md:hidden">

        <SpeakingSidebar

          tips={PRACTICE_TIPS.speaking}

          phase={phase}

          prepareSecondsLeft={prepareLeft}

          recordSecondsLeft={recordLeft}

          maxDuration={SPEAKING_RECORD_SECONDS}

          className="mt-2 rounded-xl border border-slate-200"

        />

      </div>

    </SpeakingPracticeShell>

  );

}



export function SpeakingSection(props: SectionProps) {

  return <SpeakingRunner {...props} />;

}

