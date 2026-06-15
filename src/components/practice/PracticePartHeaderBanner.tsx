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
};

export function PracticePartHeaderBanner({
  module,
  partLabel,
  title,
  instructions,
  badge,
  icon: Icon,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl px-5 py-5 shadow-md md:px-6 md:py-6",
        MODULE_GRADIENT[module],
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="size-5 text-white" aria-hidden />
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{badge}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{partLabel}</p>
          <h2 className="mt-0.5 text-xl font-bold leading-tight text-white md:text-2xl">{title}</h2>
          {instructions && (
            <p className="mt-2 text-sm leading-relaxed text-white/90">{instructions}</p>
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
