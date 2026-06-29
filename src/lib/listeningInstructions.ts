export const LISTENING_PARTS = [
  { part: 1, label: "Listening Part 1", shortLabel: "Part 1" },
  { part: 2, label: "Listening Part 2", shortLabel: "Part 2" },
  { part: 3, label: "Listening Part 3", shortLabel: "Part 3" },
  { part: 4, label: "Listening Part 4", shortLabel: "Part 4" },
] as const;

export const LISTENING_INSTRUCTIONS: Record<number, string> = {
  1: "You will hear 7 short unfinished dialogues. You will hear each dialogue twice. Choose the best ending (A, B, or C) to complete each dialogue.",
  2: "You will hear 5 conversations. Each conversation has 2 multiple-choice questions. You will hear each conversation twice.",
  3: "You will hear an academic lecture or podcast. Fill in the blanks as you listen. Each answer should be no more than 3 words. You will hear the recording twice.",
  4: "You will hear a group discussion or debate. Choose the correct answer (A, B, C, or D) for each question. You will hear the recording twice.",
};

export const LISTENING_PART_TITLES: Record<number, string> = {
  1: "Short Dialogues",
  2: "Conversations",
  3: "Lecture / Podcast Gap Fill",
  4: "Group Discussion / Debate",
};

/** Seconds to prepare before listening audio auto-plays. */
export const LISTENING_PREP_SECONDS = 2;
