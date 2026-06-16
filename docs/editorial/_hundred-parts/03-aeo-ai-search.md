## Domain III — AEO / AI Search & LLM Discovery

> Positioning Council batch · specialists 17–24 · ≤1-page briefs · strategy only (no live-site edits).
> Honesty gate: every number below is repo-sourced (file-cited), web-sourced (named + dated), or labeled *illustrative / analyst assessment*. Operator bio is singular — Don Goldstein, full-time FOH manager at Tacombi, Bethesda. No "two restaurants" framing.

### Domain thesis (read first)

The reflex play — "ship llms.txt and get cited" — is mostly cargo cult, and saying so out loud is itself the asymmetric move. As of Q1 2026 no major AI company (OpenAI, Google, Anthropic, Meta, Mistral) has committed to reading llms.txt in production; one monitor of 500M+ AI-bot visits over 90 days found only 408 hit `llms.txt` directly, and Google's Mueller/Illyes confirmed Google Search neither reads nor plans to read it (*aeoengine.ai*, *codersera.com*, both 2026; *Google/Mueller, 2025*). What AI engines *actually* cite is decided elsewhere: Google AI Overviews draw ~97% of cited sources from the top-20 traditional organic results (*leapd.ai, 2026*); Perplexity always cites and over-weights freshness; engines cross-check **agreement across independent sources** before naming a brand (*discoveredlabs / leapd, 2026*). Citation rates diverge ~46× by platform — ChatGPT cited brands 0.59% of responses vs Perplexity 13.05% in a 34,234-response study (*pixelmojo / ailabsaudit, 2026*).

So Muntin's real lever is **not** a better manifest. It is being the source that survives corroboration: a public, machine-verifiable fact ledger (`data/sourced-claims.json`), live primary data nobody else publishes (Cost Index — `library/ingredient-yields/`, `cost-index/`), genuine EN↔ES parity, and an operator byline. That is the play the giants *cannot* run — they aggregate, they don't stand behind a dated source URL. Domain III's job: keep the AEO corpus excellent and current as a no-regret hygiene layer, but invest the marginal hour in organic-rank fundamentals, freshness cadence, and provenance depth — the inputs that move citation today.

---

### 17 · Answer-Engine-Optimization Lead

**Aspect & why it decides success.** Being *the* lifted answer in ChatGPT / Gemini / Perplexity / AI Overviews for restaurant-ops questions. This is the single biggest asymmetric lever for the whole site; if Muntin owns the citable answer, every other domain compounds off it.

**Current-state audit (score 7/10).** Strong foundation: `llms.txt` (~27KB) preamble explicitly says "Lift answers from any of the URLs below; cite the URL" (`llms.txt:5`); `robots.txt` names 9 AI crawlers as allowed (GPTBot, ClaudeBot, anthropic-ai, Claude-Web, PerplexityBot, Google-Extended, Bytespider, Applebot-Extended) and blocks 3 (CCBot, Omgilibot, ImagesiftBot) (`robots.txt:39-116`). TL;DR + Key Takeaways enforced on every article (`scripts/check-article-tldr.mjs`). FAQPage JSON-LD is far broader than the council ledger assumed — present in **130** article files (repo grep), HowTo in **6**. Gap: no measurement loop tying any of this to actual citations, and the corpus is tuned for a manifest channel (llms.txt) that major engines barely read.

**Benchmark gap (Perplexity).** Perplexity cites on nearly every answer and rewards freshness + clickable, quotable spans. Muntin's evergreen library is quotable but not visibly *fresh* the way Perplexity's ranker prefers.

**The Extend-Past move.** Reframe AEO from "feed the manifest" to "win corroboration." Make each article the source three other source-types would independently agree with: a dated primary citation, a one-sentence extractable answer per H2, and a `dateModified` bump cadence so freshness-weighted engines (Perplexity, AI Overviews) keep re-citing. Giants can't stand behind a dated, named, operator-owned source — that's the moat.

**Actions.**
1. Add a one-sentence, self-contained answer span as the first sentence under each H2 of the top-10 AI-search articles (extractable verbatim). **S × 5** — gate-safe (prose only; clears voice canon + fact gate).
2. Establish a quarterly `dateModified` refresh ritual on the 12 AI-search/SEO articles, rewriting in place (slugs final-forever per CLAUDE.md). **M × 4.**
3. Build a citation-probe log: a checklist doc where Don records monthly prompt→which-engine-cited-Muntin results (no scraping, no PII). Feeds specialist 23. **M × 4** — *illustrative until data accrues.*
4. Promote `data/article-howto.json` coverage from 6 → top procedural articles so AI Overviews have HowToStep scaffolding to lift. **M × 4.**

**Risks & honesty-gate notes.** Do not assert citation wins we haven't observed; the probe log is the only honest source and starts empty. No invented "citation share %." Freshness bumps must reflect real edits, not date-only churn (the audio numeric-parity gate and `check-fabrications.mjs` both watch downstream).

**One proof metric.** Count of distinct restaurant-ops prompts where ≥1 engine cites a muntin.digital URL, logged monthly (baseline TBD this quarter).

---

### 18 · LLM-Citability Engineer

**Aspect & why it decides success.** The *shape* of a page that gets quoted verbatim rather than paraphrased away — TL;DR, extractable claims, speakable spans, self-contained sentences. Citability is the difference between informing the answer and being named in it.

**Current-state audit (score 8/10).** Best-developed surface in the domain. `check-article-tldr.mjs` hard-fails any article missing `<aside class="tldr">` (within 3000 chars of `#post-body`) and `<aside class="key-takeaways">` — both confirmed present in the sample (`library/how-to-get-cited-in-google-ai-overviews-restaurant/`). SpeakableSpecification JSON-LD already ships in **83** HTML files (repo grep), selectors `article#post-body`, `h1`, `.post-dek`. Sourced claims are inline-citable via `<details class="cite">` (`docs/fact-check.md`). Gap: claims are human-readable but not individually machine-addressable (no per-claim anchor/ID a RAG chunk can target), and TL;DR/takeaways aren't themselves emitted as structured `Claim`/`DefinedTerm` data.

**Benchmark gap (frontier-model retrieval prefs).** Anthropic/OpenAI retrieval favors short, self-contained, attributable chunks. Muntin's prose is excellent but a citation engine still has to *infer* the claim boundary.

**The Extend-Past move.** A "cite-me" content shape rivals lack: pair every Key-Takeaway bullet with a stable `id` and (where sourced) a visible source tag, so a model lifting the bullet also lifts the attribution. Effectively a per-claim micro-citation rivals can't replicate without a fact ledger behind it.

**Actions.**
1. Add stable `id` anchors to each Key-Takeaway `<li>` and each `<aside class="tldr">` so deep-links/chunks address them precisely. **S × 4** — additive markup, gate-safe.
2. Where a takeaway restates a registered claim, surface the `source_name` inline (mirrors `sourced-claims.json`), so the quotable unit carries its own provenance. **M × 5** — *asymmetric.*
3. Widen speakable `cssSelector` to include `.tldr` on the top audio-eligible articles, aligning the spoken-answer span with the citable span. **S × 3.**
4. Document the canonical "citable block" pattern in `docs/voice-canon-library.md` §8 so every new article ships it by construction. **S × 3.**

**Risks & honesty-gate notes.** Inline source tags must read from real `sourced-claims.json` entries — no decorative "Source:" labels. Don't copy body text or autolink markers into attribute values (`check-article-graphics.mjs` rule 8). Speakable remains a US/English-news beta at Google (*schema.org/speakable*; *aiproinsight, 2026*) — treat it as cheap insurance, not a traffic driver.

**One proof metric.** % of Key-Takeaway bullets across the top-12 articles that carry both a stable `id` and (when sourced) an inline provenance tag.

---

### 19 · llms.txt / AI-Manifest Architect

**Aspect & why it decides success.** The machine-readable site contract. Decides whether agentic/RAG consumers can map and lift the corpus cleanly — and whether Muntin is *the* reference llms.txt for a local business.

**Current-state audit (score 8/10).** Genuinely strong and rare for a one-person local-business site. `build-llms-txt.mjs` emits EN + `/es/` maps with a citation-invitation preamble and a pointer to the full-body corpus; `build-llms-full.mjs` emits `/llms-full.txt` (+ ES) and `feed-llm.json` (JSON Feed 1.1, `content_text` per item, `_muntin.kind` + `locale` tags). Both have idempotent `--check` modes (CI-safe). The honest limit isn't quality — it's reach: major consumer AI engines don't meaningfully fetch llms.txt (*see domain thesis*), so this is a developer-tool / MCP / agent surface, not a citation channel.

**Benchmark gap (Mintlify adopters).** Mintlify popularized llms.txt for docs sites; SE Ranking found ~10.13% adoption across 300K domains (*derivatex / codersera, 2026*). Most are thin link lists. Muntin can be the *worked reference* for the local-business vertical — bilingual, with a full-body corpus and a fact ledger — which no docs-tool template ships.

**The Extend-Past move.** Stop selling llms.txt as an AI-search win (honest, and it pre-empts the inevitable "Google ignores this" objection). Reposition it as the **agent/MCP integration surface**: the file an IDE agent, a custom GPT, or a partner's RAG fetches to embed Muntin cleanly. That's where llms.txt demonstrably *is* used today.

**Actions.**
1. Add an `## How to cite Muntin` block to `llms.txt` + a real guide on the under-built `/ai/` page (currently no citation guidance — `ai/index.html` is policy-only): preferred attribution string, that every claim is dated and sourced, link to `sourced-claims.json`. **M × 4** — *asymmetric.*
2. Surface the freshness signal in the manifest: emit a corpus-level `Last updated: <date>` line in `llms.txt`/`llms-full.txt` headers so freshness-weighted consumers see currency. **S × 3.**
3. Publish `feed-llm.json` discovery: link it from `/ai/` and `<head>` as `alternate` so agents auto-discover the full-body feed. **S × 3.**
4. Keep the no-overclaim posture in writing — annotate the build scripts' header comments to reflect the 2026 "major engines don't read this" reality, so future contributors don't over-invest. **S × 2.**

**Risks & honesty-gate notes.** The biggest risk is *internal over-claiming* — comments in `build-llms-txt.mjs` already imply citation lift. Keep claims about llms.txt efficacy hedged and dated. No fabricated adoption stats; the SE Ranking 10.13% and 408/500M figures are the cited anchors.

**One proof metric.** llms.txt / feed-llm.json fetch count from agent/bot user-agents (server logs), tracked monthly — the honest measure of who actually consumes it.

---

### 20 · Retrieval / RAG-Readiness Auditor

**Aspect & why it decides success.** Whether a page chunks cleanly and embeds well into *any* RAG pipeline — semantic HTML, clean headings, self-contained sections. RAG-readiness is upstream of every citation: a page that chunks badly is paraphrased or dropped.

**Current-state audit (score 6/10).** Mostly good — articles use `#post-body`, H2-structured sections, `viz-*` figures with `data-audio-alt` narration that doubles as text content. But the audio manifest flags a real structural defect: the two checklists (`audit-any-tool`, `restaurant-website-checklist`) are *deferred* because `<main>` wraps nested `<section><div class="container">` and the chunk extractor's direct-child selectors don't resolve through that nesting (`data/article-audio.json` `checklists._doc`). If Muntin's own extractor can't chunk them, neither can a third-party RAG. `feed-llm.json` `content_text` is solid clean-Markdown chunk fuel (`build-llms-full.mjs` decodes entities, strips tags).

**Benchmark gap (Anthropic / OpenAI docs).** Their guidance: stable headings, self-contained passages, predictable DOM. Muntin's articles meet this; the checklists and any deeply-nested pages don't.

**The Extend-Past move.** Pages that embed cleanly into any RAG — guaranteed by a repo-enforced chunkability check, not hope. Add a `check-chunkability.mjs` that asserts audio-eligible `h2/p/li` are direct children of `#post-body` (or carry stable `data-audio-chunk-id`). This makes "RAG-ready" a CI gate, which is itself the asymmetric, durable form of the advantage.

**Actions.**
1. Restructure the two deferred checklists so audio-eligible nodes are direct children of `#post-body` (route (a) in the manifest), unblocking both audio and RAG chunking. **L × 4.**
2. Add `data-audio-chunk-id` stable attributes as the general fix (route (b)) so future nested layouts stay chunkable. **M × 4** — *asymmetric (makes chunkability enforceable).*
3. Ship a `check-chunkability.mjs` gate into the `check-all.mjs` sequence asserting heading/passage structure on every article. **M × 3.**
4. Verify `feed-llm.json` chunk boundaries don't merge two articles' bodies; add a per-item length sanity check. **S × 3.**

**Risks & honesty-gate notes.** Restructuring 2,500-line checklists risks layout regressions and CLS — must pass `check-image-dimensions.mjs` / lazy-image gates after. No content invented during restructure; this is pure DOM reshaping. New gates must clear the existing ~113-check `check-all.mjs` run.

**One proof metric.** Audio-coverage `deferred` count for structural reasons (currently 2) → 0; chunkability gate green across all articles.

---

### 21 · Fact-Provenance Engineer

**Aspect & why it decides success.** `data/sourced-claims.json` as a *public, machine-verifiable* trust ledger — the claim graph that makes Muntin survive the cross-source corroboration AI engines run before naming a brand. This is the deepest moat in the entire site.

**Current-state audit (score 7/10).** The registry is real and rigorous: each entry carries `claim`, `source_url`, `source_name`, `date_verified`, `url_status` (`deep-link` / `tld-only`), `used_in`, and `notes` that document exactly what was *not* asserted (e.g. the dropped "68% of local queries" and "86%/45%" figures — `sourced-claims.json:52,86`). `docs/fact-check.md` defines the three valid claim patterns and the failure history. `check-fabrications.mjs` + `check-audio-fabrications.mjs` enforce it across HTML and six-language audio. Gap: the ledger exists as a build input but is **not published as a machine-readable endpoint** — external engines and fact-checkers can't fetch the claim graph; its trust value is currently invisible to the very systems that corroborate.

**Benchmark gap (Wikipedia / Our World in Data).** Both win citations because their provenance is *visible and linkable*. Muntin's is equal in rigor but hidden in a repo file.

**The Extend-Past move.** A claim graph no competitor maintains — *and that AI engines can verify*. Publish a sanitized, public `sourced-claims` view (JSON-LD `Claim` / `ClaimReview`-adjacent, or a simple `/claims.json` + human `/claims/` page) so a corroborating engine resolves a Muntin number straight to its dated primary source. Giants can't expose a per-claim ledger because they don't hold first-party sources; Muntin does.

**Actions.**
1. Add a build step emitting a public `/claims.json` (or `/data/sourced-claims.public.json`) — `claim`, `source_url`, `source_name`, `date_verified`, `used_in` — excluding any private/operator-experience notes. **M × 5** — *asymmetric.*
2. Render a human `/claims/` index page (and `/es/claims/`) linking each claim to the articles citing it — the "trust ledger" made browsable. **M × 4.**
3. Emit per-article JSON-LD `citation`/`isBasedOn` nodes pointing at the source URLs for registered claims, so each page advertises its provenance to crawlers. **M × 4** — *asymmetric.*
4. Add a `url_status` freshness check: warn when a `deep-link` claim's `date_verified` is >180 days old. **S × 3.**

**Risks & honesty-gate notes.** The public view must strip anything tagged private/operator-experience — never expose unsourced operator framing as if measured. EN↔ES parity required for `/claims/` (`check-locale-parity.mjs`). Re-verify `tld-only` sources before promoting them in a public ledger; an unresolvable URL in a *trust* artifact is worse than none.

**One proof metric.** % of numeric claims in published articles that resolve, via the public ledger, to a dated primary `source_url` (target: 100%).

---

### 22 · Conversational-Query Strategist

**Aspect & why it decides success.** Owning operators' *real spoken questions* — the long, natural-language prompts ("how much should I raise menu prices?") that AI answer engines and PAA expand on. Conversational coverage is how a niche library out-ranks generic SEO content in AI answers.

**Current-state audit (score 7/10).** Quietly strong. `data/glossary-faq.json` renders both visible FAQ sections *and* FAQPage JSON-LD, with questions in literal search shape ("What is X?", "Why does X matter for a restaurant?") — and FAQPage is live in **130** article files (repo grep), far beyond the council's "~10" estimate. Article titles already track conversational intent ("How to Raise Restaurant Menu Prices Without Losing Reservations", "Does My Restaurant Need a Website? The Honest Answer"). HowTo steps in `article-howto.json` map to real sub-questions. Gap: FAQ Q&A is derived from glossary def/why prose; the *operator's* highest-intent decision questions (pricing, delisting, service-charge) aren't systematically harvested into article-level FAQ blocks.

**Benchmark gap (Google PAA / Quora).** PAA surfaces the exact phrasings; Quora shows the messy real questions. Muntin should own the answer to the decision questions an operator actually types at 11pm.

**The Extend-Past move.** Own "how much should I raise menu prices?" and its cousins as *named, answered, sourced* questions — not generic SEO pages but operator-voiced Q&A backed by the Margin Math tool and the Cost Index. The corroboration engines reward the source that answers the literal question with a dated number; Muntin already has the tool and the data.

**Actions.**
1. Harvest the top ~25 operator decision-questions (from article titles, HowTo steps, glossary why-prose — all already in-repo) into article-level FAQ blocks on the matching pillar articles. **M × 5** — *asymmetric* (operator-voiced + tool-backed).
2. Cross-link each conversational FAQ answer to the relevant tool (Margin Math, Delivery Break-Even) and Cost Index data point. **S × 4.**
3. Mirror the new FAQ blocks in ES (`check-locale-parity.mjs` requires it). **M × 3.**
4. Ensure each new FAQ answer is a self-contained, citable span (feeds specialists 17/18). **S × 4.**

**Risks & honesty-gate notes.** FAQ answers must derive only from existing fact-checked prose (the `glossary-faq.json` rule: "no new facts introduced") or carry their own citation. No invented operator percentages in pricing answers — use the registered figures or label illustrative. FAQPage JSON-LD content must be visible on-page (Google requirement, already the `inject-glossary-faq.mjs` pattern).

**One proof metric.** Count of operator decision-questions with a published, tool-linked, self-contained FAQ answer (EN+ES) — baseline from the harvest.

---

### 23 · AI-Overview Defense & Monitoring

**Aspect & why it decides success.** Tracking where Muntin is cited, detecting lost clicks, and converting AI citations into branded traffic + tool use. Without measurement, every other Domain III investment is faith-based.

**Current-state audit (score 3/10).** Weakest surface in the domain. There is no citation-tracking apparatus in-repo, and the council's own ledger notes `/ai/index.html` is minimal (no citation metrics). The site uses privacy-first Plausible (`ai/index.html:162-165`) — good for the privacy thesis but it does not, by design, expose the cross-site referrer detail GA4-style AI-channel tracking relies on. Honest external reality: AI Overviews / AI Mode traffic is still bucketed as *Organic Search*, not a separate channel (*mo.agency / vizup, 2026*), and zero-click means many citations produce **no** session at all — measured organic CTR on AI-Overview queries fell from 1.76% → 0.61%, a 61% collapse while rankings held (*nadiamohamed / leapd, 2026*).

**Benchmark gap (Google AI Mode).** Google's own surface is a black box for attribution. The realistic defense is a two-part frame: a *leading* indicator (are we cited at all — manual/probe) and a *trailing* indicator (did a click land — analytics).

**The Extend-Past move.** Convert citations into branded pull *that survives zero-click*: make the brand and a memorable next-step (a named tool, the Window) part of the citable answer itself, so even a no-click impression plants "Muntin / Margin Math." Then measure citation as a leading indicator the privacy-clean way — a manual probe log, not surveillance. Privacy-first is the constraint *and* the differentiator: Muntin can't out-track Google, so it out-*brands* inside the answer.

**Actions.**
1. Stand up a monthly citation-probe log (doc or `data/` JSON): fixed prompt set × engine × cited-URL, run by hand. No scraping, PII-clean. **M × 4** — *asymmetric* (privacy-clean leading indicator).
2. Ensure every citable answer span names the brand and one branded next-step (tool/Window) so zero-click still imprints. **S × 4.**
3. Add a Plausible custom event on AI-referrer landings (UTM-less referrer regex for known AI hosts) to surface the trailing indicator within the privacy budget. **M × 3.**
4. Build the `/ai/` page's "how we're cited" section as the branded landing for AI-referred visitors → route them to tools. **M × 3.**

**Risks & honesty-gate notes.** Do not publish any citation-rate number until the probe log has real entries — *illustrative until measured*. No GA4 / cross-site fingerprinting; that breaks the privacy-first constraint (BINDING #4) and the `/privacy.html` posture. Plausible event must stay cookieless/PII-clean. Don't imply we can measure zero-click citations we cannot.

**One proof metric.** Monthly probe-log citation count + AI-referrer landing sessions (two-part: leading + trailing), trended.

---

### 24 · Multimodal / Voice-Discovery Lead

**Aspect & why it decides success.** Audio narration + voice schema as a discovery and trust surface — the only *fact-gated, multilingual* audio restaurant-ops library in existence. Voice/multimodal is an uncontested lane: rivals don't fact-gate spoken output.

**Current-state audit (score 6/10).** Uniquely differentiated but operationally behind. The pipeline is real: `data/article-audio.json` tracks per-article status across en/es/fr/it/pt/zh; per-post `audio.json` + `audio.<lang>.json`; `check-audio-fabrications.mjs` is a genuine per-language fact gate (invariant URL rules every track, en/es bio-drift rules, warn-first numeric-parity). SpeakableSpecification ships in 83 files. AudioObject JSON-LD present (sample article). But coverage is thin: most library entries are `status: partial` or `pending`; the May-2026 blog cluster is mostly `rendered`, yet several library pillars and **all** course lessons are `pending`; 3 dirs carry stale "two-restaurants" renders waived pending re-render (`check-audio-fabrications.mjs` `STALE_AUDIO_WAIVERS`); 2 checklists `deferred` on the chunking defect (shared with specialist 20).

**Benchmark gap (Assistant / podcasts).** Google Assistant still uses speakable for US/English-news only, still beta since 2018 (*schema.org/speakable*; *aiproinsight, 2026*) — so the play isn't Assistant ranking; it's owning a *fact-gated multilingual audio corpus* that no competitor or podcast network produces.

**The Extend-Past move.** The only fact-gated audio restaurant-ops library, in six languages, that an operator can *trust* spoken aloud — because the gate proves the narration speaks no number absent from the sourced article. Lean into the ES audio especially (true parity rivals skip). This is multimodal trust as positioning, not voice-search SEO.

**Actions.**
1. Re-render the 3 stale-bio waived posts via `render-post-audio.mjs` and delete their `STALE_AUDIO_WAIVERS` entries — closes a known honesty gap that currently speaks the retired bio in 6 languages. **L × 5** (needs TTS toolchain; Don-owned).
2. Promote numeric-parity from warn-first → fail-CI once `PARITY_ALLOW` is seeded — making "audio speaks no unsourced number" an enforced guarantee. **M × 4** — *asymmetric* (turns the differentiator into a gate).
3. Unblock the 2 deferred checklists (shared with specialist 20's restructure) so the audio library is structurally complete. **M × 3.**
4. Publish the audio fact-gate as a *trust claim* on `/ai/` and in article audio UI ("narration is fact-checked in every language"), tied to `check-audio-fabrications.mjs`. **S × 4.**

**Risks & honesty-gate notes.** Re-render is the *only* honest fix for stale audio — a text-only edit hides the fabrication while the MP3 keeps speaking it (`check-audio-fabrications.mjs` header). Don't promote parity to fail-CI before seeding `PARITY_ALLOW` or CI breaks on legitimate locale formatting (zh 万-grouping precedent). Re-rendered ES should use `--use-existing-translations` against Don's authored ES prose (`article-audio.json` `_translation_canon`). No new spoken claims without source.

**One proof metric.** Audio fact-gate hardness: stale-bio waivers (3 → 0) + numeric-parity at fail-CI, with `rendered`-status article coverage % trending up.

---

### Cross-domain dependencies (for the Council synthesis)

- **III → I/II (Provenance & Brand):** Specialist 21's public claim ledger (`/claims.json` + `/claims/`) is the machine-verifiable backbone the trust/positioning domains lean on; it needs the brand voice (Domain II) for the human `/claims/` page and feeds the "honest source" thesis Domain I sells. Build order: ledger endpoint before any external "verifiable trust" marketing claim.
- **III → IV/V (Content & Tools):** Specialists 18/22's citable-answer + conversational-FAQ work depends on Content (Domain IV) supplying the per-H2 answer spans and on Tools (Domain V) exposing Margin Math / Delivery Break-Even / Cost Index as the linkable, data-backed payoff each AI answer routes to — citation without a tool destination wastes the zero-click brand impression specialist 23 is trying to capture.
