import type { User } from "@supabase/supabase-js";

/** Emails that always receive LC admin panel access. */
export const ADMIN_EMAILS = ["contact@scoresmartpte.com", "kulmeetgamingpoint@gmail.com", "singhkulmeet67@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return ADMIN_EMAILS.includes((email ?? "").toLowerCase());
}

export function isAdminUser(
  user: User | null | undefined,
  profile?: { role?: string | null } | null,
): boolean {
  if (!user) return false;
  if (isAdminEmail(user.email)) return true;
  return profile?.role === "admin";
}
