-- Student's answer snapshot for each practice attempt, shown to admins in
-- Practice Logs. Writing: { kind: "text", prompt, text }.
-- Reading/Listening: { kind: "items", items: [{ label, studentAnswer, correctAnswer, isCorrect }] }.
-- Applied to project sepzceaicoldqhyxxzff on 2026-10-30.

alter table public.practice_attempts add column if not exists answer jsonb;
