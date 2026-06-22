# ADR-005 (PROPOSAL) — The article-enrichment initiative, and how the corps communicates

- **Status:** **Proposed** — convening record; opens the working log for the enrichment review
- **Date:** 2026-06-20
- **Owner:** Strategic Council (convening) — Editorial Lead + Engineering co-own
- **Review by:** 2026-09-20
- **Relates to:** ADR-000 (adopts the ADR practice this initiative runs on); `scripts/check-article-graphics.mjs` rules 1–2 (the constraint under review); child proposals ADR-006 (enrichment-element taxonomy), ADR-007 (imagery priority), ADR-008 (image-provenance registry)

> Decision: convene a standing, hundred-seat enrichment review of the article corpus
> (~48 EN library + blog posts and their ES mirrors), and run it **entirely through
> this ADR log**. Every specialist decision lands here as a numbered record in
> `PROPOSAL` status, cross-linked by `Relates to`, ratified or superseded in the
> open — never overwritten. This record is the ground the corps stands on: the
> diagnosis is settled below so no one re-derives it, and the load-bearing questions
> are pre-decided in the child ADRs so debate goes to what's actually open.

## Context

The founder's read: the posts feel cookie-cutter, and the visual requirements are
partly the cause. A June-2026 mechanical inventory of the 48 EN articles (a
reproducible count of figure classes and opening lines — re-run the inventory to
verify any number here) confirms it is structural, not impression:

- **100% of articles** carry only `viz-*` diagrams. **Zero photographs**, zero
  document/receipt scans, zero data tables, zero maps, zero annotated screenshots
  appear in any post body. The single photograph anywhere in the tree is
  `about/portrait/don.png`.
- **Three families do 74.7% of the work.** Of ~162 figure instances, `viz-bars`
  (52), `viz-flow` (35), and `viz-tree` (34) account for 121. The other seven
  families are rare-to-absent.
- **81% of posts ship the same template:** two or three of `{bars, flow, tree}`.
  Nineteen posts ship all three.
- **Openings are formulaic too:** ~60% open with a flat declarative sentence; zero
  rhetorical questions; the rest are routing links or dated dispatch stamps.

**Root cause — the gate, precisely.** `check-article-graphics.mjs` recognizes a
"content figure" *only* by the wrapper class `viz-figure`/`article-figure`, and
counts "variety" *only* across the ten `viz-*` inner classes (rule 2,
`VIZ_KINDS`). Two consequences follow mechanically:

1. A photograph, scan, or table **cannot satisfy the two-figure floor** (rule 1) —
   so an author who wants a photo must *still* bolt on two diagrams.
2. The cheapest way to clear "≥2 distinct kinds" is the `bars + tree` or
   `bars + flow` pair — which is exactly the template the corpus converged on.

The gate was right to exist (it closed 26 under-illustrated posts and it protects
three real things: narratable audio coverage via `data-audio-alt`, AI-Overview
extractability, and accessibility). The defect is narrowness, not the floor. The
canons (`voice-canon-library.md` §8, `voice-canon-blog.md` §7) name *only* `viz-*`
and are **silent on photographs** — so admitting them is a genuine first, and must
be done without loosening any honesty, accessibility, or performance guarantee.

## Decision

1. **Run the review as ADRs in this directory.** The hundred seats are organized
   into guilds (editorial diagnosticians; expanded-vocabulary panel; first-party
   imagery guild; provenance/licensing bench; accessibility & audio; performance &
   front-end; answer-engine/SEO; gate authors — see the corps brief). A guild that
   reaches a decision writes it here as `ADR-NNN-PROPOSAL-<slug>.md`, sets
   `Relates to`, and lists its **Open questions** so the next guild can answer in a
   child ADR rather than in a side channel. Nothing ships to a gate or a canon until
   its ADR is moved from `Proposed` to `Accepted`.

2. **The diagnosis above is settled.** Treat it as the shared baseline. Bring new
   evidence as a superseding ADR, not as a re-litigation in prose.

3. **The load-bearing questions are pre-decided in child ADRs**, each shipped with
   this record so the corps starts from a substrate, not a blank page:
   - **ADR-006** — widen "content figure" to an *enrichment-element* taxonomy
     (photographs, document/receipt scans, data tables, maps, annotated
     screenshots) and the exact amendment to gate rules 1–2.
   - **ADR-007** — the taste contract: first-party imagery ranks above licensed
     public-domain; generic stock is banned. "Personal" means operator-specific
     evidence, not warmth.
   - **ADR-008** — the image-provenance registry (`data/image-credits.json`) and a
     new `check-image-credits.mjs` gate — the fact-gate analog for pictures.

4. **The non-negotiables travel with every child ADR.** No new figure type ships
   unless it satisfies: `data-audio-alt` ≥ 80 chars (real narration, read aloud in
   EN+ES), a `<figcaption>`, the image gates (`check-image-dimensions`,
   `check-image-formats`, `check-lazy-images`), locale parity (EN change ships its
   ES mirror in the same commit), the voice canon's banned-vocab, and — for any
   non-first-party or anonymized image — a registry entry per ADR-008. Slugs stay
   final-forever; this is in-place enrichment.

## Open questions for the corps

- Does "variety" still require **at least one `viz-*`** per post, or may a post ship
  (e.g.) one photograph + one table with no diagram? (ADR-006 proposes a default;
  the editorial diagnosticians should pressure-test it against the shortlist.)
- Opening-line homogeneity is real but **out of this initiative's gate scope** — is
  it a canon note (voice-canon) or a separate ADR? Park it; don't fold it into the
  graphics amendment.
- Pilot selection: ADR-006 names five forced-diagram posts. Which three go first?

## Consequences

- **Positive:** the corps has one source of truth; decisions compound instead of
  colliding; the founder can read the whole reasoning chain in one directory.
- **Cost:** ADR discipline is overhead per decision. Accepted — on this site an
  undocumented editorial change is one the audio renderer can't be trusted with
  (ADR-000's founding logic), and a new media type multiplies that surface.
