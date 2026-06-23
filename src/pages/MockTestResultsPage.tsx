import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  MOCK_LISTENING_PARTS,
  MOCK_READING_PARTS,
  MOCK_SPEAKING_PARTS,
  MOCK_TEST_STEPS,
  MOCK_WRITING_TASKS,
} from "@/lib/mockTestFormat";
import { mockTestCatalogUrl, mockTestStepUrl } from "@/lib/mockTestRoutes";
import { loadMockSession, sumSectionScores } from "@/lib/mockTestSessionStorage";

function ScoreRow({ label, score, total }: { label: string; score: number; total: number }) {
  const filled = total > 0;
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-700">{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">
        {filled ? `${score} / ${total}` : "___ / ___"}
      </span>
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
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-400">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">Loading results…</span>
      </div>
    );
  }

  const listeningKeys = MOCK_LISTENING_PARTS.map((p) => `listening-${p.part}`);
  const readingKeys = MOCK_READING_PARTS.map((p) => `reading-${p.part}`);
  const writingKeys = MOCK_WRITING_TASKS.map((p) => `writing-${p.part}`);
  const speakingKeys = MOCK_SPEAKING_PARTS.map((p) => `speaking-${p.part}`);

  const listeningTotal = sumSectionScores(session, listeningKeys);
  const readingTotal = sumSectionScores(session, readingKeys);
  const writingTotal = sumSectionScores(session, writingKeys);
  const speakingTotal = sumSectionScores(session, speakingKeys);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Link to={mockTestCatalogUrl()} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" />
        Mock tests
      </Link>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600">Mock test results</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{test?.title ?? session?.testTitle ?? "Mock Test"}</h1>
        {session?.startedAt && (
          <p className="mt-1 text-sm text-slate-500">
            Completed {new Date(session.startedAt).toLocaleDateString()}
          </p>
        )}
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Score sheet</h2>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-bold text-cyan-800">Listening</h3>
            {MOCK_LISTENING_PARTS.map((p) => {
              const row = session?.sections[`listening-${p.part}`];
              return (
                <ScoreRow
                  key={p.part}
                  label={p.label}
                  score={row?.score ?? 0}
                  total={row?.total ?? p.questions}
                />
              );
            })}
            <p className="mt-2 text-sm font-bold text-slate-900">
              Total: {listeningTotal.score} / {listeningTotal.total || 26}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-emerald-800">Reading</h3>
            {MOCK_READING_PARTS.map((p) => {
              const row = session?.sections[`reading-${p.part}`];
              return (
                <ScoreRow
                  key={p.part}
                  label={p.label}
                  score={row?.score ?? 0}
                  total={row?.total ?? p.questions}
                />
              );
            })}
            <p className="mt-2 text-sm font-bold text-slate-900">
              Total: {readingTotal.score} / {readingTotal.total || 26}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-amber-800">Writing</h3>
            {MOCK_WRITING_TASKS.map((p) => {
              const row = session?.sections[`writing-${p.part}`];
              return (
                <ScoreRow
                  key={p.part}
                  label={p.label}
                  score={row?.score ?? 0}
                  total={row?.total ?? 25}
                />
              );
            })}
            <p className="mt-2 text-sm font-bold text-slate-900">
              Total: {writingTotal.score} / {writingTotal.total || 50}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-violet-800">Speaking</h3>
            {MOCK_SPEAKING_PARTS.map((p) => {
              const row = session?.sections[`speaking-${p.part}`];
              return (
                <ScoreRow
                  key={p.part}
                  label={p.label}
                  score={row?.score ?? 0}
                  total={row?.total ?? 50}
                />
              );
            })}
            <p className="mt-2 text-sm font-bold text-slate-900">
              Total: {speakingTotal.score} / {speakingTotal.total || 50}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-bold text-slate-800">Final feedback</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Strong areas</p>
            <ol className="mt-2 list-inside list-decimal text-sm text-slate-600">
              <li>Review sections where you scored highest above.</li>
              <li>Keep practising timed sections in the module workspace.</li>
            </ol>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Weak areas</p>
            <ol className="mt-2 list-inside list-decimal text-sm text-slate-600">
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
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Review mock test
          </Link>
          <Link
            to={mockTestCatalogUrl()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Back to catalog
          </Link>
        </div>
      )}

      <p className="text-xs text-slate-400">
        {MOCK_TEST_STEPS.length} sections · LanguageCert International ESOL format
      </p>
    </div>
  );
}
