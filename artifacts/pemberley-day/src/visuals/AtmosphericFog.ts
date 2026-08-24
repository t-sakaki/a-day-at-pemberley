/**
 * 空気遠近法と空のグラデーションを統合（Canvas 2D版）
 * A Day at Pemberley - Watercolor Visual System
 *
 * 時間帯に応じて Canvas 2Dの背景グラデーションと、
 * 前景の色を滑らかに遷移させる。Three.jsのFogExp2には依存しない。
 */

/**
 * 時間帯の定義
 * 6-9: dawn / morning
 * 9-12: morning
 * 12-14: noon
 * 14-17: afternoon
 * 17-19: dusk
 * 19-6: night
 */
export type TimeOfDay =
  | 'dawn'
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'dusk'
  | 'night';

/**
 * 時間帯マッピング（gameHour → TimeOfDay）
 */
const TIME_OF_DAY_MAP: Record<number, TimeOfDay> = {
  0: 'night',
  1: 'night',
  2: 'night',
  3: 'night',
  4: 'night',
  5: 'night',
  6: 'dawn',
  7: 'dawn',
  8: 'dawn',
  9: 'morning',
  10: 'morning',
  11: 'morning',
  12: 'noon',
  13: 'noon',
  14: 'afternoon',
  15: 'afternoon',
  16: 'afternoon',
  17: 'dusk',
  18: 'dusk',
  19: 'night',
  20: 'night',
  21: 'night',
  22: 'night',
  23: 'night',
};

/**
 * 時間帯ごとの空のグラデーション色（上/中/下）
 * ピクチャレスクの空気遠近に合わせ、前景の霞み具合もここから導く。
 */
const SKY_GRADIENT_COLORS: Record<TimeOfDay, { top: string; mid: string; bottom: string }> = {
  dawn: {
    top: '#a8b8c8',
    mid: '#d8c8b8',
    bottom: '#e8d8c8',
  },
  morning: {
    top: '#b8c8d8',
    mid: '#c8d0d8',
    bottom: '#d8e0d0',
  },
  noon: {
    top: '#c8d8e8',
    mid: '#c8d0d8',
    bottom: '#d8e0d0',
  },
  afternoon: {
    top: '#c8d0d8',
    mid: '#c8d0d8',
    bottom: '#d0d8c8',
  },
  dusk: {
    top: '#d8a890',
    mid: '#d0a8a0',
    bottom: '#c8a080',
  },
  night: {
    top: '#1a2030',
    mid: '#1a1a2e',
    bottom: '#0a0a1a',
  },
};

/**
 * 時間をTimeOfDayに変換
 */
function getTimeOfDay(gameHour: number): TimeOfDay {
  const hour = Math.floor(gameHour) % 24;
  const mapped = TIME_OF_DAY_MAP[hour];
  if (!mapped) {
    return 'night';
  }
  return mapped;
}

/**
 * 2つのTimeOfDay間を補間して色を取得
 */
function lerpBetweenTimeOfDays(
  from: TimeOfDay,
  to: TimeOfDay,
  t: number
): {
  top: string;
  mid: string;
  bottom: string;
} {
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return [0, 0, 0];
    }
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number): string =>
      Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const lerpColor = (
    hexA: string,
    hexB: string,
    t_: number
  ): string => {
    const [r1, g1, b1] = hexToRgb(hexA);
    const [r2, g2, b2] = hexToRgb(hexB);
    return rgbToHex(
      r1 + (r2 - r1) * t_,
      g1 + (g2 - g1) * t_,
      b1 + (b2 - b1) * t_
    );
  };

  return {
    top: lerpColor(SKY_GRADIENT_COLORS[from].top, SKY_GRADIENT_COLORS[to].top, t),
    mid: lerpColor(SKY_GRADIENT_COLORS[from].mid, SKY_GRADIENT_COLORS[to].mid, t),
    bottom: lerpColor(SKY_GRADIENT_COLORS[from].bottom, SKY_GRADIENT_COLORS[to].bottom, t),
  };
}

/**
 * 大気遠近法と空のグラデーションを管理
 *
 * Canvas 2Dのcontextに適用するための、背景グラデーション生成と、
 * 前景オブジェクトの霞み（色吸収）を取得するためのユーティリティ。
 */
export class AtmosphericFog {
  private currentHour: number = 12;
  private prevTimeOfDay: TimeOfDay = 'noon';
  private targetTimeOfDay: TimeOfDay = 'noon';
  private transitionProgress: number = 1.0;

  /**
   * 現在の空のグラデーション色を取得
   * 補間中であれば、滑らかに混ぜた結果を返す。
   */
  getSkyGradient(): { top: string; mid: string; bottom: string } {
    if (this.transitionProgress >= 1.0) {
      return {
        top: SKY_GRADIENT_COLORS[this.targetTimeOfDay].top,
        mid: SKY_GRADIENT_COLORS[this.targetTimeOfDay].mid,
        bottom: SKY_GRADIENT_COLORS[this.targetTimeOfDay].bottom,
      };
    }

    const t = this.transitionProgress;
    return lerpBetweenTimeOfDays(this.prevTimeOfDay, this.targetTimeOfDay, t);
  }

  /**
   * 前景オブジェクトを霞ませるための「空気吸収色」を取得
   * （遠景ほどこの色味に向かって吸収される、というピクチャレスク的効果用）
   */
  getAirAbsorptionColor(): string {
    const grad = this.getSkyGradient();
    return grad.mid;
  }

  /**
   * ゲーム時間を更新し、空のグラデーションを滑らかに遷移
   * @param gameHour 0-24のゲーム内時間
   * @param deltaTime フレーム間の経過時間（秒）
   */
  update(gameHour: number, deltaTime: number = 1 / 60): void {
    const newTimeOfDay = getTimeOfDay(gameHour);

    if (newTimeOfDay !== this.targetTimeOfDay) {
      this.prevTimeOfDay = this.targetTimeOfDay;
      this.targetTimeOfDay = newTimeOfDay;
      this.transitionProgress = 0;
    }

    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(
        1.0,
        this.transitionProgress + deltaTime * 60 * 0.5
      );
    }

    this.currentHour = gameHour;
  }

  /**
   * 即座に時間を設定（補間なし、瞬間切り替え）
   */
  setImmediate(gameHour: number): void {
    const timeOfDay = getTimeOfDay(gameHour);
    this.prevTimeOfDay = timeOfDay;
    this.targetTimeOfDay = timeOfDay;
    this.transitionProgress = 1.0;
    this.currentHour = gameHour;
  }

  /**
   * 現在のTimeOfDayを取得
   */
  getCurrentTimeOfDay(): TimeOfDay {
    return this.targetTimeOfDay;
  }

  /**
   * 現在のgameHourを取得
   */
  getCurrentHour(): number {
    return this.currentHour;
  }
}

/**
 * Canvas 2Dのcontextに、現在の時間帯の空のグラデーションを適用
 * @param ctx 適用するCanvas 2D context
 * @param fog 大気遠近法マネージャー
 * @param width グラデーションを描画する幅
 * @param height グラデーションを描画する高さ
 */
export function applySkyGradient(
  ctx: CanvasRenderingContext2D,
  fog: AtmosphericFog,
  width: number,
  height: number
): void {
  const grad = fog.getSkyGradient();

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, grad.top);
  gradient.addColorStop(0.5, grad.mid);
  gradient.addColorStop(1, grad.bottom);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
