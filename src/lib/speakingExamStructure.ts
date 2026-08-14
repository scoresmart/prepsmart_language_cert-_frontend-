/**
 * LanguageCert four-part speaking exam — the shape the admin authors and the
 * live examiner reads.
 *
 * The admin supplies content only: five Part 1 questions, two Part 2
 * situations, a Part 3 picture with its title and idea, and a Part 4 topic.
 * Everything else — the examiner's wording, the timings, and the follow-up
 * questions the examiner invents from the picture and the topic — is fixed here
 * so every set runs the same exam.
 */

export const SPEAKING_EXAM_VERSION = 3 as const;

export const PART1_QUESTION_COUNT = 5;
export const PART2_SITUATION_COUNT = 2;
export const PART3_QUESTION_COUNT = 2;
export const PART4_FOLLOWUP_COUNT = 3;

/** Fixed timings, in seconds. Parts are budgeted to the exam spec. */
export const EXAM_TIMING = {
  /** Part 1: openers then five questions, 1 min 30 in total. */
  part1Opener: 20,
  part1Question: 18,
  part1Total: 90,

  /** Part 2: two situations, one minute of conversation each. */
  part2Situation: 60,

  /** Part 3: 20s to prepare, then 1 min 30 of speaking. */
  part3Prepare: 20,
  part3Describe: 30,
  part3Question: 30,

  /** Part 4: 30s to prepare, then 2 min of speaking. */
  part4Prepare: 30,
  part4Present: 30,
  part4Followup: 30,
} as const;

export type SpeakingExamPart1 = {
  opening_questions: string[];
  transition: string;
  questions: string[];
  closing: string;
};

export type SpeakingExamSituation = {
  text: string;
  seconds: number;
};

export type SpeakingExamPart2 = {
  intro: string;
  situations: SpeakingExamSituation[];
  closing: string;
};

export type SpeakingExamPart3 = {
  intro: string;
  image_url: string | null;
  image_title: string;
  image_idea: string;
  prepare_seconds: number;
  describe_seconds: number;
  question_count: number;
  question_seconds: number;
  closing: string;
};

export type SpeakingExamPart4 = {
  intro: string;
  topic: string;
  prepare_seconds: number;
  present_seconds: number;
  followup_count: number;
  followup_seconds: number;
};

export type SpeakingExamStructure = {
  version: 3;
  exam_name: string;
  disclaimer: string;
  greeting: string;
  part1: SpeakingExamPart1;
  part2: SpeakingExamPart2;
  part3: SpeakingExamPart3;
  part4: SpeakingExamPart4;
  ending: string;
};

export const EXAM_DEFAULTS = {
  examName: "LanguageCert Academic Speaking",
  disclaimer: "Original Practice Content – Not Official Exam Questions",
  greeting: "Hi there, I'm your LanguageCert examiner.",

  part1Openers: ["What is your full name?", "Where are you from?"],
  part1Transition:
    "Thank you. Now I'm going to ask you some questions about yourself.",
  part1Closing: "Thank you. That is the end of Part 1.",

  part2Intro:
    "Now we will begin Part 2. I will read a situation for you, and I want you to start your answer. So, here is the first situation.",
  part2Closing: "Thank you. That is the end of Part 2.",

  part3Intro:
    "Now we will move to Part 3. You will see a picture on your screen. You have twenty seconds to look at it and prepare.",
  part3Closing: "Thank you. That is the end of Part 3.",

  part4Intro:
    "In Part Four you are going to talk about something for half a minute. You have thirty seconds to prepare.",

  ending:
    "Thank you very much. That is the end of the speaking test. Your responses have been recorded. Goodbye.",
} as const;

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" && v.trim() ? v : fallback;

const posInt = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
};

function fixedList(raw: unknown, count: number, fallback: string[] = []): string[] {
  const arr = Array.isArray(raw) ? raw : [];
  return Array.from({ length: count }, (_, i) => {
    const item = arr[i];
    if (typeof item === "string") return item;
    // Tolerate {text} objects, which is how v1/v2 stored prompts.
    if (item && typeof item === "object" && "text" in item) {
      return str((item as { text?: unknown }).text, fallback[i] ?? "");
    }
    return fallback[i] ?? "";
  });
}

export function emptySpeakingExamStructure(): SpeakingExamStructure {
  return {
    version: 3,
    exam_name: EXAM_DEFAULTS.examName,
    disclaimer: EXAM_DEFAULTS.disclaimer,
    greeting: EXAM_DEFAULTS.greeting,
    part1: {
      opening_questions: [...EXAM_DEFAULTS.part1Openers],
      transition: EXAM_DEFAULTS.part1Transition,
      questions: Array.from({ length: PART1_QUESTION_COUNT }, () => ""),
      closing: EXAM_DEFAULTS.part1Closing,
    },
    part2: {
      intro: EXAM_DEFAULTS.part2Intro,
      situations: Array.from({ length: PART2_SITUATION_COUNT }, () => ({
        text: "",
        seconds: EXAM_TIMING.part2Situation,
      })),
      closing: EXAM_DEFAULTS.part2Closing,
    },
    part3: {
      intro: EXAM_DEFAULTS.part3Intro,
      image_url: null,
      image_title: "",
      image_idea: "",
      prepare_seconds: EXAM_TIMING.part3Prepare,
      describe_seconds: EXAM_TIMING.part3Describe,
      question_count: PART3_QUESTION_COUNT,
      question_seconds: EXAM_TIMING.part3Question,
      closing: EXAM_DEFAULTS.part3Closing,
    },
    part4: {
      intro: EXAM_DEFAULTS.part4Intro,
      topic: "",
      prepare_seconds: EXAM_TIMING.part4Prepare,
      present_seconds: EXAM_TIMING.part4Present,
      followup_count: PART4_FOLLOWUP_COUNT,
      followup_seconds: EXAM_TIMING.part4Followup,
    },
    ending: EXAM_DEFAULTS.ending,
  };
}

/**
 * Pulls whatever content exists out of a v1 or v2 set so existing sets keep
 * their questions when the four-part exam takes over.
 */
function migrateLegacy(raw: Record<string, unknown>, base: SpeakingExamStructure): SpeakingExamStructure {
  const textOf = (v: unknown): string => {
    if (typeof v === "string") return v;
    if (v && typeof v === "object") {
      const o = v as { text?: unknown; content?: unknown; title?: unknown; topic?: unknown };
      return str(o.text) || str(o.content) || str(o.topic) || str(o.title);
    }
    return "";
  };

  /**
   * v1 presentations carry both a `topic` and a `content` holding the
   * examiner's timing instructions. Only the topic belongs in Part 4 — the
   * instructions are generated now.
   */
  const topicOf = (v: unknown): string => {
    if (typeof v === "string") return v.trim();
    if (v && typeof v === "object") {
      const o = v as { topic?: unknown; text?: unknown; title?: unknown };
      const raw = str(o.topic) || str(o.text) || str(o.title);
      // "Your topic is: X" -> "X"; the examiner says the lead-in itself.
      return raw.replace(/^your topic is[:\s]*/i, "").trim();
    }
    return "";
  };

  /** Openers are always asked, so a legacy copy of one would be asked twice. */
  const key = (t: string) => t.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
  const openerKeys = new Set(base.part1.opening_questions.map(key));

  // v2 question-set mode: fifteen flat questions.
  const flat = Array.isArray(raw.question_set_questions)
    ? (raw.question_set_questions as unknown[]).map(textOf).filter(Boolean)
    : [];

  const p1 = raw.part1 as unknown;
  const legacyPart1 = Array.isArray(p1)
    ? p1.map(textOf).filter(Boolean)
    : Array.isArray((p1 as { questions?: unknown[] })?.questions)
      ? ((p1 as { questions: unknown[] }).questions.map(textOf).filter(Boolean))
      : [];

  const p2 = raw.part2 as unknown;
  const legacyPart2 = Array.isArray(p2)
    ? p2.map(textOf).filter(Boolean)
    : Array.isArray((p2 as { role_plays?: unknown[] })?.role_plays)
      ? ((p2 as { role_plays: unknown[] }).role_plays.map(textOf).filter(Boolean))
      : [];

  const p4 = raw.part4 as { presentation?: unknown; presentation_topic?: unknown } | undefined;
  const legacyTopic = topicOf(p4?.presentation_topic) || topicOf(p4?.presentation);

  const questionPool = (legacyPart1.length ? legacyPart1 : flat).filter((q) => !openerKeys.has(key(q)));

  return {
    ...base,
    part1: {
      ...base.part1,
      questions: Array.from({ length: PART1_QUESTION_COUNT }, (_, i) => questionPool[i] ?? ""),
    },
    part2: {
      ...base.part2,
      situations: base.part2.situations.map((s, i) => ({
        ...s,
        text: legacyPart2[i] ?? "",
      })),
    },
    part4: { ...base.part4, topic: legacyTopic },
  };
}

export function normalizeSpeakingExamStructure(raw: unknown): SpeakingExamStructure {
  const base = emptySpeakingExamStructure();
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Record<string, unknown>;

  if (s.version !== 3) return migrateLegacy(s, base);

  const p1 = (s.part1 ?? {}) as Partial<SpeakingExamPart1>;
  const p2 = (s.part2 ?? {}) as Partial<SpeakingExamPart2>;
  const p3 = (s.part3 ?? {}) as Partial<SpeakingExamPart3>;
  const p4 = (s.part4 ?? {}) as Partial<SpeakingExamPart4>;

  const rawSituations = Array.isArray(p2.situations) ? p2.situations : [];

  return {
    version: 3,
    exam_name: str(s.exam_name, base.exam_name),
    disclaimer: str(s.disclaimer, base.disclaimer),
    greeting: str(s.greeting, base.greeting),
    part1: {
      opening_questions: fixedList(
        p1.opening_questions,
        base.part1.opening_questions.length,
        base.part1.opening_questions,
      ),
      transition: str(p1.transition, base.part1.transition),
      questions: fixedList(p1.questions, PART1_QUESTION_COUNT),
      closing: str(p1.closing, base.part1.closing),
    },
    part2: {
      intro: str(p2.intro, base.part2.intro),
      situations: Array.from({ length: PART2_SITUATION_COUNT }, (_, i) => ({
        text: str(rawSituations[i]?.text),
        seconds: posInt(rawSituations[i]?.seconds, EXAM_TIMING.part2Situation),
      })),
      closing: str(p2.closing, base.part2.closing),
    },
    part3: {
      intro: str(p3.intro, base.part3.intro),
      image_url: typeof p3.image_url === "string" && p3.image_url.trim() ? p3.image_url.trim() : null,
      image_title: str(p3.image_title),
      image_idea: str(p3.image_idea),
      prepare_seconds: posInt(p3.prepare_seconds, EXAM_TIMING.part3Prepare),
      describe_seconds: posInt(p3.describe_seconds, EXAM_TIMING.part3Describe),
      question_count: posInt(p3.question_count, PART3_QUESTION_COUNT),
      question_seconds: posInt(p3.question_seconds, EXAM_TIMING.part3Question),
      closing: str(p3.closing, base.part3.closing),
    },
    part4: {
      intro: str(p4.intro, base.part4.intro),
      topic: str(p4.topic),
      prepare_seconds: posInt(p4.prepare_seconds, EXAM_TIMING.part4Prepare),
      present_seconds: posInt(p4.present_seconds, EXAM_TIMING.part4Present),
      followup_count: posInt(p4.followup_count, PART4_FOLLOWUP_COUNT),
      followup_seconds: posInt(p4.followup_seconds, EXAM_TIMING.part4Followup),
    },
    ending: str(s.ending, base.ending),
  };
}

/** Returns the first problem that would stop a set being published, or null. */
export function validateSpeakingExamStructure(structure: SpeakingExamStructure): string | null {
  const s = normalizeSpeakingExamStructure(structure);

  for (const [i, q] of s.part1.questions.entries()) {
    if (!q.trim()) return `Part 1: question ${i + 1} of ${PART1_QUESTION_COUNT} is empty.`;
  }
  for (const [i, sit] of s.part2.situations.entries()) {
    if (!sit.text.trim()) return `Part 2: situation ${i + 1} is empty.`;
  }
  if (!s.part3.image_url) return "Part 3: upload a picture for the candidate to describe.";
  if (!s.part3.image_title.trim()) return "Part 3: give the picture a title.";
  if (!s.part3.image_idea.trim()) {
    return "Part 3: describe the idea of the picture — the examiner needs it to ask relevant questions.";
  }
  if (!s.part4.topic.trim()) return "Part 4: enter the topic the candidate should talk about.";
  return null;
}

/** Whole-exam speaking budget in seconds, excluding the examiner's own speech. */
export function examSpeakingSeconds(s: SpeakingExamStructure): number {
  const p1 = s.part1.opening_questions.length * EXAM_TIMING.part1Opener + EXAM_TIMING.part1Total;
  const p2 = s.part2.situations.reduce((sum, x) => sum + x.seconds, 0);
  const p3 =
    s.part3.prepare_seconds + s.part3.describe_seconds + s.part3.question_count * s.part3.question_seconds;
  const p4 =
    s.part4.prepare_seconds + s.part4.present_seconds + s.part4.followup_count * s.part4.followup_seconds;
  return p1 + p2 + p3 + p4;
}
