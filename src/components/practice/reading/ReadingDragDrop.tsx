import { cn } from "@/lib/utils";

/** Orange sentence card for Part 2 bank */
export function ReadingSentenceCard({
  label,
  text,
  used,
  onDragStart,
  onClick,
}: {
  label: string;
  text: string;
  used?: boolean;
  onDragStart?: () => void;
  onClick?: () => void;
}) {
  return (
    <div
      draggable={!used}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", label);
        onDragStart?.();
      }}
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 border-amber-400/80 bg-amber-50 px-3 py-2.5 text-sm text-slate-800 transition",
        used ? "cursor-default opacity-40" : "cursor-grab hover:border-amber-500 hover:bg-amber-100 active:cursor-grabbing",
      )}
    >
      <span className="font-bold text-amber-800">{label}.</span> {text}
    </div>
  );
}

/** Drop zone in passage (Part 2) */
export function ReadingGapDrop({
  gapId,
  value,
  label,
  revealed,
  correct,
  onDrop,
  onClear,
}: {
  gapId: string;
  value?: string;
  label?: string;
  revealed?: boolean;
  correct?: boolean;
  onDrop: (gapId: string, label: string) => void;
  onClear?: () => void;
}) {
  const wrong = revealed && value && !correct;
  const right = revealed && value && correct;

  return (
    <span
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.getData("text/plain");
        if (dropped) onDrop(gapId, dropped);
      }}
      className={cn(
        "mx-0.5 inline-flex min-h-[28px] min-w-[48px] items-center justify-center rounded border-2 border-dashed px-2 py-0.5 align-middle text-xs font-bold",
        value
          ? right
            ? "border-emerald-400 bg-emerald-50 text-emerald-800"
            : wrong
              ? "border-rose-400 bg-rose-50 text-rose-800"
              : "border-amber-400 bg-amber-50 text-amber-900"
          : "border-slate-300 bg-white text-slate-400",
      )}
    >
      {value ? (
        <button type="button" onClick={onClear} disabled={revealed} className="font-bold">
          {value}
        </button>
      ) : (
        <span className="text-[10px] text-slate-400">[{gapId}]</span>
      )}
      {wrong && label && <span className="ml-1 text-emerald-700">✓{label}</span>}
    </span>
  );
}

/** Peach passage block for Part 3 */
export function ReadingPassageBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 p-4">
      <p className="mb-2 text-center text-sm font-bold text-slate-800">{label}.</p>
      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{text}</p>
    </div>
  );
}

/** Statement drop zone for Part 3 */
export function ReadingStatementDrop({
  index,
  text,
  value,
  revealed,
  correct,
  onDrop,
  onClear,
}: {
  index: number;
  text: string;
  value?: string;
  revealed?: boolean;
  correct?: string;
  onDrop: (label: string) => void;
  onClear?: () => void;
}) {
  const wrong = revealed && value && value !== correct;
  const right = revealed && value === correct;

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.getData("text/plain");
        if (dropped) onDrop(dropped);
      }}
      className={cn(
        "rounded-lg border p-3 space-y-2",
        right ? "border-emerald-300 bg-emerald-50" : wrong ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50",
      )}
    >
      <p className="text-sm text-slate-700">
        <span className="mr-2 font-bold text-slate-500">{index}.</span>
        {text}
      </p>
      <div
        className={cn(
          "flex min-h-[36px] items-center rounded border-2 border-dashed px-3 py-1.5 text-sm font-bold",
          value
            ? "border-amber-400 bg-amber-50 text-amber-900"
            : "border-slate-300 bg-white text-slate-400",
        )}
      >
        {value ? (
          <button type="button" onClick={onClear} disabled={revealed} className="w-full text-left">
            Text {value}
          </button>
        ) : (
          "Drop answer here (A–D)"
        )}
        {wrong && correct && <span className="ml-2 text-xs font-normal text-emerald-700">✓ Text {correct}</span>}
      </div>
    </div>
  );
}

/** Draggable label chip for Part 3 */
export function ReadingTextLabelChip({
  label,
  used,
}: {
  label: string;
  used?: boolean;
}) {
  return (
    <div
      draggable={!used}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", label)}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border-2 border-amber-400 bg-amber-50 text-sm font-bold text-amber-900",
        used ? "opacity-40" : "cursor-grab hover:bg-amber-100 active:cursor-grabbing",
      )}
    >
      {label}
    </div>
  );
}
