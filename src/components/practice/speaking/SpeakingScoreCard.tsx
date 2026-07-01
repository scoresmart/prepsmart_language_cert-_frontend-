import { Lightbulb, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpeakingScoreResult } from "@/lib/scoringTypes";
import { compareTranscriptToReference } from "@/lib/speakingScoreUtils";
import { CefrLevelBadge, GradeBadge } from "@/components/practice/shared/ScoreCardBadges";
import { ScoreDonut } from "@/components/practice/speaking/ScoreDonut";
type Props = {
  speaking: SpeakingScoreResult;
  recordingUrl?: string | null;
  referenceText?: string | null;
  className?: string;
};

function SectionHeader({ title, score, max }: { title: string; score: number; max: number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
        {score}/{max}
      </span>
    </div>
  );
}

function AdviceBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
      {children}
    </div>
  );
}

export function SpeakingScoreCard({ speaking, recordingUrl, referenceText, className }: Props) {
  const { scores, feedback, grade, transcript } = speaking;
  const wordsSpoken =
    speaking.contentMetrics?.wordsSpoken ?? transcript.trim().split(/\s+/).filter(Boolean).length;
  const wordsToPractice = speaking.wordsToPractice ?? [];
  const referenceMatch = referenceText
    ? compareTranscriptToReference(transcript, referenceText)
    : null;

  const metrics = [
    { label: "Task & Coherence", score: scores.taskFulfilmentCoherence, max: 3 },
    { label: "Grammar", score: scores.grammar, max: 3 },
    { label: "Vocabulary", score: scores.vocabulary, max: 3 },
    { label: "Pronunciation", score: scores.pronunciationFluency, max: 3 },
    { label: "Overall", score: scores.scaledTotal, max: 50 },
  ] as const;

  return (
    <div className={cn("space-y-5", className)}>
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900">AI Score</p>
            <p className="text-xs text-slate-500">LanguageCert speaking performance report</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <CefrLevelBadge level={speaking.level} />
            <div className="flex flex-col items-start sm:items-end">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overall score</p>
              <p className="text-3xl font-black tabular-nums leading-none text-indigo-600">
                {scores.scaledTotal}
                <span className="text-lg font-bold text-slate-400">/50</span>
              </p>
              <GradeBadge grade={grade} className="mt-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {metrics.map(({ label, score, max }) => (
          <ScoreDonut key={label} label={label} score={score} max={max} />
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <SectionHeader title="Task & Coherence" score={scores.taskFulfilmentCoherence} max={3} />
        <AdviceBox>{feedback.taskFulfilmentCoherence}</AdviceBox>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <SectionHeader title="Content & Vocabulary" score={scores.vocabulary} max={3} />
        {referenceMatch && referenceMatch.total > 0 ? (
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Words recognized</p>
              <span className="rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-bold text-white tabular-nums">
                {referenceMatch.percent != null ? `${referenceMatch.percent.toFixed(1)}%` : "—"}
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {referenceMatch.matched}/{referenceMatch.total} words spoken correctly
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-cyan-100">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all"
                style={{ width: `${referenceMatch.percent ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-cyan-900/80">
              Try to capture more words from the read-aloud text. Speak clearly without skipping sections.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Response length</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{wordsSpoken} words spoken</p>
            <p className="mt-1 text-xs text-cyan-900/80">
              Aim for a complete, coherent answer that fully addresses the task prompt.
            </p>
          </div>
        )}
        <AdviceBox>{feedback.vocabulary}</AdviceBox>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <SectionHeader title="Grammar" score={scores.grammar} max={3} />
        <AdviceBox>{feedback.grammar}</AdviceBox>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <SectionHeader title="Pronunciation & Fluency" score={scores.pronunciationFluency} max={3} />
        {wordsToPractice.length > 0 ? (
          <>
            <p className="text-xs font-medium text-slate-600">
              {wordsToPractice.length} word{wordsToPractice.length === 1 ? "" : "s"} need pronunciation practice.
            </p>
            <div className="space-y-2">
              {wordsToPractice.map((item) => (
                <div
                  key={item.word}
                  className="flex flex-col gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-800">{item.word}</p>
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-amber-700/90">
                      <Lightbulb className="mt-0.5 size-3 shrink-0" />
                      {item.tip}
                    </p>
                  </div>
                  {recordingUrl && (
                    <a
                      href={recordingUrl}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      <Mic className="size-3" />
                      How I said it
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <AdviceBox>{feedback.pronunciationFluency}</AdviceBox>
        )}
        {wordsToPractice.length > 0 && (
          <AdviceBox>{feedback.pronunciationFluency}</AdviceBox>
        )}
      </div>

      {(recordingUrl || transcript) && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          {recordingUrl && (
            <div>
              <p className="text-xs font-semibold text-slate-700">Your recording</p>
              <audio controls src={recordingUrl} className="mt-2 w-full" preload="metadata" />
            </div>
          )}
          {transcript && (
            <div>
              <p className="text-xs font-semibold text-slate-700">Transcript</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{transcript}</p>
            </div>
          )}
          {speaking.durationSeconds > 0 && (
            <p className="text-[11px] text-slate-500">
              Duration: {speaking.durationSeconds.toFixed(1)}s · Recognition confidence:{" "}
              {Math.round(speaking.transcriptionConfidence * 100)}%
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <p className="text-xs font-semibold text-indigo-900">Overall feedback</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{feedback.overall}</p>
        <p className="mt-2 text-xs text-indigo-800/80">
          Scored at <span className="font-black text-indigo-900">{speaking.level}</span> level · Raw score {scores.rawTotal}/12 ·
          Scaled {scores.scaledTotal}/50 · Result: <span className="font-semibold">{grade}</span>
          {grade === "High Pass" && " (38+)"}
          {grade === "Pass" && " (25–37)"}
          {grade === "Below Pass" && " (below 25)"}
        </p>
      </div>
    </div>
  );
}
