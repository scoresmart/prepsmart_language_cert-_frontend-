import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  attemptPercent,
  formatQuestionTypeLabel,
  moduleForQuestionType,
} from "@/lib/performanceAnalytics";

const MODULE_BADGE: Record<string, string> = {
  speaking: "bg-blue-100 text-blue-700",
  reading: "bg-green-100 text-green-700",
  writing: "bg-purple-100 text-purple-700",
  listening: "bg-orange-100 text-orange-700",
};

function moduleBadge(module: string | null) {
  if (!module) return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize bg-slate-100 text-slate-700">—</span>;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize border-0 ${MODULE_BADGE[module] ?? "bg-slate-100 text-slate-700"}`}>
      {module}
    </span>
  );
}

function statusBadge(status?: string) {
  const map: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-rose-100 text-rose-700",
  };
  const label = status ?? "unknown";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${map[label] ?? "bg-slate-100 text-slate-600"}`}>
      {label}
    </span>
  );
}

export function AdminPracticeLogsPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const q = useQuery({
    queryKey: ["admin", "practice-logs"],
    queryFn: async () => {
      const res = await api.practice.adminLogs(500);
      return res.data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (q.data ?? []).filter((row) => {
      const module = row.module ?? moduleForQuestionType(row.question_type);
      if (moduleFilter !== "all" && module !== moduleFilter) return false;
      if (!term) return true;
      const haystack = [
        row.student_name,
        row.student_email,
        row.question_type,
        row.question_set_id,
        formatQuestionTypeLabel(row.question_type),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [q.data, search, moduleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500">
          <History className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Practice Logs</h1>
          <p className="text-sm text-slate-500">{filtered.length} practice attempts</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by student, email, or question type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-white"
        />
        <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="w-full sm:w-44 bg-white">
          <option value="all">All modules</option>
          <option value="speaking">Speaking</option>
          <option value="reading">Reading</option>
          <option value="writing">Writing</option>
          <option value="listening">Listening</option>
        </Select>
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-600">Recent Practice Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : q.isError ? (
            <div className="p-8 text-center text-sm text-rose-500">Failed to load practice logs.</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No practice logs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-5 py-3 font-medium text-slate-500">Student</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Module</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Question type</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Score</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const module = row.module ?? moduleForQuestionType(row.question_type);
                    const pct = attemptPercent(row.score, row.total);
                    return (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800">{row.student_name ?? "Unknown"}</p>
                          <p className="text-xs text-slate-500">{row.student_email ?? row.student_id.slice(0, 8) + "…"}</p>
                        </td>
                        <td className="px-4 py-3">{moduleBadge(module)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatQuestionTypeLabel(row.question_type)}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">
                          {row.total > 0 ? (
                            <>
                              {row.score}/{row.total}
                              {pct != null && <span className="ml-1 text-xs text-slate-500">({Math.round(pct)}%)</span>}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">{statusBadge(row.scoring_status)}</td>
                        <td className="px-4 py-3 text-slate-500 tabular-nums text-xs">
                          {format(new Date(row.created_at), "dd MMM yyyy, HH:mm")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
