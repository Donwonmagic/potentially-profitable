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
| 2    | 9.0 / 9.2 / 9.5                               | 9.2 | yes; **min rose 8.5→9.0** (buyer best-in-class 9.5) | `6fb0c8986` |

**Cycle-2 ratchet: ACCEPTED.** The minimum judge score rose 8.5→9.0 and every
seat improved (avg 8.7→9.2); backlog gaps A/C/D/F/H closed; the FLOOR held on
independent re-verification. The rising bar (≥9.5 from **every** judge) is **not
yet met** — min is 9.0 — so the loop continues into cycle 3.

## Backlog — remaining gaps (cycle-3 targets)

**Closed in cycle 2 (2026-07-10)** — floor re-verified over HTTP at the full
matrix (320×568 … 1280×700, EN+ES, light+dark, 5 steps); check-all unchanged at
227/250 (the 23 fails are pre-existing repo-wide `(idem)` build-state drift, none
in the demo); every immutable number byte-intact; EN↔ES byte-parallel:

- ~~**[signature] Shared-element continuity**~~ — **DONE.** Ghost-overlay FLIP: an
  empty, decorative, aria-hidden `.ld-ghost` created only under `.ld-js`, positioned
  by measuring the outgoing vs incoming `[data-ld-anchor="romaine"]` box each swap and
  playing a transform+opacity FLIP over the ~240ms cross-fade. The ledger row
  **contracts to the ~21px flagged chart-point halo on 2→3** and **expands back on 3→2**
  (headless-measured: ghost width 710px→21px→710px); 0→1→2 read as a persistence pulse;
  step 4 (no anchor) and rapid `.ld-quick` swaps skip it with no stacking. Reduced-motion
  (`display:none`, JS behind `!prm`) and no-JS (never created) show finished states.
- ~~**[honesty] Mobile step-2 "3 of 7"**~~ — **DONE.** Count copy "…lines **shown**
  match" → "…**filed** lines match" (ES "en pantalla" → "archivadas"), true in both
  breakpoints: 7 filed in the record, the search filters to the 3 romaine matches
  (which is *why* mobile renders 3). The in-app figcaption stays `display:none`.
- ~~**[composition] Step-4 heading alignment**~~ — **DONE.** CTA `padding-top` clamp(22–36px)
  → fixed 18px; heading offsets now 18/18/18/18/**18** across both locales (was …/31 desktop).
  Reducing top padding only *lowers* content-height demand, so the no-scroll floor is safe.
- ~~**[nit] Step-1 anatomy underlines**~~ — **DONE.** Removed the `box-shadow:inset 0 -2px`
  link-style underline on `.ld-anat-cap`; the teal-tint chip remains as an extraction
  highlight (box-shadow only → no geometry change).
- **[motion] Confidence** — largely addressed as a side effect of the signature: the
  ghost's deliberate 240ms travel + visible scale contraction is the perceptible beat the
  10px slide lacked. Revisit only if a judge still flags the panel slide itself.

Not yet done (deferred to keep the ratchet monotonic — high surface / low marginal gain):

- **[climax] Inspectable chart datapoints** — hover/focus value chips on the read dots +
  flagged point (opacity-only; layer stays aria-hidden, `<desc>` carries AT). Deferred:
  the three prices ($24.10/$24.35/$29.45) are already statically labeled on every chart
  variant, so chips across 3 SVG variants × 2 locales are high-surface for marginal gain.
- **[motion] Invoice-arrives opening beat** — already implemented earlier (`.ld-arrive-target`
  + `armInView` one-shot settle on step 0); no first-paint flash. No action needed.
- **[composition] Desktop sparse columns** — steps 3/4 left column reads a touch empty.
- **[motion] First-mobile-step settle nudge** — ~42–46px on the first transition only.
- **[nit]** step-0 CTA orphan; mobile chrome tucking under the sticky site nav at some
  scroll positions (partly mitigated by the boot re-anchor chain).

## How to run one cycle (fresh session or here)

1. Ensure the HTTP server is up (`python3 -m http.server 8199` from repo root).
2. Run the improvement-cycle workflow (`.claude/workflows` or ad-hoc): it audits
   the live demo, generates diverse candidates for the top backlog gap(s),
   implements the best, verifies the FLOOR, certifies against the rising bar.
3. Ratchet: if min-score rose and the floor holds, commit + append a scorecard row
   + prune the closed gaps from the backlog. Else revert and record why.
