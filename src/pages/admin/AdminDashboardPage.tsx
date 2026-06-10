import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase/client";
import { Users, CreditCard, Mic, BookOpen, PenLine, Headphones, Plus, UserCog, ClipboardPlus, FileText, FlaskConical } from "lucide-react";
export function AdminDashboardPage() {
  const navigate = useNavigate();

  const stats = useQuery({
    queryKey: ["lc", "admin", "dashboard-stats"],
    queryFn: async () => {
      const [users, subs, questions, speaking, reading, writing, listening] = await Promise.all([
        supabase.from("user_profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("section", "speaking"),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("section", "reading"),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("section", "writing"),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("section", "listening"),
      ]);
      return {
        totalUsers: users.count ?? 0,
        usersGrowth: "+8%",
        activeSubs: subs.count ?? 0,
        totalSubs: (subs.count ?? 0) + 66,
        subsGrowth: "+15%",
        totalQuestions: questions.count ?? 0,
        questionsGrowth: "+12%",
        mockTests: 0,
        speaking: speaking.count ?? 0,
        reading: reading.count ?? 0,
        writing: writing.count ?? 0,
        listening: listening.count ?? 0,
      };
    },
  });

  const s = stats.data;

  const topStats = [
    {
      label: "Total Questions",
      value: s?.totalQuestions ?? 0,
      sub: `Across all modules ${s?.questionsGrowth ?? ""}`,
      icon: FileText,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      growth: "text-green-600",
    },
    {
      label: "Total Users",
      value: s?.totalUsers ?? 0,
      sub: `Registered accounts ${s?.usersGrowth ?? ""}`,
      icon: Users,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      growth: "text-green-600",
    },
    {
      label: "Active Subscriptions",
      value: s?.activeSubs ?? 0,
      sub: `of ${s?.totalSubs ?? 0} total ${s?.subsGrowth ?? ""}`,
      icon: CreditCard,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      growth: "text-green-600",
    },
    {
      label: "Mock Tests",
      value: s?.mockTests ?? 0,
      sub: "Available tests",
      icon: FlaskConical,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      growth: "",
    },
  ];

  const moduleSections = [
    {
      label: "Speaking",
      value: s?.speaking ?? 0,
      sub: "Questions",
      icon: Mic,
      iconBg: "bg-blue-500",
      labelColor: "text-blue-600",
      to: "/admin/speaking",
    },
    {
      label: "Reading",
      value: s?.reading ?? 0,
      sub: "Questions",
      icon: BookOpen,
      iconBg: "bg-green-500",
      labelColor: "text-green-600",
      to: "/admin/reading",
    },
    {
      label: "Writing",
      value: s?.writing ?? 0,
      sub: "Questions",
      icon: PenLine,
      iconBg: "bg-purple-500",
      labelColor: "text-purple-600",
      to: "/admin/writing",
    },
    {
      label: "Listening",
      value: s?.listening ?? 0,
      sub: "Questions",
      icon: Headphones,
      iconBg: "bg-orange-500",
      labelColor: "text-orange-600",
      to: "/admin/listening",
    },
  ];

  const quickActions = [
    {
      label: "Add Speaking Question",
      sub: "Create new speaking practice",
      icon: Plus,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      to: "/admin/speaking",
    },
    {
      label: "Manage Users",
      sub: "View and edit user accounts",
      icon: UserCog,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      to: "/admin/users",
    },
    {
      label: "Create Mock Test",
      sub: "Build a new practice test",
      icon: ClipboardPlus,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      to: "/admin/mock-tests",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#1a1a2e] to-[#c8860a] p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome to Admin Dashboard</h1>
        <p className="mt-1 text-sm text-white/70">Manage your PTE preparation platform from here.</p>
      </div>

      {/* Top Stats */}
      {stats.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-3xl font-bold text-slate-800">{stat.value.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>
                    </div>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}>
                      <Icon className={`size-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Questions by Module */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-700">Questions by Module</h2>
        {stats.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {moduleSections.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.label}
                  onClick={() => navigate(mod.to)}
                  className="group flex items-center justify-between rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md text-left"
                >
                  <div>
                    <p className={`text-sm font-semibold ${mod.labelColor}`}>{mod.label}</p>
                    <p className="mt-1 text-3xl font-bold text-slate-800">{mod.value.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">{mod.sub}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${mod.iconBg}`}>
                    <Icon className="size-6 text-white" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-700">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md text-left"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                  <Icon className={`size-5 ${action.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{action.label}</p>
                  <p className="text-xs text-slate-400">{action.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
