import { BarChart3, MessageCircle, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type RowProps = {
  icon: typeof MessageCircle;
  title: string;
  subtitle: string;
  count: string;
  progress?: number;
  chipClass: string;
};

function Row({ icon: Icon, title, subtitle, count, progress, chipClass }: RowProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg text-white", chipClass)}>
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium leading-tight">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <p className="font-display text-2xl tabular-nums text-foreground">{count}</p>
          </div>
          {progress != null ? (
            <div className="mt-3">
              <Progress value={progress} className="h-1.5" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type ActivitySummaryProps = {
  dialogueDone: number;
  dialogueAvail: number;
  rapidDone: number;
  rapidAvail: number;
  totalAttempts: number;
};

export function ActivitySummary({
  dialogueDone,
  dialogueAvail,
  rapidDone,
  rapidAvail,
  totalAttempts,
}: ActivitySummaryProps) {
  const dProg = dialogueAvail > 0 ? Math.min(100, (dialogueDone / dialogueAvail) * 100) : 0;
  const rProg = rapidAvail > 0 ? Math.min(100, (rapidDone / rapidAvail) * 100) : 0;

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-600 text-white">
          <BarChart3 className="size-4" aria-hidden />
        </div>
        <CardTitle className="text-base font-semibold">Activity summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Row
          icon={MessageCircle}
          title="Dialogues practiced"
          subtitle={`${dialogueDone} completed of ${dialogueAvail} available`}
          count={String(dialogueDone)}
          progress={dialogueAvail ? dProg : 0}
          chipClass="bg-violet-600"
        />
        <Row
          icon={Zap}
          title="Rapid reviews"
          subtitle={`${rapidDone} completed of ${rapidAvail} available`}
          count={String(rapidDone)}
          progress={rapidAvail ? rProg : 0}
          chipClass="bg-amber-500"
        />
        <Row
          icon={Target}
          title="Total attempts"
          subtitle={`${dialogueDone} dialogue · ${rapidDone} rapid review`}
          count={String(totalAttempts)}
          chipClass="bg-emerald-600"
        />
      </CardContent>
    </Card>
  );
}
