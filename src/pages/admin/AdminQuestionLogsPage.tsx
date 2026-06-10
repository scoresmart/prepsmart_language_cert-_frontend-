import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

type QuestionLog = {
  id: string;
  user_id: string;
  question: string;
  response?: string;
  category?: string;
  created_at: string;
};

export function AdminQuestionLogsPage() {
  const [search, setSearch] = React.useState("");

  const q = useQuery({
    queryKey: ["admin", "question-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_question_logs")
        .select("id,user_id,question,response,category,created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as QuestionLog[];
    },
  });

  const filtered = (q.data ?? []).filter((r) => !search || r.question.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500"><History className="size-5 text-white" /></div>
        <div><h1 className="text-xl font-bold text-slate-800">Question Logs</h1><p className="text-sm text-slate-500">All questions asked to the AI Tutor</p></div>
      </div>
      <Card className="border-0 bg-white shadow-sm"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" /><Input placeholder="Search questions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardContent></Card>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">{filtered.length} log entries</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No question logs yet.</div> : (
            <div className="divide-y">
              {filtered.map((row) => (
                <div key={row.id} className="p-4 hover:bg-slate-50/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-slate-400">{row.user_id.slice(0, 8)}…</span>
                        {row.category && <Badge variant="secondary" className="text-xs capitalize">{row.category}</Badge>}
                        <span className="text-xs text-slate-400">{new Date(row.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{row.question}</p>
                      {row.response && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{row.response}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
