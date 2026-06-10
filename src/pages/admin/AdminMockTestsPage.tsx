import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FileText, Search } from "lucide-react";
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

type MockTest = {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
  is_published: boolean;
  created_at: string;
  description?: string;
};

type FormData = { title: string; status: string; duration_minutes: number; is_published: boolean; description: string; };
const emptyForm: FormData = { title: "", status: "draft", duration_minutes: 120, is_published: false, description: "" };

export function AdminMockTestsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<MockTest | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "mock-tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("id,title,status,duration_minutes,is_published,created_at,description")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MockTest[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = { title: data.title, status: data.status, duration_minutes: data.duration_minutes, is_published: data.is_published, description: data.description || null };
      if (data.id) {
        const { error } = await supabase.from("mock_tests").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mock_tests").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "mock-tests"] }); setDialogOpen(false); setEditRow(null); setForm(emptyForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("mock_tests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "mock-tests"] }); setDeleteId(null); },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => { const { error } = await supabase.from("mock_tests").update({ is_published: val }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "mock-tests"] }),
  });

  const openAdd = () => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (row: MockTest) => {
    setEditRow(row);
    setForm({ title: row.title, status: row.status, duration_minutes: row.duration_minutes, is_published: row.is_published, description: row.description ?? "" });
    setDialogOpen(true);
  };

  const filtered = (q.data ?? []).filter((r) => !search || r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
            <FileText className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Mock Tests</h1>
            <p className="text-sm text-slate-500">{q.data?.length ?? 0} tests total</p>
          </div>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="size-4" />Create Mock Test</Button>
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" /><Input placeholder="Search tests..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        </CardContent>
      </Card>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">{filtered.length} mock test{filtered.length !== 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">No mock tests yet.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">Title</th><th className="px-4 py-3 font-medium text-slate-500">Status</th><th className="px-4 py-3 font-medium text-slate-500">Duration</th><th className="px-4 py-3 font-medium text-slate-500">Published</th><th className="px-4 py-3 font-medium text-slate-500">Actions</th></tr></thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">{row.title}</td>
                      <td className="px-4 py-3"><Badge variant={row.status === "published" ? "default" : "secondary"}>{row.status}</Badge></td>
                      <td className="px-4 py-3 text-slate-600">{row.duration_minutes} min</td>
                      <td className="px-4 py-3"><Switch checked={row.is_published} onCheckedChange={(val) => togglePublish.mutate({ id: row.id, val })} /></td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => openEdit(row)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-3.5" /></button><button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button></div></td>
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
          <DialogHeader><DialogTitle>{editRow ? "Edit Mock Test" : "Create Mock Test"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input placeholder="Mock Test title..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></div>
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" min={1} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 120 })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="Test description..." rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center gap-3"><Switch checked={form.is_published} onCheckedChange={(val) => setForm({ ...form, is_published: val })} /><Label>Published</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })} disabled={!form.title || saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : editRow ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Mock Test?</DialogTitle></DialogHeader><p className="text-sm text-slate-500">This will permanently remove the test and all associated data.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
