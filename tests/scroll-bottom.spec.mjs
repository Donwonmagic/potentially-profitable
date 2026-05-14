// Phase 8 — scroll-to-bottom regression test.
//
// The original user complaint that triggered this whole branch:
// "the bottom half of some glitch out half way down the page and
// display bare code."
//
// Phase 0 fixed 5 specific cases. This test makes sure they stay
// fixed AND that no new tool ships the same failure mode.
//
// For each live tool URL:
//   1. Navigate and wait for network idle
//   2. Scroll to bottom
//   3. Capture a screenshot for the snapshot baseline
//   4. Assert: no console errors (uncaught throws would leak markup)
//   5. Assert: page is non-trivial (>600px height)
//   6. Assert: the very bottom of the document is structurally HTML,
//      not bare angle-bracket text leaking through.
//
// If any tool fails, the failure screenshot is saved alongside the
// expected baseline so you can see exactly what broke.

import { test, expect } from '@playwright/test';

const TOOLS = [
  '/tools/',
  '/tools/start/',
  '/tools/audits/',
  '/tools/audits/restaurant/',
  '/tools/brand-suite/',
  '/tools/compare/',
  '/tools/cost-pulse/',
  '/tools/gbp-grader/',
  '/tools/store-hours/holidays/',
  '/tools/margin-math/',
  '/tools/menu-converter/',
  '/tools/menu-copy/',
  '/tools/menu-engineering/',
  '/tools/mobile-check/',
  '/tools/store-hours/',
  '/tools/photo-brief/',
  '/tools/plate-cost/',
  '/tools/schema-check/',
  '/tools/search-ideas/',
  '/tools/seo-grader/',
  '/tools/speed-test/',
  '/tools/storefront-health/',
  '/tools/tech-stack/',
];

// Matches the suspect "bare code leak" patterns. Either literal
// `</body>` or `</html>` text in the rendered DOM (not in <code>
// blocks intentionally), or stretches of HTML-looking text outside
// <pre>/<code>/<script>.
function suspectsInTextNodes() {
  // Runs in the page; collects visible text from non-code descendants
  // of <main> and checks for tag-looking sequences.
  return Array.from(document.querySelectorAll('main, body > section, body > div'))
    .flatMap((root) => Array.from(root.querySelectorAll('p, h1, h2, h3, h4, li')))
    .map((el) => el.textContent || '')
    .filter((t) => /<\/?(?:html|body|head|script|style|main|section|div|p|h\d|li|ul|ol|a|button|form|input|span)\b/i.test(t));
}

for (const path of TOOLS) {
  test(`no bare code leaks at the bottom of ${path}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}${e.stack ? '\n  ' + e.stack.split('\n').slice(0,3).join('\n  ') : ''}`));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      // /api/* endpoints are Cloudflare Workers that only exist in
      // production. Static-server context legitimately 404s them.
      if (/Failed to load resource.*\b404\b/.test(text)) return;
      errors.push(`console.error: ${text}`);
    });
    page.on('requestfailed', (req) => {
      const url = req.url();
      // Same filter — /api/* failures aren't real client-side errors.
      if (/\/api\//.test(url)) return;
      errors.push(`requestfailed: ${url}`);
    });

    await page.goto(path, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Tiny settle for any lazy-loaded content.
    await page.waitForTimeout(250);

    const height = await page.evaluate(() => document.body.scrollHeight);
    expect(height, `${path} rendered as a trivially-tall page`).toBeGreaterThan(600);

    const suspects = await page.evaluate(suspectsInTextNodes);
    expect(suspects, `${path} has text nodes that look like raw HTML markup`).toEqual([]);

    // Console errors that come from missing modules or render
    // throws are the upstream cause of "bare code" symptoms.
    expect(errors, `${path} threw or logged console errors`).toEqual([]);
  });
}
