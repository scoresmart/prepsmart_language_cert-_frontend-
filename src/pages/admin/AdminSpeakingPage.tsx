import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Mic, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, type SpeakingQuestion } from "@/lib/api";
import { AudioUploadDropzone } from "@/components/admin/AudioUploadDropzone";
import {
  SPEAKING_PART_FOCUS,
  SPEAKING_PART_TITLES,
  SPEAKING_SCALED_MAX_SCORE,
} from "@/lib/speakingInstructions";

const DIFFICULTY_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** LanguageCert Academic — 4 parts only (no sub-tasks) */
const SPEAKING_PARTS = [
  { partNumber: 1, taskType: "speaking_part_1" },
  { partNumber: 2, taskType: "speaking_part_2" },
  { partNumber: 3, taskType: "speaking_part_3" },
  { partNumber: 4, taskType: "speaking_part_4" },
] as const;

const PART_CONTENT_TEMPLATES: Record<number, string> = {
  1: `【Examiner question】
(Write the question the examiner asks — e.g. Do you prefer studying in the morning or in the evening?)

【How to answer】
Use 2–3 sentences: direct answer + reason or example. Do not give one-word answers.

【Model answer】
I prefer studying in the morning because my mind is fresh at that time. I can focus better and complete difficult tasks more easily.`,
  2: `【Role play situation】
(Describe the academic situation — e.g. You missed a lecture and need notes from your classmate.)

【How to respond】
Greeting + explain problem + polite request + ask a follow-up question.

【Useful language】
Excuse me… / Could you please…? / I would really appreciate it.

【Model opening】
Hi, I missed yesterday's lecture because I was unwell. Could you please share your notes with me?`,
  3: `【Read aloud text】
(Short academic text for the student to read — e.g. Online learning has become popular among university students…)

【Examiner follow-up】
(Do you think online learning is useful?)

【Reading tips】
Prepare for 30 seconds. Read clearly — pause at commas and full stops.

【Follow-up structure】
Opinion + reason + example.`,
  4: `【Presentation topic】
(Academic topic — e.g. The benefits of studying abroad for university students.)

【Structure】
Introduction → Point 1 + example → Point 2 + example → Conclusion

【Prepare 1 minute · Speak up to 2 minutes】

【Model outline】
Introduction: …
Point 1: …
Point 2: …
Conclusion: …

【Follow-up】
(Example follow-up question the examiner may ask.)`,
};

type FormData = {
  part_number: number;
  title: string;
  level: string;
  max_score: number;
  is_published: boolean;
  content: string;
  audio_url: string;
  image_url: string;
};

function stripSpeakingAudioRef(value: string): string {
  if (!value?.trim()) return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("http")) return trimmed;
  for (const marker of ["speaking-audio/", "listening-audio/"]) {
    const idx = trimmed.indexOf(marker);
    if (idx >= 0) return trimmed.slice(idx + marker.length);
  }
  return trimmed;
}

function emptyForm(partNumber = 1): FormData {
  return {
    part_number: partNumber,
    title: "",
    level: "B1",
    max_score: SPEAKING_SCALED_MAX_SCORE,
    is_published: true,
    content: PART_CONTENT_TEMPLATES[partNumber] ?? "",
    audio_url: "",
    image_url: "",
  };
}

export function AdminSpeakingPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<SpeakingQuestion | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm());
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [expandedParts, setExpandedParts] = React.useState<Set<number>>(
    new Set(SPEAKING_PARTS.map((p) => p.partNumber)),
  );

  const q = useQuery({
    queryKey: ["admin", "speaking-questions"],
    queryFn: async () => {
      const res = await api.speaking.listAll();
      return res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = {
        title: data.title.trim(),
        task_type: `speaking_part_${data.part_number}`,
        part_number: data.part_number,
        level: data.level,
        max_score: data.max_score,
        is_published: data.is_published,
        content: data.content || null,
        audio_url: data.audio_url || null,
        image_url: data.image_url || null,
      };

      if (data.id) {
        await api.speaking.update(data.id, payload);
      } else {
        await api.speaking.create(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "speaking-questions"] });
      qc.invalidateQueries({ queryKey: ["speaking-runner"] });
      qc.invalidateQueries({ queryKey: ["practice", "speaking"] });
      setDialogOpen(false);
      setEditRow(null);
      setForm(emptyForm());
      toast.success(editRow ? "Question updated" : "Question added");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not save question");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.speaking.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "speaking-questions"] });
      setDeleteId(null);
      toast.success("Question deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not delete question");
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      await api.speaking.update(id, { is_published: val });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "speaking-questions"] });
      qc.invalidateQueries({ queryKey: ["speaking-runner"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not update publish status");
    },
  });

  const togglePart = (partNumber: number) =>
    setExpandedParts((prev) => {
      const next = new Set(prev);
      next.has(partNumber) ? next.delete(partNumber) : next.add(partNumber);
      return next;
    });

  const openAdd = (partNumber = 1) => {
    setEditRow(null);
    setForm(emptyForm(partNumber));
    setDialogOpen(true);
  };

  const openEdit = (row: SpeakingQuestion) => {
    setEditRow(row);
    setForm({
      part_number: row.part_number,
      title: row.title,
      level: row.level,
      max_score: row.max_score,
      is_published: row.is_published,
      content: row.content ?? "",
      audio_url: stripSpeakingAudioRef(row.audio_url ?? ""),
      image_url: row.image_url ?? "",
    });
    setDialogOpen(true);
  };

  const grouped = React.useMemo(() => {
    const rows = q.data ?? [];
    const s = search.toLowerCase();

    return SPEAKING_PARTS.map((part) => ({
      ...part,
      title: SPEAKING_PART_TITLES[String(part.partNumber)] ?? `Part ${part.partNumber}`,
      focus: SPEAKING_PART_FOCUS[String(part.partNumber)] ?? "",
      questions: rows.filter(
        (r) =>
          r.part_number === part.partNumber &&
          (!s || r.title.toLowerCase().includes(s) || (r.content ?? "").toLowerCase().includes(s)),
      ),
    }));
  }, [q.data, search]);

  const selectedPartTitle = SPEAKING_PART_TITLES[String(form.part_number)] ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
            <Mic className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Speaking Questions</h1>
            <p className="text-sm text-slate-500">
              LanguageCert Academic — 4 parts · {q.data?.length ?? 0} questions total
            </p>
          </div>
        </div>
        <Button onClick={() => openAdd(1)} className="gap-2">
          <Plus className="size-4" />
          Add Question
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search questions..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {q.isLoading && !q.data ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
      ) : (
        <div className="space-y-4">
          {grouped.map((part) => {
            const isOpen = expandedParts.has(part.partNumber);
            return (
              <div key={part.partNumber} className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => togglePart(part.partNumber)}
                  className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500">
                      <Mic className="size-4 text-white" />
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="font-semibold text-slate-800">
                        Part {part.partNumber} — {part.title}
                      </span>
                      <p className="mt-0.5 text-xs font-normal text-slate-500">{part.focus}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {part.questions.length} question{part.questions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="size-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t">
                    <div className="flex items-center justify-between bg-slate-50 px-5 py-2.5">
                      <span className="text-xs text-slate-500">
                        Add practice questions for Part {part.partNumber} ({part.title})
                      </span>
                      <button
                        type="button"
                        onClick={() => openAdd(part.partNumber)}
                        className="flex items-center gap-1 rounded-md bg-blue-500 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-blue-600"
                      >
                        <Plus className="size-3" /> Add to Part {part.partNumber}
                      </button>
                    </div>

                    {part.questions.length === 0 ? (
                      <div className="px-5 py-4 text-xs italic text-slate-400">
                        No questions yet — click &quot;Add to Part {part.partNumber}&quot; to create one.
                      </div>
                    ) : (
                      part.questions.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center gap-3 border-t border-slate-100 px-5 py-2.5 transition hover:bg-slate-50/60"
                        >
                          <span className="flex-1 truncate text-sm text-slate-700">{row.title}</span>
                          <span className="text-xs uppercase text-slate-400">{row.level}</span>
                          <span className="text-xs text-slate-400">{row.max_score} pts</span>
                          <Switch
                            checked={row.is_published}
                            onCheckedChange={(val) => togglePublish.mutate({ id: row.id, val })}
                          />
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(row.id)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRow ? "Edit Speaking Question" : "Add Speaking Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-900">
              <strong>LanguageCert Academic Speaking</strong> — Part {form.part_number}: {selectedPartTitle}
              <p className="mt-1 text-blue-800/80">{SPEAKING_PART_FOCUS[String(form.part_number)]}</p>
            </div>

            <div className="space-y-1.5">
              <Label>Part *</Label>
              <Select
                value={String(form.part_number)}
                onChange={(e) => {
                  const partNum = parseInt(e.target.value, 10);
                  setForm((prev) => ({
                    ...prev,
                    part_number: partNum,
                    content: prev.content.trim() ? prev.content : PART_CONTENT_TEMPLATES[partNum] ?? "",
                  }));
                }}
              >
                {SPEAKING_PARTS.map((p) => (
                  <option key={p.partNumber} value={p.partNumber}>
                    Part {p.partNumber} — {SPEAKING_PART_TITLES[String(p.partNumber)]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="Question title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                {DIFFICULTY_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Examiner audio</Label>
              <p className="text-xs text-slate-500">
                Upload the prompt audio students hear before they record.
              </p>
              <AudioUploadDropzone
                value={form.audio_url}
                onChange={(path) => setForm({ ...form, audio_url: path })}
                onUpload={async (file) => {
                  const res = await api.speaking.uploadAudio(file);
                  return res.data?.path ?? "";
                }}
                disabled={saveMutation.isPending}
              />
              <div className="pt-1">
                <Label className="text-xs text-slate-500">Or paste audio URL / storage path</Label>
                <Input
                  placeholder="https://… or 2026-06-11/uuid.mp3"
                  value={form.audio_url}
                  onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Max Score</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={form.max_score}
                onChange={(e) => setForm({ ...form, max_score: parseInt(e.target.value, 10) || 50 })}
                className="max-w-[140px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Content / Instructions</Label>
              <Textarea
                placeholder="Examiner script, read-aloud text, role-play situation, or presentation topic..."
                rows={8}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_published}
                onCheckedChange={(val) => setForm({ ...form, is_published: val })}
              />
              <Label>Published (visible to students)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })}
              disabled={!form.title.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : editRow ? "Save Changes" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Question?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This action cannot be undone. The question will be permanently removed.
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
