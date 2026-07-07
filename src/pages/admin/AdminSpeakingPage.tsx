import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Mic, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { validateSpeakingSetStructure } from "@/lib/speakingSetStructure";
import { SPEAKING_PART_FOCUS } from "@/lib/speakingInstructions";

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
    mutationFn: async () => {
      const validationError = validateSpeakingSetStructure(form.structure);
      if (validationError) throw new Error(validationError);
      if (!form.title.trim()) throw new Error("Set title is required");

      const payload = {
        title: form.title.trim(),
        level: form.level,
        sort_order: form.sort_order,
        is_published: form.is_published,
        structure: form.structure,
      };

      if (editRow) {
        await api.speaking.sets.update(editRow.id, payload);
      } else {
        await api.speaking.sets.create(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "speaking-sets"] });
      qc.invalidateQueries({ queryKey: ["speaking-runner"] });
      qc.invalidateQueries({ queryKey: ["practice", "speaking"] });
      setDialogOpen(false);
      setEditRow(null);
      setForm(speakingSetToForm());
      toast.success(editRow ? "Set updated" : "Set created");
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
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
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
              One set = Part 1 (5 Qs) + Part 2 (2 role plays) + Part 3 (read aloud + follow-ups) + Part 4
              (presentation + 2 follow-ups)
            </p>
          </div>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="size-4" />
          Create set
        </Button>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-xs text-blue-900">
        <p className="font-medium">Set structure (LanguageCert Academic)</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-blue-800/90">
          <li>Part 1: {SPEAKING_PART_FOCUS["1"]}</li>
          <li>Part 2: {SPEAKING_PART_FOCUS["2"]}</li>
          <li>Part 3: {SPEAKING_PART_FOCUS["3"]}</li>
          <li>Part 4: {SPEAKING_PART_FOCUS["4"]}</li>
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
          <p className="mt-1 text-sm text-slate-500">Create your first full 4-part speaking set.</p>
          <Button className="mt-4" onClick={openAdd}>
            Create set
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
                <p className="text-xs text-slate-500">
                  Level {row.level} · 5 + 2 + {1 + row.structure.part3.followUps.length} +{" "}
                  {1 + row.structure.part4.followUps.length} prompts
                </p>
              </div>
              <span className="text-xs uppercase text-slate-400">{row.level}</span>
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
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRow ? "Edit speaking set" : "Create speaking set"}</DialogTitle>
          </DialogHeader>
          <SpeakingSetEditor
            value={form}
            onChange={setForm}
            disabled={saveMutation.isPending}
          />
          <div className="flex items-center gap-3 border-t pt-4">
            <Switch
              checked={form.is_published}
              onCheckedChange={(val) => setForm({ ...form, is_published: val })}
              disabled={saveMutation.isPending}
            />
            <Label>Published (visible to students)</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : editRow ? "Save set" : "Create set"}
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
