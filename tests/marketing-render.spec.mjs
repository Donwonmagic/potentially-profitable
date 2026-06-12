// Marketing & identity-page render gate.
//
// Why this exists (2026-06-11): the services sunset + company
// repositioning rewrote the homepage, the /studio/ company page,
// /start/, /about/, /receipts/, /methods/, and the cost-index hub —
// the highest-traffic NON-tool pages — and a stale hero + a
// /studio/ redirect loop both reached production because nothing
// rendered these pages in CI. The tool suite has scroll-bottom.spec;
// the chrome/marketing surfaces had no equivalent. This is it.
//
// For each key page, EN and ES:
//   1. Navigate, wait for network idle, scroll to the bottom.
//   2. Assert a non-trivial height (rules out "failed to render").
//   3. Assert no raw-HTML text leaking through (the Phase-0 symptom).
//   4. Assert no console errors / page throws (the upstream cause).
//   5. Assert the <h1> is present and non-empty (the lede actually
//      rendered — catches a broken/empty hero like the one shipped).
//   6. Assert NO retired services-era copy survives in the rendered
//      DOM (the exact regression the brand fix corrected: "pay for
//      themselves", "one-person studio", "$499 audit", booking CTAs).
//
// Mirrors tests/scroll-bottom.spec.mjs's idiom. Runs in the existing
// Playwright CI workflow (continue-on-error today; promote once the
// baseline settles).

import { test, expect } from '@playwright/test';

// The load-bearing non-tool pages, both locales. Same-slug ES mirrors
// for chrome pages; the company page and cost-index hub included
// because they were rewritten wholesale in Phase 9.
const PAGES = [
  '/',
  '/es/',
  '/studio/',
  '/es/studio/',
  '/start/',
  '/es/start/',
  '/about/',
  '/es/about/',
  '/receipts/',
  '/es/receipts/',
  '/methods/',
  '/es/methods/',
  '/never/',
  '/es/never/',
  '/cost-index/',
  '/es/cost-index/',
  '/library/',
  '/es/library/',
  '/blog/',
  '/es/blog/',
];

// Retired services-era vocabulary that must not survive in rendered
// copy after the company repositioning. Case-insensitive substring
// match against visible text. Kept deliberately specific so a
// legitimate word ("studio" as a font example, say) doesn't trip it —
// these are whole retired phrases, EN + es-MX.
const RETIRED_COPY = [
  'pay for themselves',
  'se pagan solos',
  'one-person studio',
  'one-person web studio',
  'estudio de una persona',
  'in one season',
  'en una temporada',
  'paying clients',
  'clientes que pagan',
  '$499 audit',
  'auditoría de $499',
  '$1,500 menu drop-in',
  'book a 20-min call',
  'reservar una llamada de 20 min',
];

// Same suspect-markup detector as scroll-bottom.spec.mjs.
function suspectsInTextNodes() {
  return Array.from(document.querySelectorAll('main, body > section, body > div'))
    .flatMap((root) => Array.from(root.querySelectorAll('p, h1, h2, h3, h4, li')))
    .map((el) => el.textContent || '')
    .filter((t) => /<\/?(?:html|body|head|script|style|main|section|div|p|h\d|li|ul|ol|a|button|form|input|span)\b/i.test(t));
}

for (const path of PAGES) {
  test(`marketing render: ${path}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      // /api/* endpoints are production-only Workers; static-server 404s are expected.
      if (/Failed to load resource.*\b404\b/.test(text)) return;
      errors.push(`console.error: ${text}`);
    });
    page.on('requestfailed', (req) => {
      if (/\/api\//.test(req.url())) return;
      errors.push(`requestfailed: ${req.url()}`);
    });

    await page.goto(path, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);

    const height = await page.evaluate(() => document.body.scrollHeight);
    expect(height, `${path} rendered as a trivially-tall page`).toBeGreaterThan(600);

    const h1 = (await page.evaluate(() => {
      const el = document.querySelector('main h1, h1');
      return el ? (el.textContent || '').trim() : '';
    }));
    expect(h1.length, `${path} has no visible <h1> (hero did not render)`).toBeGreaterThan(0);

    const suspects = await page.evaluate(suspectsInTextNodes);
    expect(suspects, `${path} has text nodes that look like raw HTML markup`).toEqual([]);

    const bodyText = (await page.evaluate(() => document.body.innerText || '')).toLowerCase();
    const survived = RETIRED_COPY.filter((phrase) => bodyText.includes(phrase.toLowerCase()));
    expect(survived, `${path} still shows retired services-era copy`).toEqual([]);

    expect(errors, `${path} threw or logged console errors`).toEqual([]);
  });
}
