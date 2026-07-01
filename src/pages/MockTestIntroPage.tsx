import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Layers, Loader2, Play } from "lucide-react";
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
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-white/50">
        <Loader2 className="size-5 animate-spin text-cyan-400" />
        <span className="text-sm">Loading mock test…</span>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="font-medium text-white/80">Mock test not found.</p>
        <Link to={mockTestCatalogUrl()} className="mt-4 inline-block text-sm text-cyan-400 hover:underline">
          ← Back to mock tests
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-full p-4 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-0 size-96 rounded-full bg-violet-600/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl space-y-6">
        <Link
          to={mockTestCatalogUrl()}
          className="inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          All mock tests
        </Link>

        <header className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/15 via-white/[0.04] to-violet-600/10 p-6 backdrop-blur-sm md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">{MOCK_EXAM_TITLE} mock test</p>
          <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">{test.title}</h1>
          {test.description && <p className="mt-2 text-sm leading-relaxed text-white/55">{test.description}</p>}

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            {[
              { icon: Layers, label: "Activity screens", value: `${MOCK_ACTIVITY_SCREENS} sections` },
              {
                icon: Clock,
                label: "Total time",
                value: `~${Math.floor(MOCK_EXAM_TOTAL_MINUTES / 60)}h ${MOCK_EXAM_TOTAL_MINUTES % 60}m`,
              },
              { label: "Modules", value: "Listening · Reading · Writing · Speaking" },
              { label: "Order", value: "Listening → Reading → Writing → Speaking" },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <dt className="text-xs uppercase tracking-wide text-white/40">{row.label}</dt>
                <dd className="mt-0.5 font-semibold text-white">{row.value}</dd>
              </div>
            ))}
          </dl>

          <Button
            asChild
            className="mt-6 gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/30 hover:from-cyan-400 hover:to-blue-500"
          >
            <Link to={mockTestStepUrl(test.id, 1)} onClick={handleStart}>
              <Play className="size-4" />
              Start mock test
            </Link>
          </Button>
        </header>

        <MockTestFormatOverview variant="dark" />

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-4 text-sm text-amber-100/80">
          <p className="font-semibold text-amber-200">Before you begin</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-amber-100/65">
            <li>Use headphones for Listening and Speaking.</li>
            <li>Complete each section before moving to the next.</li>
            <li>Your full score is calculated when you submit the last section.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
