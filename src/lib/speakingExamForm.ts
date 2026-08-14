import type { SpeakingSet } from "@/lib/api";
import {
  emptySpeakingExamStructure,
  normalizeSpeakingExamStructure,
  type SpeakingExamStructure,
} from "@/lib/speakingExamStructure";

/** Part 3 pictures live in the existing public images bucket. */
export const SPEAKING_IMAGE_BUCKET = "writing-task-images";

export type ExamSetForm = {
  title: string;
  level: string;
  sort_order: number;
  is_published: boolean;
  structure: SpeakingExamStructure;
};

export function speakingExamToForm(set?: SpeakingSet | null): ExamSetForm {
  if (!set) {
    return {
      title: "",
      level: "B1",
      sort_order: 0,
      is_published: false,
      structure: emptySpeakingExamStructure(),
    };
  }
  return {
    title: set.title,
    level: set.level || "B1",
    sort_order: set.sort_order ?? 0,
    is_published: set.is_published,
    structure: normalizeSpeakingExamStructure(set.structure),
  };
}

/** Storage path -> public URL. Passes absolute URLs through untouched. */
export function speakingImagePublicUrl(ref?: string | null): string | null {
  if (!ref?.trim()) return null;
  if (ref.startsWith("http")) return ref;
  const base = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${SPEAKING_IMAGE_BUCKET}/${ref.replace(/^\/+/, "")}`;
}
