import { format } from "date-fns";
import { CheckCircle2, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLocalAnswer } from "@/lib/practiceAttemptStorage";
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

export function PracticeMyAttemptsSection({
  module,
  questions,
  attempts,
  currentQuestionId,
  onSelectQuestion,
}: Props) {
  const attemptByQuestionId = new Map(attempts.map((a) => [a.question_set_id, a]));
  const practicedCount = questions.filter((q) => attemptByQuestionId.has(q.id)).length;
  const pendingCount = questions.length - practicedCount;

  const currentQuestion = questions.find((q) => q.id === currentQuestionId);
  const currentAttempt = currentQuestionId ? attemptByQuestionId.get(currentQuestionId) : undefined;
  const currentAnswer = currentQuestionId ? getLocalAnswer(currentQuestionId) : null;

  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="size-5 text-slate-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Attempts</h2>
            <p className="text-xs text-slate-500">
              <span className="font-medium text-emerald-600">{practicedCount} practiced</span>
              {" · "}
              <span className="font-medium text-amber-600">{pendingCount} pending</span>
            </p>
          </div>
        </div>
      </div>

      {currentQuestion && currentAttempt && (
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
          No attempts yet. Submit an answer to see your practice history here.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
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
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {q ? `#${q.index} ${q.title}` : "Question"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {format(new Date(att.created_at), "dd MMM yyyy, HH:mm")}
                      {att.total > 0 ? (
                        <span className={cn("ml-2 font-medium", att.score / att.total >= 0.7 ? "text-emerald-600" : "text-amber-600")}>
                          {att.score}/{att.total} ({Math.round((att.score / att.total) * 100)}%)
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
    </section>
  );
}
