import { workspaceUrl } from "@/lib/practiceRoutes";

/** @deprecated use partQuestionUrl / workspaceUrl from practiceRoutes */
export function practiceQuestionUrl(section: string, questionIndex: number, part?: string): string {
  if (!part) return `/workspace/${section}/part-1/question/${questionIndex}`;
  return workspaceUrl(section, part, questionIndex);
}



export function parseQuestionIndex(raw?: string): number {

  const n = parseInt(raw ?? "1", 10);

  return Number.isFinite(n) && n >= 1 ? n : 1;

}



export function difficultyLabel(index: number): "Easy" | "Medium" | "Hard" {

  const labels = ["Easy", "Medium", "Hard"] as const;

  return labels[(index - 1) % 3];

}

/** Shared workspace content frame — practice + mock test. */
export function practiceQuestionFrameClass(module: string, part: string): string {
  if (module === "speaking") {
    return "flex h-[calc(100dvh-3.5rem)] min-h-0 shrink-0 flex-col overflow-hidden";
  }
  if (module === "writing" && part === "1") {
    return "flex h-[calc(100dvh-3.5rem-3.25rem)] min-w-0 shrink-0 flex-col overflow-hidden";
  }
  return "flex min-h-[calc(100dvh-3.5rem-3.25rem)] min-w-0 shrink-0 flex-col";
}



export { partQuestionsUrl as practiceQuestionsHubUrl } from "@/lib/practiceRoutes";


