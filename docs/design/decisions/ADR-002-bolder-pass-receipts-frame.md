# ADR-002 — The bolder pass grammar + the receipts frame

- **Status:** Accepted (founder-approved in session)
- **Date:** 2026-07-02
- **Owner:** Creative / Design Lead (executed by the bolder-pass session)
- **Review by:** 2026-10-02

> Decision: the storefront's visual system is the **futures-edge grammar** proven on
> cost-pulse, applied site-wide; and the homepage's identity section is the
> **receipts frame** ("Every claim on this site carries its own receipt."), replacing
> the retired studio framing. Recorded so neither is re-litigated per surface.

## Context
The founder asked for a bolder, more cutting-edge site "without being too gratuitous,"
then for the studio framing to go and the company's provable strengths to lead.
Research (strategy docs + published trust surfaces + product architecture) converged:
the moat is enforcement — ~60+ check gates turn marketing sentences into build
invariants. A 3-draft copy panel (refusals / receipts / operator) was judged; receipts
won 50–48–48.

## Decision
1. **Material grammar, all storefront surfaces:** cards/panes sit on the `--elev-*`
   scale (elev-1 rest, elev-2 hover on links only, ONE elev-3 object per page) with a
   **3px ink top frame**; numbers are display material (Fraunces, `tabular-nums
   lining-nums`, wght ~560); the muntin motif appears ink-only at three scales
   (waypoint rule, framed pane, window armature) — never as wallpaper; ONE dark ink
   moment per page (hex-pinned `#16181D`/`#1B1E24`/`#2C3038` so dark mode cannot
   double-flip it); teal = live/interactive signal, rust = "a price moved" only.
2. **Motion:** transitions only (no new `@keyframes`), compositor props, one-time
   entrances, `prefers-reduced-motion` static fallback. Markup ships visible; JS may
   only hide what it can also reveal (plus a timeout failsafe).
3. **Receipts frame** owns the homepage identity section; every pane's figures ride
   sentinels (`count:claims.sourced`, `cal:band.*`) so displayed numbers recompute
   from their registries and cannot drift.
4. **Illustrative depictions** (ledger vignette, /ledger/demo/): real DOM text rows,
   generic role-name vendors, chip + figcaption labels on every panel, mechanism-not-UI
   while the product is pre-GA; no uploads/inputs/network on demo surfaces —
   structurally, not behaviorally.

## Consequences
- Rejected as drift (do not reintroduce): count-up numbers, glow shadows, parallax,
  glassmorphism, price tickers, pulsing LIVE dots, second dark bands, countdown clocks,
  invented scarcity.
- Cascade discipline: page-inline overrides of async-loaded shared CSS need doubled-class
  selectors or placement after the `<link>`s; site.css rules must sit after their base
  rules (before `GEN:dark-mode`).
- The studio register's pastel/teal-tint band treatment is retired (founding band now
  cream-2 + ink frame).

Evidence and file anchors: `docs/handoff/bolder-launch-session-2026-07-02.md`.
