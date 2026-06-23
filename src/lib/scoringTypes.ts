export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type PracticeGrade = "High Pass" | "Pass" | "Below Pass";

export const DEFAULT_WRITING_LEVEL: CEFRLevel = "B2";

export interface WritingScoreResult {
  type: "writing";
  level: CEFRLevel;
  taskType: "task1" | "task2";
  wordCount: number;
  scores: {
    taskFulfilment: number;
    grammar: number;
    vocabulary: number;
    organisation: number;
    total: number;
  };
  feedback: {
    taskFulfilment: string;
    grammar: string;
    vocabulary: string;
    organisation: string;
    overall: string;
  };
  grade: PracticeGrade;
}

export interface SpeakingScoreResult {
  type: "speaking";
  level: CEFRLevel;
  transcript: string;
  transcriptionConfidence: number;
  durationSeconds: number;
  scores: {
    taskFulfilmentCoherence: number;
    grammar: number;
    vocabulary: number;
    pronunciationFluency: number;
    rawTotal: number;
    scaledTotal: number;
  };
  feedback: {
    taskFulfilmentCoherence: string;
    grammar: string;
    vocabulary: string;
    pronunciationFluency: string;
    overall: string;
  };
  grade: PracticeGrade;
}

export type ScoringPhase = "idle" | "scoring" | "done" | "error";
