import { useQuery } from "@tanstack/react-query";
import { fetchPracticeQuestions, getQuestionType } from "@/lib/practiceQuestions";
import { useAuth } from "@/providers/AuthContext";

export function usePracticeQuestions(section: string, part: string) {
  const { session, loading: authLoading } = useAuth();
  const hasToken = Boolean(session?.access_token);

  const query = useQuery({
    queryKey: ["practice-questions", section, part],
    queryFn: () => fetchPracticeQuestions(section, part),
    enabled: !!section && !!part && !authLoading && hasToken,
    staleTime: 5 * 60_000,
    retry: (count, error) => {
      if (error instanceof Error && /authentication|sign in|expired token/i.test(error.message)) {
        return false;
      }
      return count < 2;
    },
  });

  return {
    questions: query.data ?? [],
    total: query.data?.length ?? 0,
    isLoading: authLoading || (hasToken && query.isPending),
    isError: query.isError,
    error: query.error,
    needsSignIn: !authLoading && !hasToken,
    refetch: query.refetch,
    questionType: getQuestionType(section, part),
  };
}

export function usePracticeAttempts(questionType: string) {
  const { session, loading: authLoading } = useAuth();
  const hasToken = Boolean(session?.access_token);

  return useQuery({
    queryKey: ["practice-attempts", questionType],
    queryFn: async () => {
      const res = await import("@/lib/api").then((m) => m.api.practice.myAttempts(questionType));
      return res.data ?? [];
    },
    enabled: !!questionType && !authLoading && hasToken,
  });
}
