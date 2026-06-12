import { useQuery } from "@tanstack/react-query";
import { fetchPracticeQuestions, getQuestionType } from "@/lib/practiceQuestions";

export function usePracticeQuestions(section: string, part: string) {
  const query = useQuery({
    queryKey: ["practice-questions", section, part],
    queryFn: () => fetchPracticeQuestions(section, part),
    enabled: !!section && !!part,
  });

  return {
    questions: query.data ?? [],
    total: query.data?.length ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    questionType: getQuestionType(section, part),
  };
}

export function usePracticeAttempts(questionType: string) {
  return useQuery({
    queryKey: ["practice-attempts", questionType],
    queryFn: async () => {
      const res = await import("@/lib/api").then((m) => m.api.practice.myAttempts(questionType));
      return res.data ?? [];
    },
    enabled: !!questionType,
  });
}
