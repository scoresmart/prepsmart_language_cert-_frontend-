import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import {
  MOCK_ACTIVITY_SCREENS,
  MOCK_EXAM_TITLE,
  MOCK_LISTENING_PARTS,
  MOCK_READING_PARTS,
  MOCK_SPEAKING_PARTS,
  MOCK_TOTALS,
  MOCK_WRITING_TASKS,
} from "@/lib/mockTestFormat";
import { mockTestCatalogUrl, mockTestStepUrl } from "@/lib/mockTestRoutes";
import { loadMockSession, sumAllMockScores, sumSectionScores } from "@/lib/mockTestSessionStorage";
import { cn } from "@/lib/utils";

function ScoreRow({ label, score, total }: { label: string; score: number; total: number }) {
  const filled = total > 0;
  const pct = filled ? Math.round((score / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2.5 text-sm last:border-0">
      <span className="text-white/65">{label}</span>
      <div className="flex items-center gap-2">
        {filled && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
              pct >= 70 ? "bg-emerald-500/20 text-emerald-300" : pct >= 50 ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300",
            )}
          >
            {pct}%
          </span>
        )}
        <span className="font-semibold tabular-nums text-white">
          {filled ? `${score} / ${total}` : "—"}
        </span>
      </div>
    </div>
  );
}

function ModuleBlock({
  title,
  titleColor,
  rows,
  defaultTotal,
  session,
}: {
  title: string;
  titleColor: string;
  rows: { key: string; label: string; defaultTotal: number }[];
  defaultTotal: number;
  session: ReturnType<typeof loadMockSession>;
}) {
  const keys = rows.map((r) => r.key);
  const moduleTotal = sumSectionScores(session, keys);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className={cn("font-bold", titleColor)}>{title}</h3>
      <div className="mt-2">
        {rows.map((row) => {
          const section = session?.sections[row.key];
          return (
            <ScoreRow
              key={row.key}
              label={row.label}
              score={section?.score ?? 0}
              total={section?.total ?? row.defaultTotal}
            />
          );
        })}
      </div>
      <p className="mt-3 border-t border-white/5 pt-2 text-sm font-bold text-white">
        Total: {moduleTotal.score} / {moduleTotal.total || defaultTotal}
      </p>
    </div>
  );
}

export function MockTestResultsPage() {
  const { testId = "" } = useParams<{ testId: string }>();

  const q = useQuery({
    queryKey: ["mock-test", testId],
    queryFn: async () => {
      const res = await api.tests.get(testId);
      return res.data;
    },
    enabled: Boolean(testId),
  });

  const session = testId ? loadMockSession(testId) : null;
  const test = q.data;

  if (!testId) return <Navigate to={mockTestCatalogUrl()} replace />;

  if (q.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-white/50">
        <Loader2 className="size-5 animate-spin text-cyan-400" />
        <span className="text-sm">Loading results…</span>
      </div>
    );
  }

  const overall = sumAllMockScores(session);
  const overallPct = overall.total > 0 ? Math.round((overall.score / overall.total) * 100) : 0;

  return (
    <div className="relative min-h-full p-4 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-0 size-96 rounded-full bg-violet-600/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl space-y-6">
        <Link
          to={mockTestCatalogUrl()}
          className="inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Mock tests
        </Link>

        <header className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/15 via-white/[0.04] to-cyan-600/10 p-6 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Mock test results</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{test?.title ?? session?.testTitle ?? "Mock Test"}</h1>
          {(session?.scoredAt || session?.startedAt) && (
            <p className="mt-1 text-sm text-white/45">
              {session?.scoredAt
                ? `Scored ${new Date(session.scoredAt).toLocaleString()}`
                : `Started ${new Date(session.startedAt).toLocaleDateString()}`}
            </p>
          )}

          <div className="mt-5 flex flex-col items-center rounded-xl border border-white/10 bg-black/25 px-6 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-violet-500/20 ring-1 ring-violet-400/30">
                <Trophy className="size-6 text-violet-300" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/45">Overall score</p>
                <p className="text-3xl font-bold tabular-nums text-white">
                  {overall.total > 0 ? `${overall.score} / ${overall.total}` : "—"}
                </p>
              </div>
            </div>
            {overall.total > 0 && (
              <div className="mt-4 sm:mt-0 sm:text-right">
                <p
                  className={cn(
                    "text-4xl font-extrabold tabular-nums",
                    overallPct >= 70 ? "text-emerald-400" : overallPct >= 50 ? "text-amber-400" : "text-rose-400",
                  )}
                >
                  {overallPct}%
                </p>
                <p className="text-xs text-white/40">Combined modules</p>
              </div>
            )}
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/45">Score sheet</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ModuleBlock
              title="Listening"
              titleColor="text-cyan-400"
              rows={MOCK_LISTENING_PARTS.map((p) => ({
                key: `listening-${p.part}`,
                label: p.label,
                defaultTotal: p.questions,
              }))}
              defaultTotal={MOCK_TOTALS.listening}
              session={session}
            />
            <ModuleBlock
              title="Reading"
              titleColor="text-emerald-400"
              rows={MOCK_READING_PARTS.map((p) => ({
                key: `reading-${p.part}`,
                label: p.label,
                defaultTotal: p.questions,
              }))}
              defaultTotal={MOCK_TOTALS.reading}
              session={session}
            />
            <ModuleBlock
              title="Writing"
              titleColor="text-amber-400"
              rows={MOCK_WRITING_TASKS.map((p) => ({
                key: `writing-${p.part}`,
                label: p.label,
                defaultTotal: 25,
              }))}
              defaultTotal={50}
              session={session}
            />
            <ModuleBlock
              title="Speaking"
              titleColor="text-violet-400"
              rows={MOCK_SPEAKING_PARTS.map((p) => ({
                key: `speaking-${p.part}`,
                label: p.label,
                defaultTotal: 50,
              }))}
              defaultTotal={200}
              session={session}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-bold text-white">Final feedback</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-400">Strong areas</p>
              <ol className="mt-2 list-inside list-decimal text-sm text-white/55">
                <li>Review sections where you scored highest above.</li>
                <li>Keep practising timed sections in the module workspace.</li>
              </ol>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-400">Weak areas</p>
              <ol className="mt-2 list-inside list-decimal text-sm text-white/55">
                <li>Revisit parts with lower scores in Practice mode.</li>
                <li>Use AI feedback on Writing and Speaking submissions.</li>
              </ol>
            </div>
          </div>
        </div>

        {testId && (
          <div className="flex flex-wrap gap-3">
            <Link
              to={mockTestStepUrl(testId, 1)}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              Review mock test
            </Link>
            <Link
              to={mockTestCatalogUrl()}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-900/20 transition hover:from-cyan-400 hover:to-blue-500"
            >
              Back to catalog
            </Link>
          </div>
        )}

        <p className="text-xs text-white/30">
          {MOCK_ACTIVITY_SCREENS} sections · {MOCK_EXAM_TITLE} format
        </p>
      </div>
    </div>
  );
}
