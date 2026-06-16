## Domain XIII — Information Architecture & UX

*Positioning Council, batch XIII (specialists 89–94). Strategy only — no live-site edits made in producing this brief. Every figure below is repo-sourced (cited to file), web-sourced (labeled with source + date), or marked "illustrative / analyst assessment." The asymmetric thesis: a tired operator on a phone mid-shift is better served by an honest, fast, findable static site with human microcopy than by an ad-dense aggregator (Yelp) or a generic template (Wix). The asymmetric play is helpfulness as UX — knit rails, smart-next, plain microcopy that respects the operator's time, with zero engagement-maximizing dark patterns a giant's growth team would bolt on.*

---

### 89 · IA / Navigation Architect

**Aspect & why it decides success.** Navigation is the contract between ~1,100+ URLs (repo: `site-counts.json` — 36 library, 11 blog, 150 glossary, 13 live tools, 48 sheets, 16 course modules, 16-ingredient cost-index) and a thumb on a 5-inch screen during a 6pm rush. If the operator can't reach the answer in <3 clicks, the aggregator wins by default. IA is the spine every other brief hangs from.

**Current-state audit (score: 7/10).** The primary nav is a disciplined 5 items — Library / Start / Tools / Company / Ledger — plus a Cmd+K search button and the "Reach Don" CTA (repo: `_includes/nav.html` lines 223–240; mirrored in `index.html`, `methods/index.html`). The mega-menu was retired (Phase 7); `/library/` is the canonical three-doors hub. Footer (`_includes/footer.html`) reinforces the same IA in four columns: Library / Company / Trust / Contact. `/start/` (repo: `start/index.html`, 1,401 lines) is a genuine entry point: a 3-question diagnostic routing to 7 named journeys + fallback, each a four-corner kit (read / run / write / look up), and it degrades to a stacked directory with JS off. Strengths: slug discipline (final-forever), breadcrumb on every template (`sheet-shell.html` line 61), no orphan surfaces. Gaps: glossary (150) and sheets (48 in 6 packs) have **no faceted hub in the primary nav** — they're reachable only via footer or in-body knit; the cost-index and course are nav-invisible; "Company" is a vaguer label than the surfaces it hides.

**Benchmark gap (Stripe Docs / Apple Support).** Stripe Docs (stripe.com/docs, accessed Jan 2026) keeps a persistent left-rail tree so any of thousands of pages is 2 clicks from any other; Apple Support (support.apple.com, accessed Jan 2026) leads with task-shaped entry tiles, not a product org-chart. Muntin has the task-entry idea (`/start/`) but lacks the *persistent cross-surface tree* — a deep glossary term gives no sense of "where am I in 1,100 URLs."

**The Extend-Past move.** A giant adds a mega-menu with promoted upsells. The asymmetric move is the opposite: a single, honest, build-time-generated **"Everything" index** (one static page, no JS) that lists all six surfaces by section — the sitemap a human would actually read — linked from the footer and the 404. Plus a persistent breadcrumb that names the surface ("Glossary → Prime cost"), so the operator always knows which of the four corners they're standing in.

**Actions.**
1. Ship a static `/index/` (or `/map/`) human sitemap generated from the filesystem at build time, EN+ES, linked in footer + 404. **(S × 4)**
2. Add Glossary and Sheets as explicit nav or sub-nav entries (or a "Reference" group) so the two largest surfaces aren't footer-only. **(M × 4)**
3. Rename footer/nav "Company" → keep, but add a one-line `title`/dek on the hub so the label's scope is legible. **(S × 2)**
4. Add a build-time link-integrity check (every nav/footer/journey slug resolves on disk) into `check-all.mjs` so IA can't silently rot. **(M × 5)**
5. Stamp the current-surface name into every breadcrumb's last crumb consistently (already true on most templates; audit the long tail). **(S × 3)**

**Risks & honesty-gate notes.** A human sitemap must be generated, never hand-listed, or counts drift from `site-counts.json` (the count sentinels are the source of truth). No new claims introduced. Nav labels must stay in the CTA/voice canon — no "Explore," no "Discover."

**One proof metric.** Share of sessions reaching a tool, sheet, or article in ≤3 navigation clicks from any entry page (Plausium pathing; target ≥80%).

---

### 90 · Search / Findability Lead

**Aspect & why it decides success.** With ~1,100+ URLs, search is the operator's fastest path when they know the word but not the route ("prime cost," "DoorDash math"). A static site that nails instant, typo-tolerant, bilingual search beats Yelp's search-then-wade-through-ads pattern on the one axis the operator cares about at 6pm: speed to answer.

**Current-state audit (score: 7/10).** Search is Pagefind-backed (repo: `pagefind.yml`; modal in `assets/site.js` line 580+), lazy-imported from `/pagefind/pagefind.js` on first open, fully client-side (no query leaves the browser — on-thesis for privacy). Locale-split: Pagefind reads `<html lang>` and builds a separate index per language, so `/es/` readers get Spanish results (`pagefind.yml` lines 7–11). Chrome is excluded from the index (nav/footer/breadcrumb), keeping results content-focused. Notable craft: a **curated fallback** for tokens Pagefind's BM25 optimizer drops as too-common, and a brand-alias override so a "muntin" query doesn't over-promote the homepage (`site.js` lines 635, 695–704). ES search strings are localized (repo: `_includes/i18n.es.json` — `search.placeholder`, `search.empty`, `search.kind_*`). Gaps: **no typo-tolerance** is documented (Pagefind v1 is prefix/substring, not fuzzy — a misspelled "reservaton" likely returns nothing); no per-surface filter chips (Article / Tool / Sheet / Term) in the UI despite the kinds being defined; draft posts can appear in results (`pagefind.yml` lines 31–40, accepted for v1).

**Benchmark gap (Algolia DocSearch / Stripe Docs search).** Algolia DocSearch (docsearch.algolia.com, accessed Jan 2026) ships typo-tolerance and grouped results-by-section as defaults; Stripe's docs search returns sectioned, keyboard-navigable results instantly. Muntin matches the instant + keyboard + bilingual bar but trails on fuzziness and faceting.

**The Extend-Past move.** A giant would log every query to a server to "improve relevance" (and profile the user). The asymmetric move: keep search 100% client-side, and instead of server logging, add a **typo-tolerant synonym/alias layer as static data** (a build-time `search-aliases.json`: "reservaton→reservation," "door dash→doordash," "GBP→Google Business Profile") plus surface-kind filter chips using the already-defined `search.kind_*` labels. Findability improves with zero surveillance.

**Actions.**
1. Add a static synonym/typo-alias map feeding the existing curated-fallback path in `site.js`; cover the top misspellings and the EN↔ES term bridges. **(M × 4)**
2. Add surface-filter chips (Article / Tool / Sheet / Term / Page) to the modal, reusing `search.kind_*` from `i18n.es.json`. **(M × 4)**
3. Add `data-pagefind-ignore` to draft bodies so unfinished posts stop surfacing in results. **(S × 3)**
4. Confirm Pagefind's bilingual init passes the page locale on `/es/` (per `pagefind.yml` comment) and add a parity check that both indexes build in CI. **(M × 3)**
5. Surface "top searches lead here" static suggestions in the empty state (curated, not behavioral). **(S × 2)**

**Risks & honesty-gate notes.** Synonym lists are editorial, not claims — but any term mapping must match canonical glossary slugs (final-forever) or links 404. No query logging may be added (privacy canon, `/never/`). Filter labels must use the existing localized strings, not new copy.

**One proof metric.** Search-success rate = sessions where a search is followed by a result click within the same modal session (target ≥70%); secondary: zero-result query rate (target <10%).

---

### 91 · UX-Research / JTBD Lead

**Aspect & why it decides success.** The whole site is a bet on what a tired operator needs. If that bet is sourced from analytics guesses instead of real shift-floor jobs, the IA optimizes for the wrong jobs. JTBD discipline is what keeps the four-corner kits honest.

**Current-state audit (score: 6/10).** The `/start/` diagnostic already encodes a JTBD model: three axes — *what's leaking* (margin/covers/discovery/kitchen/unsure), *what stage* (building/running/rebuilding), *what records on hand* (have-numbers/partial/blank-slate) — mapping to 7 named jobs (repo: `data/start-here-journeys.json`, `_lastReviewed` 2026-06-03). This is a strong, legible job map. The operator bio is a real, singular grounding source: Don Goldstein, full-time FOH manager at Tacombi in Bethesda (repo: `CLAUDE.md`; `methods/index.html` lines 433–434), with sourcing policy in `/methods/`. Gaps: the journey map is **analyst-authored, not interview-validated** — there's no repo artifact (no `data/operator-interviews.json`, no research log) showing the jobs came from talking to operators; `/methods/` cites external research (NN/g, Baymard) for *claims* but the IA's *job taxonomy* itself isn't sourced. This is the biggest honesty-adjacent gap in the domain: the routing logic implies operator knowledge it doesn't cite.

**Benchmark gap (Intuit "Follow Me Home").** Intuit's Follow-Me-Home program (documented in Intuit design-research literature, e.g. *The Lean Product Playbook* and Intuit's own design blog, accessed Jan 2026) sends researchers to watch real users do the job in their own environment, then designs from observed behavior. Muntin's equivalent — Don *is* the operator, on a real restaurant floor — is a genuine asymmetric asset a venture-backed competitor can't fake, but it's underused as a documented research input.

**The Extend-Past move.** A giant runs A/B tests on engagement metrics. The asymmetric move: turn Don's own shift floor + The Window inbound into a **documented, sourced research loop**. Log (PII-clean, with consent) the real questions operators send via The Window and the real `/start/` answer-tuples chosen, and feed recurring jobs back into the journey map — and *cite that loop in `/methods/`* so the routing logic earns the same fact-gate honesty as the prose.

**Actions.**
1. Create a `docs/research/jtbd-log.md` (not web-routable) recording the operator-job basis for each of the 7 journeys, tied to Don's floor experience and dated. **(M × 4)**
2. Instrument `/start/` answer-tuple selection as a privacy-clean Plausible custom event (which leak/stage/paperwork combos are picked) — aggregate counts only, no PII. **(S × 4)**
3. Add a one-question, optional "Did this plan fit?" yes/no at the foot of each journey result (client-side, anonymous tally). **(S × 3)**
4. Cluster The Window inbound topics quarterly into a jobs list; route the top unmet job into a new journey or article. **(M × 5)**
5. Add a line to `/methods/` describing how the job taxonomy is derived (operator floor + inbound clustering), so the IA inherits the fact gate. **(S × 3)**

**Risks & honesty-gate notes.** Any inbound clustering must be PII-clean and consented (privacy canon). The job map must not imply operator data Don doesn't have (e.g., cohort sizes) — `check-fabrications.mjs` blocks "two restaurants" drift; keep the bio singular. Research notes are internal `docs/`, not claims, but anything surfaced to `/methods/` must be sourced or labeled.

**One proof metric.** Journey-fit rate: % of "Did this plan fit?" responses answering yes (target ≥75%), tracked per journey to find the weakest map node.

---

### 92 · Wayfinding / Cross-Sell UX

**Aspect & why it decides success.** A single article rarely solves a job; the operator needs the *next* right surface (the tool that runs the math the article describes, the sheet that captures it, the term that defines it). Wayfinding is where "helpfulness as UX" lives or dies — and the exact place a giant would insert manipulation.

**Current-state audit (score: 8/10 — the domain's strongest).** The knit/cross-sell system is mature and sentinel-driven, so it's auditable and idempotent: glossary-knit and tool-knit installers (`scripts/add-glossary-knit-sentinels.mjs`, `scripts/add-tool-knit-sentinels.mjs`) drop `<!-- *-knit -->` markers before `</main>` and build scripts fill them. The Companion-kit footer (`data/cross-surface-map.json`, 1,063 lines, `_lastReviewed` 2026-06-03) gives every library article a four-corner kit: 3 related articles + 1 tool + 1 sheet + 3 glossary terms, with a topic-tag co-occurrence fallback. Four anchor maps wire the corners (`data/glossary-tool-anchors.json`, `glossary-sheet-anchors.json`, `glossary-course-anchors.json`, `sheet-glossary-anchors.json`). Sheets carry their own "Pairs with" knit (`sheet-shell.html` lines 138–148). Cross-tool handoffs are real and humane: plate-cost has "Add to Menu Engineering →" and "Use in Margin Math →" (repo: `tools/plate-cost/index.html` lines 1025–1026), passing state via URL fragment so nothing crosses the network. Gap: the recommendations are **editorially curated, not freshness-aware** — a retired/renamed surface could leave a stale corner (mitigated by the slug-final rule and the `--check` drift mode the map's `_doc` describes, but no live CI gate confirmed here).

**Benchmark gap (Netflix / Amazon recommendations).** Netflix and Amazon (accessed Jan 2026) maximize *session length and basket size* via behavioral collaborative filtering. Muntin's recs are editorial and static — which is the *point*: they're "next useful step," not "next thing to keep you here." Muntin trails on personalization but that's a deliberate, honest trade.

**The Extend-Past move.** The giant's growth team adds "people who viewed this also bought," autoplay, and infinite scroll. The asymmetric move: make every cross-sell a **labeled, finite, dismissible "next step"** that states *why* it's relevant ("Run the math from this article" → the tool), and add a build-time **dead-corner check** so a curated recommendation can never point at a retired surface. Helpfulness you can verify, never a funnel.

**Actions.**
1. Promote the `cross-surface-map.json --check` drift mode into `check-all.mjs` so every companion-kit corner is CI-verified against on-disk slugs. **(M × 5)**
2. Add a one-line "why this next" rationale to each knit card (e.g., "the sheet that captures what this article measures"), within voice canon. **(M × 4)**
3. Ensure smart-next / companion-kit blocks reach EN+ES parity for every surface that has them (tie to `check-locale-parity.mjs`). **(M × 4)**
4. Audit cross-tool URL-fragment handoffs (plate-cost → menu-engineering / margin-math) for round-trip integrity and document the contract. **(S × 3)**
5. Keep all recs finite and free of behavioral targeting; add an internal `/never/`-style note that cross-sell is editorial-only. **(S × 2)**

**Risks & honesty-gate notes.** Knit markers must never land inside attribute values — `check-article-graphics.mjs` rule 8 catches that corruption; any rationale copy added must not be pasted into `data-audio-alt`. Curated corners must point only at live slugs. No behavioral personalization (privacy + anti-dark-pattern canon).

**One proof metric.** Onward-journey rate: % of article/tool/sheet sessions that click at least one knit/companion-kit link to a *different* surface (target ≥35%), with zero dead-corner CI failures.

---

### 93 · Forms / Input UX

**Aspect & why it decides success.** Tools, sheets, and The Window are where the operator actually *does* something — and a form that's hard to finish on a phone mid-shift is a lost job. Forms are the conversion surface; the asymmetric edge is forms a tired person can finish one-handed without rage.

**Current-state audit (score: 8/10).** Input UX is well-engineered for mobile and accessibility. Tool inputs use the right mobile keyboards and hints: `inputmode="decimal"/"numeric"`, `enterkeyhint`, `autocomplete`, `aria-describedby`, dashed-border **empty states** (`.pc-empty`), paste-parse, OCR photo capture (`capture="environment"`), and a sample-loader (repo: `tools/plate-cost/index.html` lines 810–966). Sheets give a consistent action row — Print / Download CSV / Copy / Reset — plus an auth-gated "Save to Workbench" and a "runs in your browser" reassurance (repo: `_includes/sheet-shell.html` lines 93–119, 150–152). The Window form is a genuinely humane progressive composer: "Start anywhere — a line is enough" placeholder, onramp chips, a live char counter, a honeypot field, and an optional callback sub-form with *operator-shaped* time slots ("Tomorrow before we open (8–11am)," "Tomorrow in the slow hours") (repo: `window/index.html` lines 200–288, 334). Spam defense is privacy-respecting (Cloudflare Turnstile, lazy-gated by IntersectionObserver so most views never download it — `_includes/footer.html` lines 195–223). ES form errors are localized (`i18n.es.json` — `form.field_required`, `form.invalid_email`, `form.submit_fallback`). Gaps: no documented **inline per-field validation** pattern on tools (errors appear to be form-level); long calculators (plate-cost) have many controls with no visible progress/step affordance for a phone; no explicit "your work is safe / unsaved" guard on tools that deliberately don't persist.

**Benchmark gap (Typeform / Stripe Checkout).** Typeform (typeform.com, accessed Jan 2026) reduces cognitive load via one-question-at-a-time progressive disclosure; Stripe Checkout (stripe.com, accessed Jan 2026) sets the gold standard for real-time inline validation, correct mobile input types, and autofill. Muntin already matches Stripe on input types and autofill; it trails Typeform on chunking long tool forms and trails Stripe on inline field-level error timing.

**The Extend-Past move.** A giant maximizes form completions with pre-checked opt-ins and dark-pattern consent. The asymmetric move: keep the no-storage, no-PII default (the address bar stays empty until the operator explicitly clicks "Save & remind me to recost" — `tools/plate-cost/index.html` line 790), and add **progressive disclosure + inline validation** so the *honest* form is also the *easiest* form. The Window's callback slots ("before we open," "the slow hours") are the template — design every input around the shift clock.

**Actions.**
1. Add inline, polite (`aria-live`) field-level validation to the calculator tools, reusing the localized `form.*` strings. **(M × 4)**
2. Chunk long tool forms (plate-cost) into collapsible steps or a sticky "Calculate" affordance so a phone user always sees the action. **(M × 4)**
3. Add a lightweight, dismissible "unsaved — nothing is stored" hint on no-storage tools so the no-persistence default is never a surprise. **(S × 3)**
4. Confirm every required field has a programmatic label + error association across all 13 tools (audit; sheets template already does). **(M × 3)**
5. Extend the Window's shift-aware time-slot pattern to any future scheduling input. **(S × 2)**

**Risks & honesty-gate notes.** No storage may be added silently — the privacy promise ("close the tab and the form is empty") is a `/never/`-class claim; any persistence stays opt-in via URL fragment. Validation/error copy must come from the localized `form.*` keys, EN+ES. Turnstile must stay lazy-gated (perf + privacy).

**One proof metric.** Tool/form completion rate on mobile = sessions that reach a result/submit ÷ sessions that focus the first field, on viewports ≤720px (target ≥60%).

---

### 94 · Content-Design / Microcopy Lead

**Aspect & why it decides success.** Every label, empty state, and error is a micro-conversation with a stressed operator. Microcopy is where the brand's "calm, exact, manager-doing-the-math" voice either earns trust or reads like every other template. It's the cheapest, highest-leverage trust surface on the site.

**Current-state audit (score: 8/10).** Microcopy is governed by a real, binding contract: `/methods/#voice-contract` (repo: `methods/index.html` lines 487–522) sets POV-by-page-type (tools = second-person "your menu, your numbers"; library = Muntin Desk; trust pages = first-person Don), a **banned-words list** ("solutions, leverage, robust, journey, reach out, dive in, just, simply, easy" — lines 500–501), and a **locked one-to-one CTA canon** with EN+ES pairs ("Run my free audit" / *Audita mi sitio gratis*; "Email Don" / *Escríbele a Don*; "Save this" / *Guardar esto* — lines 507–513). The voice is consistently in-canon in the wild: "Start anywhere — a line is enough" (Window), "Numbers stay in your browser" (tools), "I send a short note when I publish something — four notes a quarter, no funnels" (footer newsletter, `footer.html` line 91), "Got a question? The Window is open." Empty/error states are bilingual (`i18n.es.json`: `search.empty` "Sin resultados para," `search.empty_hint`, `form.submit_fallback`). Gaps: the **CTA canon is narrow (5 verbs)** while the surface inventory is large — some buttons in the wild ("Run free audit" on the mobile-cta-bar vs canonical "Run my free audit") risk drift from the locked strings; there's **no single microcopy registry** (the canon lists CTAs but not the full empty-state/error library), so consistency depends on author memory; not every empty state is confirmed to have an ES twin.

**Benchmark gap (Shopify Polaris / Slack).** Shopify's Polaris content guidelines and Slack's voice-and-tone docs (polaris.shopify.com, slack.design, accessed Jan 2026) both maintain a *centralized content/microcopy library* — every error, empty state, and button string in one governed place. Muntin has the *contract* (arguably stricter and more honest than either) but not the *registry*, so it's strong on principle and thinner on systematic coverage.

**The Extend-Past move.** A giant's growth team writes urgency microcopy ("Only 2 left!", "Don't miss out"). The asymmetric move: a **governed microcopy registry** (`data/microcopy.json`, EN+ES) covering every CTA, empty state, error, and reassurance line — enforced by a CI check that flags any button/empty-state string not in the registry — so the calm, no-dark-patterns voice is *systematically* guaranteed, not just aspired to. Honesty as a lint rule.

**Actions.**
1. Create `data/microcopy.json` (EN+ES) extending the CTA canon into empty states, errors, reassurances, and button labels; cite `/methods/#voice-contract` as governing. **(M × 4)**
2. Add a `check-microcopy.mjs` to `check-all.mjs` flagging banned words site-wide and CTA strings that deviate from the locked canon (catches "Run free audit" vs "Run my free audit"). **(M × 5)**
3. Audit every empty state and error for an ES twin; close gaps via `i18n.es.json`. **(S × 4)**
4. Add empty-state copy to any tool/sheet/search surface lacking it, in voice ("Nothing here yet — paste a recipe to start"). **(S × 3)**
5. Reconcile the mobile-cta-bar and sticky CTAs to the exact canon strings. **(S × 2)**

**Risks & honesty-gate notes.** The banned-words list and CTA canon are binding — any registry must *encode* the canon, never relax it. No urgency/scarcity microcopy (anti-dark-pattern + `/never/`). All strings ship EN+ES (locale parity gate). Microcopy is not "claims," but reassurance lines that assert behavior (e.g., "nothing leaves your browser") must remain literally true.

**One proof metric.** Microcopy-canon coverage: % of site CTA + empty-state + error strings present in the governed registry and passing the canon lint (target 100%); proxy for trust, validated by zero banned-word CI failures.

---

*Cross-domain dependencies. (89 IA) + (90 Search): a human static sitemap and search both depend on the same build-time filesystem walk and the `site-counts.json` sentinels — build them from one source. (92 Wayfinding) + (94 Microcopy): the "why this next" knit rationale and the cross-sell labels must be drawn from the same governed microcopy registry, or the helpfulness-as-UX voice fractures across rails. (91 JTBD) feeds (89/92): the interview/inbound job clusters are the input that decides which journeys and companion-kit corners exist at all.*
