import { BarChart3, CheckCircle2, FileText, PenLine, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WritingRichEditor } from "@/components/practice/writing/WritingRichEditor";
import { WritingWordCountBar } from "@/components/practice/writing/WritingWordCountBar";

function TaskInstructions({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isBulletBlock =
          lines.length > 1 &&
          lines.slice(1).every((line) => /^[-•*]/.test(line) || /^[A-Z][a-z]/.test(line));

        if (isBulletBlock && /^you should/i.test(lines[0])) {
          return (
            <div key={i}>
              <p className="text-sm font-semibold text-slate-800">{lines[0]}</p>
              <ul className="mt-2 space-y-1.5">
                {lines.slice(1).map((line) => (
                  <li key={line} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400" />
                    <span>{line.replace(/^[-•*]\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <p key={i} className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export function WritingPart1TaskPanel({
  imageUrl,
  questionText,
  minWords,
  maxWords,
}: {
  imageUrl: string | null;
  questionText: string;
  minWords: number;
  maxWords: number;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
          <BarChart3 className="size-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Task</p>
          <h3 className="text-sm font-bold text-slate-900">Read the chart and instructions</h3>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {imageUrl && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Visual stimulus
              </p>
            </div>
            <div className="p-3">
              <img
                src={imageUrl}
                alt="Writing task chart or diagram"
                className="mx-auto max-h-[min(42vh,320px)] w-full object-contain"
              />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-600">
            <FileText className="size-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide">Instructions</span>
          </div>
          <TaskInstructions text={questionText} />
        </div>

        <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/60 px-4 py-3">
          <p className="text-xs leading-relaxed text-orange-900">
            <span className="font-semibold">Word limit:</span> write between{" "}
            <span className="font-bold">{minWords}</span> and{" "}
            <span className="font-bold">{maxWords}</span> words in your answer.
          </p>
        </div>
      </div>
    </div>
  );
}

export function WritingPart1AnswerPanel({
  minWords,
  maxWords,
  wordCount,
  text,
  submitted,
  attemptKey,
  onChange,
  onRetry,
}: {
  minWords: number;
  maxWords: number;
  wordCount: number;
  text: string;
  submitted: boolean;
  attemptKey: string;
  onChange: (text: string) => void;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800">
            <PenLine className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-700">Your answer</p>
            <h3 className="text-sm font-bold text-slate-900">Write your response</h3>
          </div>
        </div>
        {!submitted && (
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:inline">
            Part 1
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1">
        {submitted ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white px-6 py-10 text-center shadow-sm">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-7 text-emerald-600" />
            </div>
            <p className="mt-4 text-lg font-bold text-emerald-800">Answer submitted</p>
            <p className="mt-1 text-sm text-slate-600">
              Your response has been saved ({wordCount} words).
            </p>
            <Button onClick={onRetry} variant="outline" size="sm" className="mt-5 gap-2">
              <RotateCcw className="size-3.5" />
              Re-do this task
            </Button>
          </div>
        ) : (
          <WritingRichEditor
            value={text}
            onChange={onChange}
            minWords={minWords}
            maxWords={maxWords}
            resetKey={attemptKey}
            fillHeight
            variant="workspace"
            className="h-full shadow-sm"
          />
        )}
      </div>
    </div>
  );
}

export function WritingPart1Footer({
  wordCount,
  minWords,
  maxWords,
  canSubmit,
  onSubmit,
}: {
  wordCount: number;
  minWords: number;
  maxWords: number;
  canSubmit: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <WritingWordCountBar count={wordCount} min={minWords} max={maxWords} />
      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={cn(
          "shrink-0 gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600",
          "w-full sm:w-auto sm:min-w-[160px]",
        )}
      >
        Submit answer
      </Button>
    </div>
  );
}
