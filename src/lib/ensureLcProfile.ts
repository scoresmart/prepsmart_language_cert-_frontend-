import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/** Create `lc.user_profiles` row on first LC login (avoids LMS-wide auth triggers). */
export async function ensureLcProfile(user: User): Promise<void> {
  const { data, error } = await supabase.from("user_profiles").select("id").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (data) return;

  const email = user.email;
  if (!email) return;

  const { error: upsertError } = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      email,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? email.split("@")[0],
      role: "user",
    },
    { onConflict: "id" },
  );
  if (upsertError) throw upsertError;
}
