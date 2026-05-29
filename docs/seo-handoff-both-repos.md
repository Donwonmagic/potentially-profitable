# SEO Maximization Handoff — `muntin.digital` × Muntin Ledger (cross-repo)

> **Purpose.** Brief for a new Claude Code session that has **both repos** mounted:
> Repo A = `muntin.digital` (this content site) and Repo B = **Muntin Ledger** (the
> privacy-forward digital-ledger SaaS at `ledger.muntin.digital`, separate repo).
> Goal: build **AI-citation authority** on A and **route qualified traffic into paid
> Ledger trials** on B, with the two properties bound as one **entity** so AI engines
> (ChatGPT / Gemini / Perplexity / Google AI Overviews) cite Muntin Digital and name
> Muntin Ledger as the product.
>
> **How to use:** paste this as the kickoff message, then have the agent read the
> "Reference files" in §8 before editing. Treat §2 (Repo A) as **verified** — it comes
> from a full audit. Treat §3 (Repo B) as **unverified** — audit B first.

---

## 0. TL;DR for the next session

1. **Don't re-audit Repo A.** It's done — §2 is the result. A is already top-1% technical/AEO; the wins are funnel, entity, indexation hygiene, ES recovery — **not** plumbing.
2. **Audit Repo B first** (§3 checklist). We've never seen it. Everything for B is "discover, then do."
3. **The crux is cross-repo (§4):** entity association + GA4 cross-domain measurement + message-matched landing pages. Single-repo SEO on either side alone leaves the main value on the table.
4. **Respect Repo A's gates (§6).** `node scripts/check-all.mjs` must stay green (~90 checks). The **fabrication gate is absolute** — no invented numbers, cohorts, or restaurants; the bio is singular.
5. **Operator reality:** Don Goldstein, solo, **~a few hours/week**. Data on hand: **GSC + GA4/Plausible + GBP**, no paid SEO suite. Prefer **data-driven build/inject scripts** over manual edits so changes self-maintain.
6. **Chosen decisions so far:** primary goal = **AI-citation authority → Ledger trials**; Ledger CTA placement = **nav + end-of-article**; Ledger stays on its **subdomain** (compensate via entity + cross-linking).

---

## 1. The two properties

| | **Repo A — `muntin.digital`** | **Repo B — Muntin Ledger** |
|---|---|---|
| Role | TOFU/MOFU authority + acquisition engine | BOFU product / conversion |
| What | Static HTML restaurant web "library + studio" (no framework/CMS) | Privacy-forward **digital ledger service** (SaaS) |
| URL | `https://muntin.digital/` | `https://ledger.muntin.digital/` |
| Conversion | (none today) → should hand off to B | **Paid trial / checkout** (live) |
| Status | Mature, heavily gated, EN↔ES | Greenfield from A's view — no link/schema/page references it yet |

**Operator:** Don Goldstein — solo operator; full-time front-of-house manager at Tacombi (Bethesda). Studio is Silver Spring, MD, serving the DMV + nationwide. **Keep the bio singular** (a hard gate on A blocks "two restaurants" drift).

**The funnel in one line:** AI engine cites an A article → reader lands on A → contextual + nav CTA routes them to B → paid trial. The **privacy angle is the connective tissue**: A already has an InfoSec pillar, a `how-to-tell-if-a-restaurant-tool-is-safe` article, and a `/never/` trust page — Ledger's "privacy-forward" positioning is a credible, citation-worthy extension of that, not a bolt-on.

---

## 2. Repo A state (VERIFIED via full audit)

### 2.1 World-class already — do not touch
- **Core Web Vitals guards (fail-CI):** every `<img>` dimensioned (CLS); below-fold `loading="lazy" decoding="async"` (LCP); CSS preloaded+async-swapped; fonts preloaded; JS deferred to `requestIdleCallback`; SVGs dimensioned.
- **AEO scaffolding most sites never build:** `<aside class="tldr">` + `<aside class="key-takeaways">` in **every** article (fail-CI); H2 anchor IDs for AI deep-linking; ≤45-word "complete answer" lead paragraph per H2; machine-readable `data-audio-alt` (≥80 chars) on every figure; `llms.txt` + `llms-full.txt`; AI-crawler-allow `robots.txt` (GPTBot/ClaudeBot/PerplexityBot/Google-Extended allowed; CCBot/scrapers blocked).
- **Schema depth:** Article, AudioObject, BreadcrumbList, FAQPage (homepage), LocalBusiness, Person, Organization, CollectionPage, DefinedTerm (in-article).
- **Programmatic infra:** auto-generated `sitemap.xml` (hreflang + `<image:image>` + git-`lastmod`), programmatic hreflang (`stamp-hreflang.mjs`), full OG/Twitter, EN↔ES parity gates.
- **Content footprint:** 24 library articles, 8 blog posts, 149 glossary terms, 12 tools (+5 coming), 33 sheets. **8 pillars:** Speed/Mobile, Conversions/Reservations, Local SEO/Discovery, **Operations & Margin (9 articles)**, Trust/Reviews, Brand/Design, **InfoSec**, **AI Search & Citation**.
- **Internal linking:** glossary autolinks (~7/article, sentinel-bracketed), smart-next CTA (Read/Try/Note), topic hubs, "see also" — all idempotent, data-driven.

### 2.2 Gaps = the opportunity on A
| Gap | Why it matters | Fix surface |
|---|---|---|
| **No Ledger funnel at all** | Primary goal has no mechanism | `_includes/nav.html` + `_includes/footer.html` (mobile mirror), `data/post-end-cta.json`, `scripts/inject-smart-next-cta.mjs`, `index.html` schema |
| **Meta descriptions over-length** (up to 259 chars) | Truncated snippets → lost CTR on existing impressions | per-page `<head>`; add `scripts/check-meta-description-length.mjs` |
| **LocalBusiness missing `streetAddress`/`telephone`** | Weak local-pack/Maps; NAP inconsistency risk | `index.html` JSON-LD |
| **16 `/es/blog/` URLs** indexed after blog→library split | ES duplicate/competing signals | `_redirects`, `data/i18n-slug-map.json`, re-run `stamp-hreflang.mjs` + `build-sitemap.mjs` |
| **~24 ES articles** stripped of figures / sub-80-char narration | ES underperforms AEO (figures = #1 citation format) | `scripts/lib/translate.py`, `render-post-audio.mjs`, clear waivers in `check-article-graphics.mjs` |
| **`menu-design` hubs (50+ pages) orphaned** | No internal links in → wasted crawl/equity | `_includes/footer.html`, `/library/` hub |
| **Likely cannibalization** (Conversions=7, Operations=9) | Self-competition suppresses rankings | GSC Pages-per-query audit → consolidate/differentiate |
| **No A→B cross-linking / Ledger entity** | AI engines can't associate the product | §4.2 |

---

## 3. Repo B (Ledger) — AUDIT-THIS-FIRST checklist (UNVERIFIED)

We have **not** seen Repo B. Before any B-side work, establish:

- **Stack & rendering:** static / SSR / SPA? (Determines what's crawlable. SPAs need SSR or prerender for marketing pages.)
- **Indexable surface:** are there **marketing/landing pages** distinct from the authed app? Is the app shell `noindex`? Is `robots.txt` present and sane? Is there a `sitemap.xml`?
- **`<head>` baseline per landing page:** unique `<title>`, `<meta name="description">` (≤155), `<link rel="canonical">`, OG/Twitter, viewport, `lang`.
- **Schema present?** Need `SoftwareApplication`/`Product` + `Offer` (the paid trial) + `Organization`. Check for an existing Organization `@id`.
- **Analytics:** is a GA4 tag installed? **Same property as A or separate?** Is there a referral exclusion for `muntin.digital`? Is a **`ledger_trial_start`** (and purchase) event defined?
- **NAP/brand consistency:** does B name "Muntin Ledger" + "Muntin Digital" identically to A? Same Organization identity?
- **Reciprocal links:** does B link **back** to A anywhere (footer "From the Muntin Digital library", about, etc.)?
- **HTTPS/redirects:** canonical host (apex vs `www` vs subdomain), HSTS, no redirect chains.
- **Performance:** Core Web Vitals on landing pages (LCP/CLS/INP). SaaS marketing pages often regress here.
- **Trial UX for SEO:** is pricing/trial reachable without a wall? Can a landing page rank and convert, or is everything gated?

---

## 4. Cross-repo strategy (the heart of this handoff)

### 4.1 The funnel (A → B)
- **Placement (decided):** **nav + end-of-article.**
  - *Nav:* add a Ledger entry in `_includes/nav.html` (`.nav-links` and the `.mobile-menu` mirror). Verb must clear A's **CTA canon / button-vocabulary** gates — check `/methods/#voice-contract` for allowed button verbs before choosing copy.
  - *End-of-article:* route the **Operations & Margin + InfoSec feeders** via the existing CTA system (`data/post-end-cta.json` → consumed by the idempotent injectors). Best feeders: `third-party-delivery-economics`, `third-party-delivery-comparison`, `how-to-raise-restaurant-menu-prices-without-losing-reservations`, `loyalty-program-roi`, `service-charge-vs-tipping-model`, `toast-vs-square-vs-clover-for-restaurants`, `how-to-tell-if-a-restaurant-tool-is-safe` (privacy bridge); plus finance sheets/tools `margin-math`, `third-party-channel-pnl`, `daily-sales-recap`, `waste-log`.
- **Implementation note:** A's `inject-smart-next-cta.mjs` builds a 3-lane block (Read/Try/Note) and is **superseded by KnitRail** where populated. Decide: add a **Ledger lane** to smart-next/KnitRail, or add a distinct `ledger` field in `post-end-cta.json` and a dedicated injector. Either way it must be **idempotent** (both `inject-post-end-cta.mjs` and `inject-smart-next-cta.mjs` are `--check`-gated in `check-all.mjs`).

### 4.2 Entity SEO — make AI engines link the two (highest AI-citation leverage)
- **On A (`index.html`):** add a `SoftwareApplication` (or `Service`) node:
  ```json
  {
    "@type": "SoftwareApplication",
    "@id": "https://ledger.muntin.digital/#app",
    "name": "Muntin Ledger",
    "applicationCategory": "FinanceApplication",
    "url": "https://ledger.muntin.digital/",
    "provider": { "@id": "https://muntin.digital/#business" },
    "offers": { "@type": "Offer", "category": "free-trial" }
  }
  ```
  Add `sameAs` on the Organization → the Ledger URL (+ real external listings as they exist: Crunchbase, Product Hunt, G2, LinkedIn — **only real URLs**, the fabrication gate blocks invented ones).
- **On B:** mirror the **same Organization `@id`** (`https://muntin.digital/#business`) as `publisher`/`provider`; add `isPartOf` / `sameAs` back to `muntin.digital`. Use identical strings "Muntin Ledger" and "Muntin Digital" everywhere.
- **Off-page entity building (light-touch):** consistent NAP across GBP + both sites + any directory listings; a Crunchbase/Product Hunt presence for "Muntin Ledger"; this is what teaches LLM knowledge graphs the A↔B relationship.

### 4.3 Cross-domain measurement (GA4) — get attribution right
- **Recommended: one GA4 property, both domains.** Add `muntin.digital` **and** `ledger.muntin.digital` to the data stream's **Configure your domains** list (enables the cross-domain linker), and add a **referral exclusion** for each domain on the other.
- **Critical nuance:** with cross-domain measurement enabled, **do NOT put UTMs on internal A→B links** — UTMs would re-attribute the session as `muntin.digital / referral` and **destroy the AI-referral → trial attribution** you most want to prove. Instead:
  - Fire a **`ledger_route_click`** event on A when the CTA is clicked (event params: source page slug, placement = nav|article).
  - Define **`ledger_trial_start`** (and purchase) as **key events** on B.
  - The linker preserves the original source (e.g., `chatgpt.com` / `perplexity.ai` referral or organic) **through to the trial** — so you can report "AI-referral sessions → trials."
- **Only use UTMs** if A and B end up on **separate** GA4 properties (then cross-domain isn't possible and UTMs are the fallback): `?utm_source=muntin_digital&utm_medium=content&utm_campaign=ledger_route&utm_content=<slug>`.
- **GSC:** verify `ledger.muntin.digital` as its own property **and** add a **Domain property** for `muntin.digital` (covers apex + all subdomains in one view).
- **Funnel math (illustrative placeholders — replace with 30 days of real data):** with route-click rate $r$ and trial-start rate $c$, monthly trials $= V \cdot r \cdot c$, so required feeder sessions $V = \dfrac{N}{r\,c}$ for a target $N$ trials. E.g. $r=0.04,\ c=0.10,\ N=20 \Rightarrow V=5{,}000$/mo. *(These numbers are illustrative only — not a claim about the business.)*

### 4.4 Subdomain authority (flag, not a blocker)
A subdomain passes ranking signals less cleanly than a subfolder (`muntin.digital/ledger/`) would. Given B is a separate repo/app, the subdomain is defensible — **compensate** with: heavy **contextual** A→B links (not just nav), the shared-entity schema above, reciprocal B→A links, and a **Domain-level GSC property**. If a reverse-proxy at `/ledger/` ever becomes feasible, it would consolidate signals — revisit then. **No action required unless Don wants to reconsider hosting.**

### 4.5 Content bridge (feeds both authority and the funnel)
Ship on A a cornerstone library article (Muntin Desk byline), e.g. *"Privacy-forward restaurant bookkeeping: what a digital ledger should never do with your numbers,"* wired to InfoSec + Operations pillars, linking `how-to-tell-if-a-restaurant-tool-is-safe` and `/never/`, and routing to Ledger. Full AEO structure (TL;DR + key-takeaways, anchored H2s, ≥2 distinct `viz-*` figures). On B, build a **message-matched landing page** for that intent. Every stat must be sourced or labeled illustrative (§6).

---

## 5. Concrete task lists

### Repo A — Month 1 (approved roadmap)
1. **Ledger funnel + measurement hooks** — nav + mobile-menu entry; route feeder articles/sheets via `post-end-cta.json` + injector; add `ledger_route_click` event (mind `check-analytics-vocabulary.mjs` + `check-event-prop-cardinality.mjs`). Run the writer, commit the stamped output (idempotency gates).
2. **Meta-description guard + trims** — add `scripts/check-meta-description-length.mjs` (≤155; warn→fail once clean); wire into `check-all.mjs`; trim top-impression offenders (use GSC Pages by impressions).
3. **`/es/blog/` duplicate cleanup** — classify each of 16; 301 the deprecated mirrors via `_redirects`; fix self-canonical/hreflang on the keepers; update `i18n-slug-map.json`; re-run `stamp-hreflang.mjs` + `build-sitemap.mjs`; confirm `check-hreflang-orphans` + `check-locale-parity` green.
4. **LocalBusiness NAP + Ledger entity schema** — in `index.html`: add `address` (use **Silver Spring / MD / US** locality-level for a service-area business; **do not invent** a street/ZIP/phone — get real values from Don or omit), and the `SoftwareApplication` node from §4.2.

### Repo B — Ledger (after the §3 audit)
1. Fix `<head>` baseline on all indexable landing pages (unique title/desc/canonical/OG).
2. Add `SoftwareApplication`/`Product` + `Offer` + `Organization` (mirrored `@id`) + `sameAs` back to A (§4.2).
3. Ensure crawlable, **message-matched** marketing/landing pages for the feeder intents; `noindex` the authed app shell.
4. `robots.txt` + `sitemap.xml`; submit B as its own GSC property.
5. GA4: same property + configured domains + referral exclusion + cross-domain linker; define `ledger_trial_start` + purchase key events (§4.3).
6. Reciprocal B→A links (footer/about) for entity reinforcement.
7. Core Web Vitals pass on landing pages (LCP/CLS/INP).

---

## 6. Guardrails — Repo A (must respect; B's equivalents TBD by next session)
- **`node scripts/check-all.mjs` must stay green** (~90 checks). Many injectors are **idempotency-gated** in `--check` mode: after editing a script or its data, **run the writer and commit the stamped files**, or the `(idem)` check fails.
- **Fabrication gate is absolute** (`check-fabrications.mjs`, scans HTML/JSON/MD/MJS — *including this doc*): no invented metrics, cohort sizes, percentages, restaurants, or **deep-link URLs**. Register claims in `data/sourced-claims.json`, cite via `<details class="cite">`, or label illustrative. Bio stays **singular** (Tacombi Bethesda).
- **Voice canons:** library = **The Muntin Desk** byline; blog = **Don Goldstein**. See `/methods/#voice-contract`, `docs/voice-canon-*.md`.
- **CTA/analytics gates:** `check-cta-canon.mjs --strict`, `check-button-vocabulary.mjs`, `check-analytics-vocabulary.mjs`, `check-event-prop-cardinality.mjs`, `check-intent-param-targets.mjs` — a new CTA + event must satisfy all.
- **Don't rename slugs** (breaks deep links + AI-Overview rotation). Don't break CWV/AEO scaffolding. **`package.json` is gitignored** — maintain your own for sharp/Playwright.
- **Branch:** development happens on `claude/intelligent-meitner-Stp1X` for this repo.

---

## 7. Measurement & KPIs
- **GSC (both properties):** impressions, avg position, CTR by page/query; **striking-distance count** (positions 5–15 = cheapest wins); Coverage (no dup ES pairs; menu-design indexed; B indexed).
- **GA4/Plausible:** organic + **AI-referral sessions** (segment on referrer hosts `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`), `ledger_route_click`, `ledger_trial_start`, purchases; derive $r$, $c$.
- **GBP:** profile views, search vs. maps, website clicks, calls, directions.
- **AI-citation share (no paid tool):** maintain a 20–30 prompt set; monthly, run each in ChatGPT/Gemini/Perplexity/Google AI Overviews; log cited?/which URL; citation share = cited ÷ total per engine. Log into A's `data/kpis.json` / `experiments.json`.

---

## 8. Reference files — Repo A
- `CLAUDE.md` — project memory, gates, conventions (read first).
- `scripts/check-all.mjs` — the CI orchestrator (~90 checks; shows every gate + mode).
- `scripts/check-fabrications.mjs` + `data/sourced-claims.json` + `docs/fact-check.md` — the fact gate.
- `scripts/inject-smart-next-cta.mjs`, `scripts/inject-knit-rail.mjs`, `data/post-end-cta.json` — end-of-article CTA system (the funnel surface).
- `_includes/nav.html`, `_includes/footer.html` — nav + mobile mirror (the Ledger nav entry).
- `index.html` — homepage JSON-LD (LocalBusiness/Organization/Person/FAQPage → add Ledger entity + NAP).
- `scripts/build-sitemap.mjs`, `scripts/stamp-hreflang.mjs`, `_redirects`, `data/i18n-slug-map.json` — indexation + i18n.
- `scripts/build-library.mjs` — topic hubs, glossary autolinks, see-also (templated schema rollouts go here).
- `data/topics.json`, `data/library-tags.json` — pillar/tag map.
- `scripts/check-article-graphics.mjs` (`HISTORICAL_WAIVERS`) — the ES figure debt list.
- `docs/voice-canon-library.md`, `docs/voice-canon-blog.md` — voice.

---

## 9. Open decisions for Don
1. **Subdomain vs. subfolder** for Ledger — default keep subdomain (no action); revisit only if reverse-proxy becomes attractive.
2. **NAP for LocalBusiness** — provide real street/ZIP/phone, or keep service-area (locality-only) to preserve privacy? (Privacy-only is consistent with the brand; just confirm.)
3. **Ledger CTA copy** — the exact button verb (must pass A's CTA-canon/button-vocabulary gates).
4. **Commit this handoff?** It currently lives at `docs/seo-handoff-both-repos.md` on branch `claude/intelligent-meitner-Stp1X`, **uncommitted**. Commit + push so it travels with Repo A, or keep it out of the tree.
