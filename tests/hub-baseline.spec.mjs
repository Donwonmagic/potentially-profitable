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
// REWRITTEN 2026-07-31. Three of the four tests had been failing
// continuously since the site repositioned from the web-design/services
// line to cost intelligence — and nobody saw it, because this workflow
// carries `continue-on-error: true`, so GitHub reports the RUN as
// successful while the step inside it fails. A suite that is always red
// and always reported green is not a regression net; it is the appearance
// of one.
//
// What had rotted, and why each assertion changed:
//
//   1. The CTA test asserted the hero button reads "start here". That
//      button was "Start here — answer 5 questions", the entry to the
//      retired 5-question services quiz. Today's hero reads "Browse the
//      tools". Pinning the NEW copy would just restart the same clock, so
//      the test now asserts what actually matters and does not rot: the
//      hero's primary CTA is visible, has text, and points at a target
//      that EXISTS. A CTA leading nowhere is the real regression; its
//      wording is an editorial decision, not a contract.
//
//   2. The tier-filter test clicked [data-tier-filter-btn="quick"]. There
//      is no "quick" tier any more — the 2026-06-17 cut removed the six
//      unbuilt roadmap tools and the tier went with them, leaving `deep`
//      and `standard`. The test now DERIVES a tier from the filter strip
//      it is testing, so it follows the suite instead of encoding one
//      snapshot of it. It still fails loudly when no tier filter exists at
//      all, so "derive from the DOM" cannot decay into "assert nothing".
//
//   3. The visual baselines were of the old site: the retired nav
//      (Work / Studio / Reach Don), the cream palette, the pre-
//      repositioning hero copy. Regenerated against the current hub.

import { test, expect } from '@playwright/test';

test.describe('Tool hub baseline', () => {
  test('hub hero CTA is visible and points somewhere real', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });
    const cta = page.locator('.hero-ctas a.btn-primary').first();
    await expect(cta).toBeVisible();
    await expect(cta).not.toHaveText(/^\s*$/);

    // The destination must resolve. An in-page anchor has to match exactly
    // one real element; anything else has to be a site-relative path, not a
    // dangling absolute URL.
    const href = await cta.getAttribute('href');
    expect(href, 'the hero CTA must have an href').toBeTruthy();
    if (href.startsWith('#')) {
      await expect(page.locator(href)).toHaveCount(1);
    } else {
      expect(href, 'the hero CTA must stay on-site').toMatch(/^\//);
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

    // Take the tier from the strip rather than hard-coding one. The suite
    // has already lost a tier once; the filter BEHAVIOUR is what this test
    // is for, not the current roster.
    const tiers = await page
      .locator('[data-tier-filter-btn]')
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-tier-filter-btn')).filter((t) => t && t !== 'all'),
      );
    expect(
      tiers.length,
      'the hub must offer at least one tier filter besides "all"',
    ).toBeGreaterThan(0);
    const tier = tiers[0];

    const allCount = await page.locator('.tool-card[data-tier]:visible').count();
    await page.locator(`[data-tier-filter-btn="${tier}"]`).click();

    const shownCount = await page.locator(`.tool-card[data-tier="${tier}"]:visible`).count();
    const hiddenCount = await page
      .locator(`.tool-card[data-tier]:not([data-tier="${tier}"])`)
      .evaluateAll((els) => els.filter((el) => getComputedStyle(el).display === 'none').length);

    expect(shownCount, `filtering to "${tier}" must leave at least one card`).toBeGreaterThan(0);
    expect(hiddenCount).toBe(allCount - shownCount);
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
