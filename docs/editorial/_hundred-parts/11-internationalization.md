## Domain XI — Internationalization (ES and beyond)

**Positioning Council · Batch XI · Specialists 76–81**
Strategy only. No live-site edits proposed below are executed here. Every number is repo-sourced (path cited), web-sourced (publisher + date), or labeled *illustrative / analyst assessment*. The honesty gate is absolute.

### Standing repo-fact ledger (re-audited 2026-06-16, supersedes stale brief numbers)

Verified against the working tree, not the brief's prose:

- **Surface coverage:** `library/` 39 EN vs `es/library/` 30 → **ES lags 9** (not ~6). `blog/` 13 EN vs `es/blog/` 10 → **ES lags 3** (not 1). `glossary/` 151 EN ↔ `es/glossary/` 151 → **at parity** (term `index.html` pages exist on both sides). `tools/` 22 EN ↔ `es/tools/` 21. `sheets/` 49 EN ↔ `es/sheets/` 49 → **parity**. `es/cost-index/` = hub + 18 ingredient dirs. `es/course/` = 9 module dirs.
- **Slug map** (`data/i18n-slug-map.json`, `_lastReviewed: 2026-05-03`): `blog` 11 EN→ES, `library` 26 EN→ES, `esOriginal: []` empty. Translated ES slugs are deliberate (e.g. `keep-plate-cost-honest-when-prices-change` → `costo-del-plato-cuando-cambian-los-precios`).
- **hreflang:** `sitemap.xml` carries 1,115 `<url>` blocks, each with en/es/x-default `xhtml:link` (3,345 alternates). Page-level blocks stamped by `scripts/stamp-hreflang.mjs` behind the `<!-- i18n:hreflang START/END -->` sentinel; orphan guard `scripts/check-hreflang-orphans.mjs --check` is wired into `check-all.mjs` (blocking).
- **UI strings:** `_includes/i18n.es.json` = **85 keys** (nav/form/audio). `data/sheets.json` carries bilingual fields (`title_en/title_es`, `summary_en/_es`, `walkaway_en/_es`, `url_en/_es`, `cadence_en/_es`, `es_locale_hazard`) for all 49 sheets; longer ES prose in `data/sheets.es.json`. `data/glossary-seo.json` = **140 terms each with an `es{title,desc}` block** (140/140).
- **fr/it/pt/zh (audio-only):** On disk, **48 posts** each carry `audio.fr.json`, `audio.it.json`, `audio.pt.json`, `audio.zh.json` **and rendered MP3 siblings** (`find` counts: 48 `.fr.mp3`, 48 `.es.mp3`, 48 `.zh.mp3`). BUT the editorial tracker `data/article-audio.json` blesses far fewer: of **98 status-bearing nodes**, only **5 `rendered`, 26 `partial`, 65 `pending`, 2 `deferred`**. So audio is *mechanically rendered at scale, editorially blessed only narrowly.* No web surface / no UI strings for fr/it/pt/zh.
- **Translation pipeline truth:** `scripts/build-ui-translations.mjs` → `scripts/lib/translate.py`. Its own header states the backend is **Cloudflare Workers AI (Llama 3.3 70B Instruct, fp8-fast), fallback Google Translate**, with document-level batching + brand-glossary placeholder substitution + an editorial-tone prompt. The "fully human, no machine-translation fallback" line in `check-locale-parity.mjs`'s comment is **contradicted by the actual code.** Honest framing for this whole domain: **MT is in the loop; the moat is the fact-gate + transcreation review layered on top of it, not the absence of machines.**
- **Parity gates in `check-all.mjs` (blocking `--check`):** `check-hreflang-orphans`, `check-locale-parity`, `check-course-locale-parity`, `check-lifecycle-locale-parity`, `check-window-locale-parity`, `check-security-locale-parity`. *Caveat:* `check-locale-parity.mjs` self-downgrades to warn-only even under `--check` ("initial rollout"; line ~229) — so EN→ES surface drift is **reported, not enforced**, today.
- **Locale-region defect (new finding):** `og:locale` content values across the tree split **es_US (1,437) vs es_ES (37: 7 ES pages + 30 EN-stamped pages)**. `es_ES` = Spain; the workforce thesis is US-Latino. The 37 `es_ES` stragglers are a self-inflicted geo-signal contradiction. `hreflang` itself is uniformly bare `es` (3,176 instances) — defensible, but see brief 78.

---

### 76 · i18n Architect

**Aspect & why it decides success.** The architecture decides whether EN↔ES parity is a *guaranteed invariant* or a *best effort that quietly rots.* Slugs are final-forever and deep-linked; a wrong hreflang target 404s an AI-Overview citation. Get the plumbing right once and every later brief inherits a clean substrate.

**Current-state audit (score 7.5/10).** Strong bones: slug-map-aware hreflang (`stamp-hreflang.mjs` lines 125–156 omit a phantom `es` alternate when the ES file is absent — exactly Google's "don't declare a stale return tag" rule), sentinel-guarded blocks, an orphan gate that blocks CI, full sitemap alternates. Deductions: (a) `og:locale` es_ES/es_US split on 37 pages (verified); (b) `check-locale-parity.mjs` is warn-only in practice; (c) the slug map's `_lastReviewed` is 2026-05-03 while EN has added 9 library + 3 blog posts since — the map is the bottleneck artifact and it's already stale.

**Benchmark gap — Airbnb.** Airbnb's i18n platform stores every UI string as a uniquely-keyed "phrase" in a central repo and dispatches each new/modified phrase for translation across all languages (Airbnb Tech Blog, Hua Zheng, "Building Airbnb's Internationalization Platform"; 62 languages, 100B+ translate req/day). Muntin has the *page-pair* discipline but not Airbnb's **string-as-record** discipline outside `i18n.es.json` — body prose lives in HTML, so parity is checked structurally, not at the string level.

**The Extend-Past move.** Make parity a **typed contract, not a vibe**: every EN public page must resolve to exactly one ES counterpart (via mirror-path or slug-map), the slug-map must be CI-validated against disk, and `og:locale` must be uniformly `es_US`. A giant won't hand-curate a 26-entry restaurant-ops slug map; that artisanal map *is* the moat — so protect it like one.

**Actions.**
1. **Normalize the 37 `es_ES` → `es_US`** across the 7 ES + 30 EN pages; add a one-line assertion to `check-hreflang-orphans.mjs` (or a sibling) that no `og:locale` content is `es_ES`. *(S × 4)*
2. **Add a slug-map↔disk validator**: fail CI if any key in `i18n-slug-map.json` lacks its `es/<ns>/<value>/index.html`, or any `es/{blog,library}` dir is neither a map value nor in `esOriginal[]`. *(S × 4)*
3. **Flip `check-locale-parity.mjs` to true `--check`** for a frozen "parity-complete" subset (start: all pages already paired today), so new drift in that set is blocking while the lagging 9+3 stay warn-only. *(M × 5)*
4. **Stamp a `dateModified`-pair sentinel** so EN edits auto-flag the ES counterpart stale (extends existing mtime heuristic into a visible per-page marker). *(M × 3)*

**Risks & honesty-gate notes.** Flipping to `--check` site-wide today would red-CI on the 9-library/3-blog backlog — scope to a paired subset. Do **not** claim "100% parity"; claim "parity enforced on the paired set, backlog tracked." The es_ES count (37) is verified, not estimated.

**One proof metric.** Paired-set drift = 0 under blocking `--check`, and 0 pages with `og:locale=es_ES`.

---

### 77 · ES Localization / Transcreation Lead

**Aspect & why it decides success.** The restaurant workforce is Spanish-first — **44.9M US residents 5+ speak Spanish at home** (U.S. Census Bureau, 2024 ACS) and **28% of US restaurant/foodservice employees are Hispanic** (National Restaurant Association, 2024 employee-demographics). If the ES side reads like decoded English, the actual back-of-house bounces. Transcreation — not translation — is the job: "a complete reimagining… starting from a brief rather than a source text" (Smartling/Lokalise, localization-industry definition).

**Current-state audit (score 6.5/10).** The intent is right and visible: `data/sheets.es.json`'s translator brief says "translate the framework, not the legal terms; do not translate CSV/PDF or platform names" — that's transcreation thinking. The sampled ES article (`es/library/costo-del-plato-cuando-cambian-los-precios/`) keeps Don Goldstein / Tacombi / Bethesda **singular, with zero "dos restaurantes" drift** (verified), preserves `viz-ba`/`viz-bars` figures, 3 `<details class="cite">` drawers, 11 `i18n` spans. Deduction: the *first-draft engine* is Llama-3.3-70B MT (`translate.py`), so "native feel" depends entirely on a human transcreation pass that is **not currently gated** — nothing in CI proves an ES page was reviewed rather than shipped raw-MT.

**Benchmark gap — Netflix / Duolingo.** Netflix treats Spanish-language content as first-class catalog, not subtitled afterthought (analyst assessment; specific viewership figures *no solid source retrieved*, so unstated). The transferable principle: Spanish is an **audience**, not an accommodation. Muntin's ES surface still trails EN by 9+3 — structurally an afterthought, however good the prose.

**The Extend-Past move.** Institute a **transcreation sign-off record** (`data/i18n-review.json`: per ES slug → `reviewedBy`, `date`, `sourceEnDateModified`) and surface it in parity reporting. The asymmetry: a majority-language-ad-market giant optimizes for English reach and ships Google-Translate Spanish; Muntin ships *brief-driven, operator-voiced, human-blessed* Spanish. **That review ledger is the proof the moat exists.**

**Actions.**
1. **Add `data/i18n-review.json` + a warn-first gate** that lists ES pages whose `sourceEnDateModified` is newer than `reviewedDate` (reuses the mtime logic already in `check-locale-parity.mjs`). *(M × 5)*
2. **Burn down the 9-library/3-blog backlog**, highest-traffic first (the DoorDash and pricing clusters already have ES counterparts — extend to the lagging evergreen library). *(L × 5)*
3. **Codify the transcreation brief** as `docs/voice-canon-es.md` (today the brief is scattered in `sheets.es.json._doc` and `translate.py`'s prompt) — name it a canon so it governs. *(S × 3)*
4. **Spot-audit raw-MT leakage**: sample 10 ES pages for literalisms the editorial register would never use; log to the review ledger. *(M × 3)*

**Risks & honesty-gate notes.** Per-language audio fact gate (`check-audio-fabrications.mjs`) already blocks bio drift in es/fr/it/pt/zh — lean on it; don't duplicate. Do not market the ES side as "human-translated" while `translate.py` defaults to Llama — the honest claim is **"machine-drafted, human-transcreated, fact-gated."** [ASYMMETRIC]

**One proof metric.** % of public ES pages with a `reviewedDate` ≥ their EN `dateModified` (target 100% on the paired set).

---

### 78 · Locale-SEO Specialist

**Aspect & why it decides success.** Ranking in **US Spanish-language** restaurant-ops queries is a near-empty SERP — competitors don't transcreate, and Google now actively *demotes* the raw-MT shortcut they'd use (see below). Owning "cómo salir de DoorDash," "cuánto cuesta una página web para restaurante," "Google Business Profile para restaurante" is reachable for a one-person studio precisely because the giants won't earn it.

**Current-state audit (score 7/10).** Mechanics are largely correct: bidirectional alternates, x-default → EN, ES `<html lang="es">`, ES SEO titles/metas via `glossary-seo.json` (140 terms) and `inject-glossary-seo.mjs`. Translated ES slugs are keyword-shaped in Spanish (`uber-eats-vs-doordash-vs-grubhub-cuentas-para-restaurante-2026`) — good. Deduction: bare `hreflang="es"` (3,176×) targets *all* Spanish globally; for a US-Latino thesis, the question of `es-419` (Latin-American Spanish) or `es-US` vs Spain-flavored prose is unresolved, and the 37 `es_ES` og:locale tags actively mis-signal Spain.

**Benchmark gap — Google Search Central.** Google: self-referential + **reciprocal** return tags are mandatory; a single asymmetric/broken annotation makes Google **ignore the entire cluster** (Google Search Central, *Localized Versions* docs, current). And the **Scaled Content Abuse** policy (Google Search Central Blog, *"What web creators should know about our March 2024 core update and new spam policies,"* March 2024) explicitly names "translating… where little value is provided to users" and automated translations as violations. **Muntin's transcreation+fact-gate is literally the thing Google's 2024 policy rewards over competitors' bulk MT.**

**The Extend-Past move.** Stop treating ES SEO as a mirror and start treating it as **its own keyword program**: ES-native query research (transcreated intent, not translated EN keywords), ES-specific FAQ schema, and an explicit decision on `es` vs `es-419`/`es-US` documented in canon. Publish the *editorial* difference loudly — "written for the operator, fact-checked, not machine-dumped" — because that's the post-March-2024 ranking story.

**Actions.**
1. **Decide and document the region code** (recommend keep bare `hreflang="es"` for reach BUT fix all `og:locale` to `es_US`; note rationale in `docs/voice-canon-es.md`). *(S × 4)*
2. **ES-native keyword pass** for the lagging library backlog so new ES pages target real Spanish search intent, not back-translated EN. *(M × 5)*
3. **Add ES FAQ/HowTo schema parity** check — ensure ES pages carry the structured data their EN twins do (extends the article-graphics discipline to schema). *(M × 4)*
4. **Lean into the spam-policy contrast** in the methods/EScanon: a short, sourced "why our Spanish ranks" note citing Google's March-2024 policy. *(S × 3)*

**Risks & honesty-gate notes.** Any cited search-volume number must come from a real tool (Semrush MCP is available) and be labeled with date — do not assert ES query volumes from memory. The 75%-of-hreflang-implementations-have-errors stat is *third-party (International Web Mastery, via search), not Google* — label it as such if used. [ASYMMETRIC]

**One proof metric.** Count of US Spanish-language restaurant-ops queries where a Muntin ES page ranks top-10 (baseline now, tracked monthly via Semrush).

---

### 79 · Cultural-Adaptation Researcher

**Aspect & why it decides success.** Idioms, examples, units, and platform/legal references decide whether an ES page *feels written for* a Latino operator or merely *about* one. A peso-vs-dollar slip or a Spain-Spanish idiom ("vale," "ordenador") in US back-of-house copy breaks trust instantly with the exact reader the thesis targets.

**Current-state audit (score 6/10).** Evidence of real cultural thinking exists: `sheets.es.json` instructs keeping platform names (Google Business Profile, DoorDash) and formats (CSV/PDF) untranslated, and flags `es_locale_hazard` + a regional disclaimer for hazard sheets — that's jurisdiction awareness. `translate.py` preserves a brand glossary. Deductions: (a) no documented stance on **Spain vs Latin-American Spanish register** (the es_ES tags suggest the question hasn't been settled); (b) units/currency conventions aren't audited (cost-index is USD — correct for US, but no check confirms ES pages never inherit a non-US example); (c) cultural adaptation lives in tool prompts, not a reviewable canon.

**Benchmark gap — Airbnb / Spotify.** Airbnb's localization is famous for adapting *examples and imagery* per market, not just strings (analyst assessment from public eng/loc writing; Spotify similar). The transferable bar: content that uses *the reader's* references. Muntin's restaurant examples are US-generic; they're not yet *Latino-operator-specific* (e.g., taquería/panadería/pupusería framings where apt — Don's own seat is Tacombi, a Mexican concept, which is an authentic, on-brand bridge).

**The Extend-Past move.** Build a **cultural-adaptation checklist** (register = Latin-American neutral; units = US; currency = USD; platform/legal names preserved; examples drawn from concepts the reader runs) and bake it into the transcreation brief. The asymmetry: a giant localizes for "Spanish speakers" as an abstraction; Muntin localizes for *the person bussing tables in Silver Spring who wants to open their own spot* — and Don's Tacombi seat makes that voice credible, not appropriated. [ASYMMETRIC]

**Actions.**
1. **Settle register in canon**: declare "Latin-American neutral Spanish, US conventions" in `docs/voice-canon-es.md`; this also justifies fixing es_ES→es_US. *(S × 4)*
2. **Cultural-adaptation checklist** appended to the ES review ledger (brief 77 action 1) — one row per ES page. *(S × 4)*
3. **Example-localization pass** on the top ES pages: where an example is US-generic, swap to a concept the target reader operates, *only where it stays fact-true* (no invented anecdotes). *(M × 4)*
4. **Units/currency lint**: warn if an ES page introduces a number/currency its EN source doesn't carry (mirrors the audio numeric-parity check). *(M × 3)*

**Risks & honesty-gate notes.** Cultural examples must not become invented operator anecdotes — illustrative framings only, and any operator-specific claim still routes through `sourced-claims.json`. Don's bio stays singular; "I run a taquería" would be a fabrication. The "neutral Spanish" recommendation is *analyst assessment*, not a sourced linguistic mandate — label it.

**One proof metric.** % of top-20 ES pages passing the cultural-adaptation checklist (register, units, examples) on review.

---

### 80 · Multilingual-Expansion Strategist

**Aspect & why it decides success.** fr/it/pt/zh audio is the option value on "more languages" — but only if expansion never weakens the fact gate. A roadmap to N languages that lets one unblessed fabrication through would speak it aloud in that language; the gate must scale *before* the surface does.

**Current-state audit (score 6.5/10).** Real scaffolding exists: **48 posts** carry `audio.{fr,it,pt,zh}.json` + rendered MP3s, voiced by named Kokoro voices (`ff_siwis`, `im_nicola`, `pm_alex`, `zm_yunxi` — per `article-audio.json`). The language-aware gate `check-audio-fabrications.mjs` already applies bio-drift rules per spoken language plus numeric-parity. **Honest deduction:** the editorial tracker blesses only **5 `rendered`** of 98 nodes (26 partial, 65 pending) — so the *mechanical* render outran *editorial* blessing. fr/it/pt/zh have **no web surface and no UI strings** — correctly scoped as audio-only, but the manifest/disk divergence means "shipped" is ambiguous and unaudited.

**Benchmark gap — Wikipedia.** Wikipedia runs **300+ language editions** (Wikimedia, 2024) as *independent* editions, not auto-translations, and built the **Content Translation** tool (launched 2015; 2M+ articles via it by 2025 — Wikimedia/Diff, 2025) to assist *without* removing human authorship. The transferable model: a language is added only when it can be *maintained to standard*, and tooling assists rather than replaces the gate. Muntin's risk is the inverse — render first, bless later.

**The Extend-Past move.** Define a **language-promotion ladder** with gate-defined tiers: `pending` (MT-rendered, unaudited) → `partial` (fact-gate clean, spot-checked) → `rendered` (fully blessed, eligible to advertise). Publicly claim only the `rendered` tier. The asymmetry: a giant would auto-publish all 48×4; Muntin's restraint — *N languages, each gate-clean* — is the trustworthy multilingual story Google's scaled-content policy now favors. [ASYMMETRIC]

**Actions.**
1. **Reconcile manifest↔disk**: a check that every on-disk `audio.<lang>.json`/MP3 has a matching `article-audio.json` status node (kill the silent 48-vs-98 divergence). *(M × 4)*
2. **Document the promotion ladder** in the audio canon; gate `rendered` status on `check-audio-fabrications.mjs` passing for that track. *(S × 5)*
3. **Burn `pending`→`rendered`** for the highest-value posts in all four languages, fact-gate first. *(L × 4)*
4. **Pick language #5 by demand, not ease** — document the criterion (workforce share / query demand) before adding it. *(S × 3)*

**Risks & honesty-gate notes.** The 65-pending count is verified from `article-audio.json`; do not describe fr/it/pt/zh as "live in four languages" — accurate framing is **"audio scaffolded for 48 posts; 5 fully blessed, rest in the gate queue."** Kokoro voice names are repo-sourced. No claim that fr/it/pt/zh have a web surface (they don't).

**One proof metric.** Count of posts at `rendered` status per language (today: 5 total across the tracker) — grows only as the fact gate passes.

---

### 81 · Locale-Parity QA Engineer

**Aspect & why it decides success.** Parity that isn't enforced in CI *will* drift — the whole asymmetric thesis collapses the day an EN edit silently leaves the ES reader on stale copy. The QA layer is what converts "we care about Spanish" from a claim into a guarantee.

**Current-state audit (score 7/10).** Genuinely strong for a one-person static site: six locale gates run `--check` in `check-all.mjs` (hreflang-orphans, locale, course, lifecycle, window, security), plus `check-course-locale-parity.mjs` enforces lesson-level invariants (positions, widget sets, context keys) and `check-lifecycle-locale-parity.mjs` pins EN/ES email-template export parity. Deductions: (a) **`check-locale-parity.mjs` is the keystone and it's warn-only even under `--check`** (line ~229) — the most important surface gate doesn't actually fail; (b) **`scripts/test-i18n-coverage.mjs` exists but is NOT wired into `check-all.mjs`** (verified) — a real coverage test sitting unrun; (c) no manifest↔disk audio reconciliation (brief 80); (d) no `og:locale` value assertion (let the es_ES bug through).

**Benchmark gap — enterprise i18n CI.** Mature i18n CI fails the build on any missing/asymmetric translation key (Airbnb-class phrase pipelines treat an untranslated key as a build error). Muntin reports drift but ships it. Closing that one gap moves parity from *observed* to *enforced.*

**The Extend-Past move.** Make **parity a release gate, scoped honestly**: enforce blocking on the already-paired set (so the system can never regress), keep the lagging backlog as a visible warn-list, and wire the two dormant safeguards (`test-i18n-coverage.mjs`, an `og:locale` assertion) into `check-all.mjs`. The asymmetry: enforced, self-healing parity is exactly the investment a majority-language-optimizing giant won't make for Spanish-native restaurant ops. [ASYMMETRIC]

**Actions.**
1. **Wire `test-i18n-coverage.mjs` into `check-all.mjs`** (it already exits non-zero on failure) — zero-cost coverage enforcement that's currently dark. *(S × 4)*
2. **Scope-and-flip `check-locale-parity.mjs`** to true blocking on a frozen paired set (pairs with brief 76 action 3); backlog stays warn. *(M × 5)*
3. **Add the `og:locale=es_US` assertion + manifest↔disk audio reconciliation** as small CI checks. *(S × 4)*
4. **Parity dashboard line** in `check-all` summary: "paired N/N enforced, M lagging (warn)" so drift is always visible at a glance. *(S × 3)*

**Risks & honesty-gate notes.** Flipping the keystone gate blindly red-CIs the 9+3 backlog — the *scope-to-paired-set* framing is the safe path and must be stated, not glossed. `check-all.mjs` runs ~85 `check-*` scripts today; the brief's "~113" likely counts sub-steps/modes — use the verified count or label it approximate. Keep gates report-then-enforce so contributors get a punch list, not a wall.

**One proof metric.** CI red on any *paired-set* EN→ES drift (currently: green even on drift) — i.e., the keystone gate's first true failure proves enforcement is live.

---

### Cross-domain dependencies (for the council)

- **76/77/78/79 all gate on one new artifact** — `docs/voice-canon-es.md` (register + transcreation brief) and `data/i18n-review.json` (the human-blessing ledger). Without the canon, "native ES" stays an unprovable claim and the es_ES/es_US fix lacks a stated rationale.
- **80 ↔ 81** share the **manifest↔disk reconciliation**: the audio expansion roadmap and the QA layer must agree on what "rendered" means before either advertises four languages.
- **Whole domain ↔ Domain II (SEO) & III (AEO):** the post-March-2024 Google Scaled-Content policy makes Muntin's *transcreated, fact-gated* Spanish a **ranking and citation advantage** — coordinate the messaging so the SEO/AEO briefs claim the moat the i18n layer actually builds. The honest through-line everywhere: **machine-drafted, human-transcreated, fact-gated** — never "human-translated," never "live in N languages."
