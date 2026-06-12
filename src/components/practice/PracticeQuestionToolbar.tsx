import { LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PracticeQuestionNavigator } from "@/components/practice/PracticeQuestionNavigator";
import { practiceQuestionsHubUrl } from "@/lib/practiceQuestions";
import { Link } from "react-router-dom";

type Props = {
  section: string;
  part: string;
  sectionLabel: string;
  partLabel?: string;
  instructions?: string;
  questionIndex: number;
  totalQuestions: number;
  accentClass?: string;
  onPrevious: () => void;
  onNext: () => void;
  onOpenNavigator: () => void;
};

export function PracticeQuestionToolbar({
  section,
  part,
  sectionLabel,
  partLabel,
  instructions,
  questionIndex,
  totalQuestions,
  accentClass,
  onPrevious,
  onNext,
  onOpenNavigator,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onOpenNavigator} className="gap-2">
          <LayoutList className="size-4" />
          Question Navigator
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link to={practiceQuestionsHubUrl(section, part)}>All Questions</Link>
        </Button>
      </div>
      <PracticeQuestionNavigator
        sectionLabel={sectionLabel}
        partLabel={partLabel}
        instructions={instructions}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        accentClass={accentClass}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
}
