<!-- PROVENANCE + STATUS — read before acting on anything below.

  This document is the verbatim synthesis produced by a multi-agent strategy
  workflow run on 2026-07-28. It is ADVISORY, not a decision of record. Nothing
  here has been approved by the operator, and several of its recommendations
  were explicitly deferred.

  It is committed because the container is ephemeral: the workflow output lived
  only in /tmp and would have been lost. docs/ is excluded from the deploy tar
  (verified 2026-07-28), so this is internal and never served.

  TRUST CALIBRATION. Claims in here were produced by agents. A subset were
  independently verified against the repo by the orchestrator and are recorded
  in docs/handoff/strategic-council-board.md under "Verified facts" — those are
  reliable. Everything else, especially market claims, competitor claims, and
  adoption statistics, is UNVERIFIED and must be checked before it is repeated
  anywhere public. The site's fact gate applies to this document's contents the
  same as to any other source: nothing here may be cited on a page without
  independent sourcing.

  When a decision IS taken from this, record it as an ADR in
  docs/editorial/decisions/ and reference this file as input, not as authority.
-->

# Knowledge-graph / GraphRAG review

*Workflow run 2026-07-28 · 17 agents · 2,924,732 tokens.*

**What it did.** 17 agents. Grounded in the existing entity layer, link mesh, Cost Index data model, build constraints and the product repo; fact-checked the viral post that prompted it; produced four independent architectures and scored them with four critics. Headline: no proposal earned a clean adopt, and the critics converged on repairing the fact gate's own spine instead of building a graph.

---

# ADR-015 — Knowledge graphs on muntin.digital: repair the one we have, don't build a new one

**Status:** Proposed (plan of record) · **Date:** 2026-07-28 · **Owner:** Don Goldstein
**Supersedes:** the four competing ADR-015 drafts from the architect round. This is the single ADR-015; the others fold in or renumber.

All numbers below marked **(measured)** were re-derived in-container today against a clean tree, because four architects and four critics disagreed on several of them and three of the disputed figures were load-bearing.

---

## 1. THE HONEST BOTTOM LINE

**Only this specific subset: repair and gate the entity graph the site already publishes, and build one unshipped, LLM-free integrity graph under `docs/`. Do not build GraphRAG retrieval, do not publish a new entity mesh, do not stand up a graph database, and do not let a model write an edge.** The site's whole prose corpus is ~170K tokens — roughly one-fifth the size at which graph indexing starts paying for itself in the retrieval literature — so a graph cannot be justified on answer quality here. It can be justified on one thing only: the site currently ships **542 machine-readable references that resolve to nothing (measured: 542 occurrences across 75 distinct URIs, 2,055 JSON-LD blocks parsed, 1 parse failure)**, and 259 CI checks have been blind to all of it across hundreds of green builds. A broken entity layer is strictly worse than no entity layer. Fixing it is a defect repair with a certain outcome, not a bet on SEO. Everything past that repair is speculative and is sequenced behind a measurement.

**On the viral post: the frame is slop, the technique underneath is real, and almost none of it transfers.** The "$1.2M bonus" and "+42% productivity from day one" have no primary source and are a recognizable engagement template — the same post circulates with the pipeline at 5, 8, and 9 steps and with different models named each time. *That mutation is the proof*: when the step count changes depending on who is posting, there is no underlying system. Two things in it are real. The model names (`claude-fable-5`, `claude-opus-5`) are current Anthropic products — that is the plausibility prop, not evidence. And the free course is real and worth an hour, but it is **DeepLearning.AI × Neo4j, taught by Andreas Kollegger** — it merely *uses* Google's Agent Development Kit in one module, which is where "free Google course" came from. Publishing it as a Google course would itself be a fact-gate violation. Of the eight steps: **1–4 (Load → Extract → Graph → Index) already exist on this site**, hand-authored, as ~27,000 in-content links and twelve curated relation files. **5 (Query) is what this plan builds, offline.** **6–8 (Memory, Swarm, Update) are padding**, and step 8 — a nightly agent that mutates the graph — is the single item on that list that must never be built here: an unsupervised writer against a corpus with an absolute fact gate, whose articles are narrated aloud in EN and ES, is precisely the failure the fact gate exists to prevent. **The influencer's numbers are barred from this repo entirely** — not in an ADR, not in `docs/handoff/strategic-council-board.md`, not as motivating context. That is how a fabrication reaches `audio.<lang>.json` and gets spoken in two languages.

---

## 2. WHAT WE ALREADY HAVE

**muntin.digital already runs a curated knowledge graph. It is just unjoined, unvalidated, and half-broken.** This reframes the decision from *build* to *repair and extend*.

- **~27,540 unique in-content directed edges** live as `href`s in committed HTML. The committed HTML *is* the database; the data files are a rebuild recipe.
- **~1,100 hand-curated typed relations** across twelve files: `data/cross-surface-map.json` (697 edges, literally an edge list), `library-tags.json`, `tool-knit.json` (37), `glossary-sameas.json` (51), four `glossary-*-anchors.json` (86), `i18n-slug-map.json`, `topics.json`, `post-end-cta.json`, `article-sheet-callouts.json`. **None of them emits JSON-LD** except `glossary-sameas.json`. They render as anchors and nothing else.
- **A consistent identity scheme already exists**: `<page-url>#<fragment>`, 3,035 distinct defined `@id`s **(measured)**, with real site singletons (`/#business` referenced 1,150×, `/#website` 611×, `/cost-index/#catalog` 165×).
- **The Cost Index estate is already a graph**: ~30 JSON files, 231 registered ingredients, 336 source mappings, 39 curated events with 106 primary citations, 8,576 revisions, all deterministic, all CC0, all gated by ~35 cost-index-specific CI steps.

**What is missing is not edges. It is (a) a resolver that proves the edges point somewhere, and (b) a single queryable view.** Consequence for the plan: **nothing here authors a thirteenth curated relation file.** Everything is derived from what is already committed, or it does not ship.

Three defects that follow directly, all **(measured)** today:

| Defect | Scale | Root cause | Fix |
|---|---|---|---|
| `/glossary/#muntin-glossary` referenced 320×, defined nowhere | 320 edges | `scripts/inject-glossary-article-schema.mjs:136` vs `glossary/index.html:52` which defines `#glossary` | one token |
| `library/menu-design-themes/#collection` + ES twin | 148 edges | page defines `#webpage`; 37 ListItems reference `#collection` | one token in `scripts/build-themes-review-board.mjs` |
| bare-page-URL `mainEntityOfPage` | 71 edges | `scripts/enrich-post-seo-v2.py` ran once over part of the corpus and is in **no** pipeline | waiver + backfill |

Plus `cost-index/#index-dataset` (3). **Four root causes account for all 542.** That is decisively inside the "is this layer coherent enough to build on" test.

**Two corrections to the ground reports, both verified:** the claim that 162 ES `inDefinedTermSet` refs dangle is **false** — `/es/glossary/#glossary` resolves (172 refs, defined inline on ES term pages). The real ES problem is a *collision*: `es/glossary/index.html:49` defines the **EN** URI. Fix it, but it is 1 edit, not 162 repairs. And the Desk Graph proposal's headline "26 of 78 broken `used_in` refs" is wrong: **78 entries, mixed schema (51 bare slugs / 27 path-shaped), 11 distinct unresolved bare tokens, 21 occurrences, and one of them (`restaurant-schema-markup-6-types-google-uses`) has a live 301 in `_redirects`** — so **10 slugs, 9 genuinely orphaned (measured)**. The defect is real; the number was 2.6× overstated, and on a fact-gated repo that matters before it reaches Don.

---

## 3. THE PLAN

Ordered strictly by expected value per unit effort. Every phase is independently revertible and leaves the build green.

### Phase 0 — Hygiene (2–3 hours, ship this week, no new machinery)

Pure subtraction and known-defect repair. Not one of the four proposals contained a single deletion; three of them cited the same byte-budget cleanup as their funding without shipping it.

**What ships:**
- `wrangler.jsonc` tar: add `--exclude=data/cost-index-history.json --exclude=data/cost-index-readings.prev.json --exclude=tests --exclude=lighthouserc.js --exclude=playwright.config.mjs`. **~−14 MB shipped, zero page referents.** Verified: `data/` is **not** on the exclude list today; `docs/` **is**.
- Pin `pagefind` and `lightningcss` to exact versions. They run at build steps 80–83 — **after** `check-all.mjs` at step 76 — so an upstream API change breaks the deploy in the only ungated region of the chain.
- `data/library-tags.json#tools`: 10 keys against 7 live tool dirs **(measured)**. Dead: `seo-grader, schema-check, search-ideas, tech-stack, compare, page-health`. Missing: `audits, start, vendor-benchmark`. This is the root cause of the 225-page retired-link tail feeding dead tools into 84 glossary pages, and fixing it repairs link-mesh edges #4, #5, #19, #20 at once.
- Regenerate `scripts/check-all-baseline.json` before any new gate is judged against it.
- Strike the dead HowTo line from `llms.txt` (Google ended FAQ rich results 2026-05-07 and deprecated HowTo in 2023; 262 `HowTo` nodes are inert and that claim is now false-in-spirit).
- Add `scripts/build-llms-full.mjs` to the build chain — **but first enumerate its write set.** It also writes `es/llms-full.txt` and `feed-llm.json`, undeclared, and the committed `llms-full.txt` is 3,842 bytes stale. Register all three with `--check` or none.
- One line in `assets/site.js`: `plausible('Search Open')` beside the existing `Share` / `Voice Search` events.

**Gate:** none needed — these are deletions and a version pin.
**Success signal:** `dist/` drops ~14 MB; `check-retired-links.mjs` count falls from 225; the search-open counter starts.

### Phase 1 — The entity-resolve gate + the four repairs (one day) ← **this is the shippable-in-a-day increment**

**What ships:** `scripts/check-entity-resolve.mjs` (~140 lines). It parses every `<script type="application/ld+json">` in all 1,358 HTML files, and asserts:
1. every block parses (nothing checks this today across 2,055 blocks);
2. every **bare** `@id` reference (`{"@id": "…"}` with no other keys) resolves to a node defined somewhere on the site;
3. no `@id` is defined by two pages with different types (catches the `es/glossary/index.html:49` EN-URI collision).

Shipped in the same PR, the repairs that take the gate green:
- `scripts/inject-glossary-article-schema.mjs:136` → `#glossary` (**320 edges**)
- `scripts/build-themes-review-board.mjs` → make the `CollectionPage @id` `#collection` (**148 edges, EN+ES**)
- `es/glossary/index.html:49` → `/es/glossary/#glossary`
- `scripts/inject-topic-page-schema.mjs` `TOPIC_LABELS` 7 → 9 **(measured)** — `ai-search` and `cost-data`, the two most on-funnel topic pages, currently ship **zero JSON-LD in both locales** because of `if (!TOPIC_LABELS[slug]) continue;`
- a dated `WAIVERS` block for the 71 bare-URL `mainEntityOfPage` refs, with the root cause named and `enrich-post-seo-v2.py`'s pipeline-orphan status recorded

**Gate discipline:** registered in `scripts/check-all.mjs` **without** the `(idem)` suffix (it is an honesty gate, not a regeneration check), added to `BASELINE_DENYLIST`, and **fail-CI from day one against the scoped assertion**. Verified precedent for why: `scripts/check-locale-parity.mjs:230–234` has been warn-only "during initial rollout" since rollout; `check-retired-links.mjs` holds 225 pages as permanent warn-only "tracked roadmap debt"; the baseline file has rotted. **Warn-only gates do not get promoted in this repo.** Scope the assertion so it can be green on day one, then widen — do not ship a red gate you intend to fix later.

**Effort:** 1 focused day. ~1.5 s of CI against a 60 s budget.
**Success signal:** 542 → 0 unresolved, with exactly one documented waiver class (the 71 `mainEntityOfPage`), and CI red on the next regression.

Also on day one, zero code, 20 minutes: create `docs/handoff/citation-log.md` and run the **day-0 citation baseline probe** — 12 fixed questions ("wholesale price of butter", "restaurant food cost index", "edible yield of broccoli", …) across ChatGPT, Perplexity, Google AI Mode, and Claude, recording verbatim whether muntin.digital is named or linked. This is the only artifact anyone proposed that can *falsify* a thesis rather than confirm activity, and it prices every later phase.

### Phase 2 — The claim-provenance gate (one day)

The absolute fact gate's own spine is unvalidated in both directions, and this is the highest fact-gate-value work available anywhere in the four proposals.

**What ships:** `scripts/check-claim-provenance.mjs` (~130 lines), reading `data/sourced-claims.json`:
- **Forward:** every `used_in` bare slug resolves to a directory on disk under `library/`, `blog/`, `es/library/`, `es/blog/` — **and is `_redirects`-aware**, so a retired slug with a live 301 counts as resolved, not broken. Without this the first run reports deliberate retirements as defects and self-kills for the wrong reason.
- **Schema:** `used_in` is a mixed field holding bare slugs alongside `tools/…`, `scripts/…`, `docs/…`, `ledger/`, `es/…`, `index.html` **(measured)**. Gate only the bare-slug lane; report the rest.
- **Inverse:** every article carrying a rendered `<details class="cite">` drawer that no registry claim names. **Measured: 163 drawers across 48 EN library+blog files, zero of them machine-linked to the registry that governs them.**

**Gate:** fail-CI on the bare-slug lane (currently ~9 genuine breaks after the redirect exclusion — closeable in an afternoon). The inverse direction ships as a report, not a gate, until the registry linkage convention exists.
**Effort:** 1 day.
**Success signal:** the ~9 orphaned provenance targets are dispositioned (article written, `used_in` corrected, or redirect added), and CI reds if a future article deletion orphans another one.

### Phase 3 — Three standalone reports, no graph (one day)

The critics converged, correctly, on this: three of the seven "graph queries" are each ~30 lines of Node and need no artifact. Write them as greps first. If they answer the question, the graph is ceremony and we have learned that for one day instead of a week.

- `scripts/report-orphans.mjs` — pages with <2 in-content inbound links, chrome excluded. Prescribed in `docs/editorial/the-hundred.md` §12 action 5 and never built. Known targets: `/cost-index/events/` and `/cost-index/lab/` (the ADR-011 surface, reachable only via nav), 7 EN + 7 ES sheets, `/library/restaurant-prime-cost/`.
- `scripts/report-uncovered-vocabulary.mjs` — glossary terms never linked from any article. The on-funnel dictionary is the orphaned part: `bls`, `fred`, `eia`, `cme`, `measured-derived-absent`, `price-confidence`, `cost-data`, `freshness`. **That output is a content plan.**
- `scripts/report-unjoined-ingredients.mjs` — the 90 slug pairs where `/cost-index/<slug>/` and `/library/ingredient-yields/<slug>/` both exist and neither links nor references the other, while `/llms.txt` already advertises to crawlers that yields "joins on slug to the price index."

**Gate:** none. On-demand, `node scripts/report-*.mjs`, stdout only. **No queue file, no board sentinel.** A machine-written backlog stamped into `docs/handoff/strategic-council-board.md` would churn the one hand-written document a fresh context depends on, and this shop has three verified precedents of backlogs that stopped being worked.
**Effort:** 1 day for all three.
**Success signal:** **items closed, not items found.** If nothing from these reports gets fixed in four weeks, Phase 4 does not happen.

### Phase 4 — The desk graph (2–3 days, **conditional on Phase 3 items being closed**)

Only two questions genuinely need a multi-hop artifact, and they are the ones no grep answers:
- **EN↔ES parity by entity** — not "does the ES page exist" (that is `check-locale-parity.mjs`, already warn-only) but "does the ES node carry the same declared edges." Known drift: companion kit **31 EN / 0 ES** on sheets, **4 EN / 0 ES** on tools; KnitRail blog **11 EN / 1 ES**.
- **Staleness by entity** — article → cites → claim → `date_verified`, joined with article → mentions → ingredient → latest edition → `flag.elevatedWeeks`.

**What ships:** `scripts/build-desk-graph.mjs` → **`docs/graph/desk-graph.json`** (verified: `docs` is on the tar exclude list, so **0 shipped bytes, 0 client bytes, TBT untouched**), plus `scripts/check-desk-graph.mjs`.

**The one load-bearing rule:** every edge carries `derivation ∈ {rendered, declared}`, a closed enum with **no third value**. `rendered` = this `href` exists in committed HTML right now. `declared` = this is a row in a committed, human-curated data file. There is no `inferred`, no `extracted`, no `suggested`, and no `candidate` lane — because a quarantine file is a promotion path, and a quarantine file written to `data/` would *publish*.

**Build placement is not a preference, it is a requirement:** immediately before `node scripts/check-all.mjs` at step 76. Steps 69–75 (`inject-css-cache-bust`, `inject-lazy-script-loader`, `migrate-warm-palette`, `build-dark-mode`, `build-css-shells`, `inject-css-shells`) all rewrite HTML. A generator that reads rendered HTML and is then `--check`ed at step 76 must run after every rewriter, or it produces the silent end-of-build drift that caused PR #488 and PR #504. Three of the four proposals got this wrong; the ADR records it so nobody gets it wrong again.

**Gate:** `check-desk-graph.mjs` asserts the closed enum, no dangling node ref, `--check` byte-stability (explicit sort at every `readdirSync`, no `Date.now()`), and that the artifact contains no URL matching `check-fabrications.mjs`'s five external-domain BLOCKED patterns (`docs/handoff/` is scanned by that gate; `docs/editorial/` is not — put the artifact where it will not red the hardest gate in the repo from an unshipped file).
**Effort:** 2–3 days.
**Success signal:** the EN/ES parity query surfaces drift that then gets repaired, and one staleness hit produces one article revision.

### Phase 5 — Off-domain identity (conditional on the 60-day probe re-read)

**Do not start until the day-0 probe has a 60-day re-read**, and not at all if the probe shows Muntin is already cited on most questions.

- **Zenodo/DataCite deposit** of the CC0 edition snapshot, backfilled into `identifier` + `sameAs` — the only component in the entire dossier whose evidence base is the measured off-site-mention correlate (r=0.664 for branded mentions vs 0.218 for backlinks), and it is manual, operator-Mac, no repo code.
- `scripts/inject-cost-index-identity.mjs` stamping `identifier`, `spatialCoverage: "US"`, `provider` onto the existing `#dataset` node. These are document facts and are safe.
- **`sameAs`/Wikidata QIDs are capped at the 12 basket ingredients, permanently.** A QID is a published identity claim, not a navigational link; QIDs get merged and redirected upstream and this container has no network to check. 81 rows is a rot surface; 12 is re-verifiable in one sitting.
- **Prerequisite, written before the first mint:** a revision-and-supersession policy. `data/cost-revisions.json` holds **8,576 revisions**; there are **2 week-snapshots**. A DOI is irrevocable. Minting a permanent citable identifier on a snapshot the pipeline is designed to correct, with no retraction path, directly contradicts the revisions ledger the site built to be honest about exactly this. No proposal addressed it.

**Placement note:** put the injector in the `wrangler.jsonc` build chain, **not only** in `cost-index-refresh.yml`. There are already ~70 writer-type checks outside the build chain, which means editing their source JSON reds CI until Don runs a workflow on his Mac. Do not add to that population.

---

## 4. WHAT WE ARE EXPLICITLY NOT DOING

**Neo4j or any hosted graph database.** Dead on four independent grounds, any one sufficient: (1) there is no origin server — deployment is Workers Static Assets plus a Worker; (2) `_headers:323` sets `connect-src 'self'`, so **no browser on this site can reach an external graph or vector endpoint, period**; (3) widening CSP contradicts the published privacy posture on `/never/`, `/privacy.html` and `/cookies.html`, which `check-no-third-party-plausible.mjs` exists to defend; (4) AuraDB Free pauses after 72h inactivity and deletes after 30 days — a monthly-cadence one-person site *will* trip that timer. Both viral posts push Neo4j and it is the single worst fit on the list for this architecture.

**A nightly agent that updates the graph (viral step 8).** An unsupervised writer against a fact-gated corpus whose articles are rendered to `audio.<lang>.json` and spoken aloud in EN and ES. This is the most dangerous single item in the post and it is not a close call.

**LLM entity/relation extraction anywhere in the build, CI, or publish path.** Measured relation-extraction precision in the literature is "frequently exceeding 75%" — i.e. roughly **1 in 4 relations wrong** — with hallucination the dominant error type. Over ~1,000 article→entity edges that is ~250 fabrications, each structurally indistinguishable from a verified one. Microsoft's own best cost/quality point (LazyGraphRAG) uses **no LLM extraction at index time**, which means deterministic derivation is not a compromise here — it is the design that makes a graph publishable at all. No `ANTHROPIC_API_KEY` in CI, ever.

**GraphRAG retrieval, RRF fusion, and embeddings.** DEFER, not reject, but the burden is on a measurement that does not exist. Two reasons. First, the corpus is ~170K tokens, ~5× below the threshold where graph indexing pays. Second — and this killed it — the proposal's central ROI claim rests on a **misreading of the code it wants to delete**. `assets/site.js:683` `COMMON_QUERY_REDIRECTS` handles queries that return zero results *because the words are too frequent* (`web, website, menu, restaurant, tools, library, glossary, system, colophon`): navigational hub words with exactly one correct destination each, already served by a deliberate "start here instead" panel. Replacing 12 correct hand-picked answers with a 910-phrase ranked candidate list is a **regression**, and the proposer's own eval proves it (421 candidates for "food cost" with `/glossary/` on top; `/cost-index/butter-lettuce/` ranked above `/cost-index/butter/` for "butter price"). Reopen only if the new `Search Open` event shows material usage **and** a month of real queries shows >30% are paraphrases the vocabulary misses. The one salvageable win — `coriander → cilantro`, `scallion → green-onion` from `data/ingredient-aliases.json` — is ~15 rows added to the map that already exists.

**Publishing a derived `about`/`mentions`/`relatedLink` mesh across ~800 pages.** The only controlled experiment on exactly this question (Ahrefs, May 2026: 1,885 pages that added JSON-LD vs 4,000 matched controls, 30-day pre/post) moved AI citations by a statistically indistinguishable amount — AI Mode +2.4%, ChatGPT +2.2%, AI Overviews −4.6%. Google's May-2026 `ai-optimization-guide` states you don't need new markup or machine-readable files to appear in Search, and documents **zero** Search use for `about`, `mentions`, `relatedLink`, `significantLink`. Against that, the downside is asymmetric: a spammy-structured-data manual action (markup describing content not visible on the page) causes **all** markup on that page to be ignored — which would take out the `Dataset` blocks on 177 ingredient pages, the one genuinely evidence-backed structured-data asset the site has. And ~70% of the proposed new edges would come from **266 machine-generated ingredient-yield pages**, which is the exact fact pattern that policy describes. Betting a real asset against a null-measured upside is negative EV at any probability.

**A CC0 `cost-index/graph.json` export.** No identified consumer; its own author's kill criterion was "if fetched under 10/month, delete it," which is an argument for measuring first. It also advertises a new surface in `llms.txt` that must then stay fresh, in a repo that has already demonstrated that exact failure (`build-llms-full.mjs` is in no pipeline, so `llms-full.txt` — the file stating the licensing terms — ships stale). **Keep the best idea from it at zero cost:** the `notPublished` declaration — the edges Muntin deliberately refuses to compute (`MOVES_WITH`, `CORRELATES_WITH`, `CAUSED`, `LEADS`, `WILL_MOVE`) and why — goes in prose on `/cost-index/methodology/` and in `llms.txt`. That refusal is the honest differentiator and it does not need a JSON export to be readable.

**`data/graph-candidates.json` (the LLM quarantine lane).** Verified: `data/` is **not** on the tar exclude list and `robots.txt` is `Allow: /`. The one file designed to hold unverified, model-proposed edges would be served at `https://muntin.digital/data/graph-candidates.json` and crawled by GPTBot and ClaudeBot. A quarantine that publishes is not a quarantine. And it is a fence for an animal that does not exist and that this ADR forbids — the absence of a promoter script *is* the control.

**Any graph work in `/home/user/Muntin-Invoice-Decoder`.** See §5.

**Any of this displacing the Cost Index cadence.** One adjudication first, because three proposals and one critic got it wrong in opposite directions: the dispatch went **weekly → monthly on 2026-07-09 by founder call** (`.github/workflows/cost-index-dispatch.yml:2`), and it is **current** — `check-cost-index-dispatch-fresh.mjs` reports edition 2026-07-09, data asOf 2026-07-22, 13d lag against a 38d limit **(measured)**. So "the cadence has slipped, abandon everything" is false. But so is "protect the *weekly* cadence" — every archive-depth and DOI argument in the dossier must be re-priced at **12 editions/year, not 52**, and Phase 5's value drops accordingly. (`data/cost-index-editions.json` still ends at 2026-07-06 while the dispatch is at 2026-07-22 — worth a look, see §7.)

---

## 5. THE HONESTY FENCE

Non-negotiable, written as assertions a gate can execute.

1. **No LLM in the build, CI, or publish path.** No `ANTHROPIC_API_KEY` or equivalent in `.github/workflows/`; no graph script imports an LLM SDK. *Testable:* grep the workflow files and `scripts/` for provider names and key env vars.
2. **Every published edge is a statement about a document, never about the world.** An edge may assert only "this file contains a rendered anchor to that URL" (`rendered`) or "this row exists in this committed, human-curated file" (`declared`). *Testable:* `derivation` is a closed two-value enum; the gate re-derives every `rendered` edge from committed HTML rather than trusting the artifact.
3. **The graph carries no numbers.** No price, percentage, magnitude, direction, cause, lead-lag, seasonal band, basket weight, or date-of-event. *Testable:* the generator's source is grepped for `data/sourced-claims.json`, `data/cost-index.json`, `data/cost-index-drivers.json`, `data/cost-index-events.json`, `data/cost-index-editions.json` — the technique `check-cost-index-independence.mjs` already uses on 15 pipeline files. **This is a lint, not a firewall** — the real containment is determinism, and the ADR must say so rather than overclaiming.
4. **No ingredient↔driver/event adjacency in any new surface.** The `dir === directionExpected` predicate exists in exactly one generator (`build-cost-index-dispatch.mjs:916`) and is why the 07-06 edition attached **1** driver from 6 catalog entries and 54 candidate edges. Any new surface that can place a driver or event beside an ingredient must carry the predicate or ban the edge type. *Testable:* `--self-test` plants such an edge and asserts rejection.
5. **No artifact lands in `data/` unless publishing it is a deliberate, licensed, documented decision.** `data/` ships and is crawlable; `docs/` does not. *Testable:* the gate asserts every graph artifact path is on the tar exclude list.
6. **`check-fabrications.mjs` cannot detect a false relation and must never be cited as if it could.** It is a BLOCKED-pattern registry (bio drift, invented cohorts, fake URLs, unregistered percentages). Three critics independently flagged this; strike the "it's fact-gate-scanned, therefore safe" reasoning wherever it appears. Determinism is the argument. It is sufficient. Say only that.
7. **Curated is not verified-current.** `cross-surface-map.json` carries `_lastReviewed: 2026-06-03`; `glossary-autolink-aliases.json`, `2026-06-02`; no freshness check exists on any of the eleven curated relation files across 259 gates. **No curated row is promoted to a published, machine-readable relation until a `_lastReviewed` freshness warn exists on its file**, reusing `check-cost-index-drivers.mjs`'s `retrievedAt` pattern verbatim.
8. **No new gate ships warn-only.** Scope the assertion so it is green on day one and fail-CI, or don't ship it. Three verified precedents of permanent warn-only in this repo; a gate nobody trusts is worse than no gate, because it still blocks deploys.
9. **A retraction path exists before the first permanent identifier.** Any published `@id`, `sameAs`, or DOI needs a written answer to "this is found wrong six months later, after agents joined on it." A site whose differentiation is withholding rather than guessing cannot have a publish-only-never-retract posture.
10. **The product repo is off-limits, and the reason is contractual.** `/home/user/Muntin-Invoice-Decoder/scripts/no-llm-ci.sh` globs the **entire repo** (only `docs/` excluded) and bans LLM imports, HTTP destinations, and env vars. Its source is **published verbatim to customers** at `/verify/no-llm-ci` via `apps/web/lib/verify-content.generated.ts`, and it is cited in the **DPA security-measures table** (`apps/web/lib/legal-content.generated.ts:1495`). The storefront makes the promise in four places — "a build gate blocks any release that would so much as add a language-model library" (`never/index.html:436`), "no language model **anywhere** in Muntin Ledger's invoice-reading path" (`ai/index.html:460`). An offline graph script importing `@anthropic-ai/sdk` fails CI *and* falsifies live marketing copy *and* touches a contractual representation. The boundary the copy already draws is **customer data vs. published content**; the storefront side is on the record ("LLM providers draft this website; they never see a customer's invoice"), which is exactly why graph work lives here and nowhere else. Changing this is a v4-plan amendment plus a coordinated copy change across both repos — not an engineering decision.

---

## 6. MEASUREMENT

Three of the four proposals defined success as "the gate found defects," which measures only that the instrument runs. Real signals, with dates:

| Signal | Baseline (today) | Read at 60 days | Verdict rule |
|---|---|---|---|
| **Unresolved `@id` refs** | 542 occ / 75 URIs **(measured)** | 0, with 1 waiver class | Phase 1 succeeded or it did not. Binary. |
| **Orphaned `used_in` provenance** | ~9 (after `_redirects`) | 0 dispositioned | Phase 2 binary. |
| **Citation probe** (`docs/handoff/citation-log.md`) | run day 0: 12 probes × 4 engines | re-run identical probes | If <2 of 4 engines name muntin.digital on ≥1 probe **and** no movement from baseline → **Phase 5 is dead**, keep `identifier`, drop the rest. |
| **AI-crawler fetches of existing CC0 surfaces** | Workers Logs query (zero code — `run_worker_first: true` + observability already on) | same query | If `llms-full.txt` + `claims.json` fetches by GPTBot/ClaudeBot/PerplexityBot are near zero, every "make it machine-readable" bet is dead and Phase 5 does not happen. |
| **Search modal open rate** | unmeasured (verified: only `Share` and `Voice Search` events exist) | 30 days of the new event | Negligible → the retrieval angle is permanently closed for the cost of one line. |
| **Report items *closed*, not found** | n/a | items closed ≥ items added | Fewer closed than added over 4 weeks → **Phase 4 does not happen**; delete the reports rather than let them decay into ignorable noise. |
| **Search Console: Dataset + Article impressions/clicks** | pull today, before Phase 1 | 60-day compare | Any drop, or any manual action, on the 177 Dataset pages → revert. Nothing here is worth risking that asset. |
| **Deploy incidents caused by new gates** | 0 | 0 | >2 in a quarter, or one `--check` drift whose cause is not immediately obvious → pull the generator from `wrangler.jsonc` the same day. |

**The one thing that would make all of this moot:** if the day-0 probe shows Muntin is already cited on most questions, the marginal value of everything past Phase 2 is near zero. Run it before writing Phase 5's first line.

---

## 7. OPEN QUESTIONS FOR THE OPERATOR

**1. Are the 10 dangling `used_in` slugs lost articles or deliberate retirements?**
`google-ai-mode-reservation-booking-restaurant-2026`, `an-honest-doordash-math-for-independent-restaurants-2026`, `uber-eats-vs-doordash-vs-grubhub-restaurant-math-2026`, `is-doordash-worth-it-for-restaurants-in-2026`, `loyalty-programs-for-independent-restaurants-what-works-2026`, `how-to-respond-to-google-reviews-restaurant-playbook-2026`, `restaurant-schema-markup-complete-paste-ready-example`, `service-charges-vs-tipping-restaurant-operator-math-2026`, `why-your-restaurant-loses-reservations-every-night` (+ one already 301'd). If these are articles you removed, Phase 2 is a gate with a redirect-backfill task attached. If they are planned articles, `used_in` is functioning as an intentional queue, the integrity framing is wrong, and Phase 2 shrinks to the inverse direction only.

**2. Is `data/cost-index-editions.json` supposed to lag the live dispatch?**
The dispatch is at data asOf **2026-07-22**; the editions spine ends at **2026-07-06** **(measured)**. If that is a bug, it is more urgent than any graph work — the longitudinal spine is the citable asset. If it is by design (the spine only appends on a full refresh run), say so in the ADR so nobody "fixes" it.

**3. Is `library/menu-design-themes/` worth repairing, or is it prune territory?**
**148 of the 542 dangling edges (27%)** live on the Menu Design Suite theme board — a surface whose marketing was removed 2026-06-17 and whose tool is retired. One token in `build-themes-review-board.mjs` fixes it; deleting the surface fixes it harder. This decision changes Phase 1's scope and the site's shipped page count.

**4. Zenodo/DOI — yes, and under what supersession policy?**
It is the only Phase-5 item with real evidence behind it, it is manual and fits a one-person budget, and it creates the off-site node that correlates 3:1 over backlinks. But the archive is **2 snapshots deep, on a monthly cadence, over a dataset with 8,576 recorded revisions**, and a DataCite DOI cannot be retracted. Either write the versioning policy first, or wait until archive depth justifies it. **No DOI gets minted without an answer to "what happens when a DOI'd snapshot is revised."**

---

*Not urgent, correcting a stale ground report:* the product repo's vendored Cost-Index snapshot was flagged by two critics as going dark **2026-08-03, six days out, highest-ROI item in the dossier**. It has already been re-vendored — `_asOfRange` is now **2026-07-18..2026-07-24**, `check-cost-index-snapshot-fresh.mjs` reports "fresh — freshest 4d, oldest 10d; 24 slugs, 0 dark" **(measured)**. The real deadline is ~**2026-08-17**. Put it on the calendar; it is not this week's emergency. The genuinely highest-ROI item on the product side remains unchanged and needs no code at all: **hand-curate aliases for the 68 storefront ingredient slugs that have no entry in `packages/cost-alerts/data/ingredient-aliases.json`** — that registry is 32/32 clean against the storefront today, and every alias added is direct new coverage for the Ledger's market-prior valuation rung.

---

## The four proposals, as designed

### The Entity Spine — data/entity-graph.json + the anchor-backed edge invariant

One deterministic, committed graph artifact built from directory structure + rendered anchors + the 11 curated edge files already on disk, gated by the JSON-LD parse/resolve check the 259-check CI has never had — then, and only then, emitted as real @id-referenced relations into the shipped JSON-LD.

- honesty-gate risk: `low` · maintenance: `medium`

### The Retrieval Graph — Pagefind + entity vocab + one-hop RRF fusion

Materialize the site's already-existing link mesh into two ~45 KB per-locale shards, resolve queries against a 910-phrase controlled vocabulary derived from files already in the repo, and fuse graph-hop candidates with Pagefind's ranks via RRF — replacing two hand-written ranking hacks in site.js with derived data, with zero LLM anywhere in the path.

- honesty-gate risk: `low` · maintenance: `low`

### The Citable Spine — Cost Index as a joinable, identified, measured public dataset

Stop trying to be found and start being joinable: give every Cost Index ingredient a human-verified external identity (Wikidata QID, then a DOI), publish one CC0 provenance graph that states what it refuses to assert, and — the part everyone skips — instrument whether any of it actually produces a citation.

- honesty-gate risk: `medium` · maintenance: `medium`

### The Desk Graph — an inward-facing editorial integrity graph + work queue

Materialize the graph the site already has into one deterministic, LLM-free artifact under docs/ (unshipped, unfetched), then spend it entirely on authoring leverage and honesty enforcement: seven named queries that become CI gates and a work queue stamped into the resume-here board.

- honesty-gate risk: `low` · maintenance: `medium`



---

## Critic scores

**Honesty & fact-gate integrity review. I verified the load-bearing claims against the repos rather than accepting them.  …**

- `ADOPT-REDUCED` (7/10) — The Entity Spine — data/entity-graph.json + the anchor-backed edge invariant
- `DEFER` (5/10) — The Retrieval Graph — Pagefind + entity vocab + one-hop RRF fusion
- `ADOPT-REDUCED` (6/10) — The Citable Spine — Cost Index as a joinable, identified, measured public dataset
- `ADOPT-REDUCED` (7/10) — The Desk Graph — an inward-facing editorial integrity graph + work queue

**Over-engineering & maintenance reality  Headline: none of the four chased the viral post's aesthetics — no Neo4j, no swa…**

- `ADOPT-REDUCED` (6/10) — The Entity Spine — data/entity-graph.json + the anchor-backed edge invariant
- `DEFER` (4/10) — The Retrieval Graph — Pagefind + entity vocab + one-hop RRF fusion
- `ADOPT-REDUCED` (7/10) — The Citable Spine — Cost Index as a joinable, identified, measured public dataset
- `ADOPT-REDUCED` (6/10) — The Desk Graph — an inward-facing editorial integrity graph + work queue

**ENGINEERING & DEPLOY RISK REVIEW — verdicts grounded in measurements I ran in-container against a near-clean tree, not i…**

- `ADOPT-REDUCED` (7/10) — The Entity Spine — data/entity-graph.json + the anchor-backed edge invariant
- `DEFER` (5/10) — The Retrieval Graph — Pagefind + entity vocab + one-hop RRF fusion
- `ADOPT-REDUCED` (5/10) — The Citable Spine — Cost Index as a joinable, identified, measured public dataset
- `ADOPT-REDUCED` (7/10) — The Desk Graph — an inward-facing editorial integrity graph + work queue

**ROI-versus-status-quo review. I verified the load-bearing numbers rather than trusting them, and three findings reframe …**

- `ADOPT-REDUCED` (6/10) — The Entity Spine — data/entity-graph.json + the anchor-backed edge invariant
- `REJECT` (3/10) — The Retrieval Graph — Pagefind + entity vocab + one-hop RRF fusion
- `ADOPT-REDUCED` (6/10) — The Citable Spine — Cost Index as a joinable, identified, measured public dataset
- `ADOPT-REDUCED` (6/10) — The Desk Graph — an inward-facing editorial integrity graph + work queue

