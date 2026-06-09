import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Deeper trends than the dashboard home.</p>
      </div>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Coming next</CardTitle>
          <CardDescription>
            Wire this page to saved attempts (by level, task type, and time-to-peak). The dashboard already surfaces
            weekly averages.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Suggested charts: rolling 30-day average, level breakdown (B1–C2), dialogue vs rapid review split.
        </CardContent>
      </Card>
    </div>
  );
}
