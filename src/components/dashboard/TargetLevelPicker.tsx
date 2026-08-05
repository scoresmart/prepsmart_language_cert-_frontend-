import * as React from "react";
import { Check, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/types/lc";

const LEVELS: CefrLevel[] = ["B1", "B2", "C1", "C2"];

type Props = {
  targetLevel: CefrLevel | null;
  onSave: (level: CefrLevel) => Promise<void>;
  saving?: boolean;
  className?: string;
  /** When true, render as the banner CTA button instead of an inline link. */
  asBannerCta?: boolean;
};

export function TargetLevelPicker({
  targetLevel,
  onSave,
  saving,
  className,
  asBannerCta = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<CefrLevel | "">(targetLevel ?? "");
  const ref = React.useRef<HTMLDivElement>(null);
  const savingRef = React.useRef(false);

  React.useEffect(() => {
    setValue(targetLevel ?? "");
  }, [targetLevel]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleSave() {
    if (!value || saving || savingRef.current) return;
    savingRef.current = true;
    try {
      await onSave(value);
      setOpen(false);
    } finally {
      savingRef.current = false;
    }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      {asBannerCta ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/20 active:scale-95"
        >
          <Target className="size-4" />
          Set Target Score
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-bold underline underline-offset-2 transition-colors hover:text-yellow-200"
        >
          {targetLevel ? "Change target" : "Set target"}
        </button>
      )}

      <div
        className={cn(
          "absolute left-0 top-full z-[200] pt-2 transition-all duration-300 ease-out",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <div
          className={cn(
            "w-72 origin-top rounded-2xl border border-white/25 bg-[#0d3d32]/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl transition-transform duration-300",
            open ? "scale-100" : "scale-95",
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <Target className="size-4 text-yellow-200" />
              Target CEFR level
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setValue(level)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-bold transition-all",
                  value === level
                    ? "border-yellow-300/70 bg-yellow-300/20 text-yellow-100"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/15",
                )}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!value || saving}
              onClick={() => void handleSave()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-sm font-bold text-emerald-800 transition-all hover:bg-yellow-100 disabled:opacity-50"
            >
              <Check className="size-4" />
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
