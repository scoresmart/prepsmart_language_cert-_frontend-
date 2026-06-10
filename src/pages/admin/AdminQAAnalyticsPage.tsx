import { PieChart, TrendingUp, MessageSquare, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminQAAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500"><PieChart className="size-5 text-white" /></div>
        <div><h1 className="text-xl font-bold text-slate-800">Q&A Analytics</h1><p className="text-sm text-slate-500">AI Tutor Q&A performance and engagement metrics</p></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Questions", value: "—", icon: MessageSquare, bg: "bg-sky-50", color: "text-sky-500" },
          { label: "Avg. Response Time", value: "—", icon: TrendingUp, bg: "bg-green-50", color: "text-green-500" },
          { label: "Satisfaction Rate", value: "—", icon: Star, bg: "bg-yellow-50", color: "text-yellow-500" },
          { label: "Unanswered", value: "—", icon: PieChart, bg: "bg-red-50", color: "text-red-500" },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="border-0 bg-white shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}><Icon className={`size-5 ${color}`} /></div>
              <div><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-800">{value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader><CardTitle className="text-base">Q&A Analytics Dashboard</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Detailed analytics for Q&A interactions including topic trends, satisfaction scores, common questions, and response quality metrics are under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
