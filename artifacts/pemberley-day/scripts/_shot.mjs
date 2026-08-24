import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || '/tmp/pemberley-watercolor.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

await page.goto(url, { waitUntil: 'networkidle' });
// 少し待ってアニメーション・水彩パスが適用されるのを待つ
await page.waitForTimeout(2500);

await page.screenshot({ path: out, fullPage: false });
console.log('saved', out);
console.log('console errors:', errors.length ? JSON.stringify(errors, null, 2) : 'none');

await browser.close();
