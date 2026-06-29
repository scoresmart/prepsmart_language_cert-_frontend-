import * as React from "react";
import { Loader2, Music2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSpeakingAudioPublicUrl } from "@/lib/speakingAudio";

const ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/x-m4a,audio/*";
const MAX_MB = 25;

type Props = {
  value: string;
  onChange: (path: string) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
  className?: string;
};

function displayName(value: string): string {
  if (!value) return "";
  if (value.startsWith("http")) {
    try {
      const url = new URL(value);
      return decodeURIComponent(url.pathname.split("/").pop() || value);
    } catch {
      return value;
    }
  }
  return value.split("/").pop() || value;
}

export function AudioUploadDropzone({ value, onChange, onUpload, disabled, className }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const previewUrl = value ? getSpeakingAudioPublicUrl(value) : null;

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || disabled || uploading) return;

    if (!file.type.startsWith("audio/") && !/\.(mp3|wav|webm|ogg|m4a|mp4)$/i.test(file.name)) {
      setError("Please choose an audio file (MP3, WAV, WebM, OGG, or M4A).");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const path = await onUpload(file);
      onChange(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        className={cn(
          "relative flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
          dragging
            ? "border-blue-500 bg-blue-50/80"
            : "border-slate-200 bg-slate-50/80 hover:border-blue-300 hover:bg-blue-50/50",
          (disabled || uploading) && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => void handleFiles(e.target.files)}
        />

        {uploading ? (
          <>
            <Loader2 className="size-8 animate-spin text-blue-500" />
            <p className="mt-2 text-sm font-medium text-slate-700">Uploading audio…</p>
          </>
        ) : (
          <>
            <div className="flex size-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Upload className="size-5" />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Drag & drop examiner audio here
            </p>
            <p className="mt-1 text-xs text-slate-500">or click to browse · MP3, WAV, WebM · max {MAX_MB} MB</p>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {value && previewUrl && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
              <Music2 className="size-4 shrink-0 text-blue-500" />
              <span className="truncate font-medium">{displayName(value)}</span>
            </div>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => onChange("")}
              className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
              aria-label="Remove audio"
            >
              <X className="size-4" />
            </button>
          </div>
          <audio controls src={previewUrl} className="h-9 w-full" preload="metadata" />
        </div>
      )}
    </div>
  );
}
