import { cn } from "@/lib/utils";

type Props = {
  count: number;
  min: number;
  max: number;
  className?: string;
};

export function WritingWordCountBar({ count, min, max, className }: Props) {
  const pct = max > 0 ? Math.min(100, (count / max) * 100) : 0;
  const inRange = count >= min && count <= max;
  const underMin = count > 0 && count < min;
  const overMax = count > max;

  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-600">
          Word count
          <span
            className={cn(
              "ml-1.5 tabular-nums",
              count === 0 && "text-slate-400",
              underMin && "text-amber-600",
              inRange && "text-emerald-600",
              overMax && "text-rose-600",
            )}
          >
            {count}
          </span>
          <span className="text-slate-400"> / {min}–{max}</span>
        </span>
        {count > 0 && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              inRange && "bg-emerald-100 text-emerald-700",
              underMin && "bg-amber-100 text-amber-700",
              overMax && "bg-rose-100 text-rose-700",
            )}
          >
            {inRange ? "Ready" : underMin ? "Too short" : "Too long"}
          </span>
        )}
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            count === 0 && "w-0 bg-slate-300",
            underMin && "bg-amber-500",
            inRange && "bg-emerald-500",
            overMax && "bg-rose-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
