import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type PracticeModuleProgress = {
  total: number;
  practiced: number;
};

export type PracticeProgress = {
  modules: {
    speaking: PracticeModuleProgress;
    writing: PracticeModuleProgress;
    reading: PracticeModuleProgress;
    listening: PracticeModuleProgress;
  };
  overall: PracticeModuleProgress;
};

export function usePracticeProgress(enabled = true) {
  return useQuery({
    queryKey: ["practice-progress"],
    queryFn: async () => {
      const res = await api.practice.progress();
      return res.data;
    },
    enabled,
    staleTime: 60_000,
  });
}
