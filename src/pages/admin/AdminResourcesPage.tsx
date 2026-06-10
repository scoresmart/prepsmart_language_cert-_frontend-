import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";

type Resource = {
  id: string;
  title: string;
  type: string;
  category: string;
  url?: string;
  created_at: string;
  description?: string;
};

type FormData = { title: string; type: string; category: string; url: string; description: string; };
const emptyForm: FormData = { title: "", type: "pdf", category: "general", url: "", description: "" };

export function AdminResourcesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<Resource | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id,title,type,category,url,created_at,description")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Resource[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = { title: data.title, type: data.type, category: data.category, url: data.url || null, description: data.description || null };
      if (data.id) { const { error } = await supabase.from("resources").update(payload).eq("id", data.id); if (error) throw error; }
      else { const { error } = await supabase.from("resources").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "resources"] }); setDialogOpen(false); setEditRow(null); setForm(emptyForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("resources").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "resources"] }); setDeleteId(null); },
  });

  const filtered = (q.data ?? []).filter((r) => !search || r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500"><Layers className="size-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-slate-800">Resources</h1><p className="text-sm text-slate-500">{q.data?.length ?? 0} resources</p></div>
        </div>
        <Button onClick={() => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); }} className="gap-2"><Plus className="size-4" />Add Resource</Button>
      </div>
      <Card className="border-0 bg-white shadow-sm"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" /><Input placeholder="Search resources..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardContent></Card>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">{filtered.length} resource{filtered.length !== 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No resources yet.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">Title</th><th className="px-4 py-3 font-medium text-slate-500">Type</th><th className="px-4 py-3 font-medium text-slate-500">Category</th><th className="px-4 py-3 font-medium text-slate-500">Actions</th></tr></thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">{row.title}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{row.type}</Badge></td>
                      <td className="px-4 py-3 capitalize text-slate-600">{row.category}</td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => { setEditRow(row); setForm({ title: row.title, type: row.type, category: row.category, url: row.url ?? "", description: row.description ?? "" }); setDialogOpen(true); }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-3.5" /></button><button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button></div></td>
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
          <DialogHeader><DialogTitle>{editRow ? "Edit Resource" : "Add Resource"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="pdf">PDF</option><option value="video">Video</option><option value="audio">Audio</option><option value="link">Link</option></Select></div>
              <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="general">General</option><option value="speaking">Speaking</option><option value="reading">Reading</option><option value="writing">Writing</option><option value="listening">Listening</option></Select></div>
            </div>
            <div className="space-y-1.5"><Label>URL</Label><Input placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })} disabled={!form.title || saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : editRow ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Resource?</DialogTitle></DialogHeader><p className="text-sm text-slate-500">This cannot be undone.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
