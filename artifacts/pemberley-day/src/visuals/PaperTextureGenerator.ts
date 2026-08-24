/**
 * 18世紀のラフな水彩紙（cold press paper）の質感を Canvas 2Dでプロシージャル生成
 * A Day at Pemberley - Watercolor Visual System (Canvas 2D版)
 *
 * 出力は THREE.CanvasTexture ではなく、HTML Canvas（あるいは ImageData）として返す。
 * ピクチャレスク水彩では、「紙」自体が表現の半分を占めるため、
 * 繊維・凹凸・かすれた露白が描画に重ねられることを想定している。
 */

import { WatercolorPalette } from './ColorPalette';

/**
 * 紙テクスチャを生成するオプション
 */
export interface PaperTextureOptions {
  size?: number;
  fiberCount?: number;
  bumpCount?: number;
  noiseStrength?: number;
}

/**
 * 生成結果
 * - canvas: <canvas>要素（2D描画用）そのもの
 * - data: ImageData（ピクセル操作したい場合）
 * - size: 生成サイズ
 */
export interface GeneratedPaperTexture {
  canvas: HTMLCanvasElement;
  data: ImageData;
  size: number;
}

/**
 * 水彩紙のテクスチャをCanvas 2D APIでプロシージャル生成
 * - ベース: オフホワイト #f4f1ea
 * - 繊維質のノイズ: ランダムな長さ・角度の薄いグレー線
 * - 凹凸の粒: ランダムな位置に小さな楕円
 * - ガウシアンノイズ: ピクセルごとに ±3 の輝度変動
 */
export class PaperTextureGenerator {
  /**
   * 水彩紙テクスチャを生成
   * @param options 生成オプション（省略時はデフォルト）
   * @returns GeneratedPaperTexture（canvas, data, size）
   */
  static generate(options: PaperTextureOptions = {}): GeneratedPaperTexture {
    const size = options.size ?? 512;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // 1. ベース: オフホワイト #f4f1ea
    ctx.fillStyle = WatercolorPalette.paper;
    ctx.fillRect(0, 0, size, size);

    // 2. 繊維質のノイズ: ランダムな長さ・角度の薄いグレー線
    PaperTextureGenerator.drawFiberLines(ctx, size, options.fiberCount);

    // 3. 凹凸の粒: ランダムな位置に小さな楕円
    PaperTextureGenerator.drawBumpParticles(ctx, size, options.bumpCount);

    // 4. 全体にわずかなガウシアンノイズ（ピクセルごとに ±3 の輝度変動）
    PaperTextureGenerator.addGaussianNoise(ctx, size, options.noiseStrength);

    // ImageDataを取得
    const data = ctx.getImageData(0, 0, size, size);

    return { canvas, data, size };
  }

  /**
   * 与えられたコンテキストに、紙の繊維を模した線を描画
   */
  static drawFiberLines(
    ctx: CanvasRenderingContext2D,
    size: number,
    fiberCount?: number
  ): void {
    const count = fiberCount ?? Math.floor(size * size * 0.00075);
    const baseColor = '#d8d4c8';

    ctx.save();
    for (let i = 0; i < count; i++) {
      const startX = Math.random() * size;
      const startY = Math.random() * size;
      const length = 5 + Math.random() * 25;
      const angle = Math.random() * Math.PI * 2;

      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;

      const alpha = 0.15 + Math.random() * 0.25;

      ctx.strokeStyle = baseColor;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 0.5 + Math.random() * 1.0;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * 紙の表面の凹凸を模した小さな楕円を描画
   */
  static drawBumpParticles(
    ctx: CanvasRenderingContext2D,
    size: number,
    bumpCount?: number
  ): void {
    const count = bumpCount ?? Math.floor(size * size * 0.00115);
    const baseColor = '#e0dcd0';

    ctx.save();
    for (let i = 0; i < count; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radiusX = 1 + Math.random() * 3;
      const radiusY = 0.5 + Math.random() * 2;
      const rotation = Math.random() * Math.PI;

      const alpha = 0.15 + Math.random() * 0.15;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      ctx.fillStyle = baseColor;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * CanvasのgetImageDataでピクセルごとに ±N の輝度変動を加える
   * 全体にわずかなガウシアンノイズを付与
   */
  static addGaussianNoise(
    ctx: CanvasRenderingContext2D,
    size: number,
    strength?: number
  ): void {
    const s = strength ?? 3;
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = generateGaussianNoise(s);

      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);
  }
}

/**
 * ボックスミューラー法によるガウシアン乱数生成
 */
function generateGaussianNoise(stdDev: number): number {
  let u = 0;
  let v = 0;

  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();

  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev;
}
