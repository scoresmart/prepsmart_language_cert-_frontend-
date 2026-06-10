import { useQuery } from "@tanstack/react-query";
import { PieChart, TrendingUp, MessageSquare, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

export function AdminAITutorAnalyticsPage() {
  const stats = useQuery({
    queryKey: ["admin", "ai-tutor-analytics"],
    queryFn: async () => {
      const [conversations, credits] = await Promise.all([
        supabase.from("ai_conversations").select("id", { count: "exact", head: true }),
        supabase.from("ai_tutor_credits").select("credits_used", { count: "exact" }),
      ]);
      return {
        conversations: conversations.count ?? 0,
        totalCreditsUsed: (credits.data ?? []).reduce((a: number, b: { credits_used: number }) => a + (b.credits_used ?? 0), 0),
      };
    },
  });

  const s = stats.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500">
          <PieChart className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">AI Tutor Analytics</h1>
          <p className="text-sm text-slate-500">Usage statistics and performance metrics</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Total Conversations", value: s?.conversations ?? 0, icon: MessageSquare, bg: "bg-sky-50", color: "text-sky-500" },
          { label: "Credits Used", value: s?.totalCreditsUsed ?? 0, icon: TrendingUp, bg: "bg-pink-50", color: "text-pink-500" },
          { label: "Active Users", value: "—", icon: Users, bg: "bg-violet-50", color: "text-violet-500" },
        ].map(({ label, value, icon: Icon, bg, color }) => (
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
        <CardHeader><CardTitle className="text-base">Detailed Analytics</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Charts and detailed breakdowns for AI tutor interactions, question types, session duration, and feedback scores are under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
