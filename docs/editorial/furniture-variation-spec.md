# Furniture-variation spec — the "vary the furniture" layer

**Status:** proposal, awaiting sign-off on the archetype set before implementation.
**Why:** the body recomposition (46 articles) made each article's *prose* a different
experience, but the **injected furniture** still renders byte-identical in structure
across every article — same TL;DR shape, same takeaways grid, same author card, same
smart-next row, same post-end CTA frame. Uniform furniture re-imposes the cookie-cutter
feel the recomposition removed. This layer varies the furniture per article, the same
way the bodies now vary, without breaking a single gate.

## Hard constraints (any variant must satisfy)
- `check-article-graphics` (8 rules), `check-locale-parity` (EN↔ES), `check-overview-quality`,
  `check-meta-description-length`, `check-cta-canon --strict`, `check-fabrications` all stay green.
- EN↔ES parity: every variant ships in both locales (the injectors already do both).
- Slugs final-forever; no new fabricated data; CTA canon verbs unchanged.
- Furniture stays **build-injected** — variation is data-driven (a `variant` field in the
  injector's data file), never hand-edited per article (hand edits get overwritten on build).
- Idempotent: re-running the injector twice produces the same output (so `--check` passes).

## The furniture inventory (injector → data source → how it can vary)
| Piece | Injector | Source | Variation lever (low-risk) |
|---|---|---|---|
| author-card | `inject-article-author-card.mjs` | inline template | 2–3 byline-framings (Desk vs first-person operator note) keyed by treatment |
| post-end-cta | `inject-post-end-cta.mjs` | `data/post-end-cta.json` | already per-slug copy; add a `layout` variant (card / inline / banner) |
| companion-kit | `inject-companion-kit.mjs` | `data/cross-surface-map.json` | 4-corner grid vs 2-up vs single-rail, keyed by how many real links exist |
| smart-next | (smart-next injector) | cross-surface map | row vs stacked vs "one strong next" keyed by treatment |
| TL;DR / takeaways | article-build | inline | takeaways as numbered runbook vs bullets vs a single "the one move" callout |
| listen / audio | `render-post-audio` + listen.js | per-post | n/a (already varies by content length) |

## Proposed approach: **treatment-keyed archetypes**
Each recomposed article already has an implicit treatment (field-guide / decision-walkthrough /
data-forward / teardown / narrative — see the `De-cookie-cutter:` commit subjects). Reuse that as
the variation key:

1. Add `data/furniture-variants.json` mapping `slug → { treatment, furniture_archetype }`.
   Default archetype falls back to today's layout (zero-risk for unmapped slugs).
2. Give each injector an **archetype switch** that picks a layout class
   (`.post-end-cta--inline`, `.companion-kit--rail`, etc.) from that map. The CSS variants
   live once in `assets/site-article.css`; the injector only swaps a class + element order.
3. Assign archetypes so adjacent-in-funnel articles differ (same logic the body batches used:
   no two neighbors share a furniture archetype).

**Archetype set to approve (proposed 4):**
- **A — Runbook tail:** takeaways as a numbered checklist, post-end-cta inline under it. (field-guides)
- **B — Verdict tail:** takeaways as a single "the call" callout, companion-kit as a 2-up. (decision-walkthroughs)
- **C — Figure tail:** takeaways as a stat strip, smart-next as "one strong next." (data-forward)
- **D — Story tail:** author-card as a first-person operator note, post-end-cta as a quiet banner. (narrative/teardown)

## Rollout (phased, reversible)
1. Ship the 4 CSS variants + the `furniture-variants.json` map with **every slug defaulting to today's
   layout** (no visible change; gates green) — the scaffold.
2. Flip archetypes on one batch (~5 articles), eyeball EN+ES, confirm gates, commit.
3. Roll the rest in batches, committing per batch (disconnect-safe).
4. `check-furniture-variants.mjs` (optional): assert no two funnel-neighbors share an archetype.

## Open questions for you
1. **Archetype count:** 4 (above) or fewer/more? Bolder (restructure takeaways/CTA) or lighter
   (class-swap + reorder only)?
2. **Author-card:** OK to vary the byline framing per treatment, or keep the single canonical card?
3. **Scope:** all 90+ articles (EN+ES), or library-only first?

Once you pick the archetype set + boldness, implementation is the same agent-batch + commit-per-article
loop used for the bodies.
