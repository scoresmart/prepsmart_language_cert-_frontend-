import * as React from "react";
import { Headphones } from "lucide-react";
import { AudioWaveBars } from "./AudioWaveBars";
import { cn } from "@/lib/utils";

/** Seconds to wait before autoplaying examiner audio when a question loads. */
export const EXAMINER_AUDIO_START_DELAY_SECONDS = 3;

type Props = {
  src: string | null;
  autoPlay?: boolean;
  startDelaySeconds?: number;
  onEnded?: () => void;
  onPlayingChange?: (playing: boolean) => void;
  className?: string;
  compact?: boolean;
};

export function ExaminerAudioBox({
  src,
  autoPlay = true,
  startDelaySeconds = EXAMINER_AUDIO_START_DELAY_SECONDS,
  onEnded,
  onPlayingChange,
  className,
  compact = false,
}: Props) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const [loadError, setLoadError] = React.useState(false);
  const [secondsUntilPlay, setSecondsUntilPlay] = React.useState(
    autoPlay ? startDelaySeconds : 0,
  );

  const setPlayState = React.useCallback(
    (value: boolean) => {
      setPlaying(value);
      onPlayingChange?.(value);
    },
    [onPlayingChange],
  );

  const countdownActive = autoPlay && secondsUntilPlay > 0 && !loadError;

  React.useEffect(() => {
    setEnded(false);
    setLoadError(false);
    setPlayState(false);
    if (!src || !autoPlay) {
      setSecondsUntilPlay(0);
      return;
    }
    setSecondsUntilPlay(startDelaySeconds);
  }, [src, autoPlay, startDelaySeconds, setPlayState]);

  React.useEffect(() => {
    if (!countdownActive) return;
    const timer = window.setInterval(() => {
      setSecondsUntilPlay((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdownActive, src, startDelaySeconds]);

  React.useEffect(() => {
    if (!src || !autoPlay || countdownActive) return;
    const el = audioRef.current;
    if (!el) return;

    if (!el.paused && el.currentTime > 0) return;
    if (el.ended) return;

    const play = () => void el.play().catch(() => setPlayState(false));
    if (el.readyState >= 2) play();
    else el.addEventListener("canplay", play, { once: true });
    return () => el.removeEventListener("canplay", play);
  }, [src, autoPlay, countdownActive, setPlayState]);

  if (!src) {
    return (
      <div
        className={cn(
          "flex h-full min-h-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center",
          compact ? "px-3 py-4" : "px-6 py-10",
          className,
        )}
      >
        <p className="text-xs text-slate-400 sm:text-sm">No examiner audio for this question.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white text-center shadow-sm",
        compact ? "px-3 py-2 sm:px-4 sm:py-3" : "px-6 py-8",
        playing && "border-cyan-200 ring-1 ring-cyan-100",
        className,
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        className="hidden"
        onPlay={() => setPlayState(true)}
        onPause={() => setPlayState(false)}
        onError={() => {
          setLoadError(true);
          setPlayState(false);
        }}
        onEnded={() => {
          setPlayState(false);
          setEnded(true);
          onEnded?.();
        }}
      />
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-cyan-100 text-cyan-700",
          compact ? "size-9 sm:size-10" : "size-14",
        )}
      >
        <Headphones className={compact ? "size-4 sm:size-5" : "size-7"} />
      </div>
      <p className={cn("font-semibold text-slate-800", compact ? "mt-2 text-xs sm:text-sm" : "mt-4 text-sm")}>
        {loadError
          ? "Examiner audio unavailable"
          : countdownActive
            ? `Examiner audio starts in ${secondsUntilPlay}…`
            : playing
              ? "Examiner is speaking"
              : ended
                ? "Examiner finished"
                : "Listen to the examiner"}
      </p>
      {countdownActive && (
        <p
          className={cn(
            "font-bold tabular-nums text-cyan-600",
            compact ? "mt-1 text-2xl sm:text-3xl" : "mt-2 text-4xl",
          )}
        >
          {secondsUntilPlay}
        </p>
      )}
      {loadError && (
        <p className={cn("text-rose-600", compact ? "mt-1 text-[10px] sm:text-xs" : "mt-1 text-xs")}>
          This question&apos;s audio file could not be loaded. Ask your tutor to re-upload it in Admin.
        </p>
      )}
      {!compact && !countdownActive && (
        <p className="mt-1 text-xs text-slate-500">Please listen carefully before you record your answer.</p>
      )}
      <AudioWaveBars
        active={playing}
        compact={compact}
        className={compact ? "mt-2" : "mt-5"}
        colorClass="bg-cyan-500"
      />
      {!playing && !ended && !loadError && !countdownActive && (
        <button
          type="button"
          onClick={() => {
            setSecondsUntilPlay(0);
            void audioRef.current?.play();
          }}
          className={cn("font-medium text-cyan-700 hover:text-cyan-900", compact ? "mt-1.5 text-[10px] sm:text-xs" : "mt-4 text-xs")}
        >
          Play examiner audio
        </button>
      )}
    </div>
  );
}
