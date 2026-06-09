import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

export function AdminUsersPage() {
  const q = useQuery({
    queryKey: ["lc", "admin", "users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("user_profiles")
        .select("id,email,full_name,role,exam_date,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (pErr) throw pErr;
      const { data: subs, error: sErr } = await supabase
        .from("subscriptions")
        .select("user_id,status,plan,current_period_end")
        .order("current_period_end", { ascending: false });
      if (sErr) throw sErr;
      const subByUser = new Map<string, { status: string; plan: string }>();
      for (const s of subs ?? []) {
        const uid = s.user_id as string;
        if (!subByUser.has(uid)) {
          subByUser.set(uid, { status: s.status as string, plan: s.plan as string });
        }
      }
      return (profiles ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        sub: subByUser.get(String(p.id)),
      }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Users</h1>
        <p className="text-sm text-muted-foreground">Search, role changes, and suspensions — next iteration.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Directory</CardTitle>
          <CardDescription>Joined with latest subscription row (if any).</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : q.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 pr-3">Email</th>
                    <th className="pb-2 pr-3">Role</th>
                    <th className="pb-2 pr-3">Plan</th>
                    <th className="pb-2">Sub status</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.map((u: Record<string, unknown>) => (
                    <tr key={String(u.id)} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3">{String(u.email)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{String(u.role)}</Badge>
                      </td>
                      <td className="py-2 pr-3">{(u.sub as { plan?: string } | undefined)?.plan ?? "—"}</td>
                      <td className="py-2">{(u.sub as { status?: string } | undefined)?.status ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No profiles.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
