import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";

export function PracticePaywall({ title }: { title: string }) {
  return (
    <div className="space-y-6 py-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-white/55">
          An active PrepSmart LC Pro subscription unlocks unlimited practice across all Language Cert tasks.
        </p>
      </div>
      <SubscriptionPlans compact />
    </div>
  );
}
