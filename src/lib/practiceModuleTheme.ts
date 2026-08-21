/**
 * One colour identity per practice module.
 *
 * The task header card at the top of every practice workspace is tinted by
 * module, not by part, so a learner can tell at a glance which skill they are
 * in. Keep these four hues clearly distinct from each other.
 */
export type PracticeModuleKey = "speaking" | "writing" | "listening" | "reading";

export type PracticeModuleTheme = {
  /** Tailwind `bg-gradient-to-r` stops for the header card. */
  gradient: string;
  /** Prefix used to build the icon-tile label, e.g. "W" -> "W1". */
  abbrevPrefix: string;
  /** How the workspace counts its items. */
  countLabel: "Question" | "Set";
};

export const PRACTICE_MODULE_THEME: Record<PracticeModuleKey, PracticeModuleTheme> = {
  // Indigo / violet — the blue the speaking workspace already used.
  speaking: {
    gradient: "from-[#4f5bd5] via-[#6366f1] to-[#8b5cf6]",
    abbrevPrefix: "S",
    countLabel: "Question",
  },
  // Orange / amber.
  writing: {
    gradient: "from-[#ea580c] via-[#f97316] to-[#f59e0b]",
    abbrevPrefix: "W",
    countLabel: "Set",
  },
  // Cyan / sky.
  listening: {
    gradient: "from-[#0891b2] via-[#06b6d4] to-[#38bdf8]",
    abbrevPrefix: "L",
    countLabel: "Set",
  },
  // Emerald / teal.
  reading: {
    gradient: "from-[#0d9488] via-[#10b981] to-[#22c55e]",
    abbrevPrefix: "R",
    countLabel: "Set",
  },
};

export function practiceModuleTheme(module: PracticeModuleKey): PracticeModuleTheme {
  return PRACTICE_MODULE_THEME[module] ?? PRACTICE_MODULE_THEME.speaking;
}
