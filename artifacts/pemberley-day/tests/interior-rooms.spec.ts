import { expect, test, type Page } from '@playwright/test';

const rooms = [
  { id: 'gallery', name: 'The picture gallery' },
  { id: 'music', name: 'The music room' },
  { id: 'window', name: 'The great west window' },
] as const;

async function openList(page: Page) {
  const toggle = page.getByRole('button', { name: 'Open task panel' });
  if (await toggle.isVisible()) await toggle.click();
}

test('opens each Blender interior and restores keyboard focus', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day', exact: true }).click();
  await openList(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const room of rooms) {
    const trigger = page.locator('.tour-rooms').getByRole('button', { name: new RegExp(room.name) });
    const asset = page.waitForResponse(response => response.url().endsWith(`/interiors/${room.id}.jpg`));
    await trigger.click();
    const response = await asset;
    expect(response.status()).toBe(200);
    await page.evaluate(async url => {
      const image = new Image(); image.src = url; await image.decode();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, response.url());
    const dialog = page.getByRole('dialog', { name: room.name, exact: true });
    await expect(dialog).toBeVisible();
    const close = dialog.getByRole('button', { name: 'Close', exact: true });
    await expect(close).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    const bounds = await dialog.boundingBox();
    const viewport = page.viewportSize()!;
    expect(bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.height).toBeLessThanOrEqual(viewport.height);
    await dialog.screenshot({ path: testInfo.outputPath(`${room.id}.png`), animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test('opens and closes a room with Japanese labels', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pemberley-language', 'ja'));
  await page.goto('/');
  await page.getByRole('button', { name: '一日を始める', exact: true }).click();
  await openList(page);
  const trigger = page.locator('.tour-rooms').getByRole('button', { name: /肖像画の間/ });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '肖像画の間', exact: true });
  await expect(dialog.getByRole('img', { name: '肖像画の間' })).toBeVisible();
  await dialog.getByRole('button', { name: '閉じる', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('manual room viewing survives the automatic reveal timeout and a tour event', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day', exact: true }).click();
  await openList(page);
  await page.locator('.tour-rooms').getByRole('button', { name: /The music room/ }).click();
  const dialog = page.getByRole('dialog', { name: 'The music room', exact: true });
  await expect(dialog).toBeVisible();
  // Existing clock advances one game minute per second; retain manual viewing.
  await page.clock.install();
  await page.clock.fastForward(7000);
  await expect(dialog).toBeVisible();
  await page.locator('.bell-button').evaluate(button => {
    for (let i = 0; i < 22; i++) (button as HTMLButtonElement).click();
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('keeps room viewing usable when the Blender asset cannot be fetched', async ({ page }) => {
  await page.route('**/blender/interiors/**', route => route.abort());
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day', exact: true }).click();
  await openList(page);
  await page.locator('.tour-rooms').getByRole('button', { name: /The picture gallery/ }).click();
  const dialog = page.getByRole('dialog', { name: 'The picture gallery', exact: true });
  await expect(dialog.getByRole('img')).toBeVisible();
  await expect.poll(() => dialog.locator('canvas').evaluate(canvas => {
    const c = canvas as HTMLCanvasElement;
    return c.getContext('2d')!.getImageData(c.width / 2, c.height / 2, 1, 1).data[3];
  })).toBe(255);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});
