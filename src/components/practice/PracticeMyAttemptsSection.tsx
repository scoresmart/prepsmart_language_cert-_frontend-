import * as React from "react";
import { format } from "date-fns";
import { History, User } from "lucide-react";
import { PracticeScoringDialog } from "@/components/practice/PracticeScoringDialog";
import { SpeakingAttemptAudioPlayer } from "@/components/practice/speaking/SpeakingAttemptAudioPlayer";
import { getLocalAnswer, getLocalRecording } from "@/lib/practiceAttemptStorage";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthContext";
import { cn } from "@/lib/utils";
import type { PracticeQuestionItem } from "@/lib/practiceQuestions";
import { resolveAttemptScore } from "@/lib/performanceAnalytics";
import {
  SPEAKING_PART_ABBREV,
  speakingPartFromQuestionType,
} from "@/lib/speakingInstructions";
import type { ScoringPhase, SpeakingScoreResult, WritingScoreResult } from "@/lib/scoringTypes";

export type PracticeAttemptRow = {
  id: string;
  question_type: string;
  question_set_id: string;
  score: number;
  total: number;
  score_details?: object | null;
  scoring_status?: string | null;
  created_at: string;
};

type Props = {
  module: string;
  questions: PracticeQuestionItem[];
  attempts: PracticeAttemptRow[];
  currentQuestionId?: string;
  onSelectQuestion: (index: number) => void;
};

function asSpeakingScore(details: unknown): SpeakingScoreResult | null {
  if (!details || typeof details !== "object") return null;
  const d = details as SpeakingScoreResult;
  return d.type === "speaking" ? d : null;
}

function asWritingScore(details: unknown): WritingScoreResult | null {
  if (!details || typeof details !== "object") return null;
  const d = details as WritingScoreResult;
  return d.type === "writing" ? d : null;
}

function scorePercent(score: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((score / total) * 100);
}

function scoreColorClass(score: number, total: number): string {
  if (total <= 0) return "text-slate-500";
  const ratio = score / total;
  if (ratio >= 0.7) return "text-emerald-600";
  if (ratio >= 0.5) return "text-amber-600";
  return "text-rose-600";
}

function BasicAttemptScore({ score, total }: { score: number; total: number }) {
  const pct = scorePercent(score, total);
  const color = scoreColorClass(score, total);

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-xs font-medium text-slate-600">Score</span>
      <span className={cn("text-sm font-bold tabular-nums", color)}>
        {score}/{total}
      </span>
      <span className={cn("text-xs font-semibold tabular-nums", color)}>({pct}%)</span>
    </div>
  );
}

function ScoreInfoBadge({
  score,
  total,
  onClick,
  disabled,
}: {
  score: number;
  total: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  const scoreColor =
    total > 0 && score / total >= 0.7 ? "text-emerald-600" : "text-amber-700";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-full border border-teal-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      Score Info
      <span className={cn("font-bold tabular-nums", scoreColor)}>
        {score}/{total}
      </span>
    </button>
  );
}

function TaskTypeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-teal-300 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700">
      {label}
    </span>
  );
}

function SpeakingAttemptItem({
  attempt,
  displayName,
  initials,
  onOpenScoreInfo,
}: {
  attempt: PracticeAttemptRow;
  displayName: string;
  initials: string;
  onOpenScoreInfo: (attempt: PracticeAttemptRow) => void;
}) {
  const [audioSrc, setAudioSrc] = React.useState<string | null>(null);
  const part = speakingPartFromQuestionType(attempt.question_type);
  const taskAbbrev = part ? (SPEAKING_PART_ABBREV[part] ?? `S${part}`) : "SP";
  const speakingDetails = asSpeakingScore(attempt.score_details);
  const remoteRecording = speakingDetails?.recordingUrl ?? null;
  const { score: displayScore, total: displayTotal } = resolveAttemptScore(attempt);

  React.useEffect(() => {
    if (remoteRecording) {
      setAudioSrc(remoteRecording);
      return;
    }
    let active = true;
    void getLocalRecording(attempt.question_set_id).then((url) => {
      if (active) setAudioSrc(url);
    });
    return () => {
      active = false;
    };
  }, [attempt.question_set_id, remoteRecording]);

  return (
    <li className="border-b border-slate-100 px-4 py-4 last:border-b-0">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
          <User className="size-3" />
          Me
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-800">{displayName}</p>
          <p className="text-xs text-slate-500">{format(new Date(attempt.created_at), "yyyy-MM-dd")}</p>
        </div>
      </div>
      {audioSrc && (
        <div className="mt-3">
          <SpeakingAttemptAudioPlayer src={audioSrc} />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TaskTypeBadge label={taskAbbrev} />
        {displayTotal > 0 && (
          <ScoreInfoBadge
            score={displayScore}
            total={displayTotal}
            onClick={() => onOpenScoreInfo(attempt)}
            disabled={attempt.scoring_status === "scoring"}
          />
        )}
        {!audioSrc && (
          <span className="text-xs text-slate-400">Recording not available in this browser session</span>
        )}
      </div>
    </li>
  );
}

export function PracticeMyAttemptsHeading({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4 bg-slate-50 px-4 py-4", className)}>
      <div className="h-px w-16 max-w-32 flex-1 bg-slate-200" />
      <h2 className="shrink-0 px-2 text-sm font-bold uppercase tracking-wide text-slate-700">
        My Attempts
      </h2>
      <div className="h-px w-16 max-w-32 flex-1 bg-slate-200" />
    </div>
  );
}

export function PracticeMyAttemptsContent({
  module,
  questions,
  attempts,
  currentQuestionId,
}: Omit<Props, "onSelectQuestion">) {
  const { profile, user } = useAuth();
  const displayName = (profile?.full_name ?? user?.email?.split("@")[0] ?? "You").toUpperCase();
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : displayName.slice(0, 2);

  const currentQuestion = questions.find((q) => q.id === currentQuestionId);

  const questionAttempts = React.useMemo(() => {
    if (!currentQuestionId) return [];
    return attempts
      .filter((a) => a.question_set_id === currentQuestionId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [attempts, currentQuestionId]);

  const isSpeaking = module === "speaking";
  const isBasicScoreModule = module === "reading" || module === "listening";

  const [scoreDialogOpen, setScoreDialogOpen] = React.useState(false);
  const [scorePhase, setScorePhase] = React.useState<ScoringPhase>("idle");
  const [scoreError, setScoreError] = React.useState<string | null>(null);
  const [speakingScore, setSpeakingScore] = React.useState<SpeakingScoreResult | null>(null);
  const [writingScore, setWritingScore] = React.useState<WritingScoreResult | null>(null);
  const [recordingUrl, setRecordingUrl] = React.useState<string | null>(null);
  const [responseText, setResponseText] = React.useState<string | undefined>();

  const openScoreInfo = React.useCallback(
    async (attempt: PracticeAttemptRow) => {
      setScoreDialogOpen(true);
      setScorePhase("scoring");
      setScoreError(null);
      setSpeakingScore(null);
      setWritingScore(null);
      setRecordingUrl(null);
      setResponseText(undefined);

      try {
        let details = attempt.score_details;
        if (!details) {
          const res = await api.scoring.attempt(attempt.id);
          details = res.data?.score_details ?? null;
        }

        const speaking = asSpeakingScore(details);
        const writing = asWritingScore(details);

        if (speaking) {
          setSpeakingScore(speaking);
          const localRecording = await getLocalRecording(attempt.question_set_id);
          setRecordingUrl(speaking.recordingUrl ?? localRecording);
          setScorePhase("done");
          return;
        }

        if (writing) {
          setWritingScore(writing);
          setResponseText(getLocalAnswer(attempt.question_set_id) ?? undefined);
          setScorePhase("done");
          return;
        }

        setScoreError("Detailed score breakdown is not available for this attempt.");
        setScorePhase("error");
      } catch (error) {
        setScoreError(error instanceof Error ? error.message : "Could not load score details.");
        setScorePhase("error");
      }
    },
    [],
  );

  return (
    <>
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-12 pt-2 md:px-6">
        {currentQuestion && (
          <p className="text-center text-xs text-slate-500">
            Attempts for{" "}
            <span className="font-medium text-slate-700">
              #{currentQuestion.index} {currentQuestion.title}
            </span>
          </p>
        )}

        {questionAttempts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            {isSpeaking
              ? "No attempts for this question yet. Submit your recording to see it here."
              : "No attempts for this question yet. Complete and submit to see your history here."}
          </p>
        ) : isSpeaking ? (
          <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {questionAttempts.map((att) => (
              <SpeakingAttemptItem
                key={att.id}
                attempt={att}
                displayName={displayName}
                initials={initials}
                onOpenScoreInfo={openScoreInfo}
              />
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-white">
            {questionAttempts.map((att) => {
              const answer = getLocalAnswer(att.question_set_id);
              const { score: displayScore, total: displayTotal } = resolveAttemptScore(att);
              return (
                <li key={att.id} className="p-4">
                  <div className="flex w-full items-start gap-3 text-left">
                    <History className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        Attempt {format(new Date(att.created_at), "dd MMM yyyy, HH:mm")}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {displayTotal > 0 ? (
                          isBasicScoreModule ? (
                            <BasicAttemptScore score={displayScore} total={displayTotal} />
                          ) : (
                            <ScoreInfoBadge
                              score={displayScore}
                              total={displayTotal}
                              onClick={() => void openScoreInfo(att)}
                              disabled={att.scoring_status === "scoring"}
                            />
                          )
                        ) : (
                          <span className="text-xs text-slate-400">Submitted</span>
                        )}
                      </div>
                      {module === "writing" && answer && (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{answer}</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <PracticeScoringDialog
        open={scoreDialogOpen && !isBasicScoreModule}
        onOpenChange={setScoreDialogOpen}
        phase={scorePhase}
        error={scoreError}
        writing={writingScore}
        speaking={speakingScore}
        responseText={responseText}
        recordingUrl={recordingUrl}
      />
    </>
  );
}

/** Heading + content in one scroll section (heading always above list). */
export function PracticeMyAttemptsSection(props: Props) {
  return (
    <section id="practice-my-attempts" className="shrink-0 border-t border-slate-200 bg-slate-50">
      <PracticeMyAttemptsHeading />
      <PracticeMyAttemptsContent {...props} />
    </section>
  );
}
