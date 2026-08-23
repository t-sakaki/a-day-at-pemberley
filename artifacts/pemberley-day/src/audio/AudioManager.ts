// 変更概要: 外部音源に依存しない、時間帯・天候・位置連動の環境音を管理する。

export type AudioScene = {
  minutes: number;
  rainy: boolean;
  gardenDistance: number;
  houseDistance: number;
};
export type EventTone = 'arrival' | 'warning' | 'report' | 'walk';

export class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private wind: AudioBufferSourceNode | null = null;
  private river: OscillatorNode | null = null;
  private ambience: GainNode | null = null;
  private enabled = true;
  private pianoTimer = 0;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.master) this.master.gain.setTargetAtTime(enabled ? 0.16 : 0, this.master.context.currentTime, 0.08);
  }

  start() {
    if (this.context) {
      void this.context.resume().catch(() => undefined);
      return;
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      this.context = new Context();
    } catch {
      // AudioContext can be unavailable or blocked by browser policy.
      this.context = null;
      return;
    }
    this.master = this.context.createGain();
    this.master.gain.value = this.enabled ? 0.16 : 0;
    this.master.connect(this.context.destination);
    this.ambience = this.context.createGain();
    this.ambience.gain.value = 0.35;
    this.ambience.connect(this.master);

    const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    this.wind = this.context.createBufferSource();
    this.wind.buffer = buffer;
    this.wind.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const windGain = this.context.createGain();
    windGain.gain.value = 0.08;
    this.wind.connect(filter).connect(windGain).connect(this.ambience);
    this.wind.start();

    this.river = this.context.createOscillator();
    this.river.type = 'sine';
    this.river.frequency.value = 80;
    const riverGain = this.context.createGain();
    riverGain.gain.value = 0.018;
    this.river.connect(riverGain).connect(this.ambience);
    this.river.start();
  }

  update(scene: AudioScene) {
    if (!this.context || !this.ambience) return;
    const hour = scene.minutes / 60;
    const nearGarden = Math.max(0, 1 - scene.gardenDistance / 10);
    const nearHouse = Math.max(0, 1 - scene.houseDistance / 8);
    const timeGain = hour >= 6 && hour < 9 ? 0.48 : hour >= 17 ? 0.3 : 0.18;
    this.ambience.gain.setTargetAtTime((timeGain + nearGarden * 0.16 + (scene.rainy ? 0.14 : 0)) * (this.enabled ? 1 : 0), this.context.currentTime, 0.3);
    if (Math.random() < 0.012) this.chime(hour, nearHouse);
  }

  ringBell() {
    this.start();
    if (!this.context || !this.master) return;
    this.tone(392, 0.38, 0.1);
    window.setTimeout(() => this.tone(523, 0.46, 0.07), 120);
  }

  eventTone(kind: EventTone) {
    this.start();
    if (!this.context || !this.master) return;
    const tones: Record<EventTone, [number, number]> = {
      arrival: [523.25, 0.12],
      warning: [196, 0.2],
      report: [392, 0.1],
      walk: [659.25, 0.08],
    };
    const [frequency, duration] = tones[kind];
    this.tone(frequency, duration, kind === 'warning' ? 0.07 : 0.04);
  }

  staffArrived() {
    this.start();
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 2000;
    gain.gain.setValueAtTime(0.05, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.1);
  }

  playPianoNote(index: number) {
    this.start();
    const notes = [261.63, 293.66, 329.63, 392];
    this.tone(notes[index % notes.length], 0.22, 0.08);
  }

  dispose() {
    try { this.wind?.stop(); } catch { /* already stopped */ }
    try { this.river?.stop(); } catch { /* already stopped */ }
    window.clearTimeout(this.pianoTimer);
    void this.context?.close().catch(() => undefined);
    this.context = null;
    this.master = null;
    this.ambience = null;
    this.wind = null;
    this.river = null;
  }

  private tone(frequency: number, duration: number, volume: number) {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }

  private chime(hour: number, nearHouse: number) {
    if (hour >= 6 && hour < 9) this.tone(880, 0.1, 0.025);
    else if (hour >= 17 || hour < 6) this.tone(220, 0.18, 0.018);
    else if (nearHouse > 0.4) this.tone(196, 0.06, 0.015);
  }
}

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext; }
}