/** Local cache for writing answers (backend stores score only). */
export function saveLocalAnswer(questionSetId: string, text: string): void {
  try {
    sessionStorage.setItem(`lc-practice-answer:${questionSetId}`, text);
  } catch {
    /* ignore */
  }
}

export function getLocalAnswer(questionSetId: string): string | null {
  try {
    return sessionStorage.getItem(`lc-practice-answer:${questionSetId}`);
  } catch {
    return null;
  }
}
