import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Headphones, Volume2, VolumeX } from "lucide-react";

const SUPABASE_URL = "https://sepzceaicoldqhyxxzff.supabase.co";

function getAudioUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `${SUPABASE_URL}/storage/v1/object/public/listening-audio/${filename}`;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { api, type ListeningQuestion } from "@/lib/api";

// ─── Part metadata ─────────────────────────────────────────────────────────────

const PARTS = [
  { number: 1, label: "Part 1", description: "Part 1 – Short Exchanges (7 MCQs)", expectedCount: 22 },
  { number: 2, label: "Part 2", description: "Part 2 – Conversations (5 pairs × 2 Qs)", expectedCount: 22 },
  { number: 3, label: "Part 3", description: "Part 3 – Note Completion (fill-in-the-blank)", expectedCount: 23 },
  { number: 4, label: "Part 4", description: "Part 4 – Extended Discussion (6 MCQs)", expectedCount: 21 },
] as const;

type PartNumber = 1 | 2 | 3 | 4;

// ─── Placeholder JSON per part ─────────────────────────────────────────────────

const PLACEHOLDERS: Record<PartNumber, string> = {
  1: `[{"optionA":"...","optionB":"...","optionC":"...","correctAnswer":"B"}]`,
  2: `[{"context":"You hear two students talking...","questions":[{"questionText":"What does the man say?","optionA":"...","optionB":"...","optionC":"...","correctAnswer":"A"}]}]`,
  3: `{"title":"You will hear a student giving a presentation...","questionText":"The villa was first discovered... [___1___]...","answers":["coastal erosion","bathing suites"]}`,
  4: `{"description":"You hear part of a podcast...","questions":[{"questionText":"What does Peter say?","options":["option A","option B","option C"],"correctAnswer":1}]}`,
};

const JSON_LABELS: Record<PartNumber, string> = {
  1: "Questions JSON (array of 7 MCQs)",
  2: "Questions JSON (array of 5 conversations)",
  3: "Questions JSON (note completion)",
  4: "Questions JSON (6 MCQs)",
};

// ─── Form state ────────────────────────────────────────────────────────────────

type FormState = {
  audio_path: string;
  questionsJson: string;
  jsonError: string;
};

const emptyForm: FormState = { audio_path: "", questionsJson: "", jsonError: "" };

// ─── Per-part query component ──────────────────────────────────────────────────

function PartPanel({ partNumber }: { partNumber: PartNumber }) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<ListeningQuestion | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "listening", partNumber],
    queryFn: async () => {
      const res = await api.listening.list({ part_number: partNumber, page: 1, limit: 500 });
      return res.data?.questions ?? [];
    },
  });

  const rows = q.data ?? [];

  // ── Mutations ──

  const createMutation = useMutation({
    mutationFn: async (f: FormState) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(f.questionsJson);
      } catch {
        throw new Error("__json__");
      }
      await api.listening.create({
        part_number: partNumber,
        audio_path: f.audio_path || undefined,
        questions: parsed as ListeningQuestion["questions"],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "listening", partNumber] });
      qc.invalidateQueries({ queryKey: ["practice", "listening", partNumber] });
      qc.invalidateQueries({ queryKey: ["practice-questions", "listening", String(partNumber)] });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (err: Error) => {
      if (err.message === "__json__") {
        setForm((prev) => ({ ...prev, jsonError: "Invalid JSON" }));
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: FormState }) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(f.questionsJson);
      } catch {
        throw new Error("__json__");
      }
      await api.listening.update(id, {
        audio_path: f.audio_path || undefined,
        questions: parsed as ListeningQuestion["questions"],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "listening", partNumber] });
      qc.invalidateQueries({ queryKey: ["practice", "listening", partNumber] });
      qc.invalidateQueries({ queryKey: ["practice-questions", "listening", String(partNumber)] });
      setDialogOpen(false);
      setEditRow(null);
      setForm(emptyForm);
    },
    onError: (err: Error) => {
      if (err.message === "__json__") {
        setForm((prev) => ({ ...prev, jsonError: "Invalid JSON" }));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.listening.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "listening", partNumber] });
      qc.invalidateQueries({ queryKey: ["practice", "listening", partNumber] });
      qc.invalidateQueries({ queryKey: ["practice-questions", "listening", String(partNumber)] });
      setDeleteId(null);
    },
  });

  // ── Handlers ──

  const openAdd = () => {
    setEditRow(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: ListeningQuestion) => {
    setEditRow(row);
    setForm({
      audio_path: row.audio_path ?? "",
      questionsJson: JSON.stringify(row.questions, null, 2),
      jsonError: "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    setForm((prev) => ({ ...prev, jsonError: "" }));
    if (editRow) {
      updateMutation.mutate({ id: editRow.id, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{rows.length} question set{rows.length !== 1 ? "s" : ""} loaded</p>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Add Question Set
        </Button>
      </div>

      {q.isLoading ? (
        <div className="py-10 text-center text-sm text-slate-400">Loading…</div>
      ) : q.isError ? (
        <div className="py-10 text-center text-sm text-red-500">Failed to load questions.</div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No question sets yet. Click "Add Question Set" to create one.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Audio File</th>
                <th className="px-4 py-3 font-medium text-slate-500">Q Count</th>
                <th className="px-4 py-3 font-medium text-slate-500">Created</th>
                <th className="px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const audioUrl = getAudioUrl(row.audio_path);
                return (
                <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    {audioUrl ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Volume2 className="size-3.5 text-orange-500 shrink-0" />
                          <span className="font-mono truncate max-w-[180px]">{row.audio_path}</span>
                        </div>
                        <audio
                          controls
                          src={audioUrl}
                          className="h-8 w-56"
                          preload="none"
                        />
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400 italic">
                        <VolumeX className="size-3.5" />No audio
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {Array.isArray(row.questions) ? row.questions.length : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(row)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(row.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setForm(emptyForm); setEditRow(null); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editRow ? "Edit Question Set" : "Add Question Set"} — {PARTS[partNumber - 1].description}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Audio filename</Label>
              <Input
                placeholder="e.g. part1_1765447891247.mp3"
                value={form.audio_path}
                onChange={(e) => setForm({ ...form, audio_path: e.target.value })}
              />
              <p className="text-xs text-slate-400">Storage filename only — file must be in the <code>listening-audio</code> bucket.</p>
              {/* Live audio player preview */}
              {getAudioUrl(form.audio_path) && (
                <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2.5 flex items-center gap-3">
                  <Volume2 className="size-4 text-orange-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-orange-700 truncate mb-1">{form.audio_path}</p>
                    <audio controls src={getAudioUrl(form.audio_path)!} className="h-8 w-full" preload="metadata" />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{JSON_LABELS[partNumber]}</Label>
              <Textarea
                placeholder={PLACEHOLDERS[partNumber]}
                rows={10}
                className="font-mono text-xs"
                value={form.questionsJson}
                onChange={(e) => setForm({ ...form, questionsJson: e.target.value, jsonError: "" })}
              />
              {form.jsonError && (
                <p className="text-xs font-medium text-red-500">{form.jsonError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(emptyForm); setEditRow(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.questionsJson.trim() || isSaving}>
              {isSaving ? "Saving…" : editRow ? "Save Changes" : "Add Question Set"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Question Set?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
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
    </>
  );
}

// ─── Stat card for a single part ──────────────────────────────────────────────

function PartStatCard({
  partNumber,
  description,
  expectedCount,
}: {
  partNumber: PartNumber;
  description: string;
  expectedCount: number;
}) {
  const q = useQuery({
    queryKey: ["admin", "listening", partNumber],
    queryFn: async () => {
      const res = await api.listening.list({ part_number: partNumber, page: 1, limit: 500 });
      return res.data?.questions ?? [];
    },
  });

  const count = q.data?.length ?? 0;

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {description}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-bold text-slate-800">{count}</span>
          <span className="mb-0.5 text-xs text-slate-400">/ {expectedCount} sets</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminListeningPage() {
  const [activeTab, setActiveTab] = React.useState<PartNumber>(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
          <Headphones className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Listening Questions</h1>
          <p className="text-sm text-slate-500">Manage listening_part_questions — 4 parts, 88 questions total</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {PARTS.map((p) => (
          <PartStatCard
            key={p.number}
            partNumber={p.number as PartNumber}
            description={p.description}
            expectedCount={p.expectedCount}
          />
        ))}
      </div>

      {/* Tab bar */}
      <div className="border-b">
        <nav className="-mb-px flex gap-1">
          {PARTS.map((p) => (
            <button
              key={p.number}
              onClick={() => setActiveTab(p.number as PartNumber)}
              className={[
                "px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap",
                activeTab === p.number
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
              ].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active tab panel */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-700">
            {PARTS[activeTab - 1].description}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <PartPanel partNumber={activeTab} />
        </CardContent>
      </Card>
    </div>
  );
}
