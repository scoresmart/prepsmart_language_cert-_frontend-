import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { title: string; description: string };

export function PracticePlaceholder({ title, description }: Props) {
  return (
    <Card className="border-white/10 border-dashed bg-[#1a1a2e]/90 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 text-cyan-400">
          <Construction className="size-5" aria-hidden />
          <CardTitle className="text-lg text-white">PrepSmart LC — {title}</CardTitle>
        </div>
        <CardDescription className="text-white/50">{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-white/60">
        <p>
          This route is scaffolded for LanguageCert <strong className="text-white">{title}</strong>. Replace this card with the question runner when your team drops in the final UI.
        </p>
      </CardContent>
    </Card>
  );
}
