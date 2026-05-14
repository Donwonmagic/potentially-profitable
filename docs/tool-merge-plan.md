# Tool consolidation plan (Phase 3)

The Phase 0–2 audit identified two pairs of near-duplicate tools that the owner approved consolidating:

1. `holiday-hours` + `open-hours` → new `store-hours`
2. `speed-test` + `mobile-check` → new `page-health`

These merges change tool count from 13 live → 11 live (the data/tools.json count; the suite continues to gain coverage by Phase 3 roadmap items). They are deliberately deferred from the per-tool hardening pass because they involve four cross-cutting risks that benefit from a dedicated, reviewable change:

- **SEO**: four old URLs (`/tools/holiday-hours/`, `/tools/open-hours/`, `/tools/speed-test/`, `/tools/mobile-check/`) plus their `/es/` mirrors stop returning 200. Each needs a 301 in `_redirects` to its merged destination.
- **Analytics continuity**: existing Plausible event names for the old tools (e.g. `Speed Test Run`, `Mobile Check Verdict`) must continue firing during a 30-day deprecation window so historical trend data doesn't snap.
- **Cross-tool linking**: every tool that currently cross-links to `holiday-hours` / `open-hours` / `speed-test` / `mobile-check` (and their /es/ mirrors) needs its href updated.
- **Generated artifacts**: `sitemap.xml`, `llms.txt`, `llms-full.txt`, `feed.xml`, the `/tools/` hub generator, and the `/learn/topics/*/` topic pages all reference the old slugs.

## Merge 1: `store-hours`

**Choose the bigger shell as the foundation**: `open-hours/index.html` is 2,578 lines with the richer interaction model (multi-service hours, copy chips, GBP block, JSON-LD, share). `holiday-hours/index.html` is 1,045 lines with a focused single-pass UI for the 8 US holidays plus three outputs.

**Strategy**: rename `/tools/open-hours/` → `/tools/store-hours/`, then move the holiday-hours functionality into a new "Holidays" tab inside the `store-hours` shell. The existing "Regular hours" remains the default tab. The merged tool exports:
- Plain-text hours for the website
- JSON-LD `OpeningHoursSpecification` (regular + holiday overrides)
- A GBP-formatted block

**Steps**:
1. Create `/tools/store-hours/index.html` as a copy of `open-hours/index.html`; convert top-level layout into a tab strip (using the new `MuntinUI.tabs()` primitive — keyboard a11y already correct).
2. Port `holiday-hours/index.html`'s renderer logic into the new "Holidays" tab; consolidate the duplicated narrative blocks (4 infoboxes about quarterly drift) into a single shared block.
3. Mirror to `/es/tools/store-hours/`.
4. Delete `/tools/holiday-hours/` and `/tools/open-hours/` (+ /es/ mirrors).
5. Add `_redirects` entries:
   ```
   /tools/holiday-hours/    /tools/store-hours/?tab=holidays  301
   /tools/open-hours/       /tools/store-hours/               301
   /es/tools/holiday-hours/ /es/tools/store-hours/?tab=holidays 301
   /es/tools/open-hours/    /es/tools/store-hours/            301
   ```
6. Update `data/tools.json`: remove `holiday-hours` + `open-hours` entries, add `store-hours` (cluster: `local-seo`, tier: `standard`). Update the `goals` block ("Fixing your Google listing").
7. Update cross-links: `gbp-grader` references `/tools/open-hours/` in two places (data/tools.json line 869, COPY object) — point both at `/tools/store-hours/`. Same for any other cross-links.
8. Run `scripts/build-sitemap.mjs`, `scripts/build-llms-txt.mjs`, `scripts/build-llms-full.mjs`, `scripts/build-tools-index.mjs`.
9. Analytics deprecation: in the merged tool's JS, fire both the new `Store Hours Generated` event AND the old `Open Hours Generated` / `Holiday Hours Generated` events for 30 days. Document the cutover date.
10. Visual QA: verify the merged page below-the-fold renders cleanly (Phase 0 sensitivity).

**Risk**: low-medium. The two tools have overlapping but not contradictory output formats; the JSON-LD merge needs care so regular + holiday `OpeningHoursSpecification` entries coexist without duplicates.

## Merge 2: `page-health`

**Choose the bigger shell as the foundation**: `speed-test/index.html` is 1,336 lines with Lighthouse-backed performance scoring and image-compression workshop. `mobile-check/index.html` is 994 lines with mobile-specific viewport / touch-target / tap-delay checks.

**Strategy**: rename `/tools/speed-test/` → `/tools/page-health/`, then add a "Mobile" section that surfaces the viewport / touch / tap-delay checks alongside the existing speed checks. Single PageSpeed Insights call powers both — Lighthouse already runs the mobile audit.

**Steps**:
1. Create `/tools/page-health/index.html` from `speed-test/index.html`.
2. Port `mobile-check/index.html`'s mobile-specific check renderers into a new section in the result panel.
3. Mirror to `/es/tools/page-health/`.
4. Delete `/tools/speed-test/`, `/tools/mobile-check/` (+ /es/ mirrors).
5. Add `_redirects`:
   ```
   /tools/speed-test/      /tools/page-health/?section=speed  301
   /tools/mobile-check/    /tools/page-health/?section=mobile 301
   /es/tools/speed-test/   /es/tools/page-health/?section=speed 301
   /es/tools/mobile-check/ /es/tools/page-health/?section=mobile 301
   ```
6. Update `data/tools.json`: remove `speed-test` from roadmap (it was already roadmap, not live in the current data); same for `mobile-check`. Add `page-health` (cluster: TBD — probably `local-seo` since it scores like a grader, tier: `standard`).
7. Update cross-links: `seo-grader`, `gbp-grader`, `storefront-health` all reference one or both of the old tools.
8. Run sitemap + llms + tools-index rebuilds.
9. Analytics deprecation as in Merge 1.

**Risk**: medium. Speed Test and Mobile Check both use the PageSpeed Insights API but with different audit configurations (`mobile` vs `desktop` strategy). The merged tool needs both strategies in one call (or two parallel calls with combined display).

## Audit gates (apply to BOTH merges before shipping)

- `scripts/check-all.mjs` clean (no new failures over Phase 2 baseline)
- `scripts/check-locale-parity.mjs` clean (EN+ES new directories match)
- `scripts/check-hreflang-orphans.mjs` clean (every `/tools/*` has a /es/ pair)
- Manual `curl -I` test on every 301 redirect (EN + ES)
- Lighthouse perf budget (set in `lighthouserc.js`) green on the new merged tool
- Page below-the-fold rendering smoke test (scroll to bottom in Chrome + Safari iOS, confirm no bare code visible — the Phase 0 regression test)
- Analytics smoke test: 24 hours after deploy, verify both old and new event names firing in Plausible

## Why not in this session

Each merge is conservatively 4–6 hours of focused work (HTML reorg + redirect setup + cross-link audit + analytics dual-firing + generator runs + QA). Bundled with other Phase 3 hardening work, the diff would be too large to review safely and the redirect cutover risks breaking SEO. They get a dedicated branch.
