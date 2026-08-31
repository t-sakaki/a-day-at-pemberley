// 教会の鐘 / 塔の鐘の加算合成。外部音源に依存しない。
// 鐘は倍音が非整数比で並ぶ（hum 0.5・prime 1・短三度の tierce 1.2・quint 1.5・
// nominal 2 …）。低い部分音ほど長く響き、打撃直後だけ高次倍音がきらめく。
// この「短三度を含む非整数倍音列＋長い減衰」が、あの物悲しくロマンチックな鐘の音色になる。

type AnyAudioContext = BaseAudioContext;

type BellPartial = { ratio: number; gain: number; decay: number };

// 実測の教会鐘に近い部分音の並び。tierce(短三度) を含むのが鐘らしさの要。
const PARTIALS: BellPartial[] = [
  { ratio: 0.5, gain: 0.55, decay: 9.0 }, // hum — 最も長く残る
  { ratio: 1.0, gain: 0.85, decay: 6.5 }, // prime / strike note
  { ratio: 1.19, gain: 0.55, decay: 5.0 }, // tierce（短三度）
  { ratio: 1.5, gain: 0.32, decay: 3.6 }, // quint（五度）
  { ratio: 2.0, gain: 0.42, decay: 3.0 }, // nominal（オクターブ）
  { ratio: 2.62, gain: 0.18, decay: 1.7 },
  { ratio: 3.55, gain: 0.13, decay: 1.1 },
  { ratio: 4.83, gain: 0.09, decay: 0.7 },
  { ratio: 6.1, gain: 0.05, decay: 0.45 },
];

export type BellStrikeOptions = {
  /** 打点音（strike note）の周波数 Hz。教会の鐘は 200〜300Hz あたりが温かい。 */
  strikeHz?: number;
  /** 発音時刻（ctx.currentTime 基準の絶対秒）。 */
  when?: number;
  /** 全体の音量 0..1。 */
  level?: number;
  /** 0=遠く鈍く（丘の向こうの鐘）… 1=すぐそば。高次倍音と明るさを制御。 */
  brightness?: number;
};

/**
 * 鐘を一撃鳴らす。destination（GainNode 等）へ接続する。
 * ライブでもオフラインレンダリングでも動くよう BaseAudioContext を受け取る。
 */
export function strikeBell(
  ctx: AnyAudioContext,
  destination: AudioNode,
  options: BellStrikeOptions = {},
): void {
  const strikeHz = options.strikeHz ?? 262;
  const when = options.when ?? ctx.currentTime;
  const level = options.level ?? 0.5;
  const brightness = options.brightness ?? 0.85;

  // 鐘全体をまとめるバス。わずかな低音ブーストと、明るさに応じたローパス。
  const bus = ctx.createGain();
  bus.gain.value = level;

  const shelf = ctx.createBiquadFilter();
  shelf.type = 'lowshelf';
  shelf.frequency.value = 180;
  shelf.gain.value = 4;

  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 1400 + brightness * 6000;
  tone.Q.value = 0.4;

  bus.connect(shelf).connect(tone).connect(destination);

  // 打撃の瞬間の「カツン」という金属的トランジェント（バンドパスノイズ）。
  const noiseDur = 0.09;
  const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseDur), ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i += 1) {
    nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noise;
  const noiseBand = ctx.createBiquadFilter();
  noiseBand.type = 'bandpass';
  noiseBand.frequency.value = strikeHz * 6;
  noiseBand.Q.value = 0.8;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.12 * (0.4 + brightness), when);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, when + noiseDur);
  noiseSource.connect(noiseBand).connect(noiseGain).connect(bus);
  noiseSource.start(when);
  noiseSource.stop(when + noiseDur);

  // 各部分音：立ち上がりは数ミリ秒、その後は指数減衰。
  for (const partial of PARTIALS) {
    // 明るさが低いと高次倍音を落として「遠い鐘」に。
    if (partial.ratio > 2.2 && brightness < 0.5 && Math.random() > brightness * 2) continue;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const base = strikeHz * partial.ratio;
    // わずかな不定調（±0.25%）で、鐘特有のうねり／きらめきを出す。
    const detune = (Math.random() * 2 - 1) * 0.0025;
    osc.frequency.value = base * (1 + detune);

    const g = ctx.createGain();
    const peak = partial.gain * (0.6 + level * 0.8);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.004);
    // 低い部分音ほど長く、明るさが低いと全体に少し短く。
    const decay = partial.decay * (0.7 + brightness * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);

    // 二拍のうなり（beating）を軽く加えるため、prime と tierce にゆっくりした LFO。
    if (partial.ratio === 1.0 || partial.ratio === 1.19) {
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 1.3 + Math.random() * 0.6;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = base * 0.0015;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(when);
      lfo.stop(when + decay);
    }

    osc.connect(g).connect(bus);
    osc.start(when);
    osc.stop(when + decay + 0.05);
  }
}

/**
 * 石造りの空間の残響。ノイズを指数減衰させた簡易インパルス応答を作り、
 * ConvolverNode に載せる。教会/塔の「余韻」を足す。
 */
export function createBellReverb(ctx: AnyAudioContext, seconds = 2.6): ConvolverNode {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.ceil(rate * seconds));
  const impulse = ctx.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      // 初期の密度＋なめらかな指数減衰。
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6) * (0.5 + 0.5 * (1 - t));
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}
