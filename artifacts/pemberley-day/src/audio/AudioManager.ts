// 変更概要: 外部音源に依存しない、時間帯・天候・位置連動の環境音を管理する。
import { strikeBell, createBellReverb } from './bell';

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
  private bellBus: GainNode | null = null;
  private lastChimeAt = -100;

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

  // 鐘専用チェーン：ドライ＋石造りの残響を master へ送る。初回に一度だけ組む。
  private ensureBellChain(): GainNode | null {
    if (!this.context || !this.master) return null;
    if (this.bellBus) return this.bellBus;
    const bus = this.context.createGain();
    // master が控えめ(0.16)なので鐘は前景イベントとして少し持ち上げる。
    bus.gain.value = 1.3;
    // 真鍮のような温かみと、飽和による穏やかなピーク抑制（tanh ソフトクリップ）。
    const shaper = this.context.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i += 1) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 1.7);
    }
    shaper.curve = curve;
    shaper.oversample = '2x';
    const dry = this.context.createGain();
    dry.gain.value = 0.82;
    const reverb = createBellReverb(this.context, 2.8);
    const wet = this.context.createGain();
    wet.gain.value = 0.5;
    bus.connect(shaper);
    shaper.connect(dry).connect(this.master);
    shaper.connect(reverb).connect(wet).connect(this.master);
    this.bellBus = bus;
    return bus;
  }

  // 館の鐘：教会の鐘のように二度撞く。二撞き目はやや弱く、余韻を残す。
  ringBell() {
    this.start();
    const bus = this.ensureBellChain();
    if (!this.context || !bus) return;
    const now = this.context.currentTime;
    strikeBell(this.context, bus, { strikeHz: 247, when: now, level: 0.5, brightness: 0.9 });
    strikeBell(this.context, bus, { strikeHz: 247, when: now + 1.45, level: 0.36, brightness: 0.82 });
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
    this.bellBus = null;
    this.lastChimeAt = -100;
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

  // 丘の向こうの教会の鐘。遠く、鈍く、控えめに。撞く間隔は最低20秒あける。
  private chime(hour: number, nearHouse: number) {
    if (!this.context) return;
    const now = this.context.currentTime;
    if (now - this.lastChimeAt < 20) return;
    const bus = this.ensureBellChain();
    if (!bus) return;
    this.lastChimeAt = now;
    // 夕刻ほど低く、日中は少し明るく。近くにいると心もち大きく。
    // 館の鐘と同じく二度撞き（遠くの教会が谷向こうで鳴っている風情）。
    const evening = hour >= 17 || hour < 7;
    const strikeHz = evening ? 208 : 233;
    const level = 0.09 + nearHouse * 0.05;
    strikeBell(this.context, bus, { strikeHz, when: now, level, brightness: 0.28 });
    strikeBell(this.context, bus, { strikeHz, when: now + 1.6, level: level * 0.78, brightness: 0.26 });
  }
}

declare global {
  interface Window { webkitAudioContext?: typeof AudioContext; }
}