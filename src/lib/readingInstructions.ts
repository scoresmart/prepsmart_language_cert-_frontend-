export const READING_PARTS = [
  { part: "1a", label: "Reading Part 1a" },
  { part: "1b", label: "Reading Part 1b" },
  { part: "2", label: "Reading Part 2" },
  { part: "3", label: "Reading Part 3" },
  { part: "4", label: "Reading Part 4" },
] as const;

export const READING_INSTRUCTIONS: Record<string, string> = {
  "1a": "Read each sentence and choose the word (A, B, C, or D) that can best replace the highlighted word without changing the meaning.",
  "1b": "Read the short text with missing words. Choose the correct word (A, B, or C) for each gap.",
  "2": "Read the text with six removed sentences. Match each gap with the correct sentence (A–H). Two sentences are not used.",
  "3": "Read four short texts on the same topic. For each statement, select which text (A, B, C, or D) gives the answer.",
  "4": "Read the longer academic text and choose the best answer (A, B, C, or D) for each question.",
};

export const READING_PART_TITLES: Record<string, string> = {
  "1a": "Word Replacement",
  "1b": "Gap Fill",
  "2": "Missing Sentences",
  "3": "Four Short Texts",
  "4": "Long Academic Text",
};
