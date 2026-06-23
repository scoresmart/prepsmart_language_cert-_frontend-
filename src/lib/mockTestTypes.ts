import type { ListeningQuestion, WritingQuestion } from "@/lib/api";

export type MockTestStructureSection = {
  id?: string;
  part?: number;
  part_type?: string;
  task?: number;
  task_type?: string;
  audio_path?: string | null;
  questions?: unknown;
  question_text?: string;
  image_path?: string | null;
  title?: string;
  passage?: string | null;
  word_bank?: unknown;
};

export type MockTestStructure = {
  id: string;
  title: string;
  description: string | null;
  sections: {
    listening: MockTestStructureSection[];
    reading: MockTestStructureSection[];
    writing: MockTestStructureSection[];
  };
};

export function toListeningQuestion(section: MockTestStructureSection): ListeningQuestion | null {
  if (!section.id) return null;
  return {
    id: section.id,
    part_number: section.part ?? 1,
    audio_path: section.audio_path ?? null,
    questions: (section.questions ?? []) as ListeningQuestion["questions"],
    created_by: null,
    created_at: "",
    updated_at: "",
  };
}

export function toWritingQuestion(section: MockTestStructureSection, taskType: "task1" | "task2"): WritingQuestion | null {
  if (!section.id) return null;
  return {
    id: section.id,
    task_type: (section.task_type as "task1" | "task2") ?? taskType,
    question_text: section.question_text ?? "",
    image_path: section.image_path ?? null,
    created_by: null,
    created_at: "",
    updated_at: null,
  };
}

export function toReadingQuestion(section: MockTestStructureSection): WritingQuestion | null {
  if (!section.id) return null;
  return {
    id: section.id,
    task_type: "task1",
    question_text: section.question_text ?? "",
    image_path: section.image_path ?? null,
    created_by: null,
    created_at: "",
    updated_at: null,
  };
}
