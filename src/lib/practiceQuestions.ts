import { api, type ListeningQuestion, type WritingQuestion } from "@/lib/api";

export type PracticeSection = "writing" | "reading" | "listening" | "speaking";

export type PracticeQuestionItem = {
  id: string;
  index: number;
  title: string;
  raw: WritingQuestion | ListeningQuestion;
};

const READING_TASK_MAP: Record<string, string> = {
  "1a": "reading_part_1a",
  "1b": "reading_part_1b",
  "2": "reading_part_2",
  "3": "reading_part_3",
  "4": "reading_part_4",
};

export function getDefaultPart(section: string): string {
  if (section === "writing") return "1";
  if (section === "reading") return "1a";
  if (section === "listening") return "1";
  return "1";
}

export { partQuestionsUrl as practiceQuestionsHubUrl } from "@/lib/practiceRoutes";

export function getQuestionType(section: string, part: string): string {
  if (section === "writing") return part === "1" ? "writing_task1" : "writing_task2";
  if (section === "reading") return READING_TASK_MAP[part] ?? "reading_part_1a";
  if (section === "listening") return `listening_part_${part}`;
  return section;
}

function parseJson<T>(s: string | null | undefined): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function truncate(text: string, max = 48): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function getQuestionTitle(
  question: WritingQuestion | ListeningQuestion,
  section: string,
  index: number,
): string {
  if (section === "listening") {
    const lq = question as ListeningQuestion;
    const qs = lq.questions;
    if (Array.isArray(qs)) return `Set #${index}`;
    const obj = qs as { title?: string; description?: string };
    if (obj.title) return truncate(obj.title, 56);
    if (obj.description) return truncate(obj.description, 56);
    return `Set #${index}`;
  }

  const wq = question as WritingQuestion;
  if (section === "reading") {
    const data = parseJson<{ passageTitle?: string }>(wq.image_path);
    if (data?.passageTitle) return truncate(data.passageTitle, 56);
  }
  if (wq.question_text) return truncate(wq.question_text, 56);
  return `Question #${index}`;
}

export function getSectionLabel(section: string): string {
  const labels: Record<string, string> = {
    writing: "Writing",
    reading: "Reading",
    listening: "Listening",
    speaking: "Speaking",
  };
  return labels[section] ?? "Practice";
}

export function getPartLabel(section: string, part: string): string {
  if (section === "writing") return part === "1" ? "Task 1" : "Task 2";
  if (section === "listening") return `Part ${part}`;
  if (section === "reading") return `Part ${part.toUpperCase()}`;
  return `Part ${part}`;
}

export async function fetchPracticeQuestions(
  section: string,
  part: string,
): Promise<PracticeQuestionItem[]> {
  if (section === "listening") {
    const partNum = parseInt(part, 10) || 1;
    const res = await api.listening.list({ part_number: partNum, page: 1, limit: 500 });
    const rows = res.data?.questions ?? [];
    return rows.map((q, i) => ({
      id: q.id,
      index: i + 1,
      title: getQuestionTitle(q, section, i + 1),
      raw: q,
    }));
  }

  if (section === "writing") {
    const taskType = part === "1" ? "task1" : "task2";
    const res = await api.writing.list(taskType);
    const rows = res.data ?? [];
    return rows.map((q, i) => ({
      id: q.id,
      index: i + 1,
      title: getQuestionTitle(q, section, i + 1),
      raw: q,
    }));
  }

  if (section === "reading") {
    const taskType = READING_TASK_MAP[part] ?? "reading_part_1a";
    const res = await api.writing.list(taskType as "task1");
    const rows = res.data ?? [];
    return rows.map((q, i) => ({
      id: q.id,
      index: i + 1,
      title: getQuestionTitle(q, section, i + 1),
      raw: q,
    }));
  }

  return [];
}
