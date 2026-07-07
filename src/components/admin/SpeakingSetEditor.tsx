import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AudioUploadDropzone } from "@/components/admin/AudioUploadDropzone";
import { api } from "@/lib/api";
import {
  emptySpeakingSetStructure,
  stripSpeakingAudioRef,
  type SpeakingSet,
  type SpeakingSetPrompt,
  type SpeakingSetStructure,
} from "@/lib/speakingSetStructure";
import { SPEAKING_PART_FOCUS, SPEAKING_PART_TITLES } from "@/lib/speakingInstructions";

type SetForm = {
  title: string;
  level: string;
  sort_order: number;
  is_published: boolean;
  structure: SpeakingSetStructure;
};

type Props = {
  value: SetForm;
  onChange: (value: SetForm) => void;
  disabled?: boolean;
};

function PromptAudioField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <AudioUploadDropzone
        value={value}
        onChange={onChange}
        onUpload={async (file) => {
          const res = await api.speaking.uploadAudio(file);
          return res.data?.path ?? "";
        }}
        disabled={disabled}
      />
    </div>
  );
}

function PromptFields({
  prompt,
  onChange,
  disabled,
  showContent = true,
  contentLabel = "Instructions / situation",
  audioLabel = "Examiner audio",
}: {
  prompt: SpeakingSetPrompt;
  onChange: (p: SpeakingSetPrompt) => void;
  disabled?: boolean;
  showContent?: boolean;
  contentLabel?: string;
  audioLabel?: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Title</Label>
        <Input
          value={prompt.title}
          onChange={(e) => onChange({ ...prompt, title: e.target.value })}
          disabled={disabled}
        />
      </div>
      {showContent && (
        <div className="space-y-1.5">
          <Label className="text-xs">{contentLabel}</Label>
          <Textarea
            rows={4}
            value={prompt.content ?? ""}
            onChange={(e) => onChange({ ...prompt, content: e.target.value })}
            disabled={disabled}
            className="text-xs"
          />
        </div>
      )}
      <PromptAudioField
        label={audioLabel}
        value={prompt.audio_url ?? ""}
        onChange={(path) => onChange({ ...prompt, audio_url: path })}
        disabled={disabled}
      />
    </div>
  );
}

export function SpeakingSetEditor({ value, onChange, disabled }: Props) {
  const { structure } = value;

  const updateStructure = (patch: Partial<SpeakingSetStructure>) => {
    onChange({ ...value, structure: { ...structure, ...patch } });
  };

  const updatePart1 = (index: number, prompt: SpeakingSetPrompt) => {
    const part1 = [...structure.part1];
    part1[index] = prompt;
    updateStructure({ part1 });
  };

  const updatePart2 = (index: number, prompt: SpeakingSetPrompt) => {
    const part2 = [...structure.part2];
    part2[index] = prompt;
    updateStructure({ part2 });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Set title *</Label>
          <Input
            placeholder="e.g. Academic Speaking Set 1"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label>CEFR level</Label>
          <Input
            value={value.level}
            onChange={(e) => onChange({ ...value, level: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Sort order</Label>
          <Input
            type="number"
            value={value.sort_order}
            onChange={(e) => onChange({ ...value, sort_order: parseInt(e.target.value, 10) || 0 })}
            disabled={disabled}
          />
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold text-slate-800">
            Part 1 — {SPEAKING_PART_TITLES["1"]} (5 questions)
          </h3>
          <p className="text-xs text-slate-500">{SPEAKING_PART_FOCUS["1"]}</p>
        </div>
        {structure.part1.map((prompt, i) => (
          <div key={i}>
            <p className="mb-1.5 text-xs font-medium text-slate-600">Question {i + 1}</p>
            <PromptFields
              prompt={prompt}
              onChange={(p) => updatePart1(i, p)}
              disabled={disabled}
              contentLabel="Examiner question (shown to student)"
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold text-slate-800">
            Part 2 — {SPEAKING_PART_TITLES["2"]} (2 role plays)
          </h3>
          <p className="text-xs text-slate-500">{SPEAKING_PART_FOCUS["2"]}</p>
        </div>
        {structure.part2.map((prompt, i) => (
          <div key={i}>
            <p className="mb-1.5 text-xs font-medium text-slate-600">Role play {i + 1}</p>
            <PromptFields
              prompt={prompt}
              onChange={(p) => updatePart2(i, p)}
              disabled={disabled}
              contentLabel="Role play situation (shown to student)"
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold text-slate-800">Part 3 — {SPEAKING_PART_TITLES["3"]}</h3>
          <p className="text-xs text-slate-500">{SPEAKING_PART_FOCUS["3"]}</p>
        </div>
        <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/40 p-3">
          <p className="text-xs font-semibold text-violet-900">Read aloud</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Read-aloud text * (shown to student)</Label>
            <Textarea
              rows={5}
              value={structure.part3.readAloud.read_text}
              onChange={(e) =>
                updateStructure({
                  part3: {
                    ...structure.part3,
                    readAloud: { ...structure.part3.readAloud, read_text: e.target.value },
                  },
                })
              }
              disabled={disabled}
              className="text-xs"
            />
          </div>
          <PromptFields
            prompt={structure.part3.readAloud}
            onChange={(p) =>
              updateStructure({
                part3: { ...structure.part3, readAloud: { ...p, read_text: structure.part3.readAloud.read_text } },
              })
            }
            disabled={disabled}
            showContent
            contentLabel="Examiner instructions"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700">Follow-up questions (shown to student)</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            disabled={disabled}
            onClick={() =>
              updateStructure({
                part3: {
                  ...structure.part3,
                  followUps: [
                    ...structure.part3.followUps,
                    { title: `Follow-up ${structure.part3.followUps.length + 1}`, content: "", audio_url: null },
                  ],
                },
              })
            }
          >
            <Plus className="size-3" /> Add follow-up
          </Button>
        </div>
        {structure.part3.followUps.map((prompt, i) => (
          <div key={i} className="relative">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">Follow-up {i + 1}</p>
              {structure.part3.followUps.length > 1 && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const followUps = structure.part3.followUps.filter((_, idx) => idx !== i);
                    updateStructure({ part3: { ...structure.part3, followUps } });
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            <PromptFields
              prompt={prompt}
              onChange={(p) => {
                const followUps = [...structure.part3.followUps];
                followUps[i] = p;
                updateStructure({ part3: { ...structure.part3, followUps } });
              }}
              disabled={disabled}
              contentLabel="Follow-up question (shown to student)"
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold text-slate-800">Part 4 — {SPEAKING_PART_TITLES["4"]}</h3>
          <p className="text-xs text-slate-500">{SPEAKING_PART_FOCUS["4"]}</p>
        </div>
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
          <p className="text-xs font-semibold text-amber-900">Presentation</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Presentation topic (shown to student)</Label>
            <Input
              value={structure.part4.presentation.topic ?? ""}
              onChange={(e) =>
                updateStructure({
                  part4: {
                    ...structure.part4,
                    presentation: { ...structure.part4.presentation, topic: e.target.value },
                  },
                })
              }
              disabled={disabled}
            />
          </div>
          <PromptFields
            prompt={structure.part4.presentation}
            onChange={(p) =>
              updateStructure({
                part4: {
                  ...structure.part4,
                  presentation: { ...p, topic: structure.part4.presentation.topic },
                },
              })
            }
            disabled={disabled}
            contentLabel="Structure / outline (shown to student)"
          />
        </div>

        <p className="text-xs font-semibold text-slate-700">Follow-up questions (2 required, shown to student)</p>
        {structure.part4.followUps.map((prompt, i) => (
          <div key={i}>
            <p className="mb-1.5 text-xs font-medium text-slate-600">Follow-up {i + 1}</p>
            <PromptFields
              prompt={prompt}
              onChange={(p) => {
                const followUps = [...structure.part4.followUps] as [SpeakingSetPrompt, SpeakingSetPrompt];
                followUps[i] = p;
                updateStructure({ part4: { ...structure.part4, followUps } });
              }}
              disabled={disabled}
              contentLabel="Follow-up question (shown to student)"
            />
          </div>
        ))}
      </section>
    </div>
  );
}

export function speakingSetToForm(set?: SpeakingSet | null): SetForm {
  if (!set) {
    return {
      title: "",
      level: "B1",
      sort_order: 0,
      is_published: false,
      structure: emptySpeakingSetStructure(),
    };
  }

  const structure = JSON.parse(JSON.stringify(set.structure)) as SpeakingSetStructure;
  const strip = (p: SpeakingSetPrompt) => ({
    ...p,
    audio_url: stripSpeakingAudioRef(p.audio_url ?? ""),
  });

  return {
    title: set.title,
    level: set.level,
    sort_order: set.sort_order,
    is_published: set.is_published,
    structure: {
      part1: structure.part1.map(strip),
      part2: structure.part2.map(strip),
      part3: {
        readAloud: {
          ...strip(structure.part3.readAloud),
          read_text: structure.part3.readAloud.read_text ?? "",
        },
        followUps: structure.part3.followUps.map(strip),
      },
      part4: {
        presentation: strip(structure.part4.presentation),
        followUps: structure.part4.followUps.map(strip) as [SpeakingSetPrompt, SpeakingSetPrompt],
      },
    },
  };
}
