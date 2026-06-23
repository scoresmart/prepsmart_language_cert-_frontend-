import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type ReadingQuestion } from "@/lib/api";

// ─── Constants ───────────────────────────────────────────────────────────────

type PartType = "part1a" | "part1b" | "part2" | "part3" | "part4";

const READING_PARTS: { key: PartType; label: string; shortLabel: string }[] = [
  { key: "part1a", label: "Part 1A – Synonym Selection",        shortLabel: "Part 1A" },
  { key: "part1b", label: "Part 1B – Gap Fill",                 shortLabel: "Part 1B" },
  { key: "part2",  label: "Part 2 – Sentence Insertion",        shortLabel: "Part 2"  },
  { key: "part3",  label: "Part 3 – Multiple Passage Matching", shortLabel: "Part 3"  },
  { key: "part4",  label: "Part 4 – Reading Comprehension",     shortLabel: "Part 4"  },
];

const JSON_PLACEHOLDERS: Record<PartType, string> = {
  part1a: JSON.stringify(
    [{ questionText: "We expected to **land** at the airport", options: ["get", "arrive", "reach", "come"], correctAnswer: 1 }],
    null, 2,
  ),
  part1b: JSON.stringify(
    [{ options: ["documented", "recognised", "celebrated"], correctAnswer: 1 }],
    null, 2,
  ),
  part2: JSON.stringify(
    { passage: "Full passage text with [1] [2] markers...", answers: ["Sentence A", "Sentence B"], correctMapping: { "1": "D", "2": "H" } },
    null, 2,
  ),
  part3: JSON.stringify(
    { passages: [{ label: "A", text: "..." }, { label: "B", text: "..." }], statements: [{ text: "Some people believe...", correctAnswer: "B" }] },
    null, 2,
  ),
  part4: JSON.stringify(
    { passageTitle: "Title", passage: "Full article...", questions: [{ text: "What does...", options: { A: "...", B: "...", C: "...", D: "..." }, correctAnswer: "C" }] },
    null, 2,
  ),
};

const TITLE_LABELS: Record<PartType, string> = {
  part1a: "Instructions text (e.g. 'Read and choose the best synonym')",
  part1b: "Passage text with (1)……, (2)…… gaps",
  part2:  "Short title or intro line",
  part3:  "Brief description (e.g. 'Great artists steal – 4 passages')",
  part4:  "Passage title",
};

const JSON_FIELD_LABELS: Record<PartType, string> = {
  part1a: "Questions JSON",
  part1b: "Gap Options JSON",
  part2:  "Content JSON",
  part3:  "Content JSON",
  part4:  "Content JSON",
};

const TITLE_MULTILINE: Record<PartType, boolean> = {
  part1a: true,
  part1b: true,
  part2:  true,
  part3:  false,
  part4:  false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(text: string, len: number): string {
  return text.length > len ? text.slice(0, len) + "…" : text;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function structureSummary(questions: object[] | object | null | undefined): string {
  if (!questions) return "—";
  if (Array.isArray(questions)) return `${questions.length} item${questions.length !== 1 ? "s" : ""}`;
  const q = questions as Record<string, unknown>;
  if (Array.isArray(q.questions)) return `${(q.questions as unknown[]).length} question${(q.questions as unknown[]).length !== 1 ? "s" : ""}`;
  if (Array.isArray(q.passages) && Array.isArray(q.statements)) {
    return `${(q.passages as unknown[]).length} passages, ${(q.statements as unknown[]).length} stmt`;
  }
  if (Array.isArray(q.answers)) return `${(q.answers as unknown[]).length} sentence${(q.answers as unknown[]).length !== 1 ? "s" : ""}`;
  return `${Object.keys(q).length} key(s)`;
}

function prettyJson(value: object | object[] | null | undefined): string {
  if (!value) return "";
  try { return JSON.stringify(value, null, 2); } catch { return ""; }
}

function parseJson(value: string): object | object[] | null {
  if (!value.trim()) return null;
  try { return JSON.parse(value); } catch { return null; }
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = { title: string; questions_json: string };
const emptyForm: FormState = { title: "", questions_json: "" };

// ─── Sub-components ───────────────────────────────────────────────────────────

interface QTableProps {
  rows: ReadingQuestion[];
  onEdit: (row: ReadingQuestion) => void;
  onDelete: (id: string) => void;
}

function QuestionTable({ rows, onEdit, onDelete }: QTableProps) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 italic">
        No questions yet — click "Add Question" to create one.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
            <th className="px-4 py-3">Title / Preview</th>
            <th className="px-4 py-3 w-36">Structure</th>
            <th className="px-4 py-3 w-32">Created</th>
            <th className="px-4 py-3 w-24 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60 transition">
              <td className="px-4 py-3 text-slate-700 max-w-xs">
                <span className="line-clamp-2">{truncate(row.title || row.passage || "—", 60)}</span>
              </td>
              <td className="px-4 py-3">
                <Badge variant="secondary" className="text-xs font-normal">
                  {structureSummary(row.questions as object[] | null)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(row.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(row)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    title="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(row.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PartFormFieldsProps {
  partKey: PartType;
  form: FormState;
  onChange: (next: FormState) => void;
}

function PartFormFields({ partKey, form, onChange }: PartFormFieldsProps) {
  const jsonLabel = JSON_FIELD_LABELS[partKey];
  const titleLabel = TITLE_LABELS[partKey];
  const multiline = TITLE_MULTILINE[partKey];
  const placeholder = JSON_PLACEHOLDERS[partKey];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>
          {titleLabel} <span className="text-red-500">*</span>
        </Label>
        {multiline ? (
          <Textarea
            placeholder={titleLabel}
            rows={4}
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
          />
        ) : (
          <Input
            placeholder={titleLabel}
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
          />
        )}
      </div>
      <div className="space-y-1.5">
        <Label>{jsonLabel}</Label>
        <Textarea
          placeholder={placeholder}
          rows={10}
          className="font-mono text-xs"
          value={form.questions_json}
          onChange={(e) => onChange({ ...form, questions_json: e.target.value })}
        />
        <p className="text-xs text-slate-400">
          Enter valid JSON matching the structure for this part type.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminReadingPage() {
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<PartType>("part1a");
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<ReadingQuestion | null>(null);
  const [dialogPartKey, setDialogPartKey] = React.useState<PartType>("part1a");
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [jsonError, setJsonError] = React.useState<string | null>(null);

  // ─── Queries — one per tab ─────────────────────────────────────────────────
  const makeQuery = (partType: PartType) => ({
    queryKey: ["admin", "reading-questions", partType],
    queryFn: async () => {
      const res = await api.reading.list({ part_type: partType, page: 1, limit: 500 });
      return res.data?.questions ?? [];
    },
    staleTime: 30_000,
  });

  const queryPart1a = useQuery({ ...makeQuery("part1a"), enabled: activeTab === "part1a" });
  const queryPart1b = useQuery({ ...makeQuery("part1b"), enabled: activeTab === "part1b" });
  const queryPart2  = useQuery({ ...makeQuery("part2"),  enabled: activeTab === "part2"  });
  const queryPart3  = useQuery({ ...makeQuery("part3"),  enabled: activeTab === "part3"  });
  const queryPart4  = useQuery({ ...makeQuery("part4"),  enabled: activeTab === "part4"  });

  const queryByKey: Record<PartType, typeof queryPart1a> = {
    part1a: queryPart1a,
    part1b: queryPart1b,
    part2:  queryPart2,
    part3:  queryPart3,
    part4:  queryPart4,
  };

  const activeResult = queryByKey[activeTab];
  const activeQuestions: ReadingQuestion[] = activeResult.data ?? [];

  const filteredQuestions = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return activeQuestions;
    return activeQuestions.filter((q) =>
      (q.title || "").toLowerCase().includes(s) ||
      (q.passage || "").toLowerCase().includes(s)
    );
  }, [activeQuestions, search]);

  const counts: Record<PartType, number> = {
    part1a: queryPart1a.data?.length ?? 0,
    part1b: queryPart1b.data?.length ?? 0,
    part2:  queryPart2.data?.length  ?? 0,
    part3:  queryPart3.data?.length  ?? 0,
    part4:  queryPart4.data?.length  ?? 0,
  };

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (body: Partial<ReadingQuestion>) => api.reading.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reading-questions", dialogPartKey] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ReadingQuestion> }) =>
      api.reading.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reading-questions", dialogPartKey] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.reading.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reading-questions", activeTab] });
      setDeleteId(null);
    },
  });

  // ─── Dialog helpers ────────────────────────────────────────────────────────

  function openAdd(partKey: PartType) {
    setEditRow(null);
    setDialogPartKey(partKey);
    setForm(emptyForm);
    setJsonError(null);
    setDialogOpen(true);
  }

  function openEdit(row: ReadingQuestion) {
    setEditRow(row);
    setDialogPartKey(row.part_type as PartType);
    setForm({
      title: row.title || row.passage || "",
      questions_json: prettyJson(row.questions as object[] | null),
    });
    setJsonError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditRow(null);
    setForm(emptyForm);
    setJsonError(null);
  }

  function handleSave() {
    const questionsData = form.questions_json.trim()
      ? parseJson(form.questions_json)
      : null;

    if (form.questions_json.trim() && questionsData === null) {
      setJsonError("Invalid JSON — please check the questions field.");
      return;
    }
    setJsonError(null);

    const body: Partial<ReadingQuestion> = {
      part_type: dialogPartKey as ReadingQuestion["part_type"],
      title: form.title,
      passage: form.title,
      questions: (questionsData as object[]) ?? [],
    };

    if (editRow) {
      updateMutation.mutate({ id: editRow.id, body });
    } else {
      createMutation.mutate(body);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;
  const deleteError = deleteMutation.error;
  const dialogPartLabel =
    READING_PARTS.find((p) => p.key === dialogPartKey)?.label ?? dialogPartKey;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500">
          <BookOpen className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reading Questions</h1>
          <p className="text-sm text-slate-500">{totalCount} questions total</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {READING_PARTS.map(({ key, shortLabel }) => (
          <Card
            key={key}
            className="cursor-pointer hover:shadow-md transition"
            onClick={() => { setActiveTab(key); setSearch(""); }}
          >
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-slate-500">{shortLabel}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-green-600">{counts[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <TabsPrimitive.Root
        value={activeTab}
        onValueChange={(v) => { setActiveTab(v as PartType); setSearch(""); }}
      >
        <TabsPrimitive.List className="flex border-b flex-wrap">
          {READING_PARTS.map(({ key, shortLabel }) => (
            <TabsPrimitive.Trigger
              key={key}
              value={key}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-green-600 data-[state=active]:border-green-600 transition hover:text-slate-700 whitespace-nowrap"
            >
              {shortLabel}
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                {counts[key]}
              </span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        {READING_PARTS.map(({ key, label }) => (
          <TabsPrimitive.Content key={key} value={key}>
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-slate-50">
                <span className="text-xs text-slate-500 font-medium flex-1 min-w-0 truncate">
                  {label}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <Input
                      placeholder="Search questions…"
                      className="pl-8 h-8 text-sm w-52"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 h-8 bg-green-600 hover:bg-green-700"
                    onClick={() => openAdd(key)}
                  >
                    <Plus className="size-3.5" />
                    Add Question
                  </Button>
                </div>
              </div>

              {/* Error state */}
              {activeResult.isError && key === activeTab && (
                <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Failed to load: {(activeResult.error as Error)?.message ?? "Unknown error"}
                </div>
              )}

              {/* Table */}
              {activeResult.isLoading && key === activeTab ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
              ) : (
                <QuestionTable
                  rows={key === activeTab ? filteredQuestions : []}
                  onEdit={openEdit}
                  onDelete={setDeleteId}
                />
              )}
            </div>
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editRow
                ? `Edit Question – ${dialogPartLabel}`
                : `Add Question – ${dialogPartLabel}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <PartFormFields partKey={dialogPartKey} form={form} onChange={setForm} />
            {jsonError && (
              <p className="mt-3 text-xs text-red-600">{jsonError}</p>
            )}
            {saveError && (
              <p className="mt-3 text-xs text-red-600">
                Error: {(saveError as Error)?.message ?? "Save failed"}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.title.trim() || isSaving}
            >
              {isSaving ? "Saving…" : editRow ? "Save Changes" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Question?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This will permanently remove the question. This action cannot be undone.
          </p>
          {deleteError && (
            <p className="text-xs text-red-600">
              Error: {(deleteError as Error)?.message ?? "Delete failed"}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
