const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://sepzceaicoldqhyxxzff.supabase.co";

/** Public sample audio for speaking practice testing (short clips, CORS-friendly). */
export const SPEAKING_TEST_AUDIO_URLS = [
  "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
  "https://samplelib.com/lib/preview/mp3/sample-6s.mp3",
  "https://samplelib.com/lib/preview/mp3/sample-9s.mp3",
  "https://samplelib.com/lib/preview/mp3/sample-12s.mp3",
] as const;

export const DEFAULT_SPEAKING_TEST_AUDIO = SPEAKING_TEST_AUDIO_URLS[1];

export function pickSpeakingTestAudio(seed = 0): string {
  const index = Math.abs(seed) % SPEAKING_TEST_AUDIO_URLS.length;
  return SPEAKING_TEST_AUDIO_URLS[index];
}

/** Resolve examiner audio — uses test sample when question has no audio_url. */
export function getSpeakingAudioPublicUrl(audioRef?: string | null): string | null {
  if (!audioRef?.trim()) return null;
  const trimmed = audioRef.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("listening/") || trimmed.startsWith("legacy-listening/")) {
    return `${SUPABASE_URL}/storage/v1/object/public/listening-audio/${trimmed.replace(/^legacy-listening\//, "")}`;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/speaking-audio/${trimmed}`;
}

export function getSpeakingExaminerAudioUrl(
  audioUrl?: string | null,
  seed = 0,
): string {
  return getSpeakingAudioPublicUrl(audioUrl) ?? pickSpeakingTestAudio(seed);
}
