/** Normalize listening part JSON from DB (object or array shapes). */

export type ListeningPart3Data = {
  title?: string;
  questionText: string;
  answers: string[];
};

export type ListeningPart4Question = {
  questionText: string;
  options: string[];
  correctAnswer: number;
};

export type ListeningPart4Data = {
  description?: string;
  questions: ListeningPart4Question[];
};

function parseRawJson(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  return raw;
}

function normalizePart4Question(item: unknown): ListeningPart4Question | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const questionText = row.questionText ?? row.text;
  const options = row.options;
  if (typeof questionText !== "string" || !Array.isArray(options)) return null;

  let correctAnswer = 0;
  if (typeof row.correctAnswer === "number") {
    correctAnswer = row.correctAnswer;
  } else if (typeof row.correctAnswer === "string") {
    const letter = row.correctAnswer.trim().toUpperCase();
    const idx = ["A", "B", "C", "D", "E"].indexOf(letter);
    correctAnswer = idx >= 0 ? idx : 0;
  } else if (typeof row.answer === "string") {
    const idx = ["A", "B", "C", "D", "E"].indexOf(row.answer.trim().toUpperCase());
    correctAnswer = idx >= 0 ? idx : 0;
  }

  return {
    questionText,
    options: options.map(String),
    correctAnswer,
  };
}

export function normalizeListeningPart3Data(raw: unknown): ListeningPart3Data | null {
  const value = parseRawJson(raw);
  if (!value) return null;

  if (Array.isArray(value)) {
    if (value.length === 1) return normalizeListeningPart3Data(value[0]);
    return null;
  }

  if (typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.questionText !== "string" || !Array.isArray(row.answers)) return null;

  return {
    title: typeof row.title === "string" ? row.title : undefined,
    questionText: row.questionText,
    answers: row.answers.map(String),
  };
}

export function normalizeListeningPart4Data(raw: unknown): ListeningPart4Data | null {
  const value = parseRawJson(raw);
  if (!value) return null;

  if (Array.isArray(value)) {
    if (value.length === 1 && value[0] && typeof value[0] === "object" && "questions" in value[0]) {
      return normalizeListeningPart4Data(value[0]);
    }
    const questions = value.map(normalizePart4Question).filter((q): q is ListeningPart4Question => q !== null);
    if (questions.length > 0) return { questions };
    return null;
  }

  if (typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!Array.isArray(row.questions)) return null;

  const questions = row.questions.map(normalizePart4Question).filter((q): q is ListeningPart4Question => q !== null);
  if (questions.length === 0) return null;

  return {
    description: typeof row.description === "string" ? row.description : undefined,
    questions,
  };
}
