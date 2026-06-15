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
  onStartPreparing: () => void;
  onStartRecording: () => void;
  onRecordingComplete: (blob: Blob) => void;
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
  onStartPreparing,
  onStartRecording,
  onRecordingComplete,
}: Props) {
  const imageSrc = question.image_url
    ? question.image_url.startsWith("http")
      ? question.image_url
      : `${SUPABASE_URL}/storage/v1/object/public/writing-task-images/${question.image_url}`
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm">
          Question <span className="font-bold text-slate-900">{questionIndex}</span>
          <span className="text-slate-400"> / </span>
          <span className="font-medium text-slate-600">{totalSets}</span>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
            levelBadgeClass(question.level),
          )}
        >
          {question.level}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug text-slate-900">{question.title}</h3>
        <Bookmark className="size-4 shrink-0 text-slate-300" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm">
        {question.content}
      </div>

      {imageSrc && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <img
            src={imageSrc}
            alt=""
            className="mx-auto max-h-40 w-full rounded-lg object-contain"
          />
        </div>
      )}

      <ExaminerAudioBox
        key={`${question.id}-${attemptKey}`}
        src={question.audio_url}
        autoPlay
        onEnded={onStartPreparing}
      />

      <UserRecordingBox
        phase={phase}
        prepareSecondsLeft={prepareSecondsLeft}
        recordSecondsLeft={recordSecondsLeft}
        maxDuration={maxDuration}
        onStartRecording={onStartRecording}
        onRecordingComplete={onRecordingComplete}
      />
    </div>
  );
}
