import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconClassName: string;
};

export function StatCard({ title, value, subtitle, icon: Icon, iconClassName }: StatCardProps) {
  return (
    <Card className="overflow-hidden shadow-soft">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 font-display text-3xl tracking-tight text-foreground md:text-4xl">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{subtitle}</p>
          </div>
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm md:size-12",
              iconClassName,
            )}
            aria-hidden
          >
            <Icon className="size-5 md:size-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
