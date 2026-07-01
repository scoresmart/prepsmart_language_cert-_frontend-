import { Bookmark } from "lucide-react";
import { ExaminerAudioBox } from "@/components/practice/speaking/ExaminerAudioBox";
import { UserRecordingBox, type RecordingPhase } from "@/components/practice/speaking/UserRecordingBox";
import type { NormalizedSpeakingQuestion } from "@/lib/speakingQuestionStructure";
import { cn } from "@/lib/utils";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://sepzceaicoldqhyxxzff.supabase.co";

function levelBadgeClass(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("hard") || l === "b2" || l === "c1" || l === "c2") return "bg-rose-100 text-rose-700";
  if (l.includes("medium") || l === "b1") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

type Props = {
  question: NormalizedSpeakingQuestion;
  questionIndex: number;
  totalSets: number;
  attemptKey: number;
  phase: RecordingPhase;
  prepareSecondsLeft: number;
  recordSecondsLeft: number;
  maxDuration: number;
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 sm:text-xs">
                Q <span className="font-bold text-slate-900">{questionIndex}</span>/{totalSets}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize sm:text-xs",
                  levelBadgeClass(question.level),
                )}
              >
                {question.level}
              </span>
            </div>
            <h3 className="text-sm font-bold leading-snug text-slate-900">{question.title}</h3>
          </div>
          <Bookmark className="size-3.5 shrink-0 text-slate-300" />
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap sm:text-sm">
          {question.content}
        </p>
        {imageSrc && (
          <img src={imageSrc} alt="" className="mt-1.5 max-h-16 w-full rounded-md object-contain" />
        )}
      </div>

      {/* Examiner on top, your recording below — equal height, always visible */}
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-2">
        <ExaminerAudioBox
          key={`${question.id}-${attemptKey}-examiner`}
          src={question.audio_url}
          autoPlay
          compact
          className="min-h-0"
          onPlayingChange={onExaminerPlaying}
          onEnded={onStartPreparing}
        />
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
      </div>
    </div>
  );
}
