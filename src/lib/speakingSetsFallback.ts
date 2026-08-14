import type { SpeakingSet } from "@/lib/api";
import { supabase, supabaseConfigured } from "@/lib/supabase/client";
import { normalizeSpeakingSetStructure } from "@/lib/speakingSetStructure";

const SELECT = "id, title, level, sort_order, is_published, structure, created_at, updated_at";

/**
 * Reads published speaking sets straight from Supabase.
 *
 * Used only when the backend API is unreachable — mainly local development,
 * where the Railway service on :5000 is not running. RLS on `speaking_sets`
 * already allows `is_published = true OR auth.uid() IS NOT NULL`, so this needs
 * no extra privileges beyond the session the browser already holds.
 *
 * Returns [] rather than throwing: the caller keeps the backend's error message
 * when this cannot help either.
 */
export async function fetchSpeakingSetsFromSupabase(): Promise<SpeakingSet[]> {
  if (!supabaseConfigured) return [];

  const { data, error } = await supabase
    .from("speaking_sets")
    .select(SELECT)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[PrepSmart LC] Supabase speaking-set fallback failed:", error.message);
    return [];
  }

  type Row = Omit<SpeakingSet, "structure"> & { structure: unknown };

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    title: row.title,
    level: row.level,
    sort_order: row.sort_order ?? 0,
    is_published: row.is_published,
    // Sets authored before the v2 editor are stored in the legacy shape;
    // normalising here keeps the rest of the app on one format.
    structure: normalizeSpeakingSetStructure(row.structure),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

// ---------------------------------------------------------------- admin

type Row = Omit<SpeakingSet, "structure"> & { structure: unknown };

const toSet = (row: Row): SpeakingSet => ({
  id: row.id,
  title: row.title,
  level: row.level,
  sort_order: row.sort_order ?? 0,
  is_published: row.is_published,
  structure: normalizeSpeakingSetStructure(row.structure),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

/**
 * Admin-side Supabase fallbacks.
 *
 * Unlike the read path these throw on failure — an admin who thinks they saved
 * a set must never be told it worked when it did not. RLS restricts writes to
 * profiles with role admin or tutor.
 */
export async function adminListSpeakingSetsFromSupabase(): Promise<SpeakingSet[]> {
  const { data, error } = await supabase
    .from("speaking_sets")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(toSet);
}

export type SpeakingSetPayload = {
  title: string;
  level: string;
  sort_order: number;
  is_published: boolean;
  structure: unknown;
};

export async function adminCreateSpeakingSetInSupabase(payload: SpeakingSetPayload): Promise<SpeakingSet> {
  const { data, error } = await supabase.from("speaking_sets").insert(payload).select(SELECT).single();
  if (error) throw new Error(error.message);
  return toSet(data as Row);
}

export async function adminUpdateSpeakingSetInSupabase(
  id: string,
  payload: Partial<SpeakingSetPayload>,
): Promise<SpeakingSet> {
  const { data, error } = await supabase
    .from("speaking_sets")
    .update(payload)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw new Error(error.message);
  return toSet(data as Row);
}

export async function adminDeleteSpeakingSetInSupabase(id: string): Promise<void> {
  const { error } = await supabase.from("speaking_sets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** True when the backend API is unreachable, as opposed to rejecting the call. */
export function isNetworkFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /failed to fetch|network error|networkerror|load failed|econnrefused|port 5000/i.test(msg);
}
