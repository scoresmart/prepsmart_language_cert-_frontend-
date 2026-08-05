import * as React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LC_SECTIONS } from "@/lib/lcPracticeMenu";
import { moduleUrl } from "@/lib/practiceRoutes";

type Props = {
  align?: "left" | "center" | "right";
  triggerVariant?: "nav" | "cta" | "workspace";
  className?: string;
};

const MENU_WIDTH = 680;
const HOVER_CLOSE_MS = 250;
/** Overlap + padding so the cursor can travel from trigger to menu without closing. */
const MENU_BRIDGE_PX = 16;

function closeMenu(setOpen: (v: boolean) => void, setHovering: (v: boolean) => void, setHoverMenu: (v: boolean) => void) {
  setOpen(false);
  setHovering(false);
  setHoverMenu(false);
}

export function LCPracticeDropdown({ align = "center", triggerVariant = "nav", className }: Props) {
  const menuId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);
  const [hoverMenu, setHoverMenu] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const leaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "hidden",
    pointerEvents: "none",
  });
  const isOpen = open || hovering || hoverMenu;

  const cancelScheduledClose = React.useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const scheduleHoverClose = React.useCallback(() => {
    cancelScheduledClose();
    leaveTimerRef.current = setTimeout(() => {
      setHovering(false);
      setHoverMenu(false);
    }, HOVER_CLOSE_MS);
  }, [cancelScheduledClose]);

  const handleTriggerEnter = React.useCallback(() => {
    cancelScheduledClose();
    setHovering(true);
  }, [cancelScheduledClose]);

  const handleMenuEnter = React.useCallback(() => {
    cancelScheduledClose();
    setHoverMenu(true);
  }, [cancelScheduledClose]);

  const updatePosition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const width = Math.min(MENU_WIDTH, window.innerWidth - 16);

    let left = rect.left;
    if (align === "center") {
      left = rect.left + rect.width / 2 - width / 2;
    } else if (align === "right") {
      left = rect.right - width;
    }

    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    setMenuStyle({
      position: "fixed",
      top: rect.bottom - 4,
      left,
      width,
      zIndex: 9999,
      paddingTop: MENU_BRIDGE_PX,
      visibility: "visible",
      pointerEvents: "auto",
    });
  }, [align]);

  React.useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  React.useEffect(() => {
    return () => cancelScheduledClose();
  }, [cancelScheduledClose]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu(setOpen, setHovering, setHoverMenu);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu(setOpen, setHovering, setHoverMenu);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const triggerClass =
    triggerVariant === "cta"
      ? cn(
          "group relative flex items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-2.5 text-sm font-bold text-emerald-800 shadow-lg shadow-black/20 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95",
          isOpen && "ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-emerald-700",
        )
      : triggerVariant === "workspace"
        ? cn(
            "group relative flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-all duration-200",
            isOpen
              ? "bg-slate-100 text-slate-900"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )
        : cn(
            "group relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300",
            isOpen
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40 scale-105"
              : "text-white/80 hover:bg-white/10 hover:text-white hover:scale-105",
          );

  const menu = (
    <div
      ref={menuRef}
      id={menuId}
      style={menuStyle}
      className={cn(
        "transition-all duration-200 ease-out",
        isOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
      )}
      onMouseEnter={handleMenuEnter}
      onMouseLeave={scheduleHoverClose}
    >
      <div
        className={cn(
          "origin-top overflow-hidden rounded-2xl border border-white/20 bg-[#1a1a32] shadow-2xl shadow-black/50 backdrop-blur-xl transition-transform duration-200",
          isOpen ? "scale-100" : "scale-95",
        )}
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 px-5 py-3">
          <div className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="size-4 shrink-0 animate-pulse" />
              <span className="truncate">LC Practice — LanguageCert</span>
            </span>
            <button
              type="button"
              onClick={() => closeMenu(setOpen, setHovering, setHoverMenu)}
              className="shrink-0 rounded-full p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
          {LC_SECTIONS.map((section) => (
            <div key={section.label} className="min-w-0 px-3 py-4 sm:px-4">
              <Link
                to={moduleUrl(section.module)}
                onClick={() => closeMenu(setOpen, setHovering, setHoverMenu)}
                className={cn(
                  "mb-3 flex items-center gap-1.5 text-sm font-bold transition-colors hover:underline",
                  section.color,
                )}
              >
                <section.icon className="size-4 shrink-0" />
                {section.label}
              </Link>
              <div className="space-y-0.5">
                {section.parts.map((part) => (
                  <Link
                    key={part.to}
                    to={part.to}
                    state={{ openNavigator: true }}
                    onClick={() => closeMenu(setOpen, setHovering, setHoverMenu)}
                    className="block rounded-lg px-2 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {part.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn("relative inline-block", className)}
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={scheduleHoverClose}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            cancelScheduledClose();
            setOpen((v) => {
              const next = !v;
              if (next) updatePosition();
              return next;
            });
          }}
          className={triggerClass}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls={menuId}
        >
          {triggerVariant === "cta" && (
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          )}
          <span className="relative">LC Practice</span>
          <ChevronDown
            className={cn("relative size-4 transition-transform duration-300", isOpen && "rotate-180")}
          />
        </button>
      </div>

      {isOpen && typeof document !== "undefined" && createPortal(menu, document.body)}
    </>
  );
}
