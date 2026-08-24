/**
 * 水彩素材（Watercolor Material）モジュール
 * A Day at Pemberley - Watercolor Visual System (Canvas 2D版)
 *
 * 描画時に個々の shape に適用する「水彩的な性質」をカプセル化する。
 * WatercolorPass（描画後の合成パス）とは役割分担する：
 * - WatercolorMaterial: 線を引く・塗る段階での色選択・縁の柔らかさ・ウォッシュ混色の指針
 * - WatercolorPass:　描画済みの Canvas 全体に後掛けする質感（紙ざわり・霞み・ヴィネットなど）
 *
 * 利用例（Canvas 2D描画ループ内）：
 * ```ts
 * const material = new WatercolorMaterial({
 *   baseColor: WatercolorPalette.stone.light,
 *   washColor: WatercolorPalette.shadow,
 *   edgeSoftness: 0.6,
 *   washStrength: 0.18,
 * });
 *
 * //  shapeを描く前にmaterialからcontextへの前処理を適用し、
 * //  draw終了後にmaterial.applyEdgeSoftening() を呼び出す。
 * material.beforeDraw(ctx);
 * drawMyPolygon(ctx, points);
 * material.applyEdgeSoftening(ctx, points, baseColor);
 * material.afterDraw(ctx, width, height);
 * ```
 */

import {
  WatercolorPalette,
  lerpColor,
  rgba,
  hexToRgb,
} from './ColorPalette';

// ---------------------------------------------------------------------------
// オプション型
// ---------------------------------------------------------------------------

/** WatercolorMaterial の生成オプション */
export interface WatercolorMaterialOptions {
  /**
   * ベースカラー（塗りの基準色）
   * 指定がない場合、paper（#f4f1ea）を使う。
   */
  baseColor?: string;

  /**
   * ウォッシュ（色層）として重ねる色
   * 指定がない場合、shadow（#6a5a4a）を使う。
   */
  washColor?: string;

  /**
   * エッジの柔らかさ（0〜1）
   * 0: 硬いインク線（EdgeSoftenerのminWidth/maxWidthを狭く）
   * 1: 非常に柔らかい、にじみ主体のエッジ
   */
  edgeSoftness?: number;

  /**
   * ウォッシュ強さ（0〜1）
   * 塗りに対してwashColorをどの程度重ねるか。
   */
  washStrength?: number;

  /**
   * 透明度（0〜1）
   * ベースの塗りについて適用するグローバルアルファ。
   */
  opacity?: number;

  /**
   * エッジ色を明示すべきかどうか
   * trueの場合、edgeColorが指定されていなければbaseColorから導出した色を使う。
   * falseの場合、エッジ処理をスキップする。
   */
  applyEdge?: boolean;

  /**
   * 明示的なエッジ色（任意）
   * 指定がある場合、edgeSoftnessにかかわらずこの色を使う。
   */
  edgeColor?: string;

  /**
   * にじみ（bleed）線の有無
   */
  addBleed?: boolean;

  /**
   * 階調量子化のステップ数（0なら適用しない）
   * 形状単位でtoon調の階調を付けたい場合に指定。
   */
  tonalSteps?: number;
}

/** 生成後に固定される読み取り専用プロパティ */
export interface ResolvedWatercolorMaterial {
  baseColor: string;
  washColor: string;
  edgeSoftness: number;
  washStrength: number;
  opacity: number;
  applyEdge: boolean;
  edgeColor: string | undefined;
  addBleed: boolean;
  tonalSteps: number;
}

// ---------------------------------------------------------------------------
// デフォルト
// ---------------------------------------------------------------------------

const DEFAULTS: Required<Pick<
  WatercolorMaterialOptions,
  'baseColor' | 'washColor' | 'edgeSoftness' | 'washStrength' | 'opacity' | 'applyEdge' | 'addBleed' | 'tonalSteps'
>> = {
  baseColor: WatercolorPalette.paper,
  washColor: WatercolorPalette.shadow,
  edgeSoftness: 0.5,
  washStrength: 0.15,
  opacity: 1.0,
  applyEdge: true,
  addBleed: true,
  tonalSteps: 0,
};

// ---------------------------------------------------------------------------
// クラス
// ---------------------------------------------------------------------------

export class WatercolorMaterial {
  readonly baseColor: string;
  readonly washColor: string;
  readonly edgeSoftness: number;
  readonly washStrength: number;
  readonly opacity: number;
  readonly applyEdge: boolean;
  readonly edgeColor: string | undefined;
  readonly addBleed: boolean;
  readonly tonalSteps: number;

  constructor(options: WatercolorMaterialOptions = {}) {
    this.baseColor = options.baseColor ?? DEFAULTS.baseColor;
    this.washColor = options.washColor ?? DEFAULTS.washColor;
    this.edgeSoftness = clamp01(options.edgeSoftness ?? DEFAULTS.edgeSoftness);
    this.washStrength = clamp01(options.washStrength ?? DEFAULTS.washStrength);
    this.opacity = clamp01(options.opacity ?? DEFAULTS.opacity);
    this.applyEdge = options.applyEdge ?? DEFAULTS.applyEdge;
    this.edgeColor = options.edgeColor;
    this.addBleed = options.addBleed ?? DEFAULTS.addBleed;
    this.tonalSteps = options.tonalSteps ?? DEFAULTS.tonalSteps;
  }

  // ------------------------------------------------------------------
  // 描画前処理
  // ------------------------------------------------------------------

  /**
   * shapeを描く直前に Canvas context に適用する前処理。
   *
   * - globalAlpha を material.opacity に設定
   * - globalCompositeOperation を 'multiply' に設定（水彩の重ね塗り感）
   *
   * 利用側の描画終了後には、通常WatercolorPass.apply() が以降の合成を担当する。
   * このメソッドはあくまで「このmaterialを使って描くときの前準備」である。
   */
  beforeDraw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.globalCompositeOperation = 'multiply';
  }

  /**
   * 描画後の後処理（material固有）。
   * beforeDrawでsaveした状態をrestoreする。
   *
   * WatercolorPass.apply() とは別に、material単位で行いたい後処理があれば
   * ここに追加する（現状はrestoreのみ）。
   */
  afterDraw(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // エッジソフト化（EdgeSoftenerのラップ）
  // ------------------------------------------------------------------

  /**
   * 与えられた頂点列に対して、このmaterialのエッジ設定で
   * ソフトな縁を適用する。
   *
   * edgeColorが明示されていればそれを使う。
   * なければbaseColorから導出した色を使う（EdgeSoftener.deriveEdgeColor相当の挙動）。
   *
   * edgeSoftnessに応じてminWidth/maxWidthを調整する：
   * - 柔らかい（1に近い） → 太く、にじみ強く
   * - 硬い（0に近い） → 細く、インク線寄り
   */
  applyEdgeSoftening(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    baseColorOverride?: string
  ): void {
    if (!this.applyEdge || points.length < 2) {
      return;
    }

    const baseColor = baseColorOverride ?? this.baseColor;
    const resolvedEdgeColor =
      this.edgeColor ?? EdgeSoftener.deriveEdgeColor(baseColor);

    // edgeSoftnessをminWidth/maxWidthに変換
    // edgeSoftness=0 → min1/max1.5（比較的硬い）
    // edgeSoftness=1 → min2.5/max5.0（柔らかい・にじみ寄り）
    const minWidth = lerp(1.0, 2.5, this.edgeSoftness);
    const maxWidth = lerp(1.5, 5.0, this.edgeSoftness);

    EdgeSoftener.apply(ctx, points, resolvedEdgeColor, {
      edgeColor: resolvedEdgeColor,
      minWidth,
      maxWidth,
      alpha: lerp(0.45, 0.7, this.edgeSoftness),
      addBleed: this.addBleed,
      bleedAlpha: lerp(0.12, 0.28, this.edgeSoftness),
    });
  }

  // ------------------------------------------------------------------
  // ウォッシュ適用（shape単位でwashColorを重ねるヘルパー）
  // ------------------------------------------------------------------

  /**
   * 現在の描画済み領域（または指定rect）に、washColorをウォッシュとして重ねる。
   * WatercolorPass.applyWashの縮小版・shape単位版と考えればよい。
   *
   * @param ctx 対象context
   * @param x x左
   * @param y y上
   * @param w 幅
   * @param h 高さ
   */
  applyWashToRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    if (this.washStrength <= 0 || w <= 0 || h <= 0) {
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = rgba(this.washColor, this.washStrength * 0.7);
    ctx.fillRect(x, y, w, h);

    // multiplyで少し色層を重ねる
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = this.washStrength * 0.4;
    ctx.fillStyle = this.washColor;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // 階調量子化（shape単位）
  // ------------------------------------------------------------------

  /**
   * 指定矩形内の描画済みピクセルに対して、階調量子化を適用する。
   * tonalStepsが0の場合は何もしない。
   */
  applyTonalQuantizationToRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    if (this.tonalSteps <= 0 || w <= 0 || h <= 0) {
      return;
    }

    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;

    const band = 255 / this.tonalSteps;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(Math.round(data[i] / band) * band);
      data[i + 1] = Math.round(Math.round(data[i + 1] / band) * band);
      data[i + 2] = Math.round(Math.round(data[i + 2] / band) * band);
    }

    ctx.putImageData(imageData, x, y);
  }

  // ------------------------------------------------------------------
  // ユーティリティ
  // ------------------------------------------------------------------

  /**
   * 現在のmaterial設定を要約したオブジェクトを返す。
   * ログ・デバッグ用の読み取り専用スナップショット。
   */
  getSummary(): Readonly<ResolvedWatercolorMaterial> {
    return {
      baseColor: this.baseColor,
      washColor: this.washColor,
      edgeSoftness: this.edgeSoftness,
      washStrength: this.washStrength,
      opacity: this.opacity,
      applyEdge: this.applyEdge,
      edgeColor: this.edgeColor,
      addBleed: this.addBleed,
      tonalSteps: this.tonalSteps,
    };
  }
}

// ---------------------------------------------------------------------------
// EdgeSoftener からのエッジ色導出を利用するための再エクスポート風ラッパ
// （WatercolorMaterial側でderiveEdgeColorを直接呼びたい場合に使用）
// ---------------------------------------------------------------------------

namespace EdgeSoftener {
  /**
   * 与えられた基底色から、自動的にエッジ色を導出
   * 明るい色なら少し暗く、暗い色なら少し明るくして、
   * エッジが目立ちすぎないようにする。
   */
  export function deriveEdgeColor(baseColor: string): string {
    const rgb = hexToRgb(baseColor);
    if (!rgb) {
      return WatercolorPalette.ink;
    }

    const { r, g, b } = rgb;
    const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

    const factor = luminance > 0.5 ? 0.78 : 1.28;

    const nr = Math.max(0, Math.min(255, Math.round(r * factor)));
    const ng = Math.max(0, Math.min(255, Math.round(g * factor)));
    const nb = Math.max(0, Math.min(255, Math.round(b * factor)));

    const toHex = (n: number): string => n.toString(16).padStart(2, '0');

    return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
  }

  /**
   * Canvas 2Dで「多角形の輪郭を柔らかく描く」ためのヘルパー
   *
   * 水彩では、ストロークが完全に均一な太さ・濃さにならない。
   * この関数は、与えられた頂点列に対して、
   * - 主線（エッジ本体）
   * - 必要ならにじみ線（bleed）
   * を描き、エッジの硬さを軽減する。
   *
   * @param ctx Canvas 2D context
   * @param points 描画する多角形の頂点列
   * @param baseColor 塗りつぶしに使った基底色（自動エッジ色補完用）
   * @param options ソフト化オプション
   */
  export function apply(
    ctx: CanvasRenderingContext2D,
    points: Array<{ x: number; y: number }>,
    baseColor: string,
    options: {
      edgeColor?: string;
      minWidth?: number;
      maxWidth?: number;
      alpha?: number;
      addBleed?: boolean;
      bleedAlpha?: number;
    } = {}
  ): void {
    const opts = {
      edgeColor: undefined,
      minWidth: 1,
      maxWidth: 2.5,
      alpha: 0.55,
      addBleed: true,
      bleedAlpha: 0.18,
      ...options,
    };

    if (points.length < 2) {
      return;
    }

    const edgeColor = opts.edgeColor ?? deriveEdgeColor(baseColor);

    // 主線（エッジ本体）
    drawPolygonEdge(
      ctx,
      points,
      edgeColor,
      opts.minWidth ?? 1,
      opts.maxWidth ?? 2.5,
      opts.alpha ?? 0.55
    );

    // にじみ線（エッジの外側にかすれた線）
    if (opts.addBleed) {
      drawBleedEdge(
        ctx,
        points,
        edgeColor,
        (opts.minWidth ?? 1) * 1.4,
        (opts.maxWidth ?? 2.5) * 1.4,
        opts.bleedAlpha ?? 0.18
      );
    }
  }
}

// EdgeSoftener.apply が使う内部ヘルパー（WatercolorMaterial.ts内に閉じる）

function drawPolygonEdge(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  color: string,
  minWidth: number,
  maxWidth: number,
  alpha: number
): void {
  const n = points.length;
  if (n < 2) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  for (let i = 0; i < n; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % n];

    // 頂点インデックスから決定的な疑似乱数を生成（フレーム間で一定 → 点滅しない）
    const segmentVariation = 0.7 + pseudoRandom(i * 2 + 1) * 0.6;
    const width = Math.max(
      minWidth,
      Math.min(maxWidth, (minWidth + maxWidth) / 2 * segmentVariation)
    );

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBleedEdge(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  color: string,
  minWidth: number,
  maxWidth: number,
  alpha: number
): void {
  const n = points.length;
  if (n < 2) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  for (let i = 0; i < n; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % n];

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) {
      continue;
    }

    const nx = -dy / len;
    const ny = dx / len;

    // 頂点インデックスから決定的な疑似乱数（フレーム間で一定 → 点滅しない）
    const offset = 0.6 + pseudoRandom(i * 2 + 2) * 1.4;

    const bleedP0 = {
      x: p0.x + nx * offset,
      y: p0.y + ny * offset,
    };
    const bleedP1 = {
      x: p1.x + nx * offset,
      y: p1.y + ny * offset,
    };

    const width = Math.max(
      minWidth * 0.6,
      Math.min(maxWidth * 0.8, (minWidth + maxWidth) / 2 * (0.6 + pseudoRandom(i * 2 + 3) * 0.5))
    );

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(bleedP0.x, bleedP0.y);
    ctx.lineTo(bleedP1.x, bleedP1.y);
    ctx.stroke();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 汎用ヘルパー
// ---------------------------------------------------------------------------

/** 0〜1 にクランプ */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** t∈[0,1] による線形補間 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 決定論的疑似乱数（フレーム間のチラつき防止） */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
