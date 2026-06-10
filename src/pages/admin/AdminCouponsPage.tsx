import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses?: number;
  uses_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
};

type FormData = { code: string; discount_type: string; discount_value: number; max_uses: number; is_active: boolean; expires_at: string; };
const emptyForm: FormData = { code: "", discount_type: "percentage", discount_value: 10, max_uses: 0, is_active: true, expires_at: "" };

export function AdminCouponsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<Coupon | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("id,code,discount_type,discount_value,max_uses,uses_count,is_active,expires_at,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = { code: data.code.toUpperCase(), discount_type: data.discount_type, discount_value: data.discount_value, max_uses: data.max_uses || null, is_active: data.is_active, expires_at: data.expires_at || null };
      if (data.id) { const { error } = await supabase.from("coupons").update(payload).eq("id", data.id); if (error) throw error; }
      else { const { error } = await supabase.from("coupons").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "coupons"] }); setDialogOpen(false); setEditRow(null); setForm(emptyForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("coupons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "coupons"] }); setDeleteId(null); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => { const { error } = await supabase.from("coupons").update({ is_active: val }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500"><Tag className="size-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-slate-800">Coupons</h1><p className="text-sm text-slate-500">{q.data?.length ?? 0} coupons</p></div>
        </div>
        <Button onClick={() => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); }} className="gap-2"><Plus className="size-4" />Create Coupon</Button>
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">All Coupons</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : (q.data?.length ?? 0) === 0 ? <div className="p-8 text-center text-sm text-slate-400">No coupons yet.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">Code</th><th className="px-4 py-3 font-medium text-slate-500">Discount</th><th className="px-4 py-3 font-medium text-slate-500">Uses</th><th className="px-4 py-3 font-medium text-slate-500">Expires</th><th className="px-4 py-3 font-medium text-slate-500">Active</th><th className="px-4 py-3 font-medium text-slate-500">Actions</th></tr></thead>
                <tbody>
                  {q.data!.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-800">{row.code}</td>
                      <td className="px-4 py-3 text-slate-700">{row.discount_value}{row.discount_type === "percentage" ? "%" : " flat"}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{row.uses_count}{row.max_uses ? ` / ${row.max_uses}` : ""}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{row.expires_at ? new Date(row.expires_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3"><Switch checked={row.is_active} onCheckedChange={(val) => toggleActive.mutate({ id: row.id, val })} /></td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => { setEditRow(row); setForm({ code: row.code, discount_type: row.discount_type, discount_value: row.discount_value, max_uses: row.max_uses ?? 0, is_active: row.is_active, expires_at: row.expires_at ? row.expires_at.slice(0, 10) : "" }); setDialogOpen(true); }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="size-3.5" /></button><button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button></div></td>
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
          <DialogHeader><DialogTitle>{editRow ? "Edit Coupon" : "Create Coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Coupon Code *</Label><Input placeholder="e.g. SAVE20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="font-mono" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Discount Type</Label><Select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}><option value="percentage">Percentage (%)</option><option value="flat">Flat Amount</option></Select></div>
              <div className="space-y-1.5"><Label>Discount Value</Label><Input type="number" min={1} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Max Uses (0 = unlimited)</Label><Input type="number" min={0} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Expires At</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(val) => setForm({ ...form, is_active: val })} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })} disabled={!form.code || saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : editRow ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Coupon?</DialogTitle></DialogHeader><p className="text-sm text-slate-500">This will permanently remove the coupon code.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
