import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Loader2, Mic, User } from "lucide-react";

import { GradeBadge } from "@/components/practice/shared/ScoreCardBadges";
import { REALTIME_PART_LABEL, formatExamClock } from "@/lib/realtimeExamScore";
import {
  listLiveAttempts,
  recordingSignedUrl,
  type LiveAttemptRow,
  type LiveRecordingRef,
  type LiveTranscriptTurn,
} from "@/lib/speakingLiveStore";
import { cn } from "@/lib/utils";

const PART_TITLE: Record<number, string> = {
  1: "Part 1 · Questions",
  2: "Part 2 · Role play",
  3: "Part 3 · Picture",
  4: "Part 4 · Presentation",
};

function statusLabel(row: LiveAttemptRow): { text: string; className: string } {
  if (row.status === "completed") {
    return { text: "Completed", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  if (row.status === "in_progress") {
    return { text: "In progress", className: "border-sky-200 bg-sky-50 text-sky-700" };
  }
  const parts = row.parts_reached?.length ?? 0;
  return {
    text: `Ended early · ${parts} of 4 parts`,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  };
}

function PartRecording({ recording }: { recording: LiveRecordingRef }) {
  const q = useQuery({
    queryKey: ["speaking-live-recording", recording.path],
    queryFn: () => recordingSignedUrl(recording.path),
    // Signed URLs last an hour; refresh well before that.
    staleTime: 45 * 60_000,
  });
  if (q.isLoading) {
    return <Loader2 className="size-4 animate-spin text-slate-400" />;
  }
  if (!q.data) return <span className="text-xs text-slate-400">Recording unavailable</span>;
  return <audio controls preload="none" src={q.data} className="h-9 w-full max-w-md" />;
}

function TurnList({ turns }: { turns: LiveTranscriptTurn[] }) {
  return (
    <div className="space-y-1.5">
      {turns.map((turn, i) => (
        <div
          key={`${turn.at}-${i}`}
          className={cn(
            "flex gap-2 rounded-lg px-3 py-2",
            turn.role === "examiner" ? "bg-slate-50" : "bg-indigo-50/70",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
              turn.role === "examiner" ? "bg-slate-200 text-slate-600" : "bg-indigo-500 text-white",
            )}
          >
            {turn.role === "examiner" ? <User className="size-3" /> : <Mic className="size-3" />}
          </span>
          <p className="min-w-0 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
            <span className="mr-1 font-bold text-slate-500">
              {turn.role === "examiner" ? "Examiner:" : "You:"}
            </span>
            {turn.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function LiveAttemptItem({ row, defaultOpen }: { row: LiveAttemptRow; defaultOpen: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const status = statusLabel(row);
  const score = row.score;
  const transcript = Array.isArray(row.transcript) ? row.transcript : [];
  const recordings = Array.isArray(row.recordings) ? row.recordings : [];

  // Group by part; intro and goodbye (part 0) sit with the part next to them.
  const byPart = new Map<number, LiveTranscriptTurn[]>();
  let lastPart = 1;
  for (const turn of transcript) {
    const p = turn.part && turn.part > 0 ? turn.part : lastPart;
    lastPart = p;
    byPart.set(p, [...(byPart.get(p) ?? []), turn]);
  }
  const parts = [1, 2, 3, 4].filter((p) => byPart.has(p) || recordings.some((r) => r.part === p));

  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 md:text-base">
            {row.title ?? `Question ${row.question_number ?? ""}`} · Live test
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {format(new Date(row.created_at), "dd MMM yyyy, HH:mm")}
            {row.duration_ms ? ` · ${formatExamClock(row.duration_ms)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", status.className)}>
            {status.text}
          </span>
          {score ? (
            <span className="flex items-center gap-2">
              <span className="text-sm font-bold tabular-nums text-slate-800">
                {score.scores.scaledTotal}/50
              </span>
              <GradeBadge grade={score.grade} />
            </span>
          ) : null}
          {open ? (
            <ChevronUp className="size-4 text-slate-400" />
          ) : (
            <ChevronDown className="size-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 p-4">
          {parts.length === 0 ? (
            <p className="text-xs text-slate-500">Nothing was recorded for this attempt.</p>
          ) : (
            parts.map((p) => {
              const rec = recordings.find((r) => r.part === p);
              const turns = byPart.get(p) ?? [];
              return (
                <section key={p} className="rounded-lg border border-slate-200 bg-white p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                    {PART_TITLE[p] ?? REALTIME_PART_LABEL[p] ?? `Part ${p}`}
                  </h4>
                  <div className="mt-2">
                    {rec ? (
                      <PartRecording recording={rec} />
                    ) : (
                      <span className="text-xs text-slate-400">No recording for this part</span>
                    )}
                  </div>
                  {turns.length > 0 && (
                    <div className="mt-3">
                      <TurnList turns={turns} />
                    </div>
                  )}
                </section>
              );
            })
          )}

          {score?.feedback?.overall && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-900">Feedback</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">{score.feedback.overall}</p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

type Props = {
  /** Only this question's attempts; omit for every live test. */
  setId?: string | null;
  limit?: number;
  className?: string;
  emptyText?: string;
};

/**
 * Live speaking tests from the database — finished or abandoned half way — with
 * each part's recording and the transcript of what was said.
 */
export function SpeakingLiveAttempts({ setId, limit, className, emptyText }: Props) {
  const q = useQuery({
    queryKey: ["speaking-live-attempts", setId ?? "all", limit ?? 50],
    queryFn: () => listLiveAttempts({ setId, limit }),
  });

  if (q.isLoading) {
    return (
      <div className={cn("flex items-center gap-2 py-6 text-sm text-slate-400", className)}>
        <Loader2 className="size-4 animate-spin" />
        Loading live tests…
      </div>
    );
  }

  const rows = (q.data ?? []).filter(
    // An attempt row with nothing in it is a test that never got going.
    (r) => r.status !== "in_progress" || (r.transcript?.length ?? 0) > 0 || (r.recordings?.length ?? 0) > 0,
  );

  if (!rows.length) {
    return (
      <p
        className={cn(
          "rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-base text-slate-500",
          className,
        )}
      >
        {emptyText ?? "No live tests for this question yet. Start the speaking test to see it here."}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {rows.map((row, i) => (
        <LiveAttemptItem key={row.id} row={row} defaultOpen={i === 0} />
      ))}
    </ul>
  );
}
