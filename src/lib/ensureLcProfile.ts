import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { isRecoverableDbError } from "@/lib/supabase/errors";

const ADMIN_EMAILS = ["contact@scoresmartpte.com"];

/** Create user_profiles row on first LC login (avoids LMS-wide auth triggers). */
export async function ensureLcProfile(user: User): Promise<void> {
  const { data, error } = await supabase.from("user_profiles").select("id, role").eq("id", user.id).maybeSingle();
  if (error) {
    if (isRecoverableDbError(error)) {
      console.warn("[PrepSmart LC] user_profiles not available yet:", error);
      return;
    }
    throw error;
  }

  const email = user.email;
  if (!email) return;

  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

  if (data) {
    // Upgrade to admin if needed
    if (isAdmin && data.role !== "admin") {
      await supabase.from("user_profiles").update({ role: "admin" }).eq("id", user.id);
    }
    return;
  }

  const { error: upsertError } = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      email,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? email.split("@")[0],
      role: isAdmin ? "admin" : "user",
    },
    { onConflict: "id" },
  );
  if (upsertError) {
    if (isRecoverableDbError(upsertError)) {
      console.warn("[PrepSmart LC] Could not create user_profiles:", upsertError);
      return;
    }
    throw upsertError;
  }
}
