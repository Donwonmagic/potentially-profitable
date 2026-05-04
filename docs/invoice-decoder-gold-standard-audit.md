# Gold-Standard Plan — Comprehensive Integration Audit

This audit reviews `docs/invoice-decoder-gold-standard-plan.md` (Waves 10-13)
with explicit focus on **seamless integration with the rest of the empowerment
ecosystem**, per the user's directive. 40 findings, severity-tagged, file-cited.

Scope: cross-tool data shape consistency · existing collisions on main ·
privacy posture · test coverage gaps · build pipeline integration · cross-tool
end-to-end flow · sequencing/dependency hazards · honest call-outs.

---

## Section A — Cross-tool data shape consistency

**1. [concern]** `tools/_shared/context-bus.js:1-254` exposes
`read/write/merge/get/clear/subscribe/writeInvoiceItems/readInvoiceItems/pushTrendEntry/readTrend`.
The plan proposes `writeLatestPrices(map)` and `readLatestPrices()` but does
not register them on the api object. Mitigation: audit-revised plan now drops
these entirely in favor of `MID_SKU_HISTORY.latestByStem()` (see #3).

**2. [concern]** No collision exists for `invoiceLatestPrices`,
`dishCostHistory`, `recipeStaleQueue`, `matchLearnings`, `yieldLearnings`.
**However**, `tools/invoice-decoder/learnings.js:74` already uses the
close-sounding `invoiceLearnings` (category overrides, capped 100). Mitigation:
rename `matchLearnings` → `skuMatchLearnings` to avoid future readers
conflating the two stores. **Done in audit-revised plan**.

**3. [concern → resolved by plan revision]**
`tools/invoice-decoder/sku-history.js:23-29` already stores
`skuHistory[stem]` with `{vendor, ts, qty, unit, unitPrice, comparablePrice,
comparableUnit}` — a strict superset of the plan's proposed
`invoiceLatestPrices`. The plan was creating a parallel store. Mitigation:
expose `MID_SKU_HISTORY.latestByStem()` that walks `skuHistory[stem][0]` and
returns the same projection. Saves ~24KB of duplicated localStorage and one
source of drift. **Done in audit-revised plan (Wave 10.3)**.

**4. [blocker]** `MID_LEARNINGS.extractStem` is exposed on
`window.MID_LEARNINGS` (`learnings.js:210,214`) and is consumed cross-module
inside invoice-decoder (`sku-history.js:59`, `substitution.js:51`,
`margin-impact.js:26`). It is NOT consumed cross-**tool** today — Plate Cost
loads only `device-key.js`. The plan's Wave 10.1 said "lift `learnings-stem.js`"
but did not budget the extraction. Cleanly: (a) extract `extractStem` +
`normalize` into `tools/_shared/stem.js`, (b) update 4 callers to consume from
`_shared/stem.js`, (c) keep `MID_LEARNINGS.extractStem` as a back-compat
re-export. **Done in audit-revised plan (Wave 10.0a)**.

**5. [concern]** Plate Cost recipe row shape (`plate-cost.js:622-628`):
`{ingredient, apPrice, apQty, apUnit, yieldPercent, usedQty, usedUnit,
apUnitCost, epUnitCost, ...}`. Adding `boundStem`, `apPriceSource`,
`apPricePrev` is additive and safe IF (a) `validateRecipe` accepts unknown
keys (it does — line-by-line), and (b) the CSV exporter
(`plate-cost.js:850-1002`) doesn't surface them. Mitigation: prefix with `_`
or call out CSV header allowlist explicitly. **Done in audit-revised plan
(Wave 10.7)**.

**6. [concern]** Plate Cost has no recipe-schema version field. Recipes saved
before the change won't carry `apPriceSource`, so 10.6's "auto-update only
overwrites when source is older" logic will see `undefined`. Mitigation:
treat missing source as `manual` (defensive default). **Done in audit-revised
plan**.

**7. [concern]** `MuntinContext.readInvoiceItems()` is async (Promise-wrapped).
`MID_SKU_HISTORY.latestByStem()` must be sync for the per-row ghost-chip
flow. Confirmed clean separation: full row text stays async + envelope-wrapped;
stem aggregates stay sync + plaintext.

---

## Section B — Existing collisions / drift on main

**8. [info]** Recent commits on integrated surfaces — Plate Cost W9-1
pull-from-last-invoice, W4-7 invoiceTrend buffer, W9-8 Cost Pulse dashboard,
W3-4 encrypted handoff. The spine is fresh, no conflicting work in flight.
Wave 10 builds on, not replaces, all four. The 10.5 stale-banner does not
collide with the 1421-1505 "Pull from last invoice" CTA — they're
complementary surfaces.

**9. [concern]** Cost Pulse is a single index.html with embedded JS —
`tools/cost-pulse/cost-pulse.js` does not exist. The plan referenced it as
if it did. Mitigation: 10.9's "Recipe ripple" lands inline in `index.html`
(~40 lines). **Done in audit-revised plan**.

**10. [blocker]** Margin Math (`margin-math.js`) and Menu Engineering
(`menu-engineering.js`) **do not import or read MuntinContext today** — zero
hits in grep. The plan's Wave 10.8/10.10 said "subscribes" and "reads
dishCostHistory" as if extension; the reality is greenfield wiring: each tool
needs (a) `<script src="/tools/_shared/context-bus.js">` include, (b) fresh
subscription path with first-run prefill, (c) no-localStorage fallback for the
case where the operator opens these tools first. Day estimates bumped:
10.8 from 1.0 → 1.5 days, 10.10 from 0.75 → 1.25 days. **Done in audit-revised
plan**.

**11. [concern]** `menu-engineering.js:247-260` operates on a passed-in array,
not a stored `dishes` array. The bridge has to read
`MuntinContext.read().dishes`, recompute foodCost using `dishCostHistory`
deltas, feed into `menuEngineeringAnalyze`. ~80 lines of glue, included in
the 1.5-day bumped estimate.

---

## Section C — Privacy posture

**12. [nit]** Plain-text aggregate posture is documented for `invoiceTrend`
(`context-bus.js:177-194`) and `skuHistory`/`contractPrices`. Adding
`dishCostHistory`/`recipeStaleQueue` continues that posture consistently.

**13. [concern]** `scripts/check-no-invoice-egress.mjs:38-45` only scans
server-side files (`src/worker.js`, etc). It does NOT scan
`tools/_shared/context-bus.js` or `tools/invoice-decoder/*.js`. Mitigation:
add `TOOLS_TARGETS` array + `FORBIDDEN_PATTERNS` group covering `fetch(`,
`sendBeacon`, `new Image().src=`. **Done in audit-revised plan (Wave 10.0b)**.

**14. [concern]** `scripts/check-tool-no-fetch.mjs:74-79` flags
`localStorage.setItem`. Every new MuntinContext write must go through
`merge`/`write`, not raw `localStorage.setItem`. Confirmed in plan's helper
patterns.

**15. [concern]** Voice query (Wave 13.2) routes audio through
`webkitSpeechRecognition` which on most platforms goes to Apple/Google.
Calling it "image bytes never leave" remains technically true, but a careful
reader will ask. Mitigation: amend the Self-Check report (Wave 8.7) and the
data-promise card to call out three categories — image, audio, invoice-text —
with separate verdicts. **Added to plan as Privacy Self-Check v2 sub-item
of Wave 13**.

**16. [nit]** localStorage exfil model: every MuntinContext key is plaintext-
readable by any script running in `muntin.digital`. The plan adds keys with
stems + numbers, no descriptions. Same posture as `invoiceTrend` already
established. No new exposure.

---

## Section D — Test coverage gaps

**17. [concern]** `scripts/test-invoice-decoder.mjs` already stubs
`global.window.MuntinContext` (lines 481, 829, 1028, 1653, 1911) for SKU
history, contract prices, invoiceTrend writes. It does NOT exercise cross-
tool reads. Wave 10's `latestByStem()` + `dishCostHistory` round-trip needs
new test blocks; budget +200 lines.

**18. [blocker]** `scripts/test-plate-cost.mjs` exists but has zero
`MuntinContext`/`invoice` hits. Wave 10.5/10.6/10.7 introduce new integration
points that must get `global.window.MuntinContext` stubs. Mitigation: 6 new
test blocks. **Done in audit-revised plan (Wave 10.15)**.

**19. [blocker]** Wave 11.6 — synthetic vendor fixture — needs a JSON
sidecar spec: `{rows: [{name, qty, unit, unitPrice}], totals: {parsedSum}}`
per synthetic invoice. Test runner asserts parser output matches sidecar
within tolerance. Without that, "synthetic fixtures" is just a render
exercise. **Surfaced as 11.6 caveat in audit-revised plan**.

**20. [concern]** Portion-bridge math (Wave 10.2) — name specific failure
modes: cross-family conversion attempts, yield ≤ 0, yield > 1, NaN
propagation, density-required-but-missing. **Done in audit-revised plan
(Wave 10.2 test budget)**.

---

## Section E — Build pipeline integration

**21. [concern]** New files under `tools/_shared/` (sku-match, portion-bridge,
dish-drift, stem, cross-vendor) are NOT scanned by `check-tool-no-fetch.mjs`
— it only walks `tools/<slug>/`. Mitigation: extend `TOOL_DIRS` to include
`tools/_shared` OR ship a separate `check-shared-no-fetch.mjs`. Bundled into
audit-revised Wave 10.0b.

**22. [blocker]** 18 new event names land across waves 10-13:
"Plate Cost Stale Accept", "Plate Cost Ghost Update", "Cost Pulse Recipe Ripple",
"Margin Math Break-Even Shift", "Menu Engineering Bucket Move", "Invoice
Decoder Voice Query", "Invoice Decoder Insight Card Shared", "Invoice Decoder
What-If", "Invoice Decoder PDF Annotated", "Invoice Decoder Bookmarklet
Receive", "Invoice Decoder Cell History", "Invoice Decoder Theft Flag",
"Invoice Decoder Reorder Copied", "Invoice Decoder Forecast Shown", "Invoice
Decoder Vendor Switch ROI", "Invoice Decoder Run Rate", "Invoice Decoder
Seasonality", "Invoice Decoder Supplier Health". `check-analytics-vocabulary.mjs`
blocks builds otherwise. **Done in audit-revised plan (Wave 10.0c)**.

**23. [concern]** `check-event-prop-cardinality.mjs` enforces bounded prop
sets per event. Wave 13.2 voice-query has 12 intent grammars — that's an event
prop with cardinality 12. Mitigation: explicitly register the prop allowlist;
document the 12 intents in analytics.js.

**24. [nit]** `sync-includes.mjs` and `inject-tool-knit.mjs` propagate page
chrome, not tool surfaces. Adding new files does NOT require running these
scripts.

**25. [concern]** No bundle budget for invoice-decoder. Wave 13.3's pdf-lib
(~470KB self-hosted) is dynamic-imported — fine in principle, but no check
verifies the gate. Mitigation: smoke check that `pdf-lib` strings appear only
inside `import(` calls.

---

## Section F — Cross-tool flow audit (the user's explicit priority)

End-to-end trace:

**26. [concern]** Step (a)→(b) — Save flow today writes `invoiceTrend`,
`skuHistory`, `invoiceItemsEnc`. Plan adds `invoiceLatestPrices`. Per finding
#3, `skuHistory[stem][0]` already IS the latest price. Replaced with
`latestByStem()` projection. **Resolved**.

**27. [concern]** Step (c)→(d) — Plate Cost cold load currently calls
`checkLastInvoice()` async. Wave 10.5's stale-banner is a similar pattern.
Both now race to render in the same area. Mitigation: register banner render
order — stale-banner first (sync read), pull-CTA second (async decrypt).
**Done in audit-revised plan (Wave 10.5)**.

**28. [concern]** Step (e) — `dishCostHistory` walk cost: 60 dishes × 8
ingredients = 480 stem lookups, sync, on save thread. Acceptable, but
documented in audit-revised plan.

**29. [concern]** Step (f) — `MuntinContext.subscribe` only fires on
**cross-tab** storage events. Same-tab writes do NOT fire. If the operator
saves in tab A and switches to Menu Engineering in the same tab, the
subscriber won't trigger. Every consumer needs cold-load `read()` AND
`subscribe()` paths.

**30. [concern]** Step (g) — Margin Math today operates on aggregate
`foodCostPct`, not per-dish data. The dish-level recompute is new work.
Mitigation: explicit aggregation step — sum `dishCostHistory[*]` deltas
weighted by mix to produce the `foodCostPct` shift. **Done in
audit-revised plan (Wave 10.10)**.

---

## Section G — Sequencing / dependency hazards

**31. [concern]** Wave 11.6 (synthetic fixtures) is independent of 11.1-11.5.
If 11.6 slips, 11.1-11.5 still ship. **Documented**.

**32. [concern]** Wave 10.7 schema additions need a migration path. Plate
Cost recipes today live in URL fragments (`plate-cost.js:1309` ICS reminder
pattern) — no central store to migrate. Each recipe gets fields when next
loaded. Mitigation: defensive `row.boundStem || null` reads everywhere.
**Resolved by 10.6 defensive-default branch**.

**33. [blocker]** Wave 12.7 (seasonal pattern) needs ~10 months of operator
history. Plan does not surface a "show-up UI before threshold" — operators
who use the tool for 6 months will see nothing. Mitigation: define the
empty/pre-threshold state. "Seasonality unlocks at month 10 — you're at
month 4." UX gap, not math gap. **Surfaced as 12.7 caveat**.

---

## Section H — Honest call-outs

**34. [concern]** Wave 12.5 (Menu-engineering bridge in invoice-decoder)
overlaps with Wave 10.8 (Menu Engineering cascade). Different surfaces, same
compute. Mitigation: factor into one shared `tools/_shared/dish-recompute.js`.
**Surfaced in plan summary**.

**35. [concern]** Wave 13.5 bookmarklet writes to `sessionStorage` from
third-party origins (sysco.com, etc), bypassing `check-tool-no-fetch.mjs`.
Receiving code in invoice-decoder reads from sessionStorage on load — fine.
Cross-origin write paradigm needs documenting. Mitigation: dedicated section
in Privacy Self-Check explaining the bookmarklet's threat model.

**36. [nit]** Plan claimed "~53.5 engineer-days" total. Audit findings 4, 10,
13, 18, 22 each add 0.25-0.5 days of unscheduled work. **Audit-revised
budget: ~56 engineer-days**.

**37. [concern]** Plan's "Cross-cutting deliverables" was light on the WHO.
Egress-check expansion, analytics registry, stem extraction lift now
explicitly scheduled as Wave 10.0a/b/c/d. **Resolved**.

**38. [nit]** `MID_SKU_HISTORY.compareAcrossVendors` is invoice-decoder-
private today. Plate Cost doesn't load it. Cleaner: lift to
`tools/_shared/cross-vendor.js`. **Done in audit-revised plan (Wave 10.13)**.

**39. [concern]** Storage budget worst-case: `dishCostHistory` (60 × 12 ×
80B = ~58KB) + projected aggregates approach ~200KB combined. Workshop quota
concerns surface earlier than the 5MB browser cap. Mitigation: explicit
audit item. **Done in audit-revised plan (Wave 10.0d)**.

**40. [nit]** Wave 13.4 ships `apple-shortcut.shortcut` and
`tasker-profile.prj.xml` — binary-ish artifacts in git. Surface as a
heads-up for any future "no binary blobs in tools/" check.

---

## Ready-to-implement verdict

**Wave 10 (Cross-tool spine):** **Yes, after Wave 10.0 prep lands first.** The
audit-revised plan adds 10.0a/b/c/d (~1.5 days) to address blockers #4, #10,
#13, #18, #22. Once 10.0 lands, 10.1-10.15 are unblocked and the day estimates
hold.

**Wave 11 (Compounding accuracy):** **Yes, with one caveat.** 11.1-11.5 are
self-contained inside `tools/invoice-decoder/`, no cross-tool integration risk.
11.6's synthetic fixtures need ground-truth-sidecar JSON spec before the
script lands. Order 11.6 last; if it slips, 11.1-11.5 ship the +5-9pp lift
independently.

**Wave 12 (Owner-grade insights):** **Yes, with two caveats.** 12.5 Menu-
engineering bridge overlaps with 10.8 (#34) — share a `dish-recompute.js`.
12.7 seasonality needs an explicit pre-threshold UI state (#33). Otherwise
self-contained.

**Wave 13 (Surprise-and-delight):** **Yes, with privacy disclosure update.**
13.2 voice query forces an amendment to the Privacy Self-Check (#15). 13.3
pdf-lib needs a dynamic-import smoke check (#25). 13.5 bookmarklet needs a
documented threat model in Self-Check (#35). All deferrable to a single
"Privacy Self-Check v2" sub-item before any of 13.2/13.3/13.5 ship.

The plan is structurally sound and the user's explicit priority (cross-tool
spine) is correctly placed first. The biggest single missing piece — now
addressed in the audit-revised plan — is honest acknowledgment that Margin
Math and Menu Engineering have **never** integrated with MuntinContext. The
plan described their cascades as "subscribers"; the reality is greenfield
wiring. Day estimates bumped to match.
