# FINDING — deep-history seasonal normals are nominal-dragged (latent honesty bug)

**Status:** ✅ BUILDER FIXED 2026-07-10 (`04268f66b`, trailing-window per operator
call) · **page activation pending a refresh regen** (see "Activation" below).
**Found:** 2026-07-10, during the VB audit-loop Pass B (seed minify).
**Severity:** was a LIVE false-signal on 58 ingredient pages ("current read is
running above its typical {month}" off a 25yr-dragged normal); root cause now
fixed at the builder.

## Resolution (2026-07-10)

`build-seasonality.mjs` now bounds each "typical {month}" normal to a trailing
`WINDOW_YEARS=5` same-month window anchored to the series' own latest print
(deterministic — ADR-014 precedent). Deep history still feeds the relative SHAPE
surfaces. ribeye typical-June median $6.82 (25yr) → $10.76 (5yr, range
$9.97–$11.59); current $13.14 now reads an honest ~+22% (beef genuinely elevated
in 2026), not a fabricated +97%. New bounded-window `--check` invariant (no
published month pools > WINDOW_YEARS) + 3 self-tests. `data/seasonality.json`
regenerated.

## Activation (the remaining step)

The ingredient pages bake these bands at BUILD time. Run
`node scripts/build-cost-index-pages.mjs` (or the daily `cost-index-refresh`
workflow, which already runs it) to re-render the 58 pages with the honest 5yr
bands and reconcile `check-cost-index-seasonal` — the same page regen the
196-file `build-cost-index-pages --check` baseline drift already awaits.

---

**(original finding, for the record)**
**Severity:** would be a fact-gate/honesty violation *if activated*. Currently latent.

## What

`data/cost-index.js` (the browser seed) bakes per-ingredient `seasonalNormals`
— the "vs typical {month}" bands shown on the **Cost-Pulse dashboard cards**
(`tools/_shared/cost-index-ui.js:967-984`) and **ingredient pages**
(`scripts/build-cost-index-pages.mjs:1015-1040`). The Vendor Benchmark tool
does **not** use them (zero seasonal references in vendor-benchmark.js).

The committed seed is **stale**: it carries recent-window normals (ribeye Oct
= 1070¢, n=2, years=2). `data/seasonality.json` + the deep-history store
`data/cost-index-history.json` now carry **25-year** normals (ribeye Oct = 682¢,
n=109). A `node scripts/build-cost-index-seed.mjs` would activate them.

## Why activating them is dishonest

`scripts/build-seasonality.mjs:76-85` takes a **straight median of raw nominal
cents** — no CPI deflator, no detrend, no bounded window. Over 25 years of a
non-stationary series that drags the "normal" far below today's regime:

- **Ribeye today** ≈ 1314¢ ($13.14/lb, the real 2026 market). Deep "typical
  July" median = 668¢ (2001 prints were 369–405¢). Consumer computes
  `|1314−668|/668 = 97%` and `1314 > p75(758)` → renders **"About 97% above the
  typical July."** A flat false alarm — that IS the normal price.
- **Butter today** ≈ 161¢ → reads **"about 30% below the typical July"** (deep
  median 231¢ inflated by mid-decade spikes) → false "cheap" signal.

The signal is measuring inflation + secular appreciation, not seasonality —
violating the script's own stated purpose (`build-seasonality.mjs:8`: "is this
high *for this month*?").

## Why the gate doesn't catch it

`scripts/check-cost-index-seasonal.mjs:66-82` is a **reconciliation** gate: it
re-derives each rendered band and checks it matches `seasonality.json`
(median/p25/p75/n/years, years>=2). A perfectly-consistent 25-year nominal-drag
band **passes**. It is a consistency gate, not a real-dollar/regime-honesty gate.

## Doctrine already on the books

**ADR-014** mandates, for cold storage, "same-month deviation from the trailing
**5-year** same-month **median**" — a bounded recent window chosen precisely
because a raw non-stationary series manufactures false directional signals. The
price-seasonality feature commits the same sin with a worse (25-year) window,
no median-deviation framing, no caveat, no gate.

## Recommended fix (operator's methodology call)

Do **not** rebuild the seed to activate the deep-history normals as-is. Fix
`build-seasonality.mjs` first. Two honest options:

- **(a) Real-dollar:** CPI-deflate the deep series to constant dollars before
  taking the same-month median (and deflate today's level the same way).
- **(b) Trailing window (ADR-014 precedent):** restrict the "typical {month}"
  normal to a trailing bounded window (3–5 years) so the comparison stays inside
  today's price regime.

Note the split: the **shape** surfaces (cheapest/priciest month, 12-month curve;
`build-cost-index-pages.mjs:990-997`) compare months *to each other within one
pooled series* and are robust to nominal drift — they genuinely benefit from 25
years. Only the **level-vs-typical** comparators (`seasonalNormals` +
`seasonalBand`) break. So: keep deep history feeding the shape surfaces;
gate/transform only the level comparator to real dollars or a trailing window,
and add a `check-cost-index-seasonal.mjs` assertion that the compared level and
normal share the same dollar basis.

Until that lands, **keep the seed's `seasonalNormals` stale (recent-window)** —
thin (n=2) but inside today's regime; it does not fabricate a ~97% deviation.
The stale seed is the *less dishonest* of the two options on the table. Pass B
(seed minify) deliberately preserved it (whitespace-only, no rebuild).

## Key files

- `scripts/build-seasonality.mjs:76-91` — raw-nominal median (the root cause)
- `tools/_shared/cost-index-ui.js:967-984` — the "% above/below typical" consumer
- `scripts/build-cost-index-seed.mjs:62-69,120` — bakes seasonalNormals per ready item
- `scripts/build-cost-index-pages.mjs:1015-1040` — page-band twin
- `scripts/check-cost-index-seasonal.mjs:66-82` — reconciliation-only gate (blind)
- `data/cost-index-history.json` — raw-nominal deep store
- `docs/editorial/decisions/ADR-014-*.md` — the trailing-window doctrine this violates
