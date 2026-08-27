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

1. Browser opens the mic **once** and holds the device for the whole test — no
   permission prompt ever appears mid-exam. Capture is gated in software (see
   *Turn-taking and noise* below), so nothing is sent while the examiner talks.
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

### Turn-taking and noise

Only one side has the floor at a time, and the microphone follows it.

- **While the examiner speaks** the gate is **shut**: the worklet stops
  capturing (with a short fade, so no click is heard as speech) and the bridge
  drops anything that still arrives. A door, a fan or the examiner's own voice
  coming back through the speakers therefore cannot open a turn — and
  `interrupt_response` is off upstream, so nothing can cut a question in half.
- **When its audio has actually finished playing** — the browser confirms the
  drain, not the model finishing generation — the gate opens after
  `REALTIME_MIC_REOPEN_MS`, and the upstream buffer is cleared first so no echo
  tail survives into the answer.
- **While the candidate speaks** the examiner says nothing. A transcript does
  not end the turn: the pause has to outlast `REALTIME_ANSWER_SETTLE_MS`, timed
  from when they stopped talking rather than from when the transcript lands, so
  the wait costs nothing on top of transcription. If they start again inside the
  window the next sentence joins the same answer. Only a part running out of
  time may interrupt.

> **Restart the bridge after changing anything in `server/`.** It is a long-lived
> process — a stale one keeps the port and the page silently talks to old code.
> The gate is designed to fail open, so a bridge that sends no mic frames leaves
> the browser gating on playback alone rather than muting the candidate; the
> smoke test prints a warning when it sees that. If the examiner hears nothing at
> all, check the bridge's own log first: it says so in as many words
> (`no microphone audio has reached the bridge since the gate opened`) and the
> page shows a red notice.

### When an answer is thin, unclear, or missing

| What the bridge sees | What the examiner does |
| --- | --- |
| Speech, but nothing transcribable (too quiet, lost in noise) | *"I didn't quite catch that…"* and repeats the question — up to `REALTIME_MAX_CLARIFY` times |
| A word or two, or just a filler sound, on a question worth 20s or more | Asks them to develop it — *"Could you tell me a bit more?"* — up to `REALTIME_MAX_CLARIFY` times |
| Nothing added after that | Accepts what they gave and moves on |
| Silence for `REALTIME_NUDGE_MS` (8s) | *"Please answer when you're ready"*, then repeats the question |
| Silence through `REALTIME_MAX_NUDGES` (3) checks | Says it cannot hear them, saves the answers, ends the test |

### What the examiner remembers

The candidate's name, home town and anything else they volunteer are held for
the whole call — read off the transcript by the bridge and recorded by the model
through `remember_candidate_detail` — and restated to the model on every turn.
It uses their name, refers back to what they said, and never asks twice for
something they have already given. They are saved with the transcript under
`profile`.

### Resource guards

Nothing here keeps a billed session alive longer than it is useful:

- Browser disconnects → upstream socket closed immediately.
- Three silent checks with no speech at all → the examiner closes the test and the answers so far are saved.
- 20-minute exam ceiling, 22-minute hard kill.
- Per-answer cap of the admin's timer + 10s slack.
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
| `REALTIME_VAD_SILENCE_MS` | `1100` | Pause before VAD calls a turn finished |
| `REALTIME_VAD_THRESHOLD` | `0.5` | Mic sensitivity — raise in a noisy room |
| `REALTIME_ANSWER_SETTLE_MS` | `1400` | Grace after a transcript before the examiner may reply |
| `REALTIME_MIC_REOPEN_MS` | `250` | Mic stays shut this long after the examiner's audio ends |
| `REALTIME_MIN_ANSWER_WORDS` | `3` | Below this, a long question's answer is asked to be developed |
| `REALTIME_MAX_CLARIFY` | `2` | How often the examiner asks for more before accepting |
| `REALTIME_NUDGE_MS` | `8000` | Silence before *"please answer when you're ready"* |
| `REALTIME_MAX_NUDGES` | `3` | Silent checks before the test is abandoned |
| `REALTIME_FINAL_GRACE_MS` | `8000` | Grace after the last check |
| `REALTIME_MAX_EXAM_MS` | `1200000` | 20-minute ceiling (`REALTIME_HARD_KILL_MS`: 22) |
| `REALTIME_MAX_CONCURRENT` | `4` | Concurrent exams |
| `REALTIME_DEBUG` | off | Log every script decision, and each mic gate change |

## Before deploying

This is a local-testing setup. Going live needs:

- The bridge hosted somewhere real (Railway, next to the existing backend),
  `wss://`, and `VITE_REALTIME_EXAM_WS_URL` pointed at it.
- Auth on the WebSocket upgrade — right now any local page on an allowed origin
  can open a billed session. Check the Supabase JWT there.
- Transcripts written to Supabase instead of `.realtime-sessions/`.
- Per-user rate limiting and a daily spend cap.
