type Tone = OscillatorType;

export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  unlock(): void {
    const ctx = this.context();
    if (ctx?.state === 'suspended') void ctx.resume();
  }

  click(): void {
    this.tone(640, 0.05, 'sine', 0.04);
  }

  launch(): void {
    this.noise(0.16, 0.05, 900);
    this.tone(420, 0.12, 'triangle', 0.05);
    this.tone(220, 0.16, 'sine', 0.04, 0.02);
  }

  bounce(speed: number): void {
    const gain = Math.min(0.06, 0.02 + speed / 12000);
    this.tone(180 + Math.min(speed, 700) * 0.35, 0.06, 'triangle', gain);
  }

  collect(): void {
    this.tone(660, 0.08, 'sine', 0.05);
    this.tone(990, 0.12, 'sine', 0.04, 0.05);
  }

  drain(): void {
    this.noise(0.22, 0.06, 240);
    this.tone(160, 0.2, 'sine', 0.05);
  }

  win(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      this.tone(freq, 0.16, 'sine', 0.05, index * 0.08);
    });
  }

  fail(): void {
    this.tone(311, 0.14, 'sine', 0.04);
    this.tone(196, 0.22, 'triangle', 0.04, 0.1);
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    this.ctx = new Ctx();
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: Tone, gain: number, delay = 0): void {
    const ctx = this.context();
    if (!ctx || this.muted || gain <= 0) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private noise(duration: number, gain: number, freq: number): void {
    const ctx = this.context();
    if (!ctx || this.muted) return;
    const count = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, count, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < count; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const amp = ctx.createGain();
    const start = ctx.currentTime;
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    source.start(start);
  }
}
