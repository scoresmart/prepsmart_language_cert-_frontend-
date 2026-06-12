/** URL helpers — each module and sub-part has its own path (no query params). */

const MODULES = ["speaking", "writing", "reading", "listening"] as const;
export type PracticeModule = (typeof MODULES)[number];

export function isPracticeModule(value: string): value is PracticeModule {
  return (MODULES as readonly string[]).includes(value);
}

/** e.g. "1" → "part-1", "1a" → "part-1a" */
export function partToSlug(part: string): string {
  return `part-${part}`;
}

/** e.g. "part-1a" → "1a" */
export function slugToPart(slug: string): string | null {
  if (!slug.startsWith("part-")) return null;
  const part = slug.slice(5);
  return part.length > 0 ? part : null;
}

export function practiceHomeUrl(): string {
  return "/practice";
}

export function moduleUrl(module: string): string {
  return `/practice/${module}`;
}

/** Full-screen practice workspace (separate from dashboard). */
export function workspaceUrl(module: string, part: string, questionIndex: number): string {
  return `/workspace/${module}/${partToSlug(part)}/question/${questionIndex}`;
}

export function partQuestionsUrl(module: string, part: string): string {
  return `/practice/${module}/${partToSlug(part)}/questions`;
}

export function partQuestionUrl(module: string, part: string, questionIndex: number): string {
  return workspaceUrl(module, part, questionIndex);
}

/** First question of a part — convenience link */
export function partStartUrl(module: string, part: string): string {
  return partQuestionUrl(module, part, 1);
}
