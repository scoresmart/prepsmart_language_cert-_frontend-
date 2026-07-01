import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { BookOpenCheck, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

type PracticeQuestionRow = {
  id: string;
  module: "speaking" | "reading" | "writing" | "listening";
  title: string;
  subtype: string;
  detail: string;
  status: string;
  created_at: string;
  manageUrl: string;
};

const MODULE_BADGE: Record<string, string> = {
  speaking: "bg-blue-100 text-blue-700",
  reading: "bg-green-100 text-green-700",
  writing: "bg-purple-100 text-purple-700",
  listening: "bg-orange-100 text-orange-700",
};

async function fetchAllPracticeQuestions(): Promise<PracticeQuestionRow[]> {
  const [speakingRes, writingRes, readingRes, listeningRes] = await Promise.all([
    api.speaking.listAll(),
    api.writing.list(),
    api.reading.list({ limit: 500 }),
    api.listening.list({ limit: 500 }),
  ]);

  const rows: PracticeQuestionRow[] = [];

  for (const q of speakingRes.data ?? []) {
    rows.push({
      id: q.id,
      module: "speaking",
      title: q.title,
      subtype: `Part ${q.part_number} · ${q.task_type.replace(/_/g, " ")}`,
      detail: q.level,
      status: q.is_published ? "Published" : "Draft",
      created_at: q.created_at,
      manageUrl: "/admin/speaking",
    });
  }

  for (const q of writingRes.data ?? []) {
    const preview = q.question_text.replace(/\s+/g, " ").trim().slice(0, 80);
    rows.push({
      id: q.id,
      module: "writing",
      title: preview + (q.question_text.length > 80 ? "…" : ""),
      subtype: q.task_type === "task1" ? "Task 1" : "Task 2",
      detail: q.image_path ? "With image" : "Text only",
      status: "Active",
      created_at: q.created_at,
      manageUrl: "/admin/writing",
    });
  }

  for (const q of readingRes.data?.questions ?? []) {
    rows.push({
      id: q.id,
      module: "reading",
      title: q.title,
      subtype: q.part_type.replace(/part/i, "Part "),
      detail: `${Array.isArray(q.questions) ? q.questions.length : 0} questions`,
      status: q.is_active ? "Active" : "Inactive",
      created_at: q.created_at,
      manageUrl: "/admin/reading",
    });
  }

  for (const q of listeningRes.data?.questions ?? []) {
    const subCount = Array.isArray(q.questions) ? q.questions.length : 0;
    rows.push({
      id: q.id,
      module: "listening",
      title: `Listening Part ${q.part_number} set`,
      subtype: `Part ${q.part_number}`,
      detail: `${subCount} sub-questions`,
      status: q.audio_path ? "With audio" : "No audio",
      created_at: q.created_at,
      manageUrl: "/admin/listening",
    });
  }

  return rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function AdminQuestionsPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const q = useQuery({
    queryKey: ["admin", "practice-questions"],
    queryFn: fetchAllPracticeQuestions,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (q.data ?? []).filter((row) => {
      if (moduleFilter !== "all" && row.module !== moduleFilter) return false;
      if (!term) return true;
      return [row.title, row.subtype, row.detail, row.module, row.status]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [q.data, search, moduleFilter]);

  const counts = useMemo(() => {
    const all = q.data ?? [];
    return {
      total: all.length,
      speaking: all.filter((r) => r.module === "speaking").length,
      reading: all.filter((r) => r.module === "reading").length,
      writing: all.filter((r) => r.module === "writing").length,
      listening: all.filter((r) => r.module === "listening").length,
    };
  }, [q.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
          <BookOpenCheck className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Practice Questions</h1>
          <p className="text-sm text-slate-500">
            {counts.total} question sets across Speaking, Reading, Writing, and Listening
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["speaking", "reading", "writing", "listening"] as const).map((mod) => (
          <Card key={mod} className="border-0 bg-white shadow-sm">
            <CardContent className="px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{mod}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">{counts[mod]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by title, part, or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-white"
        />
        <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="w-full sm:w-44 bg-white">
          <option value="all">All modules</option>
          <option value="speaking">Speaking</option>
          <option value="reading">Reading</option>
          <option value="writing">Writing</option>
          <option value="listening">Listening</option>
        </Select>
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="text-sm font-semibold text-slate-600">All practice question sets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : q.isError ? (
            <div className="p-8 text-center text-sm text-rose-500">Failed to load practice questions.</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No practice questions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-5 py-3 font-medium text-slate-500">Module</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Title</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Type</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Details</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Created</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={`${row.module}-${row.id}`} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${MODULE_BADGE[row.module]}`}>
                          {row.module}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-slate-800 truncate">{row.title}</p>
                        <p className="text-xs text-slate-400 font-mono">{row.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.subtype}</td>
                      <td className="px-4 py-3 text-slate-600">{row.detail}</td>
                      <td className="px-4 py-3 text-slate-600">{row.status}</td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums text-xs">
                        {format(new Date(row.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={row.manageUrl}
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Open
                          <ExternalLink className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
