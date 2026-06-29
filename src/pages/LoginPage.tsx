import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase, supabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthContext";
import { isAdminEmail } from "@/lib/adminAccess";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  if (!loading && user) {
    const isAdmin = isAdminEmail(user.email);
    return <Navigate to={isAdmin ? "/admin/dashboard" : from} replace />;
  }

  const signingInRef = useRef(false);

  const onSubmit = form.handleSubmit(async (values) => {
    if (signingInRef.current) return;
    signingInRef.current = true;
    try {
      if (!supabaseConfigured) {
        toast.error("Login is unavailable: Supabase env vars are missing on this deployment.");
        return;
      }
      if (!agreed) {
        toast.error("Please agree to the Terms & Conditions and Privacy Policy");
        return;
      }
      const { error, data } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password.trim(),
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Signed in successfully!");
      const isAdmin = isAdminEmail(data.user?.email);
      navigate(isAdmin ? "/admin/dashboard" : from, { replace: true });
    } finally {
      signingInRef.current = false;
    }
  });

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div
      className="relative min-h-dvh flex items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 70% 20%, rgba(0,210,210,0.18) 0%, transparent 55%), radial-gradient(ellipse at 30% 80%, rgba(0,100,180,0.12) 0%, transparent 50%), #050a14",
      }}
    >
      {/* Animated light rays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "conic-gradient(from 200deg at 85% 5%, rgba(0,220,220,0.22) 0deg, transparent 40deg, transparent 320deg, rgba(0,180,220,0.12) 360deg)",
        }}
      />
      {/* Stars */}
      <div className="pointer-events-none absolute inset-0 opacity-60"
        style={{ backgroundImage: "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 60% 70%, white, transparent), radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.8), transparent), radial-gradient(1.5px 1.5px at 40% 50%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 70% 40%, white, transparent), radial-gradient(1px 1px at 10% 60%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 90% 80%, white, transparent), radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.5), transparent)" }}
      />

      <div className="relative z-10 flex w-full max-w-5xl items-center justify-between gap-10 px-8 py-10">
        {/* Left branding */}
        <div className="hidden lg:flex flex-col gap-6 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" className="h-10 w-10 object-contain" alt="PrepSmart LC" />
            <span className="text-white font-bold text-lg tracking-wide">PREP<span className="text-[#00d4d4]">SMART</span> <span className="text-[#00d4d4] font-extrabold">LC</span></span>
          </div>

          {/* Big hero logo */}
          <div
            className="mb-6 flex h-36 w-36 items-center justify-center"
            style={{
              filter: "drop-shadow(0 0 24px rgba(0,200,200,0.45)) drop-shadow(0 0 48px rgba(0,120,180,0.2))",
            }}
          >
            <img src="/logo.png" className="h-36 w-36 object-contain" alt="PrepSmart LC" />
          </div>

          <h1 className="text-5xl font-extrabold leading-tight text-white">
            Practice Language Cert<br />
            Like a <span className="text-[#00d4d4]">Real Exam</span>
          </h1>
          <p className="text-[#7ab8c8] text-base max-w-sm">
            The most advanced PrepSmart LC practice platform — sharpen your LanguageCert skills with AI-powered sessions, real exam simulations, and instant feedback.
          </p>
        </div>

        {/* Right: Sign-in card */}
        <div className="w-full max-w-md flex-shrink-0">
          <div className="rounded-2xl bg-white px-8 py-8 shadow-2xl">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <img src="/logo.png" className="mb-3 h-16 w-16 object-contain" alt="PrepSmart LC" />
              <h2 className="text-xl font-bold text-gray-900">
                Student <span className="text-[#00b8b8]">Sign In</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">PrepSmart LC — Practice Language Cert like a real exam</p>
            </div>

            {!supabaseConfigured && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                Login is not configured on this deployment. In Vercel, set{" "}
                <span className="font-semibold">VITE_SUPABASE_URL</span> and{" "}
                <span className="font-semibold">VITE_SUPABASE_ANON_KEY</span>, then redeploy.
              </div>
            )}

            <form className="space-y-4" onSubmit={onSubmit}>
              {/* Email */}
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  className="pr-10 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#00b8b8] focus:ring-[#00b8b8]"
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
                  autoComplete="current-password"
                  className="pr-10 rounded-xl border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:border-[#00b8b8] focus:ring-[#00b8b8]"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {form.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 accent-[#00b8b8]"
                  />
                  Remember Me
                </label>
                <Link to="/forgot-password" className="text-[#00b8b8] hover:underline font-medium">
                  Forgot password?
                </Link>
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

              {/* Sign in button */}
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-70"
                style={{ background: "linear-gradient(90deg, #00b8b8, #00d4d4)" }}
              >
                {form.formState.isSubmitting ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
                <span className="bg-white px-2">or continue with</span>
              </div>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
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

            {/* Sign up link */}
            <p className="mt-5 text-center text-xs text-gray-500">
              If you don&apos;t have an account, you can{" "}
              <Link to="/signup" className="text-[#00b8b8] font-semibold hover:underline">
                Sign Up Now!
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

