<!-- The self-ratcheting improvement engine for the ledger demo. A fresh session
     resumes the loop from this file: read the floor, the current best, and the
     backlog, then run one cycle. Committed so progress survives context loss. -->

# Ledger demo — quality improvement loop

**What this is:** a repeatable, self-ratcheting engine that keeps pushing
`ledger/demo/` (EN + `es/ledger/demo/`) toward best-in-class, without ever
regressing. Each cycle: **audit → generate diverse candidates → judge → implement
the highest-leverage → adversarially verify the FLOOR → certify against a RISING
bar → ratchet (keep only if it beats the best) → record here → repeat until dry.**

## The FLOOR — invariants, checked adversarially every cycle (a change that breaks any is auto-rejected)

1. **No internal panel scroll** — every step, `scrollHeight ≤ clientHeight`, at
   the full viewport matrix incl the edge cases **320×568 and 1280×700**, EN+ES,
   light+dark.
2. **No page bounce** — `document.scrollHeight` constant across all 5 steps per viewport.
3. **No horizontal overflow** — `scrollWidth ≤ clientWidth`.
4. **Immutable numbers byte-intact** — $24.10 / $24.35 / $29.45; median $24.22;
   ▲$5.23 / +21.6%; thresholds "at least 8%" + "at least $5.00"; $115.80;
   "$19 a month per location" / "$19 al mes por local"; "November 13, 2026"; the
   `<!-- count:ledger.ga_weeks_out -->19<!-- /count -->` sentinel. Any count-up
   animation terminates byte-exact and never emits a mid-tick value to source.
5. **Gates green** — `node scripts/check-all.mjs` demo-relevant checks (locale-parity,
   svg-dimensions, hidden-attribute [display:none, never `[hidden]`], cls-animation
   [transform/opacity only — no stroke-dashoffset], fabrications, table-scroll,
   no-fixed-min-width). Never loosen a gate to pass.
6. **No desktop (≥768) regression** — the two-column Flag/ask layouts stay intact.
7. **Fidelity rule** — all measurement is over **HTTP** (`localhost:8199`), never
   `file://` (absolute `/assets/` 404 there → wrong fonts/metrics, no dark mode).

## The RATCHET & the RISING BAR

- A cycle's change is **accepted only if** it raises the **minimum** judge score
  (or closes a named backlog gap) **and** every FLOOR invariant still holds. Else
  **revert** — the loop is monotonic.
- Commit each accepted cycle (safe rollback + monotonic history).
- The certification bar rises as the score climbs:
  - Cycle 1 target: "stand toe-to-toe with the best." **Hit — avg 8.7.**
  - Cycle 2+ target: **best-in-class — ≥9.5 from every judge.**
- Terminate the loop when a cycle cannot beat the current best (diminishing
  returns), or every judge is ≥9.5 with no high/medium gap left.

## Scorecard

| Cycle | Judges (design-eng / product-designer / buyer) | Avg | toe-to-toe? | Commit |
|------|-----------------------------------------------|-----|-------------|--------|
| 1    | 8.5 / 8.5 / 9.0                               | 8.7 | yes (all)   | `6d9600195` |
| 2    | _pending_                                     |     |             |        |

## Backlog — the named gaps to close (cycle-2 targets, highest-leverage first)

From cycle-1's three certifying judges + the audit's un-done top-tier techniques:

- **[signature] Shared-element continuity** — the recurring romaine line should
  *morph* across steps (invoice row → ledger row → charted point) via a FLIP-style
  transform. Both design judges cited its absence as the #1 thing between this and
  the absolute top tier. Compositor-only; reduced-motion + no-JS safe.
- **[climax] Inspectable chart datapoints** — hover/focus value chips on the three
  read dots + the flagged point (opacity-only; keep the interactive layer
  aria-hidden since `<desc>` already carries the figures).
- **[honesty] Mobile step-2 "3 of 7"** — at ≤767px the 4 ghost rows + the CSV are
  hidden but the count/figcaption still say "3 of the 7"; reconcile so the screen
  matches the words on mobile (fit a compact form, or adjust the mobile copy).
- **[motion] Confidence** — the directional cross-fade (10px translateX) is nearly
  imperceptible; make the signature transition more deliberate while staying tasteful.
- **[motion] Invoice-arrives opening beat** — step 0 is named for an arrival but
  paints static; add a one-shot in-view settle (no first-paint flash).
- **[composition] Step-4 heading alignment** — sits ~36px from the stage top vs the
  constant ~18px of steps 0–3 (dark-card padding); align it.
- **[composition] Desktop sparse columns** — steps 3/4 left column reads a touch empty.
- **[motion] First-mobile-step settle nudge** — ~42–46px on the first transition only.
- **[nit] Step-1 anatomy underlines** read as clickable links; step-0 CTA orphan;
  mobile chrome tucking under the sticky site nav at some scroll positions.

## How to run one cycle (fresh session or here)

1. Ensure the HTTP server is up (`python3 -m http.server 8199` from repo root).
2. Run the improvement-cycle workflow (`.claude/workflows` or ad-hoc): it audits
   the live demo, generates diverse candidates for the top backlog gap(s),
   implements the best, verifies the FLOOR, certifies against the rising bar.
3. Ratchet: if min-score rose and the floor holds, commit + append a scorecard row
   + prune the closed gaps from the backlog. Else revert and record why.
