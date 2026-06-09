import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";

export function AdminDashboardPage() {
  const stats = useQuery({
    queryKey: ["lc", "admin", "stats"],
    queryFn: async () => {
      const since24 = subDays(new Date(), 1).toISOString();
      const since7 = subDays(new Date(), 7).toISOString();
      const since30 = subDays(new Date(), 30).toISOString();

      const [users, subs, a24, a7, a30, recent] = await Promise.all([
        supabase.from("user_profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("attempts").select("id", { count: "exact", head: true }).gte("completed_at", since24),
        supabase.from("attempts").select("id", { count: "exact", head: true }).gte("completed_at", since7),
        supabase.from("attempts").select("id", { count: "exact", head: true }).gte("completed_at", since30),
        supabase
          .from("user_profiles")
          .select("id,email,full_name,created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      for (const r of [users, subs, a24, a7, a30, recent]) {
        if (r.error) throw r.error;
      }

      return {
        users: users.count ?? 0,
        activeSubs: subs.count ?? 0,
        attempts24: a24.count ?? 0,
        attempts7: a7.count ?? 0,
        attempts30: a30.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  if (stats.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (stats.error) {
    return <p className="text-sm text-destructive">{(stats.error as Error).message}</p>;
  }

  const s = stats.data!;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Admin overview</h1>
        <p className="text-sm text-muted-foreground">LC schema aggregates (RLS: admin-only reads across users).</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total users</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-3xl">{s.users}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-3xl">{s.activeSubs}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Wire Stripe summaries here.</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attempts (24h)</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-3xl">{s.attempts24}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attempts (7d)</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-3xl">{s.attempts7}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attempts (30d)</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-3xl">{s.attempts30}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent signups</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2">Email</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {s.recent.map((u: { id: string; email: string; full_name: string | null; created_at: string }) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.full_name}</td>
                  <td className="py-2 tabular-nums text-muted-foreground">{new Date(u.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
