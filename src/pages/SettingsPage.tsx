import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        .from("user_profiles")
        .update({
          full_name: values.full_name,
          exam_date: values.exam_date || null,
          target_level: values.target_level || null,
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile and exam targets for your dashboard cards.</p>
      </div>
      <Card className="max-w-lg shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Updates sync to <code className="text-xs">lc.user_profiles</code>.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
          >
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...form.register("full_name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam_date">Exam date</Label>
              <Input id="exam_date" type="date" {...form.register("exam_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_level">Target CEFR level</Label>
              <select
                id="target_level"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                {...form.register("target_level")}
              >
                <option value="">Not set</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
