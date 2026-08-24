/**
 * Canvas 2D用「水彩合成パス」モジュール
 * A Day at Pemberley - Watercolor Visual System (Canvas 2D版)
 *
 * Three.jsの ShaderMaterial や FogExp2 に依存しない。
 * 描画済みの Canvas 上に、ピクチャレスク的水彩の質感を
 * 後掛け（合成）として適用する。
 */

import {
  WatercolorPalette,
} from './ColorPalette';
import { GeneratedPaperTexture, PaperTextureGenerator } from './PaperTextureGenerator';

/**
 * 水彩合成パスの共通オプション
 */
export interface WatercolorPassOptions {
  /**
   * 適用するモード
   * - 'day': 通常の明るい水彩
   * - 'night': 夜間の暗い水彩（キャンドル光などを想定）
   */
  mode?: 'day' | 'night';

  /**
   * 全体に対するウォッシュの強さ（0〜1）
   */
  washStrength?: number;

  /**
   * 紙ざわりの強さ（0〜1）
   */
  grainStrength?: number;

  /**
   * 階調量子化（toon shadingの精神）のステップ数
   * ※フリッカー防止のためデフォルト0（無効）
   */
  tonalSteps?: number;

  /**
   * ヴィネット（Claude Glass的暗まり）の強さ（0〜1）
   */
  vignetteStrength?: number;

  /**
   * 現在の時間帯に基づく大気遠近（霞み）の強さ（0〜1）
   * 0 なら適用しない。
   */
  atmosphericStrength?: number;

  /**
   * 霞ませる前景のための「空気吸収色」
   * 指定がない場合、デフォルト昼空色を使う。
   */
  airAbsorptionColor?: string;
}

/**
 * 便利なデフォルト値
 */
const DEFAULTS: Required<Omit<WatercolorPassOptions, 'airAbsorptionColor'>> = {
  mode: 'day',
  washStrength: 0.13,
  grainStrength: 1.0,
  tonalSteps: 0,
  vignetteStrength: 0.3,
  atmosphericStrength: 0.25,
};

/**
 * 水彩合成パス（Canvas 2D版）
 */
export class WatercolorPass {
  /**
   * Canvas 2D context に水彩合成パスを適用
   *
   * @param ctx 適用する Canvas 2D context
   * @param width Canvasの幅
   * @param height Canvasの高さ
   * @param options 合成オプション（省略可能。指定のない項目はデフォルトを使用）
   * @param paperTexture 任意の紙テクスチャ（未指定時は内部で生成）
   */
  static apply(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    options: WatercolorPassOptions = {},
    paperTexture?: GeneratedPaperTexture
  ): void {
    // 必要な値を決定
    const mode = options.mode ?? DEFAULTS.mode;
    const washStrength = options.washStrength ?? DEFAULTS.washStrength;
    const grainStrength = options.grainStrength ?? DEFAULTS.grainStrength;
    const vignetteStrength = options.vignetteStrength ?? DEFAULTS.vignetteStrength;
    const atmosphericStrength = options.atmosphericStrength ?? DEFAULTS.atmosphericStrength;
    const airAbsorptionColor = options.airAbsorptionColor ?? WatercolorPalette.sky.noon;

    const resolvedPaper = paperTexture ?? PaperTextureGenerator.generate({
      size: Math.min(width, height),
    });

    ctx.save();

    // 1. ウォッシュ（絵具の色層）
    if (washStrength > 0) {
      this.applyWash(ctx, width, height, mode, washStrength);
    }

    // 2. 紙ざわり（繊維・凹凸）
    if (grainStrength > 0) {
      this.applyPaperGrain(ctx, width, height, resolvedPaper, grainStrength);
    }

    // 3. 大気遠近（霞み）
    if (atmosphericStrength > 0) {
      this.applyAtmosphericAffect(ctx, width, height, atmosphericStrength, airAbsorptionColor);
    }

    // 4. ヴィネット
    if (vignetteStrength > 0) {
      this.applyVignette(ctx, width, height, vignetteStrength);
    }

    ctx.restore();
  }

  private static applyWash(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mode: 'day' | 'night',
    strength: number
  ): void {
    ctx.save();

    // 暖色（昼）か、寒色（夜）かでベースを変える
    const washColor = mode === 'night'
      ? `rgba(26,32,48,${strength * 0.9})`
      : `rgba(255,248,231,${strength * 0.7})`;

    // soft-light 合成で、明部を保ちつつ色味をのせる
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = washColor;
    ctx.fillRect(0, 0, width, height);

    // multiply で少し色層を重ねる
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = washColor;
    ctx.globalAlpha = strength * 0.4;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  private static applyPaperGrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    paper: GeneratedPaperTexture,
    strength: number
  ): void {
    if (!paper?.canvas) {
      return;
    }

    const { canvas, size } = paper;
    const countX = Math.ceil(width / size);
    const countY = Math.ceil(height / size);

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = strength * 0.18;

    // 事前生成された paper.canvas を直接 drawImage する（毎フレームの DOM 生成・putImageData を撤廃）
    for (let iy = 0; iy < countY; iy++) {
      for (let ix = 0; ix < countX; ix++) {
        const dx = ix * size;
        const dy = iy * size;
        ctx.drawImage(canvas, dx, dy, size, size);
      }
    }

    ctx.restore();
  }

  private static applyAtmosphericAffect(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    strength: number,
    airColor: string
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = strength * 0.35;
    ctx.fillStyle = airColor;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private static applyVignette(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    strength: number
  ): void {
    ctx.save();

    const cx = width / 2;
    const cy = height / 2;
    const innerRadius = Math.min(width, height) * 0.28;
    const outerRadius = Math.max(width, height) * 0.7;

    const vignette = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    vignette.addColorStop(0, 'rgba(106,90,74,0)');
    vignette.addColorStop(1, `rgba(106,90,74,${strength * 0.3})`);

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}
