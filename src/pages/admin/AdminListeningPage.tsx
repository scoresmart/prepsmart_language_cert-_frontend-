import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Headphones, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";

// LanguageCert SELT Listening task types — grouped by Part
const LISTENING_PARTS = [
  {
    part: "listening_part_1", label: "Part 1",
    tasks: [
      { value: "listening_part_1_task_1", label: "Task 1" },
      { value: "listening_part_1_task_2", label: "Task 2" },
      { value: "listening_part_1_task_3", label: "Task 3" },
      { value: "listening_part_1_task_4", label: "Task 4" },
      { value: "listening_part_1_task_5", label: "Task 5" },
      { value: "listening_part_1_task_6", label: "Task 6" },
      { value: "listening_part_1_task_7", label: "Task 7" },
      { value: "listening_part_1_task_8", label: "Task 8" },
    ],
  },
  {
    part: "listening_part_2", label: "Part 2",
    tasks: [
      { value: "listening_part_2_task_1", label: "Task 1" },
      { value: "listening_part_2_task_2", label: "Task 2" },
      { value: "listening_part_2_task_3", label: "Task 3" },
      { value: "listening_part_2_task_4", label: "Task 4" },
      { value: "listening_part_2_task_5", label: "Task 5" },
      { value: "listening_part_2_task_6", label: "Task 6" },
      { value: "listening_part_2_task_7", label: "Task 7" },
      { value: "listening_part_2_task_8", label: "Task 8" },
    ],
  },
  {
    part: "listening_part_3", label: "Part 3",
    tasks: [
      { value: "listening_part_3_task_1", label: "Task 1" },
      { value: "listening_part_3_task_2", label: "Task 2" },
      { value: "listening_part_3_task_3", label: "Task 3" },
      { value: "listening_part_3_task_4", label: "Task 4" },
      { value: "listening_part_3_task_5", label: "Task 5" },
      { value: "listening_part_3_task_6", label: "Task 6" },
      { value: "listening_part_3_task_7", label: "Task 7" },
      { value: "listening_part_3_task_8", label: "Task 8" },
    ],
  },
  {
    part: "listening_part_4", label: "Part 4",
    tasks: [
      { value: "listening_part_4_task_1", label: "Task 1" },
      { value: "listening_part_4_task_2", label: "Task 2" },
      { value: "listening_part_4_task_3", label: "Task 3" },
      { value: "listening_part_4_task_4", label: "Task 4" },
      { value: "listening_part_4_task_5", label: "Task 5" },
      { value: "listening_part_4_task_6", label: "Task 6" },
      { value: "listening_part_4_task_7", label: "Task 7" },
      { value: "listening_part_4_task_8", label: "Task 8" },
    ],
  },
];

// Flat list for filters/lookups
const DIFFICULTY_LEVELS = ["A1", "A2", "B1", "B2"];

type Question = {
  id: string;
  title: string;
  type: string;
  level: string;
  max_score: number;
  is_published: boolean;
  created_at: string;
  content?: string;
  audio_url?: string;
  options?: string;
  correct_answer?: string;
};

type FormData = {
  title: string;
  type: string;
  level: string;
  max_score: number;
  is_published: boolean;
  content: string;
  audio_url: string;
  options: string;
  correct_answer: string;
};

const emptyForm: FormData = {
  title: "",
  type: "write_from_dictation",
  level: "medium",
  max_score: 3,
  is_published: false,
  content: "",
  audio_url: "",
  options: "",
  correct_answer: "",
};

export function AdminListeningPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<Question | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "listening-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id,title,type,level,max_score,is_published,created_at,content,audio_url,options,correct_answer")
        .eq("section", "listening")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Question[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = {
        title: data.title,
        type: data.type,
        section: "listening",
        level: data.level,
        max_score: data.max_score,
        is_published: data.is_published,
        content: data.content || null,
        audio_url: data.audio_url || null,
        options: data.options || null,
        correct_answer: data.correct_answer || null,
      };
      if (data.id) {
        const { error } = await supabase.from("questions").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("questions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "listening-questions"] });
      qc.invalidateQueries({ queryKey: ["lc", "admin", "dashboard-stats"] });
      setDialogOpen(false);
      setEditRow(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "listening-questions"] });
      qc.invalidateQueries({ queryKey: ["lc", "admin", "dashboard-stats"] });
      setDeleteId(null);
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("questions").update({ is_published: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "listening-questions"] }),
  });

  const [expandedParts, setExpandedParts] = React.useState<Set<string>>(
    new Set(LISTENING_PARTS.map((p) => p.part))
  );
  const togglePart = (part: string) =>
    setExpandedParts((prev) => {
      const next = new Set(prev);
      next.has(part) ? next.delete(part) : next.add(part);
      return next;
    });

  const openAdd = () => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); };
  const openAddForTask = (taskValue: string) => {
    setEditRow(null);
    setForm({ ...emptyForm, type: taskValue });
    setDialogOpen(true);
  };
  const openEdit = (row: Question) => {
    setEditRow(row);
    setForm({
      title: row.title, type: row.type, level: row.level, max_score: row.max_score,
      is_published: row.is_published, content: row.content ?? "",
      audio_url: row.audio_url ?? "", options: row.options ?? "",
      correct_answer: row.correct_answer ?? "",
    });
    setDialogOpen(true);
  };

  const grouped = React.useMemo(() => {
    const rows = q.data ?? [];
    const s = search.toLowerCase();
    return LISTENING_PARTS.map((part) => ({
      ...part,
      tasks: part.tasks.map((task) => ({
        ...task,
        questions: rows.filter(
          (r) => r.type === task.value && (!s || r.title.toLowerCase().includes(s))
        ),
      })),
    }));
  }, [q.data, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
            <Headphones className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Listening Questions</h1>
            <p className="text-sm text-slate-500">{q.data?.length ?? 0} questions total</p>
          </div>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="size-4" />
          Add Question
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input placeholder="Search questions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Part → Task → Questions accordion */}
      {q.isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
      ) : (
        <div className="space-y-4">
          {grouped.map((part) => {
            const partTotal = part.tasks.reduce((s, t) => s + t.questions.length, 0);
            const isOpen = expandedParts.has(part.part);
            return (
              <div key={part.part} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                {/* Part header */}
                <button
                  onClick={() => togglePart(part.part)}
                  className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
                      <Headphones className="size-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800">Listening {part.label}</span>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {partTotal} question{partTotal !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {isOpen ? <ChevronDown className="size-4 text-slate-400" /> : <ChevronRight className="size-4 text-slate-400" />}
                </button>

                {/* Tasks inside part */}
                {isOpen && (
                  <div className="divide-y border-t">
                    {part.tasks.map((task) => (
                      <div key={task.value}>
                        {/* Task sub-header */}
                        <div className="flex items-center justify-between bg-slate-50 px-6 py-2.5">
                          <span className="text-sm font-medium text-slate-700">{task.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{task.questions.length} question{task.questions.length !== 1 ? "s" : ""}</span>
                            <button
                              onClick={() => openAddForTask(task.value)}
                              className="flex items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-600 transition"
                            >
                              <Plus className="size-3" /> Add
                            </button>
                          </div>
                        </div>
                        {/* Question rows */}
                        {task.questions.length === 0 ? (
                          <div className="px-8 py-3 text-xs text-slate-400 italic">No questions yet — click Add to create one.</div>
                        ) : (
                          task.questions.map((row) => (
                            <div key={row.id} className="flex items-center gap-3 px-8 py-2.5 hover:bg-slate-50/60 transition">
                              <span className="flex-1 truncate text-sm text-slate-700">{row.title}</span>
                              <span className="text-xs text-slate-400 uppercase">{row.level}</span>
                              <span className="text-xs text-slate-400">{row.max_score}pts</span>
                              <Switch checked={row.is_published} onCheckedChange={(val) => togglePublish.mutate({ id: row.id, val })} />
                              <button onClick={() => openEdit(row)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <Pencil className="size-3.5" />
                              </button>
                              <button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editRow ? "Edit Listening Question" : "Add Listening Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="Question title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {LISTENING_PARTS.map((p) => (
                    <optgroup key={p.part} label={`Listening ${p.label}`}>
                      {p.tasks.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </optgroup>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  {DIFFICULTY_LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Max Score</Label>
                <Input type="number" min={1} value={form.max_score} onChange={(e) => setForm({ ...form, max_score: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Audio URL</Label>
                <Input placeholder="https://..." value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Transcript / Content</Label>
              <Textarea placeholder="Audio transcript or question content..." rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Answer Options (one per line)</Label>
              <Textarea placeholder="Option A&#10;Option B&#10;Option C" rows={3} value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Correct Answer</Label>
              <Input placeholder="e.g. Option A" value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={(val) => setForm({ ...form, is_published: val })} />
              <Label>Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })} disabled={!form.title || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : editRow ? "Save Changes" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Question?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-500">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
