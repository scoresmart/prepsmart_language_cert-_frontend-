import { BookOpen, Headphones, Mic, PenLine } from "lucide-react";
import { partStartUrl } from "@/lib/practiceRoutes";

export const LC_SECTIONS = [
  {
    label: "Speaking",
    module: "speaking",
    color: "text-blue-400",
    icon: Mic,
    parts: [
      { label: "Part 1", part: "1", to: partStartUrl("speaking", "1") },
      { label: "Part 2", part: "2", to: partStartUrl("speaking", "2") },
      { label: "Part 3", part: "3", to: partStartUrl("speaking", "3") },
      { label: "Part 4", part: "4", to: partStartUrl("speaking", "4") },
    ],
  },
  {
    label: "Writing",
    module: "writing",
    color: "text-amber-400",
    icon: PenLine,
    parts: [
      { label: "Part 1", part: "1", to: partStartUrl("writing", "1") },
      { label: "Part 2", part: "2", to: partStartUrl("writing", "2") },
    ],
  },
  {
    label: "Reading",
    module: "reading",
    color: "text-teal-400",
    icon: BookOpen,
    parts: [
      { label: "Part 1a", part: "1a", to: partStartUrl("reading", "1a") },
      { label: "Part 1b", part: "1b", to: partStartUrl("reading", "1b") },
      { label: "Part 2", part: "2", to: partStartUrl("reading", "2") },
      { label: "Part 3", part: "3", to: partStartUrl("reading", "3") },
      { label: "Part 4", part: "4", to: partStartUrl("reading", "4") },
    ],
  },
  {
    label: "Listening",
    module: "listening",
    color: "text-pink-400",
    icon: Headphones,
    parts: [
      { label: "Part 1", part: "1", to: partStartUrl("listening", "1") },
      { label: "Part 2", part: "2", to: partStartUrl("listening", "2") },
      { label: "Part 3", part: "3", to: partStartUrl("listening", "3") },
      { label: "Part 4", part: "4", to: partStartUrl("listening", "4") },
    ],
  },
] as const;
