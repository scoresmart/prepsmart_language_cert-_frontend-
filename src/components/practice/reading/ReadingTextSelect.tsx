import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  index: number;
  text: string;
  options: string[];
  value?: string;
  revealed?: boolean;
  correct?: string;
  onChange: (label: string) => void;
};

export function ReadingStatementSelect({
  index,
  text,
  options,
  value,
  revealed = false,
  correct,
  onChange,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const wrong = revealed && value && value !== correct;
  const right = revealed && value === correct;

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const pick = (label: string) => {
    if (revealed) return;
    onChange(label);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-lg border p-3 space-y-3 transition-colors",
        right ? "border-emerald-300 bg-emerald-50" : wrong ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50",
      )}
    >
      <p className="text-base text-slate-700 md:text-[17px]">
        <span className="mr-2 font-bold text-slate-500">{index}.</span>
        {text}
      </p>

      <div className="relative">
        <button
          type="button"
          disabled={revealed}
          onClick={() => !revealed && setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-base font-medium transition-all",
            open && "rounded-b-none border-b-transparent shadow-sm",
            value
              ? wrong
                ? "border-rose-400 bg-rose-50 text-rose-900"
                : right
                  ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                  : "border-cyan-400 bg-cyan-50 text-cyan-900"
              : "border-slate-300 bg-white text-slate-500 hover:border-slate-400",
          )}
        >
          <span>{value ? `Text ${value}` : "Select answer (A–D)"}</span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")}
          />
        </button>

        <div
          className={cn(
            "absolute left-0 right-0 z-20 overflow-hidden rounded-b-lg border border-t-0 border-slate-300 bg-white shadow-lg",
            "origin-top transition-all duration-200 ease-out",
            open ? "scale-y-100 opacity-100" : "pointer-events-none scale-y-95 opacity-0",
          )}
        >
          {options.map((label) => {
            const selected = value === label;
            const isCorrectOption = revealed && label === correct;
            const isWrongPick = revealed && selected && label !== correct;

            return (
              <button
                key={label}
                type="button"
                onClick={() => pick(label)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-base transition hover:bg-slate-50",
                  selected && !revealed && "bg-cyan-50",
                  isCorrectOption && "bg-emerald-50 text-emerald-800",
                  isWrongPick && "bg-rose-50 text-rose-800",
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-amber-300 bg-amber-50 text-xs font-bold text-amber-900">
                  {label}
                </span>
                <span className="flex-1 text-slate-700">Text {label}</span>
                {selected && <Check className="size-4 shrink-0 text-cyan-600" />}
                {isCorrectOption && !selected && revealed && (
                  <span className="text-xs font-medium text-emerald-600">Correct</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {wrong && correct && (
        <p className="text-xs font-medium text-emerald-700">Correct answer: Text {correct}</p>
      )}
    </div>
  );
}
