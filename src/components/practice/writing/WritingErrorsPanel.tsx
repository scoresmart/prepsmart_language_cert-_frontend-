import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WritingError } from "@/lib/scoringTypes";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightSpellingInText(text: string, spellingErrors: WritingError[]) {
  if (!text || spellingErrors.length === 0) return text;

  const unique = [...new Map(spellingErrors.map((e) => [e.word.toLowerCase(), e])).values()].sort(
    (a, b) => b.word.length - a.word.length,
  );

  const pattern = unique.map((e) => escapeRegExp(e.word)).join("|");
  if (!pattern) return text;

  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const match = unique.find((e) => e.word.toLowerCase() === part.toLowerCase());
    if (!match) return part;
    return (
      <mark
        key={`${match.word}-${i}`}
        title={`Correct spelling: ${match.correction}`}
        className="rounded-sm bg-red-200/90 px-0.5 text-red-900 underline decoration-red-500 decoration-wavy underline-offset-2"
      >
        {part}
      </mark>
    );
  });
}

export function HighlightedWritingAnswer({
  text,
  errors = [],
  className,
}: {
  text: string;
  errors?: WritingError[];
  className?: string;
}) {
  const spelling = errors.filter((e) => e.type === "spelling");
  return (
    <p className={cn("whitespace-pre-wrap text-sm leading-relaxed text-slate-800", className)}>
      {spelling.length > 0 ? highlightSpellingInText(text, spelling) : text}
    </p>
  );
}

export function WritingErrorsPanel({
  responseText,
  errors = [],
  className,
}: {
  responseText?: string;
  errors?: WritingError[];
  className?: string;
}) {
  const spelling = errors.filter((e) => e.type === "spelling");
  const other = errors.filter((e) => e.type !== "spelling");

  if (spelling.length === 0 && other.length === 0) {
    return (
      <div className={cn("rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2.5", className)}>
        <div className="flex items-center gap-2 text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          <p className="text-xs font-semibold">No spelling mistakes detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {responseText ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-slate-700">Your answer — spelling highlighted</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {highlightSpellingInText(responseText, spelling)}
          </p>
        </div>
      ) : null}

      {spelling.length > 0 ? (
        <div className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-2.5">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="size-4 shrink-0" />
            <p className="text-xs font-semibold">
              Spelling mistakes ({spelling.length})
            </p>
          </div>
          <ul className="mt-2 space-y-1.5">
            {spelling.map((err, i) => (
              <li key={`${err.word}-${i}`} className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-red-900">
                <span className="rounded bg-red-200/80 px-1.5 py-0.5 font-semibold line-through decoration-red-600">
                  {err.word}
                </span>
                <span className="text-red-700">→</span>
                <span className="font-semibold text-emerald-800">{err.correction}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {other.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-900">Other language errors</p>
          <ul className="mt-2 space-y-1.5">
            {other.map((err, i) => (
              <li key={`${err.word}-${i}`} className="text-xs text-amber-900">
                <span className="font-medium capitalize">{err.type}:</span>{" "}
                <span className="line-through">{err.word}</span>
                <span className="mx-1 text-amber-700">→</span>
                <span className="font-semibold">{err.correction}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
