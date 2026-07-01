import { cn } from "@/lib/utils";

type Props = {
  active?: boolean;
  barCount?: number;
  className?: string;
  colorClass?: string;
  compact?: boolean;
};

export function AudioWaveBars({
  active = false,
  barCount = 12,
  className,
  colorClass = "bg-cyan-500",
  compact = false,
}: Props) {
  const count = compact ? 8 : barCount;
  const heightClass = compact ? "h-5" : "h-10";
  return (
    <div className={cn("flex items-end justify-center gap-0.5", heightClass, className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-0.5 rounded-full transition-all sm:w-1",
            colorClass,
            active ? "animate-pulse" : "opacity-30",
          )}
          style={{
            height: active
              ? `${(compact ? 10 : 20) + ((i * 5) % (compact ? 14 : 24))}px`
              : compact
                ? "6px"
                : "8px",
            animationDelay: active ? `${i * 0.08}s` : undefined,
            animationDuration: active ? `${0.5 + (i % 4) * 0.1}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}
