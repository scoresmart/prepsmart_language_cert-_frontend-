import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { isRecoverableDbError } from "@/lib/supabase/errors";
import { ensureLcProfile } from "@/lib/ensureLcProfile";
import { mapProfilesRowToLcProfile } from "@/lib/mapLcProfile";
import { isAdminEmail } from "@/lib/adminAccess";
import type { LcUserProfile } from "@/types/lc";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: LcUserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<LcUserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileLoading, setProfileLoading] = React.useState(false);

  const loadProfile = React.useCallback(async (u: User) => {
    setProfileLoading(true);
    try {
      await ensureLcProfile(u);
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
      if (error && !isRecoverableDbError(error)) throw error;
      if (error) console.warn("[PrepSmart LC] Profile unavailable:", error);
      if (error || !data) {
        setProfile(
          isAdminEmail(u.email)
            ? {
                id: u.id,
                full_name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? null,
                email: u.email ?? "",
                role: "admin",
                exam_date: null,
                target_level: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : null,
        );
      } else {
        setProfile(mapProfilesRowToLcProfile(data));
      }
    } catch (e) {
      console.error(e);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
      })
      .catch((e) => {
        console.error("[PrepSmart LC] getSession failed:", e);
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    void loadProfile(user);
  }, [user, loadProfile]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  const value = React.useMemo(
    () => ({ user, session, profile, loading, profileLoading, signOut, refreshProfile }),
    [user, session, profile, loading, profileLoading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
