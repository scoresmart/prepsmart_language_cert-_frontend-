import * as React from "react";
import { format } from "date-fns";
import { History, User } from "lucide-react";
import { SpeakingAttemptAudioPlayer } from "@/components/practice/speaking/SpeakingAttemptAudioPlayer";
import { getLocalAnswer, getLocalRecording } from "@/lib/practiceAttemptStorage";
import { useAuth } from "@/providers/AuthContext";
import { cn } from "@/lib/utils";
import type { PracticeQuestionItem } from "@/lib/practiceQuestions";

export type PracticeAttemptRow = {
  id: string;
  question_type: string;
  question_set_id: string;
  score: number;
  total: number;
  created_at: string;
};

type Props = {
  module: string;
  questions: PracticeQuestionItem[];
  attempts: PracticeAttemptRow[];
  currentQuestionId?: string;
  onSelectQuestion: (index: number) => void;
};

function SpeakingAttemptItem({
  attempt,
  question,
  displayName,
  initials,
  onSelect,
}: {
  attempt: PracticeAttemptRow;
  question?: PracticeQuestionItem;
  displayName: string;
  initials: string;
  onSelect: () => void;
}) {
  const [audioSrc, setAudioSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void getLocalRecording(attempt.question_set_id).then((url) => {
      if (active) setAudioSrc(url);
    });
    return () => {
      active = false;
    };
  }, [attempt.question_set_id]);

  return (
    <li className="border-b border-slate-100 px-4 py-4 last:border-b-0">
      <button type="button" onClick={onSelect} className="w-full text-left">
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
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <SpeakingAttemptAudioPlayer src={audioSrc} />
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {question ? `S${question.index}` : "SP"}
          </span>
          {attempt.total > 0 && (
            <span className="text-xs text-slate-600">
              Score Info{" "}
              <span className={cn("font-bold", attempt.score / attempt.total >= 0.7 ? "text-emerald-600" : "text-amber-600")}>
                {attempt.score}/{attempt.total}
              </span>
            </span>
          )}
          {!audioSrc && (
            <span className="text-xs text-slate-400">Recording not available in this browser session</span>
          )}
        </div>
      </button>
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
  onSelectQuestion,
}: Props) {
  const { profile, user } = useAuth();
  const displayName = (profile?.full_name ?? user?.email?.split("@")[0] ?? "You").toUpperCase();
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : displayName.slice(0, 2);

  const attemptByQuestionId = new Map(attempts.map((a) => [a.question_set_id, a]));
  const practicedCount = questions.filter((q) => attemptByQuestionId.has(q.id)).length;
  const pendingCount = questions.length - practicedCount;

  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const currentQuestion = questions.find((q) => q.id === currentQuestionId);
  const currentAttempt = currentQuestionId ? attemptByQuestionId.get(currentQuestionId) : undefined;
  const currentAnswer = currentQuestionId ? getLocalAnswer(currentQuestionId) : null;

  const isSpeaking = module === "speaking";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-12 pt-2 md:px-6">
      {!isSpeaking && (
        <p className="text-center text-xs text-slate-500">
          <span className="font-medium text-emerald-600">{practicedCount} practiced</span>
          {" · "}
          <span className="font-medium text-amber-600">{pendingCount} pending</span>
        </p>
      )}

      {!isSpeaking && currentQuestion && currentAttempt && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Current question</p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            #{currentQuestion.index} {currentQuestion.title}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Submitted {format(new Date(currentAttempt.created_at), "dd MMM yyyy, HH:mm")}
            {currentAttempt.total > 0 && (
              <span className="ml-2 font-semibold text-emerald-700">
                Score: {currentAttempt.score}/{currentAttempt.total}
              </span>
            )}
          </p>
          {module === "writing" && currentAnswer && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {currentAnswer}
            </div>
          )}
        </div>
      )}

      {sortedAttempts.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          {isSpeaking
            ? "No attempts yet. Submit your recording to see your practice history here."
            : "No attempts yet. Complete a question to see your practice history here."}
        </p>
      ) : isSpeaking ? (
        <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {sortedAttempts.map((att) => {
            const q = questions.find((item) => item.id === att.question_set_id);
            return (
              <SpeakingAttemptItem
                key={att.id}
                attempt={att}
                question={q}
                displayName={displayName}
                initials={initials}
                onSelect={() => q && onSelectQuestion(q.index)}
              />
            );
          })}
        </ul>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-white">
          {sortedAttempts.map((att) => {
            const q = questions.find((item) => item.id === att.question_set_id);
            const answer = getLocalAnswer(att.question_set_id);
            return (
              <li key={att.id} className="p-4">
                <button
                  type="button"
                  onClick={() => q && onSelectQuestion(q.index)}
                  className="flex w-full items-start gap-3 text-left transition hover:opacity-80"
                >
                  <History className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {q ? `#${q.index} ${q.title}` : "Question"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {format(new Date(att.created_at), "dd MMM yyyy, HH:mm")}
                      {att.total > 0 ? (
                        <span className={cn("ml-2 font-medium", att.score / att.total >= 0.7 ? "text-emerald-600" : "text-amber-600")}>
                          {att.score}/{att.total}
                        </span>
                      ) : (
                        <span className="ml-2 text-slate-400">Submitted</span>
                      )}
                    </p>
                    {module === "writing" && answer && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{answer}</p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
