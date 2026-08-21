import * as React from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  className?: string;
};

export function SpeakingAttemptAudioPlayer({ src, className }: Props) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else void el.play();
  };

  const formatTime = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const pct = safeDuration > 0 ? (progress / safeDuration) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-4 rounded-2xl bg-slate-100/80 px-4 py-3", className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : 0);
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
      />
      <button
        type="button"
        onClick={toggle}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-white hover:shadow-sm"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
      </button>

      <p className="shrink-0 text-sm tabular-nums text-slate-600">
        {formatTime(progress)} / {safeDuration > 0 ? formatTime(safeDuration) : "0:00"}
      </p>

      {/* Track with a navy scrub knob riding the progress. */}
      <div className="relative flex min-w-0 flex-1 items-center py-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#1e3a8a] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          className="pointer-events-none absolute size-4 -translate-x-1/2 rounded-full border-2 border-[#1e3a8a] bg-white shadow-sm transition-all"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
