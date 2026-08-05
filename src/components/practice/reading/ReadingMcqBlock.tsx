import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderBoldText } from "./renderBoldText";

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

export function ReadingMcqBlock({
  number,
  prompt,
  options,
  selected,
  revealed = false,
  correctAnswer,
  onSelect,
}: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex gap-4 border-b border-slate-200 bg-slate-100 px-4 py-3.5 md:px-5 md:py-4">
        <span className="text-2xl font-bold leading-none text-slate-700 tabular-nums md:text-3xl">{number}</span>
        {prompt && (
          <p className="flex-1 text-base leading-relaxed text-slate-800 md:text-[17px]">
            {renderBoldText(prompt)}
          </p>
        )}
      </div>
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
                "flex w-full items-center gap-4 px-4 py-3.5 text-left text-base transition md:px-5 md:py-4 md:text-[17px]",
                !revealed && "cursor-pointer hover:bg-slate-50",
                revealed && !isSelected && !isCorrect && "opacity-50",
                showCorrect && "bg-emerald-50",
                showWrong && "bg-rose-50",
                isSelected && !revealed && "bg-cyan-100 ring-2 ring-inset ring-cyan-400",
                isSelected && "font-bold",
              )}
            >
              <span
                className={cn(
                  "w-7 shrink-0 text-lg",
                  isSelected ? "font-extrabold text-cyan-800" : "font-bold text-slate-800",
                )}
              >
                {opt.label}
              </span>
              <span className={cn("flex-1", isSelected ? "font-bold text-cyan-950" : "text-slate-700")}>
                {opt.text}
              </span>
              {showCorrect && <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />}
              {showWrong && <XCircle className="size-5 shrink-0 text-rose-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
