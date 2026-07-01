import * as React from "react";
import { AlertCircle, Info, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupportedRecordingMimeType } from "@/lib/recordingMimeType";
import { AudioWaveBars } from "./AudioWaveBars";
import { cn } from "@/lib/utils";

export type RecordingPhase = "waiting" | "preparing" | "recording" | "recorded";

type Props = {
  phase: RecordingPhase;
  prepareSecondsLeft: number;
  recordSecondsLeft: number;
  maxDuration: number;
  audioStream?: MediaStream | null;
  micReady?: boolean;
  micError?: string | null;
  onStartRecording: () => void;
  onRecordingComplete: (blob: Blob) => void;
  onRetryMic?: () => void;
  onRegisterStop?: (stop: (() => void) | null) => void;
  className?: string;
  compact?: boolean;
};

export function UserRecordingBox({
  phase,
  prepareSecondsLeft,
  recordSecondsLeft,
  maxDuration,
  audioStream,
  micReady = false,
  micError,
  onStartRecording,
  onRecordingComplete,
  onRetryMic,
  onRegisterStop,
  className,
  compact = false,
}: Props) {
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const completedRef = React.useRef(false);

  const onCompleteRef = React.useRef(onRecordingComplete);
  onCompleteRef.current = onRecordingComplete;

  const finishRecording = React.useCallback((blob: Blob) => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current(blob);
  }, []);

  const stopRecording = React.useCallback(() => {
    const recorder = mediaRef.current;
    if (recorder?.state === "recording") {
      try {
        recorder.requestData();
      } catch {
        /* ignore */
      }
      recorder.stop();
    } else {
      finishRecording(new Blob());
    }
  }, [finishRecording]);

  React.useEffect(() => {
    onRegisterStop?.(stopRecording);
    return () => onRegisterStop?.(null);
  }, [stopRecording, onRegisterStop]);

  React.useEffect(() => {
    if (phase !== "recording" || !audioStream) return;

    completedRef.current = false;
    chunksRef.current = [];

    const mimeType = getSupportedRecordingMimeType();
    const recorder = mimeType
      ? new MediaRecorder(audioStream, { mimeType })
      : new MediaRecorder(audioStream);
    mediaRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      finishRecording(blob);
    };

    recorder.start(250);

    return () => {
      const recorder = mediaRef.current;
      if (recorder?.state === "recording") {
        try {
          recorder.requestData();
        } catch {
          /* ignore */
        }
        recorder.stop();
      }
      mediaRef.current = null;
    };
  }, [phase, audioStream, finishRecording]);

  React.useEffect(() => {
    if (phase === "recorded" && mediaRef.current?.state === "recording") {
      stopRecording();
    }
  }, [phase, stopRecording]);

  const elapsed = maxDuration - recordSecondsLeft;
  const isRecording = phase === "recording";
  const isPreparing = phase === "preparing";
  const isRecorded = phase === "recorded";
  const canStart = isPreparing && micReady && !micError;

  const statusLine = (() => {
    if (micError) return null;
    if (isPreparing && !micReady) return "Allow microphone access to record.";
    if (isPreparing && micReady) return `Prepare 00:${String(prepareSecondsLeft).padStart(2, "0")}`;
    if (phase === "waiting") return "Waiting for examiner audio…";
    if (isRecording) {
      return `Recording 00:${String(elapsed).padStart(2, "0")} / 00:${String(maxDuration).padStart(2, "0")}`;
    }
    if (isRecorded) return "Recording complete";
    return null;
  })();

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-center shadow-sm",
        isRecording && "border-rose-200 bg-rose-50/40 ring-1 ring-rose-100",
        isRecorded && "border-emerald-200 bg-emerald-50/30",
        className,
      )}
    >
      {micError && (
        <div className="shrink-0 border-b border-rose-100 px-3 py-2 text-left">
          <p className="flex items-start gap-2 text-xs font-medium text-rose-700 sm:text-sm">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {micError}
          </p>
          {onRetryMic && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetryMic}
              className="mt-2 h-7 border-rose-300 text-xs text-rose-700 hover:bg-rose-100"
            >
              Enable microphone
            </Button>
          )}
        </div>
      )}

      {statusLine && !micError && (
        <div
          className={cn(
            "shrink-0 px-3 py-1.5",
            isRecording && "border-b border-rose-100 bg-rose-50/60",
            isRecorded && "border-b border-emerald-100 bg-emerald-50/40",
            !isRecording && !isRecorded && "border-b border-slate-100",
          )}
        >
          <p
            className={cn(
              "font-semibold leading-tight",
              compact ? "text-[11px] sm:text-xs" : "text-sm",
              isRecording ? "text-rose-600" : isRecorded ? "text-emerald-700" : "text-slate-600",
            )}
          >
            {statusLine}
          </p>
        </div>
      )}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col items-center justify-center",
          compact ? "gap-1.5 px-3 py-2" : "gap-3 px-6 py-4",
        )}
      >
        <button
          type="button"
          onClick={isRecording ? stopRecording : canStart ? onStartRecording : undefined}
          disabled={!isRecording && !canStart}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border-4 transition",
            compact ? "size-12 sm:size-14" : "size-20",
            isRecording
              ? "cursor-pointer border-rose-300 bg-white text-rose-500 shadow-md hover:scale-105"
              : canStart
                ? "cursor-pointer border-cyan-300 bg-white text-cyan-600 shadow-md hover:scale-105"
                : isRecorded
                  ? "border-emerald-300 bg-white text-emerald-500"
                  : micReady && isPreparing
                    ? "border-emerald-200 bg-white text-emerald-500"
                    : "border-slate-200 bg-white text-slate-300",
          )}
          aria-label={isRecording ? "Stop recording" : canStart ? "Start recording" : "Microphone"}
        >
          <Mic className={compact ? "size-5 sm:size-6" : "size-9"} />
        </button>

        {isPreparing && micReady && !micError && !compact && (
          <p className="text-sm font-medium text-slate-600">
            Recording starts automatically in{" "}
            <span className="tabular-nums font-semibold text-rose-600">
              00:{String(prepareSecondsLeft).padStart(2, "0")}
            </span>{" "}
            — or start now
          </p>
        )}

        {canStart && compact && (
          <Button
            type="button"
            size="sm"
            onClick={onStartRecording}
            className="gap-1.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-xs hover:from-cyan-600 hover:to-emerald-600"
          >
            <Mic className="size-3.5" />
            Start Recording
          </Button>
        )}

        {canStart && !compact && (
          <Button
            type="button"
            onClick={onStartRecording}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
          >
            <Mic className="size-4" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            <AudioWaveBars active compact={compact} colorClass="bg-rose-500" />
            {!compact && <p className="text-sm text-slate-600">Tap the mic to stop</p>}
            {compact && <p className="text-[10px] text-slate-500 sm:text-xs">Tap mic to stop</p>}
          </>
        )}

        {isRecorded && (
          <AudioWaveBars active={false} compact={compact} colorClass="bg-emerald-500" />
        )}
      </div>

      <p
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1 border-t border-slate-100 text-slate-400",
          compact ? "px-3 py-1.5 text-[10px]" : "px-6 py-2 text-xs",
        )}
      >
        <Info className="size-3 shrink-0" />
        {compact ? "Use a headset mic for best scores" : "Use a headset with inline microphone to get accurate AI scores"}
      </p>
    </div>
  );
}
