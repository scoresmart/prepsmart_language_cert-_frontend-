import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/adminAccess";
import { isRecoverableDbError } from "@/lib/supabase/errors";

/** Ensure `profiles` row exists and admin emails have admin role (same table as backend API). */
export async function ensureLcProfile(user: User): Promise<void> {
  const email = user.email;
  if (!email) return;

  const { data, error } = await supabase.from("profiles").select("id, role").eq("id", user.id).maybeSingle();
  if (error) {
    if (isRecoverableDbError(error)) {
      console.warn("[PrepSmart LC] profiles not available yet:", error);
      return;
    }
    throw error;
  }

  const shouldBeAdmin = isAdminEmail(email);

  if (data) {
    if (shouldBeAdmin && data.role !== "admin") {
      await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
    }
    return;
  }

  const { error: insertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      name: (user.user_metadata?.full_name as string | undefined) ?? email.split("@")[0],
      role: shouldBeAdmin ? "admin" : "student",
      approval_status: "approved",
    },
    { onConflict: "id" },
  );

  if (insertError) {
    if (isRecoverableDbError(insertError)) {
      console.warn("[PrepSmart LC] Could not create profiles row:", insertError);
      return;
    }
    throw insertError;
  }
}
