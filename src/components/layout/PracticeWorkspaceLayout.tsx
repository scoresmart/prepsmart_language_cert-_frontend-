import type { ReactNode } from "react";

/** Full-viewport shell — no dashboard sidebar or header. */
export function PracticeWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white font-sans">
      {children}
    </div>
  );
}
