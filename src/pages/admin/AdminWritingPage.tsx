import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, PenLine, Search, X, ZoomIn } from "lucide-react";
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

// ─── Storage URL helper ───────────────────────────────────────────────────────

const SUPABASE_URL = "https://sepzceaicoldqhyxxzff.supabase.co";

function getImageUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  // If it's already a full URL, return as-is
  if (filename.startsWith("http")) return filename;
  return `${SUPABASE_URL}/storage/v1/object/public/writing-task-images/${filename}`;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TASK_LABELS: Record<string, string> = {
  task1: "Task 1 – Short Report (150–200 words)",
  task2: "Task 2 – Extended Essay (250 words)",
};

type TaskType = "task1" | "task2";

// ─── Form state ─────────────────────────────────────────────────────────────

type FormState = {
  question_text: string;
  image_path: string;
};

const emptyForm: FormState = {
  question_text: "",
  image_path: "",
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function truncate(text: string, len: number): string {
  return text.length > len ? text.slice(0, len) + "…" : text;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>
      <img
        src={src}
        alt="Question image"
        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Question Table ────────────────────────────────────────────────────────────

interface QTableProps {
  rows: WritingQuestion[];
  onEdit: (row: WritingQuestion) => void;
  onDelete: (id: string) => void;
  onPreviewImage: (url: string) => void;
  showImageColumn: boolean;
}

function QuestionTable({ rows, onEdit, onDelete, onPreviewImage, showImageColumn }: QTableProps) {
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
            {showImageColumn && <th className="px-4 py-3 w-28 text-center">Image</th>}
            <th className="px-4 py-3 w-32">Created</th>
            <th className="px-4 py-3 w-24 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => {
            const imgUrl = showImageColumn ? getImageUrl(row.image_path) : null;
            return (
              <tr key={row.id} className="hover:bg-slate-50/60 transition">
                <td className="px-4 py-3 text-slate-700 max-w-xs">
                  <span className="line-clamp-2">{truncate(row.question_text, 80)}</span>
                </td>
                {showImageColumn && (
                  <td className="px-4 py-3 text-center">
                    {imgUrl ? (
                      <button
                        onClick={() => onPreviewImage(imgUrl)}
                        className="group relative inline-block"
                        title="Click to enlarge"
                      >
                        <img
                          src={imgUrl}
                          alt="question"
                          className="h-12 w-20 rounded object-cover border border-slate-200 group-hover:border-purple-400 transition"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                        <span className="hidden">
                          <Badge variant="outline" className="text-slate-400 text-xs">broken</Badge>
                        </span>
                        <span className="absolute inset-0 flex items-center justify-center rounded bg-black/0 group-hover:bg-black/20 transition">
                          <ZoomIn className="size-4 text-white opacity-0 group-hover:opacity-100 transition" />
                        </span>
                      </button>
                    ) : null}
                  </td>
                )}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function AdminWritingPage() {
  const qc = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = React.useState<TaskType>("task1");

  // Search per tab
  const [search, setSearch] = React.useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<WritingQuestion | null>(null);
  const [dialogTab, setDialogTab] = React.useState<TaskType>("task1");
  const [form, setForm] = React.useState<FormState>(emptyForm);

  // Delete confirm dialog
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);

  // ─── Query ─────────────────────────────────────────────────────────────────

  const { data: allQuestions = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin", "writing-questions"],
    queryFn: async () => {
      const res = await api.writing.list(); // GET /questions/writing — no filter = all
      return res.data ?? [];
    },
  });

  const task1Questions = React.useMemo(
    () => allQuestions.filter((q) => q.task_type === "task1"),
    [allQuestions],
  );
  const task2Questions = React.useMemo(
    () => allQuestions.filter((q) => q.task_type === "task2"),
    [allQuestions],
  );

  const activeQuestions = activeTab === "task1" ? task1Questions : task2Questions;

  const filteredQuestions = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return activeQuestions;
    return activeQuestions.filter((q) => q.question_text.toLowerCase().includes(s));
  }, [activeQuestions, search]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (payload: { task_type: string; question_text: string; image_path?: string }) =>
      api.writing.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "writing-questions"] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<WritingQuestion> }) =>
      api.writing.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "writing-questions"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.writing.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "writing-questions"] });
      setDeleteId(null);
    },
  });

  // ─── Dialog helpers ────────────────────────────────────────────────────────

  function openAdd(taskType: TaskType) {
    setEditRow(null);
    setDialogTab(taskType);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(row: WritingQuestion) {
    setEditRow(row);
    setDialogTab(row.task_type as TaskType);
    setForm({
      question_text: row.question_text,
      image_path: row.image_path ?? "",
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
        task_type: dialogTab,
        question_text: form.question_text,
        image_path: imagePathVal,
      });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;
  const deleteError = deleteMutation.error;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500">
            <PenLine className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Writing Questions</h1>
            <p className="text-sm text-slate-500">{allQuestions.length} questions total</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Task 1 Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{task1Questions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Task 2 Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{task2Questions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load questions: {(error as Error)?.message ?? "Unknown error"}
        </div>
      )}

      {/* Tabs */}
      <TabsPrimitive.Root
        value={activeTab}
        onValueChange={(v) => { setActiveTab(v as TaskType); setSearch(""); }}
      >
        <TabsPrimitive.List className="flex border-b mb-0">
          {(["task1", "task2"] as TaskType[]).map((tab) => (
            <TabsPrimitive.Trigger
              key={tab}
              value={tab}
              className="px-5 py-2.5 text-sm font-medium text-slate-500 border-b-2 border-transparent data-[state=active]:text-purple-600 data-[state=active]:border-purple-600 transition hover:text-slate-700"
            >
              {tab === "task1" ? "Task 1" : "Task 2"}
              <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                {tab === "task1" ? task1Questions.length : task2Questions.length}
              </span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        {(["task1", "task2"] as TaskType[]).map((tab) => (
          <TabsPrimitive.Content key={tab} value={tab}>
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              {/* Tab toolbar */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-slate-50">
                <div className="text-xs text-slate-500 font-medium">{TASK_LABELS[tab]}</div>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <Input
                      placeholder="Search questions…"
                      className="pl-8 h-8 text-sm w-56"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button size="sm" className="gap-1.5 h-8" onClick={() => openAdd(tab)}>
                    <Plus className="size-3.5" />
                    Add Question
                  </Button>
                </div>
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
              ) : (
                <QuestionTable
                  rows={filteredQuestions}
                  onEdit={openEdit}
                  onDelete={setDeleteId}
                  onPreviewImage={setLightboxUrl}
                  showImageColumn={tab === "task1"}
                />
              )}
            </div>
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editRow ? "Edit Writing Question" : `Add ${TASK_LABELS[dialogTab]}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Prompt / Instructions <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Enter the writing prompt or instructions for students…"
                rows={6}
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              />
            </div>
            {/* Image field — only for Task 1 (Task 2 never has images) */}
            {dialogTab === "task1" && (
              <div className="space-y-1.5">
                <Label>Image filename <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input
                  placeholder="e.g. chart_traffic_2024.png"
                  value={form.image_path}
                  onChange={(e) => setForm({ ...form, image_path: e.target.value })}
                />
                <p className="text-xs text-slate-400">Storage filename only — no full URL needed.</p>
                {/* Live image preview */}
                {getImageUrl(form.image_path) && (
                  <div className="mt-2 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                    <p className="px-3 py-1.5 text-xs font-medium text-slate-500 border-b border-slate-200">Image Preview</p>
                    <div className="p-3 flex justify-center">
                      <img
                        src={getImageUrl(form.image_path)!}
                        alt="preview"
                        className="max-h-48 max-w-full rounded object-contain cursor-zoom-in"
                        onClick={() => setLightboxUrl(getImageUrl(form.image_path))}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).insertAdjacentHTML("afterend", '<p class="text-xs text-red-500 text-center">Image not found in storage</p>');
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {saveError && (
              <p className="text-xs text-red-600">
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

      {/* Lightbox */}
      {lightboxUrl && <Lightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

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
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleteMutation.isPending}>
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
