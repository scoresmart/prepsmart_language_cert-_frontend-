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

/**
 * Reading/listening: natural height so questions stay mostly visible (page scrolls).
 * Writing/speaking: tall pane for split/editor layouts.
 */
export function practiceQuestionFrameClass(module: string, part: string): string {
  if (module === "speaking") {
    return "flex min-h-[min(720px,calc(100dvh-3.5rem-12rem))] w-full flex-col";
  }
  if (module === "writing" && part === "1") {
    return "flex min-h-[min(680px,calc(100dvh-3.5rem-12rem))] w-full flex-col";
  }
  if (module === "writing") {
    return "flex min-h-[min(640px,calc(100dvh-3.5rem-12rem))] w-full flex-col";
  }
  // reading / listening — grow with content, avoid nested scroll squeeze
  return "flex w-full flex-col";
}

export { partQuestionsUrl as practiceQuestionsHubUrl } from "@/lib/practiceRoutes";
