import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLcSubscriptions } from "@/hooks/useLcSubscription";
import { pickAccessibleSubscription } from "@/lib/subscription";
import { useAuth } from "@/providers/AuthContext";
import { PracticePaywall } from "@/components/practice/PracticePaywall";

export function SubscriptionPage() {
  const { user } = useAuth();
  const { data: subs, isLoading } = useLcSubscriptions(user?.id);
  const active = pickAccessibleSubscription(subs);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-foreground">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Manage your LC plan. Stripe Checkout & Customer Portal hook up in a follow-up pass (env keys +
          serverless/edge webhook).
        </p>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Current access</CardTitle>
            <CardDescription>Based on <code className="text-xs">lc.subscriptions</code> and a 3-day grace window.</CardDescription>
          </div>
          {isLoading ? null : active ? (
            <Badge>{active.status}</Badge>
          ) : (
            <Badge variant="secondary">No active subscription</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {active ? (
            <>
              <p>
                Plan <span className="font-medium">{active.plan}</span> · period ends{" "}
                <span className="font-medium">{format(parseISO(active.current_period_end), "d MMM yyyy")}</span>
              </p>
              <Button variant="outline" size="sm" disabled>
                Open billing portal (Stripe — next phase)
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">Subscribe below to unlock practice routes.</p>
          )}
        </CardContent>
      </Card>

      <PracticePaywall title="Plans" />
    </div>
  );
}
