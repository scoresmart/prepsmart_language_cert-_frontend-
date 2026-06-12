export const READING_PARTS = [
  { part: "1a", label: "Reading Part 1a" },
  { part: "1b", label: "Reading Part 1b" },
  { part: "2", label: "Reading Part 2" },
  { part: "3", label: "Reading Part 3" },
  { part: "4", label: "Reading Part 4" },
] as const;

export const READING_INSTRUCTIONS: Record<string, string> = {
  "1a": "Read the sentences below and decide which option (A, B, C or D) can best replace the word in bold so that the meaning of the sentence remains the same.",
  "1b": "Read the text below and decide which option (A, B or C) best fits each gap.",
  "2": "Read the article from an international news magazine. Drag and drop the correct sentence (A–H) to complete the six gaps in the text. There are two extra sentences you will not need.",
  "3": "Read the four texts below. There are several questions about the texts. Which text gives you the answer to each question? Select the correct text (A, B, C or D) for each statement.",
  "4": "Read the article and answer the questions.",
};

export const READING_PART_TITLES: Record<string, string> = {
  "1a": "Synonym Selection",
  "1b": "Gap Fill",
  "2": "Sentence Insertion",
  "3": "Passage Matching",
  "4": "Reading Comprehension",
};
