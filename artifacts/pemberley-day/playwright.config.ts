import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5173/',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'PORT=5173 BASE_PATH=/ pnpm run dev',
    url: 'http://127.0.0.1:5173/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
    // Firefox runs the fresh-day clock-reset checks separately. Those tests
    // install the clock before navigation, then pause it after the app loads;
    // keeping that order avoids browser-specific real-time timer drift.
    {
      name: 'firefox-fresh-day',
      grep: /resets timed household events for a fresh (English|Japanese) day/,
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});