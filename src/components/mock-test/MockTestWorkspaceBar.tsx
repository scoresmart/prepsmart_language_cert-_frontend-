import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { mockTestCatalogUrl } from "@/lib/mockTestRoutes";
import { MOCK_TEST_STEPS } from "@/lib/mockTestFormat";

type Props = {
  testTitle: string;
  stepIndex: number;
  stepLabel: string;
};

export function MockTestWorkspaceBar({ testTitle, stepIndex, stepLabel }: Props) {
  const totalSteps = MOCK_TEST_STEPS.length;

  return (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={mockTestCatalogUrl()}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="size-4" />
            Mock Tests
          </Link>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <span className="text-sm font-medium text-slate-700">{testTitle}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-slate-800">{stepLabel}</span>
          <span className="text-slate-400">
            Section {stepIndex} / {totalSteps}
          </span>
        </div>
      </div>
    </header>
  );
}
