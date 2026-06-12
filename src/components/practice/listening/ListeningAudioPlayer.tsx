import * as React from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  className?: string;
};

export function ListeningAudioPlayer({ src, className }: Props) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(1);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      void el.play();
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3 py-4", className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause audio" : "Play audio"}
          className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/30 transition hover:scale-105 active:scale-95"
        >
          {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
        </button>
        <div className="flex items-center gap-2 min-w-[140px]">
          <Volume2 className="size-4 text-slate-500 shrink-0" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
            className="h-1.5 w-full cursor-pointer accent-cyan-600"
          />
        </div>
      </div>
      <p className="text-xs text-slate-400">Use headphones for the best experience</p>
    </div>
  );
}
