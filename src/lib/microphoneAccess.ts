/** Request microphone access for speaking recordings. */
export async function requestMicrophoneAccess(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone is not supported in this browser.");
  }

  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  });
}

export function stopMicrophoneStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function isMicrophoneStreamActive(stream: MediaStream | null | undefined): boolean {
  return Boolean(stream?.active && stream.getAudioTracks().some((t) => t.readyState === "live"));
}

export function microphoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Microphone access is blocked. Allow microphone permission in your browser, then try again.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No microphone found. Connect a microphone and try again.";
    }
    if (error.name === "NotReadableError") {
      return "Microphone is in use by another app. Close other apps using the mic and try again.";
    }
  }

  return error instanceof Error ? error.message : "Could not access the microphone.";
}
