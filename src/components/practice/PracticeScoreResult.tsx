import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoringPhase, SpeakingScoreResult, WritingScoreResult } from "@/lib/scoringTypes";
import { WritingFields } from "@/components/practice/PracticeScoreResultWriting";
import { SpeakingScoreCard } from "@/components/practice/speaking/SpeakingScoreCard";

function formatScoringError(error?: string | null): string {
  if (!error) return "Please try again in a moment.";
  const creditMatch = error.match(/credit balance is too low/i);
  if (creditMatch) {
    return "Scoring is temporarily unavailable. Please try again later or contact support.";
  }
  const jsonStart = error.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(error.slice(jsonStart)) as { error?: { message?: string }; message?: string };
      const msg = parsed.error?.message ?? parsed.message;
      if (msg) return msg;
    } catch {
      /* use raw */
    }
  }
  return error.replace(/^\d{3}\s*/, "");
}

export function PracticeScoreResult({
  phase,
  error,
  writing,
  speaking,
  responseText,
  recordingUrl,
  referenceText,
  className,
}: {
  phase: ScoringPhase;
  error?: string | null;
  writing?: WritingScoreResult | null;
  speaking?: SpeakingScoreResult | null;
  responseText?: string;
  recordingUrl?: string | null;
  referenceText?: string | null;
  className?: string;
}) {
  if (phase === "idle" || phase === "scoring") return null;

  if (phase === "error") {
    return (
      <div className={cn("rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-center", className)}>
        <AlertCircle className="mx-auto size-7 text-red-500" />
        <p className="mt-3 text-sm font-semibold text-red-800">Scoring failed</p>
        <p className="mt-1 text-xs text-red-700">{formatScoringError(error)}</p>
      </div>
    );
  }

  if (speaking) {
    return (
      <SpeakingScoreCard
        speaking={speaking}
        recordingUrl={recordingUrl}
        referenceText={referenceText}
        className={className}
      />
    );
  }

  if (writing) {
    return (
      <WritingFields
        writing={writing}
        responseText={responseText}
        className={className}
      />
    );
  }

  return null;
}
