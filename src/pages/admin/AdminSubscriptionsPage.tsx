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
        .from("lc_stripe_subscriptions")
        .select("stripe_subscription_id,user_id,status,current_period_end,cancel_at_period_end,stripe_customer_id")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          LC Portal Pro subscriptions from Stripe. Cancel, refund or change them in the Stripe dashboard.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All rows</CardTitle>
          <CardDescription>Kept in sync by the lc-stripe-webhook function; paid access is granted in student_access.</CardDescription>
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
                    <th className="pb-2 pr-3">Subscription</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Period end</th>
                    <th className="pb-2">Stripe customer</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.map((r: Record<string, unknown>) => (
                    <tr key={String(r.stripe_subscription_id)} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{String(r.user_id).slice(0, 8)}…</td>
                      <td className="py-2 pr-3 font-mono text-xs">{String(r.stripe_subscription_id)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{String(r.status)}</Badge>
                        {r.cancel_at_period_end ? (
                          <span className="ml-2 text-xs text-muted-foreground">cancels at period end</span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-3 tabular-nums">
                        {r.current_period_end ? format(parseISO(String(r.current_period_end)), "d MMM yyyy") : "—"}
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
