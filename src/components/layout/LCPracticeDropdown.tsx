import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LC_SECTIONS } from "@/lib/lcPracticeMenu";
import { moduleUrl } from "@/lib/practiceRoutes";

type Props = {
  align?: "left" | "center";
  triggerVariant?: "nav" | "cta";
  className?: string;
};

export function LCPracticeDropdown({ align = "center", triggerVariant = "nav", className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const isOpen = open || hovering;

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerClass =
    triggerVariant === "cta"
      ? cn(
          "group relative flex items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-2.5 text-sm font-bold text-emerald-800 shadow-lg shadow-black/20 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95",
          isOpen && "ring-2 ring-white/60 ring-offset-2 ring-offset-emerald-600",
        )
      : cn(
          "group relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300",
          isOpen
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40"
            : "text-white/80 hover:bg-white/10 hover:text-white",
        );

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
      >
        {triggerVariant === "cta" && (
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        )}
        <span className="relative">LC Practice</span>
        <ChevronDown
          className={cn(
            "relative size-4 transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "absolute top-full z-50 mt-3 w-[min(720px,calc(100vw-2rem))] origin-top overflow-hidden rounded-2xl border border-white/15 bg-[#1a1a32]/95 shadow-2xl shadow-blue-900/30 backdrop-blur-xl transition-all duration-300 ease-out",
          align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
          isOpen
            ? "pointer-events-auto scale-100 opacity-100 translate-y-0"
            : "pointer-events-none scale-95 opacity-0 -translate-y-2",
        )}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 px-5 py-3">
          <div className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="size-4 animate-pulse" />
              LC Practice — LanguageCert
            </span>
            <button
              type="button"
              onClick={() => { setOpen(false); setHovering(false); }}
              className="rounded-full p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
          {LC_SECTIONS.map((section, si) => (
            <div
              key={section.label}
              className="px-4 py-4"
              style={{ animationDelay: `${si * 60}ms` }}
            >
              <Link
                to={moduleUrl(section.module)}
                onClick={() => { setOpen(false); setHovering(false); }}
                className={cn(
                  "mb-3 flex items-center gap-1.5 text-sm font-bold transition-transform duration-300 hover:underline",
                  section.color,
                  isOpen && "animate-fade-in-up",
                )}
                style={{ animationDelay: `${si * 80 + 100}ms` }}
              >
                <section.icon className="size-4" />
                {section.label}
              </Link>
              <div className="space-y-0.5">
                {section.parts.map((part, pi) => (
                  <Link
                    key={part.to}
                    to={part.to}
                    state={{ openNavigator: true }}
                    onClick={() => { setOpen(false); setHovering(false); }}
                    className="group/item block rounded-lg px-2 py-1.5 text-xs text-white/55 transition-all duration-200 hover:translate-x-1 hover:bg-white/10 hover:text-white"
                    style={{ transitionDelay: `${pi * 20}ms` }}
                  >
                    <span className="inline-block transition-transform duration-200 group-hover/item:scale-105">
                      {part.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
