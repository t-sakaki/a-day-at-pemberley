import { expect, test, type Page } from '@playwright/test';
import { canStand, moveInRoom, roomObstacles, roomElevation, type InteriorRoomId } from '../src/systems/InteriorNavigation';

const rooms = [
  { id: 'gallery', name: 'The picture gallery' },
  { id: 'music', name: 'The music room' },
  { id: 'window', name: 'The great west window' },
] as const;
async function begin(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day', exact: true }).click();
}
async function position(page: Page) {
  return page.locator('.interior-walk-canvas').evaluate(el => ({ x: Number((el as HTMLElement).dataset.x), y: Number((el as HTMLElement).dataset.y) }));
}

test('opens all rooms as walkable spaces from the tour list', async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await begin(page);
  for (const room of rooms) {
    const menu = page.getByRole('button', { name: 'Open task panel', exact: true });
    if (await menu.isVisible()) await menu.click();
    await page.locator('.tour-rooms').getByRole('button', { name: new RegExp(room.name) }).click();
    const canvas = page.locator('.interior-walk-canvas');
    await expect(page.locator('.walkable-interior')).toHaveAttribute('data-room', room.id);
    await expect(canvas).toHaveAttribute('data-asset', 'ready', { timeout: 20_000 });
    await expect(canvas).toBeFocused();
    const before = await position(page);
    await page.keyboard.down('d'); await page.waitForTimeout(450); await page.keyboard.up('d');
    const after = await position(page);
    expect(Math.hypot(after.x-before.x,after.y-before.y)).toBeGreaterThan(.2);
    await page.screenshot({ path: info.outputPath(room.id + '.png') });
    await page.getByRole('button', { name: 'Return to grounds', exact: true }).click();
    await expect(page.locator('.walkable-interior')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('walking up to the front entrance enters the house without a menu', async ({ page }) => {
  await begin(page);
  await page.keyboard.down('w');
  await expect(page.locator('.walkable-interior')).toHaveAttribute('data-room', 'hall');
  await page.keyboard.up('w');
  await page.keyboard.press('Escape');
  await expect(page.locator('.walkable-interior')).toHaveCount(0);
  // Releasing the movement key on entry/exit prevents an immediate re-entry.
  await page.waitForTimeout(300);
  await expect(page.getByRole('button', { name: 'Enter the house', exact: true })).toBeVisible();
});

test('room doors connect the hall and three interiors and exit returns to the grounds', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', { name: 'Enter the house', exact: true }).click();
  for (const room of [...rooms,{id:'hall',name:'The grand staircase hall'}]) {
    await page.getByRole('button', { name: '→ ' + room.name, exact: true }).click();
    await expect(page.locator('.walkable-interior')).toHaveAttribute('data-room', room.id);
  }
  await page.getByRole('button', { name: 'Exit → grounds', exact: true }).click();
  await expect(page.locator('.walkable-interior')).toHaveCount(0);
});

test('the mobile movement pad moves the indoor character', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch movement pad is mobile-only.');
  await begin(page);
  await page.getByRole('button', { name: 'Enter the house', exact: true }).click();
  const pad = page.getByLabel('Movement joystick');
  const box = (await pad.boundingBox())!;
  const before = await position(page);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.85,box.y+box.height*.5);
  await page.waitForTimeout(650);
  await page.mouse.up();
  const after = await position(page);
  expect(Math.hypot(after.x-before.x,after.y-before.y)).toBeGreaterThan(.25);
});

test('Japanese room controls and image failure remain usable', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pemberley-language','ja'));
  await page.route('**/blender/walk/**', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name:'一日を始める',exact:true }).click();
  await page.getByRole('button', { name:'館に入る',exact:true }).click();
  await expect(page.locator('.interior-walk-canvas')).toHaveAttribute('data-asset','fallback');
  const before=await position(page);
  await page.keyboard.down('d'); await page.waitForTimeout(450); await page.keyboard.up('d');
  expect((await position(page)).x).toBeGreaterThan(before.x);
  await page.getByRole('button',{name:'部屋を見学する',exact:true}).click();
  await page.getByRole('button',{name:'部屋を整える',exact:true}).click();
  await page.getByRole('button',{name:'庭へ戻る',exact:true}).click();
  await expect(page.locator('.walkable-interior')).toHaveCount(0);
});

test('indoor collision boundaries stop tunnelling through furniture and walls', () => {
  for(const room of rooms) {
    const id=room.id as InteriorRoomId;
    for(const obstacle of roomObstacles[id]) expect(canStand(id,obstacle)).toBe(false);
    expect(canStand(id,{x:0,y:-3})).toBe(true);
    expect(canStand(id,{x:6,y:0})).toBe(false);
    const walked=moveInRoom(id,{x:0,y:-3},0,20);
    expect(canStand(id,walked)).toBe(true);
    expect(walked.y).toBeLessThan(0);
    const edge=moveInRoom(id,{x:0,y:-3},50,0);
    expect(edge.x).toBeLessThanOrEqual(4.6);
  }
});

test('the grand stair is climbable and the landing cannot be jumped off', () => {
  const top=moveInRoom('hall',{x:0,y:-3},0,6);
  expect(top.y).toBeCloseTo(3,5);
  expect(roomElevation('hall',top)).toBe(3);
  const wing=moveInRoom('hall',top,3,0);
  const edge=moveInRoom('hall',wing,0,-5);
  expect(edge.y).toBeGreaterThanOrEqual(2);
  expect(roomElevation('hall',edge)).toBe(3);
  const down=moveInRoom('hall',top,0,-6);
  expect(roomElevation('hall',down)).toBe(0);
  expect(down.y).toBeCloseTo(-3,5);
});

test('grand hall renders and its staircase raises the walking character', async ({page}, info) => {
  await begin(page);
  await page.getByRole('button',{name:'Enter the house',exact:true}).click();
  const canvas=page.locator('.interior-walk-canvas');
  await expect(canvas).toHaveAttribute('data-asset','ready',{timeout:20_000});
  // W+D follows the world-space stair axis; slight sideways drift stays inside its rails.
  await page.keyboard.down('w'); await page.keyboard.down('d');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-elevation')),{timeout:10_000}).toBeGreaterThan(2.8);
  await page.keyboard.up('w'); await page.keyboard.up('d');
  await page.screenshot({path:info.outputPath('grand-hall.png')});
  await page.keyboard.down('s'); await page.keyboard.down('a');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-elevation')),{timeout:10_000}).toBeLessThan(.1);
  await page.keyboard.up('s'); await page.keyboard.up('a');
});

test('walking into the exit leaves the room and settings suspend movement', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', {name:'Enter the house',exact:true}).click();
  await page.getByRole('button', {name:'Open settings',exact:true}).click();
  const before=await position(page);
  await page.keyboard.down('d'); await page.waitForTimeout(350); await page.keyboard.up('d');
  expect(await position(page)).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.down('a'); await page.keyboard.down('s');
  await expect(page.locator('.walkable-interior')).toHaveCount(0);
  await page.keyboard.up('a'); await page.keyboard.up('s');
});
