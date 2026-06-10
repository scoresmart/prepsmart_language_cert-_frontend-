import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";

type Word = {
  id: string;
  word: string;
  definition: string;
  category?: string;
  example?: string;
  created_at: string;
};

type FormData = { word: string; definition: string; category: string; example: string; };
const emptyForm: FormData = { word: "", definition: "", category: "general", example: "" };

export function AdminVocabularyPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<Word | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "vocabulary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vocabulary")
        .select("id,word,definition,category,example,created_at")
        .order("word", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Word[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = { word: data.word, definition: data.definition, category: data.category, example: data.example || null };
      if (data.id) { const { error } = await supabase.from("vocabulary").update(payload).eq("id", data.id); if (error) throw error; }
      else { const { error } = await supabase.from("vocabulary").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "vocabulary"] }); setDialogOpen(false); setEditRow(null); setForm(emptyForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("vocabulary").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "vocabulary"] }); setDeleteId(null); },
  });

  const filtered = (q.data ?? []).filter((r) => !search || r.word.toLowerCase().includes(search.toLowerCase()) || r.definition.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-500"><BookMarked className="size-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-slate-800">Vocabulary</h1><p className="text-sm text-slate-500">{q.data?.length ?? 0} words</p></div>
        </div>
        <Button onClick={() => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); }} className="gap-2"><Plus className="size-4" />Add Word</Button>
      </div>
      <Card className="border-0 bg-white shadow-sm"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" /><Input placeholder="Search words..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardContent></Card>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">{filtered.length} word{filtered.length !== 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No vocabulary entries yet.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">Word</th><th className="px-4 py-3 font-medium text-slate-500">Definition</th><th className="px-4 py-3 font-medium text-slate-500">Category</th><th className="px-4 py-3 font-medium text-slate-500">Actions</th></tr></thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-800">{row.word}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{row.definition}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{row.category ?? "general"}</Badge></td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => { setEditRow(row); setForm({ word: row.word, definition: row.definition, category: row.category ?? "general", example: row.example ?? "" }); setDialogOpen(true); }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-3.5" /></button><button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editRow ? "Edit Word" : "Add Word"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Word *</Label><Input value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="general">General</option><option value="academic">Academic</option><option value="business">Business</option><option value="pte_specific">PTE Specific</option></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Definition *</Label><Textarea rows={2} value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Example Sentence</Label><Textarea rows={2} placeholder="Use the word in a sentence..." value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })} disabled={!form.word || !form.definition || saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : editRow ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Word?</DialogTitle></DialogHeader><p className="text-sm text-slate-500">This will permanently remove the vocabulary entry.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
