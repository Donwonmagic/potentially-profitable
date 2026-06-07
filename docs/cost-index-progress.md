# Cost Index — build progress & roadmap

Living record of the Cost Index / Plate effort. Update as items land. Status:
✅ done · ▶︎ in progress · ☐ todo · ⛔ gated (needs founder env/keys/counsel).

## Shipped (merged to main)
- ✅ Parity engines made real: `plate-advice.js`, `sales-mix.js`, `composite-price.js`,
  `observation-quality.js`, `cost-index-sources.js` (+ vector suites). [PR #421/#177]
- ✅ Plate product: `/v1/recipes` (CRUD, deep sub-recipe costing, hero loop +
  transitive recost, tier cap, RLS migration), `/v1/sales-mix`, `apps/web /recipes` UI. [PR #177]
- ✅ Free Plate Cost tool: advice panel + Ledger funnel (EN/ES). [PR #421]
- ✅ Cost Index market overlay in Cost Pulse (EN/ES): honest range, trend, confidence,
  freshness, provenance. [PR #421]

## In flight (PR #423, storefront branch)
- ✅ Shared module `tools/_shared/cost-index-ui.js` (one source of truth).
- ✅ "Where do you sit?" — your price vs the p25–p75 band + verdict.
- ✅ Orientation summary + "How we read the market" methodology disclosure.
- ✅ Trend sparkline (DOM-SVG).
- ✅ Deep anchors (`#ci-<ingredient>`) + filter (activates ≥8 items).
- ✅ Cross-wire free tools (Plate Cost ⇄ Cost Index, with Plausible events).
- ✅ Structured data: WebApplication + FAQPage + BreadcrumbList JSON-LD.
- ✅ `/glossary/cost-index/` (+ES): DefinedTerm + Article + FAQPage + Breadcrumb, visible
  FAQ matching JSON-LD, canonical OG cards rendered (SVG+PNG), full derived-artifact
  propagation (sitemap, llms.txt, RSS, hub schema, OG seed). (H1 #2 done.)
- ✅ "Your basket" persisted in the URL hash — per-card Track, basket bar (count /
  show-only-tracked / clear), composes with search. Keys only, no storage, no-fetch. (H1 #4)

## Buildable next — no external deps (Horizon 1 runway)
- ✅ Negotiation helper: when above band, an editable vendor note — copy
  (clipboard + select fallback) or mailto. Honest framing ("typical range from
  public sources"); sample-data caution; a11y disclosure + aria-live. (done)
- ✅ Plausible instrumentation — privacy-respecting (ingredient key + label only,
  never the typed price). Events: `Cost Index Price Entered` {ingredient, verdict
  above/in/below}, `Cost Index Ingredient Tracked` {ingredient}, `Cost Index Vendor
  Note` {action opened/copied/mailto, ingredient}. (H1 #5 done.)
- ☐ Confidence-driven UI polish; "biggest gap to market" ordering once prices entered.
- ☐ Shareable per-ingredient OG "market snapshot" cards. (new)

## Gated — needs founder env (the big value)
- ⛔ H2: flip index preview → live (USDA/BLS/FRED keys); real freshness/history; last-good banner.
- ⛔ H3: `/v1/cost-index` = artifact ⨝ invoices; watchlist + alerts; market-vs-vendor → Plate
  seasonal + hero-loop production trigger (`queue.ts`); invoice-canonical ingredient binding.
- ⛔ H4: fold first-party k-anon delivered anchor into the index (antitrust counsel).
- ⛔ Visual QA (browser); refresh Ledger visual-regression baselines (CI run).

## Conventions / guardrails to respect
- Two-repo boundary: storefront = free, client-side, no-fetch, public sources only (no moat leak);
  Ledger = authenticated, live, invoice-tied.
- Storefront gates: no-innerhtml (baseline 523), no-fetch, verified-stamp, tool-header,
  fabrications, banned-words, locale-parity, hreflang, image-dims, check-tests.
- Parity contract: free-tool JS canonical ↔ Ledger TS port; vectors mirrored.
- Honesty: no fabricated live prices (preview labeled illustrative); no "live" spinner.
