import { supabase } from "@/lib/supabase/client";
import type { RealtimeExamSummary, RealtimeTranscriptTurn } from "@/lib/realtimeExamClient";
import type { SpeakingScoreResult } from "@/lib/scoringTypes";

/**
 * Database side of the live speaking examiner.
 *
 * - `lc_speaking_candidate_profiles`: what the examiner has learned about the
 *   candidate (name, where they live, job, …). Loaded before every test so the
 *   examiner never asks for the same thing twice across questions.
 * - `lc_speaking_live_attempts`: one row per test, complete or ended early,
 *   holding the transcript, the per-part recordings and the score.
 * - Storage bucket `lc-speaking-recordings` (private): `<user_id>/<attempt_id>/part-N.webm`.
 *
 * Every call runs as the signed-in candidate under RLS.
 */

const PROFILES = "lc_speaking_candidate_profiles";
const ATTEMPTS = "lc_speaking_live_attempts";
const BUCKET = "lc-speaking-recordings";

export type CandidateProfile = Record<string, string>;

export type LiveRecordingRef = {
  part: number;
  path: string;
  mime: string;
  bytes: number;
};

/** A transcript turn as stored, tagged with the part it belongs to (0 = intro/closing). */
export type LiveTranscriptTurn = RealtimeTranscriptTurn & { part?: number };

export type LiveAttemptStatus = "in_progress" | "completed" | "ended_early";

export type LiveAttemptRow = {
  id: string;
  user_id: string;
  set_id: string | null;
  question_number: number | null;
  title: string | null;
  level: string | null;
  session_id: string | null;
  status: LiveAttemptStatus;
  end_reason: string | null;
  parts_reached: number[];
  transcript: LiveTranscriptTurn[];
  recordings: LiveRecordingRef[];
  profile: CandidateProfile;
  summary: RealtimeExamSummary | null;
  score: SpeakingScoreResult | null;
  practice_attempt_id: string | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
};

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// ---------------------------------------------------------------- profile

export async function loadCandidateProfile(): Promise<CandidateProfile> {
  const userId = await currentUserId();
  if (!userId) return {};
  const { data, error } = await supabase
    .from(PROFILES)
    .select("profile")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[speaking] could not load candidate profile:", error.message);
    return {};
  }
  const profile = (data?.profile ?? {}) as CandidateProfile;
  return Object.fromEntries(
    Object.entries(profile).filter(([, v]) => typeof v === "string" && v.trim()),
  );
}

/**
 * Merge the examiner's current view of the candidate into the stored profile.
 *
 * The examiner starts every test from the stored profile and only changes a
 * name or home town when the candidate explicitly corrects it, so its values
 * win — that is how a misheard name gets fixed for every later question.
 */
export async function saveCandidateProfile(next: CandidateProfile): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const clean = Object.fromEntries(
    Object.entries(next).filter(([, v]) => typeof v === "string" && v.trim()),
  );
  if (!Object.keys(clean).length) return;

  const existing = await loadCandidateProfile();
  const merged: CandidateProfile = { ...existing, ...clean };

  const { error } = await supabase
    .from(PROFILES)
    .upsert({ user_id: userId, profile: merged, updated_at: new Date().toISOString() });
  if (error) console.warn("[speaking] could not save candidate profile:", error.message);
}

// --------------------------------------------------------------- attempts

export async function createLiveAttempt(input: {
  setId: string | null;
  questionNumber: number;
  title: string | null;
  level: string | null;
}): Promise<string | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from(ATTEMPTS)
    .insert({
      user_id: userId,
      set_id: input.setId,
      question_number: input.questionNumber,
      title: input.title,
      level: input.level,
      status: "in_progress",
    })
    .select("id")
    .single();
  if (error) {
    console.warn("[speaking] could not create live attempt:", error.message);
    return null;
  }
  return (data as { id: string }).id;
}

export async function updateLiveAttempt(
  id: string,
  patch: Partial<
    Pick<
      LiveAttemptRow,
      | "session_id"
      | "status"
      | "end_reason"
      | "parts_reached"
      | "transcript"
      | "recordings"
      | "profile"
      | "summary"
      | "score"
      | "practice_attempt_id"
      | "duration_ms"
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from(ATTEMPTS)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.warn("[speaking] could not update live attempt:", error.message);
}

export async function listLiveAttempts(opts: { setId?: string | null; limit?: number } = {}): Promise<LiveAttemptRow[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  let query = supabase
    .from(ATTEMPTS)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.setId) query = query.eq("set_id", opts.setId);
  const { data, error } = await query;
  if (error) {
    console.warn("[speaking] could not list live attempts:", error.message);
    return [];
  }
  return (data ?? []) as LiveAttemptRow[];
}

// ------------------------------------------------------------- recordings

function extensionFor(mime: string): string {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("aac")) return "m4a";
  return "webm";
}

export async function uploadPartRecording(
  attemptId: string,
  part: number,
  blob: Blob,
): Promise<LiveRecordingRef | null> {
  const userId = await currentUserId();
  if (!userId || blob.size === 0) return null;
  const mime = blob.type || "audio/webm";
  const path = `${userId}/${attemptId}/part-${part}.${extensionFor(mime)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: mime,
    upsert: true,
  });
  if (error) {
    console.warn(`[speaking] could not upload part ${part} recording:`, error.message);
    return null;
  }
  return { part, path, mime, bytes: blob.size };
}

export async function recordingSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}
