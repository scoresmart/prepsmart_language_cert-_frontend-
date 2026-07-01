import { Link } from "react-router-dom";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { MockTestResultsListRow } from "@/components/mock-test/MockTestListRow";
import { resolveSessionStatus } from "@/lib/mockTestCatalogMeta";
import { mockTestCatalogUrl } from "@/lib/mockTestRoutes";
import { listAllMockSessions } from "@/lib/mockTestSessionStorage";

export function MockTestPreviousResultsPage() {
  const sessions = listAllMockSessions().filter(
    (session) => resolveSessionStatus(session) !== "none",
  );

  return (
    <div className="relative min-h-full p-4 md:p-6 lg:p-8">
      <div className="relative mx-auto max-w-4xl">
        <Link
          to={mockTestCatalogUrl()}
          className="mb-4 inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to mock tests
        </Link>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/40">
          <header className="border-b border-white/10 px-5 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-white">Previous Results</h1>
            <p className="mt-1 text-xs text-white/40">Your recent mock test attempts on this device</p>
          </header>

          {sessions.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <FlaskConical className="mx-auto size-10 text-white/20" />
              <p className="mt-4 font-semibold text-white/80">No results yet</p>
              <p className="mt-1 text-sm text-white/45">Complete a mock test to see your scores here.</p>
            </div>
          ) : (
            <ul>
              {sessions.map((session) => {
                const status = resolveSessionStatus(session);
                const dateLabel = session.scoredAt
                  ? `Scored ${new Date(session.scoredAt).toLocaleString()}`
                  : `Started ${new Date(session.startedAt).toLocaleString()}`;
                return (
                  <MockTestResultsListRow
                    key={session.testId}
                    testId={session.testId}
                    title={session.testTitle}
                    status={status}
                    dateLabel={dateLabel}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
