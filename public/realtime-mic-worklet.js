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

/**
 * Samples the gate takes to open or close (~5 ms @ 24 kHz).
 *
 * Cutting the stream dead on a sample boundary puts a click into the audio, and
 * a click is a transient loud enough for server-side VAD to hear as speech —
 * the very thing muting is there to prevent.
 */
const RAMP_SAMPLES = 120;

class MicPcm16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(CHUNK_SAMPLES);
    this.offset = 0;
    this.muted = false;
    /** Current gate position: 1 fully open, 0 fully shut. */
    this.gain = 1;
    this.port.onmessage = (e) => {
      if (e.data?.type === "mute") this.muted = Boolean(e.data.value);
    };
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    const target = this.muted ? 0 : 1;
    const step = 1 / RAMP_SAMPLES;

    let peak = 0;
    for (let i = 0; i < channel.length; i++) {
      if (this.gain < target) this.gain = Math.min(target, this.gain + step);
      else if (this.gain > target) this.gain = Math.max(target, this.gain - step);

      let s = channel[i] * this.gain;
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
