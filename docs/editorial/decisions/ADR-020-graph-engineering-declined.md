# ADR-020 — Graph engineering: adopt the retrieval technique, decline the extracted graph

- **Status:** Accepted (autonomous research session, 2026-07-28); founder review open.
- **Date:** 2026-07-28
- **Owner:** Cost-Index / open-data thread
- **Review by:** 2027-01-28
- **Relates to:** ADR-015 (open-data explore surfaces — Decision 1 already bans the
  network-graph visual form; Decision 2 is the CC0/CC-BY split this ADR defends);
  ADR-017 (the fused Ingredient State Record — the crosswalk this ADR says to finish);
  ADR-018 (CHAIN presentation architecture — the engine-behind-pages hazard);
  `docs/fact-check.md` (the absolute number rule — load-bearing here).

> Decision: muntin.digital **does not build an LLM-extracted knowledge graph**, does not
> adopt a graph database, and does not ship a `/open/graph/` surface. Our relations are
> **authored foreign keys with a zero extraction-error rate**; running relation extraction
> over this corpus would strictly *lower* precision. We adopt the one genuinely sound
> technique from the same literature — **hybrid retrieval with rank-based fusion** — and
> we finish the identity crosswalk we already started (ADR-017) as a flat CSV.

## Context

In late July 2026 two widely-shared X posts circulated a "graph engineering" pipeline —
ingest everything → LLM entity/triple extraction → graph database → hybrid search →
nightly self-updating agent — with claims that an Anthropic engineer had won a $1.2M
bonus for it and that it delivers "+42% productivity from day one." A second post
promoted a "free Google course" on agentic knowledge graphs and a pattern of fanning
one prompt out to "1000+ agents."

A 14-agent research workflow fact-checked both posts and inventoried this repo against
them. The findings that drive this decision:

**The authority claims are unfounded.** No $1.2M bonus exists in any primary source;
Anthropic does not announce individual bonuses, and its documented structure is 15–25%
of base. The figure matches the *ceiling of total compensation* for a senior IC in
public compensation data — a band relabeled as a spot award. The "+42%" figure has no
source and is internally incoherent (the post's own pitch is that the graph compounds
over time, which is the opposite of a day-one effect). The "course" is DeepLearning.AI ×
Neo4j, taught by Neo4j's Andreas Kollegger, published 2025-08-27 — not Google, not new;
its cited chapter timestamps are fabricated. This matters to us beyond hygiene: it is a
worked example of the exact failure `docs/fact-check.md` exists to prevent, and a search
engine's own AI summary was observed restating the fabricated bonus as fact.

**The technique deletes its own hardest stage.** "Neo4j builds a live structure — zero
duplicates" is the most misleading line in the material. Database `MERGE` semantics
deduplicate on exact key match only; they do nothing about surface-form variance. Entity
resolution — deciding when two surface forms denote the same thing — is the hardest and
most failure-prone stage of graph construction, and it is a modeling problem, not a
storage problem. Published relation-extraction precision "frequently exceeds 75%",
i.e. roughly a quarter bad edges.

**Our corpus does not have the problem the pipeline solves.** The pipeline exists to
recover structure from unstructured text. We do not have unstructured text; we have
authored keys:

  - the ingredient slug joins ~30 files with no collisions;
  - `data/ingredient-hs-codes.json` carries **250 slug↔HS edges across 226 HS codes and
    155 distinct slugs** (24 codes serve more than one slug), each verified against real
    Census return descriptions;
  - `cost-index/co-movement.csv` is already a **1,540-row directed weighted edge list**;
  - nearly every dataset ships a `framing` or `_doc` string stating what it does and does
    not assert — our edges already carry epistemic status.

Our extraction error rate is **zero by construction**, because there is no extraction.
That is a stronger guarantee than any extract-then-clean pipeline can offer, and it is
achieved by declining to build one.

## Decision 1 — No LLM relation extraction over the corpus

We do not run entity/triple extraction to generate edges. An inferred edge asserts a
relationship the data does not carry, which is the same failure class as asserting cause
from co-occurrence (ADR-011, ADR-015). `docs/fact-check.md`'s rule applies: when in
doubt, cut.

**The rule of record:** *an edge is publishable only when it was **authored**, not
inferred.* Authored means a human or a deterministic recompute wrote the relation from a
named source, with provenance attached.

## Decision 2 — No graph database, no node-link visual, no `/open/graph/`

- **No graph database.** There is no server; the site is static. Under ~10k nodes a
  recursive join over committed JSON runs in microseconds. (Note also that Kuzu, the
  embedded graph database most often recommended for this shape, was archived in
  October 2025 after an acqui-hire; its successors are pre-1.0.)
- **No node-link, chord, or correlation-matrix visual.** ADR-015 Decision 1 already bans
  this form and the ban is correct — ADR-019's permutation null (observed 94% of shocks
  with company vs a 94% null) shows a co-occurrence edge set over this corpus is a
  density artifact. A network picture would imply a measured coupling we do not claim.
- **No `/open/graph/` explorer.** `open/origins/index.html` already ships the
  57-country ledger with per-country detail and the required caveat. The residual is
  navigation, not a missing surface.

## Decision 3 — What we DO adopt

- **Hybrid retrieval with rank-based fusion**, where and if we ever add site search over
  our own corpus. This is the one well-evidenced claim in the source material: fusing
  sparse keyword and dense vector retrieval beats either alone (≈+7% NDCG on the WANDS
  benchmark; Recall@5 0.816 vs 0.587 dense-only on financial documents), and Reciprocal
  Rank Fusion merges on *ranks* rather than scores, which avoids the score-incompatibility
  that breaks naive weighted averaging. Adopting this commits us to no extracted edges.
- **Finish the identity crosswalk as a flat file, not a graph** (completes ADR-017).
  What is genuinely missing is narrow: the ERS commodity id, the NOAA species group, the
  weather region keys, and the many-to-many HS structure that the ISR's single
  `import_hs6` column flattens. The form is one long-format lookup
  (`cost-index/ingredient-codes.csv` + `.json`, CC BY 4.0) with columns
  `slug, agency, code, code_description, granularity, verified_against, retrieved_at`.
  **`granularity` (exact|broader|narrower|partial) is non-negotiable** — tomato and
  cherry-tomato both resolve to HS 070200, and an unlabeled row asserts an equivalence
  the data does not carry.

## Decision 4 — Fan-out is bounded by what a human must read

The second post's "1000+ agents from one prompt" describes no shipping capability; in
Claude Code 1,000 is a runaway-loop guard, and real simultaneity is 16. More load-bearing
for a one-person company: width does not add capacity, it converts compute into review
debt at a fixed exchange rate. MAST's audit of seven multi-agent frameworks found
41–86.7% failure rates, with roughly a fifth of failures being *verification* failures —
the system produced something wrong and nothing caught it.

**The rule of record:** *parallelism is free only where its output requires no human
read.* The correct place to spend it is the verifier — the gate suite — not generation.

## Consequences

- We keep a guarantee (zero inferred edges) that the pipeline being promoted cannot offer,
  and we keep it by doing less work, not more.
- We forgo any capability that genuinely requires traversal over inferred relations. We
  accept this; nothing on the funnel needs it.
- `llms.txt` and every `/open` surface must continue to state the CC0/CC-BY split per
  ADR-015 Decision 2. A blanket "CC0 / public domain" claim over Cost Index data files is
  a defect, not a simplification: it instructs machines to strip attribution from our own
  compilations. (Two such sentences were live in `llms.txt` when this ADR was written and
  are corrected in the same change.)
- If a future session is handed a "graph engineering" pipeline and asked to adopt it, the
  answer is in Decision 1: our edges are authored. Ask what the extraction would add that
  a foreign key does not already provide. If the answer is "traversal convenience," it is
  not worth a quarter bad edges.

## What would reverse this

- A corpus of genuinely unstructured text we need relations from (e.g. thousands of
  operator-submitted notes) — extraction would then be recovering structure that was
  never authored, which is the problem the technique actually solves.
- A measured demonstration that relation extraction over *our* corpus achieves precision
  at or near 1.0 against a held-out authored set. Absent that measurement, Decision 1
  holds.
