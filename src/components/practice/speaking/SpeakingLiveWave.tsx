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
};

const WAVES: WaveSpec[] = [
  { a: 1.0, freq: 1.15, speed: 0.0016, phase: 0, lw: 2.6 },
  { a: 0.78, freq: 1.75, speed: -0.0021, phase: 1.7, lw: 2.2 },
  { a: 0.58, freq: 2.45, speed: 0.0027, phase: 3.4, lw: 1.8 },
  { a: 0.4, freq: 3.3, speed: -0.0034, phase: 5.1, lw: 1.4 },
];

/** Siri-style colour ramps — one per speaker. */
const PALETTE: Record<LiveSpeaker, string[][]> = {
  examiner: [
    ["#38bdf8", "#6366f1", "#a855f7"],
    ["#22d3ee", "#3b82f6", "#8b5cf6"],
    ["#818cf8", "#c084fc", "#38bdf8"],
    ["#60a5fa", "#a78bfa", "#22d3ee"],
  ],
  candidate: [
    ["#34d399", "#22d3ee", "#38bdf8"],
    ["#4ade80", "#2dd4bf", "#22d3ee"],
    ["#a3e635", "#34d399", "#06b6d4"],
    ["#5eead4", "#38bdf8", "#34d399"],
  ],
  idle: [
    ["#475569", "#64748b", "#475569"],
    ["#3f4b5f", "#55637a", "#3f4b5f"],
    ["#39445a", "#4b5772", "#39445a"],
    ["#334155", "#475569", "#334155"],
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
 * Siri-inspired live speaking indicator: overlapping colour ribbons that swell
 * with whoever is talking — blue/violet for the examiner, green/cyan for you.
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
    ? 0.04
    : speaker === "candidate"
      ? 0.28 + Math.min(1, level * 2.4) * 0.72
      : speaker === "examiner"
        ? 0.7
        : 0.08;

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
      ctx.globalCompositeOperation = "lighter";
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
        ctx.strokeStyle = grad;
        ctx.lineWidth = wv.lw;
        ctx.shadowBlur = 12;
        ctx.shadowColor = colors[1];

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

      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "source-over";
    };

    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0b1020] via-[#111827] to-[#0b1020] px-4 py-5 shadow-lg sm:px-6 sm:py-6",
        className,
      )}
    >
      {/* soft coloured bloom behind the ribbons */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl transition-colors duration-500",
          speaker === "examiner"
            ? "bg-indigo-500"
            : speaker === "candidate"
              ? "bg-emerald-400"
              : "bg-slate-600",
        )}
        aria-hidden
      />

      <canvas ref={canvasRef} className="relative block h-20 w-full sm:h-24" aria-hidden />

      <div className="relative mt-3 text-center">
        <p
          className={cn(
            "text-sm font-semibold transition-colors sm:text-base",
            speaker === "examiner"
              ? "text-indigo-200"
              : speaker === "candidate"
                ? "text-emerald-200"
                : "text-slate-300",
          )}
          aria-live="polite"
        >
          {label}
        </p>
        {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
