/**
 * Local WebSocket bridge for realtime speaking tests.
 *
 *   browser  <-- ws://localhost:8787/realtime/speaking -->  bridge  <-->  OpenAI Realtime
 *
 * The OpenAI key lives here and only here. The browser never sees it, so the
 * key can never be lifted out of the JS bundle or devtools.
 *
 *   npm run realtime          # start the bridge
 *   npm run dev:realtime      # bridge + vite together
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { WebSocketServer } from "ws";

import { CONFIG, ExaminerSession } from "./examinerSession.mjs";

// ---------------------------------------------------------------- env

/** Minimal .env reader — no dependency, and it never overwrites a real env var. */
function loadEnvFile(file) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const API_KEY = (process.env.OPENAI_API_KEY || process.env.REALTIME_OPENAI_API_KEY || "").trim();
const PORT = Number(process.env.REALTIME_BRIDGE_PORT) || 8787;

if (!API_KEY) {
  console.error(
    "\n[realtime] OPENAI_API_KEY is not set.\n" +
      "Add it to .env (server-side only — do NOT prefix it with VITE_).\n",
  );
  process.exit(1);
}
if (!API_KEY.startsWith("sk-")) {
  console.error("[realtime] OPENAI_API_KEY does not look like an OpenAI key.");
  process.exit(1);
}

/** Dev-only origin allowlist so a random page can't open a billed session. */
const ALLOWED_ORIGINS = (process.env.REALTIME_ALLOWED_ORIGINS ??
  "http://localhost:5174,http://127.0.0.1:5174,http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const MAX_CONCURRENT = Number(process.env.REALTIME_MAX_CONCURRENT) || 4;

// ---------------------------------------------------------------- server

const sessions = new Set();

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "realtime-speaking-bridge",
        model: CONFIG.MODEL,
        voice: CONFIG.VOICE,
        activeSessions: sessions.size,
        maxConcurrent: MAX_CONCURRENT,
        maxExamMinutes: Math.round(CONFIG.MAX_EXAM_MS / 60_000),
      }),
    );
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  if (url.pathname !== "/realtime/speaking") {
    socket.destroy();
    return;
  }

  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    console.warn(`[realtime] rejected origin ${origin}`);
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }

  if (sessions.size >= MAX_CONCURRENT) {
    console.warn(`[realtime] at capacity (${MAX_CONCURRENT}) — rejecting`);
    socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

wss.on("connection", (ws) => {
  const session = new ExaminerSession(ws, API_KEY);
  sessions.add(session);
  console.log(`[realtime] client connected — session ${session.sessionId} (${sessions.size} active)`);

  // A client that connects and never starts an exam still holds a slot.
  const startGuard = setTimeout(() => {
    if (!session.upstream) {
      console.log(`[${session.sessionId}] no start within 30s — dropping`);
      session.closeClient(1008, "no exam.start");
    }
  }, 30_000);

  let alive = true;
  ws.on("pong", () => {
    alive = true;
  });
  const heartbeat = setInterval(() => {
    if (!alive) {
      console.log(`[${session.sessionId}] heartbeat lost — terminating`);
      ws.terminate();
      return;
    }
    alive = false;
    try {
      ws.ping();
    } catch {
      /* socket already closing */
    }
  }, 15_000);

  ws.on("message", (data, isBinary) => {
    if (isBinary) {
      session.pushAudio(Buffer.isBuffer(data) ? data : Buffer.from(data));
      return;
    }

    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    switch (msg.t) {
      case "start":
        clearTimeout(startGuard);
        void session.start(msg.exam ?? {});
        break;
      case "playback.done":
        // The browser has finished playing the examiner's audio, so the
        // candidate's turn starts now rather than when generation ended.
        session.onPlaybackDrained();
        break;
      case "stop":
        session.beginClosing("candidate_stopped");
        break;
      case "abort":
        void session.end("candidate_aborted");
        break;
      case "ping":
        session.send({ t: "pong" });
        break;
      default:
        break;
    }
  });

  ws.on("close", () => {
    clearTimeout(startGuard);
    clearInterval(heartbeat);
    session.abandon();
    sessions.delete(session);
    console.log(`[realtime] client gone — ${sessions.size} active`);
  });

  ws.on("error", (err) => {
    console.error(`[${session.sessionId}] client socket error:`, err.message);
  });
});

server.listen(PORT, () => {
  console.log(`\n[realtime] speaking bridge listening on http://localhost:${PORT}`);
  console.log(`[realtime]   websocket : ws://localhost:${PORT}/realtime/speaking`);
  console.log(`[realtime]   model     : ${CONFIG.MODEL} (voice: ${CONFIG.VOICE})`);
  console.log(`[realtime]   exam cap  : ${Math.round(CONFIG.MAX_EXAM_MS / 60_000)} min, ${MAX_CONCURRENT} concurrent`);
  console.log(`[realtime]   key       : ${API_KEY.slice(0, 7)}…${API_KEY.slice(-4)} (server-side only)`);
  console.log(`[realtime]   transcripts -> ./.realtime-sessions/\n`);
});

function shutdown() {
  console.log("\n[realtime] shutting down — closing active sessions");
  for (const s of sessions) void s.end("server_shutdown");
  setTimeout(() => process.exit(0), 500);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
