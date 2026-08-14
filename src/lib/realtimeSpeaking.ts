import type { SpeakingScoreResult } from "@/lib/scoringTypes";

const DEFAULT_TIMEOUT_MS = 45_000;

type RealtimeScoreParams = {
  audioBlob: Blob;
  level: string;
  taskDescription: string;
  attemptId?: string | null;
};

type RealtimeEnvelope = {
  type?: string;
  event?: string;
  error?: string;
  message?: string;
  score?: unknown;
  result?: unknown;
  data?: unknown;
};

function getRealtimeWsUrl(): string {
  return (import.meta.env.VITE_REALTIME_SPEAKING_WS_URL ?? "").trim();
}

function getRealtimeApiKey(): string {
  return (import.meta.env.VITE_REALTIME_SPEAKING_API_KEY ?? "").trim();
}

function pickScore(payload: RealtimeEnvelope): SpeakingScoreResult | null {
  const candidates = [payload.score, payload.result, payload.data];
  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;
    const maybe = item as Partial<SpeakingScoreResult>;
    if (maybe.type === "speaking" && maybe.scores && maybe.feedback) {
      return maybe as SpeakingScoreResult;
    }
    const nested = (item as { score?: unknown; result?: unknown; data?: unknown }).score;
    if (nested && typeof nested === "object") {
      const s = nested as Partial<SpeakingScoreResult>;
      if (s.type === "speaking" && s.scores && s.feedback) {
        return s as SpeakingScoreResult;
      }
    }
  }
  return null;
}

export function isRealtimeSpeakingEnabled(): boolean {
  return Boolean(getRealtimeWsUrl());
}

export async function scoreSpeakingViaRealtime(params: RealtimeScoreParams): Promise<SpeakingScoreResult> {
  const wsUrl = getRealtimeWsUrl();
  if (!wsUrl) throw new Error("Realtime speaking is not configured.");

  const apiKey = getRealtimeApiKey();
  const authToken = btoa(unescape(encodeURIComponent(apiKey || "")));

  const ws = new WebSocket(wsUrl);

  return await new Promise<SpeakingScoreResult>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      reject(new Error("Realtime scoring timed out."));
    }, DEFAULT_TIMEOUT_MS);

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      fn();
      try {
        ws.close();
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      finish(() => reject(new Error("Realtime WebSocket connection failed.")));
    };

    ws.onclose = (evt) => {
      if (settled) return;
      finish(() => reject(new Error(`Realtime WebSocket closed (${evt.code}).`)));
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;

      let payload: RealtimeEnvelope;
      try {
        payload = JSON.parse(event.data) as RealtimeEnvelope;
      } catch {
        return;
      }

      const t = (payload.type ?? payload.event ?? "").toLowerCase();
      if (t.includes("error") || payload.error) {
        finish(() => reject(new Error(payload.error || payload.message || "Realtime scoring failed.")));
        return;
      }

      const score = pickScore(payload);
      if (score) {
        finish(() => resolve(score));
      }
    };

    ws.onopen = () => {
      void (async () => {
        try {
          ws.send(
            JSON.stringify({
              type: "start",
              auth: {
                apiKey: apiKey || undefined,
                token: apiKey ? authToken : undefined,
              },
              metadata: {
                level: params.level,
                taskDescription: params.taskDescription,
                attemptId: params.attemptId ?? undefined,
              },
            }),
          );

          const audioBytes = await params.audioBlob.arrayBuffer();
          ws.send(audioBytes);
          ws.send(JSON.stringify({ type: "end" }));
        } catch (error) {
          finish(() => reject(error instanceof Error ? error : new Error("Could not send realtime audio.")));
        }
      })();
    };
  });
}
