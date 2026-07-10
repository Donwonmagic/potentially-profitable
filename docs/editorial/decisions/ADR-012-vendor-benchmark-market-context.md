# ADR-012 — Vendor Benchmark market-context (reference-state only, never the operator's price)

- **Status:** ACCEPTED — but the standalone `market-gap-panel.js` implementation was **REMOVED 2026-07-10** during the VB redesign: the panel was orphaned (never wired into the page — it targeted `#vbForm`/`#vbLatest`, which no longer exist) and had drifted to carry a per-invoice gap verdict + an unsourced "aggregated buying typically saves 10–30%" line, both contract/fact-gate violations. The reference-state-only idea (this ADR's actual decision) is re-implemented **contract-safe** as the redesign's "re-light the ADR-012 reference-state context line" item (Phase 2), sourced from `data/cost-index-context.js`.
- **Date:** 2026-07-09
- **Owner:** Cost Index / strategic council
- **Review by:** 2026-10-09
- **Relates to:** `tools/_shared/fair-price-gap.js` (the honesty contract); `tools/vendor-benchmark/market-gap-panel.js`; `scripts/build-cost-index-context.mjs` → `data/cost-index-context.{js,json}`; ADR-011 (the events registry it draws on).

> Decision: Vendor Benchmark may add ONE honest line of context about the **market
> reference's own state** — is the reference itself unusual right now vs its own
> trailing-year normal, and what documented event most recently overlapped it — but it
> must NEVER make a claim about the operator's own price. That keeps the fair-price-gap
> contract intact: the Cost Index is a WHOLESALE reference, a delivered price legitimately
> runs above it, so we never claim overpayment from wholesale alone.

## Context

Vendor Benchmark places an operator's paid price against the wholesale reference (the
"gap") and only raises a "worth asking" flag at an extreme gap. The founder's push:
make it more USEFUL by feeding it the new market intelligence. The trap: any context
that implies "your price is high because…" would breach the contract and could
manufacture phantom overpayment findings.

## Decision

A precomputed, deterministic seed (`build-cost-index-context.mjs` → a same-origin,
no-fetch `window.MUNTIN_COST_CONTEXT`) carries, per tracked ingredient:
- `vol` — volatility class from the detected moves;
- `now` — is the reference itself unusual? current smoothed level vs its own
  trailing-year normal → `{ pct, state: elevated | depressed | normal }`;
- `recentEvent` — the most recent DOCUMENTED registry event, flagged `recent` when it
  lands within a few years of the latest reading.

The panel (additive, fail-silent, `textContent`-only) adds one line only when there's a
live signal: e.g. *"The reference itself is ~19% above its own normal right now — an
unusually high market, so part of any gap is the market moving, not necessarily your
vendor"* (avocado), or a recent documented event. Stale events are dropped.

**Hard guardrails (the adversary panel's red lines, ADR-013):** no Census/derived
proxy or any below-wholesale figure may EVER enter the Benchmark reference set (it would
manufacture phantom overpayment on every invoice); the context never subtracts a freight
figure from the gap, never converts to a pass-through number, never produces or softens
an overpayment verdict. Read-only from the vendored series; deterministic (client-data
surface).

## Consequences

- The operator learns when the *market* is unusual (a depressed market means a "fair"
  price may still deserve a second look; an elevated market means part of the gap is not
  the vendor) — genuinely useful, contract-safe.
- Because the context is reference-state-only, it needs no cointegration/lead-lag gate.
- The seed is `--check`-gated in check-all and rebuilt by the refresh workflow.
