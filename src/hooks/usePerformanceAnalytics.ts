import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  computeModuleAnalytics,
  type ModuleAnalytics,
  type PerformanceModule,
  type PracticeAttemptRow,
} from "@/lib/performanceAnalytics";
import type { PracticeProgress } from "@/hooks/usePracticeProgress";

export type PerformanceAnalytics = {
  overview: ModuleAnalytics;
  modules: Record<PerformanceModule, ModuleAnalytics>;
  attempts: PracticeAttemptRow[];
};

export function usePerformanceAnalytics(enabled: boolean, progress?: PracticeProgress, userId?: string) {
  return useQuery({
    queryKey: ["performance-analytics", userId, progress?.modules],
    enabled,
    queryFn: async (): Promise<PerformanceAnalytics> => {
      const res = await api.practice.myAttempts();
      const attempts = (res.data ?? []) as PracticeAttemptRow[];

      const moduleProgress = (key: PerformanceModule) => ({
        practiced: progress?.modules[key]?.practiced ?? 0,
        total: progress?.modules[key]?.total ?? 0,
      });

      return {
        attempts,
        overview: computeModuleAnalytics(attempts, "overview", {
          practiced: progress?.overall.practiced ?? 0,
          total: progress?.overall.total ?? 0,
        }),
        modules: {
          speaking: computeModuleAnalytics(attempts, "speaking", moduleProgress("speaking")),
          writing: computeModuleAnalytics(attempts, "writing", moduleProgress("writing")),
          reading: computeModuleAnalytics(attempts, "reading", moduleProgress("reading")),
          listening: computeModuleAnalytics(attempts, "listening", moduleProgress("listening")),
        },
      };
    },
    staleTime: 30_000,
  });
}
