import * as React from "react";
import { ArrowUpRight, BookOpen, Headphones, Mic, PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type SkillBreakdown = {
  label: string;
  icon: React.ElementType;
  color: string;
  done: number;
  total: number;
  to: string;
};

type Props = {
  done: number;
  total: number;
  skills: SkillBreakdown[];
  loading?: boolean;
};

export function OverallPracticeCard({ done, total, skills, loading }: Props) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const circumference = 2 * Math.PI * 88;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] via-[#1e2240] to-[#151528] p-6 shadow-xl shadow-black/40 transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-cyan-900/20">
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-500 group-hover:bg-cyan-500/20" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 size-40 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative size-48 shrink-0">
            <svg className="size-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="url(#practiceGrad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - strokeDash}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="practiceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#48c6ef" />
                  <stop offset="50%" stopColor="#0e9f73" />
                  <stop offset="100%" stopColor="#fde047" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {loading ? (
                <div className="size-16 animate-pulse rounded-full bg-white/10" />
              ) : (
                <>
                  <span className="font-display text-4xl font-extrabold text-white">{pct}%</span>
                  <span className="text-xs font-medium text-white/50">Complete</span>
                </>
              )}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">LC Practice Progress</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">All Tasks Overview</h2>
            <p className="mt-2 max-w-xs text-sm text-white/55">
              {loading ? "Loading your progress…" : `${done.toLocaleString()} of ${total.toLocaleString()} questions practiced across Speaking, Writing, Reading & Listening.`}
            </p>
            <Link
              to="/practice"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-900/30 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
            >
              Continue Practice <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {skills.map((skill) => {
            const skillPct = skill.total > 0 ? Math.round((skill.done / skill.total) * 100) : 0;
            const Icon = skill.icon;
            return (
              <Link
                key={skill.label}
                to={skill.to}
                className="group/skill relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <div className={cn("rounded-lg p-1.5", skill.color)}>
                    <Icon className="size-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white/80">{skill.label}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
                    style={{ width: `${skillPct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-white/45">{skillPct}% · {skill.done}/{skill.total}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const DEFAULT_SKILLS = [
  { label: "Speaking", icon: Mic, color: "bg-blue-500", to: "/practice/speaking" },
  { label: "Writing", icon: PenLine, color: "bg-amber-500", to: "/practice/writing" },
  { label: "Reading", icon: BookOpen, color: "bg-teal-500", to: "/practice/reading" },
  { label: "Listening", icon: Headphones, color: "bg-pink-500", to: "/practice/listening" },
] as const;
