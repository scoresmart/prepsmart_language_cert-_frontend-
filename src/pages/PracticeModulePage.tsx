import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LC_SECTIONS } from "@/lib/lcPracticeMenu";
import { getSectionLabel } from "@/lib/practiceQuestions";
import { partStartUrl, practiceHomeUrl } from "@/lib/practiceRoutes";
import { cn } from "@/lib/utils";

const MODULE_GRADIENT: Record<string, string> = {
  speaking: "from-blue-500 to-indigo-600",
  writing: "from-amber-500 to-orange-600",
  reading: "from-emerald-500 to-teal-600",
  listening: "from-cyan-500 to-pink-500",
};

export function PracticeModulePage() {
  const { module = "" } = useParams<{ module: string }>();
  const sectionMeta = LC_SECTIONS.find((s) => s.module === module);
  const SectionIcon = sectionMeta?.icon;

  if (!sectionMeta || !SectionIcon) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Module not found.</p>
        <Link to={practiceHomeUrl()} className="mt-2 text-sm text-cyan-600 hover:underline">
          Back to Practice
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Link
        to={practiceHomeUrl()}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        All modules
      </Link>

      <header className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
            MODULE_GRADIENT[module] ?? "from-slate-500 to-slate-700",
          )}
        >
          <SectionIcon className="size-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">PrepSmart LC</p>
          <h1 className="text-2xl font-bold text-slate-900">{getSectionLabel(module)}</h1>
          <p className="text-sm text-slate-500">Select a part to open your dedicated practice workspace</p>
        </div>
      </header>

      <ul className="space-y-3">
        {sectionMeta.parts.map((p) => (
            <li key={p.part}>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <h2 className="font-semibold text-slate-800">{p.label}</h2>
                </div>
                <div className="p-4">
                  <Link
                    to={partStartUrl(module, p.part)}
                    state={{ openNavigator: true }}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-cyan-600 hover:to-emerald-600"
                  >
                    Start practicing
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
