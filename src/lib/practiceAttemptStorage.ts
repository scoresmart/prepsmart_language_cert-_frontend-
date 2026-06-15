/** Local cache for writing answers (backend stores score only). */
export function saveLocalAnswer(questionSetId: string, text: string): void {
  try {
    sessionStorage.setItem(`lc-practice-answer:${questionSetId}`, text);
  } catch {
    /* ignore */
  }
}

export function getLocalAnswer(questionSetId: string): string | null {
  try {
    return sessionStorage.getItem(`lc-practice-answer:${questionSetId}`);
  } catch {
    return null;
  }
}

const RECORDING_DB = "lc-practice-recordings";
const RECORDING_STORE = "blobs";

function openRecordingDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(RECORDING_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(RECORDING_STORE)) {
        db.createObjectStore(RECORDING_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const recordingUrlCache = new Map<string, string>();

export async function saveLocalRecording(questionSetId: string, blob: Blob): Promise<void> {
  const prev = recordingUrlCache.get(questionSetId);
  if (prev) URL.revokeObjectURL(prev);
  recordingUrlCache.set(questionSetId, URL.createObjectURL(blob));
  try {
    const db = await openRecordingDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(RECORDING_STORE, "readwrite");
      tx.objectStore(RECORDING_STORE).put(blob, questionSetId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* indexedDB unavailable */
  }
}

export async function getLocalRecording(questionSetId: string): Promise<string | null> {
  const cached = recordingUrlCache.get(questionSetId);
  if (cached) return cached;
  try {
    const db = await openRecordingDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(RECORDING_STORE, "readonly");
      const req = tx.objectStore(RECORDING_STORE).get(questionSetId);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    recordingUrlCache.set(questionSetId, url);
    return url;
  } catch {
    return null;
  }
}
