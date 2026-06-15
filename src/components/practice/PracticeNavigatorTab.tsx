import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpen: () => void;
  className?: string;
};

/** Floating right-edge tab — opens the question navigator (PTE-style drawer handle). */
export function PracticeNavigatorTab({ open, onOpen, className }: Props) {
  if (open) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open question navigator"
      className={cn(
        "fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-md bg-[#1e3a5f] px-1 py-5 text-white shadow-lg transition hover:bg-[#163054] active:scale-95",
        className,
      )}
    >
      <ChevronLeft className="size-4" strokeWidth={2.5} />
    </button>
  );
}
