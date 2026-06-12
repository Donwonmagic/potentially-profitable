# Loop Charter — how this kit compounds into growth

The kit is not four documents; it is a **flywheel**. Each cycle leaves the next
cycle starting from a higher baseline. The charter is the operating manual for
turning that into compounding improvement instead of busywork.

## The flywheel

```
        ┌─────────────────────────────────────────────────────┐
        │                                                     │
   (1) ORIENT ──► (2) DECIDE ──► (3) EXECUTE ──► (4) VERIFY ──┘
   read pack +     pick the      smallest        against the
   ADRs + score    call; log     gate-green      RUNNING system,
   (current truth) an ADR if     change          not a doc
                   precedent     (one idea)            │
        ▲                                              ▼
        └──────────── (5) FOLD BACK ◄───────────────────
           update the scorecard (did the number move?),
           refresh the ground-truth pack if a FACT changed,
           close/append the ADR. The artifacts are now smarter.
```

The compounding is in step **(5)**: knowledge, decisions, and instruments persist,
so cycle *N+1* never re-derives what cycle *N* learned. The model doesn't get
smarter — **the world it acts in does.**

## The three things that actually compound (and where they live)

1. **Decisions** → `decisions/ADR-*.md`. Judgment that accumulates and stays
   self-consistent. *Grep before deciding; never re-litigate silently.*
2. **Ground truth** → `ground-truth-pack.md`. Verified facts, so no cycle briefs
   off a stale doc. *Refresh on its cadence; it decays.*
3. **Measurement** → `cohesion-scorecard.md`. Makes "are we better?" falsifiable.
   *Every cycle must move the number, and it must survive a re-run.*

Plus the highest-leverage multiplier: **tooling.** When you turn a manual check
into a gate (e.g. the merged banned list, a real token-publish step), you've moved
a `2` to a `3` on the scorecard *and* made it un-regressible. Prefer building the
gate over fixing the instance.

## The one law that keeps it compounding *upward*

**Every loop must close against an external truth signal.** A loop that improves
itself with no outside check doesn't get better — it amplifies its own blind spots
(the same failure as a model trained on its own output, or optimizing a proxy until
it diverges from the goal). The legitimate truth signals here, in order of cost:

- **gates** (cheapest, run constantly) →
- **the running system in a browser** (taste, rendering, the things gates can't see) →
- **the human** (you — on the confirm-tier calls) →
- **real operators / market** (the only judge of whether "more cohesive" became
  "better product").

If a loop isn't anchored to at least one of these, **don't run it.**

## Cadence

- **Per change:** ORIENT→VERIFY, minutes. Gate-green or it didn't happen.
- **Per cycle (a focused session/PR):** start by scoring; end by folding back.
  One mergeable idea per branch — land it before `main` collides (the structural
  tax on big, long-lived branches is real; keep them small and short-lived).
- **Per ~3 weeks:** refresh the ground-truth pack; review open ADRs past their
  review-by date; re-score from a clean baseline and look at the *trend*, not the
  absolute.
- **Human checkpoints (don't automate away):** (a) the first deliverable each
  engagement is the *findings + scorecard*, not changes — so direction can be
  corrected cheaply; (b) every confirm-tier ADR; (c) the question "is brand
  cohesion still the right lever vs. product/UX/accuracy right now?" — revisit it,
  because consistency amplifies *whatever* direction you point it, including the
  wrong one.

## What "growth" means here (and what it doesn't)

Growth = the **system** (agent + accumulated artifacts + gates) doing more, better,
with less re-work each cycle — *not* the model getting smarter (it can't, via this
kit) and *not* cohesion-for-its-own-sake. The number to watch is never just the
scorecard; it's whether rising cohesion is buying **operator trust** — measured in
the real world. When the scorecard climbs but trust/conversion/retention don't,
that's the signal to stop polishing and re-aim. The flywheel's job is to make the
*right* brand inevitable to execute; keeping the direction right stays human.
