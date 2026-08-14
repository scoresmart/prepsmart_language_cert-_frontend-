/**
 * Mic capture worklet for the realtime speaking test.
 *
 * Runs on the audio thread, converts the incoming Float32 mono stream to the
 * PCM16 the Realtime API expects, and posts it in ~20 ms chunks. The
 * AudioContext is created at 24 kHz, so no resampling is needed here.
 *
 * Served from /realtime-mic-worklet.js (Vite `public/`).
 */

const CHUNK_SAMPLES = 480; // 20 ms @ 24 kHz

class MicPcm16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(CHUNK_SAMPLES);
    this.offset = 0;
    this.muted = false;
    this.port.onmessage = (e) => {
      if (e.data?.type === "mute") this.muted = Boolean(e.data.value);
    };
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    let peak = 0;
    for (let i = 0; i < channel.length; i++) {
      let s = this.muted ? 0 : channel[i];
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      const abs = s < 0 ? -s : s;
      if (abs > peak) peak = abs;

      this.buffer[this.offset++] = s < 0 ? s * 0x8000 : s * 0x7fff;

      if (this.offset === CHUNK_SAMPLES) {
        const out = this.buffer.slice(0);
        this.port.postMessage({ type: "pcm", buffer: out.buffer, peak }, [out.buffer]);
        this.offset = 0;
        peak = 0;
      }
    }
    return true;
  }
}

registerProcessor("mic-pcm16", MicPcm16Processor);
