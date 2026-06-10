import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminSectionalTestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500">
          <ClipboardList className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Sectional Tests</h1>
          <p className="text-sm text-slate-500">Manage tests by individual sections (Speaking, Reading, Writing, Listening)</p>
        </div>
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader><CardTitle className="text-base">Sectional Tests</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Sectional test management coming soon. This module will allow creating targeted practice tests for individual PTE sections.</p>
        </CardContent>
      </Card>
    </div>
  );
}
