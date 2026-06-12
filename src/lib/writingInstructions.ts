export const WRITING_PARTS = [
  { part: "1", label: "Writing Part 1" },
  { part: "2", label: "Writing Part 2" },
] as const;

export const WRITING_PART_TITLES: Record<string, string> = {
  "1": "Short Email / Letter",
  "2": "Article",
};

export const WRITING_INSTRUCTIONS: Record<string, string> = {
  "1": "Write an email or letter of 100–150 words in response to the situation below.",
  "2": "Write an article of 150–200 words on the topic below.",
};

export const WRITING_WORD_LIMITS: Record<string, { min: number; max: number }> = {
  "1": { min: 100, max: 150 },
  "2": { min: 150, max: 200 },
};
