/**
 * 軽量なエッジぼかし — Canvas 2D向け
 * A Day at Pemberley - Watercolor Visual System
 *
 * ポストプロセスは使用せず、Canvas 2Dの描画時に
 * 「輪郭が硬すぎないように見せる」ための補助ヘルパー。
 *
 * 水彩画の「手描き感」を出すための補助処理。
 * ジオメトリの法線を揺らす発想を、Canvas 2Dでは
 * 「エッジの描き方・太さ・色の混ざり方」の制御へ翻訳する。
 */

import { WatercolorPalette } from './ColorPalette';

/**
 * エッジソフト化を適用する際の設定
 */
export interface EdgeSofteningOptions {
  /**
   * エッジの色
   * 指定がない場合、描画対象の塗り色に応じて
   * 少し明るいか、少し暗い色を自動生成。
   */
  edgeColor?: string;

  /**
   * エッジの最小/最大太さ（ピクセル）
   */
  minWidth?: number;
  maxWidth?: number;

  /**
   * エッジの透明度（0〜1）
   */
  alpha?: number;

  /**
   * エッジを「にじませる」補助線を描くかどうか
   * trueの場合、主なエッジの外側にかすれた線を少し追加。
   */
  addBleed?: boolean;

  /**
   * にじみ線の透明度
   */
  bleedAlpha?: number;
}

/**
 * デフォルトのオプション
 */
const DEFAULT_OPTIONS: EdgeSofteningOptions = {
  edgeColor: undefined,
  minWidth: 1,
  maxWidth: 2.5,
  alpha: 0.55,
  addBleed: true,
  bleedAlpha: 0.18,
};

/**
 * Canvas 2Dで「多角形の輪郭を柔らかく描く」ためのヘルパー
 *
 * 水彩では、ストロークが完全に均一な太さ・濃さにならない。
 * この関数は、与えられた頂点列に対して、
 * - 主線（エッジ本体）
 * - 必要ならにじみ線（bleed）
 * を描き、エッジの硬さを軽減する。
 *
 * 利用側は、通常のポリゴンfillの直後にこのヘルパーを呼び、
 * 縁に柔らかいストロークを重ねる、といった使い方をする。
 *
 * @param ctx Canvas 2D context
 * @param points 描画する多角形の頂点列（時計回り・反時計回り不問）
 * @param baseColor 塗りつぶしに使った基底色（自動エッジ色補完用）
 * @param options ソフト化オプション
 */
export function applyEdgeSoftening(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  baseColor: string,
  options: EdgeSofteningOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

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

/**
 * 多角形のエッジを、太さが変化するストロークで描く
 */
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

    // エッジごとのランダム要素
    const segmentVariation = 0.7 + Math.random() * 0.6;
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

/**
 * 主線の外側に、少しずれてかすれた「にじみ線」を描く
 * エッジの硬さをさらに減らす。
 */
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

    // 外側へ少しずらす方向に、ランダム成分を含める
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) {
      continue;
    }

    const nx = -dy / len;
    const ny = dx / len;

    const offset = 0.6 + Math.random() * 1.4;

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
      Math.min(maxWidth * 0.8, (minWidth + maxWidth) / 2 * (0.6 + Math.random() * 0.5))
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

/**
 * 与えられた基底色から、自動的にエッジ色を導出
 * 水彩では、エッジが常に基底色と同じとは限らない。
 *
 * 簡易なルール：
 * - 基底色が明るければ、少し暗く
 * - 基底色が暗ければ、少し明るく
 *   して、エッジが目立ちすぎないようにする。
 */
function deriveEdgeColor(baseColor: string): string {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    return WatercolorPalette.ink;
  }

  const { r, g, b } = rgb;
  const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

  // 明度に応じて、明るい色なら少し暗く、暗い色なら少し明るく
  const factor = luminance > 0.5 ? 0.78 : 1.28;

  const nr = Math.max(0, Math.min(255, Math.round(r * factor)));
  const ng = Math.max(0, Math.min(255, Math.round(g * factor)));
  const nb = Math.max(0, Math.min(255, Math.round(b * factor)));

  const toHex = (n: number): string => n.toString(16).padStart(2, '0');

  return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

/**
 * HEX文字列からRGBオブジェクトを取得
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return null;
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}
