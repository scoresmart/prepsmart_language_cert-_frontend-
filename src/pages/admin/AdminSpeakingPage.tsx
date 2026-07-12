import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Mic, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, type SpeakingSet } from "@/lib/api";
import { SpeakingSetEditor, speakingSetToForm } from "@/components/admin/SpeakingSetEditor";
import {
  normalizeSpeakingSetStructure,
  validateSpeakingSetStructure,
} from "@/lib/speakingSetStructure";

export function AdminSpeakingPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<SpeakingSet | null>(null);
  const [form, setForm] = React.useState(speakingSetToForm());
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "speaking-sets"],
    queryFn: async () => {
      const res = await api.speaking.sets.listAll();
      return res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      if (!form.title.trim()) throw new Error("Set title is required");

      const structure = normalizeSpeakingSetStructure(form.structure);
      if (publish) {
        const validationError = validateSpeakingSetStructure(structure);
        if (validationError) throw new Error(validationError);
      }

      const payload = {
        title: form.title.trim(),
        level: form.level,
        sort_order: form.sort_order,
        is_published: publish,
        structure,
      };

      if (editRow) {
        await api.speaking.sets.update(editRow.id, payload);
      } else {
        await api.speaking.sets.create(payload);
      }
    },
    onSuccess: (_data, publish) => {
      qc.invalidateQueries({ queryKey: ["admin", "speaking-sets"] });
      qc.invalidateQueries({ queryKey: ["speaking-runner"] });
      qc.invalidateQueries({ queryKey: ["practice", "speaking"] });
      setDialogOpen(false);
      setEditRow(null);
      setForm(speakingSetToForm());
      toast.success(publish ? "Set published" : "Draft saved");
    },
    onError: (err: Error) => toast.error(err.message || "Could not save set"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.speaking.sets.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "speaking-sets"] });
      setDeleteId(null);
      toast.success("Set deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Could not delete set"),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, val, row }: { id: string; val: boolean; row: SpeakingSet }) => {
      if (val) {
        const validationError = validateSpeakingSetStructure(
          normalizeSpeakingSetStructure(row.structure),
        );
        if (validationError) throw new Error(validationError);
      }
      await api.speaking.sets.update(id, { is_published: val });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "speaking-sets"] });
      qc.invalidateQueries({ queryKey: ["speaking-runner"] });
    },
    onError: (err: Error) => toast.error(err.message || "Could not update publish status"),
  });

  const filtered = React.useMemo(() => {
    const s = search.toLowerCase();
    return (q.data ?? []).filter((row) => !s || row.title.toLowerCase().includes(s));
  }, [q.data, search]);

  const openAdd = () => {
    setEditRow(null);
    setForm(speakingSetToForm());
    setDialogOpen(true);
  };

  const openEdit = (row: SpeakingSet) => {
    setEditRow(row);
    setForm(speakingSetToForm(row));
    setDialogOpen(true);
  };

  const setSummary = (row: SpeakingSet) => {
    const s = normalizeSpeakingSetStructure(row.structure);
    return `${s.exam_name} · ${row.is_published ? "Published" : "Draft"} · Level ${row.level}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
            <Mic className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Speaking Sets</h1>
            <p className="text-sm text-slate-500">
              LanguageCert Academic Speaking — full set with intro, Parts 1–4, timers, and examiner audio
            </p>
          </div>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="size-4" />
          Add New Speaking Set
        </Button>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-xs text-blue-900">
        <p className="font-medium">Set structure (LanguageCert Academic)</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-blue-800/90">
          <li>General intro + Part 1: 5 questions (30s each)</li>
          <li>Part 2: 2 role plays (60s each)</li>
          <li>Part 3: Read aloud (30s prep + 60s read) + follow-up (45s)</li>
          <li>Part 4: Presentation (60s prep + 120s speak) + 2 follow-ups (45s) + ending</li>
        </ul>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search sets..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {q.isLoading && !q.data ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-slate-50 py-16 text-center">
          <Layers className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">No speaking sets yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first LanguageCert Academic speaking set.</p>
          <Button className="mt-4" onClick={openAdd}>
            Add New Speaking Set
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0 hover:bg-slate-50/60"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{row.title}</p>
                <p className="text-xs text-slate-500">{setSummary(row)}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  row.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {row.is_published ? "Published" : "Draft"}
              </span>
              <button
                type="button"
                onClick={() =>
                  togglePublish.mutate({ id: row.id, val: !row.is_published, row })
                }
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                {row.is_published ? "Unpublish" : "Publish"}
              </button>
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
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRow ? "Edit Speaking Set" : "Add New Speaking Set"}</DialogTitle>
          </DialogHeader>
          <SpeakingSetEditor
            value={form}
            onChange={setForm}
            disabled={saveMutation.isPending}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => saveMutation.mutate(false)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : "Save Draft"}
            </Button>
            <Button onClick={() => saveMutation.mutate(true)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Publish Set"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete set?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">This cannot be undone.</p>
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
