import { expect, test, type Page } from '@playwright/test';

const householdEvents = {
  en: [
    'Mrs. Bennet reports: the morning rooms are ready, but the east corridor still wants attention.',
    'Lady Catherine has arrived at the front hall. Her party expects the house to be in perfect order.',
    'A pointed note from Lady Catherine: she has observed a delay in the household arrangements.',
    'Mr. Reynolds reports: the lake path is secure and the staff are returning to their evening routes.',
  ],
  ja: [
    'ベネット夫人の報告です。朝の部屋は整いましたが、東廊下にはまだ手入れが必要です。',
    'キャサリン夫人が玄関ホールに到着しました。一行は館が完璧に整っていることを望んでいます。',
    'キャサリン夫人から厳しい伝言です。館の手配に遅れがあるとのことです。',
    'レイノルズ氏の報告です。湖畔の道は安全で、使用人たちは夕刻の巡回へ戻っています。',
  ],
} as const;

async function ringBell(page: Page, count: number) {
  const bell = page.getByRole('button', { name: /Ring household bell|館の鐘を鳴らす/ });
  await bell.evaluate((button, numberOfRings) => {
    for (let i = 0; i < numberOfRings; i += 1) {
      (button as HTMLButtonElement).click();
    }
  }, count);
}

async function expectEventOnce(page: Page, message: string) {
  const event = page.locator('.log li').filter({ hasText: message });
  await expect(event).toHaveCount(1);
}

async function advanceThroughEvents(page: Page, messages: readonly string[]) {
  // The day starts at 07:35; each bell advances the clock by 15 minutes.
  await ringBell(page, 8); // 09:35, crossing the morning report threshold.
  await expectEventOnce(page, messages[0]);

  await ringBell(page, 14); // 13:05, crossing the visitor arrival threshold.
  await expectEventOnce(page, messages[1]);

  await ringBell(page, 2); // 13:35, crossing the warning threshold.
  await expectEventOnce(page, messages[2]);

  await ringBell(page, 8); // 15:35, crossing the evening report threshold.
  await expectEventOnce(page, messages[3]);
}

async function playThroughEvents(page: Page, messages: readonly string[]) {
  await page.getByRole('button', { name: /Begin the day|一日を始める/ }).evaluate(button => (button as HTMLButtonElement).click());
  await advanceThroughEvents(page, messages);
}

test('starts the day, saves language, completes a task, and writes the diary', async ({ page, isMobile, browser }) => {
  test.skip(isMobile, 'The full task panel is covered by the desktop flow.');
  await page.goto('/');
  await page.locator('select[aria-label="Language"]').selectOption('ja');
  await expect(page.locator('select[aria-label="言語"]')).toHaveValue('ja');
  await page.reload();
  await expect(page.locator('select[aria-label="言語"]')).toHaveValue('ja');

  await page.getByRole('button', { name: '一日を始める' }).click();
  await expect(page.getByText('ペンバリー領地')).toBeVisible();

  const task = page.getByRole('checkbox', { name: '朝の部屋を点検する' });
  await task.check();
  await expect(task).toBeChecked();

  await page.getByRole('button', { name: '一日を閉じて日記を書く' }).click();
  await expect(page.getByRole('heading', { name: 'よく管理された一日' })).toBeVisible();
  await expect(page.locator('.diary-entry')).toContainText('1件');
  const storageState = await page.context().storageState();
  const savedEntry = await page.evaluate(() => JSON.parse(localStorage.getItem('pemberley-diary')!));
  const freshContext = await browser.newContext({ storageState });
  const freshPage = await freshContext.newPage();
  await freshPage.goto('/');
  await freshPage.locator('select[aria-label="言語"]').selectOption('en');
  const latestEntry = Array.isArray(savedEntry) ? savedEntry[savedEntry.length - 1] : savedEntry;

    const formatDate = Date.prototype.toLocaleDateString;
  await expect(freshPage.getByText(latestEntry.date)).toBeVisible();
  await expect(freshPage.getByText(`${latestEntry.complete}/4`)).toBeVisible();
  await expect(freshPage.getByText(`Reputation: ${latestEntry.reputation}`)).toBeVisible();
  await freshContext.close();
});

test('preserves and browses multiple diary entries', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The diary history flow uses the desktop title screen.');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pemberley-diary', JSON.stringify([
    { date: '21 August 1812', complete: 1, reputation: 76, day: 1 },
    { date: '22 August 1812', complete: 4, reputation: 82, day: 2 },
  ])));
  await page.reload();

  await expect(page.getByText('22 August 1812')).toBeVisible();
  await page.getByRole('button', { name: /Read the diary/ }).click({ force: true });
  await expect(page.locator('.diary-history-item')).toHaveCount(2);
  await page.getByRole('button', { name: /21 August 1812/ }).click({ force: true });
  await expect(page.locator('.diary-entry')).toContainText('1 of 4 principal duties');
  await expect(page.locator('.modal')).toContainText('House reputation 76');
  await expect(page.locator('.modal')).toContainText('1/4');
});

test('keeps both diary records after closing two days', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The two-day diary flow uses the desktop task panel.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day' }).evaluate(button => (button as HTMLButtonElement).click());

  await page.getByRole('checkbox').nth(0).evaluate(input => (input as HTMLInputElement).click());
  await page.getByRole('checkbox').nth(1).evaluate(input => (input as HTMLInputElement).click());
  await page.getByRole('button', { name: 'Close day & write diary' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('heading', { name: 'A well-managed day' })).toBeVisible();
  await expect(page.locator('.diary-history-item')).toHaveCount(0);

  await page.getByRole('button', { name: 'Begin another day' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.locator('.day-number')).toHaveText('07:35');
  await page.getByRole('button', { name: 'Close day & write diary' }).evaluate(button => (button as HTMLButtonElement).click());

  await expect(page.getByRole('heading', { name: 'A well-managed day' })).toBeVisible();
  await expect(page.locator('.diary-history-item')).toHaveCount(2);
  await expect(page.locator('.diary-history-item').nth(0)).toContainText('0/4');
  await expect(page.locator('.diary-history-item').nth(1)).toContainText('2/4');

  const savedEntries = await page.evaluate(() => JSON.parse(localStorage.getItem('pemberley-diary')!));
  expect(savedEntries).toHaveLength(2);
  expect(savedEntries.map((entry: { day: number }) => entry.day)).toEqual([1, 2]);
  expect(savedEntries.map((entry: { complete: number }) => entry.complete)).toEqual([2, 0]);

  await page.getByRole('button', { name: 'Return to grounds' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('button', { name: /Read the diary/ })).toBeVisible();

  await page.reload();
  await expect(page.getByText(savedEntries[0].date)).toBeVisible();
  await expect(page.getByRole('button', { name: /Read the diary/ })).toContainText('2');
  await page.getByRole('button', { name: /Read the diary/ }).click();

  await expect(page.locator('.diary-history-item')).toHaveCount(2);
  await page.getByRole('button', { name: new RegExp(savedEntries[0].date) }).last().click();
  await expect(page.locator('.modal')).toContainText(`House reputation ${savedEntries[0].reputation}`);
  await expect(page.locator('.modal')).toContainText(`${savedEntries[0].complete}/4`);
});

test('shows each timed household event once in English', async ({ page, isMobile }) => {
  test.setTimeout(60_000);
  test.skip(isMobile, 'The timed event flow uses the desktop household panel.');
  await page.addInitScript(() => localStorage.setItem('pemberley-language', 'en'));
  await page.goto('/');
  await playThroughEvents(page, householdEvents.en);
});

test('shows each timed household event once in Japanese', async ({ page, isMobile }) => {
  test.setTimeout(60_000);
  test.skip(isMobile, 'The timed event flow uses the desktop household panel.');
  await page.addInitScript(() => localStorage.setItem('pemberley-language', 'ja'));
  await page.goto('/');
  await playThroughEvents(page, householdEvents.ja);
});

test('resets timed household events for a fresh English day', async ({ page, isMobile }) => {
  test.setTimeout(90_000);
  test.skip(isMobile, 'The timed event flow uses the desktop household panel.');
  await page.addInitScript(() => localStorage.setItem('pemberley-language', 'en'));
  await page.goto('/');

  await playThroughEvents(page, householdEvents.en);
  await page.getByRole('button', { name: 'Close day & write diary' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('heading', { name: 'A well-managed day' })).toBeVisible();
  await page.getByRole('button', { name: 'Begin another day' }).evaluate(button => (button as HTMLButtonElement).click());

  await expect(page.locator('.day-number')).toHaveText('07:35');
  await advanceThroughEvents(page, householdEvents.en);
});

test('resets timed household events for a fresh Japanese day', async ({ page, isMobile }) => {
  test.setTimeout(90_000);
  test.skip(isMobile, 'The timed event flow uses the desktop household panel.');
  await page.addInitScript(() => localStorage.setItem('pemberley-language', 'ja'));
  await page.goto('/');

  await playThroughEvents(page, householdEvents.ja);
  await page.getByRole('button', { name: '一日を閉じて日記を書く' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('heading', { name: 'よく管理された一日' })).toBeVisible();
  await page.getByRole('button', { name: '新しい一日を始める' }).evaluate(button => (button as HTMLButtonElement).click());

  await expect(page.locator('.day-number')).toHaveText('07:35');
  await advanceThroughEvents(page, householdEvents.ja);
});

test('mobile controls move the player and expose the action button', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This flow verifies the mobile layout.');
  await page.goto('/');
  await page.getByRole('button', { name: /Begin the day|一日を始める/ }).click();

  const joystick = page.getByLabel('Movement joystick');
  const action = page.getByRole('button', { name: /interact|調べる/ });
  await expect(joystick).toBeVisible();
  await expect(action).toBeVisible();

  const player = page.locator('.mini-player');
  const before = await player.getAttribute('style');
  const box = await joystick.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width - 8, box!.y + box!.height / 2, { steps: 5 });
  await page.waitForTimeout(250);
  await page.mouse.up();
  await expect.poll(() => player.getAttribute('style')).not.toBe(before);
});

test('renders when Web Audio and speech APIs are unavailable', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The mobile browser provides the API-isolation smoke test.');
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Begin the day|一日を始める/ }).click();
  await expect(page.getByText(/Pemberley grounds|ペンバリー領地/)).toBeVisible();
  await page.getByRole('button', { name: /Toggle sound/ }).click();
  await page.getByRole('button', { name: /Open piano/ }).click();
  await expect(page.getByRole('heading', { name: /A little evening air|夕べの小さな演奏/ })).toBeVisible();
  await page.getByRole('button', { name: 'C', exact: true }).click();
  await expect(page.locator('.piano-score')).toContainText(/Notes played: 1|演奏した音符: 1/);
});
