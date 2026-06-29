import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { MockTestFormatOverview } from "@/components/mock-test/MockTestFormatOverview";
import {
  MOCK_ACTIVITY_SCREENS,
  MOCK_EXAM_TITLE,
  MOCK_EXAM_TOTAL_MINUTES,
} from "@/lib/mockTestFormat";
import { initMockSession } from "@/lib/mockTestSessionStorage";
import { mockTestCatalogUrl, mockTestStepUrl } from "@/lib/mockTestRoutes";

export function MockTestIntroPage() {
  const { testId = "" } = useParams<{ testId: string }>();

  const q = useQuery({
    queryKey: ["mock-test", testId],
    queryFn: async () => {
      const res = await api.tests.get(testId);
      return res.data;
    },
    enabled: Boolean(testId),
  });

  const test = q.data;

  const handleStart = () => {
    if (!test) return;
    initMockSession(test.id, test.title);
  };

  if (!testId) return <Navigate to={mockTestCatalogUrl()} replace />;

  if (q.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-400">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">Loading mock test…</span>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="font-medium text-slate-700">Mock test not found.</p>
        <Link to={mockTestCatalogUrl()} className="mt-4 inline-block text-sm text-violet-600 hover:underline">
          ← Back to mock tests
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Link to={mockTestCatalogUrl()} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" />
        All mock tests
      </Link>

      <header className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-600">{MOCK_EXAM_TITLE} mock test</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{test.title}</h1>
        {test.description && <p className="mt-2 text-sm text-slate-600">{test.description}</p>}

        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Activity screens</dt>
            <dd className="font-semibold text-slate-800">{MOCK_ACTIVITY_SCREENS} sections</dd>
          </div>
          <div>
            <dt className="text-slate-500">Total time</dt>
            <dd className="font-semibold text-slate-800">
              ~{Math.floor(MOCK_EXAM_TOTAL_MINUTES / 60)}h {MOCK_EXAM_TOTAL_MINUTES % 60}m
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Modules</dt>
            <dd className="font-semibold text-slate-800">Listening · Reading · Writing · Speaking</dd>
          </div>
          <div>
            <dt className="text-slate-500">Order</dt>
            <dd className="font-semibold text-slate-800">Listening → Reading → Writing → Speaking</dd>
          </div>
        </dl>

        <Button asChild className="mt-5 gap-2 bg-violet-600 hover:bg-violet-700">
          <Link to={mockTestStepUrl(test.id, 1)} onClick={handleStart}>
            <Play className="size-4" />
            Start mock test
          </Link>
        </Button>
      </header>

      <MockTestFormatOverview />

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Before you begin</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Use headphones for Listening and Speaking.</li>
          <li>Complete each section before moving to the next.</li>
          <li>Writing and Speaking are AI-scored when you submit.</li>
        </ul>
      </div>
    </div>
  );
}
