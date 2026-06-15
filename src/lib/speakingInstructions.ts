export const SPEAKING_PARTS = [
  { part: "1", label: "Speaking Part 1" },
  { part: "2", label: "Speaking Part 2" },
  { part: "3", label: "Speaking Part 3" },
  { part: "4", label: "Speaking Part 4" },
] as const;

export const SPEAKING_PART_TITLES: Record<string, string> = {
  "1": "Personal Information & Short Responses",
  "2": "Picture Description & Discussion",
  "3": "Role Play & Situations",
  "4": "Extended Monologue & Opinion",
};

export const SPEAKING_INSTRUCTIONS: Record<string, string> = {
  "1": "Listen to the examiner, prepare for 5 seconds, then record your answer. You can start or stop recording manually.",
  "2": "Listen to the examiner, prepare for 5 seconds, then record your answer. You can start or stop recording manually.",
  "3": "Listen to the examiner, prepare for 5 seconds, then record your answer. You can start or stop recording manually.",
  "4": "Listen to the examiner, prepare for 5 seconds, then record your answer. You can start or stop recording manually.",
};

export const SPEAKING_PREP_SECONDS = 5;
export const SPEAKING_RECORD_SECONDS = 35;
