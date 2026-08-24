import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const result = await page.evaluate(() => {
  const canvas = document.querySelector('canvas.estate-canvas');
  if (!canvas) return { error: 'canvas not found' };
  const ctx = canvas.getContext('2d');
  if (!ctx) return { error: 'no 2d context' };
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  const at = (x, y) => {
    const i = (y * w + x) * 4;
    return (data[i] + data[i + 1] + data[i + 2]) / 3;
  };
  // 紙ざわり：3x3 局所標準偏差を複数点で平均（全て canvas 内に収まる座標）
  const stdAt = (cx, cy, r) => {
    const vals = [];
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        vals.push(at(x, y));
      }
    }
    const n = vals.length;
    if (!n) return 0;
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return Math.sqrt(variance);
  };
  const pts = [
    [Math.floor(w * 0.25), Math.floor(h * 0.25)],
    [Math.floor(w * 0.75), Math.floor(h * 0.30)],
    [Math.floor(w * 0.50), Math.floor(h * 0.70)],
    [Math.floor(w * 0.20), Math.floor(h * 0.80)],
  ];
  const samples = pts.map(([x, y]) => stdAt(x, y, 3));
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  return {
    canvasSize: { w, h },
    paperGrainLocalStdDev: Number(avg.toFixed(2)),
    perPoint: samples.map((s) => Number(s.toFixed(2))),
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
