import { Bookmark } from "lucide-react";
import { ExaminerAudioBox } from "@/components/practice/speaking/ExaminerAudioBox";
import { UserRecordingBox, type RecordingPhase } from "@/components/practice/speaking/UserRecordingBox";
import type { NormalizedSpeakingQuestion } from "@/lib/speakingQuestionStructure";
import type { SpeakingPromptKind } from "@/lib/speakingSetStructure";
import { cn } from "@/lib/utils";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://sepzceaicoldqhyxxzff.supabase.co";

function levelBadgeClass(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("hard") || l === "b2" || l === "c1" || l === "c2")
    return "border-rose-200 bg-rose-50 text-rose-600";
  if (l.includes("medium") || l === "b1") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

type Props = {
  question: NormalizedSpeakingQuestion;
  /** Kept for call-site parity — the part banner now lives in the shell header. */
  part?: string;
  questionIndex: number;
  totalSets: number;
  attemptKey: number;
  phase: RecordingPhase;
  prepareSecondsLeft: number;
  recordSecondsLeft: number;
  maxDuration: number;
  promptLabel?: string;
  promptKind?: SpeakingPromptKind;
  requiresRecording?: boolean;
  readAloudText?: string;
  presentationTopic?: string;
  audioStream?: MediaStream | null;
  micReady?: boolean;
  micError?: string | null;
  onStartPreparing: () => void;
  onStartRecording: () => void;
  onRecordingComplete: (blob: Blob) => void;
  onRetryMic?: () => void;
  onExaminerPlaying?: (playing: boolean) => void;
  onRegisterRecordingStop?: (stop: (() => void) | null) => void;
  recordingBlob?: Blob | null;
  onPlaybackStarted?: () => void;
};

export function SpeakingQuestionPanel({
  question,
  questionIndex,
  totalSets,
  attemptKey,
  phase,
  prepareSecondsLeft,
  recordSecondsLeft,
  maxDuration,
  promptLabel,
  promptKind,
  requiresRecording = true,
  readAloudText,
  presentationTopic,
  audioStream,
  micReady,
  micError,
  onStartPreparing,
  onStartRecording,
  onRecordingComplete,
  onRetryMic,
  onExaminerPlaying,
  onRegisterRecordingStop,
  recordingBlob,
  onPlaybackStarted,
}: Props) {
  const imageSrc = question.image_url
    ? question.image_url.startsWith("http")
      ? question.image_url
      : `${SUPABASE_URL}/storage/v1/object/public/writing-task-images/${question.image_url}`
    : null;

  const showPrepareClock = phase === "preparing" && prepareSecondsLeft > 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto pb-1">
      {/* The gradient task banner lives in the shell header. */}

      {/* Gap, then the question numbering box */}
      <div className="mt-4 shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs font-semibold text-slate-500 sm:text-sm">Question</span>
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold tabular-nums text-indigo-700 sm:text-sm">
            {questionIndex} / {totalSets}
          </span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize sm:text-xs",
              levelBadgeClass(question.level),
            )}
          >
            {question.level}
          </span>
          {promptLabel && (
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-800 sm:text-xs">
              {promptLabel}
            </span>
          )}
        </div>
      </div>

      {/* Gap, then the question itself */}
      <div className="mt-5 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold leading-snug text-slate-900 sm:text-base">
            {question.title}
          </h3>
          <Bookmark className="size-4 shrink-0 text-slate-300" />
        </div>

        {showPrepareClock && (
          <p className="mt-3 text-sm font-semibold tabular-nums text-rose-600">
            Prepare: {formatClock(prepareSecondsLeft)}
          </p>
        )}

        {question.content && (
          <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-600 sm:text-sm">
            {question.content}
          </p>
        )}

        {readAloudText && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 sm:px-6 sm:py-5">
            <p className="whitespace-pre-wrap text-justify text-sm leading-7 text-slate-800 sm:text-base sm:leading-8">
              {readAloudText}
            </p>
            <p className="mt-3 text-right text-[10px] text-slate-400 sm:text-xs">
              Read the text aloud as naturally and clearly as possible
            </p>
          </div>
        )}

        {presentationTopic && (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-xs">
              Presentation topic
            </p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-800 sm:text-base">
              {presentationTopic}
            </p>
          </div>
        )}

        {promptKind === "follow_up" && (
          <p className="mt-3 text-[10px] font-medium text-cyan-700 sm:text-xs">
            Answer the examiner&apos;s follow-up question below after listening to the audio.
          </p>
        )}

        {imageSrc && (
          <img src={imageSrc} alt="" className="mt-3 max-h-32 w-full rounded-xl object-contain" />
        )}
      </div>

      {/* Gap, then examiner audio on top and your recording below */}
      <div
        className={cn(
          "mt-5 grid min-h-0 flex-1 gap-3 pb-1",
          requiresRecording ? "min-h-[22rem] grid-rows-2" : "min-h-[11rem] grid-rows-1",
        )}
      >
        <ExaminerAudioBox
          key={`${question.id}-${attemptKey}-examiner`}
          src={question.audio_url || null}
          autoPlay
          compact
          className="min-h-0"
          onPlayingChange={onExaminerPlaying}
          onEnded={onStartPreparing}
        />
        {requiresRecording ? (
          <UserRecordingBox
            phase={phase}
            prepareSecondsLeft={prepareSecondsLeft}
            recordSecondsLeft={recordSecondsLeft}
            maxDuration={maxDuration}
            audioStream={audioStream}
            micReady={micReady}
            micError={micError}
            compact
            className="min-h-0"
            onStartRecording={onStartRecording}
            onRecordingComplete={onRecordingComplete}
            onRetryMic={onRetryMic}
            onRegisterStop={onRegisterRecordingStop}
            recordingBlob={recordingBlob}
            onPlaybackStarted={onPlaybackStarted}
          />
        ) : (
          <div className="flex min-h-0 items-center justify-center rounded-xl border border-dashed border-cyan-200 bg-cyan-50/40 px-3 py-4 text-center">
            <p className="text-xs font-medium text-cyan-800 sm:text-sm">
              Listen to the examiner, then tap Continue to proceed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
