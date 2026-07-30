// Phase 8 — visual snapshot for the tool hub.
//
// The hub is the most-trafficked page in the tool suite. Visual
// regressions here cascade into perception of the whole site, so
// catching them in CI is high-leverage.
//
// First run generates the baseline screenshots; subsequent runs
// compare. Run with --update-snapshots to refresh after intentional
// visual changes.

import { test, expect } from '@playwright/test';

test.describe('Tool hub baseline', () => {
  // 2026-07-30: this asserted the CTA copy read /start here/i. The hub's lede
  // has since moved to "Browse the sheets", so the test failed on a hub that
  // renders perfectly — it was pinning marketing copy, not behaviour. What is
  // actually load-bearing is that a primary CTA renders, is visible, and sits
  // above the fold with a real destination. Copy is the founder's to retune
  // without breaking CI.
  test('hub renders a primary CTA above the fold', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    const cta = page.locator('.hero-ctas a.btn-primary').first();
    await expect(cta).toBeVisible();
    // Non-empty label and a real href — an empty or placeholder hero is the
    // regression this guards (a stale/blank hero reached production once).
    await expect(cta).not.toHaveText(/^\s*$/);
    await expect(cta).toHaveAttribute('href', /^\/[a-z]/);
    const box = await cta.boundingBox();
    const viewportHeight = page.viewportSize().height;
    expect(box, 'primary CTA has no layout box').not.toBeNull();
    expect(box.y, 'primary CTA is not above the fold').toBeLessThan(viewportHeight);
  });

  test('tier filter strip appears when JS runs', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    const strip = page.locator('[data-tier-filter]');
    await expect(strip).toHaveAttribute('data-tier-filter-ready', '');
    // Strip is display:flex once ready.
    await expect(strip).toBeVisible();
  });

  // 2026-07-30: this drove the "quick" tier, whose every tool was retired in
  // the 2026-06-26 off-funnel cut — the hub now ships only `standard` and
  // `deep` cards plus an `all` button, so the click targeted a button that no
  // longer exists. The FILTER itself works; the test named a dead tier.
  // Driving a tier discovered from the live DOM keeps the assertion honest as
  // the catalog changes, instead of hard-coding another slug that can retire.
  test('tier filter narrows the visible cards', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    // Pick a tier that actually has cards on the page right now.
    const tier = await page.locator('.tool-card[data-tier]').first().getAttribute('data-tier');
    expect(tier, 'hub renders no tiered tool cards at all').toBeTruthy();

    const allCount = await page.locator('.tool-card[data-tier]:visible').count();
    await page.locator(`[data-tier-filter-btn="${tier}"]`).click();

    const shownCount = await page.locator(`.tool-card[data-tier="${tier}"]:visible`).count();
    const hiddenCount = await page.locator(`.tool-card[data-tier]:not([data-tier="${tier}"])`).evaluateAll(
      (els) => els.filter((el) => getComputedStyle(el).display === 'none').length
    );
    expect(shownCount, `filtering to "${tier}" showed no cards`).toBeGreaterThan(0);
    expect(hiddenCount, `filtering to "${tier}" did not hide the other tiers`).toBe(allCount - shownCount);
  });

  test('hub visual snapshot — desktop', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    // Mask the .ctx-pill because its content depends on localStorage
    // history; the rest of the layout should be stable.
    await expect(page).toHaveScreenshot('hub-desktop.png', {
      fullPage: false,
      mask: [page.locator('.ctx-pill')],
      maxDiffPixelRatio: 0.02,
    });
  });
});
