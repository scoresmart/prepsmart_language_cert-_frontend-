import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";

type QAEntry = {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  created_at: string;
};

type FormData = { question: string; answer: string; category: string; is_active: boolean; };
const emptyForm: FormData = { question: "", answer: "", category: "general", is_active: true };

export function AdminCuratedQAPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<QAEntry | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "curated-qa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curated_qa")
        .select("id,question,answer,category,is_active,created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as QAEntry[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = { question: data.question, answer: data.answer, category: data.category, is_active: data.is_active };
      if (data.id) { const { error } = await supabase.from("curated_qa").update(payload).eq("id", data.id); if (error) throw error; }
      else { const { error } = await supabase.from("curated_qa").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "curated-qa"] }); setDialogOpen(false); setEditRow(null); setForm(emptyForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("curated_qa").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "curated-qa"] }); setDeleteId(null); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => { const { error } = await supabase.from("curated_qa").update({ is_active: val }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "curated-qa"] }),
  });

  const filtered = (q.data ?? []).filter((r) => !search || r.question.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500"><MessageSquareText className="size-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-slate-800">Curated Q&A</h1><p className="text-sm text-slate-500">{q.data?.length ?? 0} Q&A pairs</p></div>
        </div>
        <Button onClick={() => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); }} className="gap-2"><Plus className="size-4" />Add Q&A</Button>
      </div>
      <Card className="border-0 bg-white shadow-sm"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" /><Input placeholder="Search questions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardContent></Card>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">{filtered.length} entries</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No Q&A entries yet.</div> : (
            <div className="divide-y">
              {filtered.map((row) => (
                <div key={row.id} className="flex items-start gap-4 p-5 hover:bg-slate-50/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="capitalize text-xs">{row.category}</Badge>
                      {!row.is_active && <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">Inactive</Badge>}
                    </div>
                    <p className="font-medium text-slate-800 text-sm">{row.question}</p>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{row.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={row.is_active} onCheckedChange={(val) => toggleActive.mutate({ id: row.id, val })} />
                    <button onClick={() => { setEditRow(row); setForm({ question: row.question, answer: row.answer, category: row.category, is_active: row.is_active }); setDialogOpen(true); }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-3.5" /></button>
                    <button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editRow ? "Edit Q&A" : "Add Q&A"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Question *</Label><Textarea rows={3} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter the question..." /></div>
            <div className="space-y-1.5"><Label>Answer *</Label><Textarea rows={5} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Enter the answer..." /></div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="general">General</option><option value="speaking">Speaking</option><option value="reading">Reading</option><option value="writing">Writing</option><option value="listening">Listening</option><option value="pte_tips">PTE Tips</option><option value="scoring">Scoring</option></Select></div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(val) => setForm({ ...form, is_active: val })} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })} disabled={!form.question || !form.answer || saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : editRow ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Q&A?</DialogTitle></DialogHeader><p className="text-sm text-slate-500">This will permanently remove the Q&A pair.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
