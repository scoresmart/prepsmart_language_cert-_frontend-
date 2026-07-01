/** Pending section payloads — scored in batch when the mock test is submitted. */

export type MockPendingMcq = {
  kind: "mcq";
  questionType: string;
  questionSetId: string;
  answers: Record<string | number, string>;
  items: { correctAnswer: string | number }[];
  labelMode?: "index" | "string";
  labelLetters?: string[];
};

export type MockPendingGapFill = {
  kind: "gap_fill";
  questionType: string;
  questionSetId: string;
  inputs: Record<number, string>;
  correctAnswers: string[];
};

export type MockPendingMapping = {
  kind: "mapping";
  questionType: string;
  questionSetId: string;
  selections: Record<string, string>;
  correctMapping: Record<string, string>;
};

export type MockPendingStatement = {
  kind: "statement_match";
  questionType: string;
  questionSetId: string;
  answers: Record<number, string>;
  statements: { correctAnswer: string }[];
};

export type MockPendingWriting = {
  kind: "writing";
  questionType: string;
  questionSetId: string;
  taskType: "task1" | "task2";
  text: string;
  questionText: string;
};

export type MockPendingSpeaking = {
  kind: "speaking";
  questionType: string;
  questionSetId: string;
  part: string;
  level: string;
  title: string;
  content: string;
  /** Local recording keyed by question id in practiceAttemptStorage. */
  recordingQuestionId: string;
};

export type MockPendingSection =
  | MockPendingMcq
  | MockPendingGapFill
  | MockPendingMapping
  | MockPendingStatement
  | MockPendingWriting
  | MockPendingSpeaking;
