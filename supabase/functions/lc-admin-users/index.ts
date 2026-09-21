// Admin user management for the PrepSmart LC admin panel.
// Deployed to Supabase project sepzceaicoldqhyxxzff as `lc-admin-users` (verify_jwt = true).
// `change_own_password` is open to any signed-in user for their own account; every other action
// requires the caller to be an admin (profiles.role = 'admin' or an LC admin email).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Keep in sync with src/lib/adminAccess.ts */
const ADMIN_EMAILS = ["contact@scoresmartpte.com", "scoresmartpte@gmail.com"];
const LC_SUBJECT = "Language Cert";
const PAGE_SIZE = 50;
const MIN_PASSWORD = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fail(message: string, status = 400) {
  return json({ success: false, error: message }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Method not allowed", 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- Authenticate caller -------------------------------------------------
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return fail("Unauthorized", 401);
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const caller = authData?.user;
  if (authError || !caller) return fail("Unauthorized", 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const action = String(body.action ?? "");

  /** Latest change per user; the admin Users page shows it. Failure here must not undo a successful password change. */
  async function recordPasswordChange(userId: string, changedBy: "user" | "admin") {
    const { error } = await admin.from("lc_password_changes").upsert(
      {
        user_id: userId,
        changed_at: new Date().toISOString(),
        changed_by: changedBy,
        changed_by_admin_id: changedBy === "admin" ? caller!.id : null,
      },
      { onConflict: "user_id" },
    );
    if (error) console.error("lc_password_changes upsert failed", error);
  }

  // --- Self-service (any signed-in user, own account only) -------------------
  if (action === "change_own_password") {
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    if (newPassword.length < MIN_PASSWORD) return fail(`New password must be at least ${MIN_PASSWORD} characters`);

    // Google-only accounts have no password to confirm; they're already authenticated by their session.
    const providers = (caller.app_metadata?.providers as string[] | undefined) ?? [caller.app_metadata?.provider];
    const hasPassword = providers.includes("email");
    if (hasPassword) {
      if (!currentPassword) return fail("Enter your current password");
      if (currentPassword === newPassword) return fail("New password must be different from your current password");
      const verifier = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error: verifyError } = await verifier.auth.signInWithPassword({
        email: caller.email ?? "",
        password: currentPassword,
      });
      if (verifyError) {
        return fail(/rate|too many/i.test(verifyError.message) ? "Too many attempts. Please wait a minute and try again." : "Current password is incorrect");
      }
    }

    const { error } = await admin.auth.admin.updateUserById(caller.id, { password: newPassword });
    if (error) return fail(error.message);
    await recordPasswordChange(caller.id, "user");
    return json({ success: true });
  }

  // --- Everything below is admin-only ---------------------------------------
  const { data: callerProfile } = await admin.from("profiles").select("role").eq("id", caller.id).maybeSingle();
  const callerIsAdmin =
    callerProfile?.role === "admin" || ADMIN_EMAILS.includes((caller.email ?? "").toLowerCase());
  if (!callerIsAdmin) return fail("Admin access required", 403);

  try {
    switch (action) {
      // ------------------------------------------------------------------ list
      case "list": {
        const scope = body.scope === "all" ? "all" : "lc";
        const page = Math.max(0, Number(body.page ?? 0) || 0);
        const search = String(body.search ?? "").replace(/[,()%*]/g, " ").trim();

        const lcEmbed =
          scope === "lc"
            ? "lc:student_access!inner(subject,status,course_expiry_at,practice_portal_only)"
            : "lc:student_access(subject,status,course_expiry_at,practice_portal_only)";
        let q = admin
          .from("profiles")
          .select(`id,name,email,phone,role,approval_status,created_at,${lcEmbed},courses:student_access(subject),pw:lc_password_changes(changed_at,changed_by)`, {
            count: "exact",
          })
          .eq("lc.subject", LC_SUBJECT)
          .order("created_at", { ascending: false })
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
        if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`);

        const { data, error, count } = await q;
        if (error) throw error;

        const users = (data ?? []).map((p: Record<string, unknown>) => {
          const lc = (p.lc as Array<Record<string, unknown>> | null)?.[0] ?? null;
          return {
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            role: p.role,
            approval_status: p.approval_status,
            created_at: p.created_at,
            courses: ((p.courses as Array<{ subject: string }> | null) ?? []).map((c) => c.subject),
            lc_access: lc ? { status: lc.status, course_expiry_at: lc.course_expiry_at } : null,
            password_changed: (Array.isArray(p.pw) ? p.pw[0] : p.pw) ?? null,
          };
        });
        return json({ success: true, users, total: count ?? users.length, page, pageSize: PAGE_SIZE });
      }

      // ---------------------------------------------------------------- create
      case "create": {
        const email = String(body.email ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");
        const name = String(body.name ?? "").trim();
        const phone = String(body.phone ?? "").trim() || null;
        const grantAccess = body.grantAccess !== false;
        const expiry = body.expiry ? String(body.expiry) : null;

        if (!EMAIL_RE.test(email)) return fail("Enter a valid email address");
        if (!name) return fail("Name is required");
        if (password.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters`);

        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, full_name: name, phone, role: "student", admin_created: true },
        });
        if (createError || !created.user) {
          const msg = createError?.message ?? "Failed to create user";
          return fail(/already|registered|exists/i.test(msg) ? "A user with this email already exists" : msg);
        }
        const userId = created.user.id;

        // handle_new_user trigger normally inserts the profile; upsert keeps this robust if it didn't.
        const { error: profileError } = await admin
          .from("profiles")
          .upsert({ id: userId, email, name, phone, role: "student", approval_status: "approved" }, { onConflict: "id" });
        if (profileError) console.error("profile upsert failed", profileError);
        await recordPasswordChange(userId, "admin");

        if (grantAccess) {
          const { error: accessError } = await admin.from("student_access").upsert(
            {
              student_id: userId,
              subject: LC_SUBJECT,
              status: "active",
              practice_portal_only: true,
              course_start_date: new Date().toISOString().slice(0, 10),
              course_expiry_at: expiry,
            },
            { onConflict: "student_id,subject" },
          );
          if (accessError) console.error("student_access upsert failed", accessError);
        }
        return json({ success: true, user: { id: userId, email } });
      }

      // ---------------------------------------------------------- set_password
      case "set_password": {
        const userId = String(body.userId ?? "");
        const password = String(body.password ?? "");
        if (!userId) return fail("userId is required");
        if (password.length < MIN_PASSWORD) return fail(`Password must be at least ${MIN_PASSWORD} characters`);
        const { error } = await admin.auth.admin.updateUserById(userId, { password });
        if (error) return fail(error.message);
        await recordPasswordChange(userId, "admin");
        return json({ success: true });
      }

      // ------------------------------------------------------------ set_access
      case "set_access": {
        const userId = String(body.userId ?? "");
        const enabled = Boolean(body.enabled);
        if (!userId) return fail("userId is required");

        const { data: existing } = await admin
          .from("student_access")
          .select("id")
          .eq("student_id", userId)
          .eq("subject", LC_SUBJECT)
          .maybeSingle();

        if (existing) {
          const { error } = await admin
            .from("student_access")
            .update({ status: enabled ? "active" : "paused" })
            .eq("id", existing.id);
          if (error) throw error;
        } else if (enabled) {
          const { error } = await admin.from("student_access").insert({
            student_id: userId,
            subject: LC_SUBJECT,
            status: "active",
            practice_portal_only: true,
            course_start_date: new Date().toISOString().slice(0, 10),
          });
          if (error) throw error;
        }
        if (enabled) {
          await admin.from("profiles").update({ approval_status: "approved" }).eq("id", userId);
        }
        return json({ success: true });
      }

      // ---------------------------------------------------------------- delete
      case "delete": {
        const userId = String(body.userId ?? "");
        if (!userId) return fail("userId is required");
        if (userId === caller.id) return fail("You cannot delete your own account");

        const { data: target } = await admin.from("profiles").select("role,email").eq("id", userId).maybeSingle();
        if (target?.role === "admin" || ADMIN_EMAILS.includes(String(target?.email ?? "").toLowerCase())) {
          return fail("Admin accounts cannot be deleted from this panel");
        }

        // Same cleanup order as the platform's existing `delete-user` function.
        const cleanup: Array<[string, () => PromiseLike<{ error: unknown }>]> = [
          ["one_to_one_slots.cancelled_by", () => admin.from("one_to_one_slots").update({ cancelled_by_student_id: null }).eq("cancelled_by_student_id", userId)],
          ["one_to_one_slots.student", () => admin.from("one_to_one_slots").update({ student_id: null, status: "cancelled" }).eq("student_id", userId)],
          ["quad_bookings", () => admin.from("quad_bookings").delete().eq("student_id", userId)],
          ["enrollments", () => admin.from("enrollments").delete().eq("student_id", userId)],
          ["student_tutor_assignments", () => admin.from("student_tutor_assignments").delete().eq("student_id", userId)],
          ["attendance_logs", () => admin.from("attendance_logs").delete().eq("student_id", userId)],
          ["practice_attempts", () => admin.from("practice_attempts").delete().eq("student_id", userId)],
          ["study_plans", () => admin.from("study_plans").delete().eq("student_id", userId)],
          ["ratings", () => admin.from("ratings").delete().eq("student_id", userId)],
          ["student_access", () => admin.from("student_access").delete().eq("student_id", userId)],
        ];
        for (const [label, run] of cleanup) {
          const { error } = await run();
          if (error) console.error(`cleanup ${label} failed`, error);
        }

        const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);
        if (profileError) throw profileError;
        const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
        if (authDeleteError && !/not.?found/i.test(authDeleteError.message)) throw authDeleteError;
        return json({ success: true });
      }

      default:
        return fail(`Unknown action: ${action}`);
    }
  } catch (err) {
    console.error(`lc-admin-users ${action} failed`, err);
    const message =
      err instanceof Error ? err.message : ((err as { message?: string })?.message ?? "Unexpected error");
    return fail(message, 500);
  }
});
