"use client";
import type { MeditationSound } from "./types";

/**
 * Self-contained Web Audio ambient sound player.
 * - AudioContext is created LAZILY on first user gesture (required by autoplay policy).
 * - All state transitions await `ctx.resume()` so playback actually starts.
 * - Chimes are loud and sustained so they're not missed.
 */

type NoiseType = "white" | "pink" | "brown";

function makeNoiseBuffer(
  ctx: AudioContext,
  type: NoiseType,
  seconds: number
): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(1, len, rate);
  const data = buf.getChannelData(0);

  if (type === "white") {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === "pink") {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buf;
}

export class AmbientPlayer {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private current: MeditationSound = "silent";
  private volume = 0.5;

  /** Call from a user gesture (click) to pre-warm. Returns true if ready. */
  async unlock(): Promise<boolean> {
    try {
      const ctx = this.getOrCreateCtx();
      if (ctx.state === "suspended") await ctx.resume();
      return ctx.state === "running";
    } catch (e) {
      console.warn("[ambient] unlock failed", e);
      return false;
    }
  }

  private getOrCreateCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) throw new Error("Web Audio not available");
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  async play(sound: MeditationSound): Promise<void> {
    this.stopInternal();
    this.current = sound;
    if (sound === "silent") return;

    const ctx = this.getOrCreateCtx();
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    this.gain = gain;

    let noiseType: NoiseType = "white";
    let filterType: BiquadFilterType | null = null;
    let filterFreq = 0;
    let filterQ = 1;
    let lfoFreq = 0;
    let lfoDepth = 0;

    switch (sound) {
      case "white":
        noiseType = "white";
        break;
      case "pink":
        noiseType = "pink";
        break;
      case "brown":
        noiseType = "brown";
        break;
      case "rain":
        noiseType = "pink";
        filterType = "highpass";
        filterFreq = 1200;
        filterQ = 0.7;
        break;
      case "ocean":
        noiseType = "brown";
        filterType = "lowpass";
        filterFreq = 900;
        filterQ = 0.9;
        lfoFreq = 0.08;
        lfoDepth = 0.25;
        break;
      case "hum":
        noiseType = "brown";
        filterType = "lowpass";
        filterFreq = 280;
        filterQ = 1.1;
        break;
    }

    const buf = makeNoiseBuffer(ctx, noiseType, 6);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    let tail: AudioNode = src;
    if (filterType) {
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFreq;
      filter.Q.value = filterQ;
      tail.connect(filter);
      tail = filter;
      this.filter = filter;
    }
    tail.connect(gain);

    if (lfoFreq > 0) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = lfoFreq;
      lfoGain.gain.value = lfoDepth * this.volume;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();
      this.lfo = lfo;
    }

    src.start();
    this.source = src;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume, now + 1.2);
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.gain && this.ctx) {
      this.gain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.15);
    }
  }

  /** Full bowl-like chime. Loud and sustained so it's hard to miss. */
  async chime(): Promise<void> {
    try {
      const ctx = this.getOrCreateCtx();
      if (ctx.state === "suspended") await ctx.resume();
      const now = ctx.currentTime;
      const baseFreq = 528;
      const master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(0.9, now + 0.04);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      const partials: [number, number][] = [
        [baseFreq, 1],
        [baseFreq * 2, 0.5],
        [baseFreq * 3, 0.22],
        [baseFreq * 1.5, 0.28],
        [baseFreq * 0.5, 0.35],
      ];
      for (const [freq, amp] of partials) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        g.gain.value = amp;
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(g).connect(master);
        osc.start(now);
        osc.stop(now + 4.6);
      }

      await new Promise((r) => setTimeout(r, 4700));
    } catch (e) {
      console.warn("[ambient] chime failed", e);
    }
  }

  stop() {
    if (this.ctx && this.gain) {
      try {
        const now = this.ctx.currentTime;
        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(this.gain.gain.value, now);
        this.gain.gain.linearRampToValueAtTime(0, now + 0.6);
      } catch {}
    }
    setTimeout(() => this.stopInternal(), 700);
    this.current = "silent";
  }

  private stopInternal() {
    try {
      this.source?.stop();
    } catch {}
    try {
      this.lfo?.stop();
    } catch {}
    this.source = null;
    this.filter = null;
    this.lfo = null;
    this.gain = null;
  }

  get playing() {
    return this.current;
  }
}

export const SOUND_META: Record<
  MeditationSound,
  { label: string; desc: string }
> = {
  silent: { label: "Silence", desc: "No sound — just your breath." },
  rain: { label: "Rain", desc: "Steady downpour, faraway." },
  ocean: { label: "Ocean", desc: "Slow swells, soft surf." },
  brown: { label: "Brown noise", desc: "Warm, heavy low-frequency wash." },
  pink: { label: "Pink noise", desc: "Balanced, soft static." },
  white: { label: "White noise", desc: "Sharper, bright static." },
  hum: { label: "Deep hum", desc: "Low resonant drone." },
};

/* =================== Screen Wake Lock =================== */

type WakeSentinel = { release: () => Promise<void> } | null;

export class WakeKeeper {
  private sentinel: WakeSentinel = null;
  private visHandler: (() => void) | null = null;

  async acquire(): Promise<boolean> {
    const n = navigator as unknown as {
      wakeLock?: { request: (type: "screen") => Promise<WakeSentinel> };
    };
    if (!n.wakeLock) return false;
    try {
      this.sentinel = await n.wakeLock.request("screen");
      // Re-acquire on visibility change (iOS releases it when tab is hidden)
      this.visHandler = async () => {
        if (document.visibilityState === "visible" && !this.sentinel) {
          try {
            this.sentinel = await n.wakeLock!.request("screen");
          } catch {}
        }
      };
      document.addEventListener("visibilitychange", this.visHandler);
      return true;
    } catch (e) {
      console.warn("[wakelock] acquire failed", e);
      return false;
    }
  }

  async release(): Promise<void> {
    if (this.visHandler) {
      document.removeEventListener("visibilitychange", this.visHandler);
      this.visHandler = null;
    }
    try {
      await this.sentinel?.release();
    } catch {}
    this.sentinel = null;
  }
}
