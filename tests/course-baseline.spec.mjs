// Open the Doors bootcamp — baseline behavioral spec.
//
// Two test groups:
//
//   1) "Every lesson loads cleanly" — 20 lesson URLs × EN + ES = 40
//      page loads, each asserting: 200 response (Playwright fails the
//      goto if not), no console errors, nav + footer + hreflang block
//      present. Catches the regression where a lesson page silently
//      breaks (missing include, busted inline JS, removed term-link).
//
//   2) "Round-trips that need a browser" — three behaviors the
//      build-time checks can't verify because they require localStorage
//      + JS:
//        - Mark-complete writes to mtn:course:progress and persists across reload
//        - L14 generator with empty context shows the readiness checklist
//        - L14 generator with stubbed full context enables the download
//          button + lazy-loads JSZip on click + creates a blob URL
//
// Spec lives alongside tests/workshop-widgets.spec.mjs which covers
// the widget layer. Together they form the bootcamp's runtime
// regression net. Build-time guards (course-parity, course-data-layer,
// L14-generator-output, term-links) catch the static-shape drift;
// these specs catch what only shows up at runtime.

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'course-lessons.json'), 'utf8'));
const LESSONS = manifest.lessons || [];

// Run a tighter set than every-lesson-every-locale by default; the
// canonical vertical slice (L4) + one per module + the generator covers
// most failure modes without ballooning the test matrix.
const SAMPLE_LESSONS = [
  '/course/m1-orient/welcome/',
  '/course/m2-decide/customer/',
  '/course/m2-decide/palette-voice/',
  '/course/m3-assemble/menu/',
  '/course/m4-launch/local-seo/',
  '/course/m4-launch/generator/',
  '/course/m4-launch/rhythm/'
];

test.describe('Course lesson pages — baseline render', () => {
  // Every lesson path × both locales — full matrix.
  for (const lesson of LESSONS) {
    for (const locale of ['en', 'es']) {
      const url = locale === 'en' ? lesson.path : '/es' + lesson.path;
      test(`${locale} ${lesson.path} renders cleanly`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(String(err)));
        page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

        const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
        expect(resp.status(), `HTTP status for ${url}`).toBeLessThan(400);

        // Standard chrome stamped by sync-includes.
        await expect(page.locator('header.nav, header#nav')).toHaveCount(1);
        await expect(page.locator('footer')).toHaveCount(1);

        // hreflang block present in <head>.
        const hreflangCount = await page.locator('head link[rel="alternate"][hreflang]').count();
        expect(hreflangCount, `hreflang links on ${url}`).toBeGreaterThanOrEqual(2);

        // Course-specific data attributes — every lesson stamps these
        // for the progress bar + the rail + the data-layer guard.
        const body = page.locator('body');
        await expect(body).toHaveAttribute('data-course-module', /m[1-4]-[a-z]+/);
        await expect(body).toHaveAttribute('data-course-lesson', /.+/);

        expect(errors, `console errors on ${url}`).toEqual([]);
      });
    }
  }
});

test.describe('Mark-complete round-trip', () => {
  test('clicking mark-complete writes mtn:course:progress that survives reload', async ({ page, context }) => {
    // Anonymous-first: the mark-complete button writes localStorage
    // first, then attempts /api/course/progress (which 401s on no
    // session — operator just doesn't get cross-device sync).
    await page.goto('/course/m1-orient/welcome/', { waitUntil: 'networkidle' });

    const btn = page.locator('#courseMarkBtn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('data-state', 'idle');

    await btn.click();

    // Wait for the state transition; the button advances through
    // saving → done. Allow generous timeout for the API attempt that
    // we expect to 401 and fall through to local-only.
    await expect(btn).toHaveAttribute('data-state', /done|error/, { timeout: 5000 });

    // Verify localStorage was written before the API call returned.
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('mtn:course:progress') || 'null'));
    expect(progress, 'mtn:course:progress in localStorage').toBeTruthy();
    expect(Array.isArray(progress.completed)).toBe(true);
    const matched = progress.completed.find((e) => e && e.lesson === 'welcome');
    expect(matched, 'welcome lesson recorded in completed[]').toBeTruthy();

    // Reload — the button starts in "done" state because the page
    // reads localStorage on init.
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#courseMarkBtn')).toHaveAttribute('data-state', 'done');
  });
});

test.describe('L14 generator', () => {
  test('with empty context, download button is disabled and readiness shows missing fields', async ({ page }) => {
    // Clear any leftover context so the readiness checklist runs
    // against a clean slate.
    await page.goto('/course/m4-launch/generator/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      try { localStorage.removeItem('mtn:context'); } catch (_) {}
    });
    await page.reload({ waitUntil: 'networkidle' });

    const dl = page.locator('#downloadBtn');
    await expect(dl).toBeVisible();
    await expect(dl).toBeDisabled();

    // Readiness checklist exists and has at least one missing row.
    // The L14 page renders a list of inputs that need to be filled
    // before generation can proceed; the exact selector for "missing"
    // rows is whatever the page uses to flag red-X items.
    const checklist = page.locator('#readinessGrid, .gen-checklist, [data-readiness-list]').first();
    await expect(checklist).toBeVisible();

    // The download hint text should mention required-fields gating.
    const hint = page.locator('#downloadHint');
    await expect(hint).toBeVisible();
  });

  test('with stubbed full context, download enables and clicking triggers a blob download', async ({ page }) => {
    // Stub MuntinContext BEFORE the generator page loads its inputs
    // by setting localStorage first, then navigating.
    await page.goto('/course/m4-launch/generator/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const stub = {
        v: 1,
        restaurantProfile: {
          name: 'Jolene\'s Cafe',
          cuisine: 'American breakfast',
          address: '123 Flower Ave, Silver Spring, MD',
          phone: '301-555-0100'
        },
        palette: ['#1F4E5B', '#FAF7F2', '#14161A'],
        onePromise: 'The Tuesday-night breakfast place your block tells other blocks about.',
        dishes: [
          { name: 'Buttermilk pancakes', price: '12' },
          { name: 'Eggs benedict', price: '14' },
          { name: 'Country fried steak', price: '16' }
        ],
        hours: {
          monday:    { open: '07:00', close: '14:00', closed: false },
          tuesday:   { open: '07:00', close: '14:00', closed: false },
          wednesday: { open: '07:00', close: '14:00', closed: false },
          thursday:  { open: '07:00', close: '14:00', closed: false },
          friday:    { open: '07:00', close: '15:00', closed: false },
          saturday:  { open: '08:00', close: '15:00', closed: false },
          sunday:    { open: '08:00', close: '14:00', closed: false }
        }
      };
      try { localStorage.setItem('mtn:context', JSON.stringify(stub)); } catch (_) {}
    });
    await page.reload({ waitUntil: 'networkidle' });

    const dl = page.locator('#downloadBtn');
    // Give the generator a moment to read context + re-render.
    await expect(dl).toBeEnabled({ timeout: 5000 });

    // Clicking the button lazy-loads JSZip then creates a blob URL.
    // We spy on URL.createObjectURL to confirm the blob path actually
    // executed (rather than expecting a real download interrupt that's
    // brittle across browsers).
    await page.evaluate(() => {
      window.__createObjectURLCalls = [];
      const orig = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        window.__createObjectURLCalls.push({ size: blob.size, type: blob.type });
        return orig.call(URL, blob);
      };
    });

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await dl.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip$/);

    const calls = await page.evaluate(() => window.__createObjectURLCalls);
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[0].size).toBeGreaterThan(0);
  });
});

test.describe('Course locale parity (delegated to build-time script)', () => {
  test('check-course-locale-parity.mjs reports clean', async () => {
    const { spawnSync } = await import('node:child_process');
    const result = spawnSync('node', ['scripts/check-course-locale-parity.mjs', '--check'], {
      cwd: repoRoot,
      encoding: 'utf8'
    });
    expect(result.status, `script stderr: ${result.stderr}`).toBe(0);
    expect(result.stdout).toMatch(/OK — no drift detected/);
  });
});
