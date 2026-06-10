import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

type PracticeLog = {
  id: string;
  user_id: string;
  question_id: string;
  section: string;
  score?: number;
  completed_at: string;
};

export function AdminPracticeLogsPage() {
  const q = useQuery({
    queryKey: ["admin", "practice-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("id,user_id,question_id,section,score,completed_at")
        .order("completed_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as PracticeLog[];
    },
  });

  function sectionBadge(section: string) {
    const map: Record<string, string> = {
      speaking: "bg-blue-100 text-blue-700",
      reading: "bg-green-100 text-green-700",
      writing: "bg-purple-100 text-purple-700",
      listening: "bg-orange-100 text-orange-700",
    };
    return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize border-0 ${map[section] ?? "bg-slate-100 text-slate-700"}`}>{section}</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500">
          <History className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Practice Logs</h1>
          <p className="text-sm text-slate-500">{q.data?.length ?? 0} practice attempts</p>
        </div>
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">Recent Practice Activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : (q.data?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No practice logs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">User</th><th className="px-4 py-3 font-medium text-slate-500">Section</th><th className="px-4 py-3 font-medium text-slate-500">Score</th><th className="px-4 py-3 font-medium text-slate-500">Completed</th></tr></thead>
                <tbody>
                  {q.data!.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.user_id.slice(0, 8)}…</td>
                      <td className="px-4 py-3">{sectionBadge(row.section)}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{row.score ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums text-xs">{new Date(row.completed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
