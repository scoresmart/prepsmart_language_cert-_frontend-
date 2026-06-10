import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";

type Popup = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  cta_label?: string;
  cta_url?: string;
  created_at: string;
};

type FormData = { title: string; message: string; is_active: boolean; cta_label: string; cta_url: string; };
const emptyForm: FormData = { title: "", message: "", is_active: true, cta_label: "", cta_url: "" };

export function AdminPromotionalPopupsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<Popup | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "promotional-popups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promotional_popups").select("id,title,message,is_active,cta_label,cta_url,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Popup[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = { title: data.title, message: data.message, is_active: data.is_active, cta_label: data.cta_label || null, cta_url: data.cta_url || null };
      if (data.id) { const { error } = await supabase.from("promotional_popups").update(payload).eq("id", data.id); if (error) throw error; }
      else { const { error } = await supabase.from("promotional_popups").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "promotional-popups"] }); setDialogOpen(false); setEditRow(null); setForm(emptyForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("promotional_popups").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "promotional-popups"] }); setDeleteId(null); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => { const { error } = await supabase.from("promotional_popups").update({ is_active: val }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "promotional-popups"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500"><Megaphone className="size-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-slate-800">Promotional Popups</h1><p className="text-sm text-slate-500">{q.data?.length ?? 0} popups configured</p></div>
        </div>
        <Button onClick={() => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); }} className="gap-2"><Plus className="size-4" />Create Popup</Button>
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">All Popups</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : (q.data?.length ?? 0) === 0 ? <div className="p-8 text-center text-sm text-slate-400">No popups yet.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">Title</th><th className="px-4 py-3 font-medium text-slate-500">Message</th><th className="px-4 py-3 font-medium text-slate-500">Active</th><th className="px-4 py-3 font-medium text-slate-500">Actions</th></tr></thead>
                <tbody>
                  {q.data!.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">{row.title}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{row.message}</td>
                      <td className="px-4 py-3"><Switch checked={row.is_active} onCheckedChange={(val) => toggleActive.mutate({ id: row.id, val })} /></td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => { setEditRow(row); setForm({ title: row.title, message: row.message, is_active: row.is_active, cta_label: row.cta_label ?? "", cta_url: row.cta_url ?? "" }); setDialogOpen(true); }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-3.5" /></button><button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button></div></td>
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
          <DialogHeader><DialogTitle>{editRow ? "Edit Popup" : "Create Popup"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Message *</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>CTA Label</Label><Input placeholder="e.g. Upgrade Now" value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>CTA URL</Label><Input placeholder="https://..." value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(val) => setForm({ ...form, is_active: val })} /><Label>Active (shown to users)</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })} disabled={!form.title || !form.message || saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : editRow ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Popup?</DialogTitle></DialogHeader><p className="text-sm text-slate-500">This will permanently remove the popup.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
