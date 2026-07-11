# ADR-014 — NASS cold-storage deseasonalization (5-yr same-month median anomaly, per-commodity gated)

- **Status:** ACCEPTED — transform + tests + **per-commodity gating (§3) APPLIED in the manifest** (commit fd19515a8: cheese/poultry/beef votes removed, butter demoted, pork relabeled coincident; §4 coincident framing wired into the dispatch). Contributors compute on real data only when the operator runs the live NASS fetch.
- **Date:** 2026-07-09
- **Owner:** Cost Index / strategic council
- **Branch:** `claude/vendor-benchmark-redesign-yn273q`
- **Review by:** 2026-10-09
- **Relates to:** ADR-013 (gov data-sources policy); `tools/_shared/pressure-sources.js` (`windowChange`/`nassSeries`); `scripts/fetch-pressure-observations.mjs` (`changeFromRaw` `case 'nass'`); `data/pressure-source-specs.json` (`cold-storage-*`); `data/pressure-rules.json`; `check-pressure-honesty.mjs`; the two-layer / no-price contract; the absolute fact gate.

> Decision: the NASS cold-storage pressure branch reads stocks as a **same-month
> deviation from the trailing 5-year same-month MEDIAN**, not raw first→last change.
> Positive = stocks above their seasonal norm (ample → easing), negative = below
> (draw-down → tightening). It emits `null` rather than invent when history is thin.
> And the bigger honesty lever: **per-commodity gating** — only pork (proven, but
> labeled *coincident*) and butter (weak, deseasonalized-only) cast a directional
> vote; cheese and poultry are descriptive-context-only; beef stays excluded.

## Context

The pressure overlay turns a NASS Cold Storage series (monthly holdings — butter,
cheese, pork, poultry — decades of history) into a "supply pressure building/easing"
direction. The live path is `windowChange(nassSeries(rows, {tail:4}))` = `(last −
first)/|first|` over the trailing four monthly prints — a **within-season slope**.
Butter stocks build every spring on the milk flush; the spec's own probe is **+35.9%**,
which `discretize(0.359, 0.02)=+1 × sign(−1)` turns into a **−1 "easing" vote every
spring, mechanically**. There is no deseasonalization at all today. Every cold-storage
contributor is therefore reject-as-wired until this is fixed (per the ADR-013 panel).

Two specialists were consulted (recorded here for the fresh-context reader):

- A **time-series statistician** argued for **deviation from the 5-yr same-month
  *median*** (not mean, not single-year YoY): the median has ~50% breakdown, so one
  anomalous prior year (a strike/gap/cull year) cannot flip the signal, where plain
  YoY (0% breakdown, one-print denominator) breaks and a mean is dragged. `{335,340,345,340,150}` → median 340 (untouched), mean 302 (−11%, false "building"), YoY-vs-150 (+130%, wildly false).
- A **cold-storage market analyst** noted USDA's report *leads* with same-month YoY
  (native, spreadsheet-reproducible), but flagged YoY's weakness as exactly the
  anomalous year-ago base — and emphasized that the **transform choice matters less
  than the per-commodity gate**, because a stock *level* is directionally ambiguous
  (a build can mean strong production OR soft demand).

They converge: hold season fixed, emit-nothing-over-invent, and gate per commodity.
They diverge only on YoY vs 5-yr median as the transform — resolved below.

## Decision

**1. Transform — 5-yr same-month median deviation.** Cold storage has decades of
history, so the statistician's min-data objection to YoY is moot and the median's
robustness wins outright (it also *is* the analyst's stated "robust ideal"). The
analyst's caution about the 5-yr baseline during structural shifts (cheese capacity
growth) is handled by the per-commodity gate (§3), not by falling back to the more
fragile YoY. Algorithm (`coldStorageAnomaly` next to `nassSeries`):

- Parse rows keeping `(year, month=begin_code, value)`; sort by `(y, m)`.
- For each of the last **3** distinct months: baseline = **median** of the same
  month's values in the **prior 5 years** (strictly earlier years). Require
  **≥3** such prior-year prints or skip that month.
- `dev_i = (v_i − baseline_i) / |baseline_i|`; guard `|baseline| < ε` → skip.
- `changePct = mean(valid dev_i)`; if no month qualifies → **`null`** (emit nothing).
- Sign/scale identical to `windowChange` (dimensionless fraction, positive = above
  norm), so the downstream `discretize`/deadband/`sign` logic is unchanged.

Wired as a per-spec `transform:"anomaly"` branch in `changeFromRaw`'s `case 'nass'`,
mirroring the existing ONI `transform` precedent. No transform field ⇒ legacy
`windowChange` (non-seasonal NASS specs unaffected).

**2. Emit-nothing discipline.** A gap, a missing same-month prior, or <3 prior years
returns `null` — the pressure engine already treats `null` as "no contribution."
Never a fabricated number from a thin compare.

**3. Per-commodity gating (the bigger honesty lever).** A stock level alone carries
no clean price direction; only the *deviation-from-normal* does, loosely and
asymmetrically (heavy stocks cap price; a normal build says nothing).

| Commodity | Vote | Sign | Label |
|---|---|---|---|
| **pork** (`cold-storage-pork` → pork-loin/shoulder) | **scored** | −1 | *coincident* supply confirm (calibration lag ≈ 0, N=102, OOS-hold, p=0.008) — **not** a leading arrow |
| **butter** (→ butter) | **scored (weak)** | −1 | deseasonalized-only; uncalibrated; as a lone tier-C/weight-1 signal, expected to read moderate-at-most (emergent from the weak weight, NOT an engine-enforced cap) |
| **cheese** (→ cheddar) | **descriptive only** | — | secular production growth contaminates both YoY and 5-yr baseline — not a directional vote |
| **poultry** (→ chicken) | **descriptive only** | — | total frozen chicken is export-confounded (a build can be strong production *or* collapsed export demand) |
| **beef** | **excluded** | — | already dropped v2026-Q2-18 (empirical +1 inverted the textbook −1; inventory-cycle confounder) |

**4. Honest label (rides every cold-storage signal).** "Cold-storage stocks vs. the
same month's 5-year norm (seasonally matched, not a raw build). A supply-context
read, not a price forecast: heavy stocks lean cost-down, but a build can reflect
strong production *or* soft demand." Pork appends "concurrent confirmation, not a
leading indicator." No lead-lag phrasing until the dormant Engle-Granger gate ships.

## Consequences

- The false spring signal is killed (butter Mar→May 2026 reads ≈ +0.6% vs the old
  +30–36%). A genuine YoY shortfall still reads (cheese −15% below its 5-yr median).
- `cold-storage-pork` was calibrated on the RAW path — **re-validate after the patch**
  before continuing to treat it as proven (open item, carried to the board).
- Cheese/poultry demotion means those specs feed descriptive `/open/` context, not the
  pressure score — a net honesty gain over shipping a confounded arrow.
- The transform + fixtures are pure code, testable offline; the contributors light up
  only when the operator runs the live NASS fetch (`NASS_KEY`), so nothing renders on
  fabricated data.

## Fixtures (pinned in `pressure-sources.test.mjs` / the fetch self-test)

(a) Butter spring flush (Mar/Apr/May, 2021–26 rising seasonal) → ≈ **+0.6%**, neutral
(old windowChange = +30%). (b) Genuine shortfall (2026 stocks ~15% under the same-
month median) → **−15%**, a real tightening. (c) <3 prior same-month years → **`null`**.
(d) One anomalous prior year (2025 = 150 among {335,340,345,340}) → median 340 →
**+1.5%**, correctly neutral (mean would say +14%, YoY +130%).
