import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus, Copy, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase/client";

type PaymentLink = {
  id: string;
  name: string;
  plan: string;
  amount: number;
  currency: string;
  url: string;
  is_active: boolean;
  created_at: string;
};

type FormData = { name: string; plan: string; amount: number; currency: string; url: string; is_active: boolean; };
const emptyForm: FormData = { name: "", plan: "monthly", amount: 9.99, currency: "USD", url: "", is_active: true };

export function AdminPaymentLinksPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<PaymentLink | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  const q = useQuery({
    queryKey: ["admin", "payment-links"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_links").select("id,name,plan,amount,currency,url,is_active,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentLink[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      const payload = { name: data.name, plan: data.plan, amount: data.amount, currency: data.currency, url: data.url, is_active: data.is_active };
      if (data.id) { const { error } = await supabase.from("payment_links").update(payload).eq("id", data.id); if (error) throw error; }
      else { const { error } = await supabase.from("payment_links").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "payment-links"] }); setDialogOpen(false); setEditRow(null); setForm(emptyForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("payment_links").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "payment-links"] }); setDeleteId(null); },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => { const { error } = await supabase.from("payment_links").update({ is_active: val }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "payment-links"] }),
  });

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500"><Link2 className="size-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-slate-800">Payment Links</h1><p className="text-sm text-slate-500">{q.data?.length ?? 0} payment links</p></div>
        </div>
        <Button onClick={() => { setEditRow(null); setForm(emptyForm); setDialogOpen(true); }} className="gap-2"><Plus className="size-4" />Create Link</Button>
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">All Payment Links</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? <div className="p-8 text-center text-sm text-slate-400">Loading…</div> : (q.data?.length ?? 0) === 0 ? <div className="p-8 text-center text-sm text-slate-400">No payment links yet.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left"><th className="px-5 py-3 font-medium text-slate-500">Name</th><th className="px-4 py-3 font-medium text-slate-500">Plan</th><th className="px-4 py-3 font-medium text-slate-500">Amount</th><th className="px-4 py-3 font-medium text-slate-500">Active</th><th className="px-4 py-3 font-medium text-slate-500">Actions</th></tr></thead>
                <tbody>
                  {q.data!.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">{row.name}</td>
                      <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{row.plan}</Badge></td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{row.currency} {row.amount.toFixed(2)}</td>
                      <td className="px-4 py-3"><Switch checked={row.is_active} onCheckedChange={(val) => toggleActive.mutate({ id: row.id, val })} /></td>
                      <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => copyUrl(row.url, row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Copy URL"><Copy className="size-3.5" /></button>{copied === row.id && <span className="text-xs text-green-600">Copied!</span>}<button onClick={() => setDeleteId(row.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-3.5" /></button></div></td>
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
          <DialogHeader><DialogTitle>{editRow ? "Edit Payment Link" : "Create Payment Link"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input placeholder="e.g. Monthly Premium" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Plan</Label><Select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}><option value="monthly">Monthly</option><option value="annual">Annual</option><option value="lifetime">Lifetime</option></Select></div>
              <div className="space-y-1.5"><Label>Amount</Label><Input type="number" min={0} step={0.01} value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Currency</Label><Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}><option value="USD">USD</option><option value="AUD">AUD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Payment URL *</Label><Input placeholder="https://buy.stripe.com/..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(val) => setForm({ ...form, is_active: val })} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editRow?.id })} disabled={!form.name || !form.url || saveMutation.isPending}>{saveMutation.isPending ? "Saving…" : editRow ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Payment Link?</DialogTitle></DialogHeader><p className="text-sm text-slate-500">This will permanently remove the payment link.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Deleting…" : "Delete"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
