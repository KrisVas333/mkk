import { defineConfig, devices } from '@playwright/test';

/* MKK e2e — runs against the real static app served by bin/serve.py (the same
   server used for manual QA, so byte-range audio + utf-8 LT text behave alike). */
const PORT = process.env.MKK_PORT || 8765;

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,          // one localStorage origin, keep runs deterministic
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Pixel 7'],       // mobile-first: the app is a phone app
    locale: 'lt-LT',
    timezoneId: 'Europe/Vilnius',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `python3 bin/serve.py ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
