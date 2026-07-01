import { CalendarDays, Flame, Target, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamDatePicker } from "@/components/dashboard/ExamDatePicker";
import { cn } from "@/lib/utils";

type Props = {
  username: string;
  studyStreak: number;
  questionsDone: number;
  daysToExam: number | null;
  examDate?: string | null;
  loading?: boolean;
  targetLevel?: string;
  savingExamDate?: boolean;
  onExamDateSave?: (isoDate: string) => Promise<void>;
};

export function WelcomeBanner({
  username,
  studyStreak,
  questionsDone,
  daysToExam,
  examDate = null,
  loading,
  targetLevel = "B2 Level",
  savingExamDate,
  onExamDateSave,
}: Props) {
  return (
    <div className="relative overflow-visible rounded-3xl p-6 text-white shadow-2xl shadow-emerald-900/30 md:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #48c6ef 0%, #0e9f73 35%, #0d7d5b 65%, #1a5276 100%)",
          }}
        />
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl animate-float-slow" />
        <div className="absolute -bottom-20 left-1/3 size-40 rounded-full bg-cyan-300/20 blur-3xl animate-float-delayed" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
      </div>

      <div className="relative z-10 space-y-4">
        <div className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
          <span className="animate-pulse">✨</span> Welcome back!
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <p className="font-display text-lg text-white/90">
            Hi {username}, <span className="inline-block animate-wave">👋</span>
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            Let&apos;s Target{" "}
            <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
              {targetLevel}
            </span>
          </h1>
        </div>

        <button
          type="button"
          className="animate-fade-in-up flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/20 active:scale-95"
          style={{ animationDelay: "160ms" }}
        >
          <Target className="size-4" />
          Set Target Score
        </button>

        <div className="relative z-30 flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          {[
            { icon: Flame, label: "Study Streak", value: `${studyStreak} Days`, color: "text-orange-200" },
            { icon: Zap, label: "Questions Done", value: String(questionsDone), color: "text-yellow-200" },
            {
              icon: CalendarDays,
              label: "Days to Exam",
              value: daysToExam != null ? `${Math.max(0, daysToExam)} Days` : null,
              color: "text-cyan-200",
              showPicker: true,
            },
          ].map(({ icon: Icon, label, value, color, showPicker }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-lg",
                showPicker && "relative z-40",
              )}
            >
              <div className={`rounded-xl bg-white/10 p-2 ${color}`}>
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/55">{label}</p>
                {loading && label === "Days to Exam" ? (
                  <Skeleton className="mt-1 h-4 w-14 bg-white/20" />
                ) : value != null ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">{value}</p>
                    {showPicker && onExamDateSave && (
                      <ExamDatePicker
                        examDate={examDate}
                        onSave={onExamDateSave}
                        saving={savingExamDate}
                      />
                    )}
                  </div>
                ) : showPicker && onExamDateSave ? (
                  <ExamDatePicker examDate={examDate} onSave={onExamDateSave} saving={savingExamDate} />
                ) : (
                  <p className="text-sm font-bold text-white/70">—</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div
          className="relative z-20 animate-fade-in-up overflow-visible rounded-2xl border border-dashed border-white/25 bg-white/10 p-4 backdrop-blur-md"
          style={{ animationDelay: "320ms" }}
        >
          <p className="font-semibold">Start strong and stay consistent! 💪</p>
          <p className="text-xs text-white/65">Practice Language Cert like a real exam with PrepSmart LC.</p>
        </div>
      </div>
    </div>
  );
}
