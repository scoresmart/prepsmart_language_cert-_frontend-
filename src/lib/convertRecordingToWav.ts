const TARGET_SAMPLE_RATE = 16000;

function encodeWavFromFloat32(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  const channels = audioBuffer.numberOfChannels;
  for (let c = 0; c < channels; c++) {
    const channel = audioBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += channel[i] / channels;
  }
  return mono;
}

/**
 * Convert a browser MediaRecorder blob (webm/ogg/mp4) to 16 kHz mono WAV for Azure Speech.
 */
export async function convertBlobToWav16kMono(inputBlob: Blob): Promise<Blob> {
  if (inputBlob.type.includes("wav")) return inputBlob;

  const arrayBuffer = await inputBlob.arrayBuffer();
  if (arrayBuffer.byteLength < 100) {
    throw new Error("Recording is too short or empty.");
  }

  const decodeCtx = new AudioContext();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await decodeCtx.close();
  }

  if (audioBuffer.duration < 0.3) {
    throw new Error("Recording is too short. Please speak for at least a few seconds.");
  }

  const mono = mixToMono(audioBuffer);
  const offline = new OfflineAudioContext(
    1,
    Math.max(1, Math.ceil(audioBuffer.duration * TARGET_SAMPLE_RATE)),
    TARGET_SAMPLE_RATE,
  );
  const temp = offline.createBuffer(1, mono.length, audioBuffer.sampleRate);
  temp.copyToChannel(new Float32Array(mono), 0);
  const source = offline.createBufferSource();
  source.buffer = temp;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();
  return encodeWavFromFloat32(rendered.getChannelData(0), TARGET_SAMPLE_RATE);
}
