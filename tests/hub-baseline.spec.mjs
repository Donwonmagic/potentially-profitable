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
  test('hub renders the Start-here CTA above the fold', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    const cta = page.locator('.hero-ctas a.btn-primary').first();
    await expect(cta).toBeVisible();
    await expect(cta).toContainText(/start here/i);
  });

  test('tier filter strip appears when JS runs', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    const strip = page.locator('[data-tier-filter]');
    await expect(strip).toHaveAttribute('data-tier-filter-ready', '');
    // Strip is display:flex once ready.
    await expect(strip).toBeVisible();
  });

  test('tier filter narrows the visible cards', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    // Count visible cards in default state.
    const allCount = await page.locator('.tool-card[data-tier]:visible').count();
    // Click "Quick" filter.
    await page.locator('[data-tier-filter-btn="quick"]').click();
    const quickCount = await page.locator('.tool-card[data-tier="quick"]:visible').count();
    const hiddenCount = await page.locator('.tool-card[data-tier]:not([data-tier="quick"])').evaluateAll(
      (els) => els.filter((el) => getComputedStyle(el).display === 'none').length
    );
    expect(quickCount).toBeGreaterThan(0);
    expect(hiddenCount).toBe(allCount - quickCount);
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
