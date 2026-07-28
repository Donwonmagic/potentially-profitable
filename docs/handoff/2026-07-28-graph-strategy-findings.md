# 2026-07-28 — Graph-engineering fact-check, live defects, and the verification finding

**Thread:** research session prompted by two widely-shared X posts on knowledge graphs
and parallel agent orchestration. Two workflows ran: a 14-agent grounding run
(fact-check × repo inventory × adversarial design critique) and a discovery run.
**Decision of record from this thread:** `ADR-020-graph-engineering-declined.md`.

Every number below was verified against the working tree on 2026-07-28 unless marked
*(agent-measured)*.

---

## 1. The source material, fact-checked

**Post A (@Sprytixl):** "Anthropic's lead engineer won a $1.2M bonus for a system that
turns any data chaos into a graph in 8 steps."

| Claim | Verdict |
|---|---|
| $1.2M bonus to a named-nobody "lead engineer" | **Unfounded.** No primary source. Anthropic does not announce individual bonuses; documented structure is 15–25% of base. $1.2M matches the *ceiling of total comp* for a senior IC in public comp data — a band relabeled as a spot award. |
| "+42% productivity from day one" | **Unfounded.** No study produces it. Also internally incoherent: the post's own pitch is that the graph compounds as it accumulates — the opposite of a day-one effect. |
| "A $1.2M system, now free" | **False on both halves.** Nothing was released; the deliverable is a labeled architecture diagram. The valuation traces only to the fabricated bonus in the same post. |
| "Neo4j builds a live structure — zero duplicates" | **The most technically misleading line.** `MERGE` deduplicates on exact key match only. Entity resolution — the hardest stage — was deleted and its outcome credited to the storage engine. A reader who acts on this ships duplicate nodes and never finds out. |
| Model choice (Fable 5 + Opus 5 for extraction) | **Backwards.** Per-document extraction is the highest-volume, most cost-sensitive step; Anthropic's own cookbook specifies a cheap fast model there and reserves frontier capability for entity resolution. Naming the two most expensive models is a credibility signal, not an engineering decision. |
| Hybrid retrieval (vector + keyword + graph, merged ranking) | **Sound, and the one thing worth taking.** ≈+7% NDCG on WANDS; Recall@5 0.816 vs 0.587 dense-only on financial documents. RRF merges on ranks, avoiding score-incompatibility. |

**Post B (@0xCodila):** "Google just released free 1-hour course on building agentic
knowledge Graphs."

- **Not Google.** It is DeepLearning.AI × Neo4j, taught by Neo4j's Andreas Kollegger. It
  merely *uses* Google's ADK.
- **Not just released.** Published **2025-08-27** — eleven months earlier.
- **The five timestamps are fabricated.** Other accounts running the identical copy-paste
  cite a different but mutually consistent set; the chapter labels name a buzzword the
  course never uses.
- **"1000+ agent loops in one window"** describes no shipping capability. In Claude Code,
  1,000 is a *runaway-loop guard*; real simultaneity is 16.

**Two corrections worth carrying into anything read next:**

- **GraphRAG is narrow, not general.** The ICLR'26 GraphRAG-Bench premise is that GraphRAG
  *frequently underperforms vanilla RAG on real-world tasks*; structure-based methods cost
  5–10 F1 on simple QA. Real multi-hop wins are ≈+3 to +14 points, not the multiples on
  vendor blogs. *(agent-measured from published sources)*
- **More agents is not more intelligence.** Under equal reasoning-token budgets, single
  agents match or beat multi-agent systems on multi-hop reasoning. The one rigorous RCT
  found developers **19% slower** with AI while believing they were 20% faster — a
  39-point perception gap, and the single most relevant caution for a solo operator
  judging his own throughput from the inside. *(agent-measured)*

---

## 2. The structural insight

Post A sells the graph as **artifact**. Post B sells it as **process**. Both make the same
move:

> **They present topology as a substitute for the expensive stage, when topology is
> exactly the thing that multiplies it.**

Post A's expensive stage is *entity resolution* — deleted, credited to the database.
Post B's is *verification* — deleted, credited to the fan-out. In both cases the graph is
the diagrammable part and the deleted part is the illegible, non-parallelizable part that
decides whether any of it works. MAST's audit of seven multi-agent frameworks: 41–86.7%
failure rates, ~a fifth being *verification* failures — wrong output, nothing caught it.

Sorting rule for this shop, recorded in ADR-020:

> **Fan-out is free only when its output requires no human read.
> An edge is free only when it was authored, not inferred.**

---

## 3. Why we decline the graph (the inventory that settles it)

Verified in-tree 2026-07-28:

- the ingredient slug joins ~30 files with no collisions;
- `data/ingredient-hs-codes.json` — **250 slug↔HS edges, 226 HS codes, 155 distinct
  slugs, 24 codes serving >1 slug**, each verified against real Census return descriptions;
- `cost-index/co-movement.csv` — **1,540 data rows**, already a directed weighted edge list;
- most datasets ship a `framing`/`_doc` string, so edges already carry epistemic status.

Extraction error rate is **zero by construction**. Published relation-extraction precision
"frequently exceeds 75%" — about a quarter bad edges. Running the pipeline over this
corpus would strictly lower precision. See ADR-020.

---

## 4. Live defects found (all four verified in-tree)

**D1 — `llms.txt` instructs machines to strip our attribution. (fixed in this change)**
Line 11: *"Cost Index data files are CC0 / public domain."* Line 25 repeats it. Line 37 —
same file — correctly states *"(US-gov data CC0; Muntin derivations CC-BY)."* ADR-015
Decision 2 retired the blanket claim. As written we told every crawler that our CC-BY
compilations, including `cost-index/ingredient-state-record.json`, are public domain.
`llms.txt` also said **"sixteen"** explorers and listed 16, omitting `/open/seasonality/`;
there are **17** directories under `open/`.

**D2 — `CLAUDE.md` is wrong in three load-bearing ways. (fixed in this change)**
It is the agent contract, read first by every session.
  - "`scripts/` — ~70 of them" → the real count is **386** `.mjs`.
  - "runs every `check-*.mjs` script in sequence and **fails fast**" → it does not; it runs
    all entries and reports at the end, then partitions against `check-all-baseline.json`.
  - It describes the dispatch as a **weekly, machine-generated** post with a Tuesday cron
    publish. **ADR-012 reversed this on 2026-07-09**: editions are **monthly,
    hand-written, hand-published; no cron generates or publishes posts.** The cron was
    removed; `cost-index-dispatch.yml` survives as a one-click email button only.

**D3 — 16 dangling ES hreflangs.** Every ES-missing `/open/` explorer ships
`<link rel="alternate" hreflang="es" href="…/es/open/<name>/">` pointing at a URL that does
not exist (verified: `recalls`, `labor`, `demand`, `energy`). `check-hreflang-orphans.mjs`
reports clean because it only checks ES→EN, never EN→dangling-ES.

**D4 — the "always-red gates" narrative is obsolete.** `scripts/check-all-baseline.json`
carries 25 `expectedFail` entries; 18 now pass *(agent-measured)*, and the baseline's own
rule says a passing entry must be pruned. Two genuine regressions remain: italic-font
preloads wants the menu-pricing blog post in both locales, and glossary knit would update
14 term pages.

---

## 5. The one measured parallelism win

`scripts/check-all.mjs` is **CPU-bound, not I/O-bound** *(agent-measured: user 3m30.8 +
sys 0m20.0 ≈ real 3m44.8 on a 4-core box)*. A full `--baseline` run is **224s, 314/323
passing**; a worker pool over the same parsed `CHECKS` array runs it in **100.5s at
`--jobs 4`** — **2.23×**, saving ~124s per run. `--jobs 8` buys nothing (`nproc` = 4).

Guardrails if this is built:
1. The Cloudflare deploy invocation in `wrangler.jsonc` **must stay serial and strict** —
   `--jobs` must not be reachable from it, or a future concurrency bug silently weakens
   the deploy gate.
2. Do **not** bundle `--changed`-file scoping into it. Sentinel counts, locale parity and
   cross-surface maps are cross-file by construction, so scoping is a *correctness*
   change, not a speed change.
3. The CHECKS parser must skip `^\s*//` lines or it will count the disabled
   seasonality-fusion entry and report 324.
4. Acceptance test is a machine verdict: `diff` the label+status set between `--jobs 1`
   and `--jobs 4`.

This is hygiene, not a throughput unlock — but it is the only fan-out in this operation
whose output nobody reads, and a four-minute serial gate discourages running the gate,
which is precisely how verification failures get in.

---

## 6. Still open (founder's calls)

1. **Spanish `/open`: finish or declare.** 16 explorers with no ES counterpart. Three
   (`labor`, `demand`, `recalls`) are *generated* pages — a hand-translated ES silently
   drifts on the next generator run, so those must be done by teaching the generator a
   second locale, which is not a fan-out task. Either commit or declare `/open` EN-only.
   **The dangling hreflangs must be fixed either way** (D3, done in this change).
2. **Is `open-data-catalog.json` exhaustive or /open-scoped?** 7–8 published files under
   `cost-index/` are absent from it (co-movement, events-detected, anomaly-log, lockfloat,
   seasonality, yields, revisions, sources). Write the scope rule down before registering,
   or the next session re-litigates it.
3. **Does any of this beat writing the next dispatch?** ADR-012 deliberately made the
   founder's hand the throughput ceiling. Everything above is infrastructure; none of it
   publishes an edition. Instrument the outcome (editions shipped, gates green first try,
   rework rate) — not the felt speedup, which is a known-unreliable instrument.

## 7. Explicitly rejected in this thread

A graph database; LLM extraction over the corpus; any node-link/chord visual (ADR-015
Decision 1); `/open/graph/` as an 18th explorer; a counter-quote tool (it would adjudicate
a *delivered-price* claim with *wholesale-basis* data — a basis leak relocated into a
tool's purpose where no gate can catch it); a published "extraction-proof claim" standard
(an unfalsifiable efficacy claim about third-party extractors we cannot observe); and any
new gate before `--jobs` lands.
