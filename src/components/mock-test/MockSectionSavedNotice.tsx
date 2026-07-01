import { CheckCircle2 } from "lucide-react";

export function MockSectionSavedNotice({ isLastStep }: { isLastStep?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      <div>
        <p className="font-semibold">Answers saved</p>
        <p className="mt-0.5 text-emerald-800/90">
          {isLastStep
            ? "Calculating your mock test score…"
            : "Your answers are saved and locked. Scores and correct answers will appear on the results page after you finish the mock test."}
        </p>
      </div>
    </div>
  );
}
