import * as React from "react";
import { format, startOfDay } from "date-fns";
import { CalendarDays, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  examDate: string | null;
  onSave: (isoDate: string) => Promise<void>;
  saving?: boolean;
  className?: string;
};

export function ExamDatePicker({ examDate, onSave, saving, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const minDate = format(startOfDay(new Date()), "yyyy-MM-dd");

  React.useEffect(() => {
    setValue(examDate ? examDate.slice(0, 10) : "");
  }, [examDate]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const savingRef = React.useRef(false);

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-bold underline underline-offset-2 transition-colors hover:text-yellow-200"
      >
        {examDate ? "Change date" : "Set Date"}
      </button>

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
              <CalendarDays className="size-4 text-cyan-200" />
              Exam date
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <input
            type="date"
            min={minDate}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/30 [color-scheme:dark]"
          />

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
