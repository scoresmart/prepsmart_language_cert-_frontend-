import type { ReactNode } from "react";

/** Full-viewport shell — centered material sits on a light side-gapped canvas. */
export function PracticeWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100 font-sans">
      {children}
    </div>
  );
}
