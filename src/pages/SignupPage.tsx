import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthContext";

const schema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords must match" });

type Form = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "", confirm: "" },
  });

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const onSubmit = form.handleSubmit(async (values) => {
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
      toast.success("Welcome — opening your dashboard.");
      navigate("/dashboard", { replace: true });
      return;
    }

    toast.error(
      "Sign-up did not return a session. In Supabase Dashboard: Authentication → Providers → Email → disable “Confirm email”, then try again.",
      { duration: 10_000 },
    );
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">Create account</CardTitle>
          <CardDescription>
            You&apos;ll go straight to the portal after sign-up (no email confirmation). Requires that setting in
            Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...form.register("fullName")} autoComplete="name" />
              {form.formState.errors.fullName ? (
                <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} autoComplete="email" />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register("password")} autoComplete="new-password" />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" {...form.register("confirm")} autoComplete="new-password" />
              {form.formState.errors.confirm ? (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating…" : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="text-primary underline-offset-4 hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
