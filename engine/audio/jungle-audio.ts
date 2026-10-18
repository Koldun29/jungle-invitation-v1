type Graph = {
  ctx: AudioContext;
  master: GainNode;
  timer: number;
};

/** Tiny synthesized jungle bed: wind, two drones, a drip, a roar, a dig. No audio files. */
export class JungleAudio {
  private graph: Graph | null = null;
  muted = false;

  start() {
    if (this.graph) {
      if (this.graph.ctx.state === "suspended") void this.graph.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.2;
    master.connect(ctx.destination);

    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      channel[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 380;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.16;
    noise.connect(lowpass).connect(noiseGain).connect(master);
    noise.start();

    for (const freq of [110, 164.81]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = 0.03;
      osc.connect(gain).connect(master);
      osc.start();
    }

    const timer = window.setInterval(() => this.drip(), 4800);
    this.graph = { ctx, master, timer };
    if (ctx.state === "suspended") void ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.graph) return;
    this.graph.master.gain.setTargetAtTime(muted ? 0 : 0.2, this.graph.ctx.currentTime, 0.04);
  }

  tap() {
    this.tone(640, 0.07, "triangle", 0.045);
  }

  dig() {
    this.tone(130, 0.12, "sine", 0.09);
    this.tone(86, 0.16, "triangle", 0.05);
  }

  hatch() {
    this.tone(523.25, 0.12, "sine", 0.06);
    window.setTimeout(() => this.tone(659.25, 0.14, "sine", 0.06), 90);
    window.setTimeout(() => this.tone(783.99, 0.22, "sine", 0.06), 180);
  }

  drip() {
    this.tone(860 + Math.random() * 380, 0.16, "sine", 0.02);
  }

  roar() {
    const graph = this.graph;
    if (!graph) return;
    const { ctx, master } = graph;
    const duration = 0.5;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(460, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.32, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start();
  }

  private tone(freq: number, duration: number, type: OscillatorType, level: number) {
    if (!this.graph) return;
    const { ctx, master } = this.graph;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(level, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(master);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }
}
