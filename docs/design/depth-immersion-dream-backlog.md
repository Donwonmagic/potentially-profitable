# Depth & immersion — the dreaming backlog (plan of record)

Seven adversarial "dreaming" lenses (2026-07-23) — spatial-depth, living-instrument,
cartographic, material-honesty, temporal-depth, cutting-edge-tech, data-immersion — were
run to a north star, three independent syntheses, and a completeness critic that returned
`readyToBuild:false` with nine gaps, seven risks, and nine recommendations. This file is
the actionable distillation: the resolved stance, the reusable depth system, the safe
build sequence, and the crown-jewel hero moment to prototype first. It is the companion to
`elevation-dream-backlog.md` (that one resolves *layout and token roles*; this one resolves
*depth, confidence, and the instrument metaphor*).

Method holds: ground → build → audit → iterate; every visible change is verified on the
real render across the 7-viewport matrix (360/390/430/768/1024/1280/1512) in **both
themes** and **both languages**, on a real mid-range 360px Android before it touches the
crown jewel, gated, and committed per tier. Nothing loosens a gate; the honesty contract
and the fact gate are absolute; cost-index/* pages get **surgical** edits mirrored into
their generators (drift hazard). The completeness critic's `readyToBuild:false` verdict
stands until the confidence-tier fork (below) is resolved against real calibration data —
so Phase 1 ships the `/about/` read *first and standalone* and the system migration
follows only after that read's return-lift is measured.

## North star

> **One instrument language.** A recessed glass Well holding a certified read, wrapped in a
> plain-language confidence label, carried off the stranded homepage `.ci-inst` and down the
> **entire** Cost Index funnel (hub, ~81 ingredient pages, events history, weekly dispatch)
> and, first of all, onto `/about/`, where the site pledges "the same numbers I check on my
> own floor" and today shows none. The three dialects (`ci-*`, `evh-*`, `viz-*`) collapse
> into named regions of that one instrument. The operator stops feeling like he is browsing
> four differently-dressed articles and starts feeling like he is operating one calibrated
> desk he already knows how to hold — where the depth he can see (how solidly the number is
> set, how the line inks itself, how a thin read stays visibly provisional) is always a fact
> he can trust, never a mood applied on top of it. Trust converts to habit at the exact
> sentence where belief is pledged; the read is honest on arrival at every viewport, in both
> themes, with motion off; and a weekly desk finally has an honest reason to bring him back
> Tuesday.

### The resolved stance — restraint-as-craft (tension decided)

The central tension — genuine cutting-edge depth vs. the brand's restraint, honesty, and
trust — is **resolved decisively in favor of restraint-as-craft.** Restraint IS the runway
and the spine of this plan, but restraint executed with such craft that a browser engineer
clocks the tolerance while a tired FOH manager on a cracked 360px phone at 11pm just feels a
precision instrument on a clean worktop.

The load-bearing rule: **depth must MEAN something or it does not ship.** Every millimeter of
recession, every hairline that thickens, every line that inks itself must encode a real data
fact — confidence, direction, provenance, freshness — never mood, never sizzle. The most
honest rendering is also the most modern one, precisely because it is structural and quiet
where every SaaS product is glassmorphism and shimmer.

The discovery all three syntheses reached independently: **honesty is carried by WORDS
first.** An AA-legible, screen-reader-exposed, EN+ES-narrated confidence *label* is the
primary trust signal; visual depth is a strictly redundant, gate-enforced second channel.
The number itself is sacred and static — never animated, never dimmed to signal doubt,
never a point-estimate needle, never counted up through unsourced intermediates.

We push the 2026 platform hard (container queries, typed `@property`, cross-document View
Transitions, self-inking SVG) but every frontier path is progressive enhancement with a
correct, complete static final state, hard-cuts on the target device, and is measured on a
real low-end Android before it reaches the crown jewel — so the bleeding-edge render and the
certified plain render are **byte-identical in meaning.** And because this is a weekly desk
for one person, we sequence pragmatically: Phase 1 is the cheap, reusable, high-traffic
trust core (it pays for itself standalone), motion and the return loop come second, frontier
garnish comes last and is the first thing cut if budget is tight.

## Guiding principles

1. **The number is sacred, static, and always fully legible.** Every digit stays in certified
   ink at AA in **both** themes at every confidence tier. Never animated in weight, never
   tweened through non-source intermediates, never a needle, never dimmed or recessed to
   signal doubt. Uncertainty is expressed AROUND the number (label, rule, hatch, dated stamp),
   never inside it — the least-certain reads are often the most decision-relevant.
2. **The word is the trust signal; depth only echoes it.** Every read carries a plain-language,
   AA-legible, screen-reader-exposed, EN+ES-narrated confidence label as the PRIMARY carrier.
   Material weight, border rule, and hatch are strictly redundant, never higher in the
   hierarchy, never the sole channel. A low-confidence read must read as low from the words
   alone on a dimmed cracked screen and to a screen reader.
3. **One metaphor: muntin glass.** Depth is a shallow well cut into the glass worktop, or a
   pane floated in front of it — a hairline plus one soft elevation ramp, two planes maximum.
   No paper/deboss/letterpress, no cartographic terrain, no generic glassmorphism blur, no
   per-card `translateZ`, no `preserve-3d` beyond the site's single sanctioned `.window`
   object, no parallax, no canvas shader.
4. **Signal color means exactly one thing.** Teal (easing/down) and rust (building/up, danger)
   are spent ONLY on measured direction, and only when movement clears noise — never on scan
   chrome, freshness, reveal chrome, ambient wash, or decoration. Certainty is achromatic
   weight, which is exactly what frees the signal hues to stay crisp. No fourth hue.
5. **Warmth stays quarantined.** `--gh-eve` and Golden Hour never touch a Cost Index data
   surface or its frame plane — the of-record read must render identically at 11pm and at
   noon. Keying an instrument's frame to dusk is a lawyerly breach of a gated boundary.
   Warmth lives only on `.hero`/`.window` chrome where the gate already confines it.
6. **No manufactured liveness.** Freshness is a dated text stamp ("as of <date>" / "holding
   last-good since <date>"), never a breathing dot, live scan, or "taking a reading" gesture
   over a frozen weekly snapshot. A weekly of-record read renders identically at 11pm and
   noon. No number ever animates through unsourced intermediate values.
7. **Motion is one-shot, session-scoped, compositor-only enhancement with a correct static
   default.** Every animated element ships fully composed at rest (`dashoffset:0`, settled
   weight, placed marker); motion only overrides inside `prefers-reduced-motion:no-preference`,
   fires once, never loops, never re-fires on scroll or re-stick, is never reversible or
   scroll-scrubbed. Frontier render and certified plain render are byte-identical in meaning.
8. **Animate only the observed series, never the model.** The self-inking line draws the
   genuinely observed weekly price path; the seasonal/normalized curve reveals by simultaneous
   fade (no directional "pen" implying a forecast); reconstructed backfill is a visible break,
   never bridged, never occupying the certified numeral with measured chrome.
9. **Depth-of-state is a first-class deliverable, designed first.** Empty, thin, "too new to
   call", "holding last-good", "withheld — re-anchored", and **malformed-snapshot** each have a
   composed, honest, native-on-arrival rendering with zero JS. A page that only looks finished
   when populated is a failure of native feel.
10. **Honesty is enforced by gates, not vibes.** The certainty scale's low<high ordering, the
    label's presence, per-tier AA/3:1 in both themes, the withheld-week-over-week seam, the
    events-are-co-occurrence separation, EN↔ES label parity, and any duplicate
    view-transition-name are all CI-checked — because shadow/transform/opacity can silently
    invert across a theme flip or token bump, and this codebase's culture is that the fact gate
    is absolute.
11. **Retention is a trusted number mapped to a decision he owns, plus an honest reason to
    return.** Prefer a visit-relative "new since you last looked" (localStorage, CSP-self, sent
    nowhere, never claiming novelty for a number already seen) and the weekly-dispatch cadence
    over any manufactured-liveness cue.
12. **Reuse the substrate; every frontier feature is progressive and measured.** Extend
    semantic tokens and shipped keyframes, keep a single named IntersectionObserver, lift the
    shared instrument CSS out of the ~29KB per-page inline block into one cached stylesheet
    BEFORE adding a rule. Every bleeding-edge path is `@supports`-guarded, hard-cuts to a
    correct static state, and is proven on a real mid-range 360px Android for CLS/INP/battery
    before it reaches the crown jewel.

## The depth system — reusable primitives

Each primitive states its build technique, how it **extends the existing substrate**, and how
it honors the four hard gates (honesty, zero horizontal scroll, `prefers-reduced-motion`,
static/no-framework/one-person). All render byte-identical in meaning with JS off.

### 1. The Glass Well — the single depth primitive

**Role.** The shared chrome that collapses `ci-*`, `evh-*`, and `viz-*` into one instrument the
operator paginates through. The read is set INTO a shallow well cut in the glass worktop —
gravity by recession, not by floating on a card — resolving the metaphor collision decisively
toward the sanctioned muntin/glass motif and killing the competing paper/letterpress language.

**Technique.** Two glass planes only: the worktop (`var(--surface-0)`) and a shallow inset
well holding the certified read. Token-only, static, no `filter`, no blur beyond 1px:
`background:var(--surface-inset)`; `box-shadow: inset 0 1px 1px var(--well-lip), inset 0 0 0
1px var(--line)`; `border-radius:var(--r-sm)`. The outer frame carries the page's ONLY lift,
`--elev-feature`. No perspective, no `translateZ`, no blurred back-pane, no per-card 3D. The
well is CONSTANT — it never dims or recesses the number by confidence; confidence lives
entirely in the label + rule + hatch.

**Extends the substrate.** Uses `--surface-inset`, `--line`, `--r-sm`, `--elev-feature` — all
declared-but-underused tokens. **Guardrail (critic gap #4):** the inset lip is a *tokenized*
`--well-lip`, NOT a hardcoded `rgba(20,22,26,.07)`; ship its dark-theme override alongside
`--elev-feature`'s (contrast-verified first) so the well never reads wrong or invisible on
`--surface-inset` in dark. Authored ONCE in a shared cached stylesheet (lifted out of the
~29KB per-page inline `<style>` first — proving per-page KB goes DOWN, not up) and emitted from
the generators so ~200 EN+ES pages dedupe it; mirrored across bundles to hold
`check-css-drift`.

**Gates.** *Honesty:* the well is constant — it can never make a thin read look solid.
*Zero-scroll:* pure box model, no width. *Reduced-motion:* static by construction, no motion.
*Feasibility:* token-only CSS in one cached file, emitted by existing generators.
**Forced-colors / print (critic gaps #2, #3):** the inset shadow and any hatch are stripped by
forced-colors and print-background-off. Stated degraded state — confidence survives on
`border-STYLE` (see primitive 2), which forced-colors and print both keep. The gate asserts
tiers differ in border-*style*, not only width/hatch, so the redundant channel is real where
backgrounds vanish.

### 2. Confidence-as-ink (the certainty scale)

**Role.** The honesty contract rendered in the pixels AND the a11y tree AND the EN+ES audio: a
low/thin read structurally cannot look as solid as a high-confidence one, while the number
itself never drops below AA and is never the sole carrier.

**Technique — PRIMARY (source of truth):** an always-present plain-language chip, full size, AA
in both themes, programmatically associated **and** placed in a visually-hidden span **before**
the number in DOM (critic gap #6 — `aria-describedby` alone is announced last; to meet the
"tier → number → Not-your-prices" order, the tier and negation sit in the accessible name /
a `.vh` span ahead of the figure). Present verbatim in EN+ES `data-audio-alt`.
**REINFORCEMENT:** an achromatic frame rule that thickens with certainty (`2px solid var(--ink)`
→ `1px solid` → `1px dashed`), every level clearing 1.4.11 3:1 in both themes, plus a
`repeating-linear-gradient` hatch whose alpha rises as confidence falls, dissolving "solid"
into "weave."

**Extends the substrate.** `--ink`, `--line`, `--stone` only; teal/rust never spent here —
certainty is achromatic weight, which is what keeps signal hues pure. Optional `@property
--ci-conf {syntax:'<number>'}` quantized to real tiers drives a one-shot reveal settle in
`no-preference` ONLY; the static gradient is the deliverable.

**Guardrail — the tier fork is load-bearing (critic risk #1, gaps #1/#7).** The chip vocabulary
("measured" / "provisional" / "too new to call") maps to *nothing the pipeline emits today* —
the editions snapshot carries `confidence:'high'|'medium'`, the 81-page calibration emits
`directional/low/medium/high`, and `cost-confidence-calibration.json` shows realized hit-rate
is **non-monotonic** (directional +0.013, low −0.021, medium +0.006), so rendering "low" as
*more* solid than "directional" would gate-bless an honesty breach. Therefore: **the gate
enforces the CALIBRATION invariant** (each published tier verifies ≥ the next-lower on realized
hit-rate) as fail-CI, and the solidity ramp is DERIVED only from tiers that pass it. Since
low<medium currently fails, **ship at most a collapsed, monotone 2-state** ("calibrated /
measured" vs "not-yet-calibrated / too-new") mapped 1:1 to a real sourced field. The exact
label strings + EN/ES translations are registered in `data/sourced-claims.json` and run through
`check-fabrications` + `check-audio-fabrications` so the generator never emits label text no
field contains. Do NOT ship a 3- or 4-step ramp until calibration is monotone (parallel
data-desk track).

**The new gate — `check-cost-index-confidence.mjs`.** Asserts: label present; low<high solidity
ordering derived only from calibration-monotone tiers; per-tier AA (number) + 3:1 (rule) in
both themes; tiers differ in `border-style` (forced-colors/print survival); and **EN↔ES
label-present parity plus the ~15-20% longer ES chip fitting the width-reserved number box with
zero horizontal scroll at 360px** (critic gap #7).

**Gates.** *Honesty:* label-primary, calibration-monotone, number never dimmed. *Zero-scroll:*
ES chip width verified by the gate. *Reduced-motion:* static gradient is the deliverable; the
`@property` settle is `no-preference`-only. *Feasibility:* attribute-selector CSS, one gate.

### 3. The self-inking line

**Role.** The "SVG that draws itself in" the retention brief asks for — honest, because it inks
exactly the true observed price path, so the reveal feels like the instrument responding, never
a loading shimmer or a forecast trajectory.

**Technique.** `stroke-dasharray`/`stroke-dashoffset` via SVG `pathLength="1"` normalization (no
runtime `getTotalLength`), one-shot on the reveal observer, ~700ms `var(--ease-out)`,
compositor-only. Base/no-JS/reduced-motion/print state is FULLY DRAWN (`dashoffset:0`); the
undraw→draw applies ONLY inside `@media (prefers-reduced-motion:no-preference)`. Restricted to
the genuinely OBSERVED weekly series — the seasonal normal reveals by simultaneous fade (no
directional pen), reconstructed backfill is a visible break, never bridged. No `feDropShadow` on
the animating path. Not reversible, not scroll-scrubbed. Every instrument SVG carries
`role="img"` + `aria-label` + a visually-hidden data table.

**Extends the substrate.** Reuses the shipped `stroke-dashoffset` reveal transition and the
site's reveal observer. **Guardrail (critic risk #3):** the plan's "single IntersectionObserver"
premise is FALSE — there are five (`article-viz.js`, `site.js`, `glossary.js`, `listen.js`,
`tools/_shared/cost-index-ui.js`). The self-inking line must **explicitly join one named
observer or own the cost of a documented new one** — never plan on "the single IO." **Guardrail
(critic gap #9):** a JS-on + reduced-motion-off + low-end-GPU device can drop the stroke
animation mid-draw; the partial-draw frame must itself be a valid honest state (a truthful
partial of the real path), and any spark that janks is dropped in favor of its static
fully-drawn treatment.

**Gates.** *Honesty:* observed series only, reconstructed break not bridged, seasonal excluded.
*Zero-scroll:* `viewBox`-scaled `width:100%`. *Reduced-motion:* default fully drawn.
*Feasibility:* hand-rolled SVG, one observer join.

### 4. The one-shot neutral boot scan

**Role.** Carries the homepage's truest "inside the instrument" beat down the funnel — as a
single settling gesture, never the twitch the brand forbids and never implying live measurement
over frozen weekly data.

**Technique.** Reuse the shipped `@keyframes ci-scan`, **recolored to a NEUTRAL hairline (off
teal, so no signal hue is spent as chrome)**, fired EXACTLY ONCE per page on true first paint of
the edition via `[data-boot]` tied to the edition `asOf` — never replayed on scroll, sticky
re-attach, or re-entry; never run over a last-good/stale edition framed as "taking a reading."
Element-relative sweep distance (not a hardcoded 360px) so it never leaks past a thin shape into
neighboring content. Suppressed entirely under `prefers-reduced-motion`, leaving the composed
final state.

**Extends the substrate.** Reuses `ci-scan` verbatim (recolored), and the `[data-boot]` hook.
**Guardrail (critic risk #5):** `ci-scan` is already duplicated across `site-core.css` and
`site.css`; before lifting it into "one shared stylesheet mirrored across bundles," diagnose why
two bundles carry the same keyframe so drift surface does not grow.

**Gates.** *Honesty:* neutral hue, never over stale data as "live." *Zero-scroll:* element-relative
sweep. *Reduced-motion:* suppressed. *Feasibility:* existing keyframe.

### 5. The Container Ledger + slim masthead

**Role.** Native at every viewport by *element* width, not viewport media queries — the same
instrument is correct in a 360px phone, a thin embed, `/about/` prose, and a wide worktop. The
cleanest, least-contested frontier win, with zero horizontal scroll.

**Technique.** `container-type:inline-size` on `.ci-inst`; rows reflow via `@container (min-width:
34rem){…}`. Any sticky masthead is height-budgeted in `dvh`, collapses to a single line on stick,
reserves its box for zero CLS, uses `scroll-padding-top` so focus is never obscured (WCAG 2.4.11),
and MUST be proven at 360×640 in EN and the longer ES to keep the top mover above the fold — else
it is cut in favor of number-first-then-out. Real `<a>`/`<button>` rows with visible AA focus
rings; `tabular-nums` + a width-reserved number box so nothing reflows.

**Extends the substrate.** New use of `container-type` (progressive; the static single-column
layout is the correct fallback where unsupported). **Guardrail (critic gap #8):** the "wide embed"
use case has **no CSP-safe delivery** — a live cross-origin iframe is impossible under
`default-src 'self'`, and a copy-paste partial reintroduces loading/error states. Scope the
container query to the *in-site* width cases (phone / prose / wide worktop) and drop "embed" as a
delivery target until a real mechanism exists.

**Gates.** *Honesty:* layout only, no data claim. *Zero-scroll:* container queries + width-reserved
box, gate-verified in ES. *Reduced-motion:* no motion. *Feasibility:* pure CSS.

### 6. Freshness-as-stamp + the Visit Delta

**Role.** Answers the operator's real question ("is this current, or stale since Tuesday?")
honestly with no manufactured aliveness, AND supplies the one genuine return-cadence trigger a
weekly desk lacks — arguably the highest-leverage retention move in the plan.

**Technique.** A dated text stamp ("as of <date>" / "holding last-good since <date>"), AT-exposed
and non-color (a shape/label difference, not teal-vs-gold alone), present identically with motion
on or off; no breathing dot, no infinite pulse, no live scan. It carries the mandatory "wholesale
reference · Not your prices" chip everywhere the read renders. Layered on top: an optional "new
since you last looked" computed by comparing a `localStorage` last-seen edition `asOf` (CSP
`default-src 'self'`, sent nowhere) — strictly VISIT-relative, never edition-absolute, so it never
claims novelty for a number he already saw. No timers, no polling. Paired with the weekly-dispatch
email as the primary return channel.

**Extends the substrate.** Text + existing chip grammar; the Visit Delta is client-only
`localStorage`. See open fork #2 — whether even visit memory sits right with the "of-record,
nothing tracked" posture is a founder call.

**Gates.** *Honesty:* dated stamp, visit-relative only, "Not your prices" never dropped.
*Zero-scroll:* text. *Reduced-motion:* no motion at all. *Feasibility:* trivial JS, no network.

### 7. Depth-of-state faces

**Role.** Makes every state composed on arrival so the instrument feels native the instant it
loads and honesty is felt before it is read — a page that only looks finished when populated is a
failure.

**Technique.** `data-confidence` + `data-freshness` attributes select a complete static face with
zero JS: an empty ruled well with a single first-read tick for "too new to call — N weeks needed";
a hatched/dashed provisional treatment for low confidence; an explicit "holding last-good since
<date>" stamp for stale; a composed "withheld — re-anchored" block with no floating delta across a
re-weight (reason pulled verbatim from the edition's own field); events rendered visibly lighter
than a measured read. **Guardrail (critic gap #5):** define the **malformed / partial-snapshot**
build-time behavior explicitly — a schema-drifted or confidence-field-missing `editions.json`
either **fails the build** (preferred for the crown-jewel funnel) or falls to the labeled
illustrative face; the choice is specified, not left load-bearing-and-undefined. Every face ships
correct in both themes at 360px.

**Gates.** *Honesty:* each state honest by construction, malformed-day behavior specified.
*Zero-scroll:* static faces. *Reduced-motion:* zero JS, zero motion. *Feasibility:* attribute
selectors + generator branch.

### 8. The Traveling Read (cross-document View Transitions — Phase-3 gated garnish)

**Role.** The genuinely next-gen move: the Cost Index feels like one terminal you paginate, the
certified number physically persisting across navigation — kept strictly progressive, never
load-bearing, the first thing cut if one-person budget is tight.

**Technique.** `@view-transition{navigation:auto}` progressively; the generator stamps a per-slug
`view-transition-name` ONLY on a read that is byte-identical (same measurement, unit, baseline)
between two pages — a hub composite HARD-CUTS to a per-ingredient read, never morphs a false
identity. Quiet `var(--dur-fast)`/`var(--ease-spring)`; `::view-transition-group animation:none`
under reduced-motion; the number renders at final value/weight on first paint (no variable-font
settle on the of-record figure). A new `check-view-transition-names.mjs` gate FAILS the build on
any duplicate name (a collision silently kills transitions site-wide). Unsupported browsers and
the 360px target hard-cut and lose nothing — the "one instrument" feeling must already hold
without it (critic risk #7 confirms: correctly gated, LOW residual risk, first to cut).

**Gates.** *Honesty:* byte-identical values only, collision-gated. *Zero-scroll:* navigation only.
*Reduced-motion:* `animation:none`. *Feasibility:* `@supports`-guarded, second code path is the
first budget cut.

## Per-surface application (Cost Index is the centerpiece)

### `/about/` — the flattest, highest-leverage retention gap (SHIPS FIRST, STANDALONE)

THE flagship. Inject the real last-good frozen basket read in a Glass Well at the exact sentence
that promises "the same numbers I check on my own floor," so the claim and the instrument occupy
one space. Generator-produced from the newest `data/cost-index-editions.json` snapshot at build
time (no client fetch, CSP `default-src 'self'`, the container has no keys so it uses the same
last-good snapshot the dispatch already trusts), EN+ES mirrored, stamped with its `asOf`, carrying
the FULL "wholesale reference · Not your prices" chip — **the negation is NOT dropped;** this is
where a skeptic most mistakes wholesale for a quote. Confidence-as-ink label-primary; last-good and
illustrative-sample fallback faces so it is never empty. Adds provenance, not staging; needs none
of the rest to earn its keep, which is why it is Phase 1a and everything else gates on its measured
return-lift.

### Cost Index hub (`/cost-index/`)

Replace the weaker `.ci-composite` top block with the promoted `.ci-inst` masthead as a Container
Ledger; unified Glass Well chrome; confidence-as-ink per readings row + freshness stamp + the single
session-scoped one-shot boot scan. Readings stay a discrete, high-contrast list where ONLY flagged
movers carry signal color — **NO** 81-cell shaded relief/heatmap (illegible on dim phones,
GPU-heavy), **NO** cross-basket terrain (ingredients are independent stations, never one connected
landform), **NO** market-weather canvas (perpetual loop = battery/INP/LCP regression + "nothing
loops" breach). Height-budgeted so the top mover stays above the fold at 360px in EN and ES.

### ~81 ingredient pages (`/cost-index/<slug>/`)

The instrument masthead synthesized per-slug: the number set in the Glass Well with confidence-as-ink
label + achromatic rule; a one-shot self-inking sparkline on the genuinely OBSERVED series
(measured/reconstructed boundary drawn as a visible break, never bridged); a LINEAR seasonal
"you-are-here" locator framed explicitly as a recurring historical normal (not a radial gauge, no
"tilts next" forecast language), with a composed "still learning this season" building state.
Position shown against the ingredient's OWN baseline, never a signed WoW. The sparse "too new to
call" page is first-class: composed on arrival with a printed "reading pending — N weeks needed,"
dashed rule, no faked line.

### Events history (`/cost-index/events/`, `evh-*`)

Adopt the Glass Well shell so it reads as the same machine in "event log" mode, but render events
visibly LIGHTER and less-set than a measured read, on a SEPARATE rail — never a mark sitting on the
price curve, never a shared elevation glyph implying slope, so co-occurrence never borrows measured
authority. "Co-occurrence, not cause" stated inline AND in the EN+ES audio-alt. (See open fork #5:
how much lighter / how separated is "enough" — resolve on a real dim 360px device, and confirm the
shared grammar is worth the causation-adjacency risk *before* committing `evh-*` to the Well.)

### Weekly dispatch (`viz-*`)

Inherit the Well + confidence-as-ink + Container Ledger masthead in "weekly print" mode;
`viz-spark`/`viz-bars` gain the self-inking line on observed series only. Add the edition filmstrip
LATER (Phase 3): a native `<input type=range>` (keyboard-arrowable, `aria-valuetext=asOf`) over the
append-only editions, re-weight/re-anchor boundaries drawn as a visible notched seam with the
withheld-WoW note pulled verbatim from the edition's own field, reconstructed seed editions hatched
with a distinct grammar so credibility never transfers to them. Gated behind an N-real-editions
threshold so it never ships as a half-synthetic 4-frame scrub.

### Homepage `.ci-inst` — the front door

Promote from stranded one-off to the canonical instrument the operator re-meets everywhere else,
rebuilt on the exact shared grammar. Keep the illustrative sample basket and its one-shot boot, but
spend no liveness or gravity theater on a sample number; do NOT bind its frame to `--gh-eve`. This
ends the stranding that is the brief's richest territory.

### Cross-surface (Phase 3, optional)

The Traveling Read stitches hub → ingredient → dispatch via gated cross-document View Transitions so
the certified number physically persists across navigation — byte-identical values only, per-slug
names stamped by the generator, a duplicate-name CI gate, hard-cut on the target device. The
coherence payoff of dialect unification made literal, progressive, never load-bearing.

## Build sequence (adversarially vetted)

The completeness critic's key structural correction (risk #4) is folded in: **Phase 1 is split.**
Only the `/about/` read "pays for itself standalone"; the rest of the old Phase 1 is a system
migration and must gate on 1a's measured lift.

### Phase 1a — the standalone trust read (genuinely cheap; ship + measure)

**Goal.** Close the flattest retention gap with the smallest possible change, and get a measured
return-lift signal before authorizing the migration.

- Ship the `/about/` live/last-good Glass Well read STANDALONE — full "Not your prices" chip +
  `asOf` + last-good/illustrative fallback faces, EN+ES, generator-produced from the newest
  editions snapshot. Define the malformed-snapshot build behavior here (fail vs illustrative).
- **Verification (provably inert / safe):** this is *additive* — a new block on one page pair, no
  shared-CSS change, no gate loosened. Verified by: rendering identical at 11pm and noon (frozen
  edition, no runtime); zero horizontal scroll in EN and the ~15-20% longer ES at 360px; the "Not
  your prices" chip + `asOf` present in the a11y tree and the EN+ES `data-audio-alt`; the read
  correct with one data point, last-good, or none. Passes existing gates as-is; adds no CSS to the
  shared bundle so `check-css-drift` is untouched.

### Phase 1b — the trust core / system migration (gates on 1a's lift)

**Goal.** Put the honesty contract into the pixels + a11y tree + EN/ES audio across the funnel, with
zero motion, zero JS-dependent meaning, zero GPU cost — every piece correct at 360px, in dark theme,
and to a screen reader on arrival, clearing existing gates as-is. This is a migration, not a
one-liner; it is authorized only after 1a measures a real lift.

- Lift the `ci-*` grammar OUT of the ~29KB per-page inline `<style>` into one shared cached
  stylesheet BEFORE adding a rule (**prove per-page KB goes DOWN, not up**), and extract `.ci-inst`
  into a shared `_includes` partial the generators emit per-slug. Diagnose the existing
  `ci-scan`-in-two-bundles duplication first (risk #5) so drift surface does not grow.
- The Glass Well primitive unifying `ci-*`/`evh-*`/`viz-*` containers at the shell level (hub,
  events, dispatch adopt the masthead top row; interiors adopt-as-you-touch). Tokenize `--well-lip`;
  ship the dark `--elev-feature` + `--well-lip` overrides AA-verified first.
- Confidence-as-ink as a STATIC treatment: always-present AT-exposed EN+ES label (primary, in a
  `.vh` span *before* the number for announce-order) + achromatic thickening rule + hatch; number
  always AA at every tier; tiers differ in `border-style` (forced-colors/print survival); events
  lighter than measured reads. Mapped only to real, calibration-monotone sourced tiers — ship the
  honest collapsed 2-state now.
- `check-cost-index-confidence.mjs`: label-present, calibration-monotone low<high ordering, per-tier
  AA/3:1 both themes, border-style differentiation, EN↔ES label parity, ES-chip zero-scroll at 360px.
- Freshness-as-stamp replacing any liveness cue; kill breathing/live-scan framing everywhere.
- Depth-of-state faces (measured / thin / too-new / holding-last-good / withheld-re-anchored /
  malformed) composed with zero JS.
- Container Ledger reflow (`container-type:inline-size`), verified zero horizontal scroll at 360px in
  EN and ES.
- **Verification:** shared-CSS change → run `check-css-shells` + `check-css-drift`; prove per-page KB
  decreased; the new confidence gate green in both themes; locale-parity gate green; 7-viewport ×
  2-theme × 2-lang render pass; screen-reader announce-order check on `/about/` and one ingredient
  page.

### Phase 2 — motion, coherence, and the return loop (progressive; correct static default)

**Goal.** Add the "inside the instrument" feeling on top of an already-complete static surface, unify
the three dialects fully, add the honest reason to come back — with correct reduced-motion/no-JS
defaults and cost validated on a real low-end Android.

- Self-inking OBSERVED sparkline (`pathLength="1"`, one-shot on a **named, audited** observer — join
  one of the five or own a documented new one; base fully drawn, no `feDropShadow`, non-reversible,
  seasonal excluded, reconstructed break not bridged, SVG a11y text equivalent, partial-draw frame
  is a valid honest state).
- One-shot neutral boot scan carried to hub/ingredient hero (once per edition via `[data-boot]`, no
  replay on scroll/stick, suppressed under reduced-motion, never over stale data as "live," recolored
  off teal).
- Fold `evh-*` and `viz-*` fully into the Well chrome (events lighter; dispatch masthead as ledger).
- Linear seasonal you-are-here locator, historical-normal framing, with a composed "still learning
  this season" building state.
- The Visit Delta return trigger: dated last-good stamp + optional `localStorage` "new since you last
  looked" (CSP-self, sent nowhere, visit-relative). Treat as a real deliverable, not garnish — pending
  founder fork #2.
- A CI gate asserting reconstructed→hatched and low-confidence never renders as solid as high (the
  honesty invariant fails-CI).
- **Verification:** benchmark scroll/INP/CLS/battery on a mid-2019-class 360px Android BEFORE rollout
  across ~200 pages; drop any piece that janks or blurs numerals for its static treatment.

### Phase 3 — frontier garnish (capable browsers only; first to cut if budget is tight)

**Goal.** Reward capable browsers with genuinely 2026-platform craft the target device can safely
skip — each behind `@supports` with a byte-identical certified fallback, only after proving it costs
the operator nothing.

- The Traveling Read via cross-document View Transitions (byte-identical numbers only, per-slug names
  stamped in the generator, no variable-font settle on the number).
- `check-view-transition-names.mjs` collision gate + hard-cut fallback.
- Edition filmstrip scrub on the dispatch once enough REAL (non-reconstructed) editions exist
  (re-weight seams shown, WoW withheld with its stated reason, seeds hatched), gated behind an
  N-real-editions threshold.
- `@property` confidence-gradient tween and `animation-timeline:view()` sugar, each `@supports`-guarded
  with a correct static fallback and a named IntersectionObserver remaining canonical.
- **Verification:** re-benchmark CWV/battery on a 2GB-class 360px Android before each ships; drop
  anything that delays time-to-number.

## The hero moment to prototype first

**Prototype ONE static component and ship it standalone: the unified instrument on `/about/`,**
mounted at the exact sentence that promises "the same numbers I check on my own floor." No motion
required for meaning, no JS-dependent meaning, no View Transitions. It is the flattest,
highest-leverage, cheapest move in every synthesis, and it forces resolution of the
confidence-encoding fork that every other surface inherits.

**Spec.**

1. **Data.** A build step in the `/about/` generator (EN + ES, mirrored) reads the newest snapshot in
   `data/cost-index-editions.json` at generate time — no client fetch, CSP `default-src 'self'`, the
   container has no keys so it uses the same last-good snapshot the dispatch already trusts. States:
   *fresh* → measured face with visible `asOf`; *stale* → explicit "holding last-good since <date>"
   text stamp (never a breathing dot); *no snapshot* → labeled illustrative sample basket so the page
   is never empty on arrival; *malformed* → specified build-time outcome (fail the build, or fall to
   illustrative — chosen, not undefined).
2. **Shell.** One `.ci-inst` emitted from the shared `_includes` partial, rendered inside the Glass
   Well — `background:var(--surface-inset)`; `box-shadow: inset 0 1px 1px var(--well-lip), inset 0 0 0
   1px var(--line)`; `border-radius:var(--r-sm)`; a single `--elev-feature` lift on the outer frame is
   the only shadow. The big figure is mono `tabular-nums` in full `--ink` at AA in BOTH themes; top
   movers each in the same Well grammar; direction-only teal/rust on movers.
3. **Confidence.** An always-present plain-language chip is the PRIMARY signal ("measured" /
   "provisional" / "too new to call" — or the calibration-monotone 2-state if that is what the field
   emits today), full size, AA in both themes, programmatically associated **and placed in a `.vh`
   span before the number** so a screen reader announces tier → number → "Not your prices"; present
   verbatim in the EN+ES `data-audio-alt`. REINFORCED by an achromatic frame rule that thickens with
   certainty (`2px solid` → `1px solid` → `1px dashed`) plus a `repeating-linear-gradient` hatch that
   rises as confidence falls — every rule level clears 1.4.11 3:1 in both themes, and tiers differ in
   `border-style` so the channel survives forced-colors and print. The number is NEVER dimmed,
   recessed, or faded to signal doubt; uncertainty lives only in the label, rule, and hatch AROUND it.
   Tiers map 1:1 to a real sourced field; **ship the honest 2-state (measured vs too-new) if the
   pipeline is uniform today — never synthesize a tier to fill a slot.**
4. **Stamp.** "wholesale reference · Not your prices · as of <asOf>" (or "holding last-good since
   <date>"). The "Not your prices" negation is NEVER dropped.
5. **Layout.** `container-type:inline-size` so it is correct in `/about/` prose at 360px and in a wide
   in-site context, via `@container` queries not viewport media.
6. **Motion.** Fully composed at rest; an optional one-shot neutral boot scan may enhance on first
   paint only; `prefers-reduced-motion` and JS-off render byte-identical in meaning. No golden-hour
   warmth touches this surface (fork #3).

**Acceptance tests (all must pass before it ships).**
- On a dimmed cracked 360px Android with every shadow imperceptible, a low-confidence read still reads
  as low from the label alone.
- A screen reader announces the confidence tier, the number, and "Not your prices" — **in that order**
  (guaranteed by DOM placement, not `aria-describedby` alone).
- The value never tweens through non-source intermediates.
- Every tier passes AA (number) and 3:1 (rule) in light AND dark, and differs in `border-style`
  (forced-colors + print survival).
- The page is composed with one data point, last-good, none, **or a malformed snapshot** (specified
  outcome).
- Zero horizontal scroll in EN and the ~15-20% longer ES at 360px.
- Identical render at 11pm and noon.
- **Ship the new `check-cost-index-confidence.mjs` gate ALONGSIDE it** so the encoding — including
  EN↔ES parity and the calibration-monotone ordering — is enforced from day one.

This single component simultaneously (a) closes the highest-leverage retention gap, (b) proves the
three-dialect unification, and (c) proves the honesty contract survives static / AA / AT / dark /
EN+ES — the ground everything else is built on.

## Guardrails from the completeness critic (folded into scope)

The critic returned `readyToBuild:false`. These are the conditions that must hold; each is already
wired into a primitive, a gate, or the phase split above.

1. **Chip vocabulary must map to a real field.** Register the exact label strings + EN/ES translations
   in `data/sourced-claims.json`, run through `check-fabrications` + `check-audio-fabrications`. The
   generator never emits label text no field contains. (Primitive 2.)
2. **Calibration monotonicity, not asserted ordering.** `cost-confidence-calibration.json` shows
   low<medium currently FAILS on realized hit-rate; the gate enforces the calibration invariant and
   derives solidity only from tiers that pass. Ship the collapsed monotone 2-state until the pipeline
   emits real per-surface tiers. (Primitive 2, open fork #1.)
3. **Forced-colors + print in the acceptance matrix.** Carry confidence on `border-style` (dashed=low
   vs solid=high, both background-graphics-safe); the gate asserts tiers differ in style, not only
   width/hatch. (Primitives 1 & 2.)
4. **Tokenize the inset well shadow** with a contrast-verified dark override; remove the literal
   `rgba(20,22,26,.07)`. (Primitive 1.)
5. **Split Phase 1** into 1a (standalone `/about/` read — genuinely cheap, ship + measure) and 1b
   (shared-stylesheet extraction + partial + Well + confidence gate — a system migration gated on 1a's
   lift). (Build sequence.)
6. **Correct the IntersectionObserver premise** — there are five, not one. The self-inking line
   explicitly joins a named observer or owns a documented new one. (Primitive 3.)
7. **Guarantee SR announce-order in DOM** — tier + "Not your prices" in a `.vh` span before the number,
   not solely `aria-describedby`. (Primitive 2, hero spec.)
8. **Extend the confidence gate to EN↔ES label parity** and the longer-ES-chip zero-scroll-at-360px
   check. (Primitive 2.)
9. **Define malformed / partial-snapshot build behavior** explicitly (fail vs illustrative) so a bad
   data day has a specified, honest outcome on the crown-jewel entry. (Primitive 7, hero spec.)
10. **Diagnose the `ci-scan` two-bundle duplication** before lifting shared CSS, so drift surface does
    not grow. (Primitive 4, Phase 1b.)
11. **Redundant-channel honesty on print/forced-colors is word-first-safe** — the philosophy's
    word-first stance survives where backgrounds vanish; the *visual* second channel is honestly stated
    as degraded there and the gate tests only what survives (`border-style`).

## Open forks for the founder

1. **Confidence tier fidelity (resolve before Phase 1b fixes the visual scale).** The honesty gate
   depends on never synthesizing a tier, but the calibration harness reportedly emits four tiers
   (directional/low/medium/high) while a solidity scale wants three — and today's data may be uniformly
   "medium," and realized hit-rate is non-monotonic. **Decision needed:** confirm what the data model
   actually emits per surface. **Recommended stance:** ship the defensible, calibration-monotone 2-state
   (measured vs too-new) mapped 1:1 to a real sourced field NOW so 81 pages don't render identically,
   and invest in the pipeline to emit real per-surface tiers (plus an edition-age→confidence downgrade)
   as a parallel data-desk track before lighting up the fuller scale. Never collapse directional→low if
   it erases a distinction the harness exists to defend.
2. **The return-cadence question (deepest strategic fork — recommend committing).** For a WEEKLY desk,
   retention is "a reason to come back Tuesday," and every in-session depth move improves a single visit
   without creating that trigger. **Recommended:** build the visit-relative "what changed since you last
   looked" delta (localStorage, CSP-self, sent nowhere, honestly visit-relative never edition-absolute)
   as a real Phase-2 deliverable, paired with the weekly-dispatch email as the primary return channel.
   **Founder call:** does even client-only visit memory sit right with the "of-record, nothing tracked"
   posture, or should freshness stay a pure server-rendered dated stamp and let the email carry return
   entirely?
3. **Dusk warmth on the `/about/` instrument.** Warmth is gated to `.hero`/`.window` and must never
   touch a data surface, frame plane included. The only honest exception is an About read genuinely
   housed inside a real sanctioned `.window` frame. **Recommended stance:** keep the About read on a
   plain data surface for maximum of-record purity — do NOT wrap it in a `.window` just to license a
   warmth tick. **Founder call (a brand-soul decision):** house it in a real `.window` for a small
   on-brand delight, or hold the hard line? If yes, it needs a formal ADR amendment and gate change, not
   a quiet exception.
4. **View Transitions ROI for a one-person shop.** The Traveling Read is the boldest genuinely-next-gen
   move and is honestly gate-able, but it hard-cuts on the exact 360px low-end target it is meant to
   impress, needs a CI collision gate, and adds a second code path for one person. **Recommended:** keep
   it Phase-3 garnish and make it the FIRST thing cut if budget is tight — dialect unification's
   coherence already holds without it. **Founder call:** ship the craft signal for capable desktop
   browsers, or redirect that budget to the number and the return loop?
5. **How far to fuse events into the instrument.** Adopting the Well shell for `evh-*` aids coherence but
   risks co-occurrence borrowing measured-read authority through equal material weight. The plan renders
   events visibly lighter, on a separate rail, never a mark on the price curve. **Fork:** exactly how
   much lighter / how separated is "enough" — resolve on a real dim 360px device, and confirm a shared
   grammar is worth the causation-adjacency risk at all before committing `evh-*` to the Well.
6. **A decision layer (editorial scope, not design).** The site delivers a trusted number but never maps
   it to a decision the operator owns (hold / re-price / hedge). One honest "what an operator does with
   this read" line would sharpen empowerment. **Founder call:** is that scope Don wants, and can it clear
   the voice canon and the absolute fact gate without drifting toward advice or forecast? Out of scope
   for the depth refresh; flagged because it is the true empowerment gap behind the retention question.
