# Cost Index — Confidence Canon (deliberate decisions)

The confidence model (`tools/_shared/composite-price.js` `confidenceFor`, mirrored
for display by `tools/_shared/cost-confidence.js`) splits LEVEL and TREND and takes
the **min** as the headline. These are the deliberate policy calls behind it — the
audit (`docs/cost-index-audit-2026-06-14.md`) said to decide them explicitly rather
than drift into them.

## 2026-06-15 — Cross-market dispersion earns MEDIUM (and the produce BLS crutch is retired)

**Decision.** A TREND with **≥3 independent markets** (one methodology, e.g. USDA-AMS
terminals) **agreeing on direction** (`agreement ≥ 0.66`) earns **medium** confidence
on its own — it no longer needs a 2nd independent source *type*. It can **never** earn
`high`; `high` still requires **≥2 independent dollar TYPES** (the Urner-Barry moat,
structurally unreachable on free data today). The existing noise gate is unchanged: a
jagged path (`noise > 0.20`) still self-caps to low, so noisy produce stays honest.

**Why.** Each produce item is priced by 8 USDA-AMS terminal markets that independently
agree — that is *real per-item corroboration*, and a stronger, fresher signal than the
thing it replaces.

**What it retired.** Previously all ~69 produce items shared one BLS series
(`WPU01130217`, fresh fruits & vegetables PPI) as a bolted-on "2nd type" purely to lift
them low→medium. That was a soft overstatement: the **same lagged category index** was
counted as corroboration for 69 different vegetables. A skeptic — exactly the AI/search
reader the index courts — could say "their corroboration is the same number for
everything." Retired from per-item sources entirely.

**Where the category signal went.** Preserved honestly as a **driver**:
`data/cost-index-sources.json#drivers.fresh-produce` (`kind: category`,
`bls: WPU01130217`, `leads:` the 69 produce). It is **category-direction context**
shown on produce cards ("produce as a whole is moving ±X%") — never a per-item trend
source, never lifts an item's confidence. Mirrors the established `seafood-import`
driver pattern.

**Net effect (after a re-vendor).** Produce that has ≥3 markets agreeing earns medium
on its own cross-market dispersion; produce with a noisy path or <3 returning markets
stays low. No item is lifted by a borrowed index. `high` remains unreachable without a
genuinely independent 2nd dollar source per cluster.

**Tests pin it:** `tools/_shared/cost-confidence.test.mjs` and
`tools/_shared/composite-price.test.mjs` ("CROSS-MARKET: ≥3 terminal markets…").

> ⚠️ **Parity follow-up.** `composite-price.js` has a behaviour-identical TypeScript
> port in Muntin Ledger (`apps/api/tests/cost-index/composite-price.test.ts`). The new
> cross-market branch in `confidenceFor` + the new vector must be mirrored there in the
> same spirit, or the two engines diverge.

## Still open — the `high`-confidence canon call

`high` LEVEL confidence remains structurally unreachable: no item has a 2nd independent
*dollar-level type*. Reaching it needs either a genuinely independent dollar source per
cluster (Tier-2 sources: AMS National Retail, World Bank Pink Sheet, GATS) **or** a
conscious decision to let a ≥3-market `rangeBasis:"markets"` range earn `high` on
cross-*market* dispersion. **Not yet decided.** The 2026-06-15 rule deliberately stops
at medium for cross-market; promoting it to high would erase the moat and should only be
done with eyes open.
