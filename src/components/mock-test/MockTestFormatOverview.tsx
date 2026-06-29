import {
  MOCK_ACTIVITY_SCREENS,
  MOCK_EXAM_TITLE,
  MOCK_EXAM_TOTAL_MINUTES,
  MOCK_LISTENING_PARTS,
  MOCK_MODULE_TIMINGS,
  MOCK_READING_PARTS,
  MOCK_SPEAKING_PARTS,
  MOCK_TOTALS,
  MOCK_WRITING_TASKS,
} from "@/lib/mockTestFormat";

export function MockTestFormatOverview() {
  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{MOCK_EXAM_TITLE} mock test format</h2>
        <p className="mt-1 text-sm text-slate-500">
          Full exam: Listening, Reading, Writing, and Speaking — {MOCK_ACTIVITY_SCREENS} activity screens, ~
          {Math.floor(MOCK_EXAM_TOTAL_MINUTES / 60)}h {MOCK_EXAM_TOTAL_MINUTES % 60}m total. Each listening part
          is played twice.
        </p>
      </div>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-700">
          Listening — {MOCK_MODULE_TIMINGS.listening} min · {MOCK_TOTALS.listening} questions
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {MOCK_LISTENING_PARTS.map((p) => (
            <li key={p.part}>
              <span className="font-semibold text-slate-800">
                {p.label} — {p.title}
              </span>{" "}
              ({p.questions} q): {p.format}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          Reading — {MOCK_MODULE_TIMINGS.reading} min · {MOCK_TOTALS.reading} questions
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {MOCK_READING_PARTS.map((p) => (
            <li key={p.part}>
              <span className="font-semibold text-slate-800">
                {p.label} — {p.title}
              </span>{" "}
              ({p.questions} q): {p.format}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-amber-700">
          Writing — {MOCK_MODULE_TIMINGS.writing} min · 2 tasks
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {MOCK_WRITING_TASKS.map((p) => (
            <li key={p.part}>
              <span className="font-semibold text-slate-800">
                {p.label} — {p.title}
              </span>{" "}
              ({p.words} words): {p.format}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-violet-700">
          Speaking — {MOCK_MODULE_TIMINGS.speaking} min · 4 parts
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {MOCK_SPEAKING_PARTS.map((p) => (
            <li key={p.part}>
              <span className="font-semibold text-slate-800">
                {p.label} — {p.title}
              </span>
              : {p.format}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
