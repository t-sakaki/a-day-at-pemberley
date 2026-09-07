/**
 * 見学部屋（Tour Room）の一枚絵
 * A Day at Pemberley - Watercolor Visual System (Canvas 2D版)
 *
 * TourSystem.ts の4部屋（gallery / music / window / grounds）を、
 * EstateScene と同じ水彩パレットで正面向きの一枚絵として描く。
 * 整い具合（readiness の band）で、光の当たり方や埃・乱れの有無を変える。
 */

import { WatercolorPalette, lerpColor, rgba } from './ColorPalette';
import type { TourRoomId, ObservationBand } from '../systems/TourSystem';

export type RoomSceneInput = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  roomId: TourRoomId;
  band: ObservationBand;
  t: number; // 経過秒（ろうそくの揺らぎなどに使用）
};

const P = WatercolorPalette;

/** 決定論的疑似乱数（フレーム間で安定させるため） */
function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function warmthOf(band: ObservationBand): number {
  return band === 'warm' ? 1 : band === 'civil' ? 0.6 : 0.28;
}

export function drawRoom({ ctx, width: w, height: h, roomId, band, t }: RoomSceneInput): void {
  const warmth = warmthOf(band);
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  drawWalls(ctx, w, h, warmth);

  if (roomId === 'gallery') drawGallery(ctx, w, h, warmth, band, t);
  else if (roomId === 'music') drawMusicRoom(ctx, w, h, warmth, band, t);
  else if (roomId === 'window') drawWestWindow(ctx, w, h, warmth, band, t);
  else drawLakeWalk(ctx, w, h, warmth, band, t);

  drawVignette(ctx, w, h, band);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 共通：壁と床
// ---------------------------------------------------------------------------

function drawWalls(ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number) {
  const wallTop = lerpColor('#7a6a52', '#c9a876', warmth);
  const wallBottom = lerpColor('#5a4d3a', '#a4885e', warmth);
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  wallGrad.addColorStop(0, wallTop);
  wallGrad.addColorStop(1, wallBottom);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h * 0.72);

  // 床
  const floorGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
  floorGrad.addColorStop(0, lerpColor('#3a2e22', '#6b5138', warmth));
  floorGrad.addColorStop(1, lerpColor('#241c15', '#4a3826', warmth));
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // 幅木（腰壁）
  ctx.fillStyle = rgba(P.ink, 0.35);
  ctx.fillRect(0, h * 0.68, w, h * 0.045);
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, band: ObservationBand) {
  const grad = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.15, w / 2, h * 0.42, h * 0.85);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(10,8,4,${band === 'wanting' ? 0.5 : 0.32})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------------------
// 肖像画の間
// ---------------------------------------------------------------------------

function drawGallery(ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number, band: ObservationBand, t: number) {
  const count = 3;
  const gap = w / (count + 1);
  for (let i = 0; i < count; i++) {
    const cx = gap * (i + 1);
    const frameW = w * 0.16;
    const frameH = h * 0.34;
    const top = h * 0.14;
    drawGiltFrame(ctx, cx - frameW / 2, top, frameW, frameH, warmth);
    // 肖像（簡略化した楕円の胸像シルエット）
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - frameW / 2 + 8, top + 8, frameW - 16, frameH - 16);
    ctx.clip();
    const skinTone = lerpColor('#7d6248', '#e8c9a0', warmth);
    ctx.fillStyle = rgba(skinTone, 0.9);
    ctx.beginPath();
    ctx.ellipse(cx, top + frameH * 0.42, frameW * 0.22, frameH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(lerpColor('#2a2f3a', '#3f4a63', warmth), 0.85);
    ctx.beginPath();
    ctx.ellipse(cx, top + frameH * 0.82, frameW * 0.34, frameH * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (band === 'wanting') {
      // 額縁に薄い埃
      ctx.fillStyle = rgba('#b8ac8e', 0.22);
      ctx.fillRect(cx - frameW / 2, top, frameW, 6);
    }
  }
  drawChandelier(ctx, w, h, warmth, t);
}

function drawGiltFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, warmth: number) {
  const gold = lerpColor('#5a4a2e', '#d8b45a', warmth);
  ctx.fillStyle = gold;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = P.paper;
  ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
  ctx.strokeStyle = rgba(P.ink, 0.4);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
}

// ---------------------------------------------------------------------------
// 音楽室
// ---------------------------------------------------------------------------

function drawMusicRoom(ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number, band: ObservationBand, t: number) {
  drawMolding(ctx, w, h, warmth);

  // 壁の羽目板パネル
  for (let i = 0; i < 4; i++) {
    const px = w * 0.04 + i * w * 0.16;
    drawWallPanel(ctx, px, h * 0.06, w * 0.12, h * 0.5, warmth);
  }

  // 大きな窓（カーテン付き）
  const winW = w * 0.3;
  const winH = h * 0.4;
  const winX = w * 0.66;
  const winY = h * 0.1;
  drawWindow(ctx, winX, winY, winW, winH, warmth);
  drawCurtains(ctx, winX, winY, winW, winH, warmth, band);

  // 敷物
  drawRug(ctx, w * 0.5, h * 0.86, w * 0.5, h * 0.16, warmth, '#7c3f3a', '#c99a5b');

  // ピアノフォルテ（側面シルエット、脚と装飾つき）
  const baseX = w * 0.1;
  const baseY = h * 0.62;
  const pW = w * 0.42;
  const pH = h * 0.16;
  const woodDark = lerpColor('#241a10', '#4a3320', warmth);
  const woodLight = lerpColor('#2e2216', '#5a4128', warmth);

  // 脚
  ctx.strokeStyle = rgba(woodDark, 0.9);
  ctx.lineWidth = 4;
  [0.06, 0.5, 0.94].forEach(f => {
    ctx.beginPath();
    ctx.moveTo(baseX + pW * f, baseY + pH * 1.3);
    ctx.lineTo(baseX + pW * f, baseY + pH * 2.1);
    ctx.stroke();
  });

  ctx.fillStyle = rgba(woodDark, 0.95);
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(baseX + pW, baseY - pH * 0.3);
  ctx.lineTo(baseX + pW, baseY + pH);
  ctx.lineTo(baseX, baseY + pH * 1.4);
  ctx.closePath();
  ctx.fill();
  // 木目のハイライト
  ctx.strokeStyle = rgba('#8a6a3e', 0.25);
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(baseX + (pW / 4) * i, baseY + pH * (1.4 - i * 0.02));
    ctx.lineTo(baseX + (pW / 4) * i, baseY - pH * 0.3 + pH * (i * 0.02));
    ctx.stroke();
  }

  const lidOpen = band !== 'wanting';
  if (lidOpen) {
    ctx.fillStyle = rgba(woodLight, 0.9);
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(baseX + pW * 0.55, baseY - pH * 1.6);
    ctx.lineTo(baseX + pW, baseY - pH * 0.3);
    ctx.closePath();
    ctx.fill();
    // 開いた蓋を支える棒
    ctx.strokeStyle = rgba(woodDark, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(baseX + pW * 0.7, baseY - pH * 0.5);
    ctx.lineTo(baseX + pW * 0.62, baseY - pH * 1.15);
    ctx.stroke();
  }

  // 鍵盤
  ctx.fillStyle = rgba('#e8ddc8', band === 'wanting' ? 0.5 : 0.85);
  ctx.fillRect(baseX + pW * 0.08, baseY + pH * 1.02, pW * 0.5, pH * 0.28);
  ctx.strokeStyle = rgba(P.ink, 0.3);
  ctx.lineWidth = 0.6;
  for (let i = 1; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(baseX + pW * 0.08 + (pW * 0.5 / 12) * i, baseY + pH * 1.02);
    ctx.lineTo(baseX + pW * 0.08 + (pW * 0.5 / 12) * i, baseY + pH * 1.3);
    ctx.stroke();
  }

  // 譜面台の楽譜
  ctx.fillStyle = rgba('#f4ecd8', band === 'civil' ? 0.55 : 0.8);
  const sheetX = baseX + pW * 0.3;
  const sheetY = baseY - pH * 0.55;
  const scatter = band === 'civil' ? 6 : 0;
  ctx.save();
  ctx.translate(sheetX, sheetY);
  ctx.rotate((rnd(3) - 0.5) * 0.06 * (scatter ? 3 : 1));
  ctx.fillRect(0, 0, pW * 0.22, pH * 0.4);
  ctx.strokeStyle = rgba(P.ink, 0.2);
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 4; i++) ctx.strokeRect(2, i * pH * 0.09, pW * 0.22 - 4, 0);
  ctx.restore();

  // 譜面台のもう一枚（civil/wantingで床に散らばる）
  if (band !== 'warm') {
    ctx.save();
    ctx.translate(baseX + pW * 0.72, baseY + pH * 1.55);
    ctx.rotate(0.4 + rnd(7) * 0.3);
    ctx.fillStyle = rgba('#f4ecd8', 0.7);
    ctx.fillRect(0, 0, pW * 0.16, pH * 0.28);
    ctx.restore();
  }

  drawWallSconce(ctx, w * 0.06, h * 0.28, warmth * 0.8, t, 11);
  drawChandelier(ctx, w, h, warmth * 0.85, t);
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, warmth: number) {
  const skyTop = lerpColor(P.sky.dusk, P.sky.noon, warmth);
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(1, lerpColor(P.foliage.green, P.foliage.dry, warmth * 0.5));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = rgba(P.ink, 0.55);
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// 共通装飾：カーテン・敷物・羽目板・蛇腹（モールディング）・壁灯
// ---------------------------------------------------------------------------

function drawCurtains(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, warmth: number, band: ObservationBand) {
  const fabric = lerpColor('#5a2e30', '#a0453f', warmth);
  const drawSide = (side: -1 | 1) => {
    const originX = side === -1 ? x : x + w;
    const spread = band === 'wanting' ? w * 0.22 : w * 0.14;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(originX, y - h * 0.06);
    ctx.lineTo(originX + side * spread, y + h * 0.08);
    for (let i = 0; i < 4; i++) {
      const fy = y + h * (0.1 + i * 0.24);
      const bow = Math.sin(i * 1.7) * spread * 0.18;
      ctx.quadraticCurveTo(originX + side * (spread * 0.6 + bow), fy, originX + side * spread * 0.75, fy + h * 0.2);
    }
    ctx.lineTo(originX, y + h * 1.12);
    ctx.closePath();
    ctx.fillStyle = rgba(fabric, 0.88);
    ctx.fill();
    ctx.strokeStyle = rgba(P.ink, 0.25);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };
  drawSide(-1);
  drawSide(1);
  // 上部の帯（ペルメット）
  ctx.fillStyle = rgba(fabric, 0.92);
  ctx.fillRect(x - w * 0.08, y - h * 0.1, w * 1.16, h * 0.08);
}

function drawRug(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, warmth: number, colorA: string, colorB: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.36);
  const steps = 3;
  for (let i = steps; i >= 0; i--) {
    const f = i / steps;
    ctx.fillStyle = rgba(lerpColor(colorA, colorB, warmth * (i % 2 === 0 ? 0.6 : 1)), 0.5 + f * 0.2);
    ctx.beginPath();
    ctx.ellipse(0, 0, (w / 2) * (1 - f * 0.16), (w / 2) * (1 - f * 0.16), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWallPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, warmth: number) {
  ctx.strokeStyle = rgba(P.ink, 0.22);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeRect(x + w * 0.12, y + h * 0.06, w * 0.76, h * 0.88);
}

function drawMolding(ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number) {
  ctx.fillStyle = rgba(lerpColor('#3a2f1f', '#e8dcbe', warmth), 0.5);
  ctx.fillRect(0, h * 0.02, w, h * 0.02);
  ctx.strokeStyle = rgba(P.ink, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.04);
  ctx.lineTo(w, h * 0.04);
  ctx.stroke();
}

function drawWallSconce(ctx: CanvasRenderingContext2D, x: number, y: number, warmth: number, t: number, seed: number) {
  ctx.strokeStyle = rgba('#c9a15a', 0.6 * warmth + 0.15);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x, y);
  ctx.stroke();
  const flicker = 0.75 + Math.sin(t * 3.2 + seed) * 0.15;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 16);
  glow.addColorStop(0, rgba(P.light, Math.min(1, warmth * flicker)));
  glow.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba('#fff3c9', warmth);
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// 西の大窓
// ---------------------------------------------------------------------------

function drawWestWindow(ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number, band: ObservationBand, t: number) {
  drawMolding(ctx, w, h, warmth);
  drawWallPanel(ctx, w * 0.04, h * 0.06, w * 0.24, h * 0.58, warmth);
  drawWallPanel(ctx, w * 0.72, h * 0.06, w * 0.24, h * 0.58, warmth);

  const winW = w * 0.6;
  const winH = h * 0.52;
  const winX = (w - winW) / 2;
  const winY = h * 0.08;

  const openFraction = band === 'wanting' ? 0.35 : band === 'civil' ? 0.75 : 1;

  const sky = ctx.createLinearGradient(0, winY, 0, winY + winH);
  sky.addColorStop(0, lerpColor(P.sky.dusk, P.sky.morning, warmth));
  sky.addColorStop(0.55, lerpColor(P.sky.dawn, P.sky.noon, warmth));
  sky.addColorStop(1, lerpColor(P.foliage.brown, P.ground.grass, warmth));
  ctx.fillStyle = sky;
  ctx.fillRect(winX, winY, winW, winH);

  // 遠景の丘と川
  ctx.fillStyle = rgba(lerpColor(P.foliage.brown, P.foliage.green, warmth), 0.7);
  ctx.beginPath();
  ctx.moveTo(winX, winY + winH * 0.62);
  ctx.quadraticCurveTo(winX + winW * 0.3, winY + winH * 0.5, winX + winW * 0.55, winY + winH * 0.6);
  ctx.quadraticCurveTo(winX + winW * 0.8, winY + winH * 0.68, winX + winW, winY + winH * 0.58);
  ctx.lineTo(winX + winW, winY + winH);
  ctx.lineTo(winX, winY + winH);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rgba(lerpColor(P.sky.dawn, '#dbe8ea', warmth), 0.55);
  ctx.beginPath();
  ctx.moveTo(winX + winW * 0.2, winY + winH * 0.72);
  ctx.quadraticCurveTo(winX + winW * 0.5, winY + winH * 0.66, winX + winW * 0.85, winY + winH * 0.78);
  ctx.lineTo(winX + winW * 0.85, winY + winH * 0.86);
  ctx.quadraticCurveTo(winX + winW * 0.5, winY + winH * 0.78, winX + winW * 0.2, winY + winH * 0.84);
  ctx.closePath();
  ctx.fill();

  // 窓枠
  ctx.strokeStyle = rgba(P.ink, 0.6);
  ctx.lineWidth = 6;
  ctx.strokeRect(winX, winY, winW, winH);
  for (let i = 1; i < 3; i++) {
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(winX + (winW / 3) * i, winY);
    ctx.lineTo(winX + (winW / 3) * i, winY + winH);
    ctx.stroke();
  }

  // 半分閉じた鎧戸（wanting/civil で残す）
  if (openFraction < 1) {
    const shutterH = winH * (1 - openFraction);
    ctx.fillStyle = rgba(lerpColor('#3a2e20', '#6b5138', warmth), 0.92);
    ctx.fillRect(winX, winY, winW, shutterH);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = rgba(P.ink, 0.3);
      ctx.fillRect(winX, winY + (shutterH / 6) * i, winW, 2);
    }
  }

  drawCurtains(ctx, winX, winY, winW, winH, warmth, band);

  // 窓下の座り台（window seat）とクッション
  const seatY = winY + winH + 8;
  ctx.fillStyle = rgba(lerpColor('#3a2e20', '#6b5138', warmth), 0.9);
  ctx.fillRect(winX - 8, seatY, winW + 16, h * 0.05);
  ctx.fillStyle = rgba(lerpColor('#5a2e30', '#a0453f', warmth), 0.85);
  ctx.beginPath();
  ctx.ellipse(winX + winW * 0.28, seatY + h * 0.012, winW * 0.13, h * 0.028, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(winX + winW * 0.72, seatY + h * 0.012, winW * 0.13, h * 0.028, 0, 0, Math.PI * 2);
  ctx.fill();

  // 鉢植え（片隅に置いた観葉植物）
  drawPottedPlant(ctx, w * 0.9, h * 0.7, w * 0.07, h * 0.22, warmth);

  // 窓台の埃（wanting）
  if (band === 'wanting') {
    ctx.fillStyle = rgba('#b8ac8e', 0.28);
    ctx.fillRect(winX, winY + winH + 4, winW, 5);
  }
}

function drawPottedPlant(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, warmth: number) {
  ctx.fillStyle = rgba(lerpColor('#6b4c2e', '#a4885e', warmth), 0.9);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.4, y);
  ctx.lineTo(x + w * 0.4, y);
  ctx.lineTo(x + w * 0.28, y + h * 0.3);
  ctx.lineTo(x - w * 0.28, y + h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba(lerpColor(P.foliage.brown, P.foliage.green, warmth), 0.85);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 4 - 0.5) * 1.3;
    ctx.beginPath();
    ctx.ellipse(x + Math.sin(angle) * w * 0.5, y - h * 0.55 + Math.cos(angle) * h * 0.18, w * 0.32, h * 0.42, angle * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// 湖畔の道（屋外）
// ---------------------------------------------------------------------------

function drawLakeWalk(ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number, band: ObservationBand, t: number) {
  // 空
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  sky.addColorStop(0, lerpColor(P.sky.dusk, P.sky.morning, warmth));
  sky.addColorStop(1, lerpColor(P.sky.dawn, P.sky.noon, warmth));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.55);

  // 雲
  for (let i = 0; i < 3; i++) {
    const cx = w * (0.15 + i * 0.35) + Math.sin(t * 0.05 + i) * 4;
    const cy = h * (0.12 + i * 0.05);
    ctx.fillStyle = rgba(P.light, 0.22 * warmth + 0.05);
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.09, h * 0.028, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 遠景のペンバリー屋敷（対岸の丘の上）
  const houseX = w * 0.66;
  const houseY = h * 0.42;
  ctx.fillStyle = rgba(lerpColor('#4a3f30', '#b8a67e', warmth), 0.55);
  ctx.fillRect(houseX, houseY, w * 0.2, h * 0.09);
  ctx.beginPath();
  ctx.moveTo(houseX - 4, houseY);
  ctx.lineTo(houseX + w * 0.1, houseY - h * 0.05);
  ctx.lineTo(houseX + w * 0.2 + 4, houseY);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = rgba(P.ink, 0.3);
    ctx.fillRect(houseX + w * 0.02 + i * w * 0.045, houseY + h * 0.03, w * 0.014, h * 0.04);
  }

  // 湖（水面のグラデーション＋映り込み）
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(w * 0.6, h * 0.62, w * 0.44, h * 0.15, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = rgba(lerpColor('#3a4a52', '#8fb0bc', warmth), 0.85);
  ctx.fillRect(0, h * 0.47, w, h * 0.3);
  // 屋敷と空の映り込み（上下反転・薄く）
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.translate(0, h * 1.24);
  ctx.scale(1, -1);
  ctx.fillStyle = rgba(lerpColor('#4a3f30', '#b8a67e', warmth), 0.6);
  ctx.fillRect(houseX, houseY, w * 0.2, h * 0.09);
  ctx.restore();
  // さざ波
  ctx.strokeStyle = rgba(P.light, 0.2 * warmth + 0.05);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const ry = h * 0.56 + i * h * 0.045;
    ctx.beginPath();
    ctx.moveTo(w * 0.24, ry);
    for (let x = w * 0.24; x <= w * 0.94; x += w * 0.05) {
      ctx.lineTo(x, ry + Math.sin(x * 0.05 + t * 0.6 + i) * 2);
    }
    ctx.stroke();
  }
  ctx.restore();

  // 白鳥（warm/civilで見える）
  if (band !== 'wanting') {
    drawSwan(ctx, w * 0.52 + Math.sin(t * 0.15) * 6, h * 0.63, w * 0.03);
  }

  // 岸辺の道
  ctx.fillStyle = rgba(lerpColor('#5a4a34', P.ground.path, warmth), 0.9);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.78);
  ctx.quadraticCurveTo(w * 0.4, h * 0.68, w, h * 0.74);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  // 小道の踏み石の質感
  ctx.strokeStyle = rgba(P.ink, 0.12);
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const px = w * (i / 5.5) + w * 0.02;
    const py = h * 0.82 + rnd(i + 20) * h * 0.1;
    ctx.beginPath();
    ctx.ellipse(px, py, w * 0.03, h * 0.012, 0.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 木々（前景・奥行きのある2列）
  for (let i = 0; i < 4; i++) {
    const x = (w / 4) * i + w * 0.06;
    const y = h * 0.46 + rnd(i + 40) * h * 0.03;
    drawTree(ctx, x, y, w * 0.035, h * 0.06, warmth, 0.55);
  }
  for (let i = 0; i < 5; i++) {
    const x = (w / 5) * i + w * 0.09;
    const y = h * 0.53 + rnd(i) * h * 0.05;
    drawTree(ctx, x, y, w * 0.055, h * 0.1, warmth, 0.85);
  }

  if (band === 'civil') {
    // 手押し車と熊手
    ctx.fillStyle = rgba('#4a3826', 0.8);
    ctx.fillRect(w * 0.3, h * 0.8, w * 0.1, h * 0.02);
    ctx.strokeStyle = rgba('#3a2e20', 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.79);
    ctx.lineTo(w * 0.48, h * 0.72);
    ctx.stroke();
  }
  if (band === 'wanting') {
    // 轍の水たまり
    ctx.fillStyle = rgba('#5a6a6a', 0.5);
    ctx.beginPath();
    ctx.ellipse(w * 0.45, h * 0.85, w * 0.06, h * 0.015, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.62, h * 0.9, w * 0.045, h * 0.012, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, warmth: number, opacity: number) {
  ctx.fillStyle = rgba(lerpColor(P.foliage.brown, P.foliage.green, warmth), opacity);
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(lerpColor('#5a4a34', P.foliage.dry, warmth), opacity * 0.7);
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.3, y - ry * 0.2, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(P.ink, 0.5 * opacity);
  ctx.fillRect(x - rx * 0.08, y, rx * 0.16, ry * 0.7);
}

function drawSwan(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = rgba('#f4f1ea', 0.9);
  ctx.beginPath();
  ctx.ellipse(x, y, s * 1.6, s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba('#f4f1ea', 0.9);
  ctx.lineWidth = s * 0.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 1.2, y - s * 0.2);
  ctx.quadraticCurveTo(x + s * 1.9, y - s * 1.6, x + s * 1.5, y - s * 2.1);
  ctx.stroke();
  ctx.fillStyle = rgba('#e8a23a', 0.9);
  ctx.beginPath();
  ctx.ellipse(x + s * 1.7, y - s * 2.15, s * 0.28, s * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// 共通装飾：シャンデリア
// ---------------------------------------------------------------------------

function drawChandelier(ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number, t: number) {
  const cx = w / 2;
  const topY = h * 0.02;
  const bodyY = h * 0.1;
  ctx.strokeStyle = rgba(P.ink, 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx, bodyY);
  ctx.stroke();

  const armCount = 5;
  for (let i = 0; i < armCount; i++) {
    const angle = (i / (armCount - 1) - 0.5) * Math.PI * 0.7;
    const ax = cx + Math.sin(angle) * w * 0.09;
    const ay = bodyY + Math.cos(angle) * h * 0.015 + h * 0.02;
    ctx.strokeStyle = rgba('#c9a15a', 0.7 * warmth + 0.2);
    ctx.beginPath();
    ctx.moveTo(cx, bodyY);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    const flicker = 0.75 + Math.sin(t * 3 + i) * 0.15;
    const glow = ctx.createRadialGradient(ax, ay, 0, ax, ay, 14);
    glow.addColorStop(0, rgba(P.light, Math.min(1, warmth * flicker)));
    glow.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ax, ay, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgba('#fff3c9', warmth);
    ctx.beginPath();
    ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
