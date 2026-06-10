import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthContext";
import type { LcAttempt } from "@/types/lc";

export function AttemptsPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["lc", "attempts", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("id,question_type,score,max_score,completed_at")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Pick<LcAttempt, "id" | "question_type" | "score" | "max_score" | "completed_at">[];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Attempts</h1>
        <p className="text-sm text-muted-foreground">Recent submissions from your account.</p>
      </div>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : q.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">When</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.map((a) => (
                    <tr key={a.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-4 tabular-nums">{format(parseISO(a.completed_at), "dd MMM yyyy HH:mm")}</td>
                      <td className="py-2 pr-4 capitalize">{a.question_type.replace("_", " ")}</td>
                      <td className="py-2 tabular-nums">
                        {a.score != null ? `${Number(a.score).toFixed(1)} / ${a.max_score}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attempts yet. Complete a practice session to see it here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
