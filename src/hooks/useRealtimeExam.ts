import * as React from "react";

import { microphoneErrorMessage } from "@/lib/microphoneAccess";
import {
  RealtimeExamClient,
  type RealtimeExamConfig,
  type RealtimeExamPhase,
  type RealtimeExamSummary,
  type RealtimeTranscriptTurn,
} from "@/lib/realtimeExamClient";
import {
  loadRealtimeExamDraft,
  saveRealtimeExamDraft,
  clearRealtimeExamDraft,
} from "@/lib/realtimeExamStorage";

export type RealtimeExamState = {
  phase: RealtimeExamPhase;
  segmentIndex: number;
  segmentTotal: number;
  /** Percentage of the segments the candidate must speak for that are done. */
  progress: number;
  part: number;
  segmentLabel: string;
  segmentText: string;
  segmentKind: string;
  imageUrl: string | null;
  /** Seconds left of silent preparation time, or 0 when not preparing. */
  prepareLeft: number;
  elapsedMs: number;
  remainingMs: number;
  examinerSpeaking: boolean;
  candidateSpeaking: boolean;
  micLevel: number;
  nudgeLevel: number;
  nudgeMax: number;
  /** Set while the examiner has asked for more, or could not hear the answer. */
  clarifyReason: string | null;
  /** False while the microphone is deliberately shut — the examiner is talking. */
  micOpen: boolean;
  /** What the examiner remembers about the candidate: name, home town, … */
  profile: Record<string, string>;
  transcript: RealtimeTranscriptTurn[];
  summary: RealtimeExamSummary | null;
  endReason: string | null;
  error: string | null;
  connecting: boolean;
  running: boolean;
};

const initialState: RealtimeExamState = {
  phase: "idle",
  segmentIndex: -1,
  segmentTotal: 0,
  progress: 0,
  part: 0,
  segmentLabel: "",
  segmentText: "",
  segmentKind: "",
  imageUrl: null,
  prepareLeft: 0,
  elapsedMs: 0,
  remainingMs: 0,
  examinerSpeaking: false,
  candidateSpeaking: false,
  micLevel: 0,
  nudgeLevel: 0,
  nudgeMax: 3,
  clarifyReason: null,
  micOpen: false,
  profile: {},
  transcript: [],
  summary: null,
  endReason: null,
  error: null,
  connecting: false,
  running: false,
};

/**
 * Drives one realtime speaking exam.
 *
 * Everything the candidate says is written to session storage as it arrives, so
 * a refresh or a crashed tab still leaves a recoverable record of the attempt.
 */
export function useRealtimeExam(draftKey: string) {
  const [state, setState] = React.useState<RealtimeExamState>(initialState);
  const clientRef = React.useRef<RealtimeExamClient | null>(null);
  const prepareTimerRef = React.useRef<number | null>(null);
  const transcriptRef = React.useRef<RealtimeTranscriptTurn[]>([]);
  const draftKeyRef = React.useRef(draftKey);

  draftKeyRef.current = draftKey;

  const patch = React.useCallback((next: Partial<RealtimeExamState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const start = React.useCallback(
    async (config: RealtimeExamConfig) => {
      if (clientRef.current) return;

      transcriptRef.current = [];
      setState({ ...initialState, connecting: true, running: true, phase: "connecting" });

      const client = new RealtimeExamClient({
        onPhase: (phase, info) =>
          setState((prev) => ({
            ...prev,
            phase,
            segmentIndex: info.segmentIndex,
            segmentTotal: info.segmentTotal,
            progress: info.progress,
            part: info.part,
            elapsedMs: info.elapsedMs,
            remainingMs: info.remainingMs,
            connecting: phase === "connecting",
            // A state frame carries the picture too. Keep whatever we already
            // have when it arrives empty, or the Part 3 image flickers out
            // between segments.
            imageUrl: info.imageUrl ?? (info.part === prev.part ? prev.imageUrl : null),
          })),

        onSegment: (seg) =>
          patch({
            segmentIndex: seg.index,
            segmentTotal: seg.total,
            segmentLabel: seg.label,
            segmentText: seg.text,
            segmentKind: seg.kind,
            part: seg.part,
            progress: seg.progress,
            imageUrl: seg.imageUrl,
            nudgeLevel: 0,
            clarifyReason: null,
            prepareLeft: 0,
          }),

        onPrepare: (info) => {
          // Countdown is driven locally so it ticks smoothly; the bridge holds
          // the authoritative timer and moves the exam on when it expires.
          patch({ prepareLeft: info.seconds, imageUrl: info.imageUrl });
          if (prepareTimerRef.current) window.clearInterval(prepareTimerRef.current);
          prepareTimerRef.current = window.setInterval(() => {
            setState((prev) => {
              const left = Math.max(0, prev.prepareLeft - 1);
              if (left === 0 && prepareTimerRef.current) {
                window.clearInterval(prepareTimerRef.current);
                prepareTimerRef.current = null;
              }
              return { ...prev, prepareLeft: left };
            });
          }, 1000);
        },

        onTranscript: (turn) => {
          transcriptRef.current = [...transcriptRef.current, turn];
          patch({ transcript: transcriptRef.current });
          saveRealtimeExamDraft(draftKeyRef.current, {
            sessionId: client.sessionId,
            setId: config.setId ?? null,
            setTitle: config.setTitle ?? null,
            level: config.level ?? null,
            updatedAt: new Date().toISOString(),
            transcript: transcriptRef.current,
          });
        },

        onExaminerSpeaking: (speaking) => patch({ examinerSpeaking: speaking }),
        onCandidateSpeaking: (speaking) => patch({ candidateSpeaking: speaking }),
        onMicLevel: (level) => patch({ micLevel: level }),
        onNudge: (level, max) => patch({ nudgeLevel: level, nudgeMax: max, clarifyReason: null }),
        onClarify: (reason) => patch({ clarifyReason: reason }),
        onMicOpen: (open) => patch({ micOpen: open }),
        onProfile: (profile) => patch({ profile }),

        onSaved: (summary) => patch({ summary }),

        onDone: (reason, summary) => {
          clientRef.current = null;
          patch({
            phase: "ended",
            running: false,
            connecting: false,
            endReason: reason,
            summary: summary ?? null,
            examinerSpeaking: false,
            candidateSpeaking: false,
            micOpen: false,
            micLevel: 0,
            prepareLeft: 0,
            progress: 100,
          });
        },

        onError: (message) => patch({ error: message }),
      });

      clientRef.current = client;

      try {
        await client.start(config);
        patch({ connecting: false });
      } catch (err) {
        clientRef.current = null;
        patch({
          error: microphoneErrorMessage(err),
          connecting: false,
          running: false,
          phase: "idle",
        });
      }
    },
    [patch],
  );

  const stop = React.useCallback(() => {
    clientRef.current?.stop();
    patch({ phase: "closing" });
  }, [patch]);

  const abort = React.useCallback(() => {
    clientRef.current?.abort();
    clientRef.current = null;
    patch({ running: false, phase: "ended", endReason: "aborted" });
  }, [patch]);

  const reset = React.useCallback(() => {
    clientRef.current?.abort();
    clientRef.current = null;
    transcriptRef.current = [];
    clearRealtimeExamDraft(draftKeyRef.current);
    setState(initialState);
  }, []);

  // Never leave a billed realtime session running behind a closed tab.
  React.useEffect(() => {
    const bail = () => clientRef.current?.abort();
    window.addEventListener("beforeunload", bail);
    window.addEventListener("pagehide", bail);
    return () => {
      window.removeEventListener("beforeunload", bail);
      window.removeEventListener("pagehide", bail);
      if (prepareTimerRef.current) window.clearInterval(prepareTimerRef.current);
      clientRef.current?.abort();
      clientRef.current = null;
    };
  }, []);

  // Local clock so the timer ticks smoothly between bridge state updates.
  React.useEffect(() => {
    if (!state.running) return;
    const id = window.setInterval(() => {
      setState((prev) => (prev.running ? { ...prev, elapsedMs: prev.elapsedMs + 1000 } : prev));
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.running]);

  const recoveredDraft = React.useMemo(() => loadRealtimeExamDraft(draftKey), [draftKey]);

  return { state, start, stop, abort, reset, recoveredDraft };
}
