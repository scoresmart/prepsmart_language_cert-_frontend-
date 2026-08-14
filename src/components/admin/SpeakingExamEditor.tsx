import * as React from "react";

import { ImagePlus, Loader2, Trash2, Info } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import {
  EXAM_TIMING,
  PART1_QUESTION_COUNT,
  PART2_SITUATION_COUNT,
  type SpeakingExamStructure,
} from "@/lib/speakingExamStructure";
import {
  SPEAKING_IMAGE_BUCKET as IMAGE_BUCKET,
  speakingImagePublicUrl,
  type ExamSetForm,
} from "@/lib/speakingExamForm";

// ---------------------------------------------------------------- pieces

function PartCard({
  part,
  title,
  minutes,
  children,
}: {
  part: number;
  title: string;
  minutes: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
          {part}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{minutes}</p>
        </div>
      </header>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </section>
  );
}

function ExaminerLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
      <span>
        <span className="font-medium text-slate-700">The examiner says this automatically: </span>
        {children}
      </span>
    </p>
  );
}

function ImageField({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (ref: string | null) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const preview = speakingImagePublicUrl(value);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `speaking-part3/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      onChange(path);
      toast.success("Picture uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>Picture the candidate describes</Label>
      {preview ? (
        <div className="relative overflow-hidden rounded-lg border border-slate-200">
          <img src={preview} alt="Part 3 prompt" className="max-h-56 w-full object-contain bg-slate-50" />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-slate-500 shadow-sm hover:text-red-600"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-100 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          {uploading ? "Uploading…" : "Upload a picture (PNG or JPG, max 5 MB)"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------- editor

type Props = {
  value: ExamSetForm;
  onChange: (next: ExamSetForm) => void;
  disabled?: boolean;
};

export function SpeakingExamEditor({ value, onChange, disabled }: Props) {
  const s = value.structure;

  const patch = (fn: (draft: SpeakingExamStructure) => SpeakingExamStructure) =>
    onChange({ ...value, structure: fn(s) });

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------ set meta */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="set-title">Set title</Label>
          <Input
            id="set-title"
            value={value.title}
            disabled={disabled}
            placeholder="e.g. Set 6 — Technology"
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="set-level">Level</Label>
          <select
            id="set-level"
            value={value.level}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, level: e.target.value })}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
        You provide the content only. The examiner's own wording, the timings and the follow-up questions it
        asks about your picture and topic are handled automatically, so every set runs the same exam.
      </p>

      {/* --------------------------------------------------------- part 1 */}
      <PartCard part={1} title="Questions about the candidate" minutes="1 min 30 sec · 5 questions">
        <ExaminerLine>
          “{s.part1.opening_questions.join("” … “")}” then “{s.part1.transition}”
        </ExaminerLine>

        {s.part1.questions.map((q, i) => (
          <div key={i}>
            <Label htmlFor={`p1-${i}`}>Question {i + 1}</Label>
            <Input
              id={`p1-${i}`}
              value={q}
              disabled={disabled}
              placeholder={
                ["Do you work or study?", "What do you do in your free time?", "Tell me about your hometown.", "How do you usually get to work or college?", "What would you like to do in the future?"][i] ??
                "Enter a question"
              }
              onChange={(e) =>
                patch((d) => ({
                  ...d,
                  part1: {
                    ...d.part1,
                    questions: d.part1.questions.map((x, xi) => (xi === i ? e.target.value : x)),
                  },
                }))
              }
            />
          </div>
        ))}
        <p className="text-xs text-slate-400">
          {PART1_QUESTION_COUNT} questions, about {Math.round(EXAM_TIMING.part1Total / PART1_QUESTION_COUNT)} seconds each.
        </p>
      </PartCard>

      {/* --------------------------------------------------------- part 2 */}
      <PartCard part={2} title="Role play situations" minutes="1 min per situation · 2 situations">
        <ExaminerLine>“{s.part2.intro}”</ExaminerLine>

        {s.part2.situations.map((sit, i) => (
          <div key={i}>
            <Label htmlFor={`p2-${i}`}>Situation {i + 1}</Label>
            <Textarea
              id={`p2-${i}`}
              rows={3}
              value={sit.text}
              disabled={disabled}
              placeholder={
                i === 0
                  ? "I am your teacher. You could not submit your assignment on time. Explain why and ask me for an extension. You may start now."
                  : "I am your neighbour. You want to borrow something from me. Ask me politely and explain why you need it. You may start now."
              }
              onChange={(e) =>
                patch((d) => ({
                  ...d,
                  part2: {
                    ...d.part2,
                    situations: d.part2.situations.map((x, xi) =>
                      xi === i ? { ...x, text: e.target.value } : x,
                    ),
                  },
                }))
              }
            />
            <p className="mt-1 text-xs text-slate-400">
              Write it as the examiner will read it, including the role it plays. It stays in character and
              asks its own questions for the full minute.
            </p>
          </div>
        ))}
        <p className="text-xs text-slate-400">{PART2_SITUATION_COUNT} situations required.</p>
      </PartCard>

      {/* --------------------------------------------------------- part 3 */}
      <PartCard
        part={3}
        title="Picture description"
        minutes={`${s.part3.prepare_seconds}s to prepare · 1 min 30 sec speaking`}
      >
        <ExaminerLine>“{s.part3.intro}”</ExaminerLine>

        <ImageField
          value={s.part3.image_url}
          disabled={disabled}
          onChange={(ref) => patch((d) => ({ ...d, part3: { ...d.part3, image_url: ref } }))}
        />

        <div>
          <Label htmlFor="p3-title">Picture title</Label>
          <Input
            id="p3-title"
            value={s.part3.image_title}
            disabled={disabled}
            placeholder="e.g. A busy railway station"
            onChange={(e) => patch((d) => ({ ...d, part3: { ...d.part3, image_title: e.target.value } }))}
          />
        </div>

        <div>
          <Label htmlFor="p3-idea">Idea of the picture</Label>
          <Textarea
            id="p3-idea"
            rows={3}
            value={s.part3.image_idea}
            disabled={disabled}
            placeholder="Commuters waiting on a crowded platform early in the morning. Some are reading, others are checking their phones. It suggests daily routine, city life and public transport."
            onChange={(e) => patch((d) => ({ ...d, part3: { ...d.part3, image_idea: e.target.value } }))}
          />
          <p className="mt-1 text-xs text-slate-400">
            The examiner cannot see the picture — it uses this description to ask its{" "}
            {s.part3.question_count} follow-up questions. Be specific about what is happening and the themes
            it raises.
          </p>
        </div>
      </PartCard>

      {/* --------------------------------------------------------- part 4 */}
      <PartCard
        part={4}
        title="Talk on a topic"
        minutes={`${s.part4.prepare_seconds}s to prepare · 2 min speaking`}
      >
        <ExaminerLine>“{s.part4.intro}”</ExaminerLine>

        <div>
          <Label htmlFor="p4-topic">Topic</Label>
          <Textarea
            id="p4-topic"
            rows={2}
            value={s.part4.topic}
            disabled={disabled}
            placeholder="A skill you would like to learn, and why it interests you."
            onChange={(e) => patch((d) => ({ ...d, part4: { ...d.part4, topic: e.target.value } }))}
          />
          <p className="mt-1 text-xs text-slate-400">
            The candidate talks for {s.part4.present_seconds} seconds, then the examiner asks{" "}
            {s.part4.followup_count} follow-up questions it creates from this topic and from what the
            candidate actually said.
          </p>
        </div>
      </PartCard>

      <div className={cn("rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600")}>
        Closing: “{s.ending}”
      </div>
    </div>
  );
}
