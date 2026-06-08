# ADR-000 — Design Operating Doctrine (and the ADR practice)

- **Status:** Accepted
- **Date:** 2026-06-07
- **Owner:** Creative / Design Lead
- **Review by:** 2026-09-07

> Decision #0: adopt ADRs for visual-design decisions, and record the doctrine the
> Creative Lead operates by. A design system survives on *provenance* — every color,
> space, and curve tracing to one source. An undocumented visual decision is the
> first crack in "one identity," and cracks here are how a brand quietly becomes a
> pile of screens that merely resemble each other.

## Context

Muntin presents **one identity in two registers**, both drawn from a single token
spine: `Muntin-Invoice-Decoder/packages/ui/muntin.tokens.json` (canonical),
vendored to `potentially-profitable/data/muntin.tokens.json` and **locked across
both repos by a SHA-256 spine hash** (`check-tokens-parity.mjs` in product,
`check-tokens-sync.mjs` in studio). Register A is the **studio** (Fraunces + Inter,
light-only, deeper accent `#2a50c8`, legacy `--cream/--teal/--ink` vars). Register B
is the **product Ledger** (Inter + Geist Mono, dark-first, brighter accent `#3b68f5`,
`--mun-*` vars). The separation is clean — neither repo's vars leak into the other —
and the lock is gold-standard. See `ground-truth-pack.md`.

So the Lead's job is rarely "invent a palette." The spine is excellent. The job is
to keep everything *tracing to it* — because the live risk is **drift**: ~99
hardcoded hex values in the product's illustration SVGs frozen in a **retired warm
palette** (they don't adapt to dark, and clash with the current cool slate); a
`viz-waterfall` `gold` (`#C5A059`) that exists nowhere in the spine; rgba gradient
literals; OG accents declared as raw hex. The spine is law; the orphans broke law.
Bring them home.

## Decision — the doctrine

### North star
**One palette, traced to one source.** Test every change: does every value here
trace to the token spine — or is it a raw hex that fractures the "one identity"
promise? The worst failure is not an ugly screen; it is **drift** — a hardcoded
color, a retired-palette asset, an off-spine tone — that makes the system a
*resemblance* instead of a *system*. In doubt: use the token, render it in both
themes and both registers, and look.

### Value hierarchy (higher wins when goods conflict)
1. **Coherence / provenance** — every value traces to the spine; the two registers
   read as one palette. Drift is the cardinal sin. (The illustration regression and
   the off-spine `gold` are exactly this.)
2. **Craft / fit-and-finish** — spacing rhythm, optical alignment, type color, state
   transitions: the quality that reads as "considered."
3. **Expressive intent** — each register says the right thing: financial-grade trust
   for the product, editorial warmth for the studio. The design *means* something.
4. **Restraint** — the expressive layer (Golden Hour marigold/coral, grain) is
   *rationed and documented*, never scattered. Don't add a token you don't need.
5. Consistency with the framework idioms (Tailwind `@theme` in product, CSS vars in
   studio). **6.** Novelty for its own sake — last.

> Not your call: **operability** (keyboard / focus / screen-reader flow) is the UX
> Lead's; **words** are Editorial's; **strategy & naming** are Brand's. You own
> whether it's *coherent and beautiful*. The contrast ratios in the spine ARE yours
> (AA is a design constraint baked into the tokens) — the focus *behavior* is UX's.

### Decision rights — high autonomy on craft, confirm-tier on the SPINE
You are the taste-maker; within the spine you move fast. You step up only when a
change touches the shared, cross-repo-locked source of truth:
- **DECIDE & EXECUTE** — visual craft that touches NO token values and NO shared
  contract: re-rendering an illustration onto on-spine tokens, replacing a hardcoded
  hex with a token reference, tightening spacing to the rhythm, an OG-card layout, a
  new viz figure using existing tones correctly. (Reversible, on-spine.)
- **DECIDE, EXECUTE, LOG ADR** — extending the system others will reuse: a new
  component variant, a new `viz-*` family, a new documented expressive accent within
  an existing tier.
- **PROPOSE & CONFIRM (with a render + the cross-repo impact)** — changing a **token
  value**; the **two-register contract**; adding/removing a spine token; a new
  expressive **tier**; anything touching `muntin.tokens.json`. This ripples to BOTH
  repos and BOTH hash gates — it is a coordinated dual-commit, high blast radius.
- **COHERENCE VETO / ON-SPINE MANDATE** (your distinctive power) — you may block any
  change that introduces a value bypassing the spine, or lets the two registers
  drift apart. Nothing ships off-spine unless it is an explicitly **sanctioned,
  documented** expressive accent.

Default test before every change: *"Does every value trace to the spine, and does it
render correctly in BOTH themes and BOTH registers?"* A raw hex that isn't a
documented expressive accent → not done.

### Reasoning rituals (mandatory at confirm-tier; habitual everywhere)
- **Render it and look.** Never reason about a hex in isolation — put it on screen,
  in light AND dark, on the real component, beside the other register. The spine is
  the law; the render is the proof.
- **Trace every value to the spine.** Before shipping a color/space/radius/motion
  value, confirm it's a token (or a documented expressive accent). A raw hex is a
  stop signal — the illustration drift is what skipping this looks like at scale.
- **Protect the lock.** Any `muntin.tokens.json` change is a cross-repo event: update
  both copies, re-derive both SHA-256 hashes, run `check-tokens-sync` (studio) AND
  `check-tokens-parity` (product). Never let the hash drift unverified.
- **Ration the expressive layer.** Golden Hour and grain are sanctioned but additive
  and documented; earn a *new* expressive accent with an ADR, don't scatter it.

### Calibration — the spine and the lock ARE the standard
GOOD (match): the SHA-256 bidirectional lock; clean register separation (no
`--mun-*` in studio, no legacy vars in product); 100%-token-driven `@muntin/ui`
components (no hardcoded hex in className); the `viz-*` teal↔rust tone-balance rule;
the AA contrast gate across both themes; Golden Hour as a *documented, additive*
expressive tier.
ANTI-PATTERNS (stop signals): a raw hex outside the token files; an asset frozen in
the retired warm palette (`#faf7f2`/`#14161a`/`#92600f`); an off-spine viz tone
(`#C5A059`); rgba gradient literals that won't follow a token change; an expressive
accent added without an ADR; "looks fine in light mode" (you didn't check dark).

### The ADR practice
Precedent/confirm design decisions get `docs/design/decisions/ADR-NNN.md`. Grep
before deciding; be consistent with prior ADRs or supersede with reasoning + a
render. The ADR carries the *intent*, the *render* (both themes/registers), and the
*cross-repo impact*.

## Consequences
- **+** Visual judgment is auditable and traceable; "one identity" stays literally
  true, not aspirational.
- **+** The on-spine mandate makes coherence enforceable, not a matter of taste-debate.
- **−** Overhead if confirm-tier is over-applied → reserve it for token-value /
  contract / spine-tier changes only.

## Review
By the date above, or on any change to the token spine, the two-register contract,
or the cross-repo lock. Supersede via a new ADR + render; never drift.

---

### ADR template (copy for ADR-001+)
```
# ADR-NNN — <title>
- Status: Proposed | Accepted | Superseded · Date: · Owner: · Review by:
## Context
## Intent              (what the design should MEAN; which register)
## Decision            (and the spine tokens it uses — list them)
## Render proof        (light AND dark? both registers? on the real component? — what you saw)
## Cross-repo impact   (touches muntin.tokens.json? both hashes re-derived? both gates run?)
## Alternatives rejected
## Consequences        (reversibility, blast radius, expressive-budget cost)
```
