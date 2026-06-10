import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, BookOpen, Search, ChevronDown, ChevronRight } from "lucide-react";
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

// LanguageCert SELT Reading — hierarchical Parts
const READING_PARTS = [
  { part: "reading_part_1a", label: "Part 1a", tasks: Array.from({ length: 8 }, (_, i) => ({ value: `reading_part_1a_task_${i + 1}`, label: `Task ${i + 1}` })) },
  { part: "reading_part_1b", label: "Part 1b", tasks: Array.from({ length: 8 }, (_, i) => ({ value: `reading_part_1b_task_${i + 1}`, label: `Task ${i + 1}` })) },
  { part: "reading_part_2",  label: "Part 2",  tasks: Array.from({ length: 8 }, (_, i) => ({ value: `reading_part_2_task_${i + 1}`,  label: `Task ${i + 1}` })) },
  { part: "reading_part_3",  label: "Part 3",  tasks: Array.from({ length: 8 }, (_, i) => ({ value: `reading_part_3_task_${i + 1}`,  label: `Task ${i + 1}` })) },
  { part: "reading_part_4",  label: "Part 4",  tasks: Array.from({ length: 8 }, (_, i) => ({ value: `reading_part_4_task_${i + 1}`,  label: `Task ${i + 1}` })) },
];

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
  options: string;
  correct_answer: string;
};

const emptyForm: FormData = {
  title: "",
  type: "reading_part_1a_task_1",
  level: "A2",
  max_score: 1,
  is_published: false,
  content: "",
  options: "",
  correct_answer: "",
};

export function AdminReadingPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<Question | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "reading-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id,title,type,level,max_score,is_published,created_at,content,options,correct_answer")
        .eq("section", "reading")
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
        section: "reading",
        level: data.level,
        max_score: data.max_score,
        is_published: data.is_published,
        content: data.content || null,
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
      qc.invalidateQueries({ queryKey: ["admin", "reading-questions"] });
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
      qc.invalidateQueries({ queryKey: ["admin", "reading-questions"] });
      qc.invalidateQueries({ queryKey: ["lc", "admin", "dashboard-stats"] });
      setDeleteId(null);
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("questions").update({ is_published: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reading-questions"] }),
  });

  const [expandedParts, setExpandedParts] = React.useState<Set<string>>(
    new Set(READING_PARTS.map((p) => p.part))
  );
  const togglePart = (part: string) =>
    setExpandedParts((prev) => {
      const next = new Set(prev);
      next.has(part) ? next.delete(part) : next.add(part);
      return next;
    });

  const openAdd = () => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); };
  const openAddForTask = (taskValue: string) => {
    setEditRow(null); setForm({ ...emptyForm, type: taskValue }); setDialogOpen(true);
  };
  const openEdit = (row: Question) => {
    setEditRow(row);
    setForm({
      title: row.title, type: row.type, level: row.level, max_score: row.max_score,
      is_published: row.is_published, content: row.content ?? "",
      options: row.options ?? "", correct_answer: row.correct_answer ?? "",
    });
    setDialogOpen(true);
  };

  const grouped = React.useMemo(() => {
    const rows = q.data ?? [];
    const s = search.toLowerCase();
    return READING_PARTS.map((part) => ({
      ...part,
      tasks: part.tasks.map((task) => ({
        ...task,
        questions: rows.filter((r) => r.type === task.value && (!s || r.title.toLowerCase().includes(s))),
      })),
    }));
  }, [q.data, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500">
            <BookOpen className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Reading Questions</h1>
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
                <button onClick={() => togglePart(part.part)} className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                      <BookOpen className="size-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800">Reading {part.label}</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{partTotal} question{partTotal !== 1 ? "s" : ""}</span>
                  </div>
                  {isOpen ? <ChevronDown className="size-4 text-slate-400" /> : <ChevronRight className="size-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="divide-y border-t">
                    {part.tasks.map((task) => (
                      <div key={task.value}>
                        <div className="flex items-center justify-between bg-slate-50 px-6 py-2.5">
                          <span className="text-sm font-medium text-slate-700">{task.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{task.questions.length} question{task.questions.length !== 1 ? "s" : ""}</span>
                            <button onClick={() => openAddForTask(task.value)} className="flex items-center gap-1 rounded-md bg-green-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-600 transition">
                              <Plus className="size-3" /> Add
                            </button>
                          </div>
                        </div>
                        {task.questions.length === 0 ? (
                          <div className="px-8 py-3 text-xs text-slate-400 italic">No questions yet — click Add to create one.</div>
                        ) : task.questions.map((row) => (
                          <div key={row.id} className="flex items-center gap-3 px-8 py-2.5 hover:bg-slate-50/60 transition">
                            <span className="flex-1 truncate text-sm text-slate-700">{row.title}</span>
                            <span className="text-xs text-slate-400 uppercase">{row.level}</span>
                            <span className="text-xs text-slate-400">{row.max_score}pts</span>
                            <Switch checked={row.is_published} onCheckedChange={(val) => togglePublish.mutate({ id: row.id, val })} />
                            <button onClick={() => openEdit(row)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-3.5" /></button>
                            <button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button>
                          </div>
                        ))}
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
            <DialogTitle>{editRow ? "Edit Reading Question" : "Add Reading Question"}</DialogTitle>
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
                  {READING_PARTS.map((p) => (
                    <optgroup key={p.part} label={`Reading ${p.label}`}>
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
            <div className="space-y-1.5">
              <Label>Max Score</Label>
              <Input type="number" min={1} value={form.max_score} onChange={(e) => setForm({ ...form, max_score: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Passage / Content</Label>
              <Textarea placeholder="Reading passage or question text..." rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Answer Options (one per line)</Label>
              <Textarea placeholder="Option A&#10;Option B&#10;Option C&#10;Option D" rows={3} value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Correct Answer</Label>
              <Input placeholder="e.g. Option A or A,B" value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} />
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
