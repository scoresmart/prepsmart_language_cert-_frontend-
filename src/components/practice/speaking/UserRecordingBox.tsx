import * as React from "react";
import { Info, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioWaveBars } from "./AudioWaveBars";
import { cn } from "@/lib/utils";

export type RecordingPhase = "waiting" | "preparing" | "recording" | "recorded";

type Props = {
  phase: RecordingPhase;
  prepareSecondsLeft: number;
  recordSecondsLeft: number;
  maxDuration: number;
  onStartRecording: () => void;
  onRecordingComplete: (blob: Blob) => void;
  className?: string;
};

export function UserRecordingBox({
  phase,
  prepareSecondsLeft,
  recordSecondsLeft,
  maxDuration,
  onStartRecording,
  onRecordingComplete,
  className,
}: Props) {
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const completedRef = React.useRef(false);

  const onCompleteRef = React.useRef(onRecordingComplete);
  onCompleteRef.current = onRecordingComplete;

  const finishRecording = React.useCallback((blob: Blob) => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current(blob);
  }, []);

  const stopTracks = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = React.useCallback(() => {
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
    } else {
      stopTracks();
      finishRecording(new Blob());
    }
  }, [finishRecording, stopTracks]);

  React.useEffect(() => {
    if (phase !== "recording") return;

    completedRef.current = false;
    let cancelled = false;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          stopTracks();
          finishRecording(blob);
        };
        recorder.start();
      } catch {
        finishRecording(new Blob());
      }
    }

    void startRecording();

    return () => {
      cancelled = true;
      if (mediaRef.current?.state === "recording") {
        mediaRef.current.stop();
      } else {
        stopTracks();
      }
      mediaRef.current = null;
    };
  }, [phase, finishRecording, stopTracks]);

  React.useEffect(() => {
    if (phase === "recorded" && mediaRef.current?.state === "recording") {
      stopRecording();
    }
  }, [phase, stopRecording]);

  const elapsed = maxDuration - recordSecondsLeft;
  const isRecording = phase === "recording";
  const isPreparing = phase === "preparing";
  const isRecorded = phase === "recorded";
  const canStart = isPreparing;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-slate-50 px-6 py-8 text-center shadow-sm",
        isRecording && "border-rose-200 bg-rose-50/40 ring-1 ring-rose-100",
        isRecorded && "border-emerald-200 bg-emerald-50/30",
        className,
      )}
    >
      {isPreparing && (
        <p className="text-sm font-semibold text-rose-600">
          Prepare: <span className="tabular-nums">00:{String(prepareSecondsLeft).padStart(2, "0")}</span>
        </p>
      )}

      {phase === "waiting" && (
        <p className="text-sm font-medium text-slate-500">Waiting for examiner audio to finish…</p>
      )}

      {isRecording && (
        <p className="text-sm font-semibold text-rose-600">
          Recording: <span className="tabular-nums">00:{String(elapsed).padStart(2, "0")}</span>
          {" / "}
          <span className="tabular-nums">00:{String(maxDuration).padStart(2, "0")}</span>
        </p>
      )}

      {isRecorded && (
        <p className="text-sm font-semibold text-emerald-700">Recording complete — review or submit your answer.</p>
      )}

      <button
        type="button"
        onClick={isRecording ? stopRecording : canStart ? onStartRecording : undefined}
        disabled={!isRecording && !canStart}
        className={cn(
          "mx-auto mt-5 flex size-20 items-center justify-center rounded-full border-4 transition",
          isRecording
            ? "cursor-pointer border-rose-300 bg-white text-rose-500 shadow-lg shadow-rose-200/50 hover:scale-105"
            : canStart
              ? "cursor-pointer border-cyan-300 bg-white text-cyan-600 shadow-md hover:scale-105"
              : isRecorded
                ? "border-emerald-300 bg-white text-emerald-500"
                : "border-slate-200 bg-white text-slate-300",
        )}
        aria-label={isRecording ? "Stop recording" : canStart ? "Start recording" : "Microphone"}
      >
        <Mic className="size-9" />
      </button>

      {isPreparing && (
        <p className="mt-3 text-sm font-medium text-slate-600">
          Recording starts automatically in{" "}
          <span className="tabular-nums font-semibold text-rose-600">
            00:{String(prepareSecondsLeft).padStart(2, "0")}
          </span>
          {" "}— or start now
        </p>
      )}

      {canStart && (
        <Button
          type="button"
          onClick={onStartRecording}
          className="mt-4 gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
        >
          <Mic className="size-4" />
          Start Recording
        </Button>
      )}

      {isRecording && (
        <>
          <AudioWaveBars active className="mt-4" colorClass="bg-rose-500" />
          <p className="mt-2 text-sm text-slate-600">Speak clearly into your microphone</p>
          <Button
            type="button"
            variant="outline"
            onClick={stopRecording}
            className="mt-4 gap-2 border-rose-300 text-rose-600 hover:bg-rose-50"
          >
            <Square className="size-3.5 fill-current" />
            Stop Recording
          </Button>
        </>
      )}

      {isRecorded && <AudioWaveBars active={false} className="mt-4" colorClass="bg-emerald-500" />}

      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400">
        <Info className="size-3.5 shrink-0" />
        Use a headset with inline microphone to get accurate AI scores
      </p>
    </div>
  );
}
