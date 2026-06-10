import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";

type ImportResult = { success: number; failed: number; errors: string[] };

export function AdminBulkImportPage() {
  const qc = useQueryClient();
  const [section, setSection] = React.useState("speaking");
  const [jsonText, setJsonText] = React.useState("");
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [parseError, setParseError] = React.useState("");

  const importMutation = useMutation({
    mutationFn: async ({ section, questions }: { section: string; questions: object[] }) => {
      const rows = questions.map((q) => ({ ...(q as Record<string, unknown>), section }));
      const { data, error } = await supabase.from("questions").insert(rows).select("id");
      if (error) throw error;
      return { success: data?.length ?? 0, failed: 0, errors: [] } as ImportResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setJsonText("");
      qc.invalidateQueries({ queryKey: ["admin", `${section}-questions`] });
      qc.invalidateQueries({ queryKey: ["lc", "admin", "dashboard-stats"] });
    },
    onError: (err) => {
      setResult({ success: 0, failed: 1, errors: [(err as Error).message] });
    },
  });

  const handleImport = () => {
    setParseError("");
    setResult(null);
    try {
      const parsed = JSON.parse(jsonText);
      const questions = Array.isArray(parsed) ? parsed : [parsed];
      if (questions.length === 0) { setParseError("No questions found in JSON."); return; }
      importMutation.mutate({ section, questions });
    } catch {
      setParseError("Invalid JSON. Please check your format.");
    }
  };

  const sampleJSON = JSON.stringify([
    { title: "Read Aloud - Example", type: "read_aloud", level: "medium", max_score: 5, is_published: false, content: "The passage to read aloud goes here." },
    { title: "Repeat Sentence - Example", type: "repeat_sentence", level: "easy", max_score: 3, is_published: false, audio_url: "https://example.com/audio.mp3" },
  ], null, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500"><Upload className="size-5 text-white" /></div>
        <div><h1 className="text-xl font-bold text-slate-800">Bulk Import</h1><p className="text-sm text-slate-500">Import multiple questions at once using JSON format</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600">Import Questions</CardTitle></CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Target Section</Label>
              <Select value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="speaking">Speaking</option>
                <option value="reading">Reading</option>
                <option value="writing">Writing</option>
                <option value="listening">Listening</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>JSON Data</Label>
              <Textarea
                rows={12}
                placeholder={`Paste your JSON array here...\n\nExample:\n${sampleJSON.slice(0, 100)}...`}
                value={jsonText}
                onChange={(e) => { setJsonText(e.target.value); setParseError(""); setResult(null); }}
                className="font-mono text-xs"
              />
            </div>
            {parseError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="size-4 shrink-0" />{parseError}
              </div>
            )}
            {result && (
              <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${result.failed > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                <CheckCircle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{result.success} question{result.success !== 1 ? "s" : ""} imported successfully.</p>
                  {result.errors.length > 0 && <ul className="mt-1 list-disc list-inside text-xs">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
                </div>
              </div>
            )}
            <Button onClick={handleImport} disabled={!jsonText.trim() || importMutation.isPending} className="w-full gap-2">
              <Upload className="size-4" />{importMutation.isPending ? "Importing…" : "Import Questions"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b px-5 py-4"><CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2"><FileText className="size-4" />JSON Format Reference</CardTitle></CardHeader>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-3">Each question object should include these fields:</p>
            <div className="space-y-2 text-xs">
              {[
                { field: "title", type: "string", req: true, desc: "Question title/name" },
                { field: "type", type: "string", req: true, desc: "Question sub-type (e.g. read_aloud)" },
                { field: "level", type: "string", req: false, desc: "easy | medium | hard" },
                { field: "max_score", type: "number", req: false, desc: "Maximum possible score" },
                { field: "is_published", type: "boolean", req: false, desc: "Visible to students?" },
                { field: "content", type: "string", req: false, desc: "Passage or text content" },
                { field: "audio_url", type: "string", req: false, desc: "URL to audio file" },
                { field: "image_url", type: "string", req: false, desc: "URL to image file" },
                { field: "options", type: "string", req: false, desc: "Answer options (one per line)" },
                { field: "correct_answer", type: "string", req: false, desc: "Correct answer text" },
              ].map(({ field, type, req, desc }) => (
                <div key={field} className="flex items-start gap-2">
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 min-w-[130px]">{field}</code>
                  <span className="text-slate-400 min-w-[60px]">{type}</span>
                  {req && <span className="text-red-400">*req</span>}
                  <span className="text-slate-500">{desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Sample JSON:</p>
              <pre className="bg-slate-50 p-3 rounded-lg text-[10px] text-slate-600 overflow-x-auto">{sampleJSON}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
