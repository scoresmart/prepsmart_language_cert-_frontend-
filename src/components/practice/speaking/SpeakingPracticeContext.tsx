import * as React from "react";
import type { RecordingPhase } from "@/components/practice/speaking/UserRecordingBox";
import { SpeakingSidebar } from "@/components/practice/speaking/SpeakingSidebar";
import { PRACTICE_TIPS } from "@/lib/practiceTips";
import { SPEAKING_RECORD_SECONDS } from "@/lib/speakingInstructions";

type SpeakingPracticeState = {
  phase: RecordingPhase;
  prepareSecondsLeft: number;
  recordSecondsLeft: number;
  maxDuration: number;
};

type SpeakingPracticeContextValue = SpeakingPracticeState & {
  setState: React.Dispatch<React.SetStateAction<SpeakingPracticeState>>;
};

const defaultState: SpeakingPracticeState = {
  phase: "waiting",
  prepareSecondsLeft: 5,
  recordSecondsLeft: SPEAKING_RECORD_SECONDS,
  maxDuration: SPEAKING_RECORD_SECONDS,
};

const SpeakingPracticeContext = React.createContext<SpeakingPracticeContextValue | null>(null);

export function SpeakingPracticeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SpeakingPracticeState>(defaultState);
  const value = React.useMemo(() => ({ ...state, setState }), [state]);

  return (
    <SpeakingPracticeContext.Provider value={value}>{children}</SpeakingPracticeContext.Provider>
  );
}

export function useSpeakingPracticeState() {
  const ctx = React.useContext(SpeakingPracticeContext);
  if (!ctx) {
    throw new Error("useSpeakingPracticeState must be used within SpeakingPracticeProvider");
  }
  return ctx;
}

export function useSpeakingPracticeStateOptional() {
  return React.useContext(SpeakingPracticeContext);
}

export function SpeakingSidebarPanel() {
  const ctx = useSpeakingPracticeStateOptional();
  if (!ctx) return null;

  return (
    <SpeakingSidebar
      tips={PRACTICE_TIPS.speaking}
      phase={ctx.phase}
      prepareSecondsLeft={ctx.prepareSecondsLeft}
      recordSecondsLeft={ctx.recordSecondsLeft}
      maxDuration={ctx.maxDuration}
      className="hidden md:flex"
    />
  );
}
