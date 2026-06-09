import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, eachDayOfInterval, format, isSameDay, startOfDay, subDays } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import type { LcAttempt, LcSubscription, LcUserProfile } from "@/types/lc";
import { pickAccessibleSubscription } from "@/lib/subscription";

export function useDashboardStats(userId: string | undefined, profile: LcUserProfile | null) {
  return useQuery({
    queryKey: ["lc", "dashboard", userId, profile?.exam_date],
    enabled: Boolean(userId),
    queryFn: async () => {
      const uid = userId as string;

      const [subsRes, attemptsRes, dialogueCountRes, rapidCountRes] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", uid),
        supabase
          .from("attempts")
          .select("id,question_type,score,max_score,completed_at")
          .eq("user_id", uid)
          .order("completed_at", { ascending: false }),
        supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("type", "dialogue")
          .eq("is_published", true),
        supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("type", "rapid_review")
          .eq("is_published", true),
      ]);

      if (subsRes.error) throw subsRes.error;
      if (attemptsRes.error) throw attemptsRes.error;
      if (dialogueCountRes.error) throw dialogueCountRes.error;
      if (rapidCountRes.error) throw rapidCountRes.error;

      const subscriptions = (subsRes.data ?? []) as LcSubscription[];
      const attempts = (attemptsRes.data ?? []) as Pick<LcAttempt, "id" | "question_type" | "score" | "max_score" | "completed_at">[];

      const today = startOfDay(new Date());
      const todayAttempts = attempts.filter((a) => a.score != null && isSameDay(new Date(a.completed_at), today));
      const todayAvg =
        todayAttempts.length > 0
          ? todayAttempts.reduce((s, a) => s + Number(a.score), 0) / todayAttempts.length
          : null;

      const last7 = eachDayOfInterval({ start: subDays(today, 6), end: today });
      const weekPoints = last7.map((day) => {
        const dayAttempts = attempts.filter((a) => a.score != null && isSameDay(new Date(a.completed_at), day));
        const avg =
          dayAttempts.length > 0
            ? dayAttempts.reduce((s, a) => s + Number(a.score), 0) / dayAttempts.length
            : null;
        return { date: day, label: format(day, "EEE"), avg };
      });

      const last7Scores = attempts.filter((a) => a.score != null && new Date(a.completed_at) >= subDays(today, 6));
      const sevenDayAvg =
        last7Scores.length > 0
          ? last7Scores.reduce((s, a) => s + Number(a.score), 0) / last7Scores.length
          : null;

      const scored = attempts.filter((a) => a.score != null);
      const highest = scored.length ? Math.max(...scored.map((a) => Number(a.score))) : null;

      const dialogueDone = attempts.filter((a) => a.question_type === "dialogue").length;
      const rapidDone = attempts.filter((a) => a.question_type === "rapid_review").length;
      const dialogueAvail = dialogueCountRes.count ?? 0;
      const rapidAvail = rapidCountRes.count ?? 0;

      const activeSub = pickAccessibleSubscription(subscriptions);
      let daysUntilExam: number | null = null;
      if (profile?.exam_date) {
        daysUntilExam = differenceInCalendarDays(new Date(profile.exam_date), today);
      }

      return {
        subscriptions,
        activeSubscription: activeSub,
        attempts,
        todayAvg,
        sevenDayAvg,
        weekPoints,
        highest,
        dialogueDone,
        rapidDone,
        dialogueAvail,
        rapidAvail,
        totalAttempts: attempts.length,
        daysUntilExam,
      };
    },
  });
}
