/**
 * Auto-save for realtime speaking sessions.
 *
 * Every session is written to disk as it progresses (not only at the end), so a
 * crashed tab, a dropped connection, or a browser refresh never loses the
 * candidate's answers. Local-only storage for now — swap `persist()` for a call
 * to the backend/Supabase when you move off local testing.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), ".realtime-sessions");

/** Debounced writer so a chatty transcript doesn't hammer the disk. */
export class SessionRecord {
  constructor(sessionId, meta) {
    this.sessionId = sessionId;
    this.data = {
      sessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "in_progress",
      endReason: null,
      meta,
      questions: [],
      turns: [],
      durationMs: 0,
      audioBytesIn: 0,
      audioBytesOut: 0,
    };
    this._timer = null;
    this._writing = false;
    this._dirty = false;
  }

  setQuestions(questions) {
    this.data.questions = questions.map((q, i) => ({
      index: i,
      text: q.text,
      seconds: q.seconds ?? null,
      kind: q.kind ?? null,
      part: q.part ?? null,
      status: "pending",
      askedAt: null,
      answeredAt: null,
      nudges: 0,
    }));
    this.save();
  }

  markQuestion(index, patch) {
    const q = this.data.questions[index];
    if (!q) return;
    Object.assign(q, patch);
    this.save();
  }

  addTurn(role, text, extra = {}) {
    const trimmed = (text ?? "").trim();
    if (!trimmed) return;
    this.data.turns.push({
      role,
      text: trimmed,
      at: new Date().toISOString(),
      ...extra,
    });
    this.save();
  }

  countAudio(bytesIn = 0, bytesOut = 0) {
    this.data.audioBytesIn += bytesIn;
    this.data.audioBytesOut += bytesOut;
  }

  async finish(status, endReason, durationMs) {
    this.data.status = status;
    this.data.endReason = endReason;
    this.data.endedAt = new Date().toISOString();
    this.data.durationMs = durationMs;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    await this._write();
    return this.filePath();
  }

  filePath() {
    return path.join(ROOT, `${this.sessionId}.json`);
  }

  /** Debounced auto-save. */
  save() {
    this._dirty = true;
    if (this._timer) return;
    this._timer = setTimeout(() => {
      this._timer = null;
      void this._write();
    }, 750);
  }

  async _write() {
    if (this._writing) {
      this.save();
      return;
    }
    this._writing = true;
    this._dirty = false;
    try {
      await fs.mkdir(ROOT, { recursive: true });
      const target = this.filePath();
      const tmp = `${target}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(this.data, null, 2), "utf8");
      await fs.rename(tmp, target);
    } catch (err) {
      console.error(`[store] could not save ${this.sessionId}:`, err.message);
    } finally {
      this._writing = false;
      if (this._dirty) this.save();
    }
  }
}

export function transcriptSummary(record) {
  const qs = record.data.questions;
  // "delivered" marks lines the examiner simply read out, so they must not be
  // counted as questions the candidate failed to answer.
  const spoken = qs.filter((q) => q.status !== "delivered");
  return {
    sessionId: record.sessionId,
    turns: record.data.turns.length,
    questionsAsked: spoken.filter((q) => q.status !== "pending").length,
    questionsAnswered: spoken.filter((q) => q.status === "answered").length,
    questionsSkipped: spoken.filter((q) => q.status === "skipped").length,
    partsReached: [...new Set(qs.filter((q) => q.status !== "pending" && q.part).map((q) => q.part))],
    durationMs: record.data.durationMs,
    transcript: record.data.turns.map(({ role, text }) => ({ role, text })),
  };
}
