import { getSpeakingAudioPublicUrl, getSpeakingExaminerAudioUrl } from "@/lib/speakingAudio";
import { SPEAKING_DEFAULT_MAX_SCORE, SPEAKING_DEFAULT_LEVEL } from "@/lib/speakingQuestionStructure";

export type SpeakingSetPrompt = {
  title: string;
  content?: string;
  audio_url?: string | null;
  read_text?: string;
  topic?: string;
  image_url?: string | null;
};

export type SpeakingSetPart3 = {
  readAloud: SpeakingSetPrompt & { read_text: string };
  followUps: SpeakingSetPrompt[];
};

export type SpeakingSetPart4 = {
  presentation: SpeakingSetPrompt;
  followUps: SpeakingSetPrompt[];
};

export type SpeakingSetStructure = {
  part1: SpeakingSetPrompt[];
  part2: SpeakingSetPrompt[];
  part3: SpeakingSetPart3;
  part4: SpeakingSetPart4;
};

export type SpeakingSet = {
  id: string;
  title: string;
  level: string;
  sort_order: number;
  is_published: boolean;
  structure: SpeakingSetStructure;
  created_at: string;
  updated_at: string;
};

export type SpeakingPromptKind = "question" | "role_play" | "read_aloud" | "follow_up" | "presentation";

export type FlatSpeakingPrompt = SpeakingSetPrompt & {
  kind: SpeakingPromptKind;
  promptIndex: number;
  promptLabel: string;
};

export function emptySpeakingSetStructure(): SpeakingSetStructure {
  return {
    part1: Array.from({ length: 5 }, (_, i) => ({
      title: `Question ${i + 1}`,
      content: "",
      audio_url: null,
    })),
    part2: Array.from({ length: 2 }, (_, i) => ({
      title: `Role play ${i + 1}`,
      content: "",
      audio_url: null,
    })),
    part3: {
      readAloud: {
        title: "Read aloud",
        read_text: "",
        content: "",
        audio_url: null,
      },
      followUps: [{ title: "Follow-up 1", content: "", audio_url: null }],
    },
    part4: {
      presentation: {
        title: "Presentation",
        topic: "",
        content: "",
        audio_url: null,
      },
      followUps: [
        { title: "Follow-up 1", content: "", audio_url: null },
        { title: "Follow-up 2", content: "", audio_url: null },
      ],
    },
  };
}

export function validateSpeakingSetStructure(structure: SpeakingSetStructure): string | null {
  if (!structure.part1 || structure.part1.length !== 5) {
    return "Part 1 must have exactly 5 questions.";
  }
  if (!structure.part2 || structure.part2.length !== 2) {
    return "Part 2 must have exactly 2 role plays.";
  }
  if (!structure.part3?.readAloud?.read_text?.trim()) {
    return "Part 3 read-aloud text is required.";
  }
  if (!structure.part3.followUps?.length) {
    return "Part 3 needs at least one follow-up question.";
  }
  if (!structure.part4?.presentation?.title?.trim()) {
    return "Part 4 presentation title is required.";
  }
  if (!structure.part4.followUps || structure.part4.followUps.length !== 2) {
    return "Part 4 must have exactly 2 follow-up questions.";
  }
  for (const [i, p] of structure.part3.followUps.entries()) {
    if (!p.content?.trim() && !p.title?.trim()) {
      return `Part 3 follow-up ${i + 1} needs a question.`;
    }
  }
  for (const [i, p] of structure.part4.followUps.entries()) {
    if (!p.content?.trim() && !p.title?.trim()) {
      return `Part 4 follow-up ${i + 1} needs a question.`;
    }
  }
  return null;
}

export function flattenPartPrompts(part: string | number, structure: SpeakingSetStructure): FlatSpeakingPrompt[] {
  const partNum = typeof part === "number" ? part : parseInt(part, 10) || 1;

  if (partNum === 1) {
    return structure.part1.map((p, i) => ({
      ...p,
      kind: "question" as const,
      promptIndex: i,
      promptLabel: `Question ${i + 1} of 5`,
    }));
  }

  if (partNum === 2) {
    return structure.part2.map((p, i) => ({
      ...p,
      kind: "role_play" as const,
      promptIndex: i,
      promptLabel: `Role play ${i + 1} of 2`,
    }));
  }

  if (partNum === 3) {
    return [
      {
        ...structure.part3.readAloud,
        kind: "read_aloud",
        promptIndex: 0,
        promptLabel: "Read aloud",
      },
      ...structure.part3.followUps.map((p, i) => ({
        ...p,
        kind: "follow_up" as const,
        promptIndex: i + 1,
        promptLabel: `Follow-up ${i + 1}`,
      })),
    ];
  }

  return [
    {
      ...structure.part4.presentation,
      kind: "presentation",
      promptIndex: 0,
      promptLabel: "Presentation",
    },
    ...structure.part4.followUps.map((p, i) => ({
      ...p,
      kind: "follow_up" as const,
      promptIndex: i + 1,
      promptLabel: `Follow-up ${i + 1} of 2`,
    })),
  ];
}

export type SpeakingSetPracticeQuestion = {
  id: string;
  setId: string;
  part_number: number;
  task_type: string;
  title: string;
  level: string;
  content: string;
  audio_url: string;
  image_url: string | null;
  max_score: number;
  is_published: boolean;
  created_at: string;
  prompt: FlatSpeakingPrompt;
  promptCount: number;
  setTitle: string;
};

export function flatPromptToPracticeQuestion(
  set: SpeakingSet,
  part: string,
  prompt: FlatSpeakingPrompt,
  promptCount: number,
): SpeakingSetPracticeQuestion {
  const partNum = parseInt(part, 10) || 1;
  const level = set.level?.trim() || SPEAKING_DEFAULT_LEVEL;

  let content = prompt.content?.trim() ?? "";
  if (prompt.kind === "read_aloud" && prompt.read_text?.trim()) {
    content = [
      content,
      "",
      "【Read aloud text】",
      prompt.read_text.trim(),
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (prompt.kind === "presentation" && prompt.topic?.trim()) {
    content = [`【Presentation topic】\n${prompt.topic.trim()}`, content].filter(Boolean).join("\n\n");
  }
  if (prompt.kind === "follow_up" && !content) {
    content = prompt.title;
  }

  const audioSeed = set.id.charCodeAt(0) + prompt.promptIndex + partNum * 10;

  return {
    id: `${set.id}-${partNum}-${prompt.promptIndex}`,
    setId: set.id,
    part_number: partNum,
    task_type: `speaking_part_${partNum}`,
    title: `${set.title} — ${prompt.promptLabel}`,
    level,
    content: content || prompt.title,
    audio_url: getSpeakingExaminerAudioUrl(prompt.audio_url, audioSeed),
    image_url: prompt.image_url ?? null,
    max_score: SPEAKING_DEFAULT_MAX_SCORE,
    is_published: set.is_published,
    created_at: set.created_at,
    prompt,
    promptCount,
    setTitle: set.title,
  };
}

export function stripSpeakingAudioRef(value: string): string {
  if (!value?.trim()) return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("http")) return trimmed;
  for (const marker of ["speaking-audio/", "listening-audio/"]) {
    const idx = trimmed.indexOf(marker);
    if (idx >= 0) return trimmed.slice(idx + marker.length);
  }
  return trimmed;
}

export function resolvePromptAudioForDisplay(audioRef?: string | null): string | null {
  return getSpeakingAudioPublicUrl(audioRef);
}
