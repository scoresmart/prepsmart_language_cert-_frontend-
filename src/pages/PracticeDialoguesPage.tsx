import { useAuth } from "@/providers/AuthContext";
import { useLcSubscriptions } from "@/hooks/useLcSubscription";
import { hasLcPracticeAccess } from "@/lib/subscription";
import { PracticePaywall } from "@/components/practice/PracticePaywall";
import { PracticePlaceholder } from "@/components/practice/PracticePlaceholder";

export function PracticeDialoguesPage() {
  const { user } = useAuth();
  const { data: subs, isLoading } = useLcSubscriptions(user?.id);
  const unlocked = hasLcPracticeAccess(subs);

  if (isLoading) return <p className="text-sm text-muted-foreground">Checking subscription…</p>;
  if (!unlocked) return <PracticePaywall title="Dialogues" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Dialogues</h1>
        <p className="mt-1 text-sm text-muted-foreground">B1–C2 speaking-style practice (placeholder).</p>
      </div>
      <PracticePlaceholder title="dialogues" description="Listening + responding flows will mount here." />
    </div>
  );
}
