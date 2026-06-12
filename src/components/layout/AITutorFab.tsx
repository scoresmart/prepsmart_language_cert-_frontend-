import { Bot } from "lucide-react";
import { Link } from "react-router-dom";

export function AITutorFab() {
  return (
    <Link
      to="/practice/dialogues"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-[#1a1a2e] px-4 py-2.5 text-sm font-medium text-white shadow-xl transition-transform hover:scale-105 hover:bg-[#252545]"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400">
        <Bot className="size-5 text-white" />
      </span>
      <span className="hidden sm:inline">I am your AI tutor</span>
    </Link>
  );
}
