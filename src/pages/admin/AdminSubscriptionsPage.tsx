import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

export function AdminSubscriptionsPage() {
  const q = useQuery({
    queryKey: ["lc", "admin", "subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id,user_id,plan,status,current_period_end,stripe_customer_id")
        .order("current_period_end", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Stripe actions (cancel, refund, extend) — next phase.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All rows</CardTitle>
          <CardDescription>Service-role webhooks should upsert into this table.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : q.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-2 pr-3">User</th>
                    <th className="pb-2 pr-3">Plan</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Period end</th>
                    <th className="pb-2">Stripe customer</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.map((r: Record<string, unknown>) => (
                    <tr key={String(r.id)} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{String(r.user_id).slice(0, 8)}…</td>
                      <td className="py-2 pr-3">{String(r.plan)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{String(r.status)}</Badge>
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {format(parseISO(String(r.current_period_end)), "d MMM yyyy")}
                      </td>
                      <td className="py-2 font-mono text-xs">{String(r.stripe_customer_id ?? "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No subscriptions.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
