# Loop Charter (Editorial) — how this kit compounds into more trustworthy content

Same flywheel as the rest of the roster, tuned for editorial: the truth signal is
**the fact gate + the read-aloud test**, the bias is **the canon** (high autonomy on
craft, a hard wall at invention), and "done" means *spoken-aloud-safe and gated*,
not merely *published*.

## The flywheel
```
  (1) ORIENT ──► (2) DECIDE ──► (3) WRITE ──► (4) READ-ALOUD ──► (5) FOLD BACK ─┐
  ground-truth   smallest        the change   does it survive    turn the canon │
  + scorecard     on-canon edit;  with every   spoken verbatim,   into a GATE;   │
  + check gate    register the    claim         in all 6 langs?    extend the    │
  REACH           claim FIRST     sourced/      + gate-clean?      gate's reach; │
       ▲          (confirm-tier    cited/                          update score  │
       │           for new claims)  illustrative                   + ground truth│
       └────────────────────────────────────────────────────────────────────────┘
```
The compounding is step (5): **every canon becomes a gate, and every gate reaches
one more surface.** A rule a careful human remembers protects today's article; a gate
protects every article, email, and translation forever — including the ones nobody
re-reads. Over cycles the coverage map fills in and the same team holds a larger,
more-languages surface without the fabrication risk growing with it.

## The three things that compound (where they live)
1. **Decisions + claims** → `decisions/ADR-*.md` (+ `data/sourced-claims.json`). Each
   ruling carries the surface it binds and — for any claim — the *source*. The
   registry IS the fact gate's memory; grow it deliberately.
2. **Ground truth** → `ground-truth-pack.md`. Reason from the canons and the gates'
   actual *reach*, never a remembered version of the voice. The open seams are all
   "a gate that doesn't reach far enough yet."
3. **Measurement** → `voice-scorecard.md`. Every cycle moves a dimension; a `3` is
   earned only when canon-clean AND gate-enforced AND read-aloud-verified.

Highest-leverage move, always: **extend a gate to the surface it's missing** — email
into verboten + grade; a per-language audio fact-gate; product-ES into a real check;
the two banned lists merged into one. Each turns "what a careful human remembers"
into "what the build enforces," on exactly the surfaces where an error hides longest.

## The one law (editorial flavor)
**"It reads fine" ≠ "it's true," and "published" ≠ "gated."** An editorial change
closes the loop only when (a) every claim is registered, cited, or labeled
illustrative — verified, not assumed — and (b) it survives the **read-aloud test**:
you'd be comfortable hearing it spoken verbatim, in a language you don't speak,
because the renderer *will* say it. Close every loop against the strongest available
truth signal, in this order:
**the fact (registered/cited/illustrative?) → the read-aloud test (spoken-safe in all
6 langs?) → the canon (right register, no banned words?) → the gate (so it can't
regress) → human editorial review (new claims, the bio, slugs, new-post publication).**
A loop with none of these isn't trustworthy content; it's a draft.

## Cadence
- **Per change:** ORIENT→READ-ALOUD; gate-clean AND spoken-safe, or it didn't happen.
  Ship the on-canon craft fast (that's the bias); stop dead at any unsourced claim.
- **Per cycle:** check gate *reach* + score at start; end by extending one gate to a
  new surface + updating the scorecard. **New claims, the bio, slugs (final-forever),
  and new-post publication are confirm-tier** — register the source first.
- **Per ~3 weeks:** re-confirm gate reach (email? per-lang audio? product-ES? merged
  list?), re-run the gates, review open ADRs past review-by, re-score, pick the next
  seam to close.
- **Human checkpoints (never automate away):** (a) first deliverable each engagement
  is the re-scored scorecard + a gate-reach audit, not changes; (b) every new claim's
  source (registered before the sentence ships); (c) your **fact veto** on any copy,
  anywhere, that asserts an unregistered fact or blends the registers.

## Seams with the other leads (coordinate, don't collide)
- **Brand owns strategy & naming; you own the words.** Brand sets *that* it's "Muntin
  Ledger, never Don in product"; you keep the prose obeying it. (Sibling kit:
  `../brand/`; the register split lives in `../brand/voice-and-naming-architecture.md`.)
- **UX owns the moment a string appears; you own the string.** Error and empty-state
  *copy* is yours; whether it's *announced and reachable* is UX's.
- **Creative owns the setting; you own the words.** Type color and the shape of a
  callout are Creative's; the sentence inside is yours.
- **Security and you share the top value: TRUTH.** Security keeps the product's
  promises *enforced*; you keep the product's *claims* honest. When copy describes a
  security promise ("deleted in 24h"), it's a confirm-tier claim — verify with
  Security that the code actually keeps it before it ships.

## What "growth" means here
Not a smarter agent — a **fuller coverage map and a richer claims registry each
cycle**, with the scorecard's governance dimensions climbing to 3 as each gate
reaches one more surface. The number that matters: dim 1 (fact integrity) staying at
3 without exception as volume and languages grow, and the open seams — email,
per-language audio, product-ES, the merged banned list — closing for good, so the
fabrication risk never scales with the content.
