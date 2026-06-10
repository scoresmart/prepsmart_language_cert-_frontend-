import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Analytics</h1>
        <p className="text-sm text-muted-foreground">Global difficulty, DAU/WAU, cohorts — scaffold.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next charts</CardTitle>
          <CardDescription>
            Query <code className="text-xs">lc.attempts</code> with service role or materialized aggregates refreshed by
            cron.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Suggested: average score by question_id, attempts per day histogram, signup funnel.
        </CardContent>
      </Card>
    </div>
  );
}
