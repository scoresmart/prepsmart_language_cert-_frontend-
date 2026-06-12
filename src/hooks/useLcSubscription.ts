import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { LcSubscription } from "@/types/lc";

import { isRecoverableDbError } from "@/lib/supabase/errors";

export function useLcSubscriptions(userId: string | undefined) {
  return useQuery({
    queryKey: ["lc", "subscriptions", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId as string)
        .order("current_period_end", { ascending: false });
      if (error) {
        if (isRecoverableDbError(error)) {
          console.warn("[PrepSmart LC] subscriptions unavailable:", error);
          return [];
        }
        throw error;
      }
      return (data ?? []) as LcSubscription[];
    },
  });
}
