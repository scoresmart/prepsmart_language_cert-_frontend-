import * as React from "react";
import { cn } from "@/lib/utils";

export type LiveSpeaker = "examiner" | "candidate" | "idle";

type WaveSpec = {
  /** Relative amplitude of this ribbon. */
  a: number;
  /** Cycles across the full width. */
  freq: number;
  /** Horizontal travel speed. */
  speed: number;
  /** Phase offset so the ribbons never fully overlap. */
  phase: number;
  lw: number;
  /** Opacity — the thinner ribbons sit further back. */
  alpha: number;
};

const WAVES: WaveSpec[] = [
  { a: 1.0, freq: 1.15, speed: 0.0016, phase: 0, lw: 3, alpha: 0.95 },
  { a: 0.78, freq: 1.75, speed: -0.0021, phase: 1.7, lw: 2.4, alpha: 0.72 },
  { a: 0.58, freq: 2.45, speed: 0.0027, phase: 3.4, lw: 1.9, alpha: 0.55 },
  { a: 0.4, freq: 3.3, speed: -0.0034, phase: 5.1, lw: 1.5, alpha: 0.42 },
];

/**
 * Siri-style colour ramps tuned for a white card — saturated enough to read
 * against the light background, one ramp per speaker.
 */
const PALETTE: Record<LiveSpeaker, string[][]> = {
  examiner: [
    ["#0ea5e9", "#6366f1", "#a855f7"],
    ["#06b6d4", "#3b82f6", "#8b5cf6"],
    ["#6366f1", "#a855f7", "#0ea5e9"],
    ["#3b82f6", "#8b5cf6", "#06b6d4"],
  ],
  candidate: [
    ["#10b981", "#06b6d4", "#0ea5e9"],
    ["#22c55e", "#14b8a6", "#06b6d4"],
    ["#84cc16", "#10b981", "#0891b2"],
    ["#2dd4bf", "#0ea5e9", "#10b981"],
  ],
  idle: [
    ["#94a3b8", "#cbd5e1", "#94a3b8"],
    ["#a1aab8", "#cdd5e0", "#a1aab8"],
    ["#aab2c0", "#d4dae4", "#aab2c0"],
    ["#b4bcc8", "#dbe1e9", "#b4bcc8"],
  ],
};

type Props = {
  speaker: LiveSpeaker;
  /** 0–1 measured microphone level; drives amplitude while the candidate speaks. */
  level?: number;
  /** Whether the session is live at all (idle draws an almost-flat rail). */
  active?: boolean;
  label: string;
  hint?: string;
  className?: string;
};

/**
 * Live speaking indicator: overlapping gradient ribbons that swell with
 * whoever is talking — blue/violet for the examiner, green/cyan for you.
 * Drawn transparently so it sits directly inside the white examiner card.
 */
export function SpeakingLiveWave({
  speaker,
  level = 0,
  active = true,
  label,
  hint,
  className,
}: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ampRef = React.useRef(0);
  const speakerRef = React.useRef(speaker);
  const targetRef = React.useRef(0);

  speakerRef.current = speaker;
  targetRef.current = !active
    ? 0.05
    : speaker === "candidate"
      ? 0.28 + Math.min(1, level * 2.4) * 0.72
      : speaker === "examiner"
        ? 0.7
        : 0.1;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (t: number) => {
      frame = window.requestAnimationFrame(draw);
      if (width <= 0 || height <= 0) return;

      ampRef.current += (targetRef.current - ampRef.current) * 0.09;
      const amp = ampRef.current;
      const ramp = PALETTE[speakerRef.current] ?? PALETTE.idle;
      const mid = height / 2;
      const peak = height * 0.36;

      ctx.clearRect(0, 0, width, height);
      // Plain compositing — "lighter" would wash the ribbons out on white.
      ctx.globalCompositeOperation = "source-over";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      WAVES.forEach((wv, i) => {
        const colors = ramp[i] ?? ramp[0];
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.5, colors[1]);
        grad.addColorStop(1, colors[2]);

        // Slow breathing so the ribbons stay alive between words.
        const breathe = 0.82 + Math.sin(t * 0.0009 + i * 1.3) * 0.18;

        ctx.beginPath();
        ctx.globalAlpha = wv.alpha;
        ctx.strokeStyle = grad;
        ctx.lineWidth = wv.lw;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${colors[1]}66`;

        for (let x = 0; x <= width; x += 2) {
          const p = x / width;
          const envelope = Math.pow(Math.sin(Math.PI * p), 1.5);
          const y =
            mid +
            Math.sin(p * Math.PI * 2 * wv.freq + t * wv.speed + wv.phase) *
              peak *
              amp *
              wv.a *
              breathe *
              envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* soft coloured bloom behind the ribbons */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.13] blur-3xl transition-colors duration-500",
          speaker === "examiner"
            ? "bg-indigo-500"
            : speaker === "candidate"
              ? "bg-emerald-400"
              : "bg-slate-400",
        )}
        aria-hidden
      />

      <canvas ref={canvasRef} className="relative block h-24 w-full sm:h-32" aria-hidden />

      <div className="relative mt-2 text-center">
        <p
          className={cn(
            "bg-gradient-to-r bg-clip-text text-sm font-semibold text-transparent transition-colors sm:text-base",
            speaker === "examiner"
              ? "from-sky-600 via-indigo-600 to-purple-600"
              : speaker === "candidate"
                ? "from-emerald-600 via-teal-600 to-sky-600"
                : "from-slate-600 via-slate-500 to-slate-600",
          )}
          aria-live="polite"
        >
          {label}
        </p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
