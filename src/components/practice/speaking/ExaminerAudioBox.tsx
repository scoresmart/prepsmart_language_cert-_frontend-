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
  compact?: boolean;
};

export function ExaminerAudioBox({
  src,
  autoPlay = true,
  onEnded,
  onPlayingChange,
  className,
  compact = false,
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

    if (!el.paused && el.currentTime > 0) return;
    if (el.ended) return;

    const play = () => void el.play().catch(() => setPlayState(false));
    if (el.readyState >= 2) play();
    else el.addEventListener("canplay", play, { once: true });
    return () => el.removeEventListener("canplay", play);
  }, [src, autoPlay, setPlayState]);

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
        {playing ? "Examiner is speaking" : ended ? "Examiner finished" : "Listen to the examiner"}
      </p>
      {!compact && (
        <p className="mt-1 text-xs text-slate-500">Please listen carefully before you record your answer.</p>
      )}
      <AudioWaveBars active={playing} compact={compact} className={compact ? "mt-2" : "mt-5"} colorClass="bg-cyan-500" />
      {!playing && !ended && (
        <button
          type="button"
          onClick={() => void audioRef.current?.play()}
          className={cn("font-medium text-cyan-700 hover:text-cyan-900", compact ? "mt-1.5 text-[10px] sm:text-xs" : "mt-4 text-xs")}
        >
          Play examiner audio
        </button>
      )}
    </div>
  );
}
