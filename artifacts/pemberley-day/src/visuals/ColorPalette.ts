/**
 * 18世紀イギリス透明水彩画のカラーパレット
 * A Day at Pemberley - Watercolor Visual System (Canvas 2D版)
 *
 * Three.jsに依存しない、ピクチャレスク的色設計の中心。
 */

export const WatercolorPalette = {
  sky: {
    dawn: '#a8b8c8',
    morning: '#b8c8d8',
    noon: '#c8d8e8',
    afternoon: '#c8d0d8',
    dusk: '#d8a890',
    night: '#1a2030',
  },
  foliage: {
    green: '#4a5d3f',
    brown: '#6b4c2e',
    dry: '#b8a878',
  },
  stone: {
    light: '#c4b5a0',
    shadow: '#8b7d6b',
    roof: '#5a5a5a',
  },
  ground: {
    path: '#a89070',
    wet: '#8b7355',
    grass: '#7a8f5e',
  },
  flower: {
    rose: '#c9a0b0',
    lavender: '#a898b8',
    cream: '#d4b896',
  },
  shadow: '#6a5a4a',
  light: '#fff8e7',
  paper: '#f4f1ea',
  ink: '#3a3020',
} as const;

export type ColorPalette = typeof WatercolorPalette;
export type SkyColorKey = keyof typeof WatercolorPalette.sky;
export type FoliageColorKey = keyof typeof WatercolorPalette.foliage;
export type StoneColorKey = keyof typeof WatercolorPalette.stone;
export type GroundColorKey = keyof typeof WatercolorPalette.ground;
export type FlowerColorKey = keyof typeof WatercolorPalette.flower;

/**
 * 2つのHEX色をtの値で補間するユーティリティ
 */
export function lerpColor(a: string, b: string, t: number): string {
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number): string => {
      const clamped = Math.max(0, Math.min(255, Math.round(n)));
      return clamped.toString(16).padStart(2, '0');
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const colorA = hexToRgb(a);
  const colorB = hexToRgb(b);

  const r = colorA.r + (colorB.r - colorA.r) * t;
  const g = colorA.g + (colorB.g - colorA.g) * t;
  const b_ = colorA.b + (colorB.b - colorA.b) * t;

  return rgbToHex(r, g, b_);
}

/**
 * 指定したHEX文字列のRGBA文字列を返すユーティリティ（alphaは0〜1）
 */
export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * HEX文字列からRGBオブジェクトを取得
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}
