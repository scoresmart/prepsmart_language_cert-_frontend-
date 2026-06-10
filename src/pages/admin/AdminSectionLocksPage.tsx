import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";

type SectionLock = {
  id: string;
  section: string;
  is_locked: boolean;
  reason?: string;
  created_at: string;
};

type FormData = { section: string; is_locked: boolean; reason: string; };
const emptyForm: FormData = { section: "speaking", is_locked: true, reason: "" };

export function AdminSectionLocksPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<SectionLock | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "section-locks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("section_locks").select("id,section,is_locked,reason,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SectionLock[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = { section: data.section, is_locked: data.is_locked, reason: data.reason || null };
      if (data.id) { const { error } = await supabase.from("section_locks").update(payload).eq("id", data.id); if (error) throw error; }
      else { const { error } = await supabase.from("section_locks").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "section-locks"] }); setDialogOpen(false); setEditRow(null); setForm(emptyForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("section_locks").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "section-locks"] }); setDeleteId(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500"><Lock className="size-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-slate-800">Section Locks</h1><p className="text-sm text-slate-500">Control which sections are locked for free users</p></div>
        </div>
        <Button onClick={() => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); }} className="gap-2"><Plus className="size-4" />Add Lock</Button>
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">Active Section Locks</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : (q.data?.length ?? 0) === 0 ? <div className="p-8 text-center text-sm text-slate-400">No section locks configured.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">Section</th><th className="px-4 py-3 font-medium text-slate-500">Status</th><th className="px-4 py-3 font-medium text-slate-500">Reason</th><th className="px-4 py-3 font-medium text-slate-500">Actions</th></tr></thead>
                <tbody>
                  {q.data!.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium capitalize text-slate-700">{row.section}</td>
                      <td className="px-4 py-3"><Badge className={row.is_locked ? "bg-red-100 text-red-700 border-0" : "bg-green-100 text-green-700 border-0"}>{row.is_locked ? "Locked" : "Unlocked"}</Badge></td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{row.reason ?? "—"}</td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => { setEditRow(row); setForm({ section: row.section, is_locked: row.is_locked, reason: row.reason ?? "" }); setDialogOpen(true); }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-3.5" /></button><button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editRow ? "Edit Lock" : "Add Section Lock"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Section</Label><Select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}><option value="speaking">Speaking</option><option value="reading">Reading</option><option value="writing">Writing</option><option value="listening">Listening</option><option value="mock_tests">Mock Tests</option></Select></div>
            <div className="space-y-1.5"><Label>Reason (optional)</Label><input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g. Free tier restriction" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="flex items-center gap-3"><Switch checked={form.is_locked} onCheckedChange={(val) => setForm({ ...form, is_locked: val })} /><Label>{form.is_locked ? "Locked" : "Unlocked"}</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : editRow ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Remove Lock?</DialogTitle></DialogHeader><p className="text-sm text-slate-500">This will remove the section lock configuration.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Removing…" : "Remove"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
