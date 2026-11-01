import type { ObjectiveResultItem } from "@/lib/objectiveScoreUtils";

/** The student's answer, saved with a practice attempt so admins can review it. */
export type PracticeAttemptAnswer =
  | { kind: "text"; prompt: string; text: string }
  | { kind: "items"; items: ObjectiveResultItem[] }
  | {
      kind: "speaking";
      turns: { role: "examiner" | "student"; text: string }[];
      audio: { label: string; url: string }[];
    };
