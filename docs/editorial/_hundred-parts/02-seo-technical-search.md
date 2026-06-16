## Domain II — SEO / Technical Search

*Positioning Council batch · specialists 09–16 · prepared 2026-06-16. Strategy only; one part-file, no live-site edits.*

**Domain-wide honesty notes.** Three load-bearing facts changed the shape of every brief below and are dated/sourced inline where used: (1) Google **fully retired FAQ rich results on 2026-05-07** (GSC reporting removed June 2026, API Aug 2026) and **HowTo rich results on desktop in Sept 2023** — FAQPage/HowTo remain *valid schema Google still parses to understand a page*, but they no longer paint a SERP feature (Search Engine Journal; Google Search Central, accessed 2026-06-16). (2) **Dataset structured data was NOT deprecated** and remains actively supported in 2026 (Google Search Central, Dataset docs; schema.org usage dataset 2026-06-04, accessed 2026-06-16). (3) Google's **March-2024 scaled-content-abuse** policy judges intent/outcome, not production method; Zillow survived because pages carried proprietary MLS data, template-swap sites lost 75–90% visibility (Google; AirOps, accessed 2026-06-16). Every other number is repo-sourced (file cited) or labeled illustrative / analyst assessment. Two live defects surfaced during the audit are flagged honestly in the briefs that own them (09, 10).

---

### 09 · Technical-SEO Architect

**Aspect & why it decides success.** At ~1,115 sitemap URLs (`sitemap.xml`, `grep -c <loc>` = 1115), crawl correctness compounds: one mislabeled breadcrumb or stale redirect, multiplied across the corpus, teaches Google the wrong site shape. A static site's structural asymmetry over Toast/DoorDash/Wix is that *every* URL is pre-rendered HTML — no JS-execution tax on the crawler — so the win is being flawlessly legible, not merely present.

**Current-state audit (score 8/10).** Strong spine: `build-sitemap.mjs` auto-walks the tree, emits hreflang EN/ES/x-default + `<image:image>` per URL (961 image entries confirmed), excludes noindex dirs, sources `lastmod` from git, and ships a `--check` gate in `check-all.mjs`. `robots.txt` is disciplined (drafts/admin/sign-in/workbench/account disallowed; per-page `max-snippet:-1, max-image-preview:large`). `_redirects` is well-reasoned (301 equity preserved through three restructures) but is **bumping Cloudflare's dynamic-rule ceiling** — the file itself documents a build failing at 42 source-wildcards and the blog→library 301 set pushed off into `src/lib/blog-library-redirects.js` (Worker Map) to dodge the 100-rule cap. Defect found: the `/library/restaurant-schema-markup-guide/` BreadcrumbList still names position 2 **"Blog" → /blog/** (stale from the Phase-7 split) — a crawled URL whose own breadcrumb contradicts its canonical path.

**Benchmark gap (Wikipedia).** Wikipedia's edge is not freshness; it is a clean, stable, deeply-cross-linked URL graph machines trust. Muntin already out-crawls JS-heavy incumbents on render cost; the gap is residual self-contradiction (breadcrumb/path mismatches) and a redirect budget that's one restructure from a wall.

**The Extend-Past move.** Be the site that is *internally consistent at 1,100 URLs* — a thing a JS-rendered SPA competitor structurally cannot guarantee because their breadcrumbs and canonicals are assembled client-side. Ship a single crawl-coherence gate that proves URL ↔ canonical ↔ breadcrumb ↔ hreflang agree on every page.

**Concrete actions.**
1. Fix the `/library/*` breadcrumb "Blog" mislabel at the injector (`inject-blog-breadcrumbs.mjs` / `update-blog-breadcrumb-schema.mjs`); re-run across all migrated slugs. **S × 4**
2. New `check-crawl-coherence.mjs` in `check-all.mjs`: assert each page's canonical == its own URL, breadcrumb leaf item == canonical, hreflang self-ref present. **M × 5**
3. Migrate the remaining static `/studio/*` and tool-merge 301s into the Worker Map to reclaim `_redirects` budget headroom before the next IA move. **M × 3**
4. Add `lastmod`-honest sitemap segmentation (split `sitemap.xml` into an index + per-section maps) so 1,100+ URLs stay under the 50k/50MB guideline with room to 10×. **S × 3**
5. Emit a `<link rel="alternate" type="application/ld+json">`-style discovery hint pointing crawlers at `/llms.txt` from `robots.txt` (already has Sitemap:; add a comment-documented `# LLM-Index:` line). **S × 2**

**Risks & honesty-gate notes.** Redirect consolidation risks a self-loop (the file already records an `ERR_TOO_MANY_REDIRECTS` from a `/studio/*` blanket) — enumerate static rules, test each. No content claims here, so honesty gate is low-risk; the breadcrumb fix *removes* a falsehood (a library page claiming Blog parentage).

**One proof metric.** GSC "Indexed, not submitted in sitemap" + "Duplicate without user-selected canonical" → 0; crawl-coherence gate green on 100% of URLs.

---

### 10 · Structured-Data Engineer

**Aspect & why it decides success.** Structured data is the layer answer engines lift verbatim. With FAQ/HowTo SERP features now retired (see domain note), the value of schema shifts from *painting rich results* to *feeding machine comprehension and AI citation* — and the one type that still earns a Google feature, **Dataset**, is exactly the one Muntin already does best.

**Current-state audit (score 7/10).** The graph is genuinely deep: per-article `@graph` with BlogPosting/Article + AudioObject + SpeakableSpecification + BreadcrumbList, a second Article node carrying `abstract` + `mentions[]` of DefinedTerms (`library/restaurant-schema-markup-guide/index.html`), and homepage `["ProfessionalService","LocalBusiness"]` at `#business` with `areaServed`, `knowsAbout`, `hasOfferCatalog`, plus `SoftwareApplication` for Ledger and a `Person` for Don (`index.html`). The **Cost Index Dataset is best-in-class** — `variableMeasured` PropertyValue with min/max + trend `valueReference`, `temporalCoverage`, CC0 `license`, `measurementTechnique`, `isBasedOn` USDA/BLS/FRED, and `DataDownload` JSON+CSV (`cost-index/ribeye/index.html`). Two honest deductions: (a) **live defect** — `glossary/ai-overview/index.html` has correct visible HTML but its `DefinedTerm` + `Article` JSON-LD carry `"name":"Commission"` and Commission's definition (verified: `glossary/commission/` and `glossary/above-the-fold/` are clean, so this is an isolated injection bleed, not systemic). An engine lifting that node mislabels the AI-Overview entity. (b) The ledger's premise "richest restaurant-ops schema graph" is undercut by **no `Review`/`AggregateRating` and no `Recipe`** anywhere — defensible on honesty grounds (no fake reviews; Cost Index is reference data, not recipes) but a coverage gap to name.

**Benchmark gap (Google rich-results gallery).** Google's still-eligible high-value types in 2026 are Product, Dataset, LocalBusiness, Event, Recipe (schemavalidator.org; Google Search Central, accessed 2026-06-16). Muntin owns Dataset + LocalBusiness; FAQ/HowTo are now comprehension-only.

**The Extend-Past move.** A giant cannot truthfully publish a CC0, USDA-sourced restaurant-cost Dataset graph — it has no honest primary data and every incentive to gate it. Double down where the schema *still* wins a feature and where the data is real: make the Cost Index the most complete restaurant-ingredient Dataset graph on the open web, and convert the now-decorative FAQ corpus into AI-citation fuel rather than retiring it.

**Concrete actions.**
1. Fix the `ai-overview` JSON-LD name/description bleed at the injector (`inject-glossary-article-schema.mjs`); add a gate asserting `DefinedTerm.name` == page H1 across all 150 terms. **S × 5**
2. Keep FAQPage/HowTo markup (Google still parses it; AI engines lift it) but stop reporting them as "rich-result" wins internally; document the 2026-05-07 retirement in `docs/` so no one "fixes" them by deletion. **S × 4**
3. Extend the Dataset graph: add `Recipe`-free `HowTo`/`Dataset` cross-refs and `sameAs` to Wikidata once the org entity exists (ties to brief 11); ensure every cost-index page's `dateModified` == seed `generatedAt` (gate `inject-cost-index-dataset-date.mjs` already does this — keep). **M × 4**
4. Add `Speakable` to the cost-index `ci-read__line` so voice/answer engines can read the dated market line. **S × 3**
5. Decide `AggregateRating` deliberately: do NOT fabricate; *if* real operator testimonials with consent exist, add `Review` with named authors; otherwise document the abstention as a trust feature. **M × 2**

**Risks & honesty-gate notes.** Any `Review`/`AggregateRating` is a fabrication-gate landmine (`check-fabrications.mjs`) — ship only with sourced, consented, real reviews or not at all. The `ai-overview` fix is a correctness win with zero honesty risk.

**One proof metric.** Rich Results Test passes on 100% of cost-index Dataset pages; DefinedTerm-name gate green on all 150 glossary terms.

---

### 11 · Entity & Knowledge-Graph Strategist

**Aspect & why it decides success.** AI Overviews and Gemini cite *entities* they can resolve, not strings. In 2026 entity authority directly predicts whether a brand is named over competitors (Stackmatix; upGrowth, accessed 2026-06-16). "Muntin" and "Cost Index" must become machine-resolvable things, by name.

**Current-state audit (score 6/10).** Solid internal scaffolding: stable `@id` anchors (`#business`, `#organization`, `#don-goldstein`, `#muntin-glossary`, `#catalog`), a 150-term `DefinedTermSet` hub, and a `DataCatalog`. But entity *grounding to the open graph is thin*: homepage `sameAs` is **all social profiles** (Instagram, LinkedIn, Facebook, GitHub, Bsky, Threads, Yelp) — **no Wikidata, no Wikipedia, no Crunchbase** (`index.html`). The glossary `sameAs` file covers **only 43 of 150 terms** (`data/glossary-sameas.json`, confirmed count 43), so 107 terms float unanchored to schema.org/Wikipedia. "Cost Index" is a `DataCatalog` with a name but no external entity identity.

**Benchmark gap (Knowledge Graph / Wikidata).** Wikidata has **no Wikipedia-style notability bar** and is the single most powerful `sameAs` target because it is a primary input to Google's Knowledge Graph and LLM training pipelines (MLforSEO; Stackmatix, accessed 2026-06-16). Muntin has zero Wikidata presence today.

**The Extend-Past move.** A giant's entities are already in the Knowledge Graph; it gains nothing by seeding niche ones. Muntin can *coin and own* a narrow entity the giant will never bother to define — "Muntin Restaurant Cost Index" — as a citable, dated, CC0 dataset entity, then make every glossary term a resolved node so the whole library reads as one connected knowledge object.

**Concrete actions.**
1. Create a **Wikidata item for Muntin Digital** (org, founded 2026, Silver Spring MD, instance-of: web design studio + data publisher) and one for the **Muntin Restaurant Cost Index** (instance-of: price index / dataset); add both as `sameAs` on `#business`/`#catalog`. No notability bar applies. **M × 5**
2. Raise glossary `sameAs` coverage from 43→120+ of 150 by adding schema.org/Wikipedia/Investopedia anchors for every non-folklore term (skip Muntin-original terms per the file's own rule). **L × 4**
3. Add reciprocal `sameAs` between `#organization`, `#business`, and `ledger.muntin.digital/#app` so the three nodes resolve as one entity (today they only partially cross-link). **S × 4**
4. Publish a `/cost-index/` "about this dataset" entity page with `citation`, `creator`, `temporalCoverage`, and DOI-style stable identity, then submit to Google Dataset Search. **M × 4**
5. Build `knowsAbout`-aligned author entity for Don (FOH manager at Tacombi, Bethesda — singular bio) linking `/about/#timeline`; keep one-restaurant framing (`check-fabrications.mjs`). **S × 3**

**Risks & honesty-gate notes.** Wikidata edits must state only verifiable facts (founding year, location, product names) — no inflated claims; the bio stays singular. Don't claim Knowledge-Graph inclusion as a fact until a Brand Panel actually appears.

**One proof metric.** Google Knowledge Panel or `sameAs`-verified entity for "Muntin Digital"; glossary `sameAs` coverage ≥ 120/150.

---

### 12 · Topical-Authority / Internal-Linking Lead

**Aspect & why it decides success.** Depth-of-coverage plus dense, *meaningful* internal links is how a site signals "we own this topic." Muntin's library (36) + blog (11) + 150-term glossary + tools + sheets + cost-index is already a topic graph; the question is whether the mesh is dense and bidirectional enough to read as authority rather than a pile.

**Current-state audit (score 8/10).** Genuinely strong and gated: `LIBRARY:autolink` sentinels inject glossary links into article bodies; `data/cross-surface-map.json` defines a four-corner Companion Kit (3 articles + tool + sheet + 3 glossary terms) per surface, sentinel-bracketed and `--check`-enforced; `inject-knit-rail.mjs`, `wire-glossary-knit.mjs`, `check-knit-coverage.mjs`, and `Article abstract+mentions` JSON-LD (`mentions[]` DefinedTerms) all reinforce the graph. Articles carry H2 anchor IDs (`inject-h2-anchor-ids.mjs`) for deep-link citation. Gap: the mesh is curated article→glossary→tool; it is lighter on **glossary→glossary** lateral links and on **pillar/cluster hierarchy** (no explicit topic-pillar canonical that every cluster article points "up" to, though `/learn/topics/` exists).

**Benchmark gap (Wikipedia / Investopedia).** Investopedia's authority comes from every term linking laterally to every related term, and from tight pillar→definition→pillar loops. Muntin's article→term spokes are excellent; the lateral term→term web and the explicit pillar spine are thinner.

**The Extend-Past move.** A restaurant-tech rival (Toast blog, DoorDash resources) publishes shallow, siloed marketing posts; none has a 150-term operator glossary wired bidirectionally into 47 sourced articles, a tool suite, and a live dataset. Make the mesh *denser than Investopedia's within the restaurant-ops niche* — a topical graph no competitor can match because none has the primary-source depth to link to.

**Concrete actions.**
1. Add `seeAlso`-style glossary→glossary lateral links (e.g., AI Overview ↔ AEO ↔ schema ↔ rich-results) driven by `data/glossary-*` co-occurrence; gate with `check-knit-coverage.mjs`. **M × 4**
2. Designate explicit topic pillars under `/learn/topics/` (8 topics already counted in `site-counts.json`) and ensure every cluster article links "up" to its pillar and the pillar links "down" to all members. **M × 5**
3. Surface `mentions[]` reciprocity: where article A mentions term T, ensure T's page back-links to A (extend `inject-glossary-article-backlinks.mjs`). **S × 4**
4. Add Cost Index ↔ relevant library articles (menu-engineering, plate-cost) as first-class mesh edges, not just hero callouts. **S × 3**
5. Ship an internal `orphan-page` report (any indexable URL with < 2 internal inlinks) and drive it to 0. **S × 3**

**Risks & honesty-gate notes.** Autolink markers must never land inside attribute values (`check-article-graphics.mjs` rule 8) — preserve sentinel discipline. Lateral links must be genuinely relevant, not link-stuffing (March-2024 abuse policy applies to internal manipulation too).

**One proof metric.** 0 orphan indexable pages; median internal inlinks/term ≥ 5; pillar coverage 8/8 with full up/down loops.

---

### 13 · Local-SEO Specialist

**Aspect & why it decides success.** Muntin is a single DMV operator — local relevance is real, but the honesty gate forbids inventing locations. The decision: depth and truth of *one* place beat the fake multi-city footprint aggregators fabricate, and that depth is exactly what Google Business Profile and local AI answers reward.

**Current-state audit (score 7/10).** Already honest and structured: homepage `#business` is `["ProfessionalService","LocalBusiness"]` with `areaServed` = Silver Spring, Takoma Park, Bethesda, Washington, Maryland, DC (`index.html`), `knowsAbout` includes "Silver Spring Maryland" + "Washington DC metro area", and `GeoCoordinates`/`PostalAddress`/`OpeningHoursSpecification` are present. Crucially, the studio **already retired its fake city lead-gen pages** — `_redirects` 301s `/studio/silver-spring|dc|arlington|bethesda|takoma-park/` → `/studio/` (Phase 9, 2026-06-11) and `/work/` portfolio is sunset. That is the honesty posture done right. Gap: there is no `Restaurant`/venue schema (correct — Muntin is a studio, not a restaurant) and the operator's real workplace (Tacombi, Bethesda) is an authority signal that lives only in bio prose, not as a structured `worksFor`/`OrganizationRole`.

**Benchmark gap (Google Business Profile / Yelp).** Yelp/GBP reward verified, complete, single-location depth. Muntin can't (and shouldn't) farm city pages; the asymmetry is that aggregators *fake* local depth while Muntin can offer *true* DMV-specific operator content (DMV service-charge transition, local wholesale basis).

**The Extend-Past move.** The honest local play isn't more pages — it's DMV-specific *primary data and lived operator detail* the aggregators structurally can't fake: a Silver Spring/DC operator writing real local economics. Localize through *content truth*, not URL multiplication.

**Concrete actions.**
1. Add structured `worksFor` (Tacombi, Bethesda) to the `Person` node — singular bio, verifiable, an authority signal (`check-fabrications.mjs`-safe). **S × 4**
2. Keep the no-fake-city posture; document it on `/methods/` as a positioning proof point ("we deleted our city pages"). **S × 3**
3. Deepen DMV-true content edges: tag the service-charge-vs-tipping and cost-index articles with `spatialCoverage`/`areaServed` = DMV where the data is genuinely local. **M × 3**
4. Ensure GBP for "Muntin Digital" (if claimed) carries `sameAs` parity with the homepage social set + the future Wikidata item (brief 11). **S × 3**
5. Add `contactPoint` parity (`don@muntin.digital`, The Window) across `#business`/`#organization` and `.well-known/security.txt` (already lists both). **S × 2**

**Risks & honesty-gate notes.** Do not reintroduce city landing pages or imply multiple managed restaurants — both are explicit fabrication-gate / bio-drift triggers. `worksFor` must name Tacombi only, present-tense, singular.

**One proof metric.** GBP "complete" + `areaServed` consistency across all org nodes; 0 reintroduced city-page slugs (`check-removed-slugs.mjs` green).

---

### 14 · Programmatic-SEO Engineer

**Aspect & why it decides success.** pSEO is a minefield post-March-2024: scaled template-swap pages lost 75–90% visibility (Google; AirOps, accessed 2026-06-16). The decision is whether scaled pages carry *genuine, differentiated value per page*. Muntin's Cost Index is the rare case where the answer is structurally yes.

**Current-state audit (score 9/10).** This is Muntin's sharpest weapon. `build-cost-index-pages.mjs` emits per-ingredient pages from **gated** `data/cost-index.json` — its header documents the honesty contract verbatim: "Every number rendered here is read at build time… Nothing is hand-typed. No invention can reach the page," prose stays number-free, confidence governs JSON-LD precision, and `check-cost-index-sync.mjs` enforces provenance + freshness. 16 verified ingredients, 13 public pages today, weekly refresh, each with a Dataset + FAQPage + DataDownload (JSON+CSV). Additional honest programmatic surfaces exist: ingredient-yield pages (CIA-table-gated, `check-ingredient-yields.mjs`), cuisine/theme landing pages, seasonality (`build-seasonality.mjs`, "building" state until 2+ years observed). This is Zillow's *proprietary-data* model, not the penalized template-swap model.

**Benchmark gap (Zillow / Tripadvisor).** Zillow scaled on exclusive MLS data; Tripadvisor on real reviews/photos. Muntin scales on USDA/BLS/FRED-sourced wholesale prices — *public* primary data, but uniquely *assembled and dated* for restaurant operators. The gap vs Zillow is only breadth (13 vs thousands of pages), and breadth is safe to grow *only* because each page is genuinely useful.

**The Extend-Past move.** A giant cannot publish a CC0, fully-sourced, weekly-refreshed restaurant-ingredient price graph — no honest primary data, every incentive to gate it behind a POS contract. Scale the Cost Index to the full verifiable basket and let each page answer one real operator question ("what does X cost wholesale, am I overpaying?"), which is exactly what survives the abuse policy.

**Concrete actions.**
1. Promote the remaining verified ingredients (16 verified → currently 13 public) and expand the basket only as sources clear `verified:true` + a live fetch (the gate enforces this). **M × 5**
2. Add a programmatic **"X vs Y" cost-comparison** layer (ribeye vs tenderloin, butter vs oil) generated from the same gated data — each page genuinely useful, none hand-typed. **M × 4**
3. Extend ingredient-yield × cost-index cross-pages (AP→EP cost per edible pound) — true derived value, fully sourced. **L × 4**
4. Add per-ingredient `series.json`/`.csv` discoverability via Google Dataset Search submission (ties to brief 11). **S × 3**
5. Keep the prose-number firewall: never let a live cent into evergreen prose; only the dated, sourced market-read block (gate already enforces). **S × 5** (preserve)

**Risks & honesty-gate notes.** The single largest pSEO risk — thin/duplicate pages — is already mitigated by the gate; the discipline to *not* generate pages for unverified ingredients is the moat. Comparison pages must add real analytical value, not just permute two numbers. Every figure stays build-time-sourced.

**One proof metric.** Cost-index indexed pages growing with **0** `check-cost-index-sync` / `check-shippable-bar` failures; per-page GSC impressions > 0 (no thin-page non-indexing).

---

### 15 · SERP-Feature Hunter

**Aspect & why it decides success.** The answer box is the new top-of-page. But with FAQ rich results retired 2026-05-07 and HowTo gone since 2023, "owning the answer box" in 2026 means **AI Overviews + featured-snippet paragraph extraction + Dataset features**, not FAQ accordions. Targeting the dead features wastes effort; targeting the live ones for "restaurant food cost / menu pricing 2026" is winnable.

**Current-state audit (score 6/10).** Real assets: H2 anchor IDs phrased as questions ("how-do-restaurants-rank-on-google-maps", `library/restaurant-local-seo/index.html`) — ideal snippet/PAA targets; TL;DR + Key Takeaways blocks (`check-article-tldr.mjs`); SpeakableSpecification; the menu-inflation and cost-index pieces directly target "menu pricing 2026" with dated CPI data. Gap: heavy investment in **FAQPage (141/150 glossary, 10 library)** that no longer yields a SERP feature — still valuable for comprehension/AEO but mis-modeled if counted as a SERP win. Featured-snippet-shaped answers (40–55 word definitional paragraph immediately after each H2 question) are present in some articles but not systematically gated.

**Benchmark gap (Google SERP).** Live 2026 features for these queries: AI Overview citations, featured snippets (paragraph/list/table), and PAA. Dataset features for cost queries. FAQ/HowTo are comprehension-only now.

**The Extend-Past move.** A giant's marketing page hedges; the answer box rewards a confident, sourced, predicate-first sentence with no hedge tokens — exactly the voice canon. Engineer every H2-question to be immediately followed by a liftable 40–55-word sourced answer, so Muntin becomes the paragraph Google and ChatGPT quote for restaurant cost/pricing.

**Concrete actions.**
1. Add a gate (`check-snippet-shape.mjs`) asserting every question-form H2 is followed within N words by a self-contained, hedge-free answer paragraph (extend the `how-to-get-cited` predicate-sentence guidance). **M × 5**
2. Target a "restaurant food cost 2026" / "menu pricing 2026" snippet cluster anchored by the Cost Index + menu-engineering + menu-inflation pieces, each with a table-shaped block (tables win featured snippets). **M × 4**
3. Build PAA-coverage from the 150 glossary "What is X?" set — they already answer in the lift-ready shape; ensure the first sentence is a clean definition (the `ai-overview` bleed in brief 10 currently breaks one). **S × 4**
4. Keep FAQ/HowTo markup for AEO but retarget internal "SERP-feature" KPIs to AI-Overview citations + snippets (document the 2026 feature retirement so effort isn't spent re-chasing FAQ accordions). **S × 3**
5. Add `Dataset` + `Speakable` to push the cost-index market-read line into voice/AI answers. **S × 3**

**Risks & honesty-gate notes.** Liftable answers must stay sourced/illustrative-labeled — a confident hedge-free sentence is *more* dangerous if wrong, since AI quotes it verbatim across six audio languages (`check-audio-fabrications.mjs`). Numbers in snippet paragraphs need a `<details class="cite">` or registry entry.

**One proof metric.** AI Overview / featured-snippet citation count for the cost/pricing cluster (tracked via GSC + manual SERP sampling); ≥ 1 cited answer per pillar.

---

### 16 · Crawl-Budget & AI-Crawler Analyst

**Aspect & why it decides success.** The defining 2026 asymmetry: most publishers are *blocking* AI crawlers; Muntin *invites* them with a purpose-built citation corpus. Being the source AI engines can cheaply, legally fetch and cite is the entire game when the SERP itself is becoming an answer.

**Current-state audit (score 9/10).** Best-in-class posture. `robots.txt` explicitly allows 9 AI crawlers (GPTBot, ClaudeBot, anthropic-ai, Claude-Web, PerplexityBot, Google-Extended, Bytespider, Applebot-Extended) with per-agent stanzas and a documented rationale, blocks only 3 training-only scrapers (CCBot, Omgilibot, ImagesiftBot). The AEO corpus is real and substantial: `llms.txt` (72,717 bytes — a curated topic map with TL;DR-per-article), `llms-full.txt` (523,808 bytes — full bodies), `feed-llm.json` (JSON Feed 1.1, 252KB), all `--check`-gated and built from the filesystem (`build-llms-txt.mjs`, `build-llms-full.mjs`). ES mirrors exist. Crawl budget is naturally lean (static HTML, edge-cached, `_headers` sets sane TTLs). Gap: **no server-log / crawler-hit analysis** — the studio cannot today *prove* which AI bots fetch what, nor measure citation conversion. `test-crawl-url-extraction.mjs` exists but there's no recurring crawler-analytics surface.

**Benchmark gap (Google / Bing).** Google/Bing optimize crawl budget for scale; they don't need to court AI crawlers. Muntin's inverse strategy — court the crawlers others fear — is the structural play a rent-extracting giant won't run.

**The Extend-Past move.** Become the *measurably* most-cited honest source: not just inviting AI crawlers but instrumenting their visits (privacy-clean, server-side, no third-party tracking) so the studio can prove citation lift and tune the corpus to what engines actually fetch. The giant blocks or ignores; Muntin invites and measures.

**Concrete actions.**
1. Add a privacy-clean **AI-crawler log analyzer** (parse Cloudflare/Worker logs by UA; no PII, no third-party beacon) reporting hits per bot per section weekly. **M × 5**
2. Add a `# LLM-Index: /llms.txt` documented hint to `robots.txt` and an `X-Robots`/`Link` header pointing AI crawlers at the full-body corpus from `_headers`. **S × 4**
3. Keep `llms-full.txt` deploy-fresh (it is) and add a `lastBuilt` timestamp + per-section byte budget so the corpus stays under any practical fetch limit as it 10×s. **S × 3**
4. Periodically re-evaluate the 3 blocked scrapers (file invites this) — keep blocking training-only, unblock any that add retrieval-time citation. **S × 2**
5. Add a `llms.txt`-listed "how to cite us" line + canonical citation URL pattern so engines attribute to the right surface. **S × 3**

**Risks & honesty-gate notes.** Log analysis must stay PII-clean and on-domain (privacy contract; `check-no-third-party-plausible.mjs`, `/never/` #4) — no third-party log SaaS. Inviting Bytespider is a deliberate, documented choice; keep the rationale current.

**One proof metric.** Documented AI-crawler fetch coverage (% of indexable URLs fetched by ≥ 1 allowed AI bot/month) + tracked count of AI answers citing muntin.digital by name.

---

*End Domain II.*
