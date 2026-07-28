# UX/UI elevation — the dreaming backlog (plan of record)

Two adversarial "dreaming" workflows (2026-07-17) produced this plan: a **top-down
design-language dream** (6 system lenses → north star → brand+a11y judge + regression
red-team) and a **bottom-up per-surface dream** (19 surface types → dream → judge →
synthesis → completeness critic). Raw outputs are archived in the session task logs
(`w622ilesf` = design-language, `w4rwdqkzs` = per-surface). This file is the actionable
distillation and the safe build sequence.

Method holds: ground → build → audit → iterate; every visible change is verified on the
real render across the 7-viewport matrix (360/390/430/768/1024/1280/1512) in **both
themes** and **both languages**, gated, and committed per tier. Nothing loosens a gate;
the fabrication gate is absolute; cost-index/* and sheet pages get **surgical** edits
mirrored into their generators (drift hazard).

## North star

> muntin.digital reads like a quiet, credible trade-publication **data desk** rendered in
> CSS — an object of record, never a SaaS dashboard. The system resolves to a thin
> **semantic-role layer** (bg / surface / text / text-muted / border / accent / danger)
> over the existing hue palette, so meaning moves independently of hue and every role is
> AA in both themes **by construction**. Type is one modular scale (Fraunces for
> authority, Inter for the read, mono for numbers), calm even when Spanish stretches the
> strings. Space is an 8px rhythm plus one reading measure in `ch`; **desktop width is
> filled by widening gutters and letting data break wide, never by stretching prose**.
> Depth is one restrained idea — hairline `--line` + one soft elevation ramp. Motion
> turns like a page: fast, quiet, decelerating, never bouncy. Blue is the one accent; red
> is reserved for danger/data-negative; warm light stays in hero moments. Everything is
> additive at the token layer and migrated **adopt-as-you-touch** — an evolution of a
> working system across ~1,200 pages, not a rebrand.

### Principles
1. **Semantic roles over hues** — pages reference `--text/--surface/--accent/--danger/--border`; the hue names (`--teal`, `--rust`) become a private implementation layer. (Today `--teal` is actually royal blue `#2A50C8`, `--rust` a pure red `#C42E2E` — the names lie.)
2. **One dark mechanism** — the generated TOKEN-FLIP is the single source of dark truth; the Phase-5 `--mtn-*` override and `--refresh-*` family retire into it (no palette maintained twice).
3. **One modular type scale, no ad hoc sizes** — every heading/chrome size reads from a `--fs-*/--step-*` ramp; off-scale sizes retire adopt-as-you-touch.
4. **One rhythm system** — an 8px `--sp-*` scale + named measure tokens govern section rhythm, gutters, and content widths; reading measure in `ch` serves both languages.
5. **Depth = hairline + one soft elevation ramp** — never heavy shadow; elevation tokens carry a dark override so they never vanish on dark.
6. **Accessibility is structural, not documented** — role names encode safe use; one unified `:focus-visible` recipe; 44px targets; one reduced-motion floor.
7. **Restraint is the brand** — quiet decelerating motion, blue as sole accent, red for danger only, warm light quarantined; deliberate at every viewport and both themes.

### Convergent coherence themes (both passes independently)
- **Intentional desktop side-fill, not a global `--max` bump.** Every surface strands a phone-width column in a 1200 container. Fix via **scoped** per-surface widens pulling from **shared measure tokens** — never move the global `--max`/`--pad-x` (re-composes generated pages; the stated drift hazard).
- **Prose stays narrow (~68ch/720), data breaks wide** into the reclaimed gutter (figures, ledgers, tables, stat strips). Text measure is sacred; the width is for data.
- **One restrained interaction language** — index/record cards signal via a quiet **teal hairline** (+ optional `--cream-2` wash), never a `translateY` tile-lift or box-shadow (so no reduced-motion carve-out needed).
- **Hairline as the primary compositional tool** — 1px `--line` rules for section rhythm and the 1px-gap-over-`--line` panel technique; dark-safe because `--line`/`--cream-2` re-tokenize.
- **Of-record numerals as display figures** — one clamp display scale with `tabular-nums` so each surface's flagship number reads as the anchor.
- **Tone-grammar discipline** — rust = building/up, teal = easing; tint by measured direction, never repurposed as a category color.
- **Generator-mirror discipline** — surgical edits to cost-index/* and sheets/* mirrored into the generator strings or the next rebuild reverts them.
- **ES-parity by construction** — `ch` measures, `minmax(0,…)` tracks, higher multi-column breakpoints (768→900).

## Build sequence (adversarially vetted)

**Phase 1 — pure-additive token foundation (zero visual ripple; both lenses: "ship first").**
Declare in the **core `:root`** (must be core, or tool/article/generated pages get undefined vars — silent failure, trips no gate), seeded with today's dominant values, **referenced by nothing yet**:
- Semantic role layer: `--color-bg --surface --text --text-muted --border-muted --border --accent --accent-strong --danger`.
- Measure vocabulary: `--measure-prose:68ch --measure-panel --measure-wide`; `--grid-gap`; `--card-min`.
- Motion tokens: `--dur-fast:.12s --ease-standard:cubic-bezier(.2,0,0,1)` (+ `--ease-in`).
- `--status-bad:var(--rust)` (so error text stops being the brand accent), and split `--text-muted` vs `--border-muted` so the sub-AA `--stone-2` gray can't be grabbed for text.
- `--r-pill:999px` + stepped radius rungs (values unchanged for now).
- `:root:lang(es)` tracking relief (pure custom-prop, gate-safe, ES-only).
- `--elev-feature` with a dark override (fixes a real invisible-shadow-in-dark bug).
Then: build-css-shells → inject-css-shells → inject-css-cache-bust; run `check-css-shells` + `check-css-drift`; confirm no adopted `var()` references a token absent from core. **Inert = provably identical render.**

**Phase 2 — byte-identical reconciliation (renders identically, must clear contrast gate).**
Point `h1..h4` at `--fs-*` tokens (add `--fs-h1/--fs-h2` seeded from the current inline clamps; reconcile `--fs-h3` to the real rule); alias `--refresh-*` onto the flipped base and delete the Phase-5 `--mtn-*` dark override (re-run `check-dark-contrast.mjs` per surface — **not** byte-identical, a real dark shift). One unified `:focus-visible` recipe (scoped so inverse-surface focus still wins). Consolidate the reduced-motion floor to `0.01ms` (not `transition:none`, so `transitionend` still fires — gate behind a JS `transitionend` audit).

**Phase 3+ — adopt-as-you-touch per surface** (see per-surface tier below). Each is a
**scoped** widen/compose using the Phase-1 tokens, verified on the render.

### Red-team catches (do NOT bundle these as "inert")
- `--fs-body` fluid clamp is **not** inert (`17.5px` top ≠ current fixed `17px` → reflows every em-margin + `ch` measure across ~1,200 pages). Cap at `17px` top, or ship **alone, last**, individually QA'd.
- `--status-bad-deep` `#9A2727` ≠ `--rust` → it's a deliberate (on-brand, less-alarmist) darkening of fail text, not an alias. Verify on `--status-bad-tint` in both themes before repointing.
- Radius bumps (`--r-lg 8→12`) drift toward SaaS softness — hold the feature rung at **10px**, keep `--r-input` pinned at 6px, A/B in both themes before committing.
- Grid `auto-fit/minmax` + dropping the 960 media queries is **structural reflow**, not token-additive — do grid-by-grid, keep `.compare/.work` on explicit columns, test ES + orphan-card at 768/960.

## Per-surface top tier (highest-leverage, do first, all scoped)
1. **CI ingredient** — center the reading column on wide bands; kill the right-hand void.
2. **CI hub** — full-width data-desk masthead (composite + scorecard); 3-up tablet / 4–5 wide ingredient grid with teal-hairline hover.
3. **CI events** — wide ledger card (date/magnitude gutter + narrative); let the events zone use desktop width.
4. **CI weekly dispatch** — data figures break out of the reading column at ≥1024 (scoped `.ci-dispatch > .viz-figure`); recast re-price/watch flags as a scannable signal ledger (tone-grammar correct).
5. **Homepage** — stances → 3-up principles masthead at ≥1024; fix the orphaned 3rd service card at tablet-portrait; let the recently-added ledger breathe; full-width hero CTA stack on phone-sm.
6. **Design-system layer** (shared): measure tokens · teal-hairline hover convention · hairline-divided stat/about panel · section-break hairline rhythm · display-figure numeral scale.

(100 surviving per-surface changes total across 19 surfaces — full list in the `w4rwdqkzs` log.)

## Completeness-critic coverage gaps (add to scope)
1. **Global chrome** — nav/footer, **mobile drawer**, search overlay (cap to `--measure-panel`), theme/lang switch 44px targets. Renders on 100% of pages; audited by nobody. (Mirror into `_includes/es/`.)
2. **Empty / loading / validation states** in the six input tools + vendor-benchmark sparse-data — **absent** today; a page that only looks composed when populated fails "native feel" on arrival.
3. **Print** — weak, and actively endangered: neutralize every new `translateX` breakout + `position:sticky` in `@media print`; hairline panels must print as `border` not background. Operator sheets are print artifacts; the dispatch is citable.
4. **Muntin Ledger product page** (`/ledger/` + `/demo`) — a named funnel pillar, entirely uncovered.
5. **Long-form legal/policy template** (privacy/terms/cookies/accessibility ×EN+ES = 8 pages) — same stranded-column bug; one template edit covers all.
6. **The other four tools** (cost-pulse, margin-math, menu-engineering, audits) + `tools/start` — bespoke inline `<style>`, don't inherit fixes.
7. **CI provenance sub-pages** (sources/methodology/lab/basket/calibration) — the credibility backbone; same template problems + dense tables.
8. **404** (EN+ES) — real first-impression surface for mis-routed/AI-Overview traffic.
9. **Interaction ladder below hover** — one theme-aware `:focus-visible` token, `:active` state, keyboard traversal of new chips/filters; a shared `--dur/--ease` so micro-interaction timing doesn't drift the way widths did.
10. **Reduced-motion of EXISTING motion** — audit viz-scroll/spark/toggle/drawer, not just avoid it in new work.
11. **ES end-to-end** — audit a real ES surface at 360 & 1512; resolve the `.article-figure` (ES) vs `.viz-figure` (EN) scope mismatch so widened figures aren't silently left narrow on ES mirrors.
