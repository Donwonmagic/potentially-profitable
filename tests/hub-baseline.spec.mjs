// Phase 8 — visual snapshot for the tool hub.
//
// The hub is the most-trafficked page in the tool suite. Visual
// regressions here cascade into perception of the whole site, so
// catching them in CI is high-leverage.
//
// First run generates the baseline screenshots; subsequent runs
// compare. Run with --update-snapshots to refresh after intentional
// visual changes.
//
// 2026-07-31 — WHY THESE ASSERTIONS DERIVE FROM THE PAGE.
//
// Two of the three tests here spent weeks failing while asserting a site
// that no longer existed, and nothing said so, because this workflow is
// continue-on-error: the job went red and the run concluded success.
//
//   • "tier filter narrows the visible cards" hard-coded the `quick` tier.
//     The quick tier was removed with the tool roadmap on 2026-06-17. The
//     test had been red for six weeks.
//   • "renders the Start-here CTA" hard-coded the text /start here/i. That
//     CTA changed when /learn/start-here/ was frozen as a retired-line page
//     and the things promoting it were rewired to the funnel. The page was
//     right and the test was wrong — it was pinning the OLD positioning.
//
// A test that hard-codes today's taxonomy fails the day the taxonomy moves,
// and then it is indistinguishable from a real regression. So: read the
// tiers off the page and exercise whichever exist; assert the hero CTA is
// present and on-funnel rather than asserting one particular slogan. What
// is load-bearing is that the hub HAS a primary CTA and that its filter
// actually filters — not which words or which tiers.

import { test, expect } from '@playwright/test';

// Surfaces retired from the cost-intelligence funnel. The hero CTA must not
// lead back into any of them — that is the durable claim, and unlike a copy
// string it stays true when the copy is rewritten.
const RETIRED = [/^\/course\//, /^\/method\//, /^\/learn\/start-here\//];

test.describe('Tool hub baseline', () => {
  test('hub hero leads with a visible, on-funnel primary CTA', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    const cta = page.locator('.hero-ctas a.btn-primary').first();
    await expect(cta).toBeVisible();
    // A CTA with no label is a broken CTA even if it renders.
    await expect(cta).not.toHaveText(/^\s*$/);
    const href = await cta.getAttribute('href');
    expect(href, 'hero primary CTA has an href').toBeTruthy();
    for (const dead of RETIRED) {
      expect(href, `hero CTA must not point at a retired surface (${dead})`).not.toMatch(dead);
    }
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
    // Read the tiers the page actually offers rather than naming one. If the
    // taxonomy changes again this still exercises the real filter.
    const tiers = await page
      .locator('[data-tier-filter-btn]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('data-tier-filter-btn')).filter((t) => t && t !== 'all'));
    expect(tiers.length, 'hub offers at least one non-"all" tier filter').toBeGreaterThan(0);

    const allCount = await page.locator('.tool-card[data-tier]:visible').count();
    expect(allCount, 'hub renders tool cards').toBeGreaterThan(0);

    for (const tier of tiers) {
      await page.locator(`[data-tier-filter-btn="${tier}"]`).click();
      const shown = await page.locator(`.tool-card[data-tier="${tier}"]:visible`).count();
      const hidden = await page
        .locator(`.tool-card[data-tier]:not([data-tier="${tier}"])`)
        .evaluateAll((els) => els.filter((el) => getComputedStyle(el).display === 'none').length);
      expect(shown, `"${tier}" filter shows its own cards`).toBeGreaterThan(0);
      expect(hidden, `"${tier}" filter hides every other card`).toBe(allCount - shown);
    }
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
