import type { ListeningQuestion, ReadingQuestion, WritingQuestion } from "@/lib/api";

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

export function toReadingQuestionFromSection(section: MockTestStructureSection): ReadingQuestion | null {
  if (!section.id) return null;
  const partType = (section.part_type ?? "part1a") as ReadingQuestion["part_type"];
  return {
    id: section.id,
    part_type: partType,
    title: section.title ?? "",
    passage: section.passage ?? section.question_text ?? null,
    image_path: section.image_path ?? null,
    questions: (section.questions ?? []) as object[],
    word_bank: (section.word_bank as object | null) ?? null,
    is_active: true,
    created_by: null,
    created_at: "",
    updated_at: null,
  };
}

/** Shape expected by ReadingSection runners (same as practice API mapping). */
export function readingQuestionToWritingShape(rq: ReadingQuestion): WritingQuestion {
  return {
    id: rq.id,
    task_type: "task1",
    question_text: rq.title || rq.passage || "",
    image_path: rq.questions ? JSON.stringify(rq.questions) : null,
    created_by: rq.created_by,
    created_at: rq.created_at,
    updated_at: rq.updated_at,
  };
}

/** @deprecated Use readingQuestionToWritingShape(toReadingQuestionFromSection(...)) */
export function toReadingQuestion(section: MockTestStructureSection): WritingQuestion | null {
  const rq = toReadingQuestionFromSection(section);
  return rq ? readingQuestionToWritingShape(rq) : null;
}
