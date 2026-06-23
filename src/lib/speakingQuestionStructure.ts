import type { SpeakingQuestion } from "@/lib/api";
import { getSpeakingExaminerAudioUrl } from "@/lib/speakingAudio";

/** LanguageCert speaking is scored 0–50 (12 raw marks scaled). */
export const SPEAKING_DEFAULT_MAX_SCORE = 50;
export const SPEAKING_DEFAULT_LEVEL = "B1";

export const SPEAKING_UNIVERSAL_INSTRUCTION =
  "Listen to the examiner, prepare for 5 seconds, then record your answer. You can start or stop recording manually.";

export const SPEAKING_DEFAULT_PROMPT =
  "Listen to the examiner audio carefully, then record your spoken response when prompted.";

export type NormalizedSpeakingQuestion = SpeakingQuestion & {
  content: string;
  level: string;
  max_score: number;
  audio_url: string;
};

export function normalizeSpeakingQuestion(
  question: SpeakingQuestion,
  questionIndex = 1,
): NormalizedSpeakingQuestion {
  return {
    ...question,
    title: question.title?.trim() || `Speaking Question ${questionIndex}`,
    level: question.level?.trim() || SPEAKING_DEFAULT_LEVEL,
    content: question.content?.trim() || SPEAKING_DEFAULT_PROMPT,
    max_score: question.max_score || SPEAKING_DEFAULT_MAX_SCORE,
    audio_url: getSpeakingExaminerAudioUrl(question.audio_url, questionIndex),
  };
}
