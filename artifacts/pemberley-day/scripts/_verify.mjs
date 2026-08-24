import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500); // アニメーション・水彩パス適用待ち

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
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };

  // 1. ヴィネット：中心 vs 隅の輝度比較
  const center = at(Math.floor(w / 2), Math.floor(h / 2));
  const corner = at(10, 10);
  const centerLum = (center.r + center.g + center.b) / 3;
  const cornerLum = (corner.r + corner.g + corner.b) / 3;

  // 2. ウォッシュ：全体サンプルで R>=B の比率（暖色シフト）
  let warm = 0, total = 0;
  const lum = [];
  for (let y = 0; y < h; y += 40) {
    for (let x = 0; x < w; x += 40) {
      const c = at(x, y);
      if (c.r >= c.b) warm++;
      total++;
      lum.push((c.r + c.g + c.b) / 3);
    }
  }
  const warmRatio = warm / total;

  // 3. 紙ざわり：局所的な輝度分散（ノイズの度合い）
  const stdAt = (cx, cy, r) => {
    const vals = [];
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const c = at(x, y);
        vals.push((c.r + c.g + c.b) / 3);
      }
    }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    return Math.sqrt(variance);
  };
  const grainSamples = [stdAt(w * 0.3, h * 0.3, 3), stdAt(w * 0.6, h * 0.4, 3), stdAt(w * 0.5, h * 0.6, 3)];
  const grainAvg = grainSamples.reduce((a, b) => a + b, 0) / grainSamples.length;

  // 4. 階調量子化の痕跡：輝度値のヒストグラムが帯状（段）になっているか
  const hist = new Array(256).fill(0);
  lum.forEach((l) => { hist[Math.round(l)]++; });
  const maxBin = Math.max(...hist);
  const occupiedBins = hist.filter((v) => v > maxBin * 0.15).length;

  return {
    canvasSize: { w, h },
    vignette: { centerLum: Math.round(centerLum), cornerLum: Math.round(cornerLum), darkenedAtEdge: cornerLum < centerLum },
    wash: { warmRatio: Number(warmRatio.toFixed(3)) },
    paperGrain: { localStdDev: Number(grainAvg.toFixed(2)) },
    tonalBanding: { occupiedBins },
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
