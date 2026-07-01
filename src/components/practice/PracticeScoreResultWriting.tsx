import { WritingScoreCard } from "@/components/practice/writing/WritingScoreCard";
import type { WritingScoreResult } from "@/lib/scoringTypes";

export function WritingFields({
  writing,
  responseText,
  className,
}: {
  writing: WritingScoreResult;
  responseText?: string;
  className?: string;
}) {
  return (
    <WritingScoreCard writing={writing} responseText={responseText} className={className} />
  );
}
