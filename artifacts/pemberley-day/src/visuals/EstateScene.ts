// ペンバリー領地の水彩絵。ポリゴンの塗りつぶしではなく、
// 少しゆらいだ輪郭・縁にたまる絵具・重ね塗りのにじみで「描いた」質感を出す。
// 人物は多角形の棒ではなく、リージェンシー期の装いのシルエット（ボンネットの淑女／
// 燕尾服の紳士）で描く。Canvas 2D のみ。WatercolorPass の前段で使う。

export type EstateFigureKind = 'lady' | 'gent' | 'steward';

export type FigureExpression = 'calm' | 'pleased' | 'concerned' | 'busy';

export type EstateFigure = {
  id: string;
  x: number;
  y: number;
  kind: EstateFigureKind;
  color: string;
  label?: string;
  urgent?: boolean;
  /** 表情（左パネルの肖像と揃える） */
  expression?: FigureExpression;
  /** 顔の向き。画面X方向の符号（-1 左, 0 正面, 1 右） */
  face?: number;
  /** 歩行中か（歩きの上下動・腕振りに使う） */
  moving?: boolean;
};

export type EstateSceneInput = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  mode: 'title' | 'game';
  time: number; // 秒。木々や水面のごく緩い揺れに使う
  hour: number; // 0..24。空と光の色
  rainy: boolean;
  isPhone: boolean;
  scale: number;
  figScale: number;
  project: (x: number, y: number, z?: number) => { x: number; y: number };
  figures: EstateFigure[];
};

type Pt = { x: number; y: number };

// 座標に紐づく決定的な擬似乱数（毎フレーム同じ値＝ちらつかない）。
function noise(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixHex(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], t)));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

// 時刻から空の上下2色を返す。
function skyColours(hour: number): [string, string] {
  const dawn: [string, string] = ['#efdcc9', '#d8c3a8'];
  const day: [string, string] = ['#e4e7df', '#cdd4c8'];
  const evening: [string, string] = ['#ecd0ac', '#c19c86'];
  if (hour < 8) {
    const t = Math.max(0, (hour - 6) / 2);
    return [mixHex(dawn[0], day[0], t), mixHex(dawn[1], day[1], t)];
  }
  if (hour < 16) return day;
  const t = Math.min(1, (hour - 16) / 3);
  return [mixHex(day[0], evening[0], t), mixHex(day[1], evening[1], t)];
}

function tracePath(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
}

// 多角形を「水彩の塗り」として置く。頂点を少しゆらし、重ね塗りし、縁に絵具をためる。
function wash(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  fill: string,
  opts: { seed: number; jitter?: number; edge?: string; alpha?: number } = { seed: 0 },
): void {
  const jitter = opts.jitter ?? 2.2;
  const alpha = opts.alpha ?? 1;
  const wobble = (p: Pt, k: number): Pt => ({
    x: p.x + (noise(opts.seed + k) - 0.5) * jitter,
    y: p.y + (noise(opts.seed + k + 99) - 0.5) * jitter,
  });

  ctx.save();
  // 2度の重ね塗り：わずかにずらして不均一なムラを出す。
  for (let pass = 0; pass < 2; pass += 1) {
    const shaped = pts.map((p, i) => wobble(p, i * 3 + pass * 7));
    tracePath(ctx, shaped);
    ctx.globalAlpha = alpha * (pass === 0 ? 0.9 : 0.32);
    ctx.fillStyle = pass === 0 ? fill : mixHex(fill, '#3c3327', 0.14);
    ctx.fill();
  }
  // 縁に沈む絵具。
  const rim = pts.map((p, i) => wobble(p, i * 3 + 40));
  tracePath(ctx, rim);
  ctx.globalAlpha = alpha * 0.5;
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = opts.edge ?? mixHex(fill, '#2f2a22', 0.4);
  ctx.stroke();
  ctx.restore();
}

// にじんだ楕円のひとかたまり（木の葉、噴水の水など）。
function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, alpha: number, rot = 0): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintTree(ctx: CanvasRenderingContext2D, base: Pt, r: number, seed: number, lean: number): void {
  // 幹：まっすぐでなく、ゆるく曲がった濃い一筆。
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#5b4632';
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.quadraticCurveTo(base.x + lean * 0.4, base.y - r * 0.9, base.x + lean, base.y - r * 1.5);
  ctx.stroke();
  ctx.restore();

  // 樹冠：3階調の不定形な葉かたまりを重ねる。輪郭線は引かない。
  const cx = base.x + lean;
  const cy = base.y - r * 1.5;
  const greens = ['#556b49', '#6f875a', '#8ea26a'];
  // まず濃いめの塊で芯を作る（透けすぎ防止）。
  blob(ctx, cx, cy, r * 0.95, r * 0.8, greens[0], 0.8);
  for (let k = 0; k < 6; k += 1) {
    const a = (k / 6) * Math.PI * 2 + seed;
    const rad = r * (0.3 + noise(seed + k) * 0.45);
    const bx = cx + Math.cos(a) * rad * 0.8;
    const by = cy + Math.sin(a) * rad * 0.5;
    const size = r * (0.42 + noise(seed + k + 5) * 0.34);
    blob(ctx, bx, by, size, size * 0.82, greens[1 + (k % 2)], 0.72);
  }
  // 明るい側のドライブラシ。
  for (let k = 0; k < 3; k += 1) {
    blob(ctx, cx - r * 0.35 + noise(seed + k) * r * 0.25, cy - r * 0.3 + noise(seed + k + 2) * r * 0.25, r * 0.2, r * 0.14, '#adbf85', 0.5);
  }
}

// リージェンシー期の人物シルエット。頭・胴（淑女はベル型のドレス、紳士は燕尾服）・影。
function paintFigure(ctx: CanvasRenderingContext2D, at: Pt, s: number, fig: EstateFigure): void {
  const now = performance.now();
  const shake = fig.urgent ? Math.sin(now / 90) * s * 0.06 : 0;
  // 歩行中の上下動
  const bob = fig.moving ? Math.abs(Math.sin(now / 130)) * s * 0.06 : Math.sin(now / 900 + at.x) * s * 0.012;
  const x = at.x + shake;
  const y = at.y - bob;

  // 影（歩行で伸縮）
  blob(ctx, at.x, at.y + s * 0.06, s * (0.42 - bob / s * 0.5), s * 0.14, 'rgba(30,42,36,0.28)', 0.5);

  ctx.save();
  ctx.translate(x, y);
  const ink = mixHex(fig.color, '#2a241d', 0.35);
  const skin = '#e7d6bd';
  const hairHex = fig.kind === 'lady' ? mixHex(fig.color, '#3a2c20', 0.62) : mixHex('#3a2f24', ink, 0.35);
  // 頭の中心と半径（顔を描くので大きめに）
  const hr = s * 0.23;
  const hcy = fig.kind === 'lady' ? -s * 0.93 : -s * 0.9;

  if (fig.kind === 'lady') {
    // ベル型のドレス
    ctx.fillStyle = fig.color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(-s * 0.06, -s * 0.62);
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.1, -s * 0.34, 0);
    ctx.quadraticCurveTo(0, s * 0.08, s * 0.34, 0);
    ctx.quadraticCurveTo(s * 0.5, -s * 0.1, s * 0.06, -s * 0.62);
    ctx.closePath();
    ctx.fill();
    // 肩・首
    ctx.fillStyle = ink;
    ctx.fillRect(-s * 0.09, -s * 0.8, s * 0.18, s * 0.22);
    ctx.fillStyle = skin;
    ctx.fillRect(-s * 0.045, -s * 0.78, s * 0.09, s * 0.12);
  } else {
    // 脚
    ctx.strokeStyle = ink;
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, 0);
    ctx.lineTo(-s * 0.08, -s * 0.34);
    ctx.moveTo(s * 0.08, 0);
    ctx.lineTo(s * 0.08, -s * 0.34);
    ctx.stroke();
    // 燕尾服（裾が割れた胴）
    ctx.fillStyle = fig.color;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.72);
    ctx.lineTo(s * 0.2, -s * 0.72);
    ctx.lineTo(s * 0.16, -s * 0.28);
    ctx.lineTo(s * 0.05, -s * 0.06);
    ctx.lineTo(0, -s * 0.32);
    ctx.lineTo(-s * 0.05, -s * 0.06);
    ctx.lineTo(-s * 0.16, -s * 0.28);
    ctx.closePath();
    ctx.fill();
    // 首・襟（白いクラヴァット）
    ctx.fillStyle = skin;
    ctx.fillRect(-s * 0.05, -s * 0.78, s * 0.1, s * 0.12);
    ctx.fillStyle = '#efe7d4';
    ctx.beginPath();
    ctx.moveTo(-s * 0.09, -s * 0.72);
    ctx.lineTo(s * 0.09, -s * 0.72);
    ctx.lineTo(0, -s * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // --- 頭部と顔 ---
  ctx.globalAlpha = 1;
  // 髪（頭の後ろ）
  ctx.fillStyle = hairHex;
  ctx.beginPath();
  ctx.arc(0, hcy, hr * 1.16, 0, Math.PI * 2);
  ctx.fill();
  // 顔
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, hcy, hr * 0.92, hr, 0, 0, Math.PI * 2);
  ctx.fill();

  const expr: FigureExpression = fig.expression ?? 'calm';
  const gaze = (fig.face ?? 0) * hr * 0.2;
  const eyeY = hcy - hr * 0.06;
  const eyeDX = hr * 0.42;
  const eyeR = Math.max(hr * 0.12, 0.9);
  // 目
  ctx.fillStyle = '#2a2118';
  ctx.beginPath();
  ctx.arc(-eyeDX + gaze, eyeY, eyeR, 0, Math.PI * 2);
  ctx.arc(eyeDX + gaze, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  // 眉（表情で角度を変える）
  const browY = eyeY - hr * 0.42;
  const browLen = hr * 0.4;
  const browInner = expr === 'concerned' ? -hr * 0.16 : expr === 'busy' ? hr * 0.12 : 0;
  const browOuter = expr === 'pleased' ? -hr * 0.06 : 0;
  ctx.strokeStyle = hairHex;
  ctx.lineWidth = Math.max(hr * 0.14, 0.8);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-eyeDX - browLen / 2 + gaze, browY + browOuter);
  ctx.lineTo(-eyeDX + browLen / 2 + gaze, browY + browInner);
  ctx.moveTo(eyeDX - browLen / 2 + gaze, browY + browInner);
  ctx.lineTo(eyeDX + browLen / 2 + gaze, browY + browOuter);
  ctx.stroke();
  // 頬（上機嫌のとき）
  if (expr === 'pleased') {
    ctx.fillStyle = 'rgba(202,120,96,0.34)';
    ctx.beginPath();
    ctx.arc(-hr * 0.55 + gaze, eyeY + hr * 0.4, hr * 0.24, 0, Math.PI * 2);
    ctx.arc(hr * 0.55 + gaze, eyeY + hr * 0.4, hr * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
  // 口
  const mY = hcy + hr * 0.52;
  const mW = hr * 0.34;
  const curve = expr === 'pleased' ? hr * 0.34 : expr === 'concerned' ? -hr * 0.2 : expr === 'busy' ? hr * 0.03 : hr * 0.12;
  ctx.strokeStyle = mixHex(ink, '#7a3b34', 0.5);
  ctx.lineWidth = Math.max(hr * 0.13, 0.8);
  ctx.beginPath();
  ctx.moveTo(-mW + gaze, mY);
  ctx.quadraticCurveTo(gaze, mY + curve, mW + gaze, mY);
  ctx.stroke();

  // 髪・帽子（前面）
  if (fig.kind === 'lady') {
    // ボンネット
    ctx.fillStyle = fig.color;
    ctx.beginPath();
    ctx.arc(0, hcy - hr * 0.15, hr * 1.2, Math.PI * 1.02, Math.PI * 2.02);
    ctx.fill();
    ctx.fillStyle = mixHex(fig.color, '#ffffff', 0.25);
    ctx.beginPath();
    ctx.ellipse(0, hcy - hr * 0.15, hr * 1.2, hr * 0.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else {
    // 前髪
    ctx.fillStyle = hairHex;
    ctx.beginPath();
    ctx.arc(0, hcy, hr * 1.02, Math.PI * 1.08, Math.PI * 1.92);
    ctx.fill();
    // シルクハット（執事はかぶらない）
    if (fig.kind === 'gent') {
      ctx.fillStyle = ink;
      ctx.fillRect(-hr * 1.15, hcy - hr * 0.95, hr * 2.3, hr * 0.3);
      ctx.fillRect(-hr * 0.8, hcy - hr * 2.2, hr * 1.6, hr * 1.35);
    }
  }
  ctx.restore();

  // --- 感情マーク（小さくても伝わる漫画的な符号）---
  {
    const expr: FigureExpression = fig.expression ?? 'calm';
    const cue = fig.urgent ? 'alert' : expr === 'busy' ? 'sweat' : expr === 'concerned' ? 'gloom' : expr === 'pleased' ? 'note' : null;
    if (cue) {
      const cx = x + s * 0.62;
      const cyc = y - s * 1.02 + Math.sin(now / 320) * s * 0.03;
      const r = s * 0.2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // 白いふきだし状のハロー
      ctx.fillStyle = 'rgba(247,241,225,0.92)';
      ctx.beginPath();
      ctx.arc(cx, cyc, r, 0, Math.PI * 2);
      ctx.fill();
      if (cue === 'alert') {
        ctx.fillStyle = '#c2452f';
        ctx.font = `bold ${Math.round(r * 2)}px Georgia, serif`;
        ctx.fillText('!', cx, cyc + r * 0.08);
      } else if (cue === 'note') {
        ctx.fillStyle = '#b3752f';
        ctx.font = `${Math.round(r * 1.9)}px Georgia, serif`;
        ctx.fillText('♪', cx, cyc + r * 0.06);
      } else if (cue === 'sweat') {
        ctx.fillStyle = '#5b86b3';
        ctx.beginPath();
        ctx.moveTo(cx, cyc - r * 0.6);
        ctx.quadraticCurveTo(cx + r * 0.55, cyc + r * 0.15, cx, cyc + r * 0.6);
        ctx.quadraticCurveTo(cx - r * 0.55, cyc + r * 0.15, cx, cyc - r * 0.6);
        ctx.fill();
      } else {
        // gloom: 縦の小さな三本線
        ctx.strokeStyle = '#6a6f6a';
        ctx.lineWidth = Math.max(r * 0.22, 1);
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let k = -1; k <= 1; k += 1) {
          ctx.moveTo(cx + k * r * 0.42, cyc - r * 0.5);
          ctx.lineTo(cx + k * r * 0.42, cyc + r * 0.5);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  if (fig.label) {
    ctx.save();
    const fs = Math.max(Math.round(s * 0.32), 11);
    ctx.font = `${fs}px "Libre Baskerville", Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ty = y - s * 1.4;
    const tw = ctx.measureText(fig.label).width;
    const padX = fs * 0.6;
    const padY = fs * 0.34;
    const bw = tw + padX * 2;
    const bh = fs + padY * 2;
    const bx = x - bw / 2;
    const by = ty - bh / 2;
    const r = bh / 2;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
    ctx.arcTo(bx, by + bh, bx, by, r);
    ctx.arcTo(bx, by, bx + bw, by, r);
    ctx.closePath();
    ctx.fillStyle = 'rgba(24,34,28,0.66)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(242,232,210,0.28)';
    ctx.stroke();
    ctx.fillStyle = '#f5ecd6';
    ctx.fillText(fig.label, x, ty);
    ctx.restore();
  }
}

export function drawEstate(input: EstateSceneInput): void {
  const { ctx, w, h, mode, time, hour, rainy, scale, figScale, project, figures } = input;

  // --- 空と空気（画面の余白を殺す）---
  const [top, bottom] = skyColours(hour);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, top);
  sky.addColorStop(1, bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // --- 遠くの丘（地平のかわりに、館の奥の空を埋める）---
  const hillBase = project(0, -13, 0).y;
  for (let k = 0; k < 4; k += 1) {
    const hue = mixHex(bottom, '#6f7f78', 0.5 - k * 0.08);
    const hy = hillBase - h * 0.02 + k * h * 0.03 + Math.sin(k * 2.1) * 8;
    ctx.save();
    ctx.globalAlpha = 0.5 - k * 0.08;
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.moveTo(-40, hy + 120);
    for (let x = -40; x <= w + 40; x += 40) {
      ctx.lineTo(x, hy + Math.sin(x * 0.006 + k * 3) * 26 + Math.sin(x * 0.021 + k) * 10);
    }
    ctx.lineTo(w + 40, hy + 120);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // 低くたなびく霞
  for (let k = 0; k < 3; k += 1) {
    const my = hillBase + h * (0.02 + k * 0.05) + Math.sin(time * 0.05 + k) * 6;
    blob(ctx, w * 0.5 + Math.sin(time * 0.03 + k) * 40, my, w * 0.8, h * 0.06, mixHex(top, '#ffffff', 0.4), 0.18);
  }

  // --- 芝生（縁を不規則にした一枚の柔らかいウォッシュ＋不均一な斑）---
  const lawnCorners: Array<[number, number]> = [[-15, -9], [15, -9], [15, 15], [-15, 15]];
  const lawn: Pt[] = [];
  lawnCorners.forEach(([ax, ay], ci) => {
    const [bx, by] = lawnCorners[(ci + 1) % 4];
    // 辺に垂直な向きの単位ベクトル（外向き）
    const ex = bx - ax;
    const ey = by - ay;
    const len = Math.hypot(ex, ey) || 1;
    const nx = ey / len;
    const ny = -ex / len;
    for (let s = 0; s < 6; s += 1) {
      const f = s / 6;
      const wx = ax + ex * f;
      const wy = ay + ey * f;
      const push = (noise(ci * 13 + s) - 0.45) * 4.5; // ワールド単位で外/内へ
      lawn.push(project(wx + nx * push, wy + ny * push));
    }
  });
  wash(ctx, lawn, '#8fa068', { seed: 1, jitter: scale * 0.35, edge: '#6b7e50', alpha: 0.97 });
  for (let k = 0; k < 7; k += 1) {
    const gx = -10 + noise(20 + k) * 20;
    const gy = -6 + noise(30 + k) * 18;
    const p = project(gx, gy);
    blob(ctx, p.x, p.y, scale * (2.4 + noise(k) * 2), scale * (1.1 + noise(k + 1)), k % 2 ? '#7c9159' : '#a3b47c', 0.22);
  }
  // ハーハー（境界の窪み）
  wash(ctx, [project(-13, 12.4), project(13, 12.4), project(13, 13.2), project(-13, 13.2)], '#6f7f55', { seed: 5, jitter: 2, alpha: 0.5 });

  // --- 芝生の奥の木立（領地の北端の硬い境界を、重なる樹冠で隠す）---
  for (let k = 0; k < 13; k += 1) {
    const gx = -15.5 + (31 / 12) * k + (noise(200 + k) - 0.5) * 2.4;
    const p = project(gx, -10.5 + (noise(210 + k) - 0.5) * 2.5, 0);
    paintTree(ctx, p, scale * (1.2 + noise(220 + k) * 0.55), k * 5.1, (noise(230 + k) - 0.5) * scale * 0.5);
  }

  // --- 湖 ---
  const l1 = project(-11, 7);
  const l2 = project(-4, 13);
  const lx = (l1.x + l2.x) / 2;
  const ly = (l1.y + l2.y) / 2;
  blob(ctx, lx, ly, scale * 4.1, scale * 1.7, '#8aa3a1', 0.85, -0.15);
  blob(ctx, lx + 6, ly - 3, scale * 3, scale * 1.15, mixHex(bottom, '#8aa3a1', 0.5), 0.6, -0.12);
  // 水面に映る空のゆらぎ
  for (let k = 0; k < 4; k += 1) {
    blob(ctx, lx - scale * 2 + k * scale * 1.2, ly - scale * 0.2 + Math.sin(time * 0.4 + k) * 2, scale * 0.9, scale * 0.16, mixHex(top, '#ffffff', 0.4), 0.22);
  }
  // 岸辺の葦
  for (let k = 0; k < 10; k += 1) {
    const rp = project(-11 + noise(60 + k) * 7, 8 + noise(70 + k) * 4);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#7d8a54';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rp.x, rp.y);
    ctx.lineTo(rp.x + (noise(k) - 0.5) * 4, rp.y - scale * (0.5 + noise(k + 1) * 0.5));
    ctx.stroke();
    ctx.restore();
  }

  // --- 砂利道 ---
  [
    [project(-2, -5), project(2, -5), project(2, 11), project(-2, 11)],
    [project(-8, 1), project(8, 1), project(8, 3.2), project(-8, 3.2)],
    [project(-7, 8), project(7, 8), project(7, 9.6), project(-7, 9.6)],
  ].forEach((pts, i) => wash(ctx, pts, '#cdbb98', { seed: 10 + i, jitter: 2, edge: '#a9926f', alpha: 0.9 }));

  // --- 館 ---
  // 芝生に落ちる館の影
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#3b4a3a';
  tracePath(ctx, [project(4.4, -3, 0), project(9.5, 0, 0), project(9.5, 4.5, 0), project(4.4, 2, 0)]);
  ctx.fill();
  ctx.restore();
  // 手前の基壇
  wash(ctx, [project(-5.7, 1.3), project(4.6, 1.3), project(4.6, 2), project(-5.7, 2)], '#b3a284', { seed: 20, jitter: 1.5, alpha: 1 });
  // 壁（正面）
  const wallFront = [project(-5.5, -3.4, 5.2), project(4.4, -3.4, 5.2), project(4.4, -3.4, 0), project(-5.5, -3.4, 0)];
  wash(ctx, wallFront, '#dccaa6', { seed: 21, jitter: 1.6, edge: '#b7a480', alpha: 0.96 });
  // 壁の縦のウォッシュ跡
  for (let k = 0; k < 8; k += 1) {
    const a = project(-5 + k * 1.2, -3.4, 5);
    const b = project(-5 + k * 1.2, -3.4, 0.2);
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#8a795c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }
  // 側面（陰）
  wash(ctx, [project(4.4, -3.4, 5.2), project(4.4, 1.4, 5.2), project(4.4, 1.4, 0), project(4.4, -3.4, 0)], '#b19c78', { seed: 22, jitter: 1.4, alpha: 0.9 });
  // 屋根
  wash(ctx, [project(-5.5, -3.4, 5.2), project(-0.5, -6, 6.1), project(4.4, -3.4, 5.2)], '#7c6d60', { seed: 23, jitter: 2, edge: '#5d5049', alpha: 0.95 });
  wash(ctx, [project(-0.5, -6, 6.1), project(-0.5, -6, 6.5), project(4.4, -3.4, 5.6), project(4.4, -3.4, 5.2)], '#6b5d52', { seed: 24, jitter: 1.5, alpha: 0.9 });
  // 翼棟
  wash(ctx, [project(-8.3, -2.3, 0), project(-5.5, -2.3, 0), project(-5.5, 1.2, 0), project(-8.3, 1.2, 0)], '#d3c19d', { seed: 25, jitter: 1.4, edge: '#a58f6b', alpha: 0.92 });
  wash(ctx, [project(4.4, -2.3, 0), project(7.1, -2.3, 0), project(7.1, 1.2, 0), project(4.4, 1.2, 0)], '#cbb995', { seed: 26, jitter: 1.4, edge: '#a58f6b', alpha: 0.92 });
  // 窓（やわらかい暗いガラス＋斜めの光）
  for (let i = 0; i < 5; i += 1) {
    const p = project(-4.8 + i * 2.25, -3.48, 2.4);
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#42615f';
    ctx.fillRect(p.x - scale * 0.24, p.y - scale * 0.4, scale * 0.48, scale * 0.78);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#e7d6b4';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x - scale * 0.24, p.y - scale * 0.4, scale * 0.48, scale * 0.78);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#dfeae0';
    ctx.beginPath();
    ctx.moveTo(p.x - scale * 0.24, p.y + scale * 0.1);
    ctx.lineTo(p.x + scale * 0.1, p.y - scale * 0.4);
    ctx.lineTo(p.x + scale * 0.24, p.y - scale * 0.4);
    ctx.lineTo(p.x - scale * 0.24, p.y + scale * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // 玄関扉
  const door = project(-0.5, -3.58, 1.25);
  wash(ctx, [
    { x: door.x - scale * 0.3, y: door.y + scale * 0.65 },
    { x: door.x - scale * 0.3, y: door.y - scale * 0.6 },
    { x: door.x + scale * 0.3, y: door.y - scale * 0.6 },
    { x: door.x + scale * 0.3, y: door.y + scale * 0.65 },
  ], '#6f4f43', { seed: 27, jitter: 1, alpha: 0.95 });

  // 温室
  wash(ctx, [project(-11, 2.2, 0), project(-7.1, 2.2, 0), project(-7.1, 4.2, 0), project(-11, 4.2, 0)], '#c8bd93', { seed: 28, jitter: 1.4, edge: '#8fa07a', alpha: 0.7 });

  // 噴水
  const fountain = project(-2.5, 5.4, 0.1);
  blob(ctx, fountain.x, fountain.y, scale * 1.15, scale * 0.42, '#93a7a2', 0.7);
  blob(ctx, fountain.x, fountain.y - scale * 0.3, scale * 0.16, scale * 0.16, '#d6e0d2', 0.7);

  // --- 木々（額縁のように領地の外周に置く。館は隠さない）---
  paintTree(ctx, project(-13.5, 2, 0), scale * 1.7, 3.1, -scale * 0.4);
  const treeSpots: Array<[number, number]> = [
    [-13, -6], [-6, -8.5], [1, -9], [10, -8], [13.5, -2],
    [13, 6], [8, 11], [-2, 12.5], [-9, 11], [-13, 7],
  ];
  treeSpots.forEach(([gx, gy], i) => {
    const p = project(gx, gy, 0);
    paintTree(ctx, p, scale * (1.05 + noise(i) * 0.45), i * 7.3, (noise(i + 3) - 0.5) * scale * 0.5);
  });

  // --- 雨 ---
  if (rainy && mode === 'game') {
    ctx.save();
    ctx.strokeStyle = 'rgba(222,228,214,0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i += 1) {
      const rx = (i * 97 + time * 120) % w;
      const ry = (i * 53 + time * 260) % h;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- 人物（奥→手前でソート）---
  [...figures]
    .sort((a, b) => (a.x + a.y) - (b.x + b.y))
    .forEach(fig => {
      const p = project(fig.x, fig.y, 0.05);
      paintFigure(ctx, p, figScale, fig);
    });
}
