import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  { name: "Monthly", price: "AU$49", cadence: "per month", highlight: false },
  { name: "Quarterly", price: "AU$129", cadence: "every 3 months", highlight: true },
  { name: "Annual", price: "AU$399", cadence: "per year", highlight: false },
];

export function PracticePaywall({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <div>
        <h1 className="font-display text-3xl text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An active LC subscription unlocks unlimited practice. Plans mirror other PrepSmart portals — adjust amounts in
          Stripe / billing when you wire checkout (next integration pass).
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={p.highlight ? "border-primary shadow-soft ring-1 ring-primary/20" : "shadow-soft"}
          >
            <CardHeader>
              <CardTitle className="text-lg">{p.name}</CardTitle>
              <CardDescription>{p.cadence}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-display text-3xl text-foreground">{p.price}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  Full dialogue & rapid review bank
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  AI feedback on submissions
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  Progress & analytics
                </li>
              </ul>
              <Button asChild className="w-full" variant={p.highlight ? "default" : "outline"}>
                <Link to="/subscription">Choose plan</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
