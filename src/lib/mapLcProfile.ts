import type { LcUserProfile, CefrLevel } from "@/types/lc";

type ProfilesRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  exam_deadline?: string | null;
  target_score?: string | null;
  created_at?: string;
  updated_at?: string;
};

function parseTargetLevel(value: string | null | undefined): CefrLevel | null {
  if (!value) return null;
  const v = value.toUpperCase();
  if (v === "B1" || v === "B2" || v === "C1" || v === "C2") return v;
  return null;
}

export function mapProfilesRowToLcProfile(row: ProfilesRow): LcUserProfile {
  return {
    id: row.id,
    full_name: row.name ?? null,
    email: row.email ?? "",
    role: row.role === "admin" ? "admin" : "user",
    exam_date: row.exam_deadline ?? null,
    target_level: parseTargetLevel(row.target_score),
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}
