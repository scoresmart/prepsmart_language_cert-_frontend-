import { PracticePaywall } from "@/components/practice/PracticePaywall";
import { PracticePlaceholder } from "@/components/practice/PracticePlaceholder";
import { hasLcPracticeAccess } from "@/lib/subscription";
import { useLcSubscriptions } from "@/hooks/useLcSubscription";
import { useAuth } from "@/providers/AuthContext";

export function PracticeRapidPage() {
  const { user } = useAuth();
  const { data: subs, isLoading } = useLcSubscriptions(user?.id);
  const unlocked = hasLcPracticeAccess(subs);

  if (isLoading) return <p className="text-sm text-muted-foreground">Checking subscription…</p>;
  if (!unlocked) return <PracticePaywall title="Rapid reviews" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Rapid reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">Short-turn speaking drills (placeholder).</p>
      </div>
      <PracticePlaceholder title="rapid reviews" description="Timed prompts and scoring UI will mount here." />
    </div>
  );
}
