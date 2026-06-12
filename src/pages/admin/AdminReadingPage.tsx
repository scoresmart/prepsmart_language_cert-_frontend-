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
import { api, type WritingQuestion } from "@/lib/api";

// ─── Constants ───────────────────────────────────────────────────────────────

type ReadingPartKey =
  | "reading_part_1a"
  | "reading_part_1b"
  | "reading_part_2"
  | "reading_part_3"
  | "reading_part_4";

const READING_PARTS: { key: ReadingPartKey; label: string; shortLabel: string }[] = [
  { key: "reading_part_1a", label: "Part 1A – Synonym Selection",        shortLabel: "Part 1A" },
  { key: "reading_part_1b", label: "Part 1B – Gap Fill",                 shortLabel: "Part 1B" },
  { key: "reading_part_2",  label: "Part 2 – Sentence Insertion",        shortLabel: "Part 2"  },
  { key: "reading_part_3",  label: "Part 3 – Multiple Passage Matching", shortLabel: "Part 3"  },
  { key: "reading_part_4",  label: "Part 4 – Reading Comprehension",     shortLabel: "Part 4"  },
];

const JSON_PLACEHOLDERS: Record<ReadingPartKey, string> = {
  reading_part_1a: JSON.stringify(
    [{ questionText: "We expected to **land** at the airport", options: ["get", "arrive", "reach", "come"], correctAnswer: 1 }],
    null, 2,
  ),
  reading_part_1b: JSON.stringify(
    [{ options: ["documented", "recognised", "celebrated"], correctAnswer: 1 }],
    null, 2,
  ),
  reading_part_2: JSON.stringify(
    { passage: "Full passage text with [1] [2] markers...", answers: ["Sentence A", "Sentence B"], correctMapping: { "1": "D", "2": "H" } },
    null, 2,
  ),
  reading_part_3: JSON.stringify(
    { passages: [{ label: "A", text: "..." }, { label: "B", text: "..." }], statements: [{ text: "Some people believe...", correctAnswer: "B" }] },
    null, 2,
  ),
  reading_part_4: JSON.stringify(
    { passageTitle: "Title", passage: "Full article...", questions: [{ text: "What does...", options: { A: "...", B: "...", C: "...", D: "..." }, correctAnswer: "C" }] },
    null, 2,
  ),
};

const QUESTION_TEXT_LABELS: Record<ReadingPartKey, string> = {
  reading_part_1a: "Instructions text (e.g. 'Read and choose the best synonym')",
  reading_part_1b: "Passage text with (1)……, (2)…… gaps",
  reading_part_2:  "Short title or intro line",
  reading_part_3:  "Brief description (e.g. 'Great artists steal – 4 passages')",
  reading_part_4:  "Passage title",
};

const JSON_FIELD_LABELS: Record<ReadingPartKey, string> = {
  reading_part_1a: "Questions JSON",
  reading_part_1b: "Gap Options JSON",
  reading_part_2:  "Content JSON",
  reading_part_3:  "Content JSON",
  reading_part_4:  "Content JSON",
};

/** Parts that use a Textarea for question_text (vs. a single-line Input) */
const QUESTION_TEXT_MULTILINE: Record<ReadingPartKey, boolean> = {
  reading_part_1a: true,
  reading_part_1b: true,
  reading_part_2:  true,
  reading_part_3:  false,
  reading_part_4:  false,
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

function structureSummary(imagePath: string | null): string {
  if (!imagePath) return "—";
  try {
    const parsed = JSON.parse(imagePath);
    if (Array.isArray(parsed)) return `${parsed.length} item${parsed.length !== 1 ? "s" : ""}`;
    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.questions)) return `${parsed.questions.length} question${parsed.questions.length !== 1 ? "s" : ""}`;
      if (Array.isArray(parsed.passages) && Array.isArray(parsed.statements)) {
        return `${parsed.passages.length} passages, ${parsed.statements.length} stmt`;
      }
      if (Array.isArray(parsed.answers)) return `${parsed.answers.length} sentence${parsed.answers.length !== 1 ? "s" : ""}`;
      return `${Object.keys(parsed).length} key(s)`;
    }
  } catch {
    return truncate(imagePath, 30);
  }
  return "—";
}

function prettyJson(value: string): string {
  if (!value) return "";
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = { question_text: string; image_path: string };
const emptyForm: FormState = { question_text: "", image_path: "" };

// ─── Sub-components ───────────────────────────────────────────────────────────

interface QTableProps {
  rows: WritingQuestion[];
  onEdit: (row: WritingQuestion) => void;
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
            <th className="px-4 py-3">Preview</th>
            <th className="px-4 py-3 w-36">Structure</th>
            <th className="px-4 py-3 w-32">Created</th>
            <th className="px-4 py-3 w-24 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60 transition">
              <td className="px-4 py-3 text-slate-700 max-w-xs">
                <span className="line-clamp-2">{truncate(row.question_text, 60)}</span>
              </td>
              <td className="px-4 py-3">
                <Badge variant="secondary" className="text-xs font-normal">
                  {structureSummary(row.image_path)}
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
  partKey: ReadingPartKey;
  form: FormState;
  onChange: (next: FormState) => void;
}

function PartFormFields({ partKey, form, onChange }: PartFormFieldsProps) {
  const jsonLabel = JSON_FIELD_LABELS[partKey];
  const qtLabel = QUESTION_TEXT_LABELS[partKey];
  const multiline = QUESTION_TEXT_MULTILINE[partKey];
  const placeholder = JSON_PLACEHOLDERS[partKey];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>
          {qtLabel} <span className="text-red-500">*</span>
        </Label>
        {multiline ? (
          <Textarea
            placeholder={qtLabel}
            rows={4}
            value={form.question_text}
            onChange={(e) => onChange({ ...form, question_text: e.target.value })}
          />
        ) : (
          <Input
            placeholder={qtLabel}
            value={form.question_text}
            onChange={(e) => onChange({ ...form, question_text: e.target.value })}
          />
        )}
      </div>
      <div className="space-y-1.5">
        <Label>{jsonLabel}</Label>
        <Textarea
          placeholder={placeholder}
          rows={10}
          className="font-mono text-xs"
          value={form.image_path}
          onChange={(e) => onChange({ ...form, image_path: e.target.value })}
        />
        <p className="text-xs text-slate-400">
          Enter valid JSON. Stored in the{" "}
          <code className="bg-slate-100 px-1 rounded">image_path</code> field.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminReadingPage() {
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<ReadingPartKey>("reading_part_1a");
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<WritingQuestion | null>(null);
  const [dialogPartKey, setDialogPartKey] = React.useState<ReadingPartKey>("reading_part_1a");
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // ─── Queries — one per tab ─────────────────────────────────────────────────
  // Each query is only enabled when its tab is active.
  const queryPart1a = useQuery({
    queryKey: ["admin", "reading-questions", "reading_part_1a"],
    queryFn: async () => { const res = await api.writing.list("reading_part_1a" as any); return res.data ?? []; },
    enabled: activeTab === "reading_part_1a",
    staleTime: 30_000,
  });
  const queryPart1b = useQuery({
    queryKey: ["admin", "reading-questions", "reading_part_1b"],
    queryFn: async () => { const res = await api.writing.list("reading_part_1b" as any); return res.data ?? []; },
    enabled: activeTab === "reading_part_1b",
    staleTime: 30_000,
  });
  const queryPart2 = useQuery({
    queryKey: ["admin", "reading-questions", "reading_part_2"],
    queryFn: async () => { const res = await api.writing.list("reading_part_2" as any); return res.data ?? []; },
    enabled: activeTab === "reading_part_2",
    staleTime: 30_000,
  });
  const queryPart3 = useQuery({
    queryKey: ["admin", "reading-questions", "reading_part_3"],
    queryFn: async () => { const res = await api.writing.list("reading_part_3" as any); return res.data ?? []; },
    enabled: activeTab === "reading_part_3",
    staleTime: 30_000,
  });
  const queryPart4 = useQuery({
    queryKey: ["admin", "reading-questions", "reading_part_4"],
    queryFn: async () => { const res = await api.writing.list("reading_part_4" as any); return res.data ?? []; },
    enabled: activeTab === "reading_part_4",
    staleTime: 30_000,
  });

  const queryByKey: Record<ReadingPartKey, typeof queryPart1a> = {
    reading_part_1a: queryPart1a,
    reading_part_1b: queryPart1b,
    reading_part_2:  queryPart2,
    reading_part_3:  queryPart3,
    reading_part_4:  queryPart4,
  };

  const activeResult = queryByKey[activeTab];
  const activeQuestions: WritingQuestion[] = (activeResult.data as WritingQuestion[] | undefined) ?? [];

  const filteredQuestions = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return activeQuestions;
    return activeQuestions.filter((q) => q.question_text.toLowerCase().includes(s));
  }, [activeQuestions, search]);

  const counts: Record<ReadingPartKey, number> = {
    reading_part_1a: (queryPart1a.data as WritingQuestion[] | undefined)?.length ?? 0,
    reading_part_1b: (queryPart1b.data as WritingQuestion[] | undefined)?.length ?? 0,
    reading_part_2:  (queryPart2.data as WritingQuestion[] | undefined)?.length ?? 0,
    reading_part_3:  (queryPart3.data as WritingQuestion[] | undefined)?.length ?? 0,
    reading_part_4:  (queryPart4.data as WritingQuestion[] | undefined)?.length ?? 0,
  };

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload: { task_type: string; question_text: string; image_path?: string }) =>
      api.writing.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reading-questions", dialogPartKey] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<WritingQuestion> }) =>
      api.writing.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reading-questions", dialogPartKey] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.writing.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reading-questions", activeTab] });
      setDeleteId(null);
    },
  });

  // ─── Dialog helpers ────────────────────────────────────────────────────────

  function openAdd(partKey: ReadingPartKey) {
    setEditRow(null);
    setDialogPartKey(partKey);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(row: WritingQuestion) {
    setEditRow(row);
    setDialogPartKey(row.task_type as ReadingPartKey);
    setForm({
      question_text: row.question_text,
      image_path: prettyJson(row.image_path ?? ""),
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditRow(null);
    setForm(emptyForm);
  }

  function handleSave() {
    const imagePathVal = form.image_path.trim() || undefined;
    if (editRow) {
      updateMutation.mutate({
        id: editRow.id,
        body: { question_text: form.question_text, image_path: imagePathVal ?? null },
      });
    } else {
      createMutation.mutate({
        task_type: dialogPartKey,
        question_text: form.question_text,
        image_path: imagePathVal,
      });
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
        onValueChange={(v) => { setActiveTab(v as ReadingPartKey); setSearch(""); }}
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
              disabled={!form.question_text.trim() || isSaving}
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
