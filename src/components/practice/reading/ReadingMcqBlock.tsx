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
    <div className="border border-slate-200 bg-white">
      <div className="flex gap-4 border-b border-slate-200 bg-slate-100 px-4 py-3">
        <span className="text-2xl font-bold leading-none text-slate-700 tabular-nums">{number}</span>
        {prompt && (
          <p className="flex-1 text-sm leading-relaxed text-slate-700">{renderBoldText(prompt)}</p>
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
                "flex w-full items-center gap-4 px-4 py-3 text-left text-sm transition",
                !revealed && "cursor-pointer hover:bg-slate-50",
                revealed && !isSelected && !isCorrect && "opacity-50",
                showCorrect && "bg-emerald-50",
                showWrong && "bg-rose-50",
                isSelected && !revealed && "bg-cyan-50 ring-1 ring-inset ring-cyan-200",
              )}
            >
              <span className="w-6 shrink-0 text-base font-bold text-slate-800">{opt.label}</span>
              <span className="flex-1 text-slate-700">{opt.text}</span>
              {showCorrect && <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />}
              {showWrong && <XCircle className="size-4 shrink-0 text-rose-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
