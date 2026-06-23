/** LanguageCert International ESOL mock test format (B1/B2-style). */

export const MOCK_LISTENING_PARTS = [
  { part: "1", label: "Part 1", questions: 7, format: "7 MCQs — unfinished conversations" },
  { part: "2", label: "Part 2", questions: 6, format: "6 MCQs — 3 conversations, 2 questions each" },
  { part: "3", label: "Part 3", questions: 7, format: "7 note-completion (1–5 words)" },
  { part: "4", label: "Part 4", questions: 6, format: "6 MCQs — discussion/debate" },
] as const;

export const MOCK_READING_PARTS = [
  { part: "1a", label: "Part 1A", questions: 6, format: "6 MCQs — long text" },
  { part: "1b", label: "Part 1B", questions: 6, format: "6 gap-fill sentences" },
  { part: "2", label: "Part 2", questions: 6, format: "6 matching questions" },
  { part: "3", label: "Part 3", questions: 7, format: "7 matching — 4 short texts" },
  { part: "4", label: "Part 4", questions: 7, format: "7 short answers (up to 5 words)" },
] as const;

export const MOCK_WRITING_TASKS = [
  { part: "1", label: "Task 1", words: "100–150", format: "Formal — letter, email, report" },
  { part: "2", label: "Task 2", words: "150–200", format: "Informal/personal writing" },
] as const;

export const MOCK_SPEAKING_PARTS = [
  { part: "1", label: "Part 1", format: "Name, country, 5 personal questions" },
  { part: "2", label: "Part 2", format: "Role-play situations" },
  { part: "3", label: "Part 3", format: "Plan/arrange discussion" },
  { part: "4", label: "Part 4", format: "30s prep, ~2 min talk + follow-ups" },
] as const;

export type MockTestStep = {
  key: string;
  module: "listening" | "reading" | "writing" | "speaking";
  part: string;
  label: string;
  maxScore: number;
};

export const MOCK_TEST_STEPS: MockTestStep[] = [
  ...MOCK_LISTENING_PARTS.map((p) => ({
    key: `listening-${p.part}`,
    module: "listening" as const,
    part: p.part,
    label: `Listening ${p.label}`,
    maxScore: p.questions,
  })),
  ...MOCK_READING_PARTS.map((p) => ({
    key: `reading-${p.part}`,
    module: "reading" as const,
    part: p.part,
    label: `Reading ${p.label}`,
    maxScore: p.questions,
  })),
  ...MOCK_WRITING_TASKS.map((p) => ({
    key: `writing-${p.part}`,
    module: "writing" as const,
    part: p.part,
    label: `Writing ${p.label}`,
    maxScore: 25,
  })),
  ...MOCK_SPEAKING_PARTS.map((p) => ({
    key: `speaking-${p.part}`,
    module: "speaking" as const,
    part: p.part,
    label: `Speaking ${p.label}`,
    maxScore: 50,
  })),
];

export const MOCK_TOTALS = {
  listening: 26,
  reading: 26,
  writing: 50,
  speaking: 50,
};
