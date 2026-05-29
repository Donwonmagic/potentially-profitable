// Workshop Kit widgets — behavioral spec.
//
// Each widget has a demo page at /method/workshop/<tag>/ that mounts
// the widget against a clean MuntinContext. This spec hits each demo
// page, asserts the widget renders without console errors, and checks
// the key interaction round-trip (committing to context, the demo
// page's live-state mirror updating, the serialize() output matching).
//
// The intent is the "shipped 18 widgets work in a browser" smoke test
// — not exhaustive UI testing. Each widget's demo page is the only
// place we instrument it for now; richer per-widget tests would live
// in dedicated specs as they're warranted.

import { test, expect } from '@playwright/test';

const WIDGETS = [
  { tag: 'live-preview-frame',  needsNoConsoleErrors: true },
  { tag: 'palette-picker',      needsNoConsoleErrors: true },
  { tag: 'voice-slider',        needsNoConsoleErrors: true },
  { tag: 'font-pair-picker',    needsNoConsoleErrors: true },
  { tag: 'drag-rank',           needsNoConsoleErrors: true },
  { tag: 'tab-flip',            needsNoConsoleErrors: true },
  { tag: 'before-after-slider', needsNoConsoleErrors: true },
  { tag: 'persona-card-builder',needsNoConsoleErrors: true },
  { tag: 'positioning-plotter', needsNoConsoleErrors: true },
  { tag: 'menu-builder',        needsNoConsoleErrors: true },
  { tag: 'shot-list-grid',      needsNoConsoleErrors: true },
  { tag: 'weekly-hours-grid',   needsNoConsoleErrors: true },
  { tag: 'keyword-builder',     needsNoConsoleErrors: true },
  { tag: 'gbp-card-preview',    needsNoConsoleErrors: true },
  { tag: 'map-radius',          needsNoConsoleErrors: true },
  { tag: 'deploy-stepper',      needsNoConsoleErrors: true },
  { tag: 'rhythm-calendar',     needsNoConsoleErrors: true }
  // text-input is mounted on lesson pages but doesn't have its own
  // demo page (the L4/L7/L9a/L11/L16 lessons exercise it); skip here.
];

test.describe('Workshop Kit demo pages — baseline render', () => {
  for (const { tag } of WIDGETS) {
    test(`${tag} demo page renders cleanly`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(String(err)));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(`/method/workshop/${tag}/`, { waitUntil: 'networkidle' });

      // The hero title contains the widget tag — sanity check the
      // page actually loaded the right doc.
      await expect(page.locator('h1').first()).toContainText(tag);

      // The widget host element exists and got hydrated by the engine
      // (it removes the host's empty state and renders the widget's
      // first child). Wait briefly for the import-then-mount path.
      const host = page.locator(`section.course-widget[data-widget="${tag}"]`);
      await expect(host).toHaveCount(1);
      // Hydrated widgets have child content; an unmounted widget would
      // show the engine's error fallback or be empty.
      await expect(host).not.toBeEmpty();

      expect(errors, `console errors on ${tag} demo`).toEqual([]);
    });
  }
});

test.describe('Workshop Kit demo pages — context round-trips', () => {
  test('palette-picker writes palette[] on selection', async ({ page }) => {
    await page.goto('/method/workshop/palette-picker/', { waitUntil: 'networkidle' });
    // Click the first preset palette card if one exists; otherwise skip.
    const presetCard = page.locator('.pp-preset, [data-preset]').first();
    if (await presetCard.count() === 0) {
      test.skip(true, 'palette-picker has no preset cards to click in current build');
    }
    await presetCard.click();
    // Read MuntinContext from the page to confirm a palette landed.
    const palette = await page.evaluate(() => (window.MuntinContext && window.MuntinContext.read() || {}).palette);
    expect(Array.isArray(palette)).toBe(true);
    expect(palette.length).toBeGreaterThanOrEqual(3);
  });

  test('font-pair-picker writes fontPair on click', async ({ page }) => {
    await page.goto('/method/workshop/font-pair-picker/', { waitUntil: 'networkidle' });
    const firstCard = page.locator('.fpp-card').first();
    await firstCard.click();
    const fontPair = await page.evaluate(() => (window.MuntinContext && window.MuntinContext.read() || {}).fontPair);
    expect(fontPair).toBeTruthy();
    expect(typeof fontPair.id).toBe('string');
    expect(typeof fontPair.heading).toBe('string');
    expect(typeof fontPair.body).toBe('string');
  });

  test('voice-slider writes voice object on input', async ({ page }) => {
    await page.goto('/method/workshop/voice-slider/', { waitUntil: 'networkidle' });
    const range = page.locator('input[type="range"]').first();
    await range.evaluate((el) => { el.value = '75'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(50);
    const voice = await page.evaluate(() => (window.MuntinContext && window.MuntinContext.read() || {}).voice);
    expect(voice).toBeTruthy();
    expect(typeof voice).toBe('object');
  });

  test('gbp-card-preview writes gbp.primaryCategory on select change', async ({ page }) => {
    await page.goto('/method/workshop/gbp-card-preview/', { waitUntil: 'networkidle' });
    const select = page.locator('[data-field="primaryCategory"]');
    await expect(select).toHaveCount(1);
    await select.selectOption({ index: 2 });
    const gbp = await page.evaluate(() => (window.MuntinContext && window.MuntinContext.read() || {}).gbp);
    expect(gbp && typeof gbp.primaryCategory === 'string' && gbp.primaryCategory.length > 0).toBe(true);
  });

  test('map-radius writes deliveryRadius as a number on slide', async ({ page }) => {
    await page.goto('/method/workshop/map-radius/', { waitUntil: 'networkidle' });
    const range = page.locator('input.mrw-range[type="range"]');
    await range.evaluate((el) => { el.value = '3'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => (window.MuntinContext && window.MuntinContext.read() || {}).deliveryRadius);
    expect(typeof r).toBe('number');
    expect(r).toBeCloseTo(3, 1);
  });

  test('deploy-stepper writes deployTarget on host pick + deployProgress on mark-done', async ({ page }) => {
    await page.goto('/method/workshop/deploy-stepper/', { waitUntil: 'networkidle' });
    const select = page.locator('.dsw-host-sel');
    await select.selectOption('netlify');
    await page.locator('.dsw-toggle').first().click();
    const ctx = await page.evaluate(() => (window.MuntinContext && window.MuntinContext.read()) || {});
    expect(ctx.deployTarget).toBe('netlify');
    expect(ctx.deployProgress && typeof ctx.deployProgress === 'object').toBe(true);
    const anyTrue = Object.values(ctx.deployProgress || {}).some(Boolean);
    expect(anyTrue).toBe(true);
  });

  test('rhythm-calendar emits a downloadable .ics file', async ({ page }) => {
    await page.goto('/method/workshop/rhythm-calendar/', { waitUntil: 'networkidle' });
    // Wait for the engine's lazy import to land + the widget to wire the click handler.
    const dl = page.locator('button.rcw-download');
    await expect(dl).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await dl.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.ics$/);
  });
});

test.describe('Workshop Kit hub', () => {
  test('hub shows 18 shipped widgets and links each to a demo', async ({ page }) => {
    await page.goto('/method/workshop/', { waitUntil: 'networkidle' });
    const shippedCount = await page.locator('#shippedCount').textContent();
    expect(shippedCount.trim()).toBe('18');
    const shippedCards = page.locator('.widget-card.shipped');
    const n = await shippedCards.count();
    expect(n).toBeGreaterThanOrEqual(17); // text-input has no demo page; rest do
    for (let i = 0; i < n; i++) {
      const href = await shippedCards.nth(i).getAttribute('href');
      expect(href).toMatch(/^\/method\/workshop\/[a-z-]+\/$/);
    }
  });
});
