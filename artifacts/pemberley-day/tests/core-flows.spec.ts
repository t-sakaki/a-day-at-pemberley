import { expect, test, type Page } from '@playwright/test';

const householdEvents = {
  en: [
    'Mrs. Reynolds reports: the portrait gallery is ready to be shown, but the music room still wants attention.',
    'A travelling party has asked at the door whether the house may be seen. Mrs. Reynolds is ready to lead them through.',
    'One of the visitors—a young lady from Hertfordshire—lets her eye rest a moment too long on a room not quite in order.',
    'Thomas reports: the visitors have walked down to the lake, and the grounds are showing at their best.',
  ],
  ja: [
    'レイノルズ夫人の報告です。肖像画の間はご案内できますが、音楽室にはまだ手入れが必要です。',
    '旅の一行が、館を拝見できるかと戸口で尋ねています。レイノルズ夫人が館内をご案内する用意をしています。',
    '来訪者のひとり——ハートフォードシャーの若い令嬢——が、十分に整っていない部屋にわずかに長く視線をとどめました。',
    'トマスの報告です。来訪者たちは湖へ下りていき、庭園は最も美しい姿を見せています。',
  ],
} as const;

async function ringBell(page: Page, count: number) {
  const bell = page.locator('.bell-button');
  await bell.evaluate((button, numberOfRings) => {
    for (let i = 0; i < numberOfRings; i += 1) {
      (button as HTMLButtonElement).click();
    }
  }, count);
}

async function expectFreshDayClock(page: Page) {
  await expect(page.locator('.day-number')).toHaveText('07:35');
  await page.clock.fastForward(1_000);
  await expect(page.locator('.day-number')).toHaveText('07:36');
}

async function pauseTestClock(page: Page) {
  await page.clock.pauseAt(new Date(Date.now() + 60 * 60 * 1_000));
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

async function openTaskPanel(page: Page) {
  if (await page.getByRole('button', { name: 'Open task panel' }).isVisible()) {
    await page.getByRole('button', { name: 'Open task panel' }).evaluate(button => (button as HTMLButtonElement).click());
  }
}

async function openStaffPanel(page: Page) {
  await page.getByRole('button', { name: 'Open staff panel' }).evaluate(button => (button as HTMLButtonElement).click());
}

async function spawnMorningSpill(page: Page) {
  await page.getByRole('button', { name: /Begin the day|一日を始める/ }).evaluate(button => (button as HTMLButtonElement).click());
  await ringBell(page, 5); // 08:50, crossing the 08:45 spill threshold.
  await openTaskPanel(page);
  await expect(page.locator('.emergency-card')).toHaveCount(1);
}

async function resolveActiveEmergency(page: Page, label: string) {
  const card = page.locator('.emergency-card').filter({ hasText: label });
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('button').first()).toBeVisible();
  await card.getByRole('button').first().evaluate(button => (button as HTMLButtonElement).click());
  await expect(card).toHaveCount(0);
}

async function expectActiveEmergency(page: Page, label: string) {
  const card = page.locator('.emergency-card').filter({ hasText: label });
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('button').first()).toBeVisible();
}

async function expectEscalatedEmergency(page: Page, emergency: { label: string; escalationDialogue: string }) {
  const card = page.locator('.emergency-card').filter({ hasText: emergency.label });
  await expect(card).toHaveCount(1);
  await expect(card).toHaveClass(/escalated/);
  await expect(page.locator('.log li').filter({ hasText: emergency.escalationDialogue })).toHaveCount(1);
  await expect(card.getByRole('button', { name: /Résoudre|Lösen|Resolver|解决/ })).toBeVisible();
  await card.getByRole('button').first().evaluate(button => (button as HTMLButtonElement).click());
  await expect(card).toHaveCount(0);
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
  await expect(page.locator('.diary-entry')).toContainText('手つかずのまま残り');
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
  await expect(page.locator('.modal')).toContainText('Elizabeth’s good opinion 76');
  await expect(page.locator('.modal')).toContainText('1/4');
});

test('keeps diary history readable when switching between all supported languages', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The bilingual diary history flow uses the desktop title screen.');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pemberley-diary', JSON.stringify([
    { date: '21 August 1812', complete: 1, reputation: 76, day: 1 },
    { date: '22 August 1812', complete: 4, reputation: 82, day: 2 },
  ])));
  await page.reload();

  const datedEntries = [
    { date: '21 August 1812', complete: 1, reputation: 76 },
    { date: '22 August 1812', complete: 4, reputation: 82 },
  ];

  const localizedDiary = {
    en: { label: 'Language', open: /Read the diary/, close: 'Return to grounds', historyReputation: 'Elizabeth’s good opinion', modalReputation: 'Elizabeth’s good opinion', account: 'The household held its course.' },
    ja: { label: '言語', open: /日記を読む/, close: '領地へ戻る', historyReputation: 'エリザベスの好意', modalReputation: 'エリザベスの好意', account: '館はその務めを保ちました。' },
    fr: { label: 'Langue', open: /Lire le journal/, close: 'Retour au domaine', historyReputation: 'Réputation de la maison', modalReputation: 'Réputation de la maison', account: 'La maison a suivi son cours.' },
    de: { label: 'Sprache', open: /Tagebuch lesen/, close: 'Zum Anwesen zurückkehren', historyReputation: 'Ansehen des Hauses', modalReputation: 'Ansehen des Hauses', account: 'Der Haushalt hielt seinen Kurs.' },
    es: { label: 'Idioma', open: /Leer el diario/, close: 'Volver a los terrenos', historyReputation: 'Reputación de la casa', modalReputation: 'Reputación de la casa', account: 'La casa mantuvo el rumbo.' },
    zh: { label: '语言', open: /阅读日记/, close: '返回庄园', historyReputation: '宅邸声誉', modalReputation: '宅邸声誉', account: '宅邸维持着应有的秩序。' },
  } as const;

  for (const language of ['en', 'ja', 'fr', 'de', 'es', 'zh'] as const) {
    const copy = localizedDiary[language];
    const languageSelect = page.locator('main.title-screen select');

    await languageSelect.selectOption(language);
    await expect(languageSelect).toHaveAttribute('aria-label', copy.label);
    await expect(languageSelect).toHaveValue(language);

    await page.getByRole('button', { name: copy.open }).click({ force: true });
    await expect(page.locator('.diary-history-item')).toHaveCount(2);

    for (const entry of datedEntries) {
      const historyEntry = page.getByRole('button', { name: new RegExp(entry.date) });
      await expect(historyEntry).toBeVisible();
      await expect(historyEntry).toContainText(`${entry.complete}/4`);
      await expect(historyEntry).toContainText(`${copy.historyReputation} ${entry.reputation}`);
      await historyEntry.click({ force: true });
      await expect(page.locator('.modal')).toContainText(`${entry.complete}/4`);
      await expect(page.locator('.modal')).toContainText(`${copy.modalReputation} ${entry.reputation}`);
      if (entry.complete < 4) {
        await expect(page.locator('.diary-entry')).toContainText(copy.account);
      }
    }

    await page.getByRole('button', { name: copy.close }).click({ force: true });
    await expect(page.getByRole('button', { name: copy.open })).toBeVisible();
  }
});

test('keeps saved diary history usable from the mobile title screen', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This flow verifies the mobile title screen.');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pemberley-diary', JSON.stringify([
    { date: '21 August 1812', complete: 1, reputation: 76, day: 1 },
    { date: '22 August 1812', complete: 4, reputation: 82, day: 2 },
  ])));
  await page.reload();

  const datedEntries = [
    { date: '21 August 1812', complete: 1, reputation: 76 },
    { date: '22 August 1812', complete: 4, reputation: 82 },
  ];

  for (const language of ['en', 'ja'] as const) {
    const languageSelect = page.locator('main.title-screen select');
    await languageSelect.selectOption(language);
    await expect(languageSelect).toHaveValue(language);

    const readDiary = page.getByRole('button', { name: language === 'en' ? /Read the diary/ : /日記を読む/ });
    await expect(readDiary).toBeVisible();
    await readDiary.click();
    await expect(page.locator('.diary-history-item')).toHaveCount(2);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    for (const entry of datedEntries) {
      const historyEntry = page.getByRole('button', { name: new RegExp(entry.date) });
      await expect(historyEntry).toBeVisible();
      await expect(historyEntry).toContainText(`${entry.complete}/4`);
      await expect(historyEntry).toContainText(String(entry.reputation));
      const box = await historyEntry.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      await historyEntry.click();
      await expect(page.locator('.modal')).toContainText(`${entry.complete}/4`);
      await expect(page.locator('.modal')).toContainText(String(entry.reputation));
    }

    await page.getByRole('button', { name: language === 'en' ? 'Return to grounds' : '領地へ戻る' }).click();
    await expect(readDiary).toBeVisible();
  }
});

test('contains keyboard focus in the mobile diary and restores it to the saved-history opener', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This flow verifies the mobile diary dialog.');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pemberley-diary', JSON.stringify([
    { date: '21 August 1812', complete: 1, reputation: 76, day: 1 },
    { date: '22 August 1812', complete: 4, reputation: 82, day: 2 },
  ])));
  await page.reload();

  const opener = page.getByRole('button', { name: /Read the diary/ });
  await opener.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'A well-managed day' });
  await expect(dialog).toBeVisible();
  const focusable = dialog.locator('button:not([disabled]), input:not([disabled]), select:not([disabled])');
  const first = focusable.first();
  const last = focusable.last();
  await expect(first).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();

  await last.focus();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('wraps long localized diary dates without clipping the saved account or close action', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This flow verifies the mobile diary modal.');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pemberley-diary', JSON.stringify([
    {
      date: '21 August 1812 · Michaelmas household account · 西の窓辺に残る長い夕刻の記録 · 秋の館の記録',
      complete: 4,
      reputation: 82,
      day: 1,
    },
  ])));
  await page.reload();

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  for (const language of ['en', 'ja'] as const) {
    const languageSelect = page.locator('main.title-screen select');
    await languageSelect.selectOption(language);
    const longDate = page.locator('.diary-summary strong');
    await expect(longDate).toBeVisible();
    const dateBox = await longDate.boundingBox();
    expect(dateBox).not.toBeNull();
    expect(dateBox!.x).toBeGreaterThanOrEqual(0);
    expect(dateBox!.x + dateBox!.width).toBeLessThanOrEqual(viewport!.width);

    await page.getByRole('button', { name: language === 'en' ? /Read the diary/ : /日記を読む/ }).click();
    const modal = page.locator('.modal');
    const modalBox = await modal.boundingBox();
    expect(modalBox).not.toBeNull();
    expect(modalBox!.x).toBeGreaterThanOrEqual(0);
    expect(modalBox!.x + modalBox!.width).toBeLessThanOrEqual(viewport!.width);

    await expect(modal.locator('.diary-entry')).toBeVisible();
    await expect(modal.locator('.diary-stats')).toContainText(language === 'en' ? 'Elizabeth’s good opinion 82' : 'エリザベスの好意 82');
    const accountBox = await modal.locator('.diary-entry').boundingBox();
    expect(accountBox).not.toBeNull();
    expect(accountBox!.x).toBeGreaterThanOrEqual(0);
    expect(accountBox!.x + accountBox!.width).toBeLessThanOrEqual(viewport!.width);

    const close = modal.getByRole('button', { name: language === 'en' ? 'Return to grounds' : '領地へ戻る' });
    await expect(close).toBeVisible();
    await close.click();
    await expect(modal).toBeHidden();
  }
});

test('keeps a large mobile diary history scrollable while the selected account and close action stay accessible', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This flow verifies the mobile diary modal.');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pemberley-diary', JSON.stringify(
    Array.from({ length: 28 }, (_, index) => ({
      date: `${String(index + 1).padStart(2, '0')} August 1812 · Evening household account`,
      complete: index % 5,
      reputation: 60 + index,
      day: index + 1,
    })),
  )));
  await page.reload();

  await page.getByRole('button', { name: /Read the diary/ }).click();
  const modal = page.locator('.diary-modal');
  const history = modal.locator('.diary-history');
  await expect(history).toBeVisible();
  await expect(history.locator('.diary-history-item')).toHaveCount(28);
  expect(await history.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);

  const oldest = history.getByRole('button', { name: /01 August 1812/ });
  await oldest.click();
  await expect(oldest).toHaveClass(/active/);
  await expect(modal.locator('.diary-entry')).toContainText('0 of 4 principal duties');
  await expect(modal.locator('.diary-stats')).toContainText('Elizabeth’s good opinion 60');

  const viewport = page.viewportSize();
  const accountBox = await modal.locator('.diary-entry').boundingBox();
  const closeBox = await modal.getByRole('button', { name: 'Return to grounds' }).boundingBox();
  expect(viewport).not.toBeNull();
  expect(accountBox).not.toBeNull();
  expect(closeBox).not.toBeNull();
  expect(accountBox!.y).toBeGreaterThanOrEqual(0);
  expect(closeBox!.y + closeBox!.height).toBeLessThanOrEqual(viewport!.height);
  await modal.getByRole('button', { name: 'Return to grounds' }).click();
  await expect(modal).toBeHidden();
});

test('supports keyboard-only browsing from the diary history to the return action', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The keyboard diary history flow uses the desktop title screen.');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pemberley-diary', JSON.stringify(
    Array.from({ length: 28 }, (_, index) => ({
      date: `${String(index + 1).padStart(2, '0')} August 1812 · Evening household account`,
      complete: index % 5,
      reputation: 60 + index,
      day: index + 1,
    })),
  )));
  await page.reload();

  const openDiary = page.getByRole('button', { name: /Read the diary/ });
  await openDiary.focus();
  await page.keyboard.press('Enter');

  const modal = page.locator('.diary-modal');
  const historyEntries = modal.locator('.diary-history-item');
  await expect(modal).toBeVisible();
  await expect(historyEntries).toHaveCount(28);
  await expect(historyEntries.first()).toBeFocused();

  for (let index = 1; index < 28; index += 1) {
    await page.keyboard.press('Tab');
  }
  const oldest = historyEntries.last();
  await expect(oldest).toBeFocused();
  await expect(oldest).toContainText('01 August 1812');
  await page.keyboard.press('Enter');
  await expect(oldest).toHaveClass(/active/);
  await expect(modal.locator('.diary-entry')).toContainText('0 of 4 principal duties');
  await expect(modal.locator('.diary-stats')).toContainText('Elizabeth’s good opinion 60');

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const returnButton = modal.getByRole('button', { name: 'Return to grounds' });
  await expect(returnButton).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(modal).toBeHidden();
});

test('contains keyboard focus in settings and restores it to the opener', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The settings keyboard flow uses the desktop game header.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day' }).evaluate(button => (button as HTMLButtonElement).click());

  const opener = page.getByRole('button', { name: 'Open settings' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: 'Close' });
  const save = dialog.getByRole('button', { name: 'Save settings' });
  await expect(close).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(save).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('contains keyboard focus in mobile settings and restores it to the opener', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This flow verifies the mobile settings dialog.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day' }).click();

  const opener = page.getByRole('button', { name: 'Open settings' });
  await opener.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  const focusable = dialog.locator('button:not([disabled]), input:not([disabled]), select:not([disabled])');
  const first = focusable.first();
  const last = focusable.last();
  await expect(first).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();

  await last.focus();
  await page.keyboard.press('Tab');
  await expect(first).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('contains keyboard focus in the piano and restores it to the opener', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The piano keyboard flow uses the desktop game map.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day' }).evaluate(button => (button as HTMLButtonElement).click());

  const opener = page.getByRole('button', { name: 'Open piano' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'A little evening air' });
  await expect(dialog).toBeVisible();
  const firstKey = dialog.locator('.piano-keys button').first();
  const close = dialog.getByRole('button', { name: 'Close' });
  await expect(firstKey).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstKey).toBeFocused();
  await close.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('contains keyboard focus in the mobile piano and restores it to the opener', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This flow verifies the mobile piano dialog.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day' }).click();

  const opener = page.getByRole('button', { name: 'Open piano' });
  await opener.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'A little evening air' });
  await expect(dialog).toBeVisible();
  const keys = dialog.locator('.piano-keys button');
  const close = dialog.getByRole('button', { name: 'Close' });
  await expect(keys.first()).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(keys.first()).toBeFocused();

  await keys.last().focus();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('dismisses every dialog with Escape and restores desktop focus to its opener', async ({ page, isMobile }) => {
  test.skip(isMobile, 'This flow verifies desktop dialog dismissal.');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pemberley-diary', JSON.stringify([
    { date: '22 August 1812', complete: 4, reputation: 82, day: 1 },
  ])));
  await page.reload();

  const diaryOpener = page.getByRole('button', { name: /Read the diary/ });
  await diaryOpener.focus();
  await page.keyboard.press('Enter');
  const diary = page.getByRole('dialog', { name: 'A well-managed day' });
  await expect(diary).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(diary).toBeHidden();
  await expect(diaryOpener).toBeFocused();

  await page.getByRole('button', { name: 'Begin the day' }).click();
  const settingsOpener = page.getByRole('button', { name: 'Open settings' });
  await settingsOpener.focus();
  await page.keyboard.press('Enter');
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings).toBeHidden();
  await expect(settingsOpener).toBeFocused();

  const pianoOpener = page.getByRole('button', { name: 'Open piano' });
  await pianoOpener.focus();
  await page.keyboard.press('Enter');
  const piano = page.getByRole('dialog', { name: 'A little evening air' });
  await expect(piano).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(piano).toBeHidden();
  await expect(pianoOpener).toBeFocused();
});

test('dismisses every dialog with Escape and restores mobile focus to its opener', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'This flow verifies mobile dialog dismissal.');
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('pemberley-diary', JSON.stringify([
    { date: '22 August 1812', complete: 4, reputation: 82, day: 1 },
  ])));
  await page.reload();

  const diaryOpener = page.getByRole('button', { name: /Read the diary/ });
  await diaryOpener.focus();
  await page.keyboard.press('Enter');
  const diary = page.getByRole('dialog', { name: 'A well-managed day' });
  await expect(diary).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(diary).toBeHidden();
  await expect(diaryOpener).toBeFocused();

  await page.getByRole('button', { name: 'Begin the day' }).click();
  const settingsOpener = page.getByRole('button', { name: 'Open settings' });
  await settingsOpener.focus();
  await page.keyboard.press('Enter');
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings).toBeHidden();
  await expect(settingsOpener).toBeFocused();

  const pianoOpener = page.getByRole('button', { name: 'Open piano' });
  await pianoOpener.focus();
  await page.keyboard.press('Enter');
  const piano = page.getByRole('dialog', { name: 'A little evening air' });
  await expect(piano).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(piano).toBeHidden();
  await expect(pianoOpener).toBeFocused();
});

test('keeps both diary records after closing two days', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The two-day diary flow uses the desktop task panel.');
  await page.clock.install();
  await page.goto('/');
  await pauseTestClock(page);
  await page.getByRole('button', { name: 'Begin the day' }).evaluate(button => (button as HTMLButtonElement).click());

  await page.getByRole('checkbox').nth(0).evaluate(input => (input as HTMLInputElement).click());
  await page.getByRole('checkbox').nth(1).evaluate(input => (input as HTMLInputElement).click());
  await page.getByRole('button', { name: 'Close day & write diary' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('heading', { name: 'A well-managed day' })).toBeVisible();
  await expect(page.locator('.diary-history-item')).toHaveCount(0);

  await page.getByRole('button', { name: 'Begin another day' }).evaluate(button => (button as HTMLButtonElement).click());
  await expectFreshDayClock(page);
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
  await expect(page.locator('.modal')).toContainText(`Elizabeth’s good opinion ${savedEntries[0].reputation}`);
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
  await page.clock.install();
  await page.addInitScript(() => localStorage.setItem('pemberley-language', 'en'));
  await page.goto('/');
  await pauseTestClock(page);

  await playThroughEvents(page, householdEvents.en);
  await page.getByRole('button', { name: 'Close day & write diary' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('heading', { name: 'A well-managed day' })).toBeVisible();
  await page.getByRole('button', { name: 'Begin another day' }).evaluate(button => (button as HTMLButtonElement).click());

  await expectFreshDayClock(page);
  await advanceThroughEvents(page, householdEvents.en);
});

test('resets timed household events for a fresh Japanese day', async ({ page, isMobile }) => {
  test.setTimeout(90_000);
  test.skip(isMobile, 'The timed event flow uses the desktop household panel.');
  await page.clock.install();
  await page.addInitScript(() => localStorage.setItem('pemberley-language', 'ja'));
  await page.goto('/');
  await pauseTestClock(page);

  await playThroughEvents(page, householdEvents.ja);
  await page.getByRole('button', { name: '一日を閉じて日記を書く' }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(page.getByRole('heading', { name: 'よく管理された一日' })).toBeVisible();
  await page.getByRole('button', { name: '新しい一日を始める' }).evaluate(button => (button as HTMLButtonElement).click());

  await expectFreshDayClock(page);
  await advanceThroughEvents(page, householdEvents.ja);
});

test('resolves the morning spill nearby in English and Japanese on desktop and mobile', async ({ page }) => {
  test.setTimeout(60_000);
  for (const language of ['en', 'ja'] as const) {
    await page.addInitScript((selectedLanguage) => localStorage.setItem('pemberley-language', selectedLanguage), language);
    await page.goto('/');
    await pauseTestClock(page);
    await spawnMorningSpill(page);

    const localized = language === 'en'
      ? { heading: 'Urgent events', resolve: 'Resolve', dispatch: 'Dispatch', staff: 'Mrs. Reynolds', assigned: 'Assigned' }
      : { heading: '緊急の出来事', resolve: '解決', dispatch: '派遣', staff: 'レイノルズ夫人', assigned: '担当' };
    const eventCard = page.locator('.emergency-card').first();
    await expect(page.getByText(localized.heading, { exact: false })).toBeVisible();
    await expect(eventCard).toContainText(localized.resolve);

    await openStaffPanel(page);
    await page.getByText(localized.staff, { exact: false }).first().evaluate(element => (element as HTMLElement).click());
    const dispatch = page.getByRole('button', { name: new RegExp(`${localized.dispatch}.*Morning rooms`) });
    await dispatch.evaluate(button => (button as HTMLButtonElement).click());
    await expect(eventCard).toContainText(localized.assigned);

    // The urgent-event card is the stable resolution control on both layouts.
    await eventCard.getByRole('button', { name: localized.resolve }).evaluate(button => (button as HTMLButtonElement).click());
    await expect(page.locator('.emergency-card')).toHaveCount(0);
    await expect(page.locator('.calm-note')).toBeVisible();
  }
});

test('renders emergency cards, dialogue, and guest mood copy in every remaining language', async ({ page, isMobile }) => {
  test.setTimeout(120_000);
  test.skip(isMobile, 'The locale matrix uses the desktop household panel.');
  const localized = {
    fr: {
      heading: 'Événements urgents',
      title: 'Un liquide renversé doit être nettoyé immédiatement dans les salons du matin.',
      location: 'Salons du matin',
      guest: 'La voiture de louage des Gardiner a franchi la loge ; ils demandent si l’on peut visiter la maison.',
      mood: 'Humeur des invités',
    },
    de: {
      heading: 'Dringende Ereignisse',
      title: 'In den Morgenräumen muss eine verschüttete Flüssigkeit sofort beseitigt werden.',
      location: 'Morgenräume',
      guest: 'Die Mietkutsche der Gardiners ist am Pförtnerhaus eingebogen; sie fragen, ob das Haus besichtigt werden darf.',
      mood: 'Gästestimmung',
    },
    es: {
      heading: 'Situaciones urgentes',
      title: 'Hay que atender de inmediato un derrame en las salas de la mañana.',
      location: 'Salas de la mañana',
      guest: 'El carruaje alquilado de los Gardiner ha entrado por la casa del guarda; preguntan si se puede ver la casa.',
      mood: 'Ánimo de los invitados',
    },
    zh: {
      heading: '紧急事件',
      title: '晨间房间有洒出的液体，需要立即处理。',
      location: '晨间房间',
      guest: '加德纳夫妇租来的马车已驶入门房，他们询问是否可以参观宅邸。',
      mood: '客人心情',
    },
  } as const;

  for (const language of ['fr', 'de', 'es', 'zh'] as const) {
    await page.goto('/');
    await page.locator('main.title-screen select').selectOption(language);
    await page.getByRole('button', { name: language === 'fr' ? 'Commencer la journée' : language === 'de' ? 'Tag beginnen' : language === 'es' ? 'Comenzar el día' : '开始一天' }).evaluate(button => (button as HTMLButtonElement).click());
    await ringBell(page, 5);
    await openTaskPanel(page);

    const eventCard = page.locator('.emergency-card').first();
    await expect(page.getByText(localized[language].heading, { exact: false })).toBeVisible();
    await expect(eventCard).toContainText(localized[language].location);
    await expect(page.locator('.log li').filter({ hasText: localized[language].title })).toHaveCount(1);

    await eventCard.getByRole('button', { name: /Résoudre|Lösen|Resolver|解决/ }).evaluate(button => (button as HTMLButtonElement).click());
    await ringBell(page, 17);
    await openStaffPanel(page);
    const guestCard = page.locator('.guest-card').first();
    await expect(page.locator('.status-meters div').filter({ hasText: localized[language].mood })).toContainText('82%');
    await expect(guestCard).toContainText(localized[language].guest);
  }
});

test('renders the later emergency cards, locations, and dialogue in every remaining language', async ({ page, isMobile }) => {
  test.setTimeout(180_000);
  test.skip(isMobile, 'The emergency locale matrix uses the desktop household panel.');

  const localized = {
    fr: {
      sick: {
        label: 'Un membre du personnel est tombé malade.',
        location: 'Couloir des domestiques',
        dialogue: 'Un valet est tombé malade dans le couloir des domestiques ; un médecin est nécessaire.',
        escalationDialogue: 'L’état du valet s’aggrave et le personnel du soir manque de bras.',
      },
      dog: {
        label: 'Un chien en liberté sème le trouble.',
        location: 'Pelouse sud',
        dialogue: 'Le chien a échappé à sa laisse sur la pelouse sud et se dirige vers la maison.',
        escalationDialogue: 'Le chien en liberté a renversé un plateau près de la pelouse sud.',
      },
      dinner_rush: {
        label: 'Le service du dîner prend du retard.',
        location: 'Passage de la cuisine',
        dialogue: 'Le service du dîner prend du retard dans le passage de la cuisine ; le premier plat va bientôt être servi.',
        escalationDialogue: 'Le service du dîner risque de ne pas être prêt à l’heure où les invités s’installent.',
      },
    },
    de: {
      sick: {
        label: 'Ein Mitglied des Personals ist erkrankt.',
        location: 'Dienstbotenkorridor',
        dialogue: 'Ein Diener ist im Dienstbotenkorridor erkrankt; ein Arzt wird benötigt.',
        escalationDialogue: 'Der Zustand des Dieners verschlechtert sich, und am Abend fehlen Arbeitskräfte.',
      },
      dog: {
        label: 'Ein freilaufender Jagdhund sorgt für Unruhe.',
        location: 'Südrasen',
        dialogue: 'Der Jagdhund hat sich auf dem Südrasen losgerissen und läuft zum Haus.',
        escalationDialogue: 'Der entlaufene Jagdhund hat am Südrasen ein Tablett umgestoßen.',
      },
      dinner_rush: {
        label: 'Der Abendservice gerät in Verzug.',
        location: 'Küchenpassage',
        dialogue: 'Der Abendservice kommt in der Küchenpassage in Verzug; der erste Gang wird bald erwartet.',
        escalationDialogue: 'Der Abendservice droht zur Sitzzeit der Gäste nicht bereit zu sein.',
      },
    },
    es: {
      sick: {
        label: 'Un miembro del personal ha enfermado.',
        location: 'Pasillo de servicio',
        dialogue: 'Un lacayo ha enfermado en el pasillo de servicio; se necesita un médico.',
        escalationDialogue: 'El estado del lacayo empeora y falta personal para la tarde.',
      },
      dog: {
        label: 'Un sabueso suelto está causando problemas.',
        location: 'Césped sur',
        dialogue: 'El sabueso se ha soltado en el césped sur y se dirige a la casa.',
        escalationDialogue: 'El sabueso suelto ha volcado una bandeja junto al césped sur.',
      },
      dinner_rush: {
        label: 'El servicio de la cena se está retrasando.',
        location: 'Pasillo de la cocina',
        dialogue: 'El servicio de la cena se retrasa en el pasillo de la cocina; el primer plato llegará pronto.',
        escalationDialogue: 'El servicio de la cena corre el riesgo de no estar listo a la hora de sentarse los invitados.',
      },
    },
    zh: {
      sick: {
        label: '一名员工病倒了。',
        location: '仆人走廊',
        dialogue: '一名男仆在仆人走廊病倒了，需要医生。',
        escalationDialogue: '男仆的病情正在恶化，晚班人手不足。',
      },
      dog: {
        label: '一只逃脱的猎犬正在惹麻烦。',
        location: '南草坪',
        dialogue: '猎犬在南草坪挣脱了牵引绳，正朝宅邸跑去。',
        escalationDialogue: '逃脱的猎犬在南草坪旁打翻了托盘。',
      },
      dinner_rush: {
        label: '晚餐服务进度落后了。',
        location: '厨房通道',
        dialogue: '厨房通道的晚餐服务落后了，第一道菜很快就要上桌。',
        escalationDialogue: '晚餐服务可能赶不上客人入席的时间。',
      },
    },
  } as const;

  async function expectEmergency(
    page: Page,
    emergency: { label: string; location: string; dialogue: string },
  ) {
    const card = page.locator('.emergency-card').filter({ hasText: emergency.label });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(emergency.location);
    await expect(page.locator('.log li').filter({ hasText: emergency.dialogue })).toHaveCount(1);
    await card.getByRole('button').first().evaluate(button => (button as HTMLButtonElement).click());
    await expect(card).toHaveCount(0);
  }

  for (const language of ['fr', 'de', 'es', 'zh'] as const) {
    await page.addInitScript((selectedLanguage) => localStorage.setItem('pemberley-language', selectedLanguage), language);
    await page.goto('/');
    await page.getByRole('button', { name: language === 'fr' ? 'Commencer la journée' : language === 'de' ? 'Tag beginnen' : language === 'es' ? 'Comenzar el día' : '开始一天' }).evaluate(button => (button as HTMLButtonElement).click());
    await openTaskPanel(page);

    await ringBell(page, 5); // 08:50, crossing the morning spill threshold.
    await expectEmergency(page, {
      label: language === 'fr' ? 'Un liquide renversé doit être nettoyé immédiatement.' : language === 'de' ? 'Eine verschüttete Flüssigkeit muss sofort beseitigt werden.' : language === 'es' ? 'Hay que atender de inmediato un derrame.' : '有洒出的液体需要立即处理。',
      location: language === 'fr' ? 'Salons du matin' : language === 'de' ? 'Morgenräume' : language === 'es' ? 'Salas de la mañana' : '晨间房间',
      dialogue: language === 'fr' ? 'Un liquide renversé doit être nettoyé immédiatement dans les salons du matin.' : language === 'de' ? 'In den Morgenräumen muss eine verschüttete Flüssigkeit sofort beseitigt werden.' : language === 'es' ? 'Hay que atender de inmediato un derrame en las salas de la mañana.' : '晨间房间有洒出的液体，需要立即处理。',
    });

    await ringBell(page, 6); // 10:20, crossing the sick-staff threshold.
    await expectEmergency(page, localized[language].sick);

    await ringBell(page, 5); // 11:35, crossing the loose-hound threshold.
    await expectEmergency(page, localized[language].dog);

    await ringBell(page, 6); // 13:05, crossing the guest-arrival threshold.
    const guestCard = page.locator('.emergency-card').filter({ hasText: language === 'fr' ? 'Un invité inattendu attend dans le vestibule.' : language === 'de' ? 'Ein unangekündigter Gast wartet in der Eingangshalle.' : language === 'es' ? 'Un invitado inesperado espera en el vestíbulo.' : '一位未事先通知的客人正在前厅等候。' });
    await expect(guestCard).toHaveCount(1);
    await guestCard.getByRole('button').first().evaluate(button => (button as HTMLButtonElement).click());
    await expect(guestCard).toHaveCount(0);

    await ringBell(page, 12); // 16:05, crossing the dinner-service threshold.
    await expectEmergency(page, localized[language].dinner_rush);
  }
});

test('renders escalated emergency dialogue in every remaining language', async ({ page, isMobile }) => {
  test.setTimeout(240_000);
  test.skip(isMobile, 'The escalation locale matrix uses the desktop household panel.');

  const localized = {
    fr: {
      start: 'Commencer la journée',
      spill: { label: 'Un liquide renversé doit être nettoyé immédiatement.' },
      sick: { label: 'Un membre du personnel est tombé malade.', escalationDialogue: 'L’état du valet s’aggrave et le personnel du soir manque de bras.' },
      dog: { label: 'Un chien en liberté sème le trouble.', escalationDialogue: 'Le chien en liberté a renversé un plateau près de la pelouse sud.' },
      dinner: { label: 'Le service du dîner prend du retard.', escalationDialogue: 'Le service du dîner risque de ne pas être prêt à l’heure où les invités s’installent.' },
    },
    de: {
      start: 'Tag beginnen',
      spill: { label: 'Eine verschüttete Flüssigkeit muss sofort beseitigt werden.' },
      sick: { label: 'Ein Mitglied des Personals ist erkrankt.', escalationDialogue: 'Der Zustand des Dieners verschlechtert sich, und am Abend fehlen Arbeitskräfte.' },
      dog: { label: 'Ein freilaufender Jagdhund sorgt für Unruhe.', escalationDialogue: 'Der entlaufene Jagdhund hat am Südrasen ein Tablett umgestoßen.' },
      dinner: { label: 'Der Abendservice gerät in Verzug.', escalationDialogue: 'Der Abendservice droht zur Sitzzeit der Gäste nicht bereit zu sein.' },
    },
    es: {
      start: 'Comenzar el día',
      spill: { label: 'Hay que atender de inmediato un derrame.' },
      sick: { label: 'Un miembro del personal ha enfermado.', escalationDialogue: 'El estado del lacayo empeora y falta personal para la tarde.' },
      dog: { label: 'Un sabueso suelto está causando problemas.', escalationDialogue: 'El sabueso suelto ha volcado una bandeja junto al césped sur.' },
      dinner: { label: 'El servicio de la cena se está retrasando.', escalationDialogue: 'El servicio de la cena corre el riesgo de no estar listo a la hora de sentarse los invitados.' },
    },
    zh: {
      start: '开始一天',
      spill: { label: '有洒出的液体需要立即处理。' },
      sick: { label: '一名员工病倒了。', escalationDialogue: '男仆的病情正在恶化，晚班人手不足。' },
      dog: { label: '一只逃脱的猎犬正在惹麻烦。', escalationDialogue: '逃脱的猎犬在南草坪旁打翻了托盘。' },
      dinner: { label: '晚餐服务进度落后了。', escalationDialogue: '晚餐服务可能赶不上客人入席的时间。' },
    },
  } as const;

  for (const language of ['fr', 'de', 'es', 'zh'] as const) {
    await page.addInitScript((selectedLanguage) => localStorage.setItem('pemberley-language', selectedLanguage), language);
    await page.goto('/');
    await page.getByRole('button', { name: localized[language].start }).evaluate(button => (button as HTMLButtonElement).click());
    await openTaskPanel(page);

    // Resolve each earlier event immediately so only the target can escalate.
    await ringBell(page, 5);
    await resolveActiveEmergency(page, localized[language].spill.label);

    await ringBell(page, 6);
    await expectActiveEmergency(page, localized[language].sick.label);
    await ringBell(page, 2);
    await expectEscalatedEmergency(page, localized[language].sick);
    await resolveActiveEmergency(page, localized[language].dinner.label);

    await ringBell(page, 5);
    await expectActiveEmergency(page, localized[language].dog.label);
    await ringBell(page, 2);
    await expectEscalatedEmergency(page, localized[language].dog);
    await resolveActiveEmergency(page, localized[language].spill.label);

    await ringBell(page, 2);
    const guestCard = page.locator('.emergency-card').filter({ hasText: language === 'fr' ? 'Un invité inattendu attend dans le vestibule.' : language === 'de' ? 'Ein unangekündigter Gast wartet in der Eingangshalle.' : language === 'es' ? 'Un invitado inesperado espera en el vestíbulo.' : '一位未事先通知的客人正在前厅等候。' });
    await expect(guestCard).toHaveCount(1);
    await guestCard.getByRole('button').first().evaluate(button => (button as HTMLButtonElement).click());
    await expect(guestCard).toHaveCount(0);

    await ringBell(page, 12);
    await expectActiveEmergency(page, localized[language].dinner.label);
    await ringBell(page, 2);
    await expectEscalatedEmergency(page, localized[language].dinner);
  }
});

test('switching language during an emergency preserves the event and guest mood', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day' }).evaluate(button => (button as HTMLButtonElement).click());
  await ringBell(page, 5);
  await openTaskPanel(page);
  await openStaffPanel(page);

  const eventCard = page.locator('.emergency-card').first();
  await expect(eventCard).toContainText('Morning rooms');
  await expect(page.locator('.status-meters div').filter({ hasText: 'Guest mood' })).toContainText('82%');
  await expect(page.locator('.guest-card').first()).toContainText('The Gardiners’ hired carriage has turned in at the lodge; they have asked whether the house may be seen.');

  await page.getByRole('button', { name: 'Open settings' }).evaluate(button => (button as HTMLButtonElement).click());
  await page.getByRole('dialog').locator('select').selectOption('fr');
  await expect(eventCard).toHaveCount(1);
  await expect(eventCard).toContainText('Salons du matin');
  await expect(page.locator('.status-meters div').filter({ hasText: 'Humeur des invités' })).toContainText('82%');
  await expect(page.locator('.guest-card').first()).toContainText('La voiture de louage des Gardiner a franchi la loge ; ils demandent si l’on peut visiter la maison.');
});

test('handles an active emergency when no speech voice matches the selected language', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The speech fallback check uses the desktop settings dialog.');
  await page.addInitScript(() => {
    const synthesis = window.speechSynthesis;
    if (synthesis) {
      Object.defineProperty(synthesis, 'getVoices', { configurable: true, value: () => [{ lang: 'en-US' }] });
      Object.defineProperty(synthesis, 'speak', {
        configurable: true,
        value: () => undefined,
      });
    }
  });
  await page.goto('/');
  await page.locator('main.title-screen select').selectOption('fr');
  await page.getByRole('button', { name: 'Commencer la journée' }).evaluate(button => (button as HTMLButtonElement).click());
  await page.getByRole('button', { name: 'Open settings' }).evaluate(button => (button as HTMLButtonElement).click());
  await page.getByRole('dialog').locator('input[type="checkbox"]').nth(1).evaluate(input => (input as HTMLInputElement).click());
  await page.getByRole('dialog').getByRole('button', { name: 'Enregistrer les paramètres' }).evaluate(button => (button as HTMLButtonElement).click());
  await ringBell(page, 5);
  await openTaskPanel(page);
  await expect(page.locator('.emergency-card')).toHaveCount(1);
  await expect(page.locator('.emergency-card').first()).toContainText('Salons du matin');
});

test('escalated emergencies remain actionable and reset on a new English and Japanese day', async ({ page }) => {
  test.setTimeout(90_000);
  await page.clock.install();
  for (const language of ['en', 'ja'] as const) {
    await page.addInitScript((selectedLanguage) => localStorage.setItem('pemberley-language', selectedLanguage), language);
    await page.goto('/');
    await pauseTestClock(page);
    await spawnMorningSpill(page);
    await ringBell(page, 3); // 09:35, past the spill's 32-minute response window.
    await openTaskPanel(page);

    const localized = language === 'en'
      ? { resolve: 'Resolve', escalated: 'The situation has worsened.', morale: 'Staff morale', close: 'Close day & write diary', diary: 'A well-managed day', another: 'Begin another day' }
      : { resolve: '解決', escalated: '事態が悪化しました。', morale: '使用人の士気', close: '一日を閉じて日記を書く', diary: 'よく管理された一日', another: '新しい一日を始める' };
    const eventCard = page.locator('.emergency-card').first();
    await expect(eventCard).toHaveClass(/escalated/);
    await expect(eventCard).toContainText(localized.escalated);
    await expect(eventCard.getByRole('button', { name: localized.resolve })).toBeVisible();

    await openStaffPanel(page);
    const morale = page.locator('.status-meters div').filter({ hasText: localized.morale }).locator('b');
    await expect(morale).toHaveText('80%');

    await openTaskPanel(page);
    await page.getByRole('button', { name: localized.close }).evaluate(button => (button as HTMLButtonElement).click());
    await expect(page.getByRole('heading', { name: localized.diary })).toBeVisible();
    await page.getByRole('button', { name: localized.another }).evaluate(button => (button as HTMLButtonElement).click());
    await expectFreshDayClock(page);
    await openTaskPanel(page);
    await expect(page.locator('.emergency-card')).toHaveCount(0);
    await expect(page.locator('.calm-note')).toBeVisible();
  }
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

test('mobile recovery keeps localized sick-staff, loose-hound, and dinner escalations actionable', async ({ page, isMobile }) => {
  test.setTimeout(240_000);
  test.skip(!isMobile, 'This flow verifies mobile emergency recovery.');

  const localized = {
    fr: {
      start: 'Commencer la journée',
      spill: 'Un liquide renversé doit être nettoyé immédiatement.',
      sick: { label: 'Un membre du personnel est tombé malade.', dialogue: 'L’état du valet s’aggrave et le personnel du soir manque de bras.' },
      dog: { label: 'Un chien en liberté sème le trouble.', dialogue: 'Le chien en liberté a renversé un plateau près de la pelouse sud.' },
      dinner: { label: 'Le service du dîner prend du retard.', dialogue: 'Le service du dîner risque de ne pas être prêt à l’heure où les invités s’installent.' },
      resolve: 'Résoudre',
    },
    de: {
      start: 'Tag beginnen',
      spill: 'Eine verschüttete Flüssigkeit muss sofort beseitigt werden.',
      sick: { label: 'Ein Mitglied des Personals ist erkrankt.', dialogue: 'Der Zustand des Dieners verschlechtert sich, und am Abend fehlen Arbeitskräfte.' },
      dog: { label: 'Ein freilaufender Jagdhund sorgt für Unruhe.', dialogue: 'Der entlaufene Jagdhund hat am Südrasen ein Tablett umgestoßen.' },
      dinner: { label: 'Der Abendservice gerät in Verzug.', dialogue: 'Der Abendservice droht zur Sitzzeit der Gäste nicht bereit zu sein.' },
      resolve: 'Lösen',
    },
    es: {
      start: 'Comenzar el día',
      spill: 'Hay que atender de inmediato un derrame.',
      sick: { label: 'Un miembro del personal ha enfermado.', dialogue: 'El estado del lacayo empeora y falta personal para la tarde.' },
      dog: { label: 'Un sabueso suelto está causando problemas.', dialogue: 'El sabueso suelto ha volcado una bandeja junto al césped sur.' },
      dinner: { label: 'El servicio de la cena se está retrasando.', dialogue: 'El servicio de la cena corre el riesgo de no estar listo a la hora de sentarse los invitados.' },
      resolve: 'Resolver',
    },
    zh: {
      start: '开始一天',
      spill: '有洒出的液体需要立即处理。',
      sick: { label: '一名员工病倒了。', dialogue: '男仆的病情正在恶化，晚班人手不足。' },
      dog: { label: '一只逃脱的猎犬正在惹麻烦。', dialogue: '逃脱的猎犬在南草坪旁打翻了托盘。' },
      dinner: { label: '晚餐服务进度落后了。', dialogue: '晚餐服务可能赶不上客人入席的时间。' },
      resolve: '解决',
    },
  } as const;

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  for (const language of ['fr', 'de', 'es', 'zh'] as const) {
    await page.addInitScript((selectedLanguage) => localStorage.setItem('pemberley-language', selectedLanguage), language);
    await page.goto('/');
    await page.getByRole('button', { name: localized[language].start }).click();
    await openTaskPanel(page);

    const action = page.getByRole('button', { name: localized[language].resolve });
    await expect(action).toHaveCount(0);
    const touchAction = page.locator('.touch-action');
    await expect(touchAction).toBeVisible();
    await expect(touchAction).toBeEnabled();
    const actionBox = await touchAction.boundingBox();
    expect(actionBox).not.toBeNull();
    expect(actionBox!.x).toBeGreaterThanOrEqual(0);
    expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(viewport!.height);

    await ringBell(page, 5);
    await resolveActiveEmergency(page, localized[language].spill);

    await ringBell(page, 6);
    await expectActiveEmergency(page, localized[language].sick.label);
    await ringBell(page, 2);
    await expectEscalatedEmergency(page, { label: localized[language].sick.label, escalationDialogue: localized[language].sick.dialogue });
    await expect(touchAction).toBeVisible();
    await expect(touchAction).toBeEnabled();

    await resolveActiveEmergency(page, localized[language].dinner.label);
    await ringBell(page, 5);
    await expectActiveEmergency(page, localized[language].dog.label);
    await ringBell(page, 2);
    await expectEscalatedEmergency(page, { label: localized[language].dog.label, escalationDialogue: localized[language].dog.dialogue });

    await resolveActiveEmergency(page, localized[language].spill);
    await ringBell(page, 2);
    const guest = page.locator('.emergency-card').filter({ hasText: language === 'fr' ? 'Un invité inattendu attend dans le vestibule.' : language === 'de' ? 'Ein unangekündigter Gast wartet in der Eingangshalle.' : language === 'es' ? 'Un invitado inesperado espera en el vestíbulo.' : '一位未事先通知的客人正在前厅等候。' });
    await expect(guest).toHaveCount(1);
    await guest.getByRole('button').first().click();

    await ringBell(page, 12);
    await expectActiveEmergency(page, localized[language].dinner.label);
    await ringBell(page, 2);
    await expectEscalatedEmergency(page, { label: localized[language].dinner.label, escalationDialogue: localized[language].dinner.dialogue });
    await expect(touchAction).toBeVisible();
    await expect(touchAction).toBeEnabled();
  }
});

test.describe('narrow-phone emergency recovery', () => {
  test.use({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });

  test('keeps localized escalation actions and the circular action control inside the viewport', async ({ page }) => {
    test.setTimeout(60_000);
    const localized = {
      start: '开始一天',
      spill: '有洒出的液体需要立即处理。',
      sick: '一名员工病倒了。',
      escalation: '男仆的病情正在恶化，晚班人手不足。',
      resolve: '解决',
    };

    await page.addInitScript((selectedLanguage) => localStorage.setItem('pemberley-language', selectedLanguage), 'zh');
    await page.goto('/');
    await page.getByRole('button', { name: localized.start }).click();
    await openTaskPanel(page);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const touchAction = page.locator('.touch-action');
    await expect(touchAction).toBeVisible();
    const touchActionBox = await touchAction.boundingBox();
    expect(touchActionBox).not.toBeNull();
    expect(touchActionBox!.x).toBeGreaterThanOrEqual(0);
    expect(touchActionBox!.x + touchActionBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(touchActionBox!.y + touchActionBox!.height).toBeLessThanOrEqual(viewport!.height);

    await ringBell(page, 5);
    await resolveActiveEmergency(page, localized.spill);
    await ringBell(page, 6);
    await expectActiveEmergency(page, localized.sick);
    await ringBell(page, 2);

    const card = page.locator('.emergency-card').filter({ hasText: localized.sick });
    await expect(card).toHaveClass(/escalated/);
    await expect(page.locator('.log li').filter({ hasText: localized.escalation })).toHaveCount(1);
    const resolve = card.getByRole('button', { name: localized.resolve });
    await expect(resolve).toBeVisible();
    const resolveBox = await resolve.boundingBox();
    expect(resolveBox).not.toBeNull();
    expect(resolveBox!.x).toBeGreaterThanOrEqual(0);
    expect(resolveBox!.x + resolveBox!.width).toBeLessThanOrEqual(viewport!.width);
    await resolve.click();
    await expect(card).toHaveCount(0);
  });
});

test.describe('narrow-phone visual regression', () => {
  test.use({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });

  async function prepareScreenshot(page: Page) {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-delay: 0s !important;
          animation-duration: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
          caret-color: transparent !important;
        }
      `,
    });
  }

  async function takeScreenshot(page: Page, name: string) {
    await expect(page).toHaveScreenshot(name, {
      animations: 'disabled',
      mask: [page.locator('.estate-canvas')],
      maskColor: '#14252b',
    });
  }

  test('captures the title screen', async ({ page }) => {
    await page.goto('/');
    await prepareScreenshot(page);
    await expect(page.locator('main.title-screen')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Begin the day' })).toBeVisible();
    await takeScreenshot(page, 'narrow-phone-title.png');
  });

  test('captures the initial game view and mobile controls', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Begin the day' }).click();
    await prepareScreenshot(page);
    await expect(page.locator('.game-shell')).toBeVisible();
    await expect(page.getByLabel('Movement joystick')).toBeVisible();
    await expect(page.locator('.touch-action')).toBeVisible();
    await takeScreenshot(page, 'narrow-phone-game.png');
  });

  test('captures the open task panel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Begin the day' }).click();
    await page.getByRole('button', { name: 'Open task panel' }).evaluate(button => (button as HTMLButtonElement).click());
    await prepareScreenshot(page);
    await expect(page.locator('.left-panel.open')).toBeVisible();
    await expect(page.locator('.day-card')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ring household bell' })).toBeVisible();
    await takeScreenshot(page, 'narrow-phone-task-panel.png');
  });

  test('captures an escalated recovery card', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Begin the day' }).click();
    await page.getByRole('button', { name: 'Open task panel' }).evaluate(button => (button as HTMLButtonElement).click());
    await ringBell(page, 5);
    await resolveActiveEmergency(page, 'A spill needs immediate attention.');
    await ringBell(page, 6);
    await expectActiveEmergency(page, 'A member of staff has fallen ill.');
    await ringBell(page, 2);
    const card = page.locator('.emergency-card').filter({ hasText: 'A member of staff has fallen ill.' });
    await expect(card).toHaveClass(/escalated/);
    await expect(page.locator('.log li').filter({ hasText: 'The footman’s illness is worsening and the evening staff are short-handed.' })).toHaveCount(1);
    await expect(card.getByRole('button', { name: 'Resolve' })).toBeVisible();
    await prepareScreenshot(page);
    await expect(page.locator('.emergency-card.escalated')).toBeVisible();
    await takeScreenshot(page, 'narrow-phone-recovery-escalated.png');
  });

  test('keeps localized active and escalated recovery cards actionable without clipping', async ({ page }) => {
    test.setTimeout(90_000);
    const localized = {
      ja: {
        start: '一日を始める',
        spill: 'こぼれたものをすぐに片付ける必要があります。',
        sick: '使用人が具合を悪くしました。',
        escalation: '従僕の具合が悪化し、夕刻の使用人が足りません。',
        resolve: '解決',
      },
      fr: {
        start: 'Commencer la journée',
        spill: 'Un liquide renversé doit être nettoyé immédiatement.',
        sick: 'Un membre du personnel est tombé malade.',
        escalation: 'L’état du valet s’aggrave et le personnel du soir manque de bras.',
        resolve: 'Résoudre',
      },
      de: {
        start: 'Tag beginnen',
        spill: 'Eine verschüttete Flüssigkeit muss sofort beseitigt werden.',
        sick: 'Ein Mitglied des Personals ist erkrankt.',
        escalation: 'Der Zustand des Dieners verschlechtert sich, und am Abend fehlen Arbeitskräfte.',
        resolve: 'Lösen',
      },
      es: {
        start: 'Comenzar el día',
        spill: 'Hay que atender de inmediato un derrame.',
        sick: 'Un miembro del personal ha enfermado.',
        escalation: 'El estado del lacayo empeora y falta personal para la tarde.',
        resolve: 'Resolver',
      },
      zh: {
        start: '开始一天',
        spill: '有洒出的液体需要立即处理。',
        sick: '一名员工病倒了。',
        escalation: '男仆的病情正在恶化，晚班人手不足。',
        resolve: '解决',
      },
    } as const;
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    for (const language of ['ja', 'fr', 'de', 'es', 'zh'] as const) {
      const copy = localized[language];
      await page.addInitScript((selectedLanguage) => localStorage.setItem('pemberley-language', selectedLanguage), language);
      await page.goto('/');
      await page.getByRole('button', { name: copy.start }).click();
      await page.getByRole('button', { name: 'Open task panel' }).evaluate(button => (button as HTMLButtonElement).click());

      await ringBell(page, 5);
      await resolveActiveEmergency(page, copy.spill);
      await ringBell(page, 6);
      await expectActiveEmergency(page, copy.sick);

      const activeCard = page.locator('.emergency-card').filter({ hasText: copy.sick });
      const activeResolve = activeCard.getByRole('button', { name: copy.resolve });
      await expect.poll(async () => (await activeCard.boundingBox())?.x ?? -1).toBeGreaterThanOrEqual(0);
      const activeCardBox = await activeCard.boundingBox();
      const activeResolveBox = await activeResolve.boundingBox();
      expect(activeCardBox).not.toBeNull();
      expect(activeResolveBox).not.toBeNull();
      expect(activeCardBox!.x).toBeGreaterThanOrEqual(0);
      expect(activeCardBox!.x + activeCardBox!.width).toBeLessThanOrEqual(viewport!.width);
      expect(activeCardBox!.y).toBeGreaterThanOrEqual(0);
      expect(activeCardBox!.y + activeCardBox!.height).toBeLessThanOrEqual(viewport!.height);
      expect(activeResolveBox!.x).toBeGreaterThanOrEqual(0);
      expect(activeResolveBox!.x + activeResolveBox!.width).toBeLessThanOrEqual(viewport!.width);
      expect(activeResolveBox!.y).toBeGreaterThanOrEqual(0);
      expect(activeResolveBox!.y + activeResolveBox!.height).toBeLessThanOrEqual(viewport!.height);

      await ringBell(page, 2);

      const card = page.locator('.emergency-card').filter({ hasText: copy.sick });
      await expect(card).toHaveClass(/escalated/);
      await expect(page.locator('.log li').filter({ hasText: copy.escalation })).toHaveCount(1);
      const cardBox = await card.boundingBox();
      const resolve = card.getByRole('button', { name: copy.resolve });
      const resolveBox = await resolve.boundingBox();
      expect(cardBox).not.toBeNull();
      expect(resolveBox).not.toBeNull();
      expect(cardBox!.x).toBeGreaterThanOrEqual(0);
      expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(viewport!.width);
      expect(cardBox!.y).toBeGreaterThanOrEqual(0);
      expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(viewport!.height);
      expect(resolveBox!.x).toBeGreaterThanOrEqual(0);
      expect(resolveBox!.x + resolveBox!.width).toBeLessThanOrEqual(viewport!.width);
      expect(resolveBox!.y).toBeGreaterThanOrEqual(0);
      expect(resolveBox!.y + resolveBox!.height).toBeLessThanOrEqual(viewport!.height);

      await prepareScreenshot(page);
      await takeScreenshot(page, `narrow-phone-recovery-escalated-${language}.png`);
    }
  });
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

test('answers the morning post and applies the day’s constraints', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The morning-post flow uses the desktop steward’s desk.');
  await page.clock.install();
  await page.addInitScript(() => localStorage.setItem('pemberley-language', 'en'));
  await page.goto('/');
  await pauseTestClock(page);
  await page.getByRole('button', { name: 'Begin the day' }).evaluate(button => (button as HTMLButtonElement).click());

  const opener = page.getByRole('button', { name: /The morning post/ });
  await expect(opener).toContainText('0/3');
  await opener.evaluate(button => (button as HTMLButtonElement).click());

  const dialog = page.getByRole('dialog', { name: 'The morning post' });
  await expect(dialog).toBeVisible();
  const cards = dialog.locator('.letter-card');
  await expect(cards).toHaveCount(3);

  // Mr. Darcy: prioritise the music room.
  await cards.nth(0).getByRole('button', { name: 'See first to Miss Darcy’s music room' }).click();
  await expect(cards.nth(0).locator('.letter-note')).toContainText('Sarah is set to the music room');
  await expect(cards.nth(0).getByRole('button', { name: 'See first to the rooms the visitors pass' })).toBeDisabled();

  await cards.nth(1).getByRole('button', { name: 'Let it wait until the visitors have gone' }).click();
  await cards.nth(2).getByRole('button', { name: 'Comply. Send Mr. Adams to Rosings' }).click();

  await dialog.getByRole('button', { name: 'Begin the day’s work' }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toContainText('3/3');

  await expect(page.locator('.log li').filter({ hasText: 'Mr. Adams is sent to Rosings' })).toHaveCount(1);
  // The Darcy choice biased the music room upward past its initial 54%
  // and above the picture gallery, which received no letter bias.
  const musicValue = page.locator('.tour-room').filter({ hasText: 'The music room' }).locator('.mono');
  const galleryValue = page.locator('.tour-room').filter({ hasText: 'The picture gallery' }).locator('.mono');
  await expect(musicValue).toHaveText('68%');
  await expect(galleryValue).toHaveText('62%');
});

test('plays a pre-generated narration clip on beginning the day and ringing the bell', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The narration check uses the desktop task panel.');
  const voRequests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/vo/')) voRequests.push(url.split('/vo/')[1]);
  });
  await page.addInitScript(() => localStorage.setItem('pemberley-language', 'en'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin the day' }).click();
  await expect.poll(() => voRequests).toContain('en/day-start.mp3');

  await page.getByRole('button', { name: 'Open task panel' }).evaluate(button => (button as HTMLButtonElement).click());
  await page.locator('.bell-button').click();
  await expect.poll(() => voRequests).toContain('en/bell-rung.mp3');
});
