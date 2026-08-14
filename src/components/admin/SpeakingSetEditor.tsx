import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AudioUploadDropzone } from "@/components/admin/AudioUploadDropzone";
import { api } from "@/lib/api";
import {
  emptySpeakingSetStructure,
  normalizeSpeakingSetStructure,
  SPEAKING_QUESTION_SET_SIZE,
  stripStructureAudioRefs,
  SPEAKING_SET_EXAM_NAME,
  type SpeakingSet,
  type SpeakingSetMode,
  type SpeakingSetStructure,
  type SpeakingTextAudio,
  type SpeakingTimedPrompt,
} from "@/lib/speakingSetStructure";

export type SetForm = {
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

function AudioField({
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

function TextAudioBlock({
  textLabel,
  audioLabel,
  value,
  onChange,
  disabled,
  rows = 3,
}: {
  textLabel: string;
  audioLabel: string;
  value: SpeakingTextAudio;
  onChange: (v: SpeakingTextAudio) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs">{textLabel}</Label>
        <Textarea
          rows={rows}
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          disabled={disabled}
          className="text-xs"
        />
      </div>
      <AudioField
        label={audioLabel}
        value={value.audio_url ?? ""}
        onChange={(path) => onChange({ ...value, audio_url: path || null })}
        disabled={disabled}
      />
    </div>
  );
}

function TimedPromptBlock({
  title,
  textLabel,
  audioLabel,
  timerLabel,
  value,
  onChange,
  disabled,
  rows = 3,
}: {
  title: string;
  textLabel: string;
  audioLabel: string;
  timerLabel: string;
  value: SpeakingTimedPrompt;
  onChange: (v: SpeakingTimedPrompt) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold text-slate-700">{title}</p>
      <div className="space-y-1.5">
        <Label className="text-xs">{textLabel}</Label>
        <Textarea
          rows={rows}
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          disabled={disabled}
          className="text-xs"
        />
      </div>
      <AudioField
        label={audioLabel}
        value={value.audio_url ?? ""}
        onChange={(path) => onChange({ ...value, audio_url: path || null })}
        disabled={disabled}
      />
      <div className="space-y-1.5 max-w-[180px]">
        <Label className="text-xs">{timerLabel}</Label>
        <Input
          type="number"
          min={5}
          value={value.timer_seconds}
          onChange={(e) =>
            onChange({ ...value, timer_seconds: Math.max(5, parseInt(e.target.value, 10) || 5) })
          }
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="border-b border-slate-200 pb-2">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function SpeakingSetEditor({ value, onChange, disabled }: Props) {
  const structure = normalizeSpeakingSetStructure(value.structure);
  const mode: SpeakingSetMode = structure.mode === "academic_parts" ? "academic_parts" : "question_set_15";

  const updateStructure = (patch: Partial<SpeakingSetStructure>) => {
    onChange({ ...value, structure: { ...structure, ...patch } });
  };

  return (
    <div className="space-y-8">
      {/* Basic Set Details */}
      <section className="space-y-4">
        <SectionHeader title="Basic Set Details" hint="Title, exam name, status, disclaimer, and general introduction." />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Set Title *</Label>
            <Input
              placeholder="Set 1 / Set 2 / Set 3"
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Exam Name</Label>
            <Input value={structure.exam_name || SPEAKING_SET_EXAM_NAME} disabled />
            <p className="text-[11px] text-slate-400">Fixed: LanguageCert Academic Speaking</p>
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
            <Label>Set Mode</Label>
            <select
              value={mode}
              onChange={(e) => updateStructure({ mode: e.target.value as SpeakingSetMode })}
              disabled={disabled}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="question_set_15">15-question set (question audio only)</option>
              <option value="academic_parts">Academic parts (legacy)</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Disclaimer Text</Label>
            <Input
              value={structure.disclaimer}
              onChange={(e) => updateStructure({ disclaimer: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>

        {mode === "academic_parts" ? (
          <TextAudioBlock
            textLabel="General Examiner Introduction Text"
            audioLabel="General Examiner Introduction Audio (plays before Part 1)"
            value={structure.general_intro}
            onChange={(general_intro) => updateStructure({ general_intro })}
            disabled={disabled}
            rows={4}
          />
        ) : (
          <p className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
            This mode uses only question-level audio. Intro/part instruction/presentation/follow-up/ending audio is ignored.
          </p>
        )}
      </section>

      {mode === "question_set_15" && (
        <section className="space-y-4">
          <SectionHeader
            title="Question Set"
            hint={`Add exactly ${SPEAKING_QUESTION_SET_SIZE} speaking questions. Only question audio will be played.`}
          />

          {(structure.question_set_questions ?? []).slice(0, SPEAKING_QUESTION_SET_SIZE).map((q, i) => (
            <TimedPromptBlock
              key={i}
              title={`Question ${i + 1}`}
              textLabel={`Question ${i + 1} Text`}
              audioLabel={`Question ${i + 1} Audio`}
              timerLabel={`Question ${i + 1} Answer Timer (seconds)`}
              value={q}
              onChange={(next) => {
                const question_set_questions = [...(structure.question_set_questions ?? [])];
                question_set_questions[i] = next;
                updateStructure({ question_set_questions });
              }}
              disabled={disabled}
            />
          ))}
        </section>
      )}

      {mode === "academic_parts" && (
      <>
      {/* Part 1 */}
      <section className="space-y-4">
        <SectionHeader
          title="Part 1 – Questions"
          hint={structure.part1.student_instruction}
        />

        <div className="space-y-1.5">
          <Label className="text-xs">Default Student Instruction</Label>
          <Textarea
            rows={2}
            value={structure.part1.student_instruction}
            onChange={(e) =>
              updateStructure({ part1: { ...structure.part1, student_instruction: e.target.value } })
            }
            disabled={disabled}
            className="text-xs"
          />
        </div>

        <TextAudioBlock
          textLabel="Part 1 Examiner Instruction Text"
          audioLabel="Part 1 Examiner Instruction Audio"
          value={structure.part1.examiner_instruction}
          onChange={(examiner_instruction) =>
            updateStructure({ part1: { ...structure.part1, examiner_instruction } })
          }
          disabled={disabled}
        />

        {structure.part1.questions.map((q, i) => (
          <TimedPromptBlock
            key={i}
            title={`Question ${i + 1}`}
            textLabel={`Question ${i + 1} Text`}
            audioLabel={`Question ${i + 1} Audio`}
            timerLabel={`Question ${i + 1} Answer Timer (seconds)`}
            value={q}
            onChange={(next) => {
              const questions = [...structure.part1.questions];
              questions[i] = next;
              updateStructure({ part1: { ...structure.part1, questions } });
            }}
            disabled={disabled}
          />
        ))}
      </section>

      {/* Part 2 */}
      <section className="space-y-4">
        <SectionHeader title="Part 2 – Role Play" hint={structure.part2.student_instruction} />

        <div className="space-y-1.5">
          <Label className="text-xs">Default Student Instruction</Label>
          <Textarea
            rows={2}
            value={structure.part2.student_instruction}
            onChange={(e) =>
              updateStructure({ part2: { ...structure.part2, student_instruction: e.target.value } })
            }
            disabled={disabled}
            className="text-xs"
          />
        </div>

        <TextAudioBlock
          textLabel="Part 2 Examiner Instruction Text"
          audioLabel="Part 2 Examiner Instruction Audio"
          value={structure.part2.examiner_instruction}
          onChange={(examiner_instruction) =>
            updateStructure({ part2: { ...structure.part2, examiner_instruction } })
          }
          disabled={disabled}
        />

        {structure.part2.role_plays.map((q, i) => (
          <TimedPromptBlock
            key={i}
            title={`Role Play ${i + 1}`}
            textLabel={`Role Play ${i + 1} Situation Text`}
            audioLabel={`Role Play ${i + 1} Audio`}
            timerLabel={`Role Play ${i + 1} Speaking Timer (seconds)`}
            value={q}
            onChange={(next) => {
              const role_plays = [...structure.part2.role_plays];
              role_plays[i] = next;
              updateStructure({ part2: { ...structure.part2, role_plays } });
            }}
            disabled={disabled}
            rows={4}
          />
        ))}
      </section>

      {/* Part 3 */}
      <section className="space-y-4">
        <SectionHeader title="Part 3 – Read Aloud" hint={structure.part3.student_instruction} />

        <div className="space-y-1.5">
          <Label className="text-xs">Default Student Instruction</Label>
          <Textarea
            rows={2}
            value={structure.part3.student_instruction}
            onChange={(e) =>
              updateStructure({ part3: { ...structure.part3, student_instruction: e.target.value } })
            }
            disabled={disabled}
            className="text-xs"
          />
        </div>

        <TextAudioBlock
          textLabel="Part 3 Examiner Instruction Text"
          audioLabel="Part 3 Examiner Instruction Audio"
          value={structure.part3.examiner_instruction}
          onChange={(examiner_instruction) =>
            updateStructure({ part3: { ...structure.part3, examiner_instruction } })
          }
          disabled={disabled}
        />

        <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/40 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Read Aloud Text *</Label>
            <Textarea
              rows={5}
              value={structure.part3.read_aloud_text}
              onChange={(e) =>
                updateStructure({ part3: { ...structure.part3, read_aloud_text: e.target.value } })
              }
              disabled={disabled}
              className="text-xs"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Preparation Timer (seconds)</Label>
              <Input
                type="number"
                min={5}
                value={structure.part3.preparation_timer}
                onChange={(e) =>
                  updateStructure({
                    part3: {
                      ...structure.part3,
                      preparation_timer: Math.max(5, parseInt(e.target.value, 10) || 5),
                    },
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reading Recording Timer (seconds)</Label>
              <Input
                type="number"
                min={5}
                value={structure.part3.reading_timer}
                onChange={(e) =>
                  updateStructure({
                    part3: {
                      ...structure.part3,
                      reading_timer: Math.max(5, parseInt(e.target.value, 10) || 5),
                    },
                  })
                }
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <TextAudioBlock
          textLabel="Read Aloud Start Instruction Text"
          audioLabel="Read Aloud Start Instruction Audio"
          value={structure.part3.read_aloud_start}
          onChange={(read_aloud_start) =>
            updateStructure({ part3: { ...structure.part3, read_aloud_start } })
          }
          disabled={disabled}
        />

        <TimedPromptBlock
          title="Follow-up Question"
          textLabel="Follow-up Question Text"
          audioLabel="Follow-up Question Audio"
          timerLabel="Follow-up Answer Timer (seconds)"
          value={structure.part3.follow_up}
          onChange={(follow_up) => updateStructure({ part3: { ...structure.part3, follow_up } })}
          disabled={disabled}
        />
      </section>

      {/* Part 4 */}
      <section className="space-y-4">
        <SectionHeader title="Part 4 – Presentation" hint={structure.part4.student_instruction} />

        <div className="space-y-1.5">
          <Label className="text-xs">Default Student Instruction</Label>
          <Textarea
            rows={2}
            value={structure.part4.student_instruction}
            onChange={(e) =>
              updateStructure({ part4: { ...structure.part4, student_instruction: e.target.value } })
            }
            disabled={disabled}
            className="text-xs"
          />
        </div>

        <TextAudioBlock
          textLabel="Part 4 Examiner Instruction Text"
          audioLabel="Part 4 Examiner Instruction Audio"
          value={structure.part4.examiner_instruction}
          onChange={(examiner_instruction) =>
            updateStructure({ part4: { ...structure.part4, examiner_instruction } })
          }
          disabled={disabled}
        />

        <TextAudioBlock
          textLabel="Presentation Topic Text *"
          audioLabel="Topic Audio"
          value={structure.part4.presentation_topic}
          onChange={(presentation_topic) =>
            updateStructure({ part4: { ...structure.part4, presentation_topic } })
          }
          disabled={disabled}
        />

        <TextAudioBlock
          textLabel="Preparation Start Text"
          audioLabel="Preparation Start Audio"
          value={structure.part4.preparation_start}
          onChange={(preparation_start) =>
            updateStructure({ part4: { ...structure.part4, preparation_start } })
          }
          disabled={disabled}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Preparation Timer (seconds)</Label>
            <Input
              type="number"
              min={5}
              value={structure.part4.preparation_timer}
              onChange={(e) =>
                updateStructure({
                  part4: {
                    ...structure.part4,
                    preparation_timer: Math.max(5, parseInt(e.target.value, 10) || 5),
                  },
                })
              }
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Presentation Speaking Timer (seconds)</Label>
            <Input
              type="number"
              min={5}
              value={structure.part4.speaking_timer}
              onChange={(e) =>
                updateStructure({
                  part4: {
                    ...structure.part4,
                    speaking_timer: Math.max(5, parseInt(e.target.value, 10) || 5),
                  },
                })
              }
              disabled={disabled}
            />
          </div>
        </div>

        <TextAudioBlock
          textLabel="Presentation Start Text"
          audioLabel="Presentation Start Audio"
          value={structure.part4.presentation_start}
          onChange={(presentation_start) =>
            updateStructure({ part4: { ...structure.part4, presentation_start } })
          }
          disabled={disabled}
        />

        {structure.part4.follow_ups.map((q, i) => (
          <TimedPromptBlock
            key={i}
            title={`Follow-up Question ${i + 1}`}
            textLabel={`Follow-up Question ${i + 1} Text`}
            audioLabel={`Follow-up Question ${i + 1} Audio`}
            timerLabel={`Follow-up Question ${i + 1} Answer Timer (seconds)`}
            value={q}
            onChange={(next) => {
              const follow_ups = [...structure.part4.follow_ups];
              follow_ups[i] = next;
              updateStructure({ part4: { ...structure.part4, follow_ups } });
            }}
            disabled={disabled}
          />
        ))}

        <TextAudioBlock
          textLabel="Ending Examiner Text"
          audioLabel="Ending Examiner Audio"
          value={structure.part4.ending}
          onChange={(ending) => updateStructure({ part4: { ...structure.part4, ending } })}
          disabled={disabled}
        />
      </section>
      </>
      )}
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

  return {
    title: set.title,
    level: set.level,
    sort_order: set.sort_order,
    is_published: set.is_published,
    structure: stripStructureAudioRefs(normalizeSpeakingSetStructure(set.structure)),
  };
}
