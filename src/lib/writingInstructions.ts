export const WRITING_PARTS = [
  { part: "1", label: "Writing Part 1" },
  { part: "2", label: "Writing Part 2" },
] as const;

export const WRITING_PART_TITLES: Record<string, string> = {
  "1": "Academic Report / Article",
  "2": "Discursive Essay",
};

export const WRITING_INSTRUCTIONS: Record<string, string> = {
  "1": "Write a report or article of 150–200 words based on the chart, table, or visual information below.",
  "2": "Write a discursive essay of around 250 words. Argue, persuade, explain your opinion, or discuss the topic below.",
};

export const WRITING_WORD_LIMITS: Record<string, { min: number; max: number }> = {
  "1": { min: 150, max: 200 },
  "2": { min: 220, max: 280 },
};
