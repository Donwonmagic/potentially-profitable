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
  // has moved on, so the test failed on a hub that renders perfectly — it was
  // pinning marketing copy, not behaviour. Copy is the founder's to retune
  // without breaking CI.
  //
  // Measured on the live hub at the 1280x800 desktop viewport: exactly one
  // primary CTA sits above the fold — "Browse the tools", whose href is the
  // IN-PAGE ANCHOR #operations-margin, at top 763. The hub jumps you into the
  // catalog rather than off-page, so requiring a path-shaped href would fail
  // on a hub that works correctly.
  //
  // Assert the property, not the copy: SOME primary CTA is rendered, labelled,
  // linked, and reachable without scrolling.
  test('hub renders a primary CTA above the fold', async ({ page }) => {
    await page.goto('/tools/', { waitUntil: 'networkidle' });

    const ctas = page.locator('a.btn-primary');
    await expect(ctas.first()).toBeVisible();

    const viewportHeight = page.viewportSize().height;
    const aboveFold = await ctas.evaluateAll(
      (els, vh) =>
        els
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              top: r.top,
              h: r.height,
              text: (el.textContent || '').trim(),
              href: el.getAttribute('href') || '',
            };
          })
          .filter((c) => c.h > 0 && c.top >= 0 && c.top < vh),
      viewportHeight,
    );

    expect(aboveFold.length, 'no primary CTA renders above the fold').toBeGreaterThan(0);
    // An empty or placeholder hero CTA is the regression this guards — a stale,
    // blank hero reached production once. A real destination is either a site
    // path (/sheets/) or an in-page jump (#operations-margin); what is NOT
    // acceptable is an empty label, a missing href, or a bare "#".
    expect(
      aboveFold.some((c) => c.text.length > 0 && /^[/#][a-z]/i.test(c.href)),
      `above-the-fold CTA has no label or no real destination: ${JSON.stringify(aboveFold)}`,
    ).toBe(true);
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
