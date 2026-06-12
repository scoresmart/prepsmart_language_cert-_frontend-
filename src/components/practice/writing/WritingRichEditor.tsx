import * as React from "react";
import { Bold, Italic, Redo2, Underline, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (text: string) => void;
  minWords: number;
  maxWords: number;
  disabled?: boolean;
  resetKey?: string;
  placeholder?: string;
};

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function WritingRichEditor({
  value,
  onChange,
  minWords,
  maxWords,
  disabled = false,
  resetKey = "",
  placeholder = "Write your response here…",
}: Props) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [history, setHistory] = React.useState<string[]>([""]);
  const [historyIndex, setHistoryIndex] = React.useState(0);

  const wordCount = countWords(value);
  const inRange = wordCount >= minWords && wordCount <= maxWords;

  const syncFromEditor = () => {
    const el = editorRef.current;
    if (!el) return "";
    const text = el.innerText.replace(/\u00a0/g, " ");
    onChange(text);
    return text;
  };

  const pushHistory = (text: string) => {
    setHistory((prev) => {
      const slice = prev.slice(0, historyIndex + 1);
      if (slice[slice.length - 1] === text) return prev;
      const next = [...slice, text];
      setHistoryIndex(next.length - 1);
      return next;
    });
  };

  const applyHistory = (index: number) => {
    const text = history[index] ?? "";
    setHistoryIndex(index);
    if (editorRef.current) editorRef.current.innerText = text;
    onChange(text);
  };

  const exec = (cmd: string) => {
    if (disabled) return;
    document.execCommand(cmd, false);
    editorRef.current?.focus();
    const text = syncFromEditor();
    pushHistory(text);
  };

  const handleInput = () => {
    const text = syncFromEditor();
    pushHistory(text);
  };

  React.useEffect(() => {
    if (editorRef.current) editorRef.current.innerText = value;
    setHistory([value]);
    setHistoryIndex(0);
  }, [resetKey]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-100 px-2 py-1.5">
        <ToolbarBtn label="Undo" disabled={disabled || historyIndex <= 0} onClick={() => applyHistory(historyIndex - 1)}>
          <Undo2 className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Redo"
          disabled={disabled || historyIndex >= history.length - 1}
          onClick={() => applyHistory(historyIndex + 1)}
        >
          <Redo2 className="size-4" />
        </ToolbarBtn>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <ToolbarBtn label="Bold" disabled={disabled} onClick={() => exec("bold")}>
          <Bold className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Italic" disabled={disabled} onClick={() => exec("italic")}>
          <Italic className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn label="Underline" disabled={disabled} onClick={() => exec("underline")}>
          <Underline className="size-4" />
        </ToolbarBtn>
        <span
          className={cn(
            "ml-auto text-xs font-medium tabular-nums",
            wordCount === 0
              ? "text-slate-400"
              : wordCount > maxWords
                ? "text-rose-600"
                : inRange
                  ? "text-emerald-600"
                  : "text-slate-600",
          )}
        >
          Words: {wordCount}
        </span>
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className={cn(
          "min-h-[320px] px-4 py-4 text-sm leading-relaxed text-slate-800 outline-none md:min-h-[400px]",
          "empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]",
          disabled && "cursor-not-allowed bg-slate-50 text-slate-500",
        )}
      />
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
        Write between {minWords} and {maxWords} words.
        {wordCount > 0 && (
          <span className={cn("ml-2 font-medium", inRange ? "text-emerald-600" : "text-slate-600")}>
            ({wordCount} / {minWords}–{maxWords})
          </span>
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
