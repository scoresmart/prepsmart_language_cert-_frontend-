import * as React from "react";
import { Headphones } from "lucide-react";
import { AudioWaveBars } from "./AudioWaveBars";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  autoPlay?: boolean;
  onEnded?: () => void;
  onPlayingChange?: (playing: boolean) => void;
  className?: string;
};

export function ExaminerAudioBox({
  src,
  autoPlay = true,
  onEnded,
  onPlayingChange,
  className,
}: Props) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [ended, setEnded] = React.useState(false);

  const setPlayState = React.useCallback(
    (value: boolean) => {
      setPlaying(value);
      onPlayingChange?.(value);
    },
    [onPlayingChange],
  );

  React.useEffect(() => {
    setEnded(false);
    setPlayState(false);
    if (!src || !autoPlay) return;
    const el = audioRef.current;
    if (!el) return;

    // Don't restart if user switched browser tabs and audio was already playing/finished.
    if (!el.paused && el.currentTime > 0) return;
    if (el.ended) return;

    const play = () => void el.play().catch(() => setPlayState(false));
    if (el.readyState >= 2) play();
    else el.addEventListener("canplay", play, { once: true });
    return () => el.removeEventListener("canplay", play);
  }, [src, autoPlay, setPlayState]);

  if (!src) {
    return (
      <div className={cn("rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center", className)}>
        <p className="text-sm text-slate-400">No examiner audio for this question.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 py-8 text-center shadow-sm",
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
        onEnded={() => {
          setPlayState(false);
          setEnded(true);
          onEnded?.();
        }}
      />
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
        <Headphones className="size-7" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-800">
        {playing ? "Examiner is speaking" : ended ? "Examiner finished" : "Listen to the examiner"}
      </p>
      <p className="mt-1 text-xs text-slate-500">Please listen carefully before you record your answer.</p>
      <AudioWaveBars active={playing} className="mt-5" colorClass="bg-cyan-500" />
      {!playing && !ended && (
        <button
          type="button"
          onClick={() => void audioRef.current?.play()}
          className="mt-4 text-xs font-medium text-cyan-700 hover:text-cyan-900"
        >
          Play examiner audio
        </button>
      )}
    </div>
  );
}
