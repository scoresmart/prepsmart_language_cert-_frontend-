import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { LC_SECTIONS } from "@/lib/lcPracticeMenu";
import { moduleUrl } from "@/lib/practiceRoutes";
import { cn } from "@/lib/utils";

const MODULE_GRADIENT: Record<string, string> = {
  Speaking: "from-blue-500 to-indigo-600",
  Writing: "from-amber-500 to-orange-600",
  Reading: "from-emerald-500 to-teal-600",
  Listening: "from-cyan-500 to-pink-500",
};

export function PracticeHomePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-cyan-600">
          <Sparkles className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">PrepSmart LC</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">LanguageCert Practice</h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Choose a skill module, then pick a part to browse all questions or start practicing.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {LC_SECTIONS.map((section) => {
          const module = section.label.toLowerCase();
          const gradient = MODULE_GRADIENT[section.label] ?? "from-slate-500 to-slate-700";
          return (
            <Link
              key={section.label}
              to={moduleUrl(module)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                      gradient,
                    )}
                  >
                    <section.icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{section.label}</h2>
                    <p className="text-xs text-slate-500">{section.parts.length} parts</p>
                  </div>
                </div>
                <ArrowRight className="size-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-cyan-600" />
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {section.parts.map((p) => (
                  <li
                    key={p.label}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                  >
                    {p.label}
                  </li>
                ))}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
