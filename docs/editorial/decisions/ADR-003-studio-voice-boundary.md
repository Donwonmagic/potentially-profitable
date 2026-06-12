# ADR-003 — Studio voice-boundary gate + byline canon fix

- **Status:** Accepted
- **Date:** 2026-06-08
- **Owner:** Editorial Lead
- **Review by:** 2026-09-08
- **Relates to:** ADR-000; ground-truth seams #5, #7, #8 (closed); Brand `voice-and-naming-architecture.md`

> Decision: enforce the studio side of the voice boundary — block a fake-team /
> corporate "we" in the studio's own marketing voice (the machine mirror of the
> product's "Don" check) — and retire the stale byline-canon note.

## Studio voice-boundary (seams #5, #8)

The product gate blocks the studio persona "Don" leaking into product copy; the inverse
was ungated. `scripts/check-studio-voice-boundary.mjs` (new, fail-CI, in `check-all`)
blocks the fake-team tells — `our team`, `our staff`, `our company`, `our {experts|…}`,
`the team {at|here|behind}`, `we('re| are) a team`, `a team of` — never a bare "we"
(rhetorical/inclusive "we" is fine).

**Load-bearing scoping:** the gate runs on the studio's own-voice **marketing surfaces
only** and excludes the content registers (library/blog/learn/…), which legitimately
quote operators ("Thank you — our team works hard…" in the review-response playbook is
the operator's voice). It also scrubs `<blockquote>`. On the marketing surfaces it passes
clean — forward protection. (This scoping is why it is a separate gate, not part of the
broad `check-banned-words` scan.)

The fake-team vocabulary is kept inline in the gate today. If the shared banned-vocab
catalog (ADR-004) lands, these move into its `studio` tier.

## Byline canon (seam #7)

`docs/voice-canon-library.md` said the methods POV row "should now read…" (stale,
prescriptive) though the HTML was already updated. Rewritten to past tense, confirmed at
`methods/index.html:520`.

## Result

The voice boundary is now bidirectional. Scorecard Dim 2 (voice & register) **→ 3** and
Dim 10 (cross-surface coherence) **→ 3**.
