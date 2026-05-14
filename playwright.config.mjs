// Phase 8 — Playwright snapshot config for the tool suite.
//
// Two test files today:
//
//   tests/scroll-bottom.spec.mjs — the original "bare code halfway
//     down the page" regression test. Loads every live tool, scrolls
//     to the bottom, and asserts: (1) no visible raw HTML angle
//     brackets bleeding through, (2) page height > 600px (rules out
//     "page failed to render"), (3) no uncaught console errors.
//     This is the gate that catches the Phase 0 failure mode if it
//     ever regresses.
//
//   tests/hub-baseline.spec.mjs — snapshot the tools hub at three
//     viewports. The hub is the most-trafficked page in the suite;
//     visual regressions here are the highest-leverage to catch
//     before they ship.
//
// Run locally:
//
//   npx playwright install chromium    # one-time, downloads browser
//   npm run test:playwright            # serves static + runs tests
//
// The config serves the static site via Python's http.server on
// port 8765 (no Node dep). PORT picked deliberately to avoid common
// dev-server collisions.

import { defineConfig, devices } from '@playwright/test';

const PORT = 8765;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Allow pointing at a pre-installed system Chromium when the
// version Playwright wants isn't downloadable (sandboxed CI, air-gapped
// dev VM). Most contributors won't need to set this — they'll just
// run `npx playwright install chromium`.
const CHROME_EXEC = process.env.MTN_CHROME_PATH || undefined;

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.mjs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        launchOptions: CHROME_EXEC ? { executablePath: CHROME_EXEC } : undefined,
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        launchOptions: CHROME_EXEC ? { executablePath: CHROME_EXEC } : undefined,
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        launchOptions: CHROME_EXEC ? { executablePath: CHROME_EXEC } : undefined,
      },
    },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
    cwd: '.',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
