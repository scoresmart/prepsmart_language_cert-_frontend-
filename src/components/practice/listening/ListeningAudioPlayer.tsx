import * as React from "react";
import { Headphones, Pause, Play, Volume2 } from "lucide-react";
import { AudioWaveBars } from "@/components/practice/speaking/AudioWaveBars";
import { LISTENING_PREP_SECONDS } from "@/lib/listeningInstructions";
import { cn } from "@/lib/utils";

type Phase = "preparing" | "playing" | "paused" | "ended";

type Props = {
  src: string;
  className?: string;
  prepSeconds?: number;
  resetKey?: string;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ListeningAudioPlayer({
  src,
  className,
  prepSeconds = LISTENING_PREP_SECONDS,
  resetKey = "",
}: Props) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = React.useState<Phase>("preparing");
  const [prepLeft, setPrepLeft] = React.useState(prepSeconds);
  const [volume, setVolume] = React.useState(1);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const startPlaybackWhenReady = React.useCallback(() => {
    const el = audioRef.current;
    if (!el) return;

    const playNow = () => {
      setPhase("playing");
      void el.play().catch(() => setPhase("paused"));
    };

    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      playNow();
      return;
    }

    const onReady = () => playNow();
    el.addEventListener("canplay", onReady, { once: true });
    if (el.networkState === HTMLMediaElement.NETWORK_EMPTY) {
      el.load();
    }

    return () => el.removeEventListener("canplay", onReady);
  }, []);

  React.useEffect(() => {
    setPhase("preparing");
    setPrepLeft(prepSeconds);
    setCurrentTime(0);
    setDuration(0);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
      el.load();
    }
  }, [src, prepSeconds, resetKey]);

  React.useEffect(() => {
    if (phase !== "preparing") return;
    if (prepLeft <= 0) {
      const cleanup = startPlaybackWhenReady();
      return cleanup;
    }
    const timer = window.setTimeout(() => setPrepLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [phase, prepLeft, startPlaybackWhenReady]);

  const syncDuration = React.useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (Number.isFinite(el.duration) && el.duration > 0) {
      setDuration(el.duration);
    }
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (phase === "playing") {
      el.pause();
      setPhase("paused");
    } else {
      void el.play().then(() => setPhase("playing")).catch(() => setPhase("paused"));
    }
  };

  const seekTo = (next: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(duration) || duration <= 0) return;
    const clamped = Math.min(Math.max(0, next), duration);
    el.currentTime = clamped;
    setCurrentTime(clamped);
    if (phase === "ended" && clamped < duration) {
      setPhase("paused");
    }
  };

  const isPreparing = phase === "preparing";
  const isPlaying = phase === "playing";
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className={cn("flex flex-col items-center gap-3 py-5", className)}>
      <audio
        key={`${src}-${resetKey}`}
        ref={audioRef}
        src={src}
        preload="auto"
        onLoadedMetadata={syncDuration}
        onDurationChange={syncDuration}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el) setCurrentTime(el.currentTime);
        }}
        onPlay={() => setPhase("playing")}
        onPause={() => {
          setPhase((current) => (current === "preparing" ? current : "paused"));
        }}
        onEnded={() => {
          setPhase("ended");
          const el = audioRef.current;
          if (el && Number.isFinite(el.duration)) {
            setCurrentTime(el.duration);
          }
        }}
        className="hidden"
      />

      {isPreparing ? (
        <div className="flex w-full max-w-md flex-col items-center rounded-xl border border-cyan-200 bg-gradient-to-b from-cyan-50 to-white px-6 py-8 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <Headphones className="size-7" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-800">Get ready to listen</p>
          <p className="mt-3 text-4xl font-bold tabular-nums text-cyan-700">
            00:{String(prepLeft).padStart(2, "0")}
          </p>
          <p className="mt-2 text-xs text-slate-500">Audio will play automatically</p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "w-full max-w-md rounded-xl border px-6 py-6 text-center transition",
              isPlaying
                ? "border-cyan-200 bg-gradient-to-b from-cyan-50/80 to-white ring-1 ring-cyan-100"
                : phase === "ended"
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200 bg-white",
            )}
          >
            <p className="text-sm font-semibold text-slate-800">
              {isPlaying
                ? "Now playing — listen carefully"
                : phase === "ended"
                  ? "Playback finished"
                  : "Paused"}
            </p>
            <AudioWaveBars active={isPlaying} className="mt-4" colorClass="bg-cyan-500" />

            <div className="mt-5 space-y-1.5">
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 1}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                disabled={duration <= 0}
                aria-label="Audio progress"
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer accent-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #0891b2 ${progress}%, #e2e8f0 ${progress}%)`,
                }}
              />
              <div className="flex items-center justify-between text-xs font-medium tabular-nums text-slate-600">
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
              className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/30 transition hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current ml-0.5" />
              )}
            </button>
            <div className="flex min-w-[140px] items-center gap-2">
              <Volume2 className="size-4 shrink-0 text-slate-500" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                aria-label="Volume"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (audioRef.current) audioRef.current.volume = v;
                }}
                className="h-1.5 w-full cursor-pointer accent-cyan-600"
              />
            </div>
          </div>

          {phase === "ended" && (
            <button
              type="button"
              onClick={() => {
                const el = audioRef.current;
                if (!el) return;
                el.currentTime = 0;
                setCurrentTime(0);
                void el.play().then(() => setPhase("playing")).catch(() => setPhase("paused"));
              }}
              className="text-xs font-medium text-cyan-700 hover:text-cyan-900"
            >
              Play again
            </button>
          )}
        </>
      )}

      <p className="text-xs text-slate-400">Use headphones for the best experience</p>
    </div>
  );
}
