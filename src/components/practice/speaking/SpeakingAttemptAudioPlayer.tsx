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
    <div className={cn("flex items-center gap-3 rounded-lg bg-slate-100 px-3 py-2", className)}>
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
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-[10px] tabular-nums text-slate-500">
          {formatTime(progress)} / {safeDuration > 0 ? formatTime(safeDuration) : "--:--"}
        </p>
      </div>
    </div>
  );
}
