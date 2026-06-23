import {
  MOCK_LISTENING_PARTS,
  MOCK_READING_PARTS,
  MOCK_SPEAKING_PARTS,
  MOCK_TOTALS,
  MOCK_WRITING_TASKS,
} from "@/lib/mockTestFormat";

export function MockTestFormatOverview() {
  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">LanguageCert International ESOL format</h2>
        <p className="mt-1 text-sm text-slate-500">
          B1/B2-style full mock — same question types as the real exam. Listening recordings play twice in
          practice mode.
        </p>
      </div>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-700">Listening — 30 min · {MOCK_TOTALS.listening} questions</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {MOCK_LISTENING_PARTS.map((p) => (
            <li key={p.part}>
              <span className="font-semibold text-slate-800">{p.label}</span> ({p.questions} q): {p.format}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-700">Reading — ~50 min · {MOCK_TOTALS.reading} questions</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {MOCK_READING_PARTS.map((p) => (
            <li key={p.part}>
              <span className="font-semibold text-slate-800">{p.label}</span> ({p.questions} q): {p.format}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-amber-700">Writing — ~50 min · 2 tasks</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {MOCK_WRITING_TASKS.map((p) => (
            <li key={p.part}>
              <span className="font-semibold text-slate-800">{p.label}</span> ({p.words} words): {p.format}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-violet-700">Speaking — ~13 min · 4 parts</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {MOCK_SPEAKING_PARTS.map((p) => (
            <li key={p.part}>
              <span className="font-semibold text-slate-800">{p.label}</span>: {p.format}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
