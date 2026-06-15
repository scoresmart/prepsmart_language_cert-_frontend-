import { cn } from "@/lib/utils";

type Props = {
  active?: boolean;
  barCount?: number;
  className?: string;
  colorClass?: string;
};

export function AudioWaveBars({
  active = false,
  barCount = 12,
  className,
  colorClass = "bg-cyan-500",
}: Props) {
  return (
    <div className={cn("flex h-10 items-end justify-center gap-1", className)} aria-hidden>
      {Array.from({ length: barCount }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full transition-all",
            colorClass,
            active ? "animate-pulse" : "opacity-30",
          )}
          style={{
            height: active ? `${20 + ((i * 7) % 24)}px` : "8px",
            animationDelay: active ? `${i * 0.08}s` : undefined,
            animationDuration: active ? `${0.5 + (i % 4) * 0.1}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}
