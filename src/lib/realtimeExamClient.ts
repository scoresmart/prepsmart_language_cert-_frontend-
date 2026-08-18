/**
 * Browser client for the realtime speaking examiner.
 *
 * Talks to the local bridge (`server/realtime-bridge.mjs`) over one WebSocket:
 * PCM16 mic audio up, PCM16 examiner audio down, JSON control frames both ways.
 * The OpenAI key never reaches this file — the bridge holds it.
 *
 * The microphone is opened once at the start of the test and stays open until
 * the test ends. It is never cycled between questions.
 */

import { supabase } from "./supabase/client";

const SAMPLE_RATE = 24000;
const WORKLET_URL = "/realtime-mic-worklet.js";

export type RealtimeExamPhase =
  | "idle"
  | "connecting"
  | "greeting"
  | "asking"
  | "examiner"
  | "listening"
  | "answering"
  | "preparing"
  | "nudging"
  | "no_response"
  | "closing"
  | "ended";

export type RealtimeTranscriptTurn = {
  role: "examiner" | "candidate";
  text: string;
  segmentIndex: number;
  at: number;
};

export type RealtimeExamSummary = {
  sessionId: string;
  turns: number;
  questionsAsked: number;
  questionsAnswered: number;
  questionsSkipped: number;
  partsReached?: number[];
  durationMs: number;
  transcript: Array<{ role: string; text: string }>;
};

/** One step of the exam, built by src/lib/speakingExamSegments.ts. */
export type RealtimeExamSegment = {
  id: string;
  kind: string;
  part: number;
  text: string;
  seconds: number;
  label: string;
  context?: string;
  imageUrl?: string | null;
  generatedIndex?: number;
  generatedTotal?: number;
};

export type RealtimeExamConfig = {
  setId?: string | null;
  setTitle?: string | null;
  level?: string | null;
  examName?: string;
  candidateName?: string | null;
  attemptId?: string | null;
  userId?: string | null;
  segments: RealtimeExamSegment[];
};

export type RealtimeSegmentInfo = {
  index: number;
  total: number;
  kind: string;
  part: number;
  label: string;
  text: string;
  seconds: number;
  imageUrl: string | null;
  progress: number;
};

export type RealtimeExamHandlers = {
  onPhase?: (
    phase: RealtimeExamPhase,
    info: {
      segmentIndex: number;
      segmentTotal: number;
      progress: number;
      part: number;
      label: string;
      kind: string | null;
      imageUrl: string | null;
      elapsedMs: number;
      remainingMs: number;
    },
  ) => void;
  onSegment?: (seg: RealtimeSegmentInfo) => void;
  onPrepare?: (info: { seconds: number; label: string; imageUrl: string | null }) => void;
  onTranscript?: (turn: RealtimeTranscriptTurn) => void;
  onExaminerSpeaking?: (speaking: boolean) => void;
  onCandidateSpeaking?: (speaking: boolean) => void;
  onNudge?: (level: number, max: number, segmentIndex: number) => void;
  onMicLevel?: (level: number) => void;
  onSaved?: (summary: RealtimeExamSummary) => void;
  onDone?: (reason: string, summary: RealtimeExamSummary | null) => void;
  onError?: (message: string) => void;
};

export function realtimeExamWsUrl(): string {
  const configured = (import.meta.env.VITE_REALTIME_EXAM_WS_URL ?? "").trim();
  if (configured) return configured;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.hostname}:8787/realtime/speaking`;
}

/** The bridge closes with this when the socket carried no valid session. */
const CLOSE_UNAUTHORIZED = 4401;

/**
 * The exam URL with the candidate's Supabase session attached.
 *
 * The bridge refuses sockets without one — an exam costs real money to run, so
 * it has to know who is running it. A browser cannot set headers on a
 * WebSocket, so the token goes in the query string; that is safe over wss://,
 * where the URL is inside the encrypted tunnel.
 */
async function realtimeExamWsUrlWithAuth(): Promise<string> {
  const base = realtimeExamWsUrl();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Your session has expired. Please sign in again to start the speaking test.");
  }
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}token=${encodeURIComponent(token)}`;
}

export function isRealtimeExamConfigured(): boolean {
  return Boolean(realtimeExamWsUrl());
}

/** Schedules incoming PCM16 chunks back-to-back so the examiner sounds continuous. */
class PlaybackQueue {
  private ctx: AudioContext;
  private nextAt = 0;
  private live = new Set<AudioBufferSourceNode>();
  private onDrained: () => void;
  readonly gain: GainNode;

  constructor(ctx: AudioContext, onDrained: () => void) {
    this.ctx = ctx;
    this.onDrained = onDrained;
    this.gain = ctx.createGain();
    this.gain.connect(ctx.destination);
  }

  push(pcm: Int16Array) {
    const frames = pcm.length;
    if (!frames) return;

    const buf = this.ctx.createBuffer(1, frames, SAMPLE_RATE);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) ch[i] = pcm[i] / 0x8000;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.gain);

    // A small floor keeps playback from stuttering when frames arrive late.
    const startAt = Math.max(this.ctx.currentTime + 0.06, this.nextAt);
    src.start(startAt);
    this.nextAt = startAt + buf.duration;

    this.live.add(src);
    src.onended = () => {
      this.live.delete(src);
      // The examiner has now actually been heard, not merely generated. The
      // bridge waits for this before starting any "are you there?" countdown.
      if (this.live.size === 0) this.onDrained();
    };
  }

  /** Barge-in: drop everything still queued. */
  clear() {
    for (const src of this.live) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
    this.live.clear();
    this.nextAt = 0;
  }

  get isPlaying() {
    return this.live.size > 0;
  }
}

export class RealtimeExamClient {
  private ws: WebSocket | null = null;
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private playback: PlaybackQueue | null = null;
  private handlers: RealtimeExamHandlers;
  private stopped = false;

  sessionId: string | null = null;

  constructor(handlers: RealtimeExamHandlers = {}) {
    this.handlers = handlers;
  }

  /** Opens the mic and the socket, then starts the exam. */
  async start(config: RealtimeExamConfig): Promise<void> {
    if (this.ws) return;
    this.stopped = false;

    // Session first. Asking for the microphone and only then discovering the
    // login has expired leaves the candidate with a permission prompt, a live
    // mic to clean up, and an error that looks like a hardware fault.
    const url = await realtimeExamWsUrlWithAuth();

    // Mic next: a permission prompt should never happen mid-exam.
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor({ sampleRate: SAMPLE_RATE });
    if (this.ctx.state === "suspended") await this.ctx.resume();

    await this.ctx.audioWorklet.addModule(WORKLET_URL);

    this.playback = new PlaybackQueue(this.ctx, () => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ t: "playback.done" }));
      }
    });
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "mic-pcm16", {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 1,
    });
    this.source.connect(this.node);

    this.node.port.onmessage = (e: MessageEvent) => {
      const data = e.data as { type: string; buffer: ArrayBuffer; peak: number };
      if (data?.type !== "pcm") return;
      this.handlers.onMicLevel?.(data.peak);
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(data.buffer);
    };

    await this.openSocket(config, url);
  }

  private openSocket(config: RealtimeExamConfig, url: string): Promise<void> {
    // Never put the url in a message or a log - it carries the session token.
    // Anything user-facing uses the bare endpoint instead.
    const shownUrl = realtimeExamWsUrl();
    return new Promise((resolve, reject) => {
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Could not open the examiner connection."));
        return;
      }
      ws.binaryType = "arraybuffer";
      this.ws = ws;

      let settled = false;
      const connectTimeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        this.teardownAudio();
        try {
          ws.close();
        } catch {
          /* noop */
        }
        reject(
          new Error(
            `The examiner service did not respond (${shownUrl}).`,
          ),
        );
      }, 8000);

      ws.onopen = () => {
        settled = true;
        window.clearTimeout(connectTimeout);
        ws.send(JSON.stringify({ t: "start", exam: config }));
        resolve();
      };

      ws.onerror = () => {
        if (settled) {
          this.handlers.onError?.("The examiner connection dropped.");
          return;
        }
        settled = true;
        window.clearTimeout(connectTimeout);
        this.teardownAudio();
        reject(
          new Error(
            `Could not reach the examiner service at ${shownUrl}.`,
          ),
        );
      };

      ws.onmessage = (event) => this.onMessage(event);

      ws.onclose = (event) => {
        window.clearTimeout(connectTimeout);

        // The bridge refuses an unauthenticated socket by closing with this
        // code instead of failing the upgrade, precisely so the reason
        // survives the trip: a failed upgrade reaches the browser as a bare
        // 1006 with no detail, which would read as 'examiner is down'.
        if (event.code === CLOSE_UNAUTHORIZED) {
          const message =
            event.reason ||
            "Your session has expired. Please sign in again to start the speaking test.";
          if (!settled) {
            settled = true;
            this.teardownAudio();
            reject(new Error(message));
          } else {
            this.handlers.onError?.(message);
          }
        }

        this.cleanup();
      };
    });
  }

  private onMessage(event: MessageEvent) {
    if (event.data instanceof ArrayBuffer) {
      this.playback?.push(new Int16Array(event.data));
      return;
    }

    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(String(event.data));
    } catch {
      return;
    }

    switch (msg.t) {
      case "ready":
        this.sessionId = String(msg.sessionId ?? "");
        break;

      case "state":
        this.handlers.onPhase?.(msg.phase as RealtimeExamPhase, {
          segmentIndex: Number(msg.segmentIndex ?? -1),
          segmentTotal: Number(msg.segmentTotal ?? 0),
          progress: Number(msg.progress ?? 0),
          part: Number(msg.part ?? 0),
          label: String(msg.label ?? ""),
          kind: (msg.kind as string | null) ?? null,
          imageUrl: (msg.imageUrl as string | null) ?? null,
          elapsedMs: Number(msg.elapsedMs ?? 0),
          remainingMs: Number(msg.remainingMs ?? 0),
        });
        break;

      case "segment":
        this.handlers.onSegment?.({
          index: Number(msg.index),
          total: Number(msg.total),
          kind: String(msg.kind ?? ""),
          part: Number(msg.part ?? 0),
          label: String(msg.label ?? ""),
          text: String(msg.text ?? ""),
          seconds: Number(msg.seconds ?? 0),
          imageUrl: (msg.imageUrl as string | null) ?? null,
          progress: Number(msg.progress ?? 0),
        });
        break;

      case "prepare":
        this.handlers.onPrepare?.({
          seconds: Number(msg.seconds ?? 0),
          label: String(msg.label ?? ""),
          imageUrl: (msg.imageUrl as string | null) ?? null,
        });
        break;

      case "transcript":
        this.handlers.onTranscript?.({
          role: msg.role as "examiner" | "candidate",
          text: String(msg.text ?? ""),
          segmentIndex: Number(msg.segmentIndex ?? -1),
          at: Date.now(),
        });
        break;

      case "examiner.speaking":
        this.handlers.onExaminerSpeaking?.(Boolean(msg.speaking));
        break;

      case "candidate.speaking":
        this.handlers.onCandidateSpeaking?.(Boolean(msg.speaking));
        break;

      case "audio.clear":
        this.playback?.clear();
        break;

      case "nudge":
        this.handlers.onNudge?.(Number(msg.level ?? 1), Number(msg.max ?? 3), Number(msg.index ?? -1));
        break;

      case "saved":
        this.handlers.onSaved?.(msg.summary as RealtimeExamSummary);
        break;

      case "done":
        this.stopped = true;
        this.handlers.onDone?.(String(msg.reason ?? "completed"), (msg.summary ?? null) as RealtimeExamSummary | null);
        break;

      case "error":
        this.handlers.onError?.(String(msg.message ?? "Realtime examiner error."));
        break;

      default:
        break;
    }
  }

  /** Ask the examiner to wrap up politely. */
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: "stop" }));
  }

  /** Drop everything now — used when the candidate leaves the page. */
  abort() {
    this.stopped = true;
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ t: "abort" }));
      } catch {
        /* socket already going away */
      }
    }
    try {
      this.ws?.close();
    } catch {
      /* noop */
    }
    this.cleanup();
  }

  private teardownAudio() {
    try {
      this.node?.port.close();
      this.node?.disconnect();
    } catch {
      /* noop */
    }
    try {
      this.source?.disconnect();
    } catch {
      /* noop */
    }
    this.playback?.clear();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close().catch(() => undefined);
    this.node = null;
    this.source = null;
    this.stream = null;
    this.playback = null;
    this.ctx = null;
  }

  private cleanup() {
    this.teardownAudio();
    this.ws = null;
  }
}
