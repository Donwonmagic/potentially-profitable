/**
 * Lighthouse CI config — the 7-URL gate set the launch plan calls out.
 *
 * Mobile-first (config.preset = "lighthouse:default" with the mobile
 * form factor + Slow 4G + 4× CPU throttling). Block merge on any miss.
 *
 * Run locally:
 *   npx @lhci/cli@latest autorun --config=./lighthouserc.js
 *
 * In CI:
 *   - Spin up the Cloudflare Pages preview URL.
 *   - export LHCI_BUILD_BASE_URL="https://<preview>.pages.dev"
 *   - npx @lhci/cli@latest autorun --config=./lighthouserc.js
 *
 * The 9-URL set covers the load-bearing surfaces:
 *   /                                  — homepage (hero + library teaser)
 *   /window/                           — contact, JS-heavy
 *   /tools/                            — tools index (cards, mostly static)
 *   /tools/seo-grader/                 — a fetch-light tool result
 *   /tools/menu-design/                — flagship: largest tool surface, gated
 *                                         to catch the 350KB-on-load regression
 *                                         we're code-splitting away from
 *   /es/tools/menu-design/             — bilingual parity gate: ES-mirrored
 *                                         flagship must hit the same budget
 *   /library/                          — (post-IA migration) library hub; today /learn/
 *   /blog/why-your-restaurant-loses-reservations-every-night/
 *                                      — long-form article body shape
 *   /glossary/conversion-rate/         — short-form glossary term shape
 */

const BASE = process.env.LHCI_BUILD_BASE_URL || 'http://localhost:8788';

const PATHS = [
  '/',
  '/window/',
  '/tools/',
  '/tools/seo-grader/',
  '/tools/menu-design/',
  '/es/tools/menu-design/',
  '/learn/',
  '/blog/why-your-restaurant-loses-reservations-every-night/',
  '/glossary/conversion-rate/',
];

const url = PATHS.map((p) => BASE.replace(/\/+$/, '') + p);

module.exports = {
  ci: {
    collect: {
      url,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop' === process.env.LHCI_FORM_FACTOR ? 'desktop' : undefined,
        // Mobile form factor with Slow 4G + 4× CPU is the launch plan's
        // explicit gate scenario; that's the LHCI default for mobile.
        chromeFlags: '--no-sandbox',
      },
    },
    assert: {
      assertions: {
        // Performance gates from launch plan Part VII.
        'categories:performance':       ['error', { minScore: 0.90 }],
        'categories:accessibility':     ['error', { minScore: 0.95 }],
        'categories:best-practices':    ['error', { minScore: 0.95 }],
        'categories:seo':               ['error', { minScore: 1.00 }],

        // Per-metric gates: LCP ≤ 2.0s · CLS ≤ 0.05 · INP ≤ 200ms · TBT ≤ 200ms
        'largest-contentful-paint':     ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift':      ['error', { maxNumericValue: 0.05 }],
        'total-blocking-time':          ['error', { maxNumericValue: 200 }],
        // INP isn't a Lighthouse audit yet; CrUX field data on a separate
        // dashboard. Track interaction-to-next-paint via web-vitals client
        // beacon (see Sentry-lite plan in launch doc, Part VII).

        // First-load JS budget proxy. The launch plan caps total core JS
        // at 80 KB compressed; bootup-time on Slow 4G + 4× CPU is the
        // observable proxy that catches regressions.
        'bootup-time':                  ['error', { maxNumericValue: 1500 }],
        'mainthread-work-breakdown':    ['error', { maxNumericValue: 2500 }],

        // Hardening: no third-party blocks, no console errors, image
        // dimensions present (CLS protection).
        'errors-in-console':            'error',
        'image-aspect-ratio':           'error',
        'image-size-responsive':        'error',
        'unsized-images':               'error',
        'render-blocking-resources':    ['warn', { maxLength: 0 }],
      },
    },
    upload: {
      // Default to ephemeral storage so the dashboard is just GitHub
      // checks. Switch to LHCI server later if a persistent dashboard
      // becomes necessary.
      target: 'temporary-public-storage',
    },
  },
};
