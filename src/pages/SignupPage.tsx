import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthContext";

const schema = z
  .object({
    fullName: z.string().min(2, "At least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords must match" });

type Form = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "", confirm: "" },
  });

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const onSubmit = form.handleSubmit(async (values) => {
    if (!agreed) {
      toast.error("Please agree to the Terms & Conditions and Privacy Policy");
      return;
    }
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${origin}/dashboard`,
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Welcome to PrepSmart LC!");
      navigate("/dashboard", { replace: true });
      return;
    }
    toast.error(
      "Sign-up did not return a session. In Supabase: Authentication > Providers > Email > disable Confirm email, then try again.",
      { duration: 10_000 },
    );
  });

  return (
    <div
      className="relative min-h-dvh flex items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 70% 20%, rgba(0,210,210,0.18) 0%, transparent 55%), radial-gradient(ellipse at 30% 80%, rgba(0,100,180,0.12) 0%, transparent 50%), #050a14",
      }}
    >
      {/* Light rays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "conic-gradient(from 200deg at 85% 5%, rgba(0,220,220,0.22) 0deg, transparent 40deg, transparent 320deg, rgba(0,180,220,0.12) 360deg)",
        }}
      />
      {/* Stars */}
      <div className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 60% 70%, white, transparent), radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.8), transparent), radial-gradient(1.5px 1.5px at 40% 50%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 70% 40%, white, transparent), radial-gradient(1px 1px at 10% 60%, rgba(255,255,255,0.7), transparent)" }}
      />

      <div className="relative z-10 flex w-full max-w-5xl items-center justify-between gap-10 px-8 py-10">
        {/* Left branding */}
        <div className="hidden lg:flex flex-col gap-6 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" className="h-10 w-10 object-contain" alt="PrepSmart LC" />
            <span className="text-white font-bold text-lg tracking-wide">PREP<span className="text-[#00d4d4]">SMART</span> <span className="text-[#00d4d4] font-extrabold">LC</span></span>
          </div>

          <div
            className="mb-6 flex h-36 w-36 items-center justify-center"
            style={{
              filter: "drop-shadow(0 0 24px rgba(0,200,200,0.45)) drop-shadow(0 0 48px rgba(0,120,180,0.2))",
            }}
          >
            <img src="/logo.png" className="h-36 w-36 object-contain" alt="PrepSmart LC" />
          </div>

          <h1 className="text-5xl font-extrabold leading-tight text-white">
            Join PrepSmart <span className="text-[#00d4d4]">LC</span><br />
            Today
          </h1>
          <p className="text-[#7ab8c8] text-base max-w-sm">
            Practice Language Cert like a real exam — create your free account and start mastering LanguageCert with AI-powered practice sessions.
          </p>
        </div>

        {/* Right: Sign-up card */}
        <div className="w-full max-w-md flex-shrink-0">
          <div className="rounded-2xl bg-white px-8 py-8 shadow-2xl">
            {/* Logo */}
            <div className="flex flex-col items-center mb-5">
              <img src="/logo.png" className="mb-3 h-16 w-16 object-contain" alt="PrepSmart LC" />
              <h2 className="text-xl font-bold text-gray-900">
                Create <span className="text-[#00b8b8]">Account</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">PrepSmart LC — Practice Language Cert like a real exam</p>
            </div>

            <form className="space-y-3.5" onSubmit={onSubmit}>
              {/* Full name */}
              <div className="relative">
                <Input
                  id="fullName"
                  placeholder="Full name"
                  autoComplete="name"
                  className="pr-10 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                  {...form.register("fullName")}
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                {form.formState.errors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  className="pr-10 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                  {...form.register("email")}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="new-password"
                  className="pr-10 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                  {...form.register("password")}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {form.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Confirm password */}
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="pr-10 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400"
                  {...form.register("confirm")}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirm(p => !p)} tabIndex={-1}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {form.formState.errors.confirm && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.confirm.message}</p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-500 select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#00b8b8]"
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" className="text-[#00b8b8] hover:underline">Terms &amp; Conditions</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-[#00b8b8] hover:underline">Privacy Policy</Link>
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-70"
                style={{ background: "linear-gradient(90deg, #00b8b8, #00d4d4)" }}
              >
                {form.formState.isSubmitting ? "Creating account…" : "Sign Up"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-gray-400">or continue with</span>
              </div>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
                if (error) toast.error(error.message);
              }}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <p className="mt-5 text-center text-xs text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-[#00b8b8] font-semibold hover:underline">
                Sign In Now!
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
