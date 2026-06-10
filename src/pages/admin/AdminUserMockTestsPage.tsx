import { useQuery } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

type UserMockTest = {
  id: string;
  user_id: string;
  mock_test_id: string;
  status: string;
  score?: number;
  started_at: string;
  completed_at?: string;
};

export function AdminUserMockTestsPage() {
  const q = useQuery({
    queryKey: ["admin", "user-mock-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_mock_tests")
        .select("id,user_id,mock_test_id,status,score,started_at,completed_at")
        .order("started_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as UserMockTest[];
    },
  });

  function statusBadge(status: string) {
    if (status === "completed") return <Badge className="bg-green-100 text-green-700 border-0">Completed</Badge>;
    if (status === "in_progress") return <Badge className="bg-blue-100 text-blue-700 border-0">In Progress</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500">
          <FlaskConical className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">User Mock Tests</h1>
          <p className="text-sm text-slate-500">{q.data?.length ?? 0} attempts tracked</p>
        </div>
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">All Attempts</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : (q.data?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No mock test attempts yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">User</th><th className="px-4 py-3 font-medium text-slate-500">Test ID</th><th className="px-4 py-3 font-medium text-slate-500">Status</th><th className="px-4 py-3 font-medium text-slate-500">Score</th><th className="px-4 py-3 font-medium text-slate-500">Started</th></tr></thead>
                <tbody>
                  {q.data!.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.user_id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.mock_test_id.slice(0, 8)}…</td>
                      <td className="px-4 py-3">{statusBadge(row.status)}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{row.score ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums text-xs">{new Date(row.started_at).toLocaleString()}</td>
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
