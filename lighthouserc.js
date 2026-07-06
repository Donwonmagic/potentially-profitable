/**
 * Lighthouse CI config — the URL gate set the launch plan calls out.
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
 * The URL set covers the load-bearing surfaces:
 *   /                                  — homepage (hero + library teaser)
 *   /window/                           — contact, JS-heavy
 *   /tools/                            — tools index (cards, mostly static)
 *   /tools/seo-grader/                 — a fetch-light tool result
 *   /tools/storefront-health/          — flagship: storefront scorecard tool,
 *                                         gated as the largest live surface
 *   /es/tools/storefront-health/       — bilingual parity gate
 *   /learn/                            — library hub (post-IA migration target)
 *   /blog/<flagship article>           — long-form article body shape
 *   /glossary/conversion-rate/         — short-form glossary term shape
 *   /sheets/ + pilot sheet + ES sheets — Operator Sheets gate
 *   /course/ + L4 + generator + ES     — Open the Doors bootcamp gate
 *   /method/ + Workshop Kit hub        — brand pages pointing operators
 *                                         at the bootcamp
 */

const BASE = process.env.LHCI_BUILD_BASE_URL || 'http://localhost:8788';

const PATHS = [
  '/',
  '/window/',
  '/tools/',
  // 2026-07-06: seo-grader and storefront-health were retired with the
  // off-funnel tool cut (44d64cc74); auditing them 404-crashed the whole
  // lhci run. Swapped for living funnel equivalents at the same gate
  // positions — a fetch-light tool page, and the flagship largest live
  // surface (the Cost Index hub) with its ES parity twin.
  '/tools/margin-math/',
  '/cost-index/',
  '/es/cost-index/',
  '/learn/',
  // Phase 7: the long-form article gate previously pointed at the EN
  // /blog/why-your-restaurant-loses-reservations-every-night/ slug.
  // Wave 5 merged that post (plus 2 secondaries) into the consolidated
  // /library/reservation-conversion-guide/. The new URL is the right
  // shape for the gate — same long-form body, now with the folded
  // 5-moves + Find-a-Table sections.
  '/library/reservation-conversion-guide/',
  '/library/',
  '/glossary/conversion-rate/',
  // Operator Sheets — hub + pilot sheet end-to-end gate.
  '/sheets/',
  '/sheets/recipe-cost-card/',
  '/es/sheets/',
  // Open the Doors bootcamp — hub + canonical vertical-slice lesson
  // + the terminal L14 generator. The lesson page is dense (rail
  // iframe + multiple widget mounts) and the generator runs JSZip
  // lazily; both are load-bearing perf gates.
  '/course/',
  '/course/m2-decide/customer/',
  '/course/m4-launch/generator/',
  '/es/course/',
  // Method manifesto + Workshop Kit hub — the brand-defining pages
  // that point operators at the bootcamp. The Workshop Kit hub
  // loads a 18-card grid; a regression there cascades into the
  // bootcamp's perceived quality.
  '/method/',
  '/method/workshop/',
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
      // Two-tier strategy:
      //
      //   1. CURRENT BASELINE (this block) — set to "do not regress"
      //      from the first measured run on 2026-05-03 across the
      //      7-URL set. The build doesn't fail when we're at today's
      //      level; it only fails when something gets WORSE. Keeps
      //      the gate informative without blocking every PR until
      //      the real perf work lands.
      //
      //   2. LAUNCH-PLAN TARGETS (commented below) — Part VII goals.
      //      Tighten this block back to those numbers as the perf
      //      work ships:
      //        - CSS shell split           → unblocks LCP, perf
      //        - JS module split           → unblocks bootup-time, TBT
      //        - Variable woff2 + fallback → unblocks CLS, perf
      //        - AVIF/WebP image pipeline  → unblocks LCP on image-heavy
      //                                      pages, image-size-responsive
      //
      // Today's baseline (from PR #243's lhci run, median of 3):
      //   perf:       0.73 – 0.79
      //   LCP:        4.4s – 6.0s
      //   CLS:        0.00 – 0.07
      //   render-blocking: 1 (the single site.css)
      //   errors-in-console: 1 every page (Turnstile localhost; fixed
      //                                    in this PR + min-height
      //                                    reservation for the widget)
      assertions: {
        // === CURRENT BASELINE (regression gate) ===
        'categories:performance':       ['error', { minScore: 0.70 }],
        'categories:accessibility':     ['error', { minScore: 0.95 }],
        'categories:best-practices':    ['error', { minScore: 0.90 }],
        'categories:seo':               ['error', { minScore: 1.00 }],

        // LCP at 6.5s leaves 500ms margin above the worst measured
        // value (5953ms on /). CLS at 0.10 leaves margin above the
        // 0.07 worst run on seo-grader; the .cf-turnstile min-height
        // reservation in site.css should bring it back under 0.05
        // once the next run measures.
        'largest-contentful-paint':     ['error', { maxNumericValue: 6500 }],
        'cumulative-layout-shift':      ['error', { maxNumericValue: 0.10 }],
        'total-blocking-time':          ['error', { maxNumericValue: 800 }],

        // Bootup-time + main-thread budgets stay generous until JS
        // module split lands; they catch regressions, not absolute
        // numbers.
        'bootup-time':                  ['error', { maxNumericValue: 4000 }],
        'mainthread-work-breakdown':    ['error', { maxNumericValue: 6000 }],

        // Hardening: console-error gate stays STRICT. With the
        // Turnstile-on-localhost fix in this PR, every page should
        // load with zero console errors; any new error is a real bug
        // worth blocking on. Image-* audits stay strict — the Phase
        // 1 cleanup (Irish Inn 10000×10000) tightened these and we
        // don't want regressions.
        'errors-in-console':            'error',
        'image-aspect-ratio':           'error',
        'image-size-responsive':        'error',
        'unsized-images':               'error',

        // Render-blocking is a warning (not error) — the 1 we have
        // is the main site.css; it goes away with the CSS shell
        // split. Until then, warning-level surfacing is enough.
        'render-blocking-resources':    ['warn', { maxLength: 0 }],

        // === LAUNCH-PLAN TARGETS (uncomment + delete the baseline
        // block above when the perf work has landed):
        // 'categories:performance':       ['error', { minScore: 0.90 }],
        // 'categories:best-practices':    ['error', { minScore: 0.95 }],
        // 'largest-contentful-paint':     ['error', { maxNumericValue: 2000 }],
        // 'cumulative-layout-shift':      ['error', { maxNumericValue: 0.05 }],
        // 'total-blocking-time':          ['error', { maxNumericValue: 200 }],
        // 'bootup-time':                  ['error', { maxNumericValue: 1500 }],
        // 'mainthread-work-breakdown':    ['error', { maxNumericValue: 2500 }],
        // 'render-blocking-resources':    ['error', { maxLength: 0 }],
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
