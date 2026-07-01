import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PracticeModuleKind = "reading" | "writing" | "listening" | "speaking";

const MODULE_GRADIENT: Record<PracticeModuleKind, string> = {
  reading: "bg-gradient-to-r from-[#ff5858] to-[#f857a6]",
  writing: "bg-gradient-to-r from-[#ff7e5f] to-[#feb47b]",
  listening: "bg-gradient-to-r from-[#f857a6] to-[#c471ed]",
  speaking: "bg-gradient-to-r from-[#ff5858] to-[#f857a6]",
};

type Props = {
  module: PracticeModuleKind;
  partLabel: string;
  title: string;
  instructions?: string;
  badge: string;
  icon: LucideIcon;
  className?: string;
  compact?: boolean;
};

export function PracticePartHeaderBanner({
  module,
  partLabel,
  title,
  instructions,
  badge,
  icon: Icon,
  className,
  compact = false,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl shadow-md",
        compact ? "px-3 py-2.5 sm:px-4 sm:py-3" : "px-5 py-5 md:px-6 md:py-6",
        MODULE_GRADIENT[module],
        className,
      )}
    >
      <div className={cn("flex items-start", compact ? "gap-2.5" : "gap-4")}>
        <div
          className={cn(
            "flex shrink-0 flex-col items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm",
            compact ? "size-10 sm:size-11" : "size-14",
          )}
        >
          <Icon className={cn("text-white", compact ? "size-4" : "size-5")} aria-hidden />
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:text-[10px]">
            {badge}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold uppercase tracking-wide text-white/80", compact ? "text-[10px]" : "text-xs")}>
            {partLabel}
          </p>
          <h2 className={cn("font-bold leading-tight text-white", compact ? "text-sm sm:text-base" : "mt-0.5 text-xl md:text-2xl")}>
            {title}
          </h2>
          {instructions && (
            <p
              className={cn(
                "leading-relaxed text-white/90",
                compact ? "mt-0.5 line-clamp-2 text-[11px] sm:text-xs" : "mt-2 text-sm",
              )}
            >
              {instructions}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function partBadge(module: PracticeModuleKind, part: string): string {
  const p = part.toUpperCase();
  if (module === "reading") return `R${p}`;
  if (module === "writing") return `W${p}`;
  if (module === "speaking") return `S${p}`;
  return `L${p}`;
}
