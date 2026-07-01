import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { label: string; text: string };

type Props = {
  number: number;
  prompt?: string;
  options: Option[];
  selected?: string;
  revealed?: boolean;
  correctAnswer?: string;
  onSelect: (label: string) => void;
};

export function ListeningMcqBlock({
  number,
  prompt,
  options,
  selected,
  revealed = false,
  correctAnswer,
  onSelect,
}: Props) {
  return (
    <div className="space-y-0 border border-slate-200 bg-white">
      {/* Question number header — LanguageCert style */}
      <div className="flex items-center bg-slate-100 border-b border-slate-200 px-4 py-2.5">
        <span className="text-2xl font-bold text-slate-700 tabular-nums">{number}</span>
        {prompt && (
          <span className="ml-4 text-sm text-slate-600">{prompt}</span>
        )}
      </div>

      {/* Options — one per row */}
      <div className="divide-y divide-slate-100">
        {options.map((opt) => {
          const isSelected = selected === opt.label;
          const isCorrect = correctAnswer === opt.label;
          const showCorrect = revealed && isCorrect;
          const showWrong = revealed && isSelected && !isCorrect;

          return (
            <button
              key={opt.label}
              type="button"
              disabled={revealed}
              onClick={() => onSelect(opt.label)}
              className={cn(
                "flex w-full items-center gap-4 px-4 py-3.5 text-left text-sm transition",
                !revealed && "hover:bg-slate-50 cursor-pointer",
                revealed && !isSelected && !isCorrect && "opacity-50",
                showCorrect && "bg-emerald-50",
                showWrong && "bg-rose-50",
                isSelected && !revealed && "bg-cyan-100 ring-2 ring-inset ring-cyan-400",
                isSelected && "font-bold",
              )}
            >
              <span
                className={cn(
                  "w-6 shrink-0 text-base",
                  isSelected ? "font-extrabold text-cyan-800" : "font-bold text-slate-800",
                )}
              >
                {opt.label}
              </span>
              <span className={cn("flex-1", isSelected ? "font-bold text-cyan-950" : "text-slate-700")}>{opt.text}</span>
              {showCorrect && <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />}
              {showWrong && <XCircle className="size-4 text-rose-600 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
