import { scoreRingColor } from "@/lib/speakingScoreUtils";

type Props = {
  label: string;
  score: number;
  max: number;
  size?: number;
};

export function ScoreDonut({ label, score, max, size = 88 }: Props) {
  const ratio = max > 0 ? Math.max(0, Math.min(score, max)) / max : 0;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * ratio;
  const color = scoreRingColor(ratio);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold tabular-nums text-slate-900">
            {score}/{max}
          </span>
        </div>
      </div>
      <span className="max-w-[5.5rem] text-center text-[11px] font-medium leading-tight text-slate-600">
        {label}
      </span>
    </div>
  );
}
