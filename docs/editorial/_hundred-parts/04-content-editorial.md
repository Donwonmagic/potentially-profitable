## Domain IV — Content & Editorial

*Positioning Council · Briefs 25–32. Strategy only; no live-site edits in this pass. Every number below is repo-sourced (file:line), web-sourced (named + dated), or marked "illustrative / analyst assessment." Counts are taken from `data/site-counts.json` (updated 2026-06-15), the editorial canon set, and a direct repo audit run 2026-06-16.*

**Repo-fact baseline used across these briefs (from `data/site-counts.json`):** 47 articles total = 36 library + 11 blog; glossary 150 terms; tools 13 live (+5 coming); 8 library topics. Sheets: 6 packs, 46 titled `live` entries in `data/sheets.json` (+ the 15-row `course-bootcamp` pack of lesson tear-sheets; the prompt's "48 in 6 packs" sits in this range — analyst flag: the exact public count is not gated by `site-counts.json` and reads inconsistently). ES mirror: ~30 library / ~10 blog. The "280+ glossary terms" figure that appears in mission framing is **not** supported anywhere in the repo — the footer sentinel and `site-counts.json` both say **150** (`data/site-counts.json:8`; footer `<!-- count:glossary.terms -->150`). Treat 150 as canonical; the 280+ is a copy-drift flag, not a target.

**The asymmetric seam, stated once for the domain:** a SaaS content-marketing blog cannot publish operator-authored, fact-gated, six-language depth from a working FOH manager, against a public automated fact gate that speaks its own violations aloud. Every brief below pushes on that seam: primary-source data (the Cost Index), operator credibility (Don, singular bio), restaurant depth, true ES parity, zero tracking, AI-citability.

---

### 25 · Editorial Director — restart the Desk/Goldstein cadence at publication quality

**Aspect & why it decides success.** The studio's whole flywheel — AI citation, freshness signals, the Library Letter, recirculation — assumes a beating publishing heart. That heart has stopped: the newest dispatch is `blog/restaurant-menu-inflation-2026/` (Jun 14) and the last *recurring-format* dispatch is `blog/cost-index-week-2026-06-05/` (Jun 5, `dateModified` 2026-06-12). After a 36-library / 11-blog build, the corpus is an asset depreciating from disuse. The Editorial Director owns the answer to "what ships, in what voice, on what day, and who says no."

**Current-state audit — 7/10.** The *machinery* is best-in-codebase; the *throughput* is stalled.
- Voice is fully specified and gated: three canons (`docs/voice-canon-library.md`, `-blog.md`, `-sheets.md`) plus the governing `/methods/#voice-contract` (POV-by-page-type table, byline rule for "The Muntin Desk" confirmed at `methods/index.html:520`).
- An editorial OS exists: `docs/editorial/loop-charter.md` (ORIENT→DECIDE→WRITE→READ-ALOUD→FOLD-BACK), `voice-scorecard.md` (28/30, 2026-06-08), `ground-truth-pack.md`. This is rare maturity for a one-person shop.
- The skeleton is enforced (article-graphics gate, ≥2,800-word floor, JSON-LD, EN↔ES parity). A clean reference exists to copy: `library/how-to-get-cited-in-google-ai-overviews-restaurant/` (Muntin Desk byline, TLDR, 4 viz kinds: bars/flow/ba/tree, cite drawers, locked smart-next).
- The gap is purely cadence: no published editorial calendar, no per-week "definition of done" owner separate from the writer, audio backlog (manifest is majority partial/pending per `data/article-audio.json`), and the scorecard's own non-3 dims (Dim 4 product-ES review, Dim 6 route grading) sit waiting on a human checkpoint.

**Benchmark gap — The Verge / Stripe Press.** The Verge ships a high daily volume on a staff masthead — proof that voice and volume coexist when ownership of "done" is explicit (analyst characterization; cadence is editorially high-tempo, exact counts unverified). Stripe Press is the inverse model: rare, deliberate, authored, design-forward releases that read as canon, not content (analyst characterization). Muntin's seam is Stripe-Press authority at a Verge-adjacent *minimum cadence* — the SaaS blog can hit volume but cannot hit authored-by-a-working-operator authority.

**The Extend-Past move.** Publish an **editorial calendar as a gated artifact**: a `data/editorial-calendar.json` (slot, surface, byline, status, audio-status, target ship date) plus a `check-cadence.mjs` that warns when the newest `blog/<slug>` `datePublished` is older than the declared heartbeat. Make "we shipped this week" a build signal, not a memory — the loop-charter's own doctrine ("turn the canon into a gate"). The Director's weekly job becomes moving one calendar row to `rendered`, not staring at a blank page.

**Actions.**
1. Stand up `data/editorial-calendar.json` + a warn-only `check-cadence.mjs` wired into `check-all.mjs`. **S × 5** — turns cadence from vibe into a CI signal; gate-safe (warn-first).
2. Re-establish a **weekly Goldstein dispatch + one library article every 2–3 weeks** as the declared heartbeat; seed 8 weeks of slots from `data/topics.json` gaps. **M × 5.**
3. Adopt a one-page **ship-gate runbook** keyed to the canons' existing ship tests (`voice-canon-blog.md §13`, `-library.md §12`) so "done" is a checklist a single operator runs, not a judgment call. **S × 4.**
4. Burn down the **audio backlog** for already-published library articles before any new translations (parity debt compounds): prioritize `status: partial/pending` entries in `data/article-audio.json`. **L × 4.**
5. Re-score the voice scorecard at engagement start (its own rule: first deliverable is the re-score + gate-reach audit, not changes). **S × 3.**

**Risks & honesty-gate notes.** Cadence pressure is the historical *cause* of the May-2026 fabrication wave — the canons say so explicitly (`docs/fact-check.md` "Why this exists"). The calendar must never become a quota that tempts invented data; the heartbeat is fed by the Cost Index (fact-gated by construction) precisely so volume and honesty don't trade off. No new claims in the calendar artifact itself.

**One proof metric.** Weeks-since-last-dispatch ≤ 7, sustained 8 consecutive weeks, with `check-all.mjs` green on every ship.

---

### 26 · Content Strategist — pillar/cluster topical map

**Aspect & why it decides success.** Foundational-query authority (the library's job per `voice-canon-library.md §6`) is won by *topical completeness*, not one-off posts: a pillar that answers the whole question, ringed by clusters that answer every sub-question and interlink. Muntin already has the taxonomy (`data/topics.json`: 8 topics) and 36 library articles — but no one owns whether each pillar is *complete* or where the holes are.

**Current-state audit — 7/10.**
- 8 named topics with stable slugs, EN+ES blurbs, and explicit search intent per topic (`data/topics.json`) — including the high-leverage `ai-search` pillar whose own blurb cites "8% to 25% of restaurant discovery in the next 18 months" (intent text; treat as the pillar's stated thesis, source-label before any prose reuse).
- Cross-surface interlink scaffolding already exists: smart-next blocks (glossary → tool → Window), `pairsWith` arrays in `data/sheets.json` mapping sheets to tools/glossary/blog, and glossary autolink sentinels.
- 150 glossary terms + 13 tools give every cluster a "Read / Try" rail.
- Gaps: no published pillar-coverage matrix (which topic is thin?), the `information-security` and `ai-search` pillars look under-built relative to `local-seo`/`operations-margin`, and there's no map of internal-link density per pillar.

**Benchmark gap — HubSpot / Ahrefs.** HubSpot codified pillar-cluster topic clusters as the canonical content-marketing IA (HubSpot, ~2017 onward; widely cited). Ahrefs' blog is distinctive for *data-backed* posts — original studies, not opinion (Ahrefs blog, ongoing). Muntin can't out-volume either, but neither can credibly publish *operator* depth or *primary wholesale-cost data* (the Cost Index). The move is HubSpot's IA discipline + Ahrefs' data-forwardness, aimed at restaurant operators a SaaS blog can only address generically.

**The Extend-Past move.** Build a **pillar-coverage matrix** (`data/pillar-map.json`): for each of the 8 topics, list the canonical pillar article, its cluster children (library + blog + glossary + tool + sheet), and a coverage score. Surface gaps as a prioritized backlog. This makes "what to write next" a query against data, not a guess — and it doubles as an AEO asset (clean entity graph for AI extractors).

**Actions.**
1. Author `data/pillar-map.json` mapping all 36 library + 11 blog articles to the 8 pillars; flag each pillar's missing canonical/cluster pieces. **M × 5.**
2. Designate **one canonical pillar page per topic** and ensure each cluster article links up to it and across to 2–3 siblings (tightens the entity graph extractors reward). **M × 4.**
3. Fill the two thinnest pillars first — likely `ai-search` and `information-security` — with fact-gated cluster pieces (≥2,800 words, ≥2 viz kinds). **L × 4.**
4. Make the glossary a deliberate cluster floor: every pillar's key terms exist as `DefinedTerm` pages and autolink into the pillar (coordinate with Brief 29). **M × 3.**
5. Add a warn-only `check-pillar-orphans.mjs` (a library article in no pillar, or a pillar with <3 clusters). **S × 3.**

**Risks & honesty-gate notes.** The "8%→25%" discovery-shift figure in `data/topics.json` intent must be sourced (registered in `data/sourced-claims.json` or labeled illustrative) the moment it enters prose — intent-doc framing is not a citation. Filling pillars is where volume pressure meets the fact gate; each new piece clears `check-fabrications.mjs` or it doesn't ship.

**One proof metric.** Every one of the 8 pillars at "complete" (1 canonical + ≥3 interlinked clusters + key glossary terms) within two quarters; zero pillar-orphan warnings.

---

### 27 · Cadence / Heartbeat Lead — revive the weekly cost-index dispatch

**Aspect & why it decides success.** A weekly fact-gated dispatch is the single highest-asymmetry product in the whole studio: it manufactures freshness, feeds the Library Letter, and is *structurally un-fakeable* by a SaaS blog because it runs on primary wholesale data. The engine already exists and already lapsed — `blog/cost-index-week-2026-06-05/` is the proof-of-format, and its cadence stopped. Reviving it is the fastest route to a beating heart that can't tempt fabrication.

**Current-state audit — 6/10.**
- The format is built and clean: `blog/cost-index-week-2026-06-05/` ships the full skeleton — ring + bars + flow figures, each with ≥80-char `data-audio-alt` and figcaption, an explicit honesty line ("public wholesale levels, never your delivered price"; "a read versus that item's baseline, not a week-over-week move"), and a `/cost-index/` hub CTA.
- It is sourced by construction: "public USDA, BLS, and FRED data; when an input cannot earn a credible reading, it stays off the page rather than showing you a guess" (`blog/cost-index-week-2026-06-05/index.html:552`). 16 contributing ingredients, weighted basket.
- The honesty discipline is already exemplary — it pre-empts the exact fabrication trap (it refuses to assert a week-over-week delta the panel can't measure).
- Gaps: cadence stalled (no dispatch after 06-05 in the recurring series; the 06-14 inflation piece is a one-off, not the weekly); the panel "does not archive weekly snapshots yet" (`:438`), so true week-over-week is impossible — a product gap that caps the dispatch's claims; no template-driven generation, so each week is hand-built (the friction that killed cadence).

**Benchmark gap — Stratechery / Morning Brew.** Stratechery is the proof that one credentialed voice on a fixed cadence sustains a subscription business: a free weekly Article (Tuesdays) as top-of-funnel hook plus ~3 paid Daily Updates/week, no ads, ~$15/mo or $150/yr — the operator *is* the brand (Stratechery Plus/About pages via search index + Wikipedia "Ben Thompson," accessed 2026-06-16; the often-cited 40k-subs/$3M-revenue figure is a third-party estimate, treat as illustrative). Morning Brew proved a *recurring* email builds a large daily habit — 4M+ subscribers by early 2022, monetized by ads/sponsorship (CNBC, 2022-03-28; Axios, 2020-10-29). Neither can publish a *restaurant-specific wholesale cost basket from a working operator's vantage* — that's Muntin's moat. The seam: a fact-gated weekly nobody can fake, fed by a free hook (the proven Stratechery shape).

**The Extend-Past move.** Make the weekly **template-generated, archive-backed, and CI-protected**: a `cost-index-week-YYYY-MM-DD` generator that reads the panel, fills the proven figure set, and (critically) writes a weekly snapshot to `data/cost-index-history.json` so that *real* week-over-week deltas become assertable — converting the current honest-but-limited "read vs baseline" into a stronger honest "moved X since last week." This turns the highest-friction post into a near-push-button heartbeat.

**Actions.**
1. Ship the **weekly snapshot archive** (`data/cost-index-history.json`) so the dispatch can claim true deltas without violating the fact gate — closes the `:438` self-imposed limit honestly. **M × 5.** (Coordinate with the data/product side.)
2. Build a **dispatch generator** from the 06-05 template (figures, audio-alt, cite drawers, CTA pre-filled). **M × 5** — removes the friction that ended cadence.
3. Pin the weekly into the editorial calendar (Brief 25) as the non-negotiable heartbeat slot; one operator-written paragraph of read on top of generated data. **S × 5.**
4. Wire `check-cadence.mjs` to specifically watch the cost-index series freshness (warn if newest weekly > 8 days old). **S × 4.**
5. Auto-render the 6-language audio per weekly as part of generation so parity never lags the heartbeat. **L × 4.**

**Risks & honesty-gate notes.** The biggest risk is a generator that *interpolates* a number when a source is missing — the panel's current rule (omit rather than guess) must be inviolable in the generator. The week-over-week upgrade is only honest *after* the archive exists; until then keep the "read vs baseline" framing verbatim. Numeric-parity check (`check-audio-fabrications.mjs`) must pass on every generated language track — a translation cannot speak a number absent from the source.

**One proof metric.** 12 consecutive weekly cost-index dispatches shipped on a ≤7-day cadence, each `check-all.mjs`-green, with audio `rendered` in all six languages.

---

### 28 · Fact-Check & Honesty-Gate Steward — zero-fabrication enforcement

**Aspect & why it decides success.** The fact gate is the brand. `docs/fact-check.md` and the scorecard both name it the "crown jewel" (Dim 1 = 3/3) and the studio's only real asset — reader trust. It is also the seam no SaaS blog will ever build: a *public, automated, six-language* fact gate that speaks its own violations aloud. The Steward's job is to keep Dim 1 at 3 without exception as volume and languages grow — and to extend the gate to the surfaces it doesn't yet reach.

**Current-state audit — 8/10.** Strong, with two concrete live leaks.
- The gate is real and layered: `check-fabrications.mjs` (HTML/JSON/MD), the per-language `check-audio-fabrications.mjs` (~328 narration tracks, shared registry `scripts/lib/fabrication-patterns.mjs`), the registry `data/sourced-claims.json`, and the three-pattern rule (registered / cited / labeled illustrative).
- It has caught real incidents: the per-language audio gate flagged the retired "two restaurants" bio spoken live in six languages across stale renders (`ground-truth-pack.md §3a`).
- **Leak #1 (live, citable):** the exact blocked phrase from `docs/fact-check.md` — *"kept margin climbed 56%"* — is still live in **8 recirculation cards** that the blocklist does not scan: `blog/index.html:746`, `learn/topics/operations-margin/index.html:458`, `learn/topics/conversions/index.html:479`, the two ES topic mirrors (`es/learn/topics/operations-margin/index.html:375`, `es/learn/topics/conversions/index.html:403`), and three library smart-next/related cards (`library/how-to-tell-if-a-restaurant-tool-is-safe/index.html:911`, `library/how-to-raise-restaurant-menu-prices-without-losing-reservations/index.html:1146`, `library/keep-plate-cost-honest-when-prices-change/index.html:922`). The case-study *article itself* was correctly rewritten to "Illustrative ranges, not a case study" (`blog/30-days-after-leaving-doordash-restaurant-case-study/index.html:488`) — but the cross-post card descriptions that quote a fabricated 56% were never updated. This is a fabrication-pattern string surviving in production.
- **Leak #2 (residual, already tracked):** numeric-parity is warn-only and a rogue-number-free prose mistranslation in fr/it/pt/zh is still not caught (`ground-truth-pack.md §3`, ADR-001 follow-ons).

**Benchmark gap — NYT / Reuters.** Both treat their standards code *and* their corrections log as public, named, browsable assets: NYT publishes a Standards & Ethics hub + a book-length values handbook and a daily-updated Corrections page ("correct all errors, no matter how large or small"); Reuters publishes its Handbook of Journalism openly, built on the 1941 Trust Principles and "10 Absolutes" — "Always hold accuracy sacrosanct," "Always correct an error openly," with a "trashline" stating *why* a story was corrected (Ethical Journalism Network / CJR mirrors + handbook.reuters.com, accessed 2026-06-16; primary nytco/reuters pages partly 403'd — corroborated via reputable mirrors). Muntin already exceeds them on one axis: its gate is *automated and machine-enforced*, not just a policy page. The Extend-Past is to make that machine *visible* as a browsable trust asset — a published standards page plus an open corrections/changelog at solo scale.

**The Extend-Past move.** (a) Extend `check-fabrications.mjs` to scan **recirculation card descriptions and JSON-LD abstracts/`mentions`**, not just article bodies — the surface where Leak #1 hid. (b) Publish a **public "fact gate" page** (or a `/receipts/` section) that explains the three-pattern rule and the blocklist in plain language: turn the private gate into a citable trust artifact AI engines and operators can both reference.

**Actions.**
1. Fix Leak #1: rewrite all 8 cards to match the rewritten article's illustrative framing (no "56%"), then **extend the blocklist's TARGETS to card/description/abstract surfaces** so it can't recur. **S × 5** (fix) + **M × 5** (gate extension). Highest blast-radius, lowest effort.
2. Promote audio **numeric-parity from warn → fail** once the ~45 flagged files are triaged (`ground-truth-pack.md §3a`). **M × 4.**
3. Ship a **public fact-gate explainer** page under `/receipts/` or `/methods/`, version-controlled, describing the three patterns + blocklist (trust-as-asset, AEO-citable). **M × 4.**
4. Add a registry-hygiene check: every claim in `data/sourced-claims.json` carries a live `used_in` slug and a `date_verified`; warn on stale verifications. **S × 3.**
5. Close the confirm-tier remediation queue (re-render the 3 stale bio audios + the Spanish voice-clone reference) and remove the dated waivers. **L × 3** (needs the TTS/recording toolchain — Don).

**Risks & honesty-gate notes.** This brief *is* the honesty gate, so the bar is total: the card fixes must not invent a replacement number — they inherit the article's "illustrative ranges" label or state nothing quantitative. Extending the gate to JSON-LD must not false-positive on legitimately registered claims (test against `data/sourced-claims.json`). Pin new behavior with a `node:test` suite as the existing gates do.

**One proof metric.** Zero `check-fabrications.mjs` hits across *all* surfaces (bodies + cards + abstracts + audio), with the 56% string gone from production and the blocklist proven to catch its return (red test → green).

---

### 29 · Glossary / Encyclopedia Lead — terms as SEO/AEO moat

**Aspect & why it decides success.** Definitional pages are the most durable, most AI-citable, most cluster-supporting asset a reference site owns — they answer "what is X" queries forever and feed the entity graph that pillars and AI Overviews lean on. Muntin has 150 bilingual `DefinedTerm` pages already; the question is whether they're a *moat* (deep, interlinked, the definitive bilingual restaurant-web reference) or a thin audit-remediation list.

**Current-state audit — 6/10.**
- 150 terms (`data/site-counts.json:8`), fully bilingual EN/ES with hreflang, each page typed `DefinedTerm` (often with `Article` + `FAQPage`), cross-linked from library article `mentions` JSON-LD (e.g., `blog/cost-index-week-2026-06-05/index.html` mentions `/glossary/cost-index/`, `/food-cost/`, `/prime-cost/`).
- Glossary autolink sentinels inject term links into library prose (`<!-- LIBRARY:autolink:start -->`), wiring the cluster automatically.
- Gaps: the hub frames itself narrowly as "terms your audit flags" (glossary hub meta) rather than as *the* definitive bilingual restaurant-web glossary — under-claiming its own AEO role; term pages are definition-light (single definition + FAQ, no audio, modest depth) versus a true encyclopedia entry; and the mission's "280+" framing collides with the real 150 (copy-drift to resolve, not chase).

**Benchmark gap — Investopedia / Wikipedia.** Investopedia dominates financial-definition SERPs via a very large dictionary — self-described in the tens of thousands of terms/articles (snippets cite ~13,000 terms / ~32,000 articles / ~44M monthly viewers; primary About page 403'd, so directional-but-unverified — analyst characterization; founded 1999, owned by Dotdash Meredith). Its model is one term per page, each owning a "what is X" query (Semrush, 2025–2026, on definitional-SEO generally). Wikipedia wins on neutral depth + dense internal links + structured data. Muntin can't match scale — but no encyclopedia is *bilingual restaurant-operator-specific*, fact-gated, and authored from the floor. The moat is depth-per-term and EN↔ES parity, not raw count.

**The Extend-Past move.** Reposition the glossary from "audit-flag dictionary" to **"the definitive bilingual restaurant-web glossary,"** and deepen the highest-traffic 30 terms into true encyclopedia entries: a 45-word answer-first definition (the same extractor-friendly shape `voice-canon-library.md §4` rewards), a worked operator example, 2–3 internal links up to the pillar and across to a tool/sheet, and the `DefinedTerm`→`isPartOf` link to its pillar. Bilingual parity is the un-copyable part.

**Actions.**
1. Rewrite the glossary **hub framing + meta** to claim the definitive-bilingual-glossary role (AEO positioning), and reconcile the 280+ vs 150 copy-drift to the canonical 150. **S × 4.**
2. Deepen the **top 30 terms** by traffic/intent into answer-first encyclopedia entries with worked examples + up/across links. **L × 5.**
3. Ensure **every pillar's key terms exist** (coordinate with Brief 26's pillar map); fill missing definitional gaps. **M × 4.**
4. Strengthen structured data: `DefinedTerm` + `inDefinedTermSet` + `isPartOf` the pillar, so the entity graph is explicit for extractors. **M × 4.**
5. Verify EN↔ES parity across all 150 (no orphan terms) via `check-hreflang-orphans.mjs`; close gaps. **S × 3.**

**Risks & honesty-gate notes.** Glossary voice is third-person reference (term as subject — `/methods/#voice-contract` POV table), *not* Don's "I"; deepened entries must hold that register and avoid blog-voice anecdote. Any operator number in a worked example is registered/cited/illustrative like everywhere else. Do not retitle term slugs (final-forever).

**One proof metric.** Top-30 terms each ranking/cited for their "what is X" query, with EN↔ES parity at 100% (zero hreflang orphans) — measured as glossary organic + AI-citation share quarter-over-quarter.

---

### 30 · Operator-Sheets / Lead-Magnet Strategist — sheets as utility + capture

**Aspect & why it decides success.** Free, genuinely useful operator paperwork is the surface operators *bookmark and return to* — the deepest engagement signal a studio can earn, and the most natural (non-coercive) path into the Library Letter. Muntin has 46 live sheets across 6 packs with a real consequence-named voice; the strategic question is how to convert that utility into durable relationship without a dark pattern.

**Current-state audit — 8/10.**
- Deep, well-organized catalog: 6 packs (`data/sheets.json`), 46 live titled sheets, each with summary/walkaway/when-to-use/mistakes, `pairsWith` mapping to tools/glossary/blog, and a distinctive voice ("A waste log without dollars is a feelings journal"; `voice-canon-sheets.md`).
- Privacy-first by construction: "stays on-page," "None of your numbers leave the page," no signup — a brand promise corroborated by `/receipts/` ("no keystroke logging on any tool input").
- `stay_paper` flag correctly keeps 8 clipboard sheets paper-first.
- Gaps (these are the *opportunity*): there is **no capture mechanism on sheets** at all — strong for privacy, but it means the highest-intent surface produces zero opt-in relationship; no "save your work / get the printable pack by email" *opt-in* offered even as a choice; sheets are bilingual-strong but their discovery from pillars/articles is under-linked relative to their value.

**Benchmark gap — Notion template gallery.** Notion's marketplace headlines **30,000+ templates** (free + paid), and each is a standalone indexable SEO landing page whose "Duplicate" button requires an account when logged out — so distribution *and* signup are the same action (Notion Marketplace + Help Center, accessed 2026-06-16). Muntin's seam: Notion's templates are generic and capture is *coerced* (you must sign up to copy); Muntin's sheets are *operator-consequence-named, fact-anchored, bilingual restaurant paperwork* a SaaS gallery can't author — and the privacy promise forbids the coercion. The move is Notion-style "tools operators bookmark," with capture made *opt-in* instead of gated.

**The Extend-Past move.** Add a **privacy-preserving, opt-in-only** value exchange that *respects* the "stays in your browser" promise: an optional "email me this filled pack as a PDF / remind me to run this weekly" checkbox that (a) never transmits the operator's numbers, only the request, and (b) is never required to use the sheet. Pair it with deliberate **sheet→pillar→Library-Letter** linking so the most-used surface finally seeds the relationship. The honesty differentiator becomes the headline: "your numbers never leave the page — only your choice to hear from us does."

**Actions.**
1. Tighten **discovery**: ensure every relevant pillar article and library piece links to its `pairsWith` sheet, and the sheets hub links up to pillars (uses existing `pairsWith` data). **M × 4.**
2. Design a **privacy-clean opt-in** ("weekly run reminder" / "email the blank pack") that transmits zero operator data — choice only, never gated. **M × 5** (coordinate UX + product; honesty-gate central).
3. Bundle packs as **downloadable bilingual PDF sets** (one per pack) as a no-signup bookmark magnet; signup is the *separate, optional* path. **M × 4.**
4. Resolve the **public sheet count** (46 titled live + course pack) into one honest, gated number so footer/marketing copy stops drifting. **S × 3.**
5. Instrument utility honestly via first-party Plausible (sheet opens, print events) — no keystroke/replay, consistent with `/receipts/`. **S × 3.**

**Risks & honesty-gate notes.** This is the brief most exposed to a dark-pattern slip: the privacy promise ("none of your numbers leave the page") is load-bearing and publicly committed on `/receipts/` — any capture must be opt-in, data-free, and ungated, or it breaks the brand. No invented usage stats; count claims must match `data/sheets.json`. ES sheet voice follows `voice-canon-sheets.md` (tú-neutral, recast rhythm).

**One proof metric.** Sheet→Library-Letter opt-in rate from the voluntary offer (target a healthy single-digit %), with *zero* operator-data transmission — and bookmark/return-visit rate on sheets rising quarter-over-quarter.

---

### 31 · Case-Study & Receipts Lead — the DoorDash-exit story, numbers shown

**Aspect & why it decides success.** A brutally honest case study with figures on the table is the highest-trust content a credibility-led studio can publish — and the hardest for a SaaS blog to fake, because it requires a real operator who actually made the decision. Muntin has the story (the DoorDash exit) and the transparency surface (`/receipts/`); the tension is doing it *without* the invented operator economics that the fact gate exists to block.

**Current-state audit — 7/10.**
- `/receipts/` is a genuine asset: publishes public counts (47 articles, 150 glossary terms, 13 tools, 3 case studies, 2 locales, 7 topics), names North-Star KPIs, and explicitly lists what it does *not* track ("No session replay, no heatmaps... No keystroke logging on any tool input"; "If the policy ever changes, this page changes first — and the old version stays in git history"). This is the trust posture done right.
- The DoorDash piece (`blog/30-days-after-leaving-doordash-restaurant-case-study/`) was correctly converted to an **illustrative playbook**: dek says "Illustrative ranges, not a case study"; the belief-vs-reality bars are labeled "Illustrative shares, not a measured cohort"; the $42-ticket waterfalls cite the `/library/third-party-delivery-economics/` margin walk.
- **The unresolved leak (shared with Brief 28):** the recirculation cards still quote a fabricated "Kept margin climbed 56% by week four" across 8 surfaces (see Brief 28 for the file:line list) — the case study's *own promotion* contradicts its rewritten, honest body. The "case study" is currently a playbook in body but a fabrication in its cards.

**Benchmark gap — Stripe customer stories.** Stripe's customer stories lead with one quantified, *method-stated* outcome on a fixed Challenge→Solution→Results spine with a key-metrics stat block — e.g., GroupGreeting "conversion 8% higher" (A/B test), Atlassian "14% more revenue" via smart retries (stripe.com/customers via search index + FeaturedCustomers analyses, accessed 2026-06-16; an "~186 case studies" count is unverified). The lesson maps directly onto Muntin's gate: lead with one verifiable number *and state the method*. Muntin's seam: Stripe's stories are *its customers'*; Muntin's is *the operator's own*, fact-gated, with the figures that don't flatter shown too. "Brutally honest, figures-on-the-table" is the brand — but only if the figures are real.

**The Extend-Past move.** Resolve the case-study/playbook identity honestly: either (a) keep it a labeled illustrative playbook and **purge every "56%" card** so promotion matches body, or (b) if Don has *real* delisting figures, register them in `data/sourced-claims.json` with sources and convert the piece into a genuine measured case study. Then build a **`/receipts/`-linked case-study standard**: every case study states up front whether its numbers are measured-and-registered or illustrative-and-anchored — turning the honesty constraint into the format's signature.

**Actions.**
1. Decide measured-vs-illustrative for the DoorDash piece and **align all 8 recirculation cards** to that decision (kills the live fabrication). **S × 5.** (Executes alongside Brief 28 action 1.)
2. Publish a **case-study format standard**: mandatory "numbers are [measured + registered] / [illustrative + anchored to source]" line, mirroring the cost-index honesty line. **S × 4.**
3. Link case studies prominently from `/receipts/` ("3 case studies" → actually linked + labeled). **S × 3.**
4. If real figures exist, **register them** (`data/sourced-claims.json`, `used_in`, `date_verified`) and upgrade one piece to a true measured case study — the highest-trust artifact possible. **M × 5** (confirm-tier; needs Don's source data).
5. Keep `/receipts/` current as counts change (it shows 47 articles — matches `site-counts.json`; keep the "what we don't track" list versioned). **S × 3.**

**Risks & honesty-gate notes.** This is squarely the May-2026 failure mode: case studies were *structured to feel grounded by inventing operating data* (`docs/fact-check.md`). The default is illustrative-and-labeled; a measured case study ships *only* with registered sources — never a remembered number. The bio stays singular (FOH manager at Tacombi, Bethesda) in any operator framing.

**One proof metric.** Zero fabricated figures in case-study bodies *and* cards (the 56% gone everywhere), with each case study carrying an explicit measured/illustrative provenance line.

---

### 32 · Repurposing / Distribution Editor — one dispatch → social/email/audio/video

**Aspect & why it decides success.** A solo shop's only way to "publish like a media company" is to multiply each fact-gated dispatch across surfaces — email, social, audio, video — from a single source of truth, without multiplying the fabrication risk. Muntin already renders six-language audio per article; the rest of the repurposing chain (email digest, social, video) is the unexploited multiplier.

**Current-state audit — 6/10.**
- Strong source-of-truth scaffolding: every article carries TLDR + key-takeaways asides explicitly built for downstream surfaces ("Search snippet, share preview... LLM feed, audio recap"; `voice-canon-blog.md §8`), `data-audio-alt` full narrations on every figure, and per-post `audio.<lang>.json` for en/es/fr/it/pt/zh.
- Feeds exist: `feed.xml`, `feed-llm.json`, `llms.txt` are part of the release atom (`voice-canon-library.md §14`).
- The Library Letter / newsletter capture exists (footer form, "four notes a quarter, no funnels").
- Gaps: audio is majority `partial/pending` in `data/article-audio.json` (the multiplier is half-built); **no video pipeline** despite an available HeyGen/HyperFrames MCP surface; social repurposing is manual/ad hoc; no template that turns one dispatch into the full bundle (email blurb + N social cards + audio + optional video) in one pass.

**Benchmark gap — Morning Brew.** Morning Brew turned one conversational editorial voice into many vertical newsletters plus social (TikTok/IG/X), podcasts, and events — the *tone* is the reusable asset repackaged across surfaces (CNBC, 2022-03-28); a free flagship monetized by ads/sponsorship, 4M+ subscribers by early 2022 (CNBC, 2022-03-28). Muntin can't match headcount, but Morning Brew can't publish *fact-gated operator depth in six languages*. The seam: a solo shop's output multiplied like a media co — but every derived surface inherits the same gate, so the multiplication never multiplies risk.

**The Extend-Past move.** Build a **single-source repurposing kit**: from one published dispatch, auto-derive the email blurb (from TLDR), 3–5 social cards (from key-takeaways + a viz figure), the six-language audio (already in pipeline), and an optional short **HeyGen/HyperFrames video** built from the dispatch's own figures and `data-audio-alt` narration. Critically, every derived artifact is gated by the *same* fact registry — the audio fact-gate already proves the model (`check-audio-fabrications.mjs` scans all derived narration). Extend that principle to social/email/video copy.

**Actions.**
1. Finish the **audio multiplier**: drive `data/article-audio.json` from majority-partial to majority-rendered for published articles (parity-first). **L × 5.**
2. Ship a **repurposing template** that generates email-blurb + social-card text from the existing TLDR/key-takeaways asides (no new claims — derived only). **M × 5.**
3. Pilot a **short video per weekly Cost Index dispatch** via the HyperFrames/HeyGen MCP, built from the dispatch's own figures + `data-audio-alt` narration. **M × 3** (the figures and narration already exist and are gated).
4. Extend the fact gate to **derived email/social copy** (same registry, same blocklist) so the multiplier can't reintroduce a fabrication downstream. **M × 5** (the asymmetric heart of this brief).
5. Make the Library Letter the hub of the bundle — each dispatch's email blurb is the lead; "four notes a quarter, no funnels" stays the promise. **S × 4.**

**Risks & honesty-gate notes.** Repurposing is how fabrications *propagated* in May 2026 (into JSON-LD, RSS, LLM feed, audio, bios — `docs/fact-check.md`). The non-negotiable rule: derived surfaces carry *only* claims already in the gated source; no surface invents a new number to fit a format (a social card cannot round "illustrative" into "measured"). Video narration is read aloud — it must clear the fact gate exactly as audio does. No platform that sets tracking cookies (consistent with `/receipts/`).

**One proof metric.** Each published dispatch fans out to ≥4 surfaces (email + social + 6-lang audio + feeds, video where piloted) from one source, with 100% of derived copy passing the fact gate and zero new claims introduced downstream.

---

*Cross-domain note for the Council: Brief 28 (Fact-Check) and Brief 31 (Case-Study) share one live finding — the "56%" fabrication in 8 recirculation cards — and should execute the fix jointly. Brief 27 (Cadence) depends on a data/product deliverable (the Cost Index weekly-snapshot archive) outside the editorial domain. Brief 26 (pillar map) and Brief 29 (glossary depth) interlock on the entity graph.*
