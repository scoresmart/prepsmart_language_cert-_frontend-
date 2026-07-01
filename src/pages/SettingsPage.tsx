import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
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
          <p className="text-sm text-white/50">Profile and exam targets for your dashboard cards.</p>
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
      </div>
    </div>
  );
}
