import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

export type WeekPoint = { date: Date; label: string; avg: number | null };

type Props = {
  points: WeekPoint[];
  sevenDayAvg: number | null;
  dark?: boolean;
};

export function WeeklyPerformanceChart({ points, sevenDayAvg, dark }: Props) {
  const data = points.map((p) => ({
    ...p,
    day: p.label,
    score: p.avg ?? null,
  }));

  const gridStroke = dark ? "rgba(255,255,255,0.08)" : undefined;
  const tickFill = dark ? "rgba(255,255,255,0.5)" : undefined;

  return (
    <div className={dark ? "p-4" : ""}>
      <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${dark ? "" : "px-1"}`}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-base font-semibold ${dark ? "text-white" : ""}`}>Weekly performance</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <TrendingUp className="size-3.5" aria-hidden />
              Trend
            </span>
          </div>
          <p className={`text-xs ${dark ? "text-white/45" : "text-muted-foreground"}`}>Last 7 days · combined score out of 45</p>
        </div>
        <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          7-DAY AVG {sevenDayAvg != null ? `${sevenDayAvg.toFixed(1)}/45` : "—/45"}
        </div>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lcScoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#48c6ef" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#0e9f73" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke ?? "hsl(var(--border))"} vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 11 }} />
            <YAxis domain={[0, 45]} ticks={[0, 15, 29, 45]} tickLine={false} axisLine={false} tick={{ fill: tickFill, fontSize: 11 }} />
            <Tooltip
              formatter={(v) => (v != null ? `${(v as number).toFixed(1)} / 45` : "—")}
              labelFormatter={(_, payload) => {
                const d = payload?.[0]?.payload?.date as Date | undefined;
                return d ? format(d, "EEE d MMM") : "";
              }}
              contentStyle={{
                borderRadius: 12,
                background: dark ? "#1a1a2e" : undefined,
                border: dark ? "1px solid rgba(255,255,255,0.1)" : undefined,
                color: dark ? "#fff" : undefined,
              }}
            />
            <ReferenceLine
              y={29}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: "Pass 29", position: "right", fill: "#fbbf24", fontSize: 11 }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#48c6ef"
              strokeWidth={2.5}
              fill="url(#lcScoreFill)"
              connectNulls
              dot={{ r: 4, fill: dark ? "#1a1a2e" : "white", stroke: "#48c6ef", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#fde047", stroke: "#48c6ef", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
