import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, FlaskConical, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { mockTestIntroUrl } from "@/lib/mockTestRoutes";
import { MOCK_EXAM_TITLE, MOCK_ACTIVITY_SCREENS, MOCK_EXAM_TOTAL_MINUTES } from "@/lib/mockTestFormat";

export function MockTestCatalogPage() {
  const q = useQuery({
    queryKey: ["mock-tests"],
    queryFn: async () => {
      const res = await api.tests.list();
      return res.data?.tests ?? [];
    },
  });

  const tests = q.data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-violet-600">
          <FlaskConical className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">PrepSmart LC</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Mock Tests</h1>
        <p className="text-sm text-slate-500">
          {MOCK_EXAM_TITLE} — {MOCK_ACTIVITY_SCREENS} sections, ~{Math.floor(MOCK_EXAM_TOTAL_MINUTES / 60)}h{" "}
          {MOCK_EXAM_TOTAL_MINUTES % 60}m · Listening, Reading, Writing, Speaking (4 parts)
        </p>
      </header>

      {q.isLoading ? (
        <div className="flex items-center gap-2 py-8 text-slate-400">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Loading mock tests…</span>
        </div>
      ) : tests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="font-medium text-slate-700">No mock tests published yet</p>
          <p className="mt-1 text-sm text-slate-500">Ask your tutor to create one in Admin → Mock Tests.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {tests.map((test) => (
            <li key={test.id}>
              <Link
                to={mockTestIntroUrl(test.id)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <div>
                  <h3 className="font-bold text-slate-900">{test.title}</h3>
                  {test.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{test.description}</p>
                  )}
                </div>
                <ArrowRight className="size-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
