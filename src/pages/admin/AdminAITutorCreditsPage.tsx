import { useQuery } from "@tanstack/react-query";
import { Brain, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

type CreditRecord = {
  id: string;
  user_id: string;
  credits_total: number;
  credits_used: number;
  plan: string;
  reset_at?: string;
};

export function AdminAITutorCreditsPage() {
  const q = useQuery({
    queryKey: ["admin", "ai-tutor-credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_tutor_credits")
        .select("id,user_id,credits_total,credits_used,plan,reset_at")
        .order("credits_used", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as CreditRecord[];
    },
  });

  const totalUsed = q.data?.reduce((a, b) => a + (b.credits_used ?? 0), 0) ?? 0;
  const totalGranted = q.data?.reduce((a, b) => a + (b.credits_total ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500">
          <Brain className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">AI Tutor Credits</h1>
          <p className="text-sm text-slate-500">Monitor credit usage across all users</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Users Tracked", value: q.data?.length ?? 0, icon: Brain, bg: "bg-violet-50", color: "text-violet-500" },
          { label: "Total Credits Granted", value: totalGranted, icon: TrendingUp, bg: "bg-green-50", color: "text-green-500" },
          { label: "Total Credits Used", value: totalUsed, icon: TrendingDown, bg: "bg-orange-50", color: "text-orange-500" },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="border-0 bg-white shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}><Icon className={`size-5 ${color}`} /></div>
              <div><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">Credit Allocations</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : (q.data?.length ?? 0) === 0 ? <div className="p-8 text-center text-sm text-slate-400">No credit records.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">User</th><th className="px-4 py-3 font-medium text-slate-500">Plan</th><th className="px-4 py-3 font-medium text-slate-500">Used</th><th className="px-4 py-3 font-medium text-slate-500">Total</th><th className="px-4 py-3 font-medium text-slate-500">Usage %</th></tr></thead>
                <tbody>
                  {q.data!.map((row) => {
                    const pct = row.credits_total > 0 ? Math.round((row.credits_used / row.credits_total) * 100) : 0;
                    return (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.user_id.slice(0, 12)}…</td>
                        <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{row.plan}</Badge></td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{row.credits_used}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-500">{row.credits_total}</td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${pct > 80 ? "bg-red-400" : "bg-violet-400"}`} style={{ width: `${pct}%` }} /></div><span className="text-xs text-slate-500">{pct}%</span></div></td>
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
