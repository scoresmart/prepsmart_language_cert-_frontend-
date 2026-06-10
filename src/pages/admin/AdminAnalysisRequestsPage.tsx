import { useQuery } from "@tanstack/react-query";
import { BarChart2, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

type AnalysisRequest = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  created_at: string;
  notes?: string;
};

export function AdminAnalysisRequestsPage() {
  const q = useQuery({
    queryKey: ["admin", "analysis-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_requests")
        .select("id,user_id,type,status,created_at,notes")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AnalysisRequest[];
    },
  });

  const pending = q.data?.filter((r) => r.status === "pending").length ?? 0;
  const completed = q.data?.filter((r) => r.status === "completed").length ?? 0;
  const total = q.data?.length ?? 0;

  function statusBadge(status: string) {
    if (status === "completed") return <Badge className="bg-green-100 text-green-700 border-0">Completed</Badge>;
    if (status === "pending") return <Badge className="bg-yellow-100 text-yellow-700 border-0">Pending</Badge>;
    if (status === "rejected") return <Badge className="bg-red-100 text-red-700 border-0">Rejected</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500">
          <BarChart2 className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Analysis Requests</h1>
          <p className="text-sm text-slate-500">Review and manage user analysis requests</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: total, icon: BarChart2, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Pending", value: pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Completed", value: completed, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 bg-white shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`size-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">All Requests</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : (q.data?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No analysis requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">User ID</th><th className="px-4 py-3 font-medium text-slate-500">Type</th><th className="px-4 py-3 font-medium text-slate-500">Status</th><th className="px-4 py-3 font-medium text-slate-500">Date</th></tr></thead>
                <tbody>
                  {q.data!.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.user_id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 capitalize text-slate-700">{row.type?.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">{statusBadge(row.status)}</td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums">{new Date(row.created_at).toLocaleDateString()}</td>
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
