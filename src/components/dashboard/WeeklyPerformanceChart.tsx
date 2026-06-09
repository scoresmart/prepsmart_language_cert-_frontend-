import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export type WeekPoint = { date: Date; label: string; avg: number | null };

type Props = {
  points: WeekPoint[];
  sevenDayAvg: number | null;
};

export function WeeklyPerformanceChart({ points, sevenDayAvg }: Props) {
  const data = points.map((p) => ({
    ...p,
    day: p.label,
    score: p.avg ?? null,
  }));

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-semibold">Weekly performance</CardTitle>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="size-3.5" aria-hidden />
              Trend
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Last 7 days · combined score out of 45</p>
        </div>
        <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          7-DAY AVG {sevenDayAvg != null ? `${sevenDayAvg.toFixed(1)}/45` : "—/45"}
        </div>
      </CardHeader>
      <CardContent className="h-72 w-full pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lcScoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152 65% 38%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(152 65% 38%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
            <YAxis domain={[0, 45]} ticks={[0, 15, 29, 45]} tickLine={false} axisLine={false} className="text-xs" />
            <Tooltip
              formatter={(v: number | undefined) => (v != null ? `${v.toFixed(1)} / 45` : "—")}
              labelFormatter={(_, payload) => {
                const d = payload?.[0]?.payload?.date as Date | undefined;
                return d ? format(d, "EEE d MMM") : "";
              }}
              contentStyle={{ borderRadius: 12 }}
            />
            <ReferenceLine
              y={29}
              stroke="hsl(32 95% 50%)"
              strokeDasharray="4 4"
              label={{ value: "Pass 29", position: "right", fill: "hsl(32 95% 40%)", fontSize: 11 }}
            />
            <ReferenceLine y={45} stroke="hsl(var(--muted-foreground) / 0.35)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(152 65% 38%)"
              strokeWidth={2}
              fill="url(#lcScoreFill)"
              connectNulls
              dot={{ r: 4, fill: "white", stroke: "hsl(152 65% 38%)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
