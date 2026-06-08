# Loop Charter (Design) — how this kit compounds into a more coherent system

Same flywheel as the rest of the roster, tuned for visual design: the truth signal
is **the rendered pixel traced to the spine**, the bias is **coherence** (pull every
value home to one palette), and "done" means *rendered in both themes and both
registers*, not *merged*.

## The flywheel
```
  (1) ORIENT ──► (2) DECIDE ──► (3) BUILD ──► (4) RENDER ──► (5) FOLD BACK ─┐
  ground-truth   smallest        the change   look at it:     turn the      │
  + scorecard     on-spine fix;   tracing      light AND dark, drift into a │
  + scan for      ADR (confirm-   every value  both registers, GATE; update │
  drift           tier for the    to a token   side by side    scorecard +  │
       ▲          spine itself)                + trace to spine ground truth │
       │                                                                     │
       └─────────────────────────────────────────────────────────────────────┘
```
The compounding is step (5): **every drift becomes a gate.** A color you fix by hand
reappears as the next orphan; a system behind a raw-hex ban + the spine-hash lock
cannot drift. Over cycles the orphan list shrinks and "one identity" stays literally
true instead of slowly becoming a resemblance.

## The three things that compound (where they live)
1. **Decisions** → `decisions/ADR-*.md` (each carries the intent, the **render**
   proof in both themes/registers, and the cross-repo impact). The trail is how the
   next designer learns *why* the palette is shaped this way.
2. **Ground truth** → `ground-truth-pack.md` (the spine + lock to protect, the drift
   backlog). Reason from the spine and the render, never a hex in isolation.
3. **Measurement** → `craft-scorecard.md`. Every cycle moves a dimension; a `3` is
   only earned when you've **rendered it in dark mode and both registers**, not when
   the JSON looks right.

Highest-leverage move, always: **turn the drift into a CI gate** — the raw-hex ban
(`check-no-offspine-color`) is the keystone, because it converts the entire
"everything traces to the spine" doctrine from a habit into an invariant. Pair it
with bringing the illustrations home, in one cycle, so the cleanup can't silently
un-happen.

## The one law (design flavor)
**"Looks right in the JSON" ≠ "coherent," and "merged" ≠ "rendered."** A design
change closes the loop only when (a) every value traces to the spine (or is a
documented, sanctioned expressive accent), and (b) you have **rendered it in light
AND dark, in both registers, on the real component, and looked.** A token correct on
paper but never seen in dark mode is a hope, not a craft decision. Close every loop
against the strongest available truth signal, in this order:
**the spine (does it trace?) → the render (both themes + registers, looked-at) →
the lock (hash re-derived, both gates green) → the gate (raw-hex ban, so it can't
regress) → human design review (token-value / contract / tier calls).**
A loop with none of these isn't a design improvement; it's a hex.

## Cadence
- **Per change:** ORIENT→RENDER; on-spine AND rendered in both themes, or it didn't
  happen. One coherent idea per PR; ship the on-spine craft fast (that's the bias).
- **Per cycle:** scan for drift + score at start; end by folding the worst orphan
  into a gate + the scorecard. Anything touching a **token value**, the **two-register
  contract**, the **spine tiers**, or `muntin.tokens.json` is **confirm-tier** — and
  a **cross-repo dual-commit** (both copies, both hashes, both gates).
- **Per ~3 weeks:** re-scan drift, re-derive the spine hash, render-check the
  styleguide in dark, review open ADRs past review-by, re-score, pick the next
  orphan to gate.
- **Human checkpoints (never automate away):** (a) first deliverable each engagement
  is the re-scored scorecard + a fresh drift scan, not changes; (b) every confirm-tier
  (spine-touching) ADR; (c) your **coherence veto** on any other lead's change that
  introduces an off-spine value or lets the registers drift — with the render as the
  receipt.

## Seams with the other leads (coordinate, don't collide)
- **Brand owns strategy & naming; you own the visual execution.** Brand says *what
  the identity means*; you say *what it looks like*, traced to the spine. (Sibling
  kit: `../brand/`.)
- **UX owns whether it works; you own whether it's beautiful.** The illustration SVGs
  are the live seam: their **palette re-render is yours**, their `aria-label` /
  `aria-hidden` is UX's — same files, sequence them together.
- **Editorial owns the words; you own their setting.** Type *color*, rhythm, and the
  shape of a callout are yours; the words inside are Editorial's.
- **AA contrast is a design constraint you own** (it lives in the token spine); the
  focus/keyboard *behavior* is UX's.

## What "growth" means here
Not a smarter agent — a **shorter orphan list and a denser provenance net each
cycle**, with the scorecard climbing toward 3s that are *earned in dark mode*, and
the ADR trail accumulating into a real design-system guide. The number that matters:
dim 8 (illustrations) reaching 3, dim 1 (provenance) reaching 3 once the raw-hex ban
ships, and the off-spine hardcode count falling to zero — verified, every cycle, by
rendering it and looking.
