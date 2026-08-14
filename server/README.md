# Realtime speaking examiner (local)

A live voice examiner for the speaking task. The candidate talks to an AI
examiner in real time; the examiner reads the questions the admin authored in
the Speaking Set editor.

```
browser ──ws://localhost:8787/realtime/speaking──► bridge ──wss://api.openai.com/v1/realtime──► OpenAI
   mic PCM16 24k up                          (holds the API key)
   examiner PCM16 24k down
```

## Run it

```bash
npm install
npm run dev:realtime     # bridge on :8787 + vite on :5174
```

Or in two terminals:

```bash
npm run realtime
npm run dev
```

Open the speaking task. With `VITE_REALTIME_EXAM_DEFAULT=1` it starts in **Live
examiner mode**; otherwise use the toggle at the top of the panel.

Check the bridge is up: <http://localhost:8787/health>

## Smoke tests (no browser, no mic)

```bash
node server/test-client.mjs --mode answer    # synthesised candidate answers
node server/test-client.mjs --mode silent    # dead air -> nudge -> skip -> abandon
```

## The API key

`OPENAI_API_KEY` lives in `.env` **without** a `VITE_` prefix and is read only by
`realtime-bridge.mjs`. Vite inlines every `VITE_*` variable into the browser
bundle, so a key placed there would be readable by anyone who opens devtools.
The browser only ever sees the `ws://` URL.

Verify after any change:

```bash
npm run build && grep -r "sk-proj" dist   # must find nothing
```

## How a test runs

1. Browser opens the mic **once** and keeps it open for the whole test. It is
   never cycled between questions.
2. Bridge configures the session: examiner persona + the admin's script +
   server-side VAD, then tells the examiner to greet and ask question 1.
3. Examiner says *"Hi there, I'm your LanguageCert examiner…"*, introduces the
   test, asks question 1, and stops.
4. Candidate answers. VAD detects speech, the answer is transcribed, and the
   examiner acknowledges and moves on.
5. Repeat to the end of the script, then the examiner closes the test.

### Who decides what

The **model** owns the conversation — wording, acknowledgements, one optional
follow-up, timing of its own speech. The **bridge** owns the exam: which
question is current, when a question is abandoned, and when the test ends.

That split matters. The model will happily invent a candidate's answer during
silence and then try to advance off it. The bridge only advances when real
speech was actually transcribed, so an imagined answer can never move the
script (`ignoring premature next_question` in the log).

### Silence handling

| Elapsed silence | What happens |
| --- | --- |
| `REALTIME_NUDGE_1_MS` (8s) | *"Are you there? Take your time, there's no rush."* + repeats the question |
| `+ REALTIME_NUDGE_2_MS` (10s) | *"I'm sorry, I can't hear you. I'll move on."* |
| `+ REALTIME_SKIP_GRACE_MS` (6s) | Question marked `skipped`, examiner moves on |

### Resource guards

Nothing here keeps a billed session alive longer than it is useful:

- Browser disconnects → upstream socket closed immediately.
- 2 consecutive unanswered questions → test abandoned (no closing speech — nobody is listening).
- Candidate never speaks at all within 75s → abandoned.
- 15-minute exam ceiling, 17-minute hard kill.
- Per-answer cap of the admin's timer + 15s slack.
- Max 4 concurrent exams; a client that connects without starting is dropped after 30s.

## Auto-save

Both sides save continuously — nothing waits for a clean finish.

- **Bridge** → `.realtime-sessions/<sessionId>.json` (debounced on every turn),
  with per-question status (`answered` / `skipped` / `pending`) and nudge counts.
  A dropped connection still leaves a complete partial record.
- **Browser** → `sessionStorage` after every transcript line, so a refresh does
  not look like lost work.
- **On finish** → an attempt row via `api.practice.saveAttempt`.

## Configuration

All optional; defaults are in `examinerSession.mjs`.

| Variable | Default | Meaning |
| --- | --- | --- |
| `REALTIME_BRIDGE_PORT` | `8787` | Bridge port |
| `REALTIME_MODEL` | `gpt-realtime` | Realtime model |
| `REALTIME_VOICE` | `cedar` | Examiner voice |
| `REALTIME_VAD_SILENCE_MS` | `700` | Pause before the examiner takes its turn |
| `REALTIME_VAD_THRESHOLD` | `0.5` | Mic sensitivity — raise in a noisy room |
| `REALTIME_NUDGE_1_MS` | `8000` | Silence before *"are you there?"* |
| `REALTIME_NUDGE_2_MS` | `10000` | Further silence before moving on |
| `REALTIME_MAX_EXAM_MS` | `900000` | 15-minute ceiling |
| `REALTIME_MAX_CONSECUTIVE_SKIPS` | `2` | Unanswered questions before abandoning |
| `REALTIME_MAX_CONCURRENT` | `4` | Concurrent exams |
| `REALTIME_DEBUG` | off | Log every script decision |

## Before deploying

This is a local-testing setup. Going live needs:

- The bridge hosted somewhere real (Railway, next to the existing backend),
  `wss://`, and `VITE_REALTIME_EXAM_WS_URL` pointed at it.
- Auth on the WebSocket upgrade — right now any local page on an allowed origin
  can open a billed session. Check the Supabase JWT there.
- Transcripts written to Supabase instead of `.realtime-sessions/`.
- Per-user rate limiting and a daily spend cap.
