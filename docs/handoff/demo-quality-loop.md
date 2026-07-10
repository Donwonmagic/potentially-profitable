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
| 3    | 9.3 / 9.3 / 9.6                               | 9.4 | yes; **min rose 9.0→9.3** (buyer best-in-class 9.6) | `924c6b190` |
| 4    | **9.5** / 9.3† / 9.6†                          | 9.5 | design-eng → **best-in-class**; **2 of 3 seats ≥9.5** | `8977d9826` |

<sup>† cycle-4 was a single tightly-scoped change (the 320px climax chart). Only the
design-engineer seat — which named that gap as its #1 blocker — was re-certified
(9.3→9.5). The product-designer (9.3) and buyer (9.6) scores are carried from cycle 3:
the change doesn't touch the product-designer's #1 gap (laptop climax-framing) or affect
the buyer's read.</sup>

**Cycle-2 ratchet: ACCEPTED.** The minimum judge score rose 8.5→9.0 and every
seat improved (avg 8.7→9.2); backlog gaps A/C/D/F/H closed; the FLOOR held on
independent re-verification. The rising bar (≥9.5 from **every** judge) is **not
yet met** — min is 9.0 — so the loop continues into cycle 3.

**Cycle-3 ratchet: ACCEPTED.** Minimum rose 9.0→9.3, every seat improved
(avg 9.2→9.4); the three cycle-2-named gaps closed — the two-truths count-up
flicker removed (climax price always $29.45, no tick), the ES-mobile step-3
climax chart de-collapsed (44px→96px at 375, tightening extended across the
≤560 band), the step-0 CTA orphan fixed (`nowrap`). All three judges
independently re-confirmed the FLOOR across 44/16/12 configs; immutables
byte-intact; reduced-motion + no-JS finished states; the cycle-2 ghost FLIP
still morphs. Still short of ≥9.5-from-every-judge (min 9.3) — loop continues
into cycle 4. **Buyer flagged the `ga_weeks_out` sentinel (committed value 19).
Investigated and dismissed as a non-issue: the Cloudflare deploy `command`
(wrangler.jsonc) runs `build-site-counts` + `inject-site-counts` before building
`dist`, so the LIVE site regenerates this count (→17 today) and the article
counts (→53) from the current date + filesystem at every deploy. The committed
sentinels are stale-by-design placeholders that are never served — which is why
the counts check is the tolerated `Site counts (idem)` self-healing check
(check-all.mjs). No live numeric error; committing a manual counts refresh (731
files) would fight the deploy pipeline and re-stale by the next day. The judge
measured the un-deployed local HTTP snapshot. No action taken.**

**Cycle-4 ratchet: ACCEPTED** (scoped, per the founder's "target the one real gap"
steer). The single all-three-named gap — the 320×568 step-3 climax chart crushed to
~54px — is closed: reclaiming height from the fixed pieces on ≤560×≤660 phones grew the
elastic chart to **86px (ES) / 102px (EN)** at 320, and 100/120px at 360×640, with the
already-fine viewports (375×667, 390×844) untouched. The design-engineer seat — which
named this as its #1 blocker — re-certified **9.3→9.5** ("gap genuinely closed, no floor
cost"); FLOOR held across 28 contexts; immutables byte-intact; 8 gates green. **Two of
three seats are now best-in-class (design-eng 9.5, buyer 9.6).** The only seat below 9.5
is the product-designer (9.3), held by its own #1 gap — **the laptop climax-in-view
framing** (a scroll-behavior change near the no-bounce/preventScroll design), which was
deliberately left out of this scoped cycle. That gap is the last thing between here and
≥9.5-from-every-seat; attempting it is the higher-risk call the founder can weigh.

## Backlog — remaining gaps

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

**Closed in cycle 3 (2026-07-10)** — all three judges independently re-verified the FLOOR
(44/16/12 configs); immutables byte-intact; min score rose 9.0→9.3:

- ~~**[honesty] Two-truths count-up flicker**~~ — **DONE.** Removed the flagged-price count-up
  (was ticking $24.35→$29.45 over ~520ms while the ledger row already read $29.45). Labels now
  fade in at final values via the staged `.lg-landed` reveal; chart price sampled = $29.45 at
  every frame, both locales. Also resolves the design seat's "flagged point under-tells its number."
- ~~**[composition] ES-mobile step-3 climax collapse**~~ — **DONE.** Row tightening + own-row flag
  pill extended from ≤360 to the whole ≤560 narrow-chart band → chart 44px→96px at ES 375×667;
  no scroll anywhere 320–560. (The design seat's "#1 blocker to 9.5".)
- ~~**[nit] Step-0 CTA orphan**~~ — **DONE.** `.js-ld-jump{white-space:nowrap}` keeps "Skip to the
  flag →" / "Salta a la marca →" one unit (desktop-only, within the 640px measure).

**Closed in cycle 4 (2026-07-10)** — the founder's scoped "target the one real gap":

- ~~**[climax] 320×568 chart floor**~~ — **DONE.** Reclaimed height from the fixed step-3 pieces on
  ≤560×≤660 phones (figcaption 11.5px, pane title 12.5px, tighter head margin) so the elastic chart
  absorbs it → **320×568 54px→86px (ES) / 102px (EN)**, 360×640 →100/120px; 375×667 & 390×844 untouched.
  Design-engineer re-cert **9.3→9.5** ("gap genuinely closed, no floor cost"); FLOOR held (28 configs);
  immutables byte-intact; 8 gates green.

Cycle-5 candidates — what separates the product-designer seat (9.3) from ≥9.5-from-all (highest-leverage first):

- **[composition] Climax not framed on arrival at laptop heights** — the **product-designer's #1** (holds it
  at 9.3): at 1280×700 the apex labels sit ~30–130px below the fold on step-3 arrival; no floor breach
  (panel scroll = 0) but the signature frame isn't guaranteed in view. Consider centering the stage on
  step-3 arrival without a page bounce. **Higher-risk** — touches the no-bounce / `preventScroll` design.
- **[nit] ES/EN floor asymmetry (new, cycle-4)** — at 320 the ES chart (86px) is shorter than EN (102px):
  ES's 4-line caption eats ~16px more than EN's 3-line, so ES gets ~16% less climax at the same 430px
  floor. Could shave the ES caption one more notch at ≤560×≤660.
- **[nit] Type-hierarchy compression (new, cycle-4)** — at 320/360 the pane title (12.5px) sits only 1px
  above the caption (11.5px); hierarchy now rests on weight/family, not size. A Linear/Stripe eye notices.
- **[nit] Ghost teardown** — after the FLIP settles, `.ld-ghost` persists parked at opacity 0 on the
  chart point; harmless (invisible, out of flow) but a top-tier teardown would remove it.
- ~~**[craft] Dark-mode step-3 axis contrast**~~ — **DISMISSED on measurement.** The dark labels are
  `#9CA3AE` on the `#1B1E24` pane = ~6.5:1 contrast, *higher* than light mode's ~4.6:1 (`#6B7280` on
  white); gridlines correctly darken to `#2C3038`. The design seat's "hair below light" is subjective,
  not a real deficiency — no fix (would over-brighten).
- **[composition] Step-4 CTA bottom-heavy** — the closing dark ink band ends ~55% down, leaving
  ~146–171px of empty ink before the control bar (documented trade-off; deflates the close).
- **[composition] Mobile dead space steps 1–2** — ~200px empty below the short vignettes in the fixed
  mobile stage.
- **[nit] Step-4 lockup under sticky nav** — with `preventScroll` nav, if the frame is scrolled up the
  "$19" lockup can slip partly under the sticky site nav (not a breach).

Still deferred (judges accept these as defensible trade-offs, not defects):

- **[climax] Inspectable chart datapoints** — hover/focus value chips; the three prices are already
  statically labeled, so chips across 3 SVG variants × 2 locales are high-surface / low gain.
- **[signature] Content-morph ghost** — the FLIP ghost is a decorative teal lozenge, not the row's
  literal text; both design judges call this "a deliberate abstraction to protect the no-reflow +
  immutable-number floor," so it stays abstract unless a safe content-morph is found.

## How to run one cycle (fresh session or here)

1. Ensure the HTTP server is up (`python3 -m http.server 8199` from repo root).
2. Run the improvement-cycle workflow (`.claude/workflows` or ad-hoc): it audits
   the live demo, generates diverse candidates for the top backlog gap(s),
   implements the best, verifies the FLOOR, certifies against the rising bar.
3. Ratchet: if min-score rose and the floor holds, commit + append a scorecard row
   + prune the closed gaps from the backlog. Else revert and record why.
