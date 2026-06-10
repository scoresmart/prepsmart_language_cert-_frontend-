import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const ADMIN_EMAILS = ["contact@scoresmartpte.com"];

/** Create `lc.user_profiles` row on first LC login (avoids LMS-wide auth triggers). */
export async function ensureLcProfile(user: User): Promise<void> {
  const { data, error } = await supabase.from("user_profiles").select("id, role").eq("id", user.id).maybeSingle();
  if (error) throw error;

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
  if (upsertError) throw upsertError;
}
