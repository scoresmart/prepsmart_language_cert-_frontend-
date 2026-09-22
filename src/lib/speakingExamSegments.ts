import {
  EXAM_TIMING,
  normalizeSpeakingExamStructure,
  type SpeakingExamStructure,
} from "@/lib/speakingExamStructure";

/**
 * Flattens an authored exam into the ordered list of segments the live
 * examiner runs.
 *
 * The bridge is a generic segment runner — it knows nothing about parts,
 * pictures or topics. Keeping the exam shape here means the admin editor, the
 * progress bar and the examiner all read from one definition.
 */

export type SegmentKind =
  /** Examiner speaks; no answer expected. Advances as soon as it stops. */
  | "say"
  /** Examiner asks this exact question and waits for a real answer. */
  | "ask"
  /** Examiner reads a situation, then role-plays for the full window. */
  | "converse"
  /** Silent thinking time. Mic is held, nudges suppressed. */
  | "prepare"
  /** Candidate speaks to a brief for a fixed window. */
  | "speak"
  /** Examiner invents a question from the given context, then waits. */
  | "generated";

export type ExamSegment = {
  id: string;
  kind: SegmentKind;
  part: number;
  /** Question text, instruction, or the line to say — depends on kind. */
  text: string;
  seconds: number;
  label: string;
  /** Extra grounding the examiner needs to invent a good question. */
  context?: string;
  /** Shown to the candidate for the duration of this segment. */
  imageUrl?: string | null;
  /** Which generated question this is, e.g. 1 of 2. */
  generatedIndex?: number;
  generatedTotal?: number;
};

/**
 * Personal warm-up questions, keyed by the profile detail each one uncovers.
 * A candidate is only asked for what the examiner does not already know, so a
 * name or a home town given in one question is never asked for in the next.
 */
const PERSONAL_POOL: Array<{ detail: string; questions: string[] }> = [
  {
    detail: "job",
    questions: [
      "Do you work or are you a student at the moment?",
      "What do you do — do you work, or are you studying?",
    ],
  },
  {
    detail: "family",
    questions: [
      "Who do you live with?",
      "Can you tell me a little about your family?",
    ],
  },
  {
    detail: "interest",
    questions: [
      "What do you enjoy doing in your free time?",
      "Do you have a hobby? Tell me about it.",
    ],
  },
  {
    detail: "home",
    questions: [
      "Can you tell me a little about your home?",
      "What do you like about the place where you live?",
    ],
  },
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const NAME_QUESTION = /\b(your (full |first )?name|call you)\b/i;
const PLACE_QUESTION = /where (are|do) you (from|live|come)|which (city|town|country)/i;

export type ExamSegmentOptions = {
  /** What earlier tests already taught the examiner (from the database). */
  knownProfile?: Record<string, string>;
};

/**
 * The Part 1 warm-up for this candidate.
 *
 * First test: name and home town, exactly as the set authors them. After that
 * the examiner already knows both, so it opens with a personal question it has
 * not asked yet — and when every detail is known it catches up on one of them
 * instead, which is what a real examiner meeting a candidate again would do.
 */
function personalOpeners(authored: string[], known: Record<string, string>) {
  const hasName = Boolean(known.name?.trim());
  const hasPlace = Boolean((known.city ?? known.country)?.trim());

  const kept = authored
    .map((q) => q.trim())
    .filter(Boolean)
    .filter((q) => !(hasName && NAME_QUESTION.test(q)) && !(hasPlace && PLACE_QUESTION.test(q)));

  const isKnown = (detail: string) =>
    Boolean(known[detail]?.trim()) || (detail === "job" && Boolean(known.study?.trim()));
  const unknown = shuffled(PERSONAL_POOL.filter((p) => !isKnown(p.detail)));
  // Always two openers: the authored ones a first-time candidate has not
  // answered yet, topped up with personal questions not asked before.
  const wanted = Math.max(0, 2 - kept.length);
  const fresh = unknown.slice(0, wanted).map((p) => ({ kind: "ask" as const, text: pick(p.questions) }));

  const catchUps = fresh.length < wanted ? wanted - fresh.length : 0;
  const catchUp = Array.from({ length: catchUps }, () => ({ kind: "generated" as const, text: "" }));

  return [...kept.map((text) => ({ kind: "ask" as const, text })), ...fresh, ...catchUp];
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export function buildExamSegments(
  raw: SpeakingExamStructure | unknown,
  opts: ExamSegmentOptions = {},
): ExamSegment[] {
  const s: SpeakingExamStructure = normalizeSpeakingExamStructure(raw);
  const out: ExamSegment[] = [];
  seq = 0;

  const push = (seg: Omit<ExamSegment, "id">) => out.push({ ...seg, id: nextId(seg.kind) });

  // ------------------------------------------------------------ opening
  push({
    kind: "say",
    part: 0,
    text: `${s.greeting} This is the ${s.exam_name} practice test. It has four parts and takes about fifteen minutes. Please answer naturally and in full sentences. Let's begin with Part 1.`,
    seconds: 0,
    label: "Introduction",
  });

  // ------------------------------------------------------------- part 1
  const known = opts.knownProfile ?? {};
  const knownLines = Object.entries(known)
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  personalOpeners(s.part1.opening_questions, known).forEach((q, i) => {
    if (q.kind === "generated") {
      push({
        kind: "generated",
        part: 1,
        text: "",
        seconds: EXAM_TIMING.part1Opener,
        label: `Part 1 · Opening question ${i + 1}`,
        context: `Personal catch-up with a returning candidate. What you already know about them:
${knownLines}
Ask ONE short, friendly personal question that builds on one of these details (for example how things are going at work or in their studies, or something new in their town). Never ask for their name or where they are from — you already know.`,
        generatedIndex: 1,
        generatedTotal: 1,
      });
      return;
    }
    push({
      kind: "ask",
      part: 1,
      text: q.text,
      seconds: EXAM_TIMING.part1Opener,
      label: `Part 1 · Opening question ${i + 1}`,
    });
  });

  push({ kind: "say", part: 1, text: s.part1.transition, seconds: 0, label: "Part 1 · Transition" });

  const p1Questions = s.part1.questions.filter((q) => q.trim());
  const p1Each = p1Questions.length
    ? Math.max(12, Math.round(EXAM_TIMING.part1Total / p1Questions.length))
    : EXAM_TIMING.part1Question;

  p1Questions.forEach((q, i) => {
    push({
      kind: "ask",
      part: 1,
      text: q.trim(),
      seconds: p1Each,
      label: `Part 1 · Question ${i + 1} of ${p1Questions.length}`,
    });
  });

  push({ kind: "say", part: 1, text: s.part1.closing, seconds: 0, label: "Part 1 · Closing" });

  // ------------------------------------------------------------- part 2
  push({ kind: "say", part: 2, text: s.part2.intro, seconds: 0, label: "Part 2 · Introduction" });

  const situations = s.part2.situations.filter((x) => x.text.trim());
  situations.forEach((sit, i) => {
    if (i > 0) {
      push({
        kind: "say",
        part: 2,
        text: "Thank you. Now here is the second situation.",
        seconds: 0,
        label: "Part 2 · Next situation",
      });
    }
    push({
      kind: "converse",
      part: 2,
      text: sit.text.trim(),
      seconds: sit.seconds,
      label: `Part 2 · Situation ${i + 1} of ${situations.length}`,
      context: sit.text.trim(),
    });
  });

  push({ kind: "say", part: 2, text: s.part2.closing, seconds: 0, label: "Part 2 · Closing" });

  // ------------------------------------------------------------- part 3
  push({
    kind: "say",
    part: 3,
    text: s.part3.intro,
    seconds: 0,
    label: "Part 3 · Introduction",
    imageUrl: s.part3.image_url,
  });

  push({
    kind: "prepare",
    part: 3,
    text: "Look at the picture and prepare. Your preparation time starts now.",
    seconds: s.part3.prepare_seconds,
    label: "Part 3 · Preparation",
    imageUrl: s.part3.image_url,
  });

  const imageContext = [
    s.part3.image_title.trim() ? `Picture title: ${s.part3.image_title.trim()}` : "",
    s.part3.image_idea.trim() ? `What the picture shows: ${s.part3.image_idea.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  push({
    kind: "speak",
    part: 3,
    text: "Your preparation time is over. Please describe the picture in as much detail as you can.",
    seconds: s.part3.describe_seconds,
    label: "Part 3 · Describe the picture",
    context: imageContext,
    imageUrl: s.part3.image_url,
  });

  for (let i = 0; i < s.part3.question_count; i++) {
    const scripted = s.part3.questions[i]?.trim();
    if (scripted) {
      push({
        kind: "ask",
        part: 3,
        text: scripted,
        seconds: s.part3.question_seconds,
        label: `Part 3 · Question ${i + 1} of ${s.part3.question_count}`,
        imageUrl: s.part3.image_url,
      });
      continue;
    }
    push({
      kind: "generated",
      part: 3,
      text: "",
      seconds: s.part3.question_seconds,
      label: `Part 3 · Question ${i + 1} of ${s.part3.question_count}`,
      context: imageContext,
      imageUrl: s.part3.image_url,
      generatedIndex: i + 1,
      generatedTotal: s.part3.question_count,
    });
  }

  push({ kind: "say", part: 3, text: s.part3.closing, seconds: 0, label: "Part 3 · Closing" });

  // ------------------------------------------------------------- part 4
  push({ kind: "say", part: 4, text: s.part4.intro, seconds: 0, label: "Part 4 · Introduction" });

  const topic = s.part4.topic.trim();

  push({
    kind: "prepare",
    part: 4,
    text: `Your topic is: ${topic} You have ${s.part4.prepare_seconds} seconds to prepare. Your preparation time starts now.`,
    seconds: s.part4.prepare_seconds,
    label: "Part 4 · Preparation",
    context: topic,
  });

  push({
    kind: "speak",
    part: 4,
    text: `Your preparation time is over. Please start speaking now about: ${topic}`,
    seconds: s.part4.present_seconds,
    label: "Part 4 · Talk on the topic",
    context: topic,
  });

  for (let i = 0; i < s.part4.followup_count; i++) {
    const scripted = s.part4.followups[i]?.trim();
    if (scripted) {
      push({
        kind: "ask",
        part: 4,
        text: scripted,
        seconds: s.part4.followup_seconds,
        label: `Part 4 · Follow-up ${i + 1} of ${s.part4.followup_count}`,
        context: topic,
      });
      continue;
    }
    push({
      kind: "generated",
      part: 4,
      text: "",
      seconds: s.part4.followup_seconds,
      label: `Part 4 · Follow-up ${i + 1} of ${s.part4.followup_count}`,
      context: topic,
      generatedIndex: i + 1,
      generatedTotal: s.part4.followup_count,
    });
  }

  // ------------------------------------------------------------- closing
  push({ kind: "say", part: 0, text: s.ending, seconds: 0, label: "End of test" });

  return out;
}

/** Segments the candidate actually has to speak for — used for progress. */
export function isSpokenSegment(seg: ExamSegment): boolean {
  return seg.kind !== "say";
}

export function examSegmentSummary(segments: ExamSegment[]) {
  const spoken = segments.filter(isSpokenSegment);
  const totalSeconds = segments.reduce((sum, s) => sum + s.seconds, 0);
  return {
    total: segments.length,
    spoken: spoken.length,
    /** Rough wall-clock: candidate time plus the examiner's own speaking. */
    estimatedMinutes: Math.max(1, Math.round((totalSeconds + segments.length * 7) / 60)),
  };
}
