import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FileText, Sparkles, ExternalLink, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { api, type MockTest, type ListeningQuestion, type WritingQuestion } from "@/lib/api";
import {
  MOCK_LISTENING_PARTS,
  MOCK_READING_PARTS,
  MOCK_WRITING_TASKS,
  MOCK_TOTALS,
} from "@/lib/mockTestFormat";
import { mockTestIntroUrl } from "@/lib/mockTestRoutes";

// ─── Types ────────────────────────────────────────────────────────────────────

// The API's MockTest type doesn't include the question-ID columns, so we extend
// it locally to represent the full row returned from the backend.
type FullMockTest = MockTest & {
  listening_part1_id: string | null;
  listening_part2_id: string | null;
  listening_part3_id: string | null;
  listening_part4_id: string | null;
  reading_part1a_id: string | null;
  reading_part1b_id: string | null;
  reading_part2_id: string | null;
  reading_part3_id: string | null;
  reading_part4_id: string | null;
  writing_task1_id: string | null;
  writing_task2_id: string | null;
};

type AssemblyForm = {
  title: string;
  description: string;
  is_active: boolean;
  listening_part1_id: string;
  listening_part2_id: string;
  listening_part3_id: string;
  listening_part4_id: string;
  reading_part1a_id: string;
  reading_part1b_id: string;
  reading_part2_id: string;
  reading_part3_id: string;
  reading_part4_id: string;
  writing_task1_id: string;
  writing_task2_id: string;
};

const emptyForm: AssemblyForm = {
  title: "",
  description: "",
  is_active: true,
  listening_part1_id: "",
  listening_part2_id: "",
  listening_part3_id: "",
  listening_part4_id: "",
  reading_part1a_id: "",
  reading_part1b_id: "",
  reading_part2_id: "",
  reading_part3_id: "",
  reading_part4_id: "",
  writing_task1_id: "",
  writing_task2_id: "",
};

// Count of non-null IDs in a full test row
function filledCount(row: FullMockTest): number {
  const keys: (keyof FullMockTest)[] = [
    "listening_part1_id",
    "listening_part2_id",
    "listening_part3_id",
    "listening_part4_id",
    "reading_part1a_id",
    "reading_part1b_id",
    "reading_part2_id",
    "reading_part3_id",
    "reading_part4_id",
    "writing_task1_id",
    "writing_task2_id",
  ];
  return keys.filter((k) => row[k] != null && row[k] !== "").length;
}

function pickRandom<T extends { id: string }>(items: T[]): string {
  if (items.length === 0) return "";
  return items[Math.floor(Math.random() * items.length)].id;
}

function autoFillRandomForm(
  form: AssemblyForm,
  allListening: ListeningQuestion[],
  allWriting: WritingQuestion[],
): AssemblyForm {
  const lPart = (n: number) => allListening.filter((q) => q.part_number === n);
  const wByType = (type: string) => allWriting.filter((q) => (q.task_type as string) === type);

  return {
    ...form,
    listening_part1_id: pickRandom(lPart(1)),
    listening_part2_id: pickRandom(lPart(2)),
    listening_part3_id: pickRandom(lPart(3)),
    listening_part4_id: pickRandom(lPart(4)),
    reading_part1a_id: pickRandom(wByType("reading_part_1a")),
    reading_part1b_id: pickRandom(wByType("reading_part_1b")),
    reading_part2_id: pickRandom(wByType("reading_part_2")),
    reading_part3_id: pickRandom(wByType("reading_part_3")),
    reading_part4_id: pickRandom(wByType("reading_part_4")),
    writing_task1_id: pickRandom(wByType("task1")),
    writing_task2_id: pickRandom(wByType("task2")),
  };
}

// ─── Select helper ────────────────────────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  options,
  loading,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; display: string }[];
  loading?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="text-sm"
      >
        <option value="">— None —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.display}
          </option>
        ))}
      </Select>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminMockTestsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<FullMockTest | null>(null);
  const [form, setForm] = React.useState<AssemblyForm>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // ── Data fetching ──

  const testsQuery = useQuery({
    queryKey: ["admin", "mock-tests"],
    queryFn: async () => {
      const res = await api.tests.listAll();
      return (res.data?.tests ?? []) as FullMockTest[];
    },
  });

  const listeningQuery = useQuery({
    queryKey: ["admin", "lq-all"],
    queryFn: () => api.listening.list(),
  });

  const writingQuery = useQuery({
    queryKey: ["admin", "wq-all"],
    queryFn: () => api.writing.list(),
  });

  const tests = testsQuery.data ?? [];

  // All listening questions from the paginated response
  const allListening: ListeningQuestion[] =
    (listeningQuery.data?.data?.questions as ListeningQuestion[] | undefined) ?? [];

  // All writing/reading questions
  const allWriting: WritingQuestion[] =
    (writingQuery.data?.data as WritingQuestion[] | undefined) ?? [];

  // Listening filtered by part_number
  const lPart = (n: number) =>
    allListening
      .filter((q) => q.part_number === n)
      .map((q) => ({
        id: q.id,
        display: q.audio_path ? q.audio_path : `[${q.id.slice(0, 8)}]`,
      }));

  // Writing filtered by task_type (cast needed because API types it narrowly)
  const wByType = (type: string) =>
    allWriting
      .filter((q) => (q.task_type as string) === type)
      .map((q) => ({
        id: q.id,
        display: q.question_text ? q.question_text.slice(0, 50) : `[${q.id.slice(0, 8)}]`,
      }));

  // ── Mutations ──

  const createMutation = useMutation({
    mutationFn: (f: AssemblyForm) =>
      api.tests.create(buildUpdatePayload(f) as Partial<MockTest> & { title: string }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "mock-tests"] });
      qc.invalidateQueries({ queryKey: ["mock-tests"] });
      closeDialog();
    },
  });

  const randomMutation = useMutation({
    mutationFn: (body?: { title?: string; description?: string }) => api.tests.assembleRandom(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "mock-tests"] });
      qc.invalidateQueries({ queryKey: ["mock-tests"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: string; f: AssemblyForm }) =>
      api.tests.update(id, buildUpdatePayload(f) as Parameters<typeof api.tests.update>[1]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "mock-tests"] });
      qc.invalidateQueries({ queryKey: ["mock-tests"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.tests.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "mock-tests"] });
      qc.invalidateQueries({ queryKey: ["mock-tests"] });
      setDeleteId(null);
    },
  });

  // Build the full payload, converting empty strings to null for optional IDs
  function buildUpdatePayload(f: AssemblyForm) {
    const nullify = (v: string) => v || null;
    return {
      title: f.title,
      description: f.description.trim() || null,
      is_active: f.is_active,
      listening_part1_id: nullify(f.listening_part1_id),
      listening_part2_id: nullify(f.listening_part2_id),
      listening_part3_id: nullify(f.listening_part3_id),
      listening_part4_id: nullify(f.listening_part4_id),
      reading_part1a_id: nullify(f.reading_part1a_id),
      reading_part1b_id: nullify(f.reading_part1b_id),
      reading_part2_id: nullify(f.reading_part2_id),
      reading_part3_id: nullify(f.reading_part3_id),
      reading_part4_id: nullify(f.reading_part4_id),
      writing_task1_id: nullify(f.writing_task1_id),
      writing_task2_id: nullify(f.writing_task2_id),
    };
  }

  // ── Dialog helpers ──

  const closeDialog = () => {
    setDialogOpen(false);
    setEditRow(null);
    setForm(emptyForm);
  };

  const openAdd = () => {
    setEditRow(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: FullMockTest) => {
    setEditRow(row);
    setForm({
      title: row.title,
      description: row.description ?? "",
      is_active: row.is_active,
      listening_part1_id: row.listening_part1_id ?? "",
      listening_part2_id: row.listening_part2_id ?? "",
      listening_part3_id: row.listening_part3_id ?? "",
      listening_part4_id: row.listening_part4_id ?? "",
      reading_part1a_id: row.reading_part1a_id ?? "",
      reading_part1b_id: row.reading_part1b_id ?? "",
      reading_part2_id: row.reading_part2_id ?? "",
      reading_part3_id: row.reading_part3_id ?? "",
      reading_part4_id: row.reading_part4_id ?? "",
      writing_task1_id: row.writing_task1_id ?? "",
      writing_task2_id: row.writing_task2_id ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editRow) {
      updateMutation.mutate({ id: editRow.id, f: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || randomMutation.isPending;

  const handleAutoFill = () => {
    setForm((prev) => autoFillRandomForm(prev, allListening, allWriting));
  };

  const handleQuickRandom = () => {
    const n = tests.length + 1;
    randomMutation.mutate({
      title: `LanguageCert Mock Test ${n}`,
      description: "Full International ESOL format — Listening, Reading, Writing (+ Speaking from practice bank).",
    });
  };

  // ── Field updater shorthand ──
  const setField =
    <K extends keyof AssemblyForm>(key: K) =>
    (value: AssemblyForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
            <FileText className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Mock Tests</h1>
            <p className="text-sm text-slate-500">
              Assemble LanguageCert format tests — visible on student portal when Active
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleQuickRandom}
            disabled={randomMutation.isPending}
            className="gap-2"
          >
            <Sparkles className="size-4" />
            {randomMutation.isPending ? "Creating…" : "Quick random mock test"}
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="size-4" />
            Create Mock Test
          </Button>
        </div>
      </div>

      {/* Format reference */}
      <Card className="border border-indigo-100 bg-indigo-50/40 shadow-sm">
        <CardContent className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">LanguageCert format</p>
          <div className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-semibold text-cyan-800">Listening · {MOCK_TOTALS.listening} q</p>
              <p className="text-xs text-slate-600">{MOCK_LISTENING_PARTS.map((p) => p.label).join(", ")}</p>
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Reading · {MOCK_TOTALS.reading} q</p>
              <p className="text-xs text-slate-600">{MOCK_READING_PARTS.map((p) => p.label).join(", ")}</p>
            </div>
            <div>
              <p className="font-semibold text-amber-800">Writing · 2 tasks</p>
              <p className="text-xs text-slate-600">{MOCK_WRITING_TASKS.map((p) => `${p.label} (${p.words} words)`).join(" · ")}</p>
            </div>
            <div>
              <p className="font-semibold text-violet-800">Speaking · 4 parts</p>
              <p className="text-xs text-slate-600">Uses practice speaking bank in mock runner</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Mock Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-slate-800">{tests.length}</span>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-green-600">
              {tests.filter((t) => t.is_active).length}
            </span>
          </CardContent>
        </Card>
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Fully Assembled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-indigo-600">
              {tests.filter((t) => filledCount(t) === 11).length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tests table */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-600">
            {tests.length} mock test{tests.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {testsQuery.isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : testsQuery.isError ? (
            <div className="p-8 text-center text-sm text-red-500">Failed to load mock tests.</div>
          ) : tests.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No mock tests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-5 py-3 font-medium text-slate-500">Title</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Sections</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Active</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Created</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((row) => {
                    const filled = filledCount(row);
                    return (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-medium text-slate-700">{row.title}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={filled === 11 ? "default" : "secondary"}
                            className="tabular-nums"
                          >
                            {filled} / 11
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={row.is_active ? "default" : "secondary"}>
                            {row.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(row.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {row.is_active && (
                              <a
                                href={mockTestIntroUrl(row.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-md p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-700 transition"
                                title="View on student portal"
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRow ? "Edit Mock Test" : "Create Mock Test"}</DialogTitle>
            <p className="text-xs text-slate-500">
              Pick one question set per section. Active tests appear at /mock-tests on the student portal.
            </p>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleAutoFill}>
                <Shuffle className="size-3.5" />
                Auto-fill random questions
              </Button>
            </div>

            {/* Basic Info */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Basic Info
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g. LanguageCert Mock Test 1"
                    value={form.title}
                    onChange={(e) => setField("title")(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    placeholder="Short note for students (optional)"
                    value={form.description}
                    onChange={(e) => setField("description")(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(val) => setField("is_active")(val)}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>

            {/* Listening */}
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                Listening · {MOCK_TOTALS.listening} questions
              </h3>
              <p className="mb-3 text-[11px] text-slate-500">Parts 1–4 — MCQs and note completion</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  label={`${MOCK_LISTENING_PARTS[0].label} (${MOCK_LISTENING_PARTS[0].questions} q)`}
                  value={form.listening_part1_id}
                  onChange={setField("listening_part1_id")}
                  options={lPart(1)}
                  loading={listeningQuery.isLoading}
                />
                <SelectField
                  label={`${MOCK_LISTENING_PARTS[1].label} (${MOCK_LISTENING_PARTS[1].questions} q)`}
                  value={form.listening_part2_id}
                  onChange={setField("listening_part2_id")}
                  options={lPart(2)}
                  loading={listeningQuery.isLoading}
                />
                <SelectField
                  label={`${MOCK_LISTENING_PARTS[2].label} (${MOCK_LISTENING_PARTS[2].questions} q)`}
                  value={form.listening_part3_id}
                  onChange={setField("listening_part3_id")}
                  options={lPart(3)}
                  loading={listeningQuery.isLoading}
                />
                <SelectField
                  label={`${MOCK_LISTENING_PARTS[3].label} (${MOCK_LISTENING_PARTS[3].questions} q)`}
                  value={form.listening_part4_id}
                  onChange={setField("listening_part4_id")}
                  options={lPart(4)}
                  loading={listeningQuery.isLoading}
                />
              </div>
            </div>

            {/* Reading */}
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Reading · {MOCK_TOTALS.reading} questions
              </h3>
              <p className="mb-3 text-[11px] text-slate-500">Parts 1A–4 — MCQ, gap-fill, matching, short answer</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  label={`${MOCK_READING_PARTS[0].label} (${MOCK_READING_PARTS[0].questions} q)`}
                  value={form.reading_part1a_id}
                  onChange={setField("reading_part1a_id")}
                  options={wByType("reading_part_1a")}
                  loading={writingQuery.isLoading}
                />
                <SelectField
                  label={`${MOCK_READING_PARTS[1].label} (${MOCK_READING_PARTS[1].questions} q)`}
                  value={form.reading_part1b_id}
                  onChange={setField("reading_part1b_id")}
                  options={wByType("reading_part_1b")}
                  loading={writingQuery.isLoading}
                />
                <SelectField
                  label={`${MOCK_READING_PARTS[2].label} (${MOCK_READING_PARTS[2].questions} q)`}
                  value={form.reading_part2_id}
                  onChange={setField("reading_part2_id")}
                  options={wByType("reading_part_2")}
                  loading={writingQuery.isLoading}
                />
                <SelectField
                  label={`${MOCK_READING_PARTS[3].label} (${MOCK_READING_PARTS[3].questions} q)`}
                  value={form.reading_part3_id}
                  onChange={setField("reading_part3_id")}
                  options={wByType("reading_part_3")}
                  loading={writingQuery.isLoading}
                />
                <SelectField
                  label={`${MOCK_READING_PARTS[4].label} (${MOCK_READING_PARTS[4].questions} q)`}
                  value={form.reading_part4_id}
                  onChange={setField("reading_part4_id")}
                  options={wByType("reading_part_4")}
                  loading={writingQuery.isLoading}
                />
              </div>
            </div>

            {/* Writing */}
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Writing · 2 tasks
              </h3>
              <p className="mb-3 text-[11px] text-slate-500">Task 1 formal · Task 2 informal (AI scored)</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SelectField
                  label={`${MOCK_WRITING_TASKS[0].label} (${MOCK_WRITING_TASKS[0].words} words)`}
                  value={form.writing_task1_id}
                  onChange={setField("writing_task1_id")}
                  options={wByType("task1")}
                  loading={writingQuery.isLoading}
                />
                <SelectField
                  label={`${MOCK_WRITING_TASKS[1].label} (${MOCK_WRITING_TASKS[1].words} words)`}
                  value={form.writing_task2_id}
                  onChange={setField("writing_task2_id")}
                  options={wByType("task2")}
                  loading={writingQuery.isLoading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || isSaving}>
              {isSaving ? "Saving…" : editRow ? "Save Changes" : "Create Mock Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Mock Test?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This will deactivate the test. The action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
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
