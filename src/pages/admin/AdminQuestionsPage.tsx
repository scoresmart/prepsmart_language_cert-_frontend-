import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

export function AdminQuestionsPage() {
  const q = useQuery({
    queryKey: ["lc", "admin", "questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id,title,type,level,max_score,is_published,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Questions</h1>
        <p className="text-sm text-muted-foreground">CRUD, audio upload, and CSV import — scaffold only.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Published bank</CardTitle>
          <CardDescription>Admin-only list from <code className="text-xs">lc.questions</code>.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : q.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 pr-3">Title</th>
                    <th className="pb-2 pr-3">Type</th>
                    <th className="pb-2 pr-3">Level</th>
                    <th className="pb-2 pr-3">Max</th>
                    <th className="pb-2">Pub</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.map((row: Record<string, unknown>) => (
                    <tr key={String(row.id)} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3">{String(row.title)}</td>
                      <td className="py-2 pr-3 capitalize">{String(row.type).replace("_", " ")}</td>
                      <td className="py-2 pr-3">{String(row.level)}</td>
                      <td className="py-2 pr-3 tabular-nums">{String(row.max_score)}</td>
                      <td className="py-2">
                        {row.is_published ? <Badge>Yes</Badge> : <Badge variant="secondary">No</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No questions yet. Seed via SQL or add a row in Supabase.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
