import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/** Server-side user management lives in the `lc-admin-users` edge function (service role never reaches the browser). */
const FUNCTION_NAME = "lc-admin-users";

export type AdminUserScope = "lc" | "all";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "admin" | "tutor" | "student";
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
  courses: string[];
  lc_access: { status: "active" | "paused" | "expired"; course_expiry_at: string | null } | null;
};

export type AdminUserList = { users: AdminUserRow[]; total: number; page: number; pageSize: number };

export type CreateAdminUserInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  grantAccess: boolean;
  expiry?: string | null;
};

async function call<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body: payload });
  if (error) {
    let message = error.message;
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      if (body?.error) message = body.error;
    }
    throw new Error(message);
  }
  if (data && data.success === false) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export const adminUsersApi = {
  list: (params: { scope: AdminUserScope; search: string; page: number }) =>
    call<AdminUserList>({ action: "list", ...params }),
  create: (input: CreateAdminUserInput) => call<{ user: { id: string; email: string } }>({ action: "create", ...input }),
  setPassword: (userId: string, password: string) => call<void>({ action: "set_password", userId, password }),
  setAccess: (userId: string, enabled: boolean) => call<void>({ action: "set_access", userId, enabled }),
  remove: (userId: string) => call<void>({ action: "delete", userId }),
};
