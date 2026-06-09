import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { title: string; description: string };

export function PracticePlaceholder({ title, description }: Props) {
  return (
    <Card className="border-dashed shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <Construction className="size-5" aria-hidden />
          <CardTitle className="text-lg">TODO: question runner UI</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>
          This route is scaffolded for LanguageCert <strong>{title}</strong>. Replace this card with the dialogue /
          rapid-review player when your team drops in the final UI.
        </p>
      </CardContent>
    </Card>
  );
}
