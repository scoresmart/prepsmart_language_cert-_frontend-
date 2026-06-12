export const LISTENING_PARTS = [
  { part: 1, label: "Listening Part 1", shortLabel: "Part 1" },
  { part: 2, label: "Listening Part 2", shortLabel: "Part 2" },
  { part: 3, label: "Listening Part 3", shortLabel: "Part 3" },
  { part: 4, label: "Listening Part 4", shortLabel: "Part 4" },
] as const;

export const LISTENING_INSTRUCTIONS: Record<number, string> = {
  1: "You will hear some short conversations. You will hear each conversation twice. Choose the correct answer to complete each conversation.",
  2: "You will hear longer conversations. Listen carefully and choose the best answer for each question.",
  3: "You will hear a recording. Complete the notes by filling in the blanks as you listen.",
  4: "You will hear an extended discussion. Choose the correct answer for each question.",
};

export const LISTENING_PART_TITLES: Record<number, string> = {
  1: "Short Exchanges",
  2: "Conversations",
  3: "Note Completion",
  4: "Extended Discussion",
};
