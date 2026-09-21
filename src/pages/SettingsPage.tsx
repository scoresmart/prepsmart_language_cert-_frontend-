import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Eye, EyeOff, KeyRound, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { changeOwnPassword } from "@/lib/adminUsersApi";
import { useAuth } from "@/providers/AuthContext";

const schema = z.object({
  full_name: z.string().min(1),
  exam_date: z.string().optional(),
  target_level: z
    .string()
    .refine((v) => v === "" || ["B1", "B2", "C1", "C2"].includes(v), "Pick a level or leave blank"),
});

type Form = z.infer<typeof schema>;

const fieldClass =
  "h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const MIN_PASSWORD = 6;

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-white/85">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={cn(fieldClass, "border-white/15 bg-white/5 pr-10 text-white")}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-white/40 hover:text-white/80"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = React.useState({ current: "", next: "", confirm: "" });

  // Google-only accounts have no password yet; they set one without confirming an old one.
  const providers = (user?.app_metadata?.providers as string[] | undefined) ?? [user?.app_metadata?.provider];
  const hasPassword = providers.includes("email");

  const change = useMutation({
    mutationFn: async () => {
      await changeOwnPassword(pw.current, pw.next);
      // The change signs the account out everywhere; sign this device straight back in.
      const { error } = await supabase.auth.signInWithPassword({ email: user?.email ?? "", password: pw.next });
      return { reSignedIn: !error };
    },
    onSuccess: ({ reSignedIn }) => {
      setPw({ current: "", next: "", confirm: "" });
      if (reSignedIn) {
        toast.success("Password updated. Other devices have been signed out.");
      } else {
        toast.success("Password updated. Please log in with your new password.");
        navigate("/login", { replace: true });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const error =
    pw.next && pw.next.length < MIN_PASSWORD
      ? `New password must be at least ${MIN_PASSWORD} characters`
      : pw.confirm && pw.next !== pw.confirm
        ? "Passwords do not match"
        : hasPassword && pw.current && pw.current === pw.next
          ? "New password must be different from your current password"
          : null;
  const valid =
    (!hasPassword || pw.current.length > 0) &&
    pw.next.length >= MIN_PASSWORD &&
    pw.next === pw.confirm &&
    !(hasPassword && pw.current === pw.next);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/30">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-white">
          <KeyRound className="size-4 text-cyan-400" />
          {hasPassword ? "Change password" : "Set a password"}
        </h2>
        <p className="mt-1 text-sm text-white/45">
          {hasPassword
            ? "You'll stay signed in here; other devices will be signed out."
            : "You signed in with Google. Set a password to also log in with your email."}
        </p>
      </div>

      <form
        className="space-y-5 px-5 py-5 sm:px-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !change.isPending) change.mutate();
        }}
      >
        {hasPassword && (
          <PasswordField
            id="current_password"
            label="Current password"
            value={pw.current}
            onChange={(v) => setPw({ ...pw, current: v })}
            autoComplete="current-password"
          />
        )}
        <PasswordField
          id="new_password"
          label="New password"
          value={pw.next}
          onChange={(v) => setPw({ ...pw, next: v })}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm_password"
          label="Confirm new password"
          value={pw.confirm}
          onChange={(v) => setPw({ ...pw, confirm: v })}
          autoComplete="new-password"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={!valid || change.isPending}
          className="bg-violet-600 text-white hover:bg-violet-700"
        >
          {change.isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const qc = useQueryClient();

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", exam_date: "", target_level: "" },
  });

  React.useEffect(() => {
    if (!profile) return;
    form.reset({
      full_name: profile.full_name ?? "",
      exam_date: profile.exam_date ?? "",
      target_level: profile.target_level ?? "",
    });
  }, [profile, form]);

  const save = useMutation({
    mutationFn: async (values: Form) => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          name: values.full_name,
          exam_deadline: values.exam_date || null,
          target_score: values.target_level || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile saved");
      await refreshProfile();
      await qc.invalidateQueries({ queryKey: ["lc", "dashboard", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="relative min-h-full p-4 md:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 size-80 rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 size-72 rounded-full bg-cyan-600/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
            <Settings className="size-3.5 text-cyan-400" />
            Account
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">Settings</h1>
          <p className="text-sm text-white/50">Profile, exam targets and password.</p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/30">
          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
            <h2 className="text-base font-bold text-white">Profile</h2>
            <p className="mt-1 text-sm text-white/45">Updates sync to your profile.</p>
          </div>

          <form
            className="space-y-5 px-5 py-5 sm:px-6"
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
          >
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-semibold text-white/85">
                Full name
              </Label>
              <Input
                id="full_name"
                className={cn(fieldClass, "border-white/15 bg-white/5 text-white")}
                {...form.register("full_name")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam_date" className="text-sm font-semibold text-white/85">
                Exam date
              </Label>
              <Input
                id="exam_date"
                type="date"
                className={cn(fieldClass, "[color-scheme:dark] border-white/15 bg-white/5 text-white")}
                {...form.register("exam_date")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_level" className="text-sm font-semibold text-white/85">
                Target CEFR level
              </Label>
              <div className="relative">
                <select
                  id="target_level"
                  className={cn(fieldClass, "appearance-none pr-9")}
                  {...form.register("target_level")}
                >
                  <option value="" className="bg-[#111827] text-white">
                    Not set
                  </option>
                  <option value="B1" className="bg-[#111827] text-white">
                    B1
                  </option>
                  <option value="B2" className="bg-[#111827] text-white">
                    B2
                  </option>
                  <option value="C1" className="bg-[#111827] text-white">
                    C1
                  </option>
                  <option value="C2" className="bg-[#111827] text-white">
                    C2
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={save.isPending}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </div>

        <ChangePasswordCard />
      </div>
    </div>
  );
}
