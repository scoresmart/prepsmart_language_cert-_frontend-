import * as React from "react";
import { CheckCircle2, Circle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { difficultyLabel } from "@/lib/practiceNavigation";
import type { PracticeQuestionItem } from "@/lib/practiceQuestions";

type Props = {
  open: boolean;
  onClose: () => void;
  sectionLabel: string;
  partLabel?: string;
  questions: PracticeQuestionItem[];
  currentIndex: number;
  completedIds: Set<string>;
  onSelect: (index: number) => void;
};

export function QuestionNavigatorPanel({
  open,
  onClose,
  sectionLabel,
  partLabel,
  questions,
  currentIndex,
  completedIds,
  onSelect,
}: Props) {
  const [search, setSearch] = React.useState("");
  const [difficultyFilter, setDifficultyFilter] = React.useState<"all" | "Easy" | "Medium" | "Hard">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "done" | "todo">("all");

  const doneCount = questions.filter((q) => completedIds.has(q.id)).length;

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (term) {
        const hay = `#${q.index} ${q.title}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (difficultyFilter !== "all" && difficultyLabel(q.index) !== difficultyFilter) return false;
      if (statusFilter === "done" && !completedIds.has(q.id)) return false;
      if (statusFilter === "todo" && completedIds.has(q.id)) return false;
      return true;
    });
  }, [questions, search, difficultyFilter, statusFilter, completedIds]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close question navigator"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Question Navigator</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Done {doneCount} | Found {questions.length} Questions
              </p>
              <p className="text-xs font-medium text-cyan-700">
                {sectionLabel}
                {partLabel ? ` — ${partLabel}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or #number…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Practiced
              </span>
              <span className="flex items-center gap-1">
                <Circle className="size-3.5 text-amber-400" /> Pending
              </span>
            </div>
            <FilterPill
              label={statusFilter === "all" ? "All" : statusFilter === "done" ? "Practiced" : "Pending"}
              active={statusFilter !== "all"}
              onClick={() =>
                setStatusFilter((s) => (s === "all" ? "todo" : s === "todo" ? "done" : "all"))
              }
            />
            <FilterPill
              label={difficultyFilter === "all" ? "Difficulty" : difficultyFilter}
              active={difficultyFilter !== "all"}
              onClick={() =>
                setDifficultyFilter((d) =>
                  d === "all" ? "Easy" : d === "Easy" ? "Medium" : d === "Medium" ? "Hard" : "all",
                )
              }
            />
          </div>
        </header>

        <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-slate-400">No questions match your filters.</li>
          ) : (
            filtered.map((q) => {
              const done = completedIds.has(q.id);
              const active = q.index === currentIndex;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(q.index);
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50",
                      active && "bg-cyan-50 hover:bg-cyan-50",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="size-5 shrink-0 text-cyan-600" />
                    ) : (
                      <Circle className="size-5 shrink-0 text-slate-300" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium truncate", active ? "text-cyan-900" : "text-slate-800")}>
                        #{q.index} {q.title}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {done ? "Practiced" : "Pending"}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <footer className="border-t border-slate-200 px-5 py-3 text-center text-xs text-slate-500">
          {questions.length} questions
        </footer>
      </aside>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-cyan-500 bg-cyan-50 text-cyan-800"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
      )}
    >
      {label}
    </button>
  );
}
