import { BarChart3, CheckCircle2, FileText, PenLine, RotateCcw } from "lucide-react";
import * as React from "react";
import { PracticeSubmitButton } from "@/components/practice/PracticeActionButtons";
import { Button } from "@/components/ui/button";
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
              <p className="text-base font-semibold text-slate-900 md:text-[17px]">{lines[0]}</p>
              <ul className="mt-2.5 space-y-2">
                {lines.slice(1).map((line) => (
                  <li key={line} className="flex gap-2.5 text-base leading-relaxed text-slate-800 md:text-[17px]">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-orange-400" />
                    <span>{line.replace(/^[-•*]\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        return (
          <p key={i} className="text-base leading-relaxed text-slate-800 whitespace-pre-wrap md:text-[17px]">
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
          <h3 className="text-sm font-bold text-slate-900 md:text-base">Read the chart and instructions</h3>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {imageUrl && (
            <div className="border-b border-slate-100 bg-slate-50/80 p-3 md:p-4">
              <img
                src={imageUrl}
                alt="Writing task chart or diagram"
                className="mx-auto max-h-[min(48vh,380px)] w-full object-contain"
              />
            </div>
          )}

          <div className="space-y-4 p-4 md:p-5">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText className="size-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wide md:text-sm">Instructions</span>
            </div>
            <TaskInstructions text={questionText} />

            <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/70 px-4 py-3">
              <p className="text-sm leading-relaxed text-orange-950 md:text-base">
                <span className="font-semibold">Word limit:</span> write between{" "}
                <span className="font-bold">{minWords}</span> and{" "}
                <span className="font-bold">{maxWords}</span> words in your answer.
              </p>
            </div>
          </div>
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
  scoreSlot,
}: {
  minWords: number;
  maxWords: number;
  wordCount: number;
  text: string;
  submitted: boolean;
  attemptKey: string;
  onChange: (text: string) => void;
  onRetry: () => void;
  scoreSlot?: React.ReactNode;
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
          scoreSlot ?? (
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
          )
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
  submitting,
  onSubmit,
}: {
  wordCount: number;
  minWords: number;
  maxWords: number;
  canSubmit: boolean;
  submitting?: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <WritingWordCountBar count={wordCount} min={minWords} max={maxWords} />
      <PracticeSubmitButton
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="w-full shrink-0 sm:w-auto sm:min-w-[160px]"
      >
        {submitting ? "Submitting…" : "Submit answer"}
      </PracticeSubmitButton>
    </div>
  );
}
