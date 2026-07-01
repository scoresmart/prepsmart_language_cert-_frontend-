import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FlaskConical, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { MockTestListRow } from "@/components/mock-test/MockTestListRow";
import { sortMockTests } from "@/lib/mockTestCatalogMeta";
import { mockTestPreviousResultsUrl } from "@/lib/mockTestRoutes";
import { MOCK_EXAM_TITLE } from "@/lib/mockTestFormat";

export function MockTestCatalogPage() {
  const q = useQuery({
    queryKey: ["mock-tests"],
    queryFn: async () => {
      const res = await api.tests.list();
      return res.data?.tests ?? [];
    },
  });

  const tests = sortMockTests(q.data ?? []);

  return (
    <div className="relative min-h-full p-4 md:p-6 lg:p-8">
      <div className="relative mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/40">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-5 sm:px-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Mock Tests</h1>
              <p className="mt-1 text-xs text-white/40">{MOCK_EXAM_TITLE} practice exams</p>
            </div>
            <Button
              asChild
              variant="outline"
              className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <Link to={mockTestPreviousResultsUrl()}>
                <History className="size-4" />
                Previous Results
              </Link>
            </Button>
          </header>

          {q.isLoading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-16 text-white/50">
              <Loader2 className="size-5 animate-spin text-blue-400" />
              <span className="text-sm">Loading mock tests…</span>
            </div>
          ) : tests.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <FlaskConical className="mx-auto size-10 text-white/20" />
              <p className="mt-4 font-semibold text-white/80">No mock tests published yet</p>
              <p className="mt-1 text-sm text-white/45">Ask your tutor to create one in Admin → Mock Tests.</p>
            </div>
          ) : (
            <ul>
              {tests.map((test, i) => (
                <MockTestListRow key={test.id} test={test} index={i} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
