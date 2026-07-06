/** LanguageCert Academic / Academic SELT — official mock test format. */

import type { WritingQuestion } from "@/lib/api";
import type { PracticeQuestionItem } from "@/lib/practiceQuestions";

export const MOCK_EXAM_TITLE = "LanguageCert Academic";
export const MOCK_EXAM_TOTAL_MINUTES = 154; // ~2h 34m
export const MOCK_ACTIVITY_SCREENS = 15;

export const MOCK_MODULE_TIMINGS = {
  listening: 40,
  reading: 50,
  writing: 50,
  speaking: 14,
} as const;

export const MOCK_LISTENING_PARTS = [
  {
    part: "1",
    label: "Part 1",
    title: "Short Dialogues",
    questions: 7,
    format: "7 MCQs — unfinished dialogues, choose the best ending (3 options). Played twice.",
  },
  {
    part: "2",
    label: "Part 2",
    title: "Conversations",
    questions: 10,
    format: "10 MCQs — 5 conversations, 2 questions each. Played twice.",
  },
  {
    part: "3",
    label: "Part 3",
    title: "Lecture / Podcast Gap Fill",
    questions: 7,
    format: "7 gap-fill — academic lecture or podcast (max 3 words per answer). Played twice.",
  },
  {
    part: "4",
    label: "Part 4",
    title: "Group Discussion / Debate",
    questions: 6,
    format: "6 MCQs — group discussion or debate. Played twice.",
  },
] as const;

export const MOCK_READING_PARTS = [
  {
    part: "1a",
    label: "Part 1a",
    title: "Word Replacement",
    questions: 6,
    format: "6 MCQs — replace the highlighted word while keeping the same meaning.",
  },
  {
    part: "1b",
    label: "Part 1b",
    title: "Gap Fill",
    questions: 5,
    format: "5 gap-fill MCQs — choose the correct word from 3 options.",
  },
  {
    part: "2",
    label: "Part 2",
    title: "Missing Sentences",
    questions: 6,
    format: "6 matching — insert removed sentences from 8 options.",
  },
  {
    part: "3",
    label: "Part 3",
    title: "Four Short Texts",
    questions: 7,
    format: "7 matching — identify which text (A–D) answers each statement.",
  },
  {
    part: "4",
    label: "Part 4",
    title: "Long Academic Text",
    questions: 6,
    format: "6 MCQs — longer academic passage, 4 options each.",
  },
] as const;

export const MOCK_WRITING_TASKS = [
  {
    part: "1",
    label: "Task 1",
    title: "Academic Report / Article",
    words: "150–200",
    format: "Write a report or article based on a chart, table, or visual (150–200 words).",
  },
  {
    part: "2",
    label: "Task 2",
    title: "Discursive Essay",
    words: "~250",
    format: "Academic essay — argue, persuade, explain opinion, or discuss (~250 words).",
  },
] as const;

export const MOCK_SPEAKING_PARTS = [
  { part: "1", label: "Part 1", title: "Questions", format: "Name, spell name, country of origin, up to 5 general questions." },
  { part: "2", label: "Part 2", title: "Role Play", format: "2 role-play situations in academic-related scenarios." },
  { part: "3", label: "Part 3", title: "Read Aloud", format: "30s prep, read a short academic text aloud, then follow-up questions." },
  { part: "4", label: "Part 4", title: "Presentation", format: "1 min prep, speak up to 2 min on an academic topic, then follow-ups." },
] as const;

/** Map mock runner step part keys → DB `part_type` for reading. */
export const READING_STEP_TO_PART_TYPE: Record<string, string> = {
  "1a": "part1a",
  "1b": "part1b",
  "2": "part2",
  "3": "part3",
  "4": "part4",
};

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
  listening: MOCK_LISTENING_PARTS.reduce((s, p) => s + p.questions, 0),
  reading: MOCK_READING_PARTS.reduce((s, p) => s + p.questions, 0),
  writing: 50,
  speaking: 50,
};

/** DB-backed sections assembled in admin (speaking uses practice bank in runner). */
export const MOCK_DB_SECTION_COUNT = 11;

const MOCK_NAV_PLACEHOLDER = {} as WritingQuestion;

/** Navigator items for mock test workspace (same shape as practice question list). */
export function mockTestNavigatorItems(): PracticeQuestionItem[] {
  return MOCK_TEST_STEPS.map((step, i) => ({
    id: step.key,
    index: i + 1,
    title: step.label,
    raw: MOCK_NAV_PLACEHOLDER,
  }));
}
