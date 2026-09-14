import { expect, test, type Page } from '@playwright/test';
import { blenderCharacterIds } from '../src/data/blenderCharacters';

async function begin(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day', exact: true }).click();
}

async function staffPanel(page: Page) {
  const button = page.getByRole('button', { name: 'Open staff panel', exact: true });
  if (await button.isVisible()) await button.click();
}

test('draws Blender walkers and displays staff portraits in the real game', async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const seen = new Set<string>();
    (window as any).__characterDraws = seen;
    const original = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args: any[]) {
      if (args[0] instanceof HTMLImageElement && args[0].src.includes('/blender/characters/'))
        seen.add(args[0].src);
      return (original as any).apply(this, args);
    };
  });
  await begin(page);
  for (const id of ['mrs-reynolds', 'john', 'sarah', 'mr-adams', 'thomas', 'steward']) {
    await expect.poll(() => page.evaluate(id =>
      [...(window as any).__characterDraws].some((url: any) => url.includes('/' + id + '/body-')), id)).toBe(true);
  }
  await page.screenshot({ path: info.outputPath('grounds.png') });
  await staffPanel(page);
  const portraits = page.locator('.staff-card img.character-portrait');
  await expect(portraits).toHaveCount(5);
  for (const img of await portraits.all()) {
    await expect(img).toHaveAttribute('src', /\/blender\/characters\//);
    await expect.poll(() => img.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(256);
  }
  await page.screenshot({ path: info.outputPath('staff.png') });
  expect(errors).toEqual([]);
});

test('missing walk frames keep the idle sprite and unknown figures fall back', async ({ page }) => {
  await page.route('**/blender/characters/**/body-{1,2}.png', route => route.abort());
  await begin(page);
  await expect.poll(() => page.evaluate(async () => {
    const modulePath = '/src/visuals/BlenderCharacter.ts';
    const { drawBlenderCharacter } = await import(/* @vite-ignore */ modulePath);
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const figure = { id: 'steward', kind: 'steward', color: '#c8985c', moving: true, face: -1 };
    return drawBlenderCharacter(ctx, 128, 220, 100, figure, 170) &&
      drawBlenderCharacter(ctx, 128, 220, 100, figure, 340) &&
      !drawBlenderCharacter(ctx, 128, 220, 100, { ...figure, id: 'unrecognized-person' }, 0);
  })).toBe(true);
});

test('all cast assets decode with transparent borders and distinct expressions', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.goto('/');
  const results = await page.evaluate(async ids => {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 384;
    const ctx = canvas.getContext('2d')!;
    const rows = [];
    for (const id of ids) {
      const hashes = [];
      for (const view of ['body-0', 'body-1', 'body-2', 'calm', 'pleased', 'concerned', 'busy', 'tense']) {
        const image = new Image(); image.src = '/blender/characters/' + id + '/' + view + '.png';
        await image.decode();
        ctx.clearRect(0, 0, 256, 384); ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, 256, image.height).data;
        let hash = 2166136261, opaque = 0;
        for (let i = 0; i < pixels.length; i++) hash = Math.imul(hash ^ pixels[i], 16777619);
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) opaque++;
        hashes.push(hash);
        rows.push({ id, view, width: image.width, height: image.height, corner: pixels[3], opaque });
      }
      if (new Set(hashes.slice(0, 3)).size !== 3 || new Set(hashes.slice(3)).size !== 5)
        throw new Error('Repeated pose or expression for ' + id);
    }
    // Contact sheet is only a test artifact, not an alternative app renderer.
    const sheet = document.createElement('canvas'); sheet.id = 'cast-sheet';
    sheet.width = 1000; sheet.height = 660;
    const c = sheet.getContext('2d')!; c.fillStyle = '#e7e0ce'; c.fillRect(0, 0, 1000, 660);
    for (const [i, id] of ids.entries()) {
      const image = new Image(); image.src = '/blender/characters/' + id + '/calm.png'; await image.decode();
      c.drawImage(image, i % 5 * 200, Math.floor(i / 5) * 220, 200, 200);
      c.fillStyle = '#292b29'; c.font = '14px sans-serif';
      c.fillText(id, i % 5 * 200 + 8, Math.floor(i / 5) * 220 + 215);
    }
    sheet.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;max-width:100vw;height:auto';
    document.body.append(sheet);
    return rows;
  }, [...blenderCharacterIds]);
  expect(results).toHaveLength(120);
  for (const row of results) {
    expect(row.width).toBe(256);
    expect(row.height).toBe(row.view.startsWith('body') ? 384 : 256);
    expect(row.corner).toBe(0);
    expect(row.opaque).toBeGreaterThan(2000);
  }
  await page.locator('#cast-sheet').screenshot({ path: info.outputPath('cast.png') });
});

test('missing Blender files preserve usable staff portraits and game controls', async ({ page }) => {
  await page.route('**/blender/characters/**', route => route.abort());
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await begin(page);
  await staffPanel(page);
  await expect(page.locator('.staff-card')).toHaveCount(5);
  await expect.poll(() => page.locator('.staff-card img[src*="/blender/characters/"]').count()).toBe(0);
  await expect(page.locator('.staff-card img, .staff-card svg.living-portrait')).toHaveCount(5);
  expect(errors).toEqual([]);
});
