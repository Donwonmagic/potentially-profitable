# THE HUNDRED — A 100-Specialist Positioning Refresh of muntin.digital

*A positioning-council strategy memo. Authored 2026-06-16. Not web-routable; lives in
`docs/editorial/` as an editorial-OS artifact.*

---

## How to read this

This document is the output of a 100-specialist "positioning council" convened to refresh
`muntin.digital` and decisively improve the industry positioning of **Muntin Digital** (the
company), **Muntin Ledger** (the product, GA 2026-11-13), and the free cost-intelligence tools.
The 100 specialists are organized into 14 domain batches (I–XIV); each produced a one-page brief in
a fixed contract (aspect → repo-grounded audit + 0–10 score → benchmark gap → the *extend-past*
asymmetric move → 3–7 actions with Effort S/M/L × Impact 1–5 → risks & honesty notes → one proof
metric).

It is written inverted-pyramid:
- **Part 1 — Executive Memo** (3-minute read): the problem, the thesis, the five biggest moves.
- **Part 2 — Positioning Council Synthesis**: clusters, conflict rules, ranked actions, the
  top-10-this-week, the 30/60/90 roadmap, the 12-month arc, the DO-NOT-DO list, the proof dashboard.
- **Part 3 — The 100 Briefs**: every specialist, by domain.

**Scope.** This is a *strategy* deliverable. Nothing here has been shipped to the live site;
implementing any recommendation is a separate, explicitly-approved effort. Every recommendation was
written to be shippable on the static/Cloudflare architecture and to survive `check-all`.

**Grounding & honesty convention.** The repository is the primary ground for every current-state
audit and score; file paths are cited inline. External benchmark facts (what Toast, Google, Apple,
Netflix, Duolingo, etc. do) are labeled with a source + access date or marked *analyst assessment /
illustrative*. This file lives in `docs/editorial/`, which the fact gate, banned-words gate, and
studio-voice gate all skip by design — but being gate-skipped is **not** a license to fabricate.
Where the original mission brief carried a rounded figure, this council uses the **real repo value**
and flags the discrepancy.

### Repo-fact ledger (canonical numbers — use these, not rounded prose)
- **Glossary: 150 terms** (`data/site-counts.json`) — *not* "280+".
- **Articles: 47 total = 36 library + 11 blog** (canonical, `site-counts.json`); ES trails on both.
- **Tools: 13 live, 5 coming** (`data/tools.json`). **Sheets: ~46 live + a 15-item course pack**
  (count is ungated and inconsistent — resolve to one honest gated number).
- **Cost Index: 16 verified ingredients, 13 public pages**, refreshed **daily**
  (`.github/workflows/cost-index-refresh.yml`, `cron: "0 13 * * *"`) from USDA-LMR/AMS, BLS, FRED,
  EIA. Per-ingredient `series.json`/`series.csv` **already exist** and are wired into JSON-LD
  `distribution`; `cost-index-history.json` (431 KB) is unused.
- **`check-all.mjs` = 183 entries** (≈85 distinct `check-*.mjs` + ~87 idempotency re-runs + ~10
  self-tests), **no fail-fast**. 289 scripts total. (CLAUDE.md's "fails fast" is inaccurate.)
- **JSON-LD already deployed broadly:** FAQPage in ~130 article files, SpeakableSpecification in 83.
- **Operator bio is singular:** Don Goldstein, full-time FOH manager at Tacombi, Bethesda.
- **The ES pipeline uses machine translation** (`scripts/lib/translate.py` → Cloudflare Workers AI
  Llama 3.3 70B, Google Translate fallback). Honest framing is **"machine-drafted,
  human-transcreated, fact-gated"** — never "no MT." fr/it/pt/zh are *scaffolded* (5 audio tracks
  blessed `rendered`), not "live in four languages."

---

# PART 1 — EXECUTIVE POSITIONING MEMO
*Read this in three minutes.*

**The problem.** Daily traffic is faltering, the weekly publishing heartbeat has stalled, and the
AEO/SEO upside is untapped — while the company is mid-migration from "restaurant web studio" to a
cost-intelligence product company, and that migration is visibly unfinished (the homepage, trust
spine, and even `CLAUDE.md` still carry studio-era language). Meanwhile the asset base is genuinely
strong: a live, primary-source Cost Index; 13 private no-signup tools; 150 glossary terms; a
rigorous trust spine (`/methods/`, `/never/`, `/receipts/`, `/security/`); true EN↔ES depth; and an
automated honesty gate. The gap is **positioning and exposure, not substance.**

**The thesis (one sentence).** *Muntin Digital is the honest, operator-built cost-intelligence
company for independent restaurants — a primary-source price index, free private tools, and a
privacy-first ledger, from someone who actually runs the floor — and it wins precisely where Toast,
DoorDash, Yelp, Google, and QuickBooks are structurally conflicted: it takes no rake, sets no
tracking pixel, invents no number, and is therefore the source operators and AI answer engines trust
to cite.*

Working tagline (lock under the H1): **"The restaurant numbers company that doesn't rent your guests
back to you."**

**Why now.** AI answer engines are re-intermediating discovery; they reward exactly what muntin
already is — a fact-gated, primary-source, densely-linked, citable source — and punish thin,
surveillance-funded content. The window to be *the* cited authority on restaurant costs is open and
short.

**The five biggest moves** (each a play a trillion-dollar platform structurally cannot run):
1. **Make honesty provably the product.** Close the live fabrication leak, extend the fact gate to
   every surface, and publish the sourced-claims ledger as a public, machine-verifiable
   `/claims.json`. *No incumbent maintains a public claim graph; a rake-funded platform can't.*
2. **Turn the Cost Index into the cited reference price.** Name the **"Muntin Restaurant Basket"**
   (the Case-Shiller of restaurant ingredients), surface its daily freshness, and expose the
   already-built CSV/JSON + a no-track embed. *A platform won't publish honest, free, citable prices
   — transparency is adverse to its revenue.*
3. **Finish the repositioning and own a category.** Coin and define **"Restaurant Cost
   Intelligence," lock the one-liner, and scrub studio-era language from the trust spine and
   CLAUDE.md.** *A category you define is one rivals must react to.*
4. **Restart the heartbeat as a fact-gated weekly.** Revive the Cost-Index-anchored dispatch ("The
   Muntin Read"), structured to be quoted verbatim by answer engines and repurposed to ≥4 surfaces.
   *A working FOH manager's sourced weekly is content a SaaS blog cannot credibly fake.*
5. **Give Muntin Ledger a real on-site presence.** Ship a `/ledger/` problem→wedge page
   (privacy-first, no rake, GA 2026-11-13 visible) and make "See pricing" a first-class CTA. *Today
   it's one sentence carrying a whole product (3/10).*

**Start this week:** see Part 2.5 — ten gate-clean, static-shippable actions, led by closing the
honesty leak and a five-defect correctness sweep.

**The through-line:** every constraint that looks like a limitation — no rake, no pixel, no
fabrication, a singular operator, machine-assisted-but-fact-gated translation — is, when stated
honestly, the moat. Honesty is the positioning. Do not trade it for lift.

---

# PART 2 — POSITIONING COUNCIL SYNTHESIS

## 2.1 The positioning thesis
Restated for the record: **Muntin is the honest, operator-built cost-intelligence company for
independent restaurants — the primary-source price index, the free private tools, and the
privacy-first ledger — winning where the giants are structurally conflicted (no rake, no pixel, no
invented number), and therefore the source both operators and AI answer engines cite.**

Everything below ladders up to that sentence.

## 2.2 The eight clusters (deduped across all 14 domains)
The ~500 specialist actions collapse into eight reinforcing clusters.

- **A · Finish the company repositioning (services → cost-intelligence).** Coin/define "Restaurant
  Cost Intelligence" (01), lock the one-liner under the H1 (02), reframe `/never/` as "guarantees a
  platform can't make" (07), and scrub studio-era language ("web studio," "two builds at a time,"
  "lead-to-call," "services/audit") from `/methods/`, `/never/`#5, `/receipts/`, and `CLAUDE.md`
  (01, 69). *Foundational — most other moves assume it.*
- **B · Make the honesty gate provably the product.** Fix the live "56% margin" fabrication in ~8
  recirculation cards and extend `check-fabrications.mjs` to card/abstract/derived surfaces (28, 31,
  32); publish `/claims.json` + a human `/claims/` page from `sourced-claims.json` (21); re-render
  the 3 stale "two-restaurants" audio tracks and promote audio numeric-parity to fail-CI (24).
- **C · Expose the Cost Index as the cited reference price (the moat).** Name + freeze the "Muntin
  Restaurant Basket" (41); surface daily freshness (44); expose existing CSV/JSON + a no-track embed
  + aggregate export (45); publish a machine-readable provenance registry (42); one direction-color
  law for charts (43); seed a "Muntin Cost Index" Wikidata entity + Dataset discoverability (11, 10).
- **D · Make every page answer-engine-citable + restart the heartbeat.** Self-contained liftable
  answer span under each question-H2 (17, 15); per-claim micro-citations on takeaways (18);
  conversational-query FAQ harvest (22); restart the fact-gated weekly "Muntin Read" anchored to the
  Cost Index (25, 27, 48) and repurpose to ≥4 surfaces with the gate extended to derived copy (32).
  *Reality check: llms.txt is largely ignored by major engines (Mueller/Illyés, 2025) — the win is
  corroboration + freshness + citable structure + organic fundamentals, not the manifest (19).*
- **E · Give Muntin Ledger a real on-site presence.** Ship `/ledger/` problem→wedge page
  (deterministic-not-AI, no rake, GA date visible) (33); make "See pricing" a first-class canon CTA
  and link — never duplicate — subdomain pricing (36); value-first founding handoff only after a
  real tool result (34); transparent cohort of consented operators (40).
- **F · Tighten the analytics/measurement honesty loop.** Fix the KPI 5-vs-7 drift between
  `data/kpis.json` and `/receipts/` (83); rename the unregistered founding-form `Waitlist Signup`
  event to the registered name (84); ship the one idle A/B test and publish the result (87); model
  the funnel on bucketed first-party events, no identity stitch (86).
- **G · Ship craft & integrity gates a solo founder can sustain.** Generate a `/system/` design
  reference from tokens + viz registry (62); add gates: retired-warm color scanner (63), OG-drift
  (67), icon parity (68), reduced-motion (65), tap-targets (60), a11y conformance ledger (56), JS
  budget (53), chunkability (20), crawl-coherence (09), snippet-shape (15), microcopy (94), cadence
  (25); ship a public `/status/` page (97) and the agent-operating contract ADR-005 (99). Quick
  defect sweep: "Blog" breadcrumb, `ai-overview` JSON-LD bleed, `site.webmanifest` colors, AAA link
  color, named-but-unshipped viz-* families.
- **H · Reach the Spanish-first workforce with honest parity.** Reframe ES as "machine-drafted,
  human-transcreated, fact-gated" (77); add a human-blessing review ledger `data/i18n-review.json`
  (77); normalize 37 `es_ES`→`es_US` (76); wire the dormant parity/coverage gates into `check-all`
  (81); ES-native keyword pass on a near-empty SERP (78); write `docs/voice-canon-es.md` (79).

## 2.3 Conflict resolutions — the rules (honesty wins, every time)
1. **Growth vs honesty →** any tactic needing a fabricated number, fake urgency/scarcity, fake
   testimonial, or a tracking pixel is rejected; rebuild it as a pull-based / trust-based play
   (e.g., retention = an opt-in weekly ritual + `.ics`/RSS, never a streak-trap or pixel).
2. **"Native ES / no MT" vs the pipeline →** never claim "no machine translation" (it uses Llama
   3.3 70B); claim **"machine-drafted, human-transcreated, fact-gated."** Honesty about the method
   *is* the trust signal.
3. **Offline resilience vs privacy promises →** a caching service worker contradicts the published
   "we don't pre-cache / no storage" claims; if pursued, rewrite those claims in the *same* change
   and scope caching narrowly — never silently contradict a promise.
4. **AEO ambition vs reality →** don't over-claim llms.txt as a traffic driver; invest in
   corroboration, freshness, citable structure, and organic fundamentals; reposition llms.txt as the
   agent/MCP integration surface.
5. **"All green" vs reality →** `check-all` has 183 entries, no fail-fast, and some gates
   self-downgrade to warn-only; never claim a passing count you haven't run; make warn-only gates
   blocking where the promise demands it.
6. **Social proof vs zero-fabrication →** never manufacture testimonials/ratings/cohorts; proof is
   **"receipts, not reviews"** plus an honest, non-incentivized GBP review flywheel.

## 2.4 Ranked actions (Impact×Reach ÷ Effort) — ★ = asymmetric win a giant can't copy
Top tier (the full action set lives in the per-domain briefs in Part 3):

| # | Action | Domain | Effort | Impact | ★ |
|---|--------|--------|:------:|:------:|:--:|
| 1 | Close the live "56% margin" fabrication in ~8 cards + extend fact gate to card/abstract/derived surfaces | IV/28,31,32 | S–M | 5 | ★ |
| 2 | Lock positioning one-liner under H1 + coin "Restaurant Cost Intelligence" + scrub studio-era language (spine + CLAUDE.md) | I/01,02 · X/69 | S–M | 5 | ★ |
| 3 | Name + surface the "Muntin Restaurant Basket"; expose existing CSV/JSON + daily-freshness line | VI/41,44,45 | S–M | 5 | ★ |
| 4 | Publish `/claims.json` (+ human `/claims/`) — the public, machine-verifiable trust ledger | III/21 | M | 5 | ★ |
| 5 | Liftable answer span under each question-H2 on the top-10 articles + snippet-shape discipline | III/17 · II/15 | S–M | 5 | ★ |
| 6 | Ship `/ledger/` problem→wedge page + first-class "See pricing" CTA (link, don't duplicate) | V/33,36 | M–L | 5 | — |
| 7 | Correctness sweep: "Blog" breadcrumb, `ai-overview` JSON-LD bleed, `site.webmanifest` colors, AAA link color | II/09,10 · IX/63 · VIII/58 | S | 4 | — |
| 8 | Fix analytics honesty: KPI 5-vs-7 drift, rename `Waitlist Signup` event, ship the idle A/B test | XII/83,84,87 | S | 4 | ★ |
| 9 | Restart the fact-gated weekly "Muntin Read" anchored to the Cost Index | IV/25,27 · VI/48 | M | 5 | ★ |
| 10 | ES honest reframe ("machine-drafted, human-transcreated, fact-gated") + normalize `es_ES`→`es_US` | XI/76,77 | S–M | 4 | ★ |
| 11 | Reframe `/never/` as "guarantees a platform can't make," each tied to its enforcing mechanism | I/07 | M | 5 | ★ |
| 12 | Honest comparison pages (Owner.com/DoorDash/Toast) that name muntin's own weaknesses | I/05 | L | 5 | ★ |
| 13 | Seed "Muntin Cost Index" + org as Wikidata entities; add Dataset Search discoverability | II/11,10 | M | 5 | ★ |
| 14 | Generate a `/system/` design reference page from tokens + viz registry; add craft gates | IX/62 | L | 4 | ★ |
| 15 | Ship a public `/status/` page + wire dormant parity/coverage gates into `check-all` | XIV/97 · XI/81 | M–L | 4 | ★ |

## 2.5 Top-10 actions to start THIS WEEK
Each is static/Cloudflare-shippable, gate-clean, and (mostly) S/M effort. (Recommendations — not yet
shipped.)

1. **Close the honesty leak.** Rewrite the "Kept margin climbed 56% by week four" line in the ~8
   recirculation cards (`blog/index.html:746`, two EN + two ES learn-topic hubs, three library
   smart-next cards) to the registered illustrative framing, and extend `check-fabrications.mjs` to
   scan card/abstract surfaces. *(The fact gate is the brand; a live leak is existential.)*
2. **Five-defect correctness sweep.** Fix the "Blog" breadcrumb on
   `/library/restaurant-schema-markup-guide/`; the `ai-overview` JSON-LD name/description bleed
   (enforce name == H1); the off-spine `site.webmanifest` colors; and promote the AAA link color
   `#1F3A93` (9.39:1) on the reading path (current `#2A50C8` is 6.36:1, misses AAA 7:1).
3. **Lock the positioning.** Put the one-liner under the homepage H1, introduce the "Restaurant Cost
   Intelligence" category framing, and remove studio-era phrasing from `/methods/`, `/never/`#5,
   `/receipts/`, and `CLAUDE.md`.
4. **Surface the Cost Index moat.** Add a "last refreshed / oldest read" freshness line (from
   `cost-index-health.json`) and expose the already-built per-ingredient CSV/JSON download buttons.
5. **Fix analytics honesty.** Reconcile the KPI count (5 in `data/kpis.json` vs 7 on `/receipts/`);
   rename the founding-form event to the registered `Newsletter Signup`; flip the idle
   `window-cta-copy` A/B test to running with a `startedAt`.
6. **Name the Basket.** Give the composite index a citable name — the **"Muntin Restaurant Basket"**
   — on the Cost Index hub, with a stable permalink, reading from `cost-basket-weights.json`.
7. **Make the top-10 articles citable.** Add a self-contained, hedge-free answer span immediately
   under each question-style H2 on the ten highest-traffic articles.
8. **ES honesty pass.** Replace any "no machine translation" framing with "machine-drafted,
   human-transcreated, fact-gated"; normalize the 37 `og:locale=es_ES` tags to `es_US`.
9. **Publish `/claims.json`.** Emit a sanitized, PII-clean machine-readable claim graph from
   `data/sourced-claims.json` — the verifiable trust asset no competitor maintains.
10. **Re-render the 3 stale audio tracks** carrying the retired "two-restaurants" bio and clear
    their waivers, so the six-language narration is fully fact-clean.

## 2.6 30 / 60 / 90-day roadmap
- **Days 0–30 — Honesty & foundation.** Top-10 above: close the fabrication leak + extend the gate;
  correctness sweep; lock positioning + scrub studio-era language; fix KPI/event drift + ship the
  idle A/B; surface Cost Index freshness + CSV/JSON; re-render stale audio. *Outcome: the site is
  provably honest and the company identity is coherent.*
- **Days 31–60 — The citable moat.** Ship the "Muntin Restaurant Basket" hub + provenance registry +
  no-track embed; publish `/claims.json` + `/claims/`; liftable-answer pass on the top-10 +
  snippet-shape gate; ship the `/ledger/` wedge page + "See pricing" CTA; restart the weekly "Muntin
  Read"; ES honest reframe + `es_US` normalize + wire parity gates. *Outcome: muntin is structured to
  be cited and the heartbeat is beating again.*
- **Days 61–90 — Compounding & craft.** Wikidata entity + Dataset Search; topical pillar map +
  internal-link densification; conversational-query FAQ harvest; `/system/` page + `/status/` page +
  the new craft gates; ES-native keyword pass + `voice-canon-es.md`; tool-to-tool smart-next engine;
  honest comparison pages; founding-cohort program. *Outcome: authority compounds and quality is
  self-enforcing.*

## 2.7 12-month positioning arc
- **Q1 (months 1–3) — "The honest cost-intelligence source."** Honest foundation + citable moat
  (the 30/60/90 above).
- **Q2 (4–6) — "The cited reference for restaurant costs."** Weekly dispatch compounding; topical
  pillars complete; an honest AI-citation monitoring loop; embed distribution across the restaurant
  web; ES-first content depth.
- **Q3 (7–9) — "The privacy-first ledger operators trust."** Muntin Ledger GA approaches
  (2026-11-13); a founding cohort of real consented operators; conversion via trust + utility; the
  most honest pricing page in restaurant tech.
- **Q4 (10–12) — "The category-defining honest restaurant-numbers company."** "Restaurant Cost
  Intelligence" recognized as an entity; a gated multilingual roadmap (fr/it/pt/zh); status +
  changelog + agent-ops maturity signalling reliability; the automated honesty gate established as a
  public brand asset.

## 2.8 DO-NOT-DO list (tempting moves that breach a gate, canon, or trust)
1. **Don't claim "no machine translation" / "human-only" ES** — the pipeline uses Llama 3.3 70B. Say
   "machine-drafted, human-transcreated, fact-gated."
2. **Don't let any fabricated/illustrative number leak unlabeled** into cards, abstracts,
   smart-next, or derived (email/social/audio) copy — extend the gate to every surface.
3. **Don't add tracking, retargeting pixels, session replay, keystroke logging, or cross-site
   attribution.** Measure only with bucketed first-party events.
4. **Don't manufacture testimonials, ratings, cohorts, urgency, or scarcity.** Proof = receipts.
5. **Don't duplicate Ledger pricing/tiers** on muntin.digital — link to `ledger.muntin.digital`
   (the `/never/` promise breaks on first divergence).
6. **Don't add a caching service worker** without rewriting the "we don't pre-cache / no storage"
   claims in the same change.
7. **Don't rename slugs after publish;** rewrite in place + bump `dateModified`.
8. **Don't over-claim llms.txt** as an AI-traffic driver, and don't claim a "183/183 green" you
   haven't actually run.
9. **Don't invent new CTA verbs** (the canon is locked to five) or use banned marketing words on
   marketing surfaces.
10. **Don't frame Don as running more than one restaurant** (singular bio, CI-enforced).
11. **Don't reintroduce fake city/location pages** for local SEO — they were deleted; that's a proof
    point, not a gap.
12. **Don't repeat "280+ glossary terms"** — it is 150.

## 2.9 Proof-metric dashboard (the numbers that confirm the refresh worked)
- **Honesty:** zero `check-fabrications` hits across bodies + cards + abstracts + audio; % of
  published numeric claims resolving to a dated primary source via `/claims.json` → 100%.
- **Discovery/AEO:** count of distinct prompts where ≥1 answer engine cites a `muntin.digital` URL
  (monthly hand-run probe log); organic + AI-referral sessions/week (target 600, `data/kpis.json`).
- **Moat:** external domains embedding or citing the Muntin Restaurant Basket per quarter; % of
  Cost Index days/quarter with a committed read (≥90%).
- **Product:** `/ledger/` → "See pricing" outbound CTR; verified founding signups by GA.
- **Cadence:** weeks-since-last-dispatch ≤ 7 sustained for 8+ weeks, CI green.
- **Craft/reliability:** `check-all` blocking on a real PR workflow; `/status/` auto-refreshed;
  reading-path contrast 100% ≥ 7:1.
- **Parity:** EN→ES paired-set drift = 0 under a blocking `--check`.

---

# PART 3 — THE 100 SPECIALIST BRIEFS

The fourteen domain batches follow, in order (I–XIV). Each brief carries its repo-grounded
current-state audit and 0–10 score, the named benchmark, the asymmetric *extend-past* move, its
actions with Effort × Impact, honesty-gate notes, and a single proof metric.



## Domain I — Positioning & Brand Strategy

*Positioning Council batch, specialists 01–08. Strategy only — no live-site edits proposed here ship without passing `scripts/check-all.mjs` (~113 checks) and the honesty gate. Every external figure is dated + sourced or labeled "analyst assessment." Repo facts cite specific surfaces. Today: 2026-06-16.*

**Cross-cutting audit finding (referenced by several briefs below):** the site is mid-migration from a *services-era* identity ("web studio," "two builds at a time," "six polishes and one drop-in per week," services/* offer pages) to a *company/product-era* identity (Cost Index + free tools + Muntin Ledger). The migration is ~80% done on the front door (`index.html`, `studio/index.html`) but **stale services language survives on the trust spine** — `/methods/` §"Three classes of claim" still says *"Two builds active at a time"*; `/never/` #5 is *"I will never take work I can't ship in the quoted window"* + the `#free-forever` block's *"six polishes and one drop-in per week"*; `/receipts/` lists *"Two builds at a time"*, *"Lead-to-call rate"*, and *"3 new productized offer pages at services/audit…"*. This is not a fabrication-gate failure, but it is a **positioning-coherence** failure that undercuts the asymmetric thesis. Fixing it is the connective tissue across briefs 01, 02, 05, 06, 07.

---

### 01 · Category Designer

**Aspect & why it decides success.** A company that doesn't name its category gets sorted into someone else's — and "restaurant web studio" files Muntin next to Wix templaters and freelancers, where price is the only axis and the giant wins. Category design (Stripe = "payments infrastructure," Drift = "conversational marketing") is the one move a one-person shop can make that a giant *structurally won't*: incumbents are incentivized to keep the category vague so they can sell everything into it.

**Current-state audit — score 6/10.** The repo has *already abandoned* "web studio" on the front door: homepage meta is "Restaurant cost intelligence & the free operator library" (`index.html` line 8), the H1 is "Know what every plate costs before the week eats the margin" (line 433–435), and `studio/index.html` H1 is "The company where the numbers are checked before they ship" (line 447–449). Strong raw material. But there is **no coined category noun** — the site describes *what it makes* (Cost Index, tools, Ledger) without naming *the space it owns*. CLAUDE.md itself still opens "a one-person restaurant web studio." The pieces of a category exist (sourced data + owner-operator + privacy) with no label to make rivals react.

**Benchmark gap.** Stripe didn't sell "a payment form"; it named "payments infrastructure for the internet" and forced competitors to position against it (analyst assessment). Muntin trails Stripe on *naming discipline* but leads every restaurant-tech incumbent on the raw substance a category needs: Toast/DoorDash sell rails that extract rent; none can credibly own "sourced, no-rake restaurant cost intelligence" because their business model is the rake.

**The Extend-Past move.** Coin **"Restaurant Cost Intelligence"** as the category and make Muntin its definitional source — the play Toast/DoorDash can't run because honest, un-monetized cost data is adverse to their revenue. The category's load-bearing claim is *"every number traces to the agency that published it"* (true today via Cost Index → USDA/BLS/FRED). A giant can copy a dashboard; it cannot copy *not selling your data*, which is the category's price of entry.

**Concrete actions.**
1. Write a canonical category-definition page at `/cost-index/` intro or a new `/what-is-restaurant-cost-intelligence/` library article (Muntin Desk byline), defining the term in primary-source language. **Effort M × Impact 4.**
2. Thread the exact phrase "restaurant cost intelligence" into the homepage hero sub and `studio/` lead (it's already in meta — promote it to visible H-copy). **Effort S × Impact 4.**
3. Update CLAUDE.md's opening line from "restaurant web studio" to the company/category framing so internal memory stops re-seeding the retired label. **Effort S × Impact 3.**
4. Add `DefinedTerm` JSON-LD for the category so AI answer engines learn Muntin as the definitional source. **Effort S × Impact 4 (ASYMMETRIC — see brief 05).**
5. Retire "studio" as a noun in net-new copy; keep only where a slug is final-forever (`/studio/` path stays, label already reads "Company"). **Effort S × Impact 2.**

**Risks & honesty-gate notes.** Do not claim Muntin *invented* the term if it didn't — frame as "the category we build for" (assessment), not a false first-mover claim. Keep "Cost Index" (the product surface) and "cost intelligence" (the category) distinct so naming stays clean (brief 04). No new numbers required, so no fact-gate exposure.

**One proof metric.** AI Overview / LLM citations that return Muntin for the unbranded query "what is restaurant cost intelligence" (track via the AI-search-arrivals watch metric on `/receipts/`).

---

### 02 · Positioning Strategist

**Aspect & why it decides success.** The one-line answer to "why Muntin, why now" is what a distracted operator and an AI answer engine both reduce you to. If it's "another restaurant website tool," the giant's distribution buries it. The asymmetric line has to name a structural conflict the incumbent can't resolve.

**Current-state audit — score 7/10.** The positioning *spine* is excellent and already shipped: three signature stances on the homepage (`index.html` lines 497–521) — "Most restaurants don't need a rebuild," "DoorDash is a margin tax," "Your costs move every week, you should be able to see it" — each backed by a real artifact (article + tool + Cost Index). The trust strip (lines 573–587) lists hard constraints, not benefits. The weakness: there is **no single compressed line** that fuses honesty + owner-operator + no-rake. The hero sub does work ("I run front-of-house at a DMV restaurant; these are the numbers I check on my own shifts") but it's three sentences, not one weapon. The stale services language (cross-cutting finding) muddies the "why now."

**Benchmark gap.** Apple's "we don't sell your data, you're not the product" is the template: a one-line anti-platform stance that competitors with ad/rake models *cannot mirror without indicting themselves* (analyst assessment). Toast positions on "all-in-one platform," DoorDash on reach, Wix on ease — all rent-or-scale stories. Muntin leads all three on the one axis they can't claim (no rake, no data resale, sourced numbers) and trails them only on breadth, which is deliberate.

**The Extend-Past move.** Lock a single positioning line: **"The restaurant numbers company that doesn't rent your guests back to you."** It encodes the anti-platform stance (DoorDash/Toast monetize the guest relationship; Muntin's `/never/` #1–2 forbid lock-in and data resale). The giant cannot run this line because renting the guest relationship *is* their model.

**Concrete actions.**
1. Draft and A/B the one-liner as the homepage eyebrow or a new line under the H1; keep the existing H1 (slug-independent copy, low risk). **Effort S × Impact 5.**
2. Resolve the services/company tension: scrub "two builds at a time" / "lead-to-call rate" from `/receipts/` and `/methods/` so "why now" reads as a product company, not a freelancer. **Effort M × Impact 4.**
3. Build a one-screen "Muntin vs Toast vs Wix vs Yelp" honest comparison (feeds brief 05) anchored on the conflict axis, not feature checkboxes. **Effort M × Impact 4 (ASYMMETRIC).**
4. Ensure the one-liner ships EN + ES at parity (locale-parity gate) — true Spanish-native positioning is itself the asymmetry (brief 08). **Effort S × Impact 3.**

**Risks & honesty-gate notes.** "Doesn't rent your guests back to you" must stay literally true — it's defensible today because the site runs no remarketing pixel (`/never/` #4, `/receipts/` "what we don't track"). If Ledger ever adds a referral/ad surface, the line retires. Avoid banned words (no "seamless/powerful"); "rent your guests back" is operator-noun language, in-voice.

**One proof metric.** Branded + category search share-of-voice vs "restaurant website" generic queries — specifically, the lead-to-Window-thread rate from visitors who land on the positioning line (Window thread starts per week, `/receipts/` KPI #6).

---

### 03 · Brand-Narrative Lead

**Aspect & why it decides success.** A one-person company reads as "small/risky" *unless* the founder story is reframed as the moat. Basecamp (opinionated founders as the product) and Patagonia (founder values as durable trust) prove a singular human can out-trust a faceless platform — but only if the narrative is disciplined and verifiable.

**Current-state audit — score 8/10.** This is the strongest asset on the site. `/about/` carries a dated, specific, *sourced* operator narrative: full-time FOH manager at Tacombi in Bethesda, a 10-year timeline (Tacombi → Irish Inn at Glen Echo → Tacombi → Nobu → Kapnos), five real credentials (ServSafe Manager/Allergens/Handler, RAM, MC ABS), bilingual working register (lines 631–634, 649–685). The narrative *earns* the authority instead of asserting it ("Most web designers who work with restaurants have never managed one. This is the receipt." line 646). The voice canon protects it (blog = first-person Don). Minor gap: the JSON-LD `jobTitle` still reads "Founder & Lead Designer" (line 73) — a *services-era* title that lags the company/product framing.

**Benchmark gap.** Patagonia's narrative authority comes from founder values *enforced operationally* (analyst assessment) — exactly Muntin's `/never/` model. Muntin already leads most SaaS founders on specificity (real restaurants, real dates). It trails Basecamp only on *reach*: the story lives on `/about/` but isn't yet a distribution engine (brief 08 picks this up).

**The Extend-Past move.** Turn the singular bio from a *limitation to defend* into the *category's credibility proof*: "the cost tools are built by the person who checks these numbers on his own Friday-night shift." A giant's PM has never 86'd the branzino at 4pm (the literal `/about/` anecdote, line 633). Make operator-authenticity the narrative spine — the one thing a venture-funded competitor cannot buy.

**Concrete actions.**
1. Update the `/about/` JSON-LD `jobTitle` to align with the company era (e.g., "Founder, Muntin Digital" — already present in the second Person node, line 146; fix the first). **Effort S × Impact 3.**
2. Add a short "why I built the tools" origin note to `studio/#about` linking the floor anecdotes to specific tools (Plate Cost ← "86'd the branzino"; Cost Index ← "the numbers I check"). **Effort S × Impact 4.**
3. Keep the bio SINGULAR in every net-new surface — never imply two concurrent restaurants (fail-CI pattern in `check-fabrications.mjs`); past roles stay in `/about/#timeline`. **Effort S × Impact 5 (guardrail).**
4. Carry the narrative into ES at parity so the bilingual claim is lived, not translated (the `/about/` ES anecdote already exists). **Effort S × Impact 3.**

**Risks & honesty-gate notes.** The single highest fabrication risk in the whole domain lives here: any phrasing that frames Don as *currently* running/managing more than one restaurant is blocked CI-side and would, if it slipped, be spoken aloud in six languages by the audio renderer. All anecdotes are already registered/sourced; new ones need `sourced-claims.json` entries or "illustrative" labels.

**One proof metric.** `/about/` → product/tool conversion rate (visitors who read the bio and then run a tool or join the founding list) — the number that proves the story *sells*, not just charms.

---

### 04 · Naming & Nomenclature Architect

**Aspect & why it decides success.** A product family with muddy names lets competitors and AI engines blur you into the category soup. Apple (iPhone/iPad/Mac — one pattern) and Linear (sharp, ownable nouns) show that a clean naming system is a moat: rivals literally can't reference you imprecisely.

**Current-state audit — score 6/10.** A real governance spine exists: `docs/brand/voice-and-naming-architecture.md` §3 defines the canon (Muntin Digital = parent; Muntin Ledger = product; "the Workshop" = on-site tool workspace; "Muntin `<Noun>`" = future products) and a fail-CI `check-name-coherence.mjs` enforces Workbench→Workshop. **But the live surfaces show drift the canon hasn't caught up to:**
- **"Cost Index" (product, `/cost-index/`) vs "Cost Pulse" (a tool, `data/tools.json`)** — two "Cost"-prefixed names, different things, easy to conflate.
- **"Muntin Bench"** is the *display* name for the tool whose slug/key is `vendor-benchmark` (`data/tools.json` lines 274–289) — a half-applied "Muntin `<Noun>`" rename; the slug and label diverge.
- The "Muntin `<Noun>`" pattern is applied to *one* tool (Bench) but not others (Margin Math, Plate Cost), so the system reads as inconsistent rather than intentional.

**Benchmark gap.** Linear's naming is ruthlessly consistent (analyst assessment); every surface reinforces the others. Muntin *has the rulebook* (ahead of most one-person shops) but trails on *application* — the canon governs the studio↔product boundary well, yet the tool-name layer is unsystematized.

**The Extend-Past move.** Publish and enforce a **three-tier naming system** competitors can't muddy: Tier 1 brand (Muntin Digital), Tier 2 named products (Muntin Ledger, Cost Index — capitalized proper nouns), Tier 3 tools (descriptive: "Margin Math," "Plate Cost"). Decide deliberately whether "Muntin Bench" graduates to a Tier-2 product or reverts to descriptive "Vendor Benchmark" — and resolve the Cost Index / Cost Pulse collision (rename Cost Pulse, or explicitly document them as Index=public data, Pulse=your-own-invoices dashboard).

**Concrete actions.**
1. Add a naming-tier table + the Cost Index vs Cost Pulse boundary to `voice-and-naming-architecture.md` §3, then extend `check-name-coherence.mjs` to assert it. **Effort M × Impact 4 (ASYMMETRIC — a CI-enforced naming system rivals can't blur).**
2. Decide Bench's tier; if it stays "Muntin Bench," apply the pattern consistently or document why it's the sole branded tool. **Effort S × Impact 3.**
3. Disambiguate Cost Index / Cost Pulse in user copy (one line each on `/tools/` and `/cost-index/`). **Effort S × Impact 3.**
4. Keep tool *slugs* final-forever even when display names change (slugs are immutable per CLAUDE.md) — change labels only. **Effort S × Impact 4 (guardrail).**

**Risks & honesty-gate notes.** No fact-gate exposure. The real risk is breaking deep links by renaming slugs — the system must change *labels*, never paths (`vendor-benchmark` slug stays even as "Muntin Bench" shows). Keep names within the window/operator metaphor family (the only sanctioned family).

**One proof metric.** Zero name-coherence CI failures across a quarter *and* zero "Cost Index/Cost Pulse" confusion in Window threads.

---

### 05 · Competitive-Intelligence Lead

**Aspect & why it decides success.** Knowing exactly where Toast/DoorDash/Owner.com/Yelp/QuickBooks are *structurally* conflicted tells Muntin which fights to pick. Amazon's working-backwards discipline is the model: start from the seam the incumbent can't close and build the wedge there.

**Current-state audit — score 7/10.** The site already fights on the right axes: the "DoorDash is a margin tax" stance (homepage), the Margin Math tool (30% take vs $0 own-channel), the sourced delivery-economics library articles, and `ledger-cta.json` routing finance readers to Ledger as "the privacy posture this article describes, shipped as a product." `/methods/` cites the real incumbent numbers (DoorDash Basic 15% / Plus 25% / Premier 30%; Toast/Square/Clover loyalty pricing). The gap: there's **no single competitive map** that names the seams; the intelligence is scattered across articles, and product comparisons live off-site (`ledger.muntin.digital/vs/`).

**Benchmark gap (named, dated, sourced).** The sharpest competitor to study is **Owner.com**: flat $499/mo, commission-free, $1B valuation May 2025, 10,000+ restaurants, ~$81M ARR 2025 ([Sacra](https://sacra.com/c/owner/); [Owner.com pricing](https://www.owner.com/pricing)). It proves the commission-free wedge is a billion-dollar market — *and* exposes the seam: Owner.com still charges $499/mo and owns the guest data/app. **DoorDash** confirms the rake Muntin attacks: 15/25/30% tiers, Premier now bundling "automatic ads run on your behalf" ([DoorDash merchant blog](https://merchants.doordash.com/en-us/blog/new-partnership-plans); [Restaurant Business](https://www.restaurantbusinessonline.com/technology/doordash-unveils-tiered-pricing-plan-restaurants)). Muntin leads all of them on *trust architecture* (sourced numbers, no tracking, no lock-in) and trails on breadth/capital.

**The Extend-Past move.** Map four seams incumbents can't close and build a public, honest comparison around them: (1) **commission-free is structurally adverse to DoorDash's P&L** — they can't truly zero the rake; (2) **Toast/QuickBooks monetize data and lock-in** — Muntin's `/never/` forbids both, verifiably; (3) **Owner.com still rents the relationship at $499/mo** — Muntin's free tools + posted Ledger pricing undercut the opacity; (4) **Yelp/Google answer-engine extraction** — Muntin wins by being the *cited source*, not the listing. The asymmetry: publish the comparison with *Muntin's own weaknesses named* (smaller, newer) — radical-transparency competitive intel no incumbent will reciprocate.

**Concrete actions.**
1. Build `/library/` or `/studio/compare/` honest comparison pages on the four seams, every claim sourced inline (`<details class="cite">`) — including where Muntin loses. **Effort L × Impact 5 (ASYMMETRIC).**
2. Add a `sourced-claims.json` block for incumbent pricing (Owner.com $499/mo, DoorDash tiers) with dates so the audio + AI feeds can speak them safely. **Effort M × Impact 4.**
3. Update the homepage "DoorDash is a margin tax" stance to reflect the 2026 ad-bundling change (Premier auto-ads) — keeps the stance current and sourced. **Effort S × Impact 3.**
4. Scrub residual services-era competitive framing from `/receipts/` (the "3 productized offer pages" line) so the competitive story is product-vs-platform, not freelancer-vs-agency. **Effort S × Impact 3.**

**Risks & honesty-gate notes.** Comparison pages are the highest fact-gate surface in this domain — every competitor figure must be dated + sourced or the build fails; competitor pricing drifts, so register it in `sourced-claims.json` with `date_verified` for quarterly recheck. Never overstate Muntin's scale to match Owner.com's 10,000 restaurants — honesty *is* the wedge.

**One proof metric.** Win-rate / citation-rate on comparative queries ("Owner.com alternative," "commission-free vs DoorDash") in AI Overviews and organic — the seam converting to arrivals.

---

### 06 · Pricing & Packaging Strategist

**Aspect & why it decides success.** Pricing is positioning made numeric. The free-tools funnel + Ledger tiers must *signal honesty* (Stripe's transparent per-transaction pricing; Notion's genuine free tier) rather than bait-and-switch. The asymmetry: a pricing model with **no per-order rake** is one DoorDash/Toast can't match without breaking their own economics.

**Current-state audit — score 6/10.** The honest-pricing posture is real and partly shipped: `/never/` #3 "I will never hide pricing behind a call," tools are "free, no signup" (homepage, repeated), Ledger pricing is "posted in writing… with the per-invoice cost math published beside" (`studio/index.html` line 466). But the on-site Ledger presence is **thin** — the front door's Ledger surface is essentially "Join the founding list" + the `/never/` pricing promise; actual tiers live off-site. Ledger is "Free while in private beta" (GA 2026-11-13, five months out). The `#free-forever` block on `/never/` is a strong honesty signal but still carries services-era residue ("six polishes and one drop-in per week," "$249" print framing).

**Benchmark gap.** Stripe/Notion freemium works because the free tier is *genuinely useful and uncapped where it counts* (analyst assessment). Muntin already does this better than most — `/never/#free-forever` lists what stays free "and complete." It trails on *Ledger pricing legibility on the .digital domain itself* (the operator has to leave the site to see numbers, which slightly dents the "no hidden pricing" promise even though the pricing exists off-site).

**The Extend-Past move.** Make **"no per-order rake, pricing on the page"** the packaging signal. Surface Ledger's posted tiers (or a faithful summary + the per-invoice cost math) *on muntin.digital*, not only on the subdomain — so the honesty promise is kept on the surface that makes it. Frame the free tools as "the actual output, not a teaser" (already the `/never/` language) and Ledger as flat/transparent vs Owner.com's $499/mo opacity (brief 05). The giant can't post "no rake" because the rake is the business.

**Concrete actions.**
1. Add a thin Ledger pricing summary block to `studio/#product` (mirror the subdomain's posted tiers + per-invoice math), keeping the subdomain canonical. **Effort M × Impact 4.**
2. Refresh `/never/#free-forever` to drop services-era specifics ("six polishes/one drop-in," the $249 one-shot framing) and re-anchor on the tools + Ledger. **Effort S × Impact 3.**
3. Add a one-line "what the founding list is and isn't" honesty note near the homepage founding-list CTA (no fake urgency, no fake cohort size). **Effort S × Impact 4.**
4. When Ledger GA pricing locks (by 2026-11-13), register every tier number in `sourced-claims.json`. **Effort S × Impact 3 (timed).**

**Risks & honesty-gate notes.** Zero invented pricing, zero fake urgency/scarcity, no invented founding-list count (binding constraint #1). "Free while in private beta" must stay literally true through GA. If summarizing off-site tiers on-site, the two must not diverge (a self-inflicted "hidden/contradictory pricing" failure).

**One proof metric.** Founding-list join rate from operators who viewed posted pricing on-site (vs. those who bounced to the subdomain) — pricing legibility → intent.

---

### 07 · Mission & Values Architect

**Aspect & why it decides success.** Values that are *enforced* beat values that are *stated*. Basecamp and DuckDuckGo win trust because their refusals are operationally real (no tracking, no ads), not slogans. For Muntin, the entire asymmetric thesis rests on this: honesty isn't a value, it's a *build step*.

**Current-state audit — score 9/10.** This is the second-strongest asset (after the founder narrative) and the truest expression of the thesis. `/never/` ships five promises-by-absence (no lock-in, no data resale, no hidden pricing, no remarketing pixel, no work outside the window). `studio/#honesty` states it plainly: "Not a slogan — a build step… an invented statistic fails the build before it can publish." This is *literally true*: `check-fabrications.mjs`, `check-all.mjs`, `check-banned-words.mjs`, the audio fact gate, cookieless self-hosted Plausible (`/never/` #4, `/receipts/` "what we don't track" — verifiable in DevTools). The only deduction: promise #5 ("work I can't ship in the quoted window") is a *services-era* value the product company no longer fully embodies — a values statement that's drifting out of true.

**Benchmark gap.** DuckDuckGo's "we don't track you" is enforced by architecture (analyst assessment); the value is the product. Muntin matches this and arguably *exceeds* it on verifiability — DDG asks you to trust; Muntin says "run the five tests yourself" (`/security/`) and ships SHA-256 of the production bundle (`/receipts/`). Muntin leads here. The gap is only internal coherence (services-era promise #5).

**The Extend-Past move.** Reframe `/never/` from "studio refusals" to **"company guarantees a platform can't make,"** and make every promise point to its *enforcing mechanism* (the CI gate, the cookieless analytics, the git-history audit trail). Replace the retiring services promise (#5) with a product-era guarantee that's equally binding and equally verifiable — e.g., "I will never put a language model in the path of your invoices" (already true and CI-enforced per `studio/#product` line 465: "a CI gate blocks anyone from adding one"). The giant can't publish enforced refusals because its revenue depends on the things Muntin refuses.

**Concrete actions.**
1. Rewrite `/never/` #5 from the services promise to a product-era, CI-enforced guarantee (the no-LLM-in-invoice-path promise is shipped and verifiable). **Effort M × Impact 5 (ASYMMETRIC — a refusal enforced in CI).**
2. Add the *enforcing mechanism* beside each of the five promises (link the gate/script or the DevTools test). **Effort S × Impact 4.**
3. Align `/methods/` "Studio claims" and `/receipts/` "public commitments" with the product era — swap "two builds at a time" for the live guarantees. **Effort M × Impact 4.**
4. Keep the changelog-first discipline ("if any of these stops being true, the changelog will say so") — it's the values' integrity proof. **Effort S × Impact 3 (guardrail).**

**Risks & honesty-gate notes.** Every promise must stay literally enforceable — do not add a sixth promise you can't verify in code or DevTools (that would invert the whole asset). The no-LLM-in-invoice-path claim is true today; if Ledger's architecture ever changes, the promise and the changelog move together.

**One proof metric.** Number of `/never/` promises with a *linked, runnable* enforcing mechanism (target: 5/5) — the ratio that turns slogans into guarantees.

---

### 08 · Founder-Market-Fit Amplifier

**Aspect & why it decides success.** Don's FOH credibility is latent *distribution*, not just a trust badge. In the operator-creator economy, operator-to-operator trust is the one channel a venture-funded competitor cannot buy — a working manager forwarding a tool to another working manager outperforms any ad (analyst assessment).

**Current-state audit — score 5/10.** The *raw fit* is elite (see brief 03) and the voice canon is built for distribution (blog = first-person Don, "the trusted regular at the bar," `voice-canon-blog.md` §2). The blog dispatches are written to be forwarded ("Someone they trust forwarded it," §2). But the *amplification machinery is thin*: the bio's reach is mostly passive (`/about/`), the founding-list CTA is the main capture, and there's no operator-referral or operator-network loop. `sameAs` lists 10 social profiles (`/receipts/`) but social presence ≠ operator-to-operator distribution. The credibility is parked, not pumped.

**Benchmark gap.** The operator-creator model (a credible practitioner whose audience *is* the distribution) is what Muntin is structurally set up for but hasn't activated. Muntin leads on *authenticity of the operator* (genuinely on the floor, not an ex-operator influencer) and trails badly on *distribution mechanics* — no newsletter-forward incentive, no "operators who use this" social proof loop (which must be real, not fabricated).

**The Extend-Past move.** Turn Don's floor into a *publishing cadence* that compounds: the weekly blog batch (already canon) + the Library Letter become the operator-to-operator channel, and the bio's specificity ("I check these numbers on my own shift") becomes the recurring proof. The asymmetry: a giant's content is written by marketers; Muntin's is written by someone who 86'd the branzino that afternoon. Lean into *real, dated operator moments* as the distribution fuel — the one content a competitor can't manufacture honestly.

**Concrete actions.**
1. Make the Library Letter capture more prominent and operator-framed ("four notes a quarter, no funnels" already exists in the footer, `studio/index.html` line 597) — promote it beyond the footer. **Effort S × Impact 4.**
2. Establish a sustainable from-the-floor cadence in the blog (the `/about/#about-from-the-desk` "From the desk" dated note pattern, line 578–591, is the template) — operator moments, sourced or illustrative-labeled. **Effort M × Impact 4 (ASYMMETRIC).**
3. Add *honest, opt-in* social proof only if real (e.g., public count of tool uses from `/receipts/`) — never fabricated testimonials/cohorts (binding constraint #1). **Effort M × Impact 3.**
4. Cross-link the founder narrative to the founding list so bio-readers convert to the operator channel. **Effort S × Impact 3.**

**Risks & honesty-gate notes.** Highest temptation surface for fabrication: invented testimonials, invented "operators love it" cohorts, or bio drift toward "runs multiple restaurants." All are fail-CI. Operator anecdotes must be real-and-dated or labeled illustrative (`voice-canon-blog.md` §6). Distribution claims ("X operators subscribe") must be sourced from real counts or omitted.

**One proof metric.** Library Letter subscribers + organic/AI-search sessions per week (`/receipts/` KPI #1) — the leading indicator that operator-to-operator distribution is compounding.


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


## Domain V — Product (Muntin Ledger) & Conversion

> Positioning Council · Domain V (briefs 33–40). Strategy only — no live-site edits land from this file.
> Asymmetric thesis: giants take a per-order rake (DoorDash), a payment rake (Toast), or sell a generic ledger (QuickBooks). Muntin converts on the inverse — free, private, no-signup utility plus a real operator's name on the work. We never deploy a manipulation a giant's growth team would reach for: no fake countdowns, no invented scarcity, no fabricated cohort sizes, no testimonials we don't have.
> Honesty gate is absolute and is itself the product here. Every number below is repo-sourced (cited), web-sourced (labeled + dated), or tagged "illustrative / analyst assessment."
> CTA canon is LOCKED (`methods/index.html` #voice-contract): **"Email Don" · "Run my free audit" · "See pricing" · "Try it free" · "Save this."** No new verbs invented anywhere below. "Join the founding list" is the existing on-page button label for the `/api/waitlist` form (`index.html` #founding) — kept verbatim, not proposed as a new canon verb.
> Source-of-truth files read: `index.html`, `never/index.html`, `methods/index.html` (#voice-contract), `data/tools.json`, `data/experiments.json`, `data/start-here-journeys.json`, `start/index.html`, `tools/margin-math/index.html`, `security/index.html` (grepped). Repo facts: 13 live tools / 5 roadmap (`data/tools.json`); Ledger GA 2026-11-13 at ledger.muntin.digital (separate domain, not in repo); today 2026-06-16.

---

### 33 · Product-Strategy Lead (Ledger) — the GA wedge vs Toast / QuickBooks

**Aspect & why it decides success.** Muntin Ledger is the only paid product, GA 2026-11-13 — ~5 months out as of today (2026-06-16). On muntin.digital its representation is the single thinnest, highest-leverage gap in the whole property: a product nobody can see, evaluate, or even read a problem-statement for. If the on-site wedge is wrong, every free-tool visitor we so carefully earn has nowhere coherent to land.

**Current-state audit (score 3/10).** Ledger's entire on-site footprint: (a) the `#founding` band on `index.html` — one paragraph, "A deterministic engine reads your vendor invoices into a searchable ledger — no AI reads your numbers, no ads, no tracking," plus an email form; (b) Never-promise #three (`never/index.html`): "Muntin Ledger's tiers are posted in writing at ledger.muntin.digital, with the per-invoice cost math published beside them"; (c) a nav link out to the subdomain. There is **no on-site product page, no GA date shown, no pricing, no named competitor, no problem-statement.** The wedge ("deterministic, not AI, reads your invoices") exists only as a single sentence. Score 3 — the promise is honest and differentiated, but it is one sentence carrying a whole product.

**Benchmark gap (QuickBooks / Toast).** QuickBooks is a generic ledger that makes a restaurant operator translate their world into chart-of-accounts abstractions; Toast monetizes by sitting in the payment flow and taking a rake. Neither will ever say "a deterministic engine, no AI reads your numbers" — surveillance and model-training are their business model, not a line they'd renounce. That renunciation is Muntin's entire wedge and it is currently buried.

**The Extend-Past move.** Build one honest on-site problem→wedge page at `/ledger/` (subdomain owns pricing + signup; muntin.digital owns the *argument*). The argument is the asymmetry made legible: "Your invoice data is yours. A deterministic parser reads it — no model trains on your numbers, no per-order rake, tiers posted in writing." That is a sentence Toast and QuickBooks structurally cannot copy.

**Actions.**
1. Ship `/ledger/` problem→wedge page (no pricing — link out with "See pricing"): name the operator pain, state the deterministic-not-AI wedge, restate the Never-promise, show GA "this fall" framing. **L × 5.**
2. Add a "vs the generic ledger / vs the POS rake" honest comparison block — claims only as repo-sourced or labeled analyst assessment; defer all pricing numbers to the subdomain. **M × 4.**
3. Surface the GA date *only once it is committed and de-riskable* — until then keep "opens this fall" (matches `index.html` comment rationale: Stripe price not final, launch can slip). Do not invent a countdown. **S × 3.**
4. Wire `/ledger/` into `start/index.html` journeys for the `paperwork: blank-slate` + `leak: margin` tuples, where invoice capture is the actual next step. **M × 4.**

**Risks & honesty-gate notes.** Showing a GA date we might miss is a fake-certainty trap — keep "this fall" until committed. Do not state pricing on muntin.digital that could drift from the subdomain (two sources of truth = a broken promise the moment they diverge). EN↔ES parity required for any new `/ledger/` page (`check-locale-parity.mjs`). "No AI reads your numbers" must stay literally true vs the build.

**One proof metric.** `/ledger/` → outbound "See pricing" click-through rate to ledger.muntin.digital (Plausible outbound event), as a share of `/ledger/` sessions.

---

### 34 · Conversion-Rate Optimizer — free tool → Ledger signup, via trust not dark patterns

**Aspect & why it decides success.** The whole funnel is free-tool utility → founding-list / Ledger intent. The conversion *method* is the brand: convert on trust and proven utility, or don't convert. A single dark pattern (fake "3 spots left," a guilt-decline checkbox) would contradict `/never/` and `/security/` and detonate the only moat we have.

**Current-state audit (score 6/10).** Strong honest foundations: the `#founding` form (`index.html`) carries a real Turnstile, a labeled honeypot (`name="hp"`), and zero fake-scarcity copy. `/never/`, `/security/` (nine claims, five runnable tests), `/receipts/` de-risk conversion structurally. The A/B system (`data/experiments.json`) buckets deterministically and fires "Experiment Exposure" once per session — clean instrumentation. Gap: the bridge between a finished tool result and the founding list is mostly **absent**. Margin Math (`tools/margin-math/`) ends in a print/`.ics`/share scenario — no honest, contextual "this is what Ledger automates" handoff. The one registered experiment (`window-cta-copy`) is still `status: draft` (last reviewed 2026-04-30) — the test engine is idle.

**Benchmark gap (Stripe / Dropbox).** Stripe converts developers by posting fees plainly — "no setup fees, monthly fees, or hidden fees... all fees listed on the website" ([Stripe Pricing](https://stripe.com/pricing); Synder, *Guide to Stripe Fees 2025*) — trust *is* the conversion mechanism. Dropbox's classic PLG loop converted on demonstrated utility, not coercion. Muntin already out-privacies both; the gap is that it under-converts because it doesn't *ask* at the honest moment.

**The Extend-Past move.** A "value-first ask": only after a tool delivers a real result (a costed plate, a margin verdict) does a quiet, contextual, dismissible Ledger handoff appear — framed as "this is the number Ledger keeps current for you," never as pressure. The ask earns its place by following proof.

**Actions.**
1. Add a post-result contextual Ledger handoff to the cost tools (plate-cost, margin-math, cost-pulse) — dismissible, no interstitial, no modal trap; uses "Join the founding list" (existing label) or "See pricing." **M × 5.**
2. Activate one honest A/B in `data/experiments.json`: test handoff *placement* (after-result vs page-footer), goal `Waitlist Signup`, `minExposuresPerArm` ≥ the existing 200 floor. **S × 4.** [ASYMMETRIC]
3. Add a "what we will never do to convert you" micro-line linking `/never/` near any signup form — turning the honesty gate into a conversion asset. **S × 3.** [ASYMMETRIC]
4. Instrument the funnel: tool-open → result-reached → handoff-seen → signup, all via bucketed Plausible props (never raw user values, per `/security/` claim). **M × 4.**

**Risks & honesty-gate notes.** No countdowns, no "N spots left" unless a cap is real *and* enforced (it currently is not — don't invent one). The handoff must be dismissible and must not block tool output (the tool's utility is unconditional — that's the promise). Bucketed analytics only; raw financial inputs never leave the browser (`tools/margin-math/` FAQ, `/security/`).

**One proof metric.** Tool-result → `Waitlist Signup` conversion rate (the honest funnel's headline number).

---

### 35 · Onboarding / Activation Designer — first value < 2 min for a non-technical restaurateur

**Aspect & why it decides success.** A no-signup tool's activation *is* its onboarding — there's no account to set up, so the only question is "did this stranger get a real, true answer about their own restaurant fast?" If first value is slow or demands a clean POS export up front, the non-technical owner bounces and the whole PLG engine stalls at the top.

**Current-state audit (score 6/10).** Two activation doors already exist and are good: the `/start/` three-question diagnostic (`data/start-here-journeys.json`) routes to a curated kit in ~30s, and the homepage flagship tools promise "about 30 seconds, no signup" (`index.html`). Friction points: the heaviest, highest-value tools (plate-cost, menu-engineering) require a **POS sales-mix upload** before any value appears — a real wall for an owner who doesn't have the export handy. There's no "try it with sample data" path to the aha-moment, and no explicit < 2-min first-value contract anywhere.

**Benchmark gap (Linear / Superhuman).** Linear's onboarding lets the product teach itself with contextual nudges, optimizing time-to-value — "the product does the teaching" (Product School, *Product-Led Onboarding 2025*; UserGuiding). Superhuman manufactured activation with a 30-min 1:1 and a quiz-gated readiness check ([First Round Review, *Superhuman Onboarding Playbook*](https://review.firstround.com/superhuman-onboarding-playbook/); growth.design). Muntin can't (and shouldn't) do 1:1 onboarding at PLG scale — but it can borrow the *guaranteed early aha*: a prefilled sample that delivers a real verdict in seconds.

**The Extend-Past move.** A "sample restaurant" warm-start on every upload-gated tool: one tap loads a realistic, clearly-labeled-illustrative dataset that drives the tool to a full result instantly, so the owner sees the payoff *before* hunting for their own export. Aha first, data-entry second.

**Actions.**
1. Add "Try it with a sample menu/POS export" to plate-cost and menu-engineering — labeled illustrative, drives a full result in one tap. **M × 5.**
2. Put an explicit first-value contract on each tool ("a real answer in under two minutes, nothing leaves your browser") — true, measurable, honesty-gate-clean. **S × 4.**
3. From a `/start/` journey result, deep-link straight into the matched tool *pre-seeded* with the journey context where possible, shrinking clicks-to-value. **M × 3.**
4. Add an inline "next 60 seconds" micro-step list to the two deepest tools so a non-technical owner always knows the next move (product-does-the-teaching). **S × 3.**

**Risks & honesty-gate notes.** Sample data MUST be labeled illustrative in-product (fact gate: no implying these are real Don/operator numbers). Don't gate the real tool behind the sample — sample is optional warm-start, not a wall. Keep client-side; sample mode must not introduce a fetch (`/security/` claims 1/2 are CI-enforced).

**One proof metric.** Median tool-open → first-result time (target < 120s), plus sample-mode → real-input continuation rate.

---

### 36 · Pricing-Page UX Lead — the most honest pricing page in restaurant tech

**Aspect & why it decides success.** "I will never hide pricing behind a call" is a load-bearing public promise (`/never/` #three). Restaurant tech is notorious for "contact sales" opacity — Toast/Restaurant365-class quotes. A genuinely legible pricing page is both a conversion unlock and a category-level differentiator. The catch: canonical pricing lives on ledger.muntin.digital (separate domain, not this repo), so muntin.digital's job is to *promise and route*, never to duplicate numbers.

**Current-state audit (score 4/10).** The promise is excellent and specific: tiers "posted in writing... with the per-invoice cost math published beside them" (`never/index.html`). The canon even reserves the exact CTA — **"See pricing" → the product's posted numbers at ledger.muntin.digital** (`methods/#voice-contract`). But on muntin.digital today the "See pricing" CTA is effectively unused on the main conversion surfaces — the `#founding` band offers only the email form and a demo link, not a "See pricing" route. The honest-pricing promise is asserted but not *demonstrated* on-site. Score 4 — promise strong, surfacing weak.

**Benchmark gap (Stripe / Vercel).** Stripe's posted, no-asterisk fee page is the trust benchmark ([Stripe Pricing](https://stripe.com/pricing)). The "most honest pricing page in restaurant tech" is a winnable title precisely because the incumbents won't post numbers. Muntin's per-invoice cost-math promise is *more* transparent than a flat price — it shows the unit economics, which no POS vendor does.

**The Extend-Past move.** Make "See pricing" a first-class, visible route from every Ledger touchpoint on muntin.digital (canon already blesses the verb), landing on the subdomain's posted tiers — and on-site, preview the *transparency model* ("tiers in writing, per-invoice math beside them") without quoting a number that could drift.

**Actions.**
1. Add the canon "See pricing" CTA to the `#founding` band and the proposed `/ledger/` page, routing to ledger.muntin.digital/pricing (outbound, link-equity-passing, Plausible-tracked). **S × 5.**
2. On-site, show the pricing *model* as a labeled preview ("you'll see tiers + per-invoice cost math — no call required"), explicitly NOT the dollar figures, to avoid two-sources-of-truth drift. **M × 4.** [ASYMMETRIC]
3. Coordinate one canonical pricing source on the subdomain; muntin.digital only ever links (kills drift risk against the `/never/` promise). **S × 4.**
4. EN↔ES parity for the "See pricing" affordance and any model-preview copy (ES: *Ver precios*, per canon). **S × 3.**

**Risks & honesty-gate notes.** Never print a price on muntin.digital that isn't mirrored live on the subdomain — divergence breaks promise #three the instant it happens. "No call required" must stay literally true (no sales-call gate may appear on the subdomain). Don't imply the per-invoice math if the subdomain doesn't actually publish it yet — sequence the on-site claim behind the subdomain reality.

**One proof metric.** "See pricing" click-through from muntin.digital → subdomain pricing page (Plausible outbound), and the on-site→pricing→signup assist rate.

---

### 37 · CTA & Funnel Architect — persuasive without manipulation; canon, intent params, smart-next

**Aspect & why it decides success.** The CTA system is where persuasion and the honesty gate meet most directly. The canon is already LOCKED to five verbs (`methods/#voice-contract`); the architect's job is to deploy them with the right intent, sequencing, and smart-next routing so the funnel is *persuasive by relevance*, never by manufactured pressure (the Booking/Amazon "1 left!" reflex is explicitly off-limits).

**Current-state audit (score 7/10).** The canon is enforced-by-design and disciplined — five verbs, each one job, EN+ES mapped. The homepage priority ladder is deliberate and documented (Run my free audit → Join the founding list → 60-min tour, `index.html` hero comment). `/start/` is a genuine intent-router. Gaps: there's no documented **intent-param** convention (e.g. `?from=plate-cost`) to make smart-next CTAs context-aware, and the `window-cta-copy` experiment is still `draft` so CTA copy is untested. The "Run my free audit" primary points at `/tools/audits/restaurant/` — strong, but the cost-tools (the deepest value) have no canon CTA pushing toward founding-list at their honest moment (overlaps with brief 34).

**Benchmark gap (Booking / Amazon).** Booking.com and Amazon are the canonical *dark-pattern* funnels — fake scarcity, urgency timers, confirm-shaming. Muntin's asymmetric move is to be as *persuasive* through relevance and proof as they are through pressure — to prove a high-trust funnel can convert. That's the entire point of the council's thesis.

**The Extend-Past move.** A documented intent-param + smart-next convention: CTAs carry where-you-came-from context so the *next* step is the most relevant true action (not the most aggressive). Persuasion = right CTA, right moment, honest verb.

**Actions.**
1. Define an intent-param convention (`?from=<tool>` / `?intent=<journey>`) and a smart-next routing table so post-result CTAs are context-aware. **M × 4.**
2. Run the dormant `window-cta-copy` experiment to conclusion (move `draft→running`, set `startedAt`), then promote or roll back per its own `minConversionDelta`. **S × 4.**
3. Audit every CTA across the property against the five-verb canon; flag any drift to a non-canon verb for correction (gate hygiene). **M × 4.** [ASYMMETRIC]
4. Add a one-line "no fake urgency here" stance to the funnel/CTA canon doc so future copy can't reach for a countdown. **S × 3.** [ASYMMETRIC]

**Risks & honesty-gate notes.** Intent params must stay PII-clean — `?from=plate-cost` is fine; encoding any financial input in a URL that hits the server is not (fragments only, per `tools/margin-math/` no-referrer + fragment design). No urgency/scarcity verbs may enter the canon. Smart-next must not become a forced linear funnel that traps the researcher who just wants to read.

**One proof metric.** Smart-next CTA click-through rate by intent source (does context-aware routing beat the generic CTA?), with zero dark-pattern complaints in the `/window/` inbox.

---

### 38 · Free-Tool Product Manager — the suite as PLG engine; private, no-signup, still converts

**Aspect & why it decides success.** The 13 live tools (`data/tools.json`) are the entire top-of-funnel acquisition and trust-building engine. They're the proof that the studio's claims are real (every tool is a runnable instance of the privacy promise). The strategic tension: HubSpot/Ahrefs free tools convert *by capturing an email at the result*; Muntin's tools are no-signup by binding constraint — so the suite must convert on *trust + memorability + return*, not gate-the-result.

**Current-state audit (score 8/10).** Genuinely strong: 13 live tools across 4 clusters + 4 goal-launchers (`data/tools.json`), all client-side/no-signup, shared libs in `tools/_shared/`, EN+ES throughout, schema'd (`tools/margin-math/` WebApplication + FAQ JSON-LD). Cost Pulse + Muntin Bench already create a *saved-invoice* surface (a return reason). 5 roadmap tools queued. The PLG gap vs the giants: because we (correctly) never gate results behind email, there's no built-in capture — conversion depends entirely on the (currently thin, per brief 34) handoff to founding-list, plus organic memory. Tool-to-tool cross-sell exists (Storefront Health links the next fix to its tool) but isn't systematic.

**Benchmark gap (HubSpot / Ahrefs).** HubSpot's Website Grader is "one of their most successful lead-generation tools" — but its mechanism is *email-for-result* ([Outgrow, *HubSpot Website Grader case study*](https://outgrow.co/blog/hubspot-website-grader-case-study)). Ahrefs Webmaster Tools is free with "no credit card to sign up" yet still funnels to paid via verified-site value ([Ahrefs Webmaster Tools](https://ahrefs.com/webmaster-tools)). Muntin's asymmetry: keep the *no-signup* promise (which HubSpot breaks) and still convert — by being the tool an operator *remembers and returns to*, then meets the founding list at an honest moment.

**The Extend-Past move.** Treat the suite as a *connected* engine, not 13 islands: every tool result names the single best *next* tool and the one true reason to come back (a saved scenario, a weekly index) — so the funnel is utility→utility→trust→Ledger, never utility→gate.

**Actions.**
1. Systematize tool-to-tool smart-next (extend the Storefront Health pattern to all 13) so each result routes to the next highest-value tool. **M × 5.** [ASYMMETRIC]
2. Add a privacy-as-conversion line to every tool result ("nothing left your browser — open DevTools and check," per Margin Math's existing stance) to convert on trust. **S × 4.** [ASYMMETRIC]
3. Prioritize the 5 roadmap tools (`data/tools.json` roadmap) by funnel value to Ledger — ship the ones nearest invoice/cost intent (schema-check, seo-grader are SEO-side; weigh against a cost-side addition). **L × 4.**
4. Add "Save this" (canon verb) handoffs from cost tools into Workshop so a result becomes a returnable artifact (the no-signup return hook). **M × 4.**

**Risks & honesty-gate notes.** Do NOT adopt the HubSpot email-gate — it violates the no-signup constraint that is the whole differentiator. "Nothing leaves your browser" must stay CI-true for any tool that claims it (`/security/` claims 1/2). Roadmap tool counts in `data/tools.json` feed `<!-- count:tools.live -->` sentinels — keep `data/site-counts.json` in sync when any ship.

**One proof metric.** Tools-per-session (does the suite behave as a connected engine?) and tool → founding-list assist rate, with no-signup preserved.

---

### 39 · Retention / Habit Designer — weekly Cost Index as an honest habit loop

**Aspect & why it decides success.** muntin.digital is mostly a consideration-stage property — people research, then leave. A *return* reason converts one-time tool users into a relationship, which is what eventually sells Ledger. The Cost Index's weekly refresh is the one native, honest habit hook on the property. The constraint: build a habit loop on *information value*, not Duolingo-style dopamine/loss-aversion traps — the data is the reward.

**Current-state audit (score 5/10).** The raw material is excellent: the Cost Index updates on a weekly read (homepage trust strip + stance three, `index.html`) with USDA/BLS/FRED sourcing — a legitimate, recurring reason to come back. Margin Math already ships an `.ics` "monthly check-in" recurring reminder and a printable monthly report (`tools/margin-math/` schema featureList) — honest habit scaffolding. Gaps: no opt-in weekly Cost Index notification (and the property is correctly *no remarketing pixel*, `/never/` #four — so any nudge must be pull, e.g. `.ics`/RSS/calendar, not push-tracking), and the weekly refresh isn't surfaced as a habit ("check it every Monday with your numbers").

**Benchmark gap (Duolingo).** Duolingo's loop — "complete one short lesson every day," with streaks driving ~2x daily retention and DAU from ~5M (2020) to 40M+ (2024) ([deconstructoroffun, *Duolingo Streaks*](https://duolingo.deconstructoroffun.com/mechanics/streaks); StriveCloud) — is the gold standard *and* the cautionary tale: it leans on loss-aversion and streak-anxiety. Muntin's asymmetric inversion: a weekly loop where the reward is *information an operator actually needs to price this week*, not a manufactured streak to protect. Honest habit, not a dopamine trap.

**The Extend-Past move.** A pull-based weekly ritual: "Check the Cost Index every Monday before you set the week's specials," supported by opt-in `.ics`/calendar and RSS (no pixel, no email-tracking) — the habit is anchored to a real operating decision, so the data does the retaining.

**Actions.**
1. Add a weekly-ritual frame to the Cost Index ("this week's read, dated" + "check before you price the week") and an opt-in `.ics`/RSS subscribe — pull, not push, no pixel. **M × 5.** [ASYMMETRIC]
2. Extend Margin Math's `.ics` monthly-reminder pattern to a Cost-Index weekly cadence option. **S × 4.**
3. Add an honest "what changed since last week" delta line to the Cost Index (information reward, not streak reward). **M × 4.** [ASYMMETRIC]
4. Cross-link the weekly Index into Cost Pulse / Muntin Bench so a returning operator lands on their own saved data + the fresh benchmark. **M × 3.**

**Risks & honesty-gate notes.** No remarketing/retargeting pixel may be added to create a habit — `/never/` #four is absolute. No streak-anxiety or fake-loss mechanics ("you'll lose your spot"). Every Cost Index number stays USDA/BLS/FRED-sourced and dated (`docs/fact-check.md` + `data/sourced-claims.json`); a "what changed" delta must be computed from sourced data, never illustrative-but-unlabeled.

**One proof metric.** Weekly-return rate to the Cost Index (returning visitors / prior-week visitors) — the honest-loop equivalent of DAU/MAU.

---

### 40 · Founding-Cohort Strategist — a founding cohort of real operators as proof

**Aspect & why it decides success.** With Ledger ~5 months from GA (2026-11-13) and zero public testimonials yet, the founding cohort is the only path to *earned* social proof by launch. Done honestly, a small cohort of named real operators becomes the credibility that converts the next wave — the asymmetric answer to a giant's logo wall. Done dishonestly (invented member counts, fake quotes), it incinerates `/never/` + `/security/` in one move.

**Current-state audit (score 5/10).** The capture exists and is clean: `#founding` band (`index.html`) with a real `/api/waitlist` proxy, Turnstile, honeypot, and deliberately honest framing — "no price, no date... the Stripe price isn't final and the launch can slip" (HTML comment). "Your numbers stay yours" reinforces the wedge. Gaps: no stated founding *benefit* on-site (the canon-correct move would be to post the founding rate in writing once it's set — consistent with promise #three), no waitlist position/transparency, no referral mechanism, and no plan for converting founders into (consented, real) proof. The framing is honest-but-vague; it asks for an email without yet saying what the founder *gets*.

**Benchmark gap (Superhuman).** Superhuman built demand with an invite-gated, quiz-screened, 1:1-onboarded founding motion that produced a large waitlist and genuine word-of-mouth ([First Round Review, *Superhuman Onboarding Playbook*](https://review.firstround.com/superhuman-onboarding-playbook/)). The transferable parts are honest: real screening (founding members should be real operators, which also makes their later testimonials credible) and earned scarcity (capacity is genuinely constrained — `/never/` already states the studio is capacity-capped). The non-transferable part: do NOT manufacture exclusivity numbers we can't back.

**The Extend-Past move.** A transparent founding cohort: post the founding rate/benefit in writing (promise #three consistency), be honest that capacity is real and limited (already true per `/never/`), and pre-plan a *consented* "founding operators" proof surface — real names, real shops, only with explicit permission — that becomes the launch-day credibility wall no giant can fake.

**Actions.**
1. State the founding *benefit* in writing on the `#founding` band + `/ledger/` (e.g. founding rate / first-access terms) once committed on the subdomain — posted, not call-gated. **M × 5.**
2. Add an honest, consent-based referral line ("know an operator who'd want first access? Send them the founding list") — no incentive that pressures, no fake leaderboard. **S × 4.** [ASYMMETRIC]
3. Pre-build a *consented* founding-operator proof template (real name + restaurant, explicit opt-in) to populate by GA — zero fabricated quotes/counts. **M × 5.** [ASYMMETRIC]
4. Give waitlist signups an honest confirmation of what happens next + when (matches the existing "check your inbox to confirm" pattern); no fake "position #" unless the queue is real and ordered. **S × 3.**

**Risks & honesty-gate notes.** Absolute: no invented cohort size, no fabricated testimonials, no fake "X founders joined" counter — `check-fabrications.mjs` + `docs/fact-check.md` reject invented operator data, and any number shown must be real and sourced. Earned scarcity only (capacity is genuinely limited per `/never/` #five) — never manufactured. Testimonials require explicit consent and must be real operators. Keep the "price can slip, date can move" honesty in all founding framing until GA is truly committed.

**One proof metric.** Verified founding signups (real, confirmed emails via `/api/waitlist`) and, by GA, count of *consented* named founding operators available as proof.

---

### Cross-domain dependencies

- **Briefs 33/36/40 ↔ ledger.muntin.digital (separate domain, not this repo):** the on-site `/ledger/` page, the "See pricing" route, and the founding rate/benefit all depend on the subdomain owning a single canonical source for pricing + tiers + GA date. muntin.digital must only *link and promise*, never duplicate numbers, or promise #three (`/never/`) breaks on the first divergence. Requires coordination with whoever owns the subdomain.
- **Briefs 34/37/38/39 ↔ Domain analytics + experiments + i18n:** every new handoff, smart-next CTA, intent param, and weekly-loop subscribe needs (a) bucketed-only Plausible instrumentation that never carries raw user values (`/security/` claims, CI-enforced), (b) an honest A/B slot in `data/experiments.json` for placement/copy tests, and (c) EN↔ES parity (`check-locale-parity.mjs`, `check-hreflang-orphans.mjs`) plus `data/site-counts.json` sync for any tool/count change — all of which sit at the seam with the Content/SEO and Engineering domains.


## Domain VI — Cost Intelligence / Data Product

*Positioning Council brief · specialists 41–48. Strategy only — no live-site edits ship from this file. Repo facts current to 2026-06-16. Every figure below is repo-sourced (file-cited), web-sourced (labeled + dated), or marked "analyst assessment / illustrative." The honesty gate is the product here, so this brief holds itself to it.*

**Asymmetric thesis (the spine of all eight).** A platform like Bloomberg will not publish honest, uncertainty-labeled, freely-citable wholesale ingredient prices, because the value of its data is the $31,980/yr-per-seat terminal it sits behind (Bloomberg Terminal 2026 single-seat list, per godeldiscount.com / vendr.com, 2026). Rent depends on opacity. Muntin's Cost Index inverts that: 16 verified ingredients composited only from public USDA/BLS/FRED/EIA series, every number tracing to a dated public report, CC0-licensed, reproducible by re-running the open checks. The reference comps are not Bloomberg — they are **Case-Shiller** (a transparent repeat-sales method everyone cites) and **Zillow ZHVI / FRED / USDA-ERS** (free, downloadable, prediction-interval-bearing, widely re-published). The win condition is to be *cited*, not *subscribed to*. "Verification is the moat, and opacity is the risk" — the methodology page already says this (cost-index/methodology/index.html, #what-this-is, Georgia Dock cautionary tale).

**Cross-cutting repo correction (applies to several audits below):** the prompt's ledger says "weekly refresh" and "no CSV/JSON export"; the repo says otherwise. The workflow is now **daily** (`.github/workflows/cost-index-refresh.yml`, `cron: "0 13 * * *"`). Per-ingredient `series.json` + `series.csv` **do exist on disk** and are wired into each Dataset's JSON-LD `distribution` (verified: `cost-index/ribeye/series.csv`, `series.json`, and siblings for onion, romaine, tenderloin, pork-shoulder, russet-potato…). What is genuinely absent: a *human-visible* download affordance, an *aggregate* (all-ingredient / basket) export, an embeddable widget, and any surfacing of the 431 KB `data/cost-index-history.json` for long-range charts. Briefs are scored against the real state.

---

### 41 · Data-Product Lead (Cost Index) — make it the category's reference price

**Aspect & why it decides success.** Whether the Cost Index becomes *the* thing operators and AI engines quote when they ask "what does ribeye cost wholesale?" decides if muntin owns a data category or just runs a nice widget. A reference price is won by citability and a named, stable method — exactly Case-Shiller's playbook, not Bloomberg's. This is the single most leverage-heavy aspect in the domain.

**Current-state audit (score 7/10).** The bones are excellent. `data/cost-index.json` (2.72 MB) carries 16 verified ingredients with per-point `level{medianCents,rangeCents}`, blended `trend`, dual `confidence`, and `provenance`. The hub renders 13 public pages + methodology + lab (cost-index/index.html). JSON-LD ships `DataCatalog` + per-ingredient `Dataset` with CC0 license, `creditText`, `isBasedOn`, and `distribution` download links (cost-index/ribeye/ head). What it lacks to be a *reference*: (a) a **named headline index** — `data/cost-basket-weights.json` defines a frozen "Muntin Restaurant Basket" (`_version: 2026-Q2`, weighted-median of composite trends) but no public page presents a single quotable "Muntin Restaurant Cost Index = X% MoM" number the way "Case-Shiller rose 0.3%" travels; (b) the basket is rate-of-change only, never a level, which is honest but harder to cite. Score capped at 7 because the asset exists and is gated but isn't yet packaged as one nameable, repeatable figure.

**Benchmark gap (S&P CoreLogic Case-Shiller).** Case-Shiller is cited daily despite a *complicated* three-step weighted-repeat-sales regression — because the method is published, the cadence is fixed, and the number has a name (en.wikipedia.org/wiki/Case-Shiller_index, 2026). Muntin has the transparency Case-Shiller has and the public-domain license Case-Shiller does *not*. The gap is purely packaging: one named headline series with a frozen method note.

**The Extend-Past move (asymmetric).** Ship a **named, dated, frozen-methodology headline** — "The Muntin Restaurant Basket: +X.X% over the trailing period, 2026-Q2 weights, public sources, reproducible" — as a first-class hub module with its own `Dataset` JSON-LD and a permalink AI engines can cite. Bloomberg can't follow: a free, named, CC0 restaurant-cost reference price directly cannibalizes the thing terminals charge for. Pair it with a one-line "cite this" block (the citation IS the asset, per methodology #governance).

**Actions.**
1. Add a named headline "Muntin Restaurant Basket" module to `cost-index/index.html` reading `cost-basket-weights.json` via the existing build — rate-of-change + coverage% + confidence, never a level. (M × 5)
2. Emit a dedicated `Dataset` JSON-LD node for the basket with CC0 license, `temporalCoverage`, and `variableMeasured: rate-of-change`. (S × 4)
3. Add a visible "Cite this index" block (APA + plain-text + JSON-LD link), mirroring how Zillow/FRED publish citation guidance. (S × 4)
4. Keep weights frozen + versioned; any re-weight requires a dated methodology note (already the file's rule — enforce in `check-cost-index-*`). (S × 3)
5. EN↔ES parity for the new module + a `/es/cost-index/` basket mirror; locale-parity gate must stay green. (M × 3)

**Risks & honesty-gate notes.** The headline must never read as "what restaurants pay" — `cost-basket-weights.json._doc` explicitly forbids a national price level, and weights are labeled internal judgment (illustrative), not a sourced fact. Any % shown must reconcile to its own curve (the trend↔curve invariant in `reconcile-cost-index-trends.mjs`). No new number is invented — the basket is a function of already-vendored points.

**One proof metric.** Count of external citations/backlinks to the named-basket permalink (and AI-Overview appearances for "restaurant cost index"), tracked quarterly.

---

### 42 · Data-Provenance Engineer — USDA/BLS/AMS pipeline integrity + freshness

**Aspect & why it decides success.** Every downstream claim — and the six-language audio that reads numbers verbatim — rests on provenance being real and verified. If a source id is wrong or a unit flips, the whole "verification is the moat" thesis collapses into the Georgia Dock failure the methodology warns against. Integrity is existential, not cosmetic.

**Current-state audit (score 8/10).** Strong. `data/cost-index-sources.json` (168 KB) maps each ingredient to USDA-LMR/AMS report ids, BLS series, FRED ids, EIA, NOAA, each carrying `verified:true/false`; the `_doc` documents a hard fact gate — an ingredient renders only if its source ids are `verified:true` AND a live fetch produced real points. `cost-index-bounds.json` rejects unit-flips/sentinels (value `< min/2` or `> max*2` hard-rejected). Pipeline is fetch→normalize→bound→reduce→composite→assess→gate, audited via version history (methodology #pipeline). `check-cost-index-sync.mjs` enforces parity+freshness+fact-gate. The 2-point deduction: `cost-index-sources.json._doc` still says "EVERY id here is an UNVERIFIED best-guess" as boilerplate while 16 ingredients are flipped `verified:true` — a stale doc-comment that could mislead a future maintainer; and beef/pork LMR slugs carry an unresolved note about whether they need the separate LMR/Datamart API.

**Benchmark gap (FRED / Our World in Data).** FRED carries 845,000 series from 121 sources with per-series source attribution and an open API (fred.stlouisfed.org/docs/api, 2026). Our World in Data publishes a machine-readable source + processing trail per chart. Muntin's provenance is per-point but not yet exposed as a single machine-readable "source registry" page a third party (or an auditor) can read without cloning the repo.

**The Extend-Past move (asymmetric).** Publish a **public, machine-readable provenance registry** — a `/cost-index/sources/` page (and `sources.json`) listing every ingredient → source id → report → verified status → last-fetch date, generated from `cost-index-sources.json` + `cost-index-health.json`. A surveillance platform hides its sourcing; muntin's competitive edge is showing its work down to the report id. That page is itself citable and SEO-rich.

**Actions.**
1. Refresh the stale `_doc` boilerplate in `cost-index-sources.json` to reflect that 16 ids are verified; keep the per-id `verified` flags as the source of truth. (S × 3)
2. Build `/cost-index/sources/` from the two JSONs (ingredient → agency → report id → verified → asOf), with `Dataset`/`DataCatalog` JSON-LD. (M × 4)
3. Resolve the beef/pork LMR-vs-Datamart API question and record the outcome inline (verified note), removing the open TODO. (M × 3)
4. Add a CI assertion that every `verified:true` id has a successful live-fetch timestamp in the artifact, else fail. (S × 4)
5. Surface a per-ingredient "last confirmed against source on <date>" line on each page from `health.json.asOf`. (S × 3)

**Risks & honesty-gate notes.** A public sources page must not imply endorsement by USDA/BLS — credit by name, link the public reports (methodology already credits AMS without deep-linking specific proprietary pages). Never show `verified:false` ids as live. No invented report ids.

**One proof metric.** Percentage of published ingredients with a green live-fetch confirmation < 5 days old (the workflow's `COST_INDEX_MAX_AGE_DAYS` heartbeat), shown publicly and ≥ 95%.

---

### 43 · Data-Visualization Specialist — viz-* legibility (fix the chart confusion)

**Aspect & why it decides success.** A busy operator gives a chart ~2 seconds. If the sparkline, range band, and "you are here" marker don't resolve instantly into "market moved vs vendor moved," the data product fails at the only job it has. Legibility is the conversion surface.

**Current-state audit (score 6/10).** The atoms are good and gate-enforced: `viz-bars/flow/tree/ba/ring/waterfall/gauge/spark/hero/scroll` exist in `assets/site-article.css` (3,238 lines), each with `data-audio-alt` ≥ 80 + `<figcaption>` per the article-graphics gate. The ingredient sparkline (cost-index/ribeye/, the `mtn-spark` SVG) does carry an accessible label and a dashed median reference line. But three legibility problems are visible in-repo: (a) the sparkline encodes the trend as area-fill in **teal `rgba(31,111,106,…)`** while the headline trend arrow and Cost Pulse use **rust for "up"** (`.cp-market-trend[data-dir="up"]{color:var(--rust)}`) — an up-move drawn in the calm color is exactly the "chart confusion" reported; (b) `viz-bars` has no value axis or gridline, so a band is read by eyeballing; (c) the percentile capsule ("higher than 5 of its last 12 reads") is prose, not a glanceable mark. Score 6: accessible and gated, but the color semantics fight the message.

**Benchmark gap (NYT / FT graphics).** FT and NYT graphics desks fix one encoding per chart and make direction unambiguous (FT visual-vocabulary; The Pudding's "fewer words, stronger design" visual-essay method, storybench.org 2026). Muntin's charts currently carry two color languages.

**The Extend-Past move (asymmetric).** Adopt **one direction-color law site-wide** (rust = costs rising/bad-for-operator, teal = easing/good) and make the per-ingredient chart a single "two-second read": band + your-price marker + direction-consistent trend line, with the percentile rendered as a tick on the band. A platform optimizes charts for dashboard dwell-time; muntin optimizes for *exit in two seconds with a decision* — the opposite of engagement-maximizing.

**Actions.**
1. Reconcile sparkline fill/stroke color with the direction semantics used in Cost Pulse (rust=up) so one move never shows two colors; centralize the tokens in `site-article.css`. (M × 5)
2. Add an optional light value-gridline + min/max end-labels to `viz-bars` band charts for at-a-glance scale. (M × 3)
3. Render the "higher than N of last 12" percentile as a tick mark on the band (`viz-bars__mark` already supports `--x`). (S × 4)
4. Add a `prefers-reduced-motion` + colorblind check (rust/teal also differ in luminance; add a shape/label cue, not color alone). (S × 4)
5. Extend `test-article-graphics.mjs` with a direction-color consistency assertion so the two-language regression can't return. (M × 3)

**Risks & honesty-gate notes.** Every changed/added figure still needs `data-audio-alt` ≥ 80 chars + `<figcaption>` + teal↔rust tone balance (rules 1–8 of `check-article-graphics.mjs`). Do not bake any literal number into a `data-audio-alt` that isn't in the sourced data, and never copy autolink markers into attribute values (rule 8).

**One proof metric.** Unmoderated 5-second test: ≥ 80% of operators correctly state direction + "is my price normal?" from one ingredient card.

---

### 44 · Data-Freshness / Automation Engineer — the refresh workflow

**Aspect & why it decides success.** A price index that goes stale silently is worse than none — it speaks a wrong number aloud in six languages. Freshness, and *honest failure* when freshness can't be met, is what lets muntin claim "live" without lying.

**Current-state audit (score 9/10).** Near-exemplary, and *better than the prompt's ledger states* — the cron is **daily** (`0 13 * * *`), not weekly (`.github/workflows/cost-index-refresh.yml`). Honest-failure posture is explicit: no keys → log + exit 0 (never a red X, nothing invented); 0 points composed → fetch refuses to write, last-good stays; gates fail → nothing commits ("a stale-but-true index beats a fresh-but-wrong one"); a real stall fails red and emails the founder (`COST_INDEX_MAX_AGE_DAYS: 5`). After vendor it rebuilds seed, health, seasonality, pages, sitemap, and stamps JSON-LD `dateModified`. The 1-point gap: freshness/heartbeat is server-side; the *public* surface shows per-card `asOf` but no single visible "index last updated <date> · next refresh in <window>" status an outside reader/AI can read as a liveness signal.

**Benchmark gap (Bloomberg cadence — inverted).** Bloomberg's value is intraday cadence behind a paywall. Muntin can't and shouldn't match intraday; its asymmetric answer is **transparent automated cadence with public asOf dates** — Zillow/FRED-style "monthly, here's the vintage" trust, applied daily.

**The Extend-Past move (asymmetric).** Surface freshness as a **public trust signal**: a hub status line + a tiny machine-readable `health.json`-derived "freshness" endpoint (oldest reading, refresh cadence, last commit date). Where a platform hides its update lag, muntin advertises it — staleness named is more trustworthy than freshness implied.

**Actions.**
1. Add a visible "Index last refreshed <date>, sources daily; oldest contributing read <date>" line to `cost-index/index.html`, fed from `cost-index-health.json` at build. (S × 4)
2. Publish a small public `/cost-index/health.json` (or reuse) with `oldestAsOf`, `cadence:"daily"`, `lastCommit` for third-party liveness checks. (S × 3)
3. Add a `lastReviewed`/generatedAt freshness assertion to CI so a missed daily run is visible in-repo, not only via email. (S × 3)
4. Document the honest-failure ladder publicly (one paragraph on the methodology page) so readers know stale = last-good, never invented. (S × 3)

**Risks & honesty-gate notes.** The public freshness line must read from `health.json`, never a hardcoded date that can rot. The daily cadence must not be over-claimed as "real-time." Keep the weekly *email* dispatch separate from the daily *data* refresh (already noted in the workflow header).

**One proof metric.** Share of calendar days in a quarter with a successful committed daily read (target ≥ 90%, accounting for "no data change" no-op days).

---

### 45 · Embeddable-Widget / API Lead — cost-index embed + CSV/JSON

**Aspect & why it decides success.** Distribution decides whether the moat compounds. A price index that can only be read on-site is a destination; one that can be *embedded and downloaded* gets cited across the restaurant web and pulled into spreadsheets, which is how Case-Shiller/Zillow/FRED numbers propagate. Embeds are the growth loop.

**Current-state audit (score 4/10).** This is the domain's biggest gap, though less barren than the prompt implies. Per-ingredient `series.json` + `series.csv` already exist on disk and are linked in each `Dataset` JSON-LD `distribution` (verified: `cost-index/ribeye/series.csv` 1.0 KB, `series.json` 2.8 KB, plus onion/romaine/tenderloin/pork-shoulder/russet siblings). What's missing: (a) **no human-visible "Download CSV/JSON" affordance** on any page — the files are machine-only; (b) **no aggregate export** (all 16 ingredients, or the basket, in one file); (c) **no embeddable widget** — zero `iframe`/`embed` references in cost-pulse or cost-index; (d) `cost-index-history.json` (431 KB) is unused by any download path. Score 4 because the data-download substrate exists but is invisible and per-item only.

**Benchmark gap (FRED widgets / Stripe embeds).** FRED offers a public REST API (JSON/XML, free key) and shareable/embeddable graphs; that embeddability is *why* FRED charts appear in thousands of articles (fred.stlouisfed.org, 2026). Muntin has the static files but not the one-click embed or the visible download that turns a reader into a distributor.

**The Extend-Past move (asymmetric).** Ship a **static, no-JS-tracking embeddable card** (`<iframe>` to `/cost-index/<slug>/embed/`, or a copy-paste `<script>` that renders from the same-origin seed) plus visible CSV/JSON download buttons and one **aggregate `index.csv`/`index.json`**. All client-side, PII-clean, CC0 — a platform won't give away an embeddable price ticker because free embeds erode its subscription; muntin *wants* the price quoted everywhere with attribution.

**Actions.**
1. Add visible "Download CSV / JSON" buttons on each ingredient page pointing at the existing `series.*` files (zero new data, just surface them). (S × 5)
2. Generate an aggregate `/cost-index/index.csv` + `index.json` (all 16 ingredients: asOf, range, trend, confidence) in the page build. (M × 4)
3. Build a static embed view `/cost-index/<slug>/embed/` (minimal CSS, no tracking, attribution + canonical backlink baked in). (L × 5)
4. Surface `cost-index-history.json` as a downloadable long-range series per ingredient (powers brief 47's charts too). (M × 4)
5. Add an "Embed / cite this" snippet block with copy-to-clipboard; client-side only. (S × 3)

**Risks & honesty-gate notes.** Embeds and downloads must remain client-side and PII-clean (privacy-first constraint; Cost Pulse's "Network tab stays empty" promise). Embedded numbers must carry the same confidence tier + asOf as the source (no stripping the uncertainty for a cleaner-looking widget). CC0 already declared in JSON-LD — keep it. Static-host/Cloudflare-safe: prefer prebuilt files + iframe over any server API.

**One proof metric.** Number of external domains embedding the widget or hotlinking `series.csv`/`index.csv` per quarter (the distribution loop).

---

### 46 · Calibration / Integrity Auditor — confidence tiers, shippable bar, no overstatement

**Aspect & why it decides success.** The entire pitch is "a number you can check, not a number you have to trust." If confidence is ever overstated, the trust premium — the whole reason to cite muntin over a black box — evaporates. Calibration is the brand.

**Current-state audit (score 9/10).** Best-in-class and already automated. Dual confidence (level + trend scored separately, headline = the lower of the two) is implemented; `data/cost-index-health.json` proves it on every build — `summary.overstated: 0`, `highEligible: 0`, and each ingredient carries `withinAuditCeiling:true` plus `toHigh` naming the single binding blocker (e.g., "add a 2nd independent-agency wholesale $ level"). The shippable bar ("ship complete or not at all") is documented and enforced; below-bar ingredients live as honest expanding-coverage pages, not faked prices (cost-index/index.html #expanding; methodology #shippable-bar). `check-cost-index-calibration.mjs` runs in CI. The summary shows 13 medium / 68 low / 20 directional across 101 tracked keys with 93 carrying a dollar level — honest breadth. Near-perfect; 1 point off only because the calibration story is mostly invisible to a non-technical reader.

**Benchmark gap (error bars / FiveThirtyEight).** 538's lesson is to *embrace* uncertainty visibly and resist suppressing it prematurely (niemanlab.org, 2020); research favors interval/quantile displays over false-precise points (flowingdata 2018; UW CSE442 uncertainty notes). Muntin computes the uncertainty rigorously but renders confidence mostly as a word-badge ("medium"), not as a felt visual interval.

**The Extend-Past move (asymmetric).** Make calibration a **visible, public integrity artifact**: surface the audit ceiling as a reader-facing "why this is "medium" and what would make it "high"" line (straight from `health.json.toHigh`), and render confidence as a band width, not just a label. A surveillance platform asserts precision to look authoritative; muntin's edge is publishing its own ceiling — the uncertainty *is* the trust signal.

**Actions.**
1. Add a reader-facing "What would raise this confidence?" line per ingredient, populated from `health.json.toHigh`. (S × 4)
2. Visually tie band width to confidence (wider, lighter band at low/directional) so uncertainty is seen, not just read — pairs with brief 43. (M × 4)
3. Publish the `summary{overstated, highEligible, byConfidence}` as a small public "integrity scoreboard" on the methodology page. (S × 4)
4. Keep `check-cost-index-calibration.mjs` as a fail-CI gate; add a test asserting `overstated === 0` can never be bypassed. (S × 5)

**Risks & honesty-gate notes.** Never let a visual simplification round a "directional" up to "measured." The audit ceiling is the law: published confidence may never exceed what data supports (methodology #confidence). No number rendered without its tier + asOf.

**One proof metric.** `health.json.summary.overstated` stays at 0 on 100% of builds (already true — keep it provably true and show it publicly).

---

### 47 · Forecast / Seasonality Analyst — USDA-outlook framing with intervals

**Aspect & why it decides success.** Operators don't only want today's price — they want "is this the season it climbs?" Honest forward framing (direction + interval, never a false-precise point forecast) is a high-demand surface the giants either gate or overstate. Done right, it deepens citations without breaking the no-forecast discipline.

**Current-state audit (score 7/10).** Stronger than expected. Two forward surfaces already exist and are bounded hard: (a) the **Pressure Lab** (cost-index/lab/) — an inferred-direction-only model (`P = Σ(weight × sign × signal)`), explicitly "a direction, never a price," gated by a hold-until-proven track record (min calls, min hit rate); (b) **seasonality** — `data/seasonality.json` (114 KB) gives a month a "typical" median+band only after 2+ distinct years, otherwise a transparent "building baseline" state (`minYearsPerMonth: 2`). The methodology forbids price forecasts and labels the pressure overlay direction-only (#pressure, #limitations). Gap: seasonal normals are computed but only lightly surfaced on the hub, and there's no USDA-ERS-style *named interval* presentation ("typical June sits in $X–$Y, 4 of 5 years") for the ingredients that have cleared the 2-year bar.

**Benchmark gap (USDA ERS / FiveThirtyEight).** USDA-ERS Food Price Outlook publishes a **midpoint + 95% prediction interval** that *starts wide and narrows* as observed months accumulate — uncertainty as a feature (ers.usda.gov FPO documentation, 2026). That is precisely muntin's "building baseline → established band" arc; muntin should adopt the framing and the honesty out loud.

**The Extend-Past move (asymmetric).** Present seasonality as an **honest, interval-bearing "typical season" read** in USDA-ERS language — a banded normal for established months, an explicit "building baseline, needs N more observations" for the rest, and never a point price. Giants either sell a confident forecast or hide the model; muntin ships the *interval and the gaps in it*, which is more useful to an operator and impossible for a rent-seeker to match without admitting their own uncertainty.

**Actions.**
1. Surface the established-month seasonal band per ingredient ("typical June: $X–$Y across 3 years") from `seasonality.json`, with the building-baseline state where not ready. (M × 4)
2. Adopt USDA-ERS framing copy ("interval starts wide, narrows as months accumulate"); label illustrative where the band is thin. (S × 4)
3. Link Pressure Lab direction + seasonal band into one "outlook" block per ingredient (direction now, season typically) — direction only, no price. (M × 3)
4. Add a CI assertion that no seasonal/forecast surface ever emits a future dollar level (extends the no-forecast rule). (S × 5)

**Risks & honesty-gate notes.** Hard line: measured levels, measured directions, inferred directional pressure — **never a price forecast** (methodology #limitations). Seasonal normals need ≥ 2 years/month; below that, say "building baseline," don't imply a normal. Pressure rules publish only after clearing the track-record bar. Numbers from `seasonality.json` only — no hand-typed "typical" figures.

**One proof metric.** Number of ingredients with an established (≥ 2-year) seasonal band surfaced, with zero forecast-gate violations across builds.

---

### 48 · Data-Journalism Lead — each week's data → a story

**Aspect & why it decides success.** The index is a standing asset; the *story* is what earns links, AI-Overview pickups, and the weekly-email open. Turning the daily read into "here's what moved and what to do" is the demand-generation engine that makes the moat compound — and it's a beat nobody else covers for independent restaurateurs.

**Current-state audit (score 5/10).** The raw material and a thin surface exist. The hub has a "What's moving now" module (currently "Nothing needs action this week — most ingredients are sitting in their usual range," cost-index/index.html) and a weekly-email signup; a related blog dispatch exists ("Restaurant prices are now rising faster than groceries," `/blog/restaurant-menu-inflation-2026/`, surfaced in the batch banner). But there's no repeatable, data-driven *weekly story* generated from the week's deltas — the "what's moving" block is calm boilerplate, and the rich `cost-index-history.json` + per-week trend data aren't being mined into narrative. Score 5: the channel and a one-off dispatch exist; the repeatable beat does not.

**Benchmark gap (The Pudding / FT).** The Pudding's model — a tight visual essay, fewer words, one clear question answered with data and a method note at the bottom (storybench.org, 2026) — is exactly transposable to "which three ingredients moved this week and why." FT's data desk pairs every move with a driver. Muntin has the drivers already (the "why it's moving" feed-grain/diesel block on each ingredient page).

**The Extend-Past move (asymmetric).** Stand up a **recurring, data-sourced dispatch** — "The Muntin Read" — built from the week's actual deltas + the existing driver overlay, in the blog under Don Goldstein's byline: 2–3 movers, each with direction, the public driver, and one operator action ("watch, don't re-price on one week"). A platform monetizes data by withholding the interpretation; muntin gives away the interpretation to become the cited voice. Each dispatch is a fresh, sourced, citable page that feeds AI Overviews.

**Actions.**
1. Define a repeatable dispatch template (movers + driver + action) populated from the week's `cost-index.json` deltas and the per-ingredient "why it's moving" data. (M × 5)
2. Make the hub "What's moving now" module data-driven (top movers by |trend|), not calm boilerplate, regenerated each refresh. (M × 4)
3. Publish under the **Don Goldstein** blog byline (blog canon — first-person narrator), with `viz-bars`/`viz-spark` figures meeting the article-graphics gate. (M × 3)
4. Mine `cost-index-history.json` for occasional "the year in ribeye" longer reads (pairs with brief 45's history export). (M × 3)
5. Wire each dispatch into the weekly email already collected on the hub; EN↔ES parity. (M × 3)

**Risks & honesty-gate notes.** Blog dispatches ship under Don Goldstein (singular operator bio — full-time FOH at Tacombi, Bethesda; never imply multiple restaurants). Every number must be a sourced/derived value or labeled illustrative — and because the dispatch may get audio, the audio-fabrication gate will read it aloud in six languages, so zero invention and numeric parity with the source article. "Association, not cause" framing for drivers (already the ingredient-page standard). New figures need `data-audio-alt` ≥ 80 + `<figcaption>`.

**One proof metric.** Weekly dispatch cadence sustained (≥ 90% of weeks) with measured email open-rate and per-dispatch backlinks/AI-Overview appearances.


## Domain VII — Performance & Core Web Vitals

> Positioning Council batch, Domain VII (briefs 49–55). Strategy only — no live-site edits. Every number is repo-sourced (cited to file), web-sourced (labeled + dated), or marked *illustrative / analyst assessment*. No Lighthouse/CWV field number below is presented as measured unless it is quoted from `lighthouserc.js` (PR #243 lhci run, median of 3, 2026-05-03). Operator bio is singular throughout. Slugs are treated as final-forever; no rename is ever proposed.

**Asymmetric thesis for the domain.** The operator reads this on a cheap phone, on bad restaurant wifi, mid-shift. A static, no-framework, zero-third-party-JS site on Cloudflare's edge can be *faster and more resilient* than any JS-heavy SaaS (Toast/Wix/Yelp), and a giant cannot strip its own tracking/ads/framework to catch up. Speed + offline resilience **is** the positioning, not a footnote to it.

**Repo baseline (the honest starting line).** lighthouserc.js records the only measured numbers we have — PR #243 lhci, mobile, Slow 4G + 4× CPU, median of 3, 2026-05-03: perf **0.73–0.79**, LCP **4.4s–6.0s** (worst 5953ms on `/`), CLS **0.00–0.07**, 1 render-blocking resource (the single legacy `site.css`), a11y gate ≥0.95, SEO gate =1.00. Launch-plan targets sit commented in the same file: perf ≥0.90, LCP ≤2000ms, CLS ≤0.05, TBT ≤200ms, bootup ≤1500ms, render-blocking =0. The architecture to *hit* those targets already shipped (CSS shell split, font preload + fallback metrics, AVIF/WebP pipeline, lazy JS loader); the gate just hasn't been re-measured and re-tightened. **That gap — built but not re-measured — is the through-line of this domain.**

---

### 49 · Performance Engineer (CWV)

**Aspect & why it decides success.** LCP/INP/CLS at p75 mobile is the rank-and-trust substrate: it gates the SEO the whole studio runs on, and it is the one axis where a one-person static shop can provably out-perform a national SaaS. If the operator's own phone renders this faster than the Toast site next door, the pitch closes itself.

**Current-state audit — 7/10.** Strong bones, stale measurement. The async-CSS swap, four-font preload with `size-adjust`/`ascent-override` fallback faces (`tools/margin-math/index.html` head, lines 84–146), and `requestIdleCallback` JS deferral (`scripts/inject-lazy-script-loader.mjs`) are exactly the right LCP/INP moves. But the *enforced* gate in `lighthouserc.js` is still the "do-not-regress" baseline (perf ≥0.70, LCP ≤6500ms) — the build passes at 4.4–6.0s LCP. INP is **not gated at all** (Lighthouse lab uses TBT ≤800ms as a proxy; `lighthouserc.js` lines 126). web.dev sets the p75 pass bars at LCP ≤2.5s, **INP ≤200ms**, CLS ≤0.1 (web.dev, "Core Web Vitals," current as of 2026-01; INP replaced FID as a Core Web Vital on 2024-03-12). We are gating to ~2.6× the LCP target and not watching the metric Google now counts.

**Benchmark gap (Toast / BentoBox restaurant sites).** Restaurant-SaaS template sites routinely ship third-party tag managers, chat widgets, and hydration bundles that push mobile LCP past 4s and INP past 200ms in the field. Our floor is *structurally* lower because there is no third-party script on the critical path (`scripts/check-no-third-party-plausible.mjs` makes that a CI invariant). The gap is that we don't *prove* it — no field data, no CrUX, no public scorecard.

**The Extend-Past move.** Stop gating to yesterday's baseline and publish the result. Re-measure with the shipped optimizations, tighten `lighthouserc.js` to the commented launch targets, and surface the score as a positioning asset ("measured on a throttled phone, here's the number") that a SaaS literally cannot replicate without removing its own revenue tags.

**Actions.**
1. Re-run lhci on the current Pages preview; record fresh median-of-3 in a dated comment in `lighthouserc.js`. **S × 5** — unblocks every other decision in this domain.
2. Tighten the enforced block toward targets in one step the new run supports (start LCP ≤4000ms, TBT ≤500ms; ratchet from there). **S × 4**
3. Add a field-data INP guard: a tiny inline `PerformanceObserver` that pipes the existing Plausible custom-event channel (`/api/event`, already same-origin) a bucketed INP rating only — never raw timings, PII-clean. **M × 4**
4. Promote `render-blocking-resources` from `warn` to `error` once the legacy single-`site.css` path is confirmed dead in `dist/` (shells already split). **S × 3**
5. Add a CrUX/PageSpeed snapshot to the deploy log via the PSI proxy the site already runs (`/api/psi`, `wrangler.jsonc`). **M × 3**

**Risks & honesty-gate notes.** Do **not** publish a "Lighthouse 100" or specific CWV badge until a fresh run measures it — current honest numbers are 0.73–0.79 perf / 4.4–6.0s LCP (`lighthouserc.js`). Ratchet gates gradually or you wedge CI on an un-fixed metric. INP beacon must ship bucketed ratings only to stay inside the `/never/` privacy contract.

**One proof metric.** p75 mobile **INP ≤ 200ms** and **LCP ≤ 2.5s** on the lighthouserc URL set (web.dev pass bars), measured — not assumed.

---

### 50 · Critical-Path / CSS Specialist

**Aspect & why it decides success.** First paint on a $50 phone on 3G is the whole "faster than the giant" claim made literal. Critical CSS, font strategy, and cache-busting decide whether the operator sees text in <1s or stares at a white screen on the line.

**Current-state audit — 8/10.** Best-in-class for the category. `scripts/build-css-shells.mjs` partitions the 6,342-line monolith into core/tool/article shells via in-file `@shell:` markers, with a round-trip + cascade-safety gate (`scripts/check-css-shells.mjs`: rule-multiset equality, no selector in core *and* a supplemental shell, build-freshness — all fail-CI). Production ships minified shells via lightningcss in `dist/` (`scripts/minify-css.mjs`, header claims ~60–65% reduction; *that 60–65% is the script's own stated expectation, not an independently measured figure*). Critical CSS (~600 bytes, per the head comment) is inlined; the main shells load via `<link rel="preload" … onload="this.rel='stylesheet'">` with a `<noscript>` fallback (`tools/margin-math/index.html` lines 140–146). Fonts: variable Fraunces + Inter woff2 preloaded with `Fraunces Fallback`/`Inter Fallback` metric-matched faces (lines 87–92) — a genuine CLS-killer. Cache posture is deliberate: CSS/JS on 1-day TTL + 7-day stale-while-revalidate because filenames aren't fingerprinted, fonts on 30-day immutable because the woff2 names embed a version stamp (`_headers` lines 50–60).

Real shell sizes today (raw / gzip, pre-minify, measured via `wc -c` + `gzip -c`): site-core 244KB / **61.5KB**, site-tool 41KB / **10.4KB**, site-article 177KB / **41.8KB**. A tool page ships core+tool (~72KB gz pre-minify); an article ships core+article (~103KB gz pre-minify). Minification in `dist/` cuts this further but is *not* separately measured here.

**Benchmark gap (Google web.dev "Extract critical CSS" guidance).** Google/Cloudflare recommend inlining only above-the-fold CSS and deferring the rest — which the site does. The gap is *core shell heft*: 61.5KB gz of "every page needs this" is large for a critical-adjacent payload, and the inline critical block is hand-maintained (~600 bytes) rather than route-extracted.

**The Extend-Past move.** Shrink the core shell from "everything shared" toward "everything *above the fold* shared," and let `content-visibility` defer the rest of the render cost (see brief 54). The async swap already prevents render-blocking; the next win is parse/layout cost of a 61.5KB core, not download.

**Actions.**
1. Audit `@shell:core` sections for rules only ever used below the fold or on one template; reclassify into tool/article shells (cascade gate protects you). **M × 4**
2. Add a `--check` size-budget assertion to `check-css-shells.mjs` (e.g. fail if core gz > 60KB) so the core shell can't silently bloat. **S × 4**
3. Generate the inline critical block from a route-level extraction step rather than hand-curation, keyed off the existing `inject-critical-*` scripts. **L × 3**
4. Verify `dist/` minified shell sizes in the deploy log and record them once, so the "60–65%" claim becomes a measured number, not an estimate. **S × 3**

**Risks & honesty-gate notes.** The shell round-trip invariant only holds on *unminified* `assets/` source — never minify in place; `minify-css.mjs` correctly operates on `dist/` only. The "~60–65% reduction" and "~600 byte critical CSS" are the scripts'/comments' own figures (`minify-css.mjs` header; `tools/margin-math/index.html` line 53) — labeled as such, not independently verified here.

**One proof metric.** First Contentful Paint **< 1.5s** on emulated 3G / 4× CPU (Lighthouse), with core-shell gzip held **≤ 60KB** by the new budget gate.

---

### 51 · Image / Media Optimizer

**Aspect & why it decides success.** On a restaurant site ~80% of bytes are images (`scripts/check-lazy-images.mjs` header). Zero CLS and the smallest payload in the category is a category-defining claim — and the cheapest LCP win available.

**Current-state audit — 8/10.** The pipeline is real and gated three ways. `scripts/build-image-formats.mjs` encodes AVIF (q50) + WebP (q75) siblings for every PNG/JPG (~33MB raster inventory, 18 sources per its header; the bio portrait alone is 5.8MB pre-encode), `--check` mode fails CI if any sibling is missing and needs no `sharp` at deploy time. `scripts/check-image-dimensions.mjs` is **fail-CI** (`WARN_ONLY=false`, line 36) — every shipping `<img>` carries width+height or an aspect class, the single highest-leverage CLS fix. `scripts/check-lazy-images.mjs` is **fail-CI** too — below-fold images must carry `loading="lazy"` + `decoding="async"`. `<picture>` wrapping is injected by `inject-picture-tags.mjs` (in the build chain, `wrangler.jsonc`). The measured CLS baseline already reflects this: **0.00–0.07** (`lighthouserc.js`), and `unsized-images` / `image-aspect-ratio` are strict gates.

**Benchmark gap (Vercel / Cloudinary responsive image delivery).** Vercel/Cloudinary serve *per-request* device-width-resized images via a URL transform layer. We ship pre-built AVIF/WebP at source resolution — smaller format, but not per-viewport `srcset` width descriptors. A 5.8MB source portrait re-encoded is still one size for a 360px phone and a 1440px desktop. No measured `fetchpriority="high"` on the LCP image either (`grep` of `tools/margin-math/index.html`: 0 hits).

**The Extend-Past move.** Add responsive `srcset`/`sizes` width variants to the static pipeline (build-time, not edge-runtime) so a $50 phone downloads a phone-sized hero — matching Cloudinary's *outcome* with zero runtime cost and zero third-party dependency. Then mark the LCP image `fetchpriority="high"`.

**Actions.**
1. Extend `build-image-formats.mjs` to emit 2–3 width variants (e.g. 480/960/1440) per source and have `inject-picture-tags.mjs` write `srcset`+`sizes`. **L × 5**
2. Add `fetchpriority="high"` to the single above-the-fold LCP `<img>`/`<source>` per page (small, surgical). **S × 4**
3. Add a `--check` byte-ceiling to `build-image-formats.mjs` (fail if any shipped AVIF > N KB) so a re-added 5.8MB-class source can't regress LCP. **S × 4**
4. Confirm AVIF/WebP `Content-Type` is served correctly from `dist/` (image `_headers` rules are by directory, not extension — verify the encoded siblings inherit a sane cache). **S × 3**

**Risks & honesty-gate notes.** CLS 0.00–0.07 is *measured* (`lighthouserc.js`); the "80% of bytes are images" and "~33MB / 18 sources / 5.8MB portrait" figures are the scripts' own headers — labeled, not re-counted here. Width-variant generation multiplies committed binary count; keep the mtime-skip in `build-image-formats.mjs` so re-runs stay fast.

**One proof metric.** Largest hero **transfer ≤ 100KB** on a 360px viewport (AVIF, smallest width variant), CLS held **≤ 0.05**.

---

### 52 · Edge / CDN Architect

**Aspect & why it decides success.** Sub-100ms TTFB worldwide is the part of "faster than the giant" a one-person shop gets *for free* from Cloudflare's edge — but only if caching, headers, and the Worker fall-through are tuned so the edge actually serves cached HTML instead of waking the Worker on every hit.

**Current-state audit — 7/10.** Deployed on Cloudflare Workers Static Assets (`wrangler.jsonc`: `main: ./src/worker.js`, `assets.binding: ASSETS`, `run_worker_first: true`). HTML carries `s-maxage=3600` edge cache + `stale-while-revalidate=86400` (`_headers` lines 155–165); static assets get long immutable caches; security headers (HSTS preload, tight CSP, `X-Frame-Options: DENY`, `interest-cohort=()`) apply to every response. `observability.enabled` is on. Per-locale `Content-Language` is set with correct rule ordering. The retired tools return HTTP 410 via `_redirects` (3 rules).

The friction: **`run_worker_first: true`** means the Worker is invoked ahead of the asset server for *every* request, not just `/api/*`. The Worker then falls through to `env.ASSETS.fetch()` for non-API paths — correct, but it puts JS execution in front of every static HTML hit, which can erode the pure-edge TTFB the architecture promises. A `*/5` cron and Durable-Object rate limiter add steady-state account activity but don't touch request TTFB.

**Benchmark gap (Cloudflare / Fastly edge-cache best practice).** Cloudflare's own guidance is to let Static Assets serve cacheable routes directly and reserve the Worker for dynamic paths (Cloudflare Workers docs, "Static Assets" + `run_worker_first`, current as of 2026-01). Fastly's model is similarly "compute only when you must." Running the Worker first on every request is the opposite default.

**The Extend-Past move.** Make the static path *pure edge* — scope Worker-first execution to `/api/*` (and the few flagged dynamic surfaces) so HTML/CSS/JS/fonts are served by Static Assets without a Worker hop, then prove a sub-100ms cached TTFB. A SaaS origin-server stack cannot match an edge-cached static asset's TTFB.

**Actions.**
1. Evaluate scoping `run_worker_first` to API/dynamic routes only (Cloudflare supports route-scoped worker-first); keep `env.ASSETS` fall-through for everything else. **M × 5**
2. Add a deploy-time TTFB probe (curl `-w '%{time_starttransfer}'` against the Pages preview for `/`, an article, a tool) and log it. **S × 4** — converts "sub-100ms" from claim to measurement.
3. Confirm HTML `s-maxage=3600` is actually honored at the edge for cacheable GETs once worker-first is scoped (the cron/DO traffic shouldn't bust HTML cache). **S × 3**
4. Document the edge-cache + SWR posture as a public resilience claim only after the TTFB probe confirms it. **S × 3**

**Risks & honesty-gate notes.** "Sub-100ms TTFB worldwide" is currently an **architectural target, not a measured value** — no TTFB number exists in the repo. Changing `run_worker_first` touches the request path for the whole site; validate `/api/*`, forms, and the Window flows on a preview before merge. Don't claim a global TTFB figure without multi-region measurement.

**One proof metric.** Edge-cached **TTFB < 100ms** (cache HIT) for a static HTML route, measured from at least two regions.

---

### 53 · JS-Budget Minimalist

**Aspect & why it decides success.** The tools are the studio's main JS surface and its lead magnet; the asymmetric bet is "rich client-side tools at near-zero JS tax." If the tools stay rich but the bytes/main-thread cost stays low, we get islands-architecture outcomes with no framework and no hydration.

**Current-state audit — 8/10.** Already an islands architecture in spirit, hand-rolled. Site-wide JS is lazy: `assets/site.js` (64KB raw / **19.6KB gz**, measured) and `assets/p.js` (6KB) load via `requestIdleCallback` *after* the `load` event (`scripts/inject-lazy-script-loader.mjs`), directly fixing the "page renders but I can't tap anything for seconds" main-thread-block symptom its header describes. Tool logic is per-page and modest: `tools/margin-math/margin-math.js` is 27KB / **8.6KB gz** plus `cascade.js` 8.6KB. No framework, no hydration runtime, no third-party script on the critical path (CI-enforced by `check-no-third-party-plausible.mjs`). Tools are deliberately unminified and View-Source-readable as a privacy proof (margin-math JSON-LD FAQ, `tools/margin-math/index.html` line 41).

The watch-item: `tools/_shared/` is large and growing — `cost-index-ui.js` alone is **63.9KB raw**, and several cost-* modules are 13–25KB. Whether a given tool page pulls one or many of these decides its real JS budget. There is **no enforced per-page JS-byte gate** (Lighthouse `bootup-time` ≤4000ms / `mainthread-work-breakdown` ≤6000ms in `lighthouserc.js` are generous regression catches, not budgets).

**Benchmark gap (Astro / Svelte islands).** Astro ships zero JS by default and hydrates only interactive islands; Svelte compiles components to small imperative JS (Astro docs "Islands architecture"; Svelte docs — both current as of 2026-01). Our hand-rolled equivalent matches the *philosophy* but lacks their tree-shaking and per-route budget enforcement — a tool that imports five `cost-*` modules has no guardrail.

**The Extend-Past move.** Keep the no-framework, readable-source posture (it's a privacy feature a framework can't offer) and bolt on the *one* thing frameworks give you that we lack: an enforced per-page JS-transfer budget, plus on-demand `import()` so a tool only pays for the modules it actually runs.

**Actions.**
1. Add `check-js-budget.mjs` to the check-all chain: sum the JS a page references, fail if transfer-est exceeds a per-template ceiling (e.g. tool ≤ 60KB gz incl. shared). **M × 5**
2. Convert heavy optional `tools/_shared/*` modules (e.g. `cost-index-ui.js` 63.9KB) to dynamic `import()` fired on first interaction, not at parse. **L × 4**
3. Tighten `bootup-time`/`mainthread-work-breakdown` in `lighthouserc.js` toward the commented targets (1500ms / 2500ms) once #1 holds. **S × 3**
4. Keep tools unminified for View-Source auditability, but gzip is what ships — document the raw-vs-gz distinction so "small JS" claims cite gz. **S × 3**

**Risks & honesty-gate notes.** The lazy-load `requestIdleCallback` pattern delays interactivity by design — fine for analytics/site chrome, but verify tool *inputs* themselves aren't gated behind the idle callback on the heaviest tool. JS sizes above are repo-measured raw + gz; don't quote raw as the "download cost." No INP field number is claimed.

**One proof metric.** Per-page JS **transfer ≤ 60KB gz** (tool template, shared included), enforced by a fail-CI budget gate.

---

### 54 · Mobile-Performance Specialist

**Aspect & why it decides success.** The operator *is* on a phone, on the line — this is the literal use-case, not a persona. "Native-app feel without an app" (instant taps, no layout jump, install-to-home-screen) is the difference between a tool used mid-shift and a tab closed in frustration.

**Current-state audit — 7/10.** The mobile fundamentals are in place: viewport meta, fixed-nav min-height reservation in critical CSS (`tools/margin-math/index.html` line 70 + 82), Turnstile widget min-height reservation called out in `lighthouserc.js` (lines 109–124) to stop the form CLS, 44px touch targets on actions (`.mm-action{min-height:44px}`, line 314), and a `prefers-color-scheme: dark` block inline so dark-mode users don't flash light (line 132). The lhci gate *is* mobile-first by design (Slow 4G + 4× CPU, the launch plan's explicit scenario). A PWA manifest exists (`brand/favicons/site.webmanifest`: standalone, theme `#1F4E5B`, 192/512 icons, scope `/`) and a no-op service worker (`course/sw.js`) already satisfies iOS "Add to Home Screen" for the bootcamp.

Two gaps. (1) **`content-visibility` is used only in the inline critical block** (`.below-fold-island{content-visibility:auto;contain-intrinsic-size:auto 1200px}`) — `grep` finds **0** occurrences in `assets/site.css` proper, so below-fold render-skipping isn't applied site-wide where it would most help a slow mobile CPU. (2) Install-to-home-screen is scoped to `/course/` only; the tools the operator actually opens mid-shift aren't installable.

**Benchmark gap (PWA leaders — e.g. Starbucks/Twitter Lite-class web apps).** PWA leaders deliver app-shell instant loads + installability across the whole app. We have the manifest and an installability SW, but only the bootcamp is wired, and we don't yet apply `content-visibility` to make long article/tool pages cheap to render on a weak CPU.

**The Extend-Past move.** Extend installability + `content-visibility` from the bootcamp to the *tools* — the surface the operator uses on the line — so Margin Math feels like a home-screen app that paints instantly even on a throttled phone. This is the "native-app feel without an app" claim made real on the highest-value surface.

**Actions.**
1. Apply `content-visibility:auto` + `contain-intrinsic-size` to below-fold sections in `assets/site.css` (article body sections, tool secondary panels), not just the one inline island. **M × 5**
2. Wire the existing no-op SW + manifest to `/tools/*` so tools are installable to home screen (keep it no-op — no fetch caching unless brief 55 lands). **M × 4**
3. Add a maskable PWA icon (`purpose:"maskable"`) to `site.webmanifest` for clean Android adaptive icons. **S × 3**
4. Audit tap targets across tool controls for the 44px floor (already met on `.mm-action`; verify sliders/segmented buttons). **S × 3**

**Risks & honesty-gate notes.** `content-visibility` can shift the scrollbar / break in-page anchor jumps if `contain-intrinsic-size` is mis-estimated — test with the H2-anchor links the build injects. Installability ≠ offline: do not imply the tools work offline by making them installable; that claim belongs to brief 55 and must stay aligned with `data/security-claims.json`. The no-op SW posture is deliberate (`course/sw.js` header) — keep it no-op until 55 explicitly changes it.

**One proof metric.** Total Blocking Time **≤ 200ms** on the mobile lhci profile for `/tools/margin-math/`, with install-to-home-screen working on iOS Safari + Android Chrome.

---

### 55 · Resilience / Offline Engineer

**Aspect & why it decides success.** Bad restaurant wifi is the named enemy. A tool that *works when the connection doesn't* is the single most defensible position against any cloud SaaS — Toast/Wix/Yelp are useless on a dead connection; a static client-side calculator need not be. This is where "resilience IS positioning" stops being a slogan.

**Current-state audit — 4/10.** This is the domain's biggest opportunity and the prompt's premise needs one correction: a service worker **does** exist, but it is *deliberately a no-op* — `course/sw.js` (and `es/course/sw.js`) has **no `fetch` handler**, caches nothing, and exists only for iOS installability; its header explicitly states "does NOT cache lessons, does NOT serve content offline." So there is **no offline caching layer anywhere on the site**, and that is a documented, intentional posture (cross-referenced in `data/security-claims.json` per the SW header). The good news already banked: the tools are pure client-side math with no `fetch()` on calculation (`tools/margin-math` JSON-LD: "no fetch, no storage, no account") — so *once a tool page is loaded, the math already works offline*. The missing piece is **getting the page to load at all** on a dead connection (the HTML/CSS/JS shell), which today requires a live network request.

**Benchmark gap (Workbox / Google offline patterns).** Google/Workbox's standard is an app-shell precache + stale-while-revalidate runtime caching so the shell loads instantly and offline (web.dev "Offline cookbook" / Workbox docs, current as of 2026-01). We have SWR at the *HTTP edge* (`_headers`) but no *service-worker* runtime cache, so a fully-offline cold load fails.

**The Extend-Past move.** Add a precache-only service worker that caches the static shell (HTML + the three CSS shells + site.js + tool JS + fonts) for the tools and key library pages, so the operator on dead wifi still opens Margin Math and runs the numbers. Crucially: precache static assets *only*, never `/api/*` or analytics — preserving the privacy posture while delivering the resilience claim. This is the move a tracking-funded SaaS cannot copy: it can't cache an app that depends on a live ad/analytics/POS backend.

**Actions.**
1. Replace the no-op `course/sw.js` pattern with a Workbox-style **precache + cache-first-for-static, network-only-for-/api/** SW, scoped first to `/tools/*`. **L × 5** — this *is* the positioning.
2. Update `data/security-claims.json` and the privacy prose *in the same change* so the "no offline cache" claim becomes an accurate "static assets cached for offline; your numbers and analytics never are." **M × 5** (honesty-gate critical)
3. Add an offline fallback page (cached) and an `online`/`offline` status chip on tools so the operator knows the math is running locally. **M × 4**
4. Add a CI check that the SW's precache list never includes `/api/*`, `/assets/p.js`, or PII surfaces — a privacy guard mirroring `check-no-third-party-plausible.mjs`. **M × 4**
5. Version the SW precache by the same content-hash the CSS cache-bust uses, so a stale shell can't pin forever (mirror the `_headers` "1-day TTL because filenames aren't fingerprinted" reasoning). **M × 3**

**Risks & honesty-gate notes.** **Highest honesty-gate stakes in the domain.** A caching SW directly contradicts current public claims ("we deliberately do not pre-cache," `course/sw.js`; "no storage" in margin-math FAQ) — the claim files (`data/security-claims.json`, privacy/never pages) MUST move in the same commit or the site lies about itself. A mis-scoped SW that caches `/api/*` would be a privacy regression *and* could serve stale form/auth responses. SW cache invalidation is the classic footgun — pin to content hashes and `skipWaiting`/`clients.claim` carefully (the existing no-op SW already does both). CSP currently allows `worker-src 'self' blob:` (`_headers` line 309), so a same-origin SW is already permitted.

**One proof metric.** Cold-load `/tools/margin-math/` with the network **fully offline** (DevTools offline) → page renders and a calculation completes, with **zero** request to `/api/*` or analytics.

---

#### Cross-domain dependencies (for the Council synthesis)
- **53 → 54 → 55 are a chain.** The per-page JS budget (53) and `content-visibility` (54) must land *before* the offline SW (55) precaches the shell — otherwise the SW pins an oversized, render-expensive bundle into every operator's cache.
- **55 ↔ Privacy/Trust domain.** The offline-cache move (55) cannot ship without coordinated edits to `data/security-claims.json` and the `/never/` + privacy prose — this is a hard dependency on whichever domain owns the privacy canon, not an isolated perf change.
- **52 ↔ 49.** Scoping `run_worker_first` to `/api/*` (52) is a prerequisite for the sub-100ms edge-TTFB claim that feeds the measured-LCP story (49); both also depend on the same fresh lhci/TTFB measurement pass.


## Domain VIII — Accessibility & Inclusive Design

> Positioning Council, Batch VIII. Strategy briefs only — no live-site edits.
> The asymmetric thesis: the real reader is an immigrant, Spanish-first, often
> low-digital-literacy operator on a phone mid-shift with tired eyes.
> Accessibility + plain language + true ES parity is not compliance here — it is
> the only way to reach the restaurant workforce that ad-density platforms design
> past. We push toward WCAG AAA *where feasible* as a values proof those platforms
> structurally can't match.
>
> **Honesty-gate posture for this whole domain.** The site's published target is
> **WCAG 2.2 AA** (`accessibility.html`, `dateModified` 2026-05-01; `course/accessibility/index.html`).
> No AAA conformance is claimed anywhere, and these briefs do not claim one. All
> contrast figures below are computed (zero-dep, WCAG 2.x formula) from the live
> token values in `data/muntin.tokens.json` / `assets/site.css`, reproducing the
> method in `scripts/check-contrast.mjs`. Everything else is labeled repo-sourced,
> web-sourced (with date), or "illustrative / analyst assessment."
>
> **Standards sources (retrieved 2026-06-16).** WCAG 2.2 became a W3C
> Recommendation Oct 2023; AA contrast 4.5:1 normal / 3:1 large, AAA 7:1 normal /
> 4.5:1 large (W3C SC 1.4.3 / 1.4.6; WebAIM, Contrast & Color). Target Size:
> 2.5.8 Minimum = 24×24 CSS px (AA); 2.5.5 Enhanced = 44×44 CSS px (AAA) (Deque
> University WCAG 2.2; TestParty). Apple HIG: 44×44 pt minimum hit target
> (developer.apple.com/design/human-interface-guidelines). GOV.UK content design:
> write for reading age ~9, sentences < 20 words (ONS Service Manual; Home Office
> Design System, Readability).

---

### 56 · Accessibility Lead (WCAG 2.2 AA → AAA)

**Aspect & why it decides success.** Whether the site's *stated* standard
(AA) and its *actual* build stay locked together — and whether we can credibly
narrate selective AAA wins as the values proof. If the statement over-claims, the
honesty gate that defines the brand is the thing we broke.

**Current-state audit (score 7.5/10).** Real strengths, repo-verified:
`accessibility.html` is a genuine public statement with a 2-business-day SLA, a
"short version" plain-language callout, and an honest "Known Limitations" section;
`course/accessibility/index.html` carries a per-feature status table (ok/partial/gap)
— this is mature posture, not boilerplate. Two enforced contrast gates run in CI
(`check-contrast.mjs`, `check-dark-contrast.mjs`) and lock token values against
drift. WCAG 2.2-specific criteria are addressed: form inputs are `min-height:44px`
(`site.css` ~L1311), `@media (pointer:coarse)` enforces 44px targets in the course
(`course/accessibility/index.html` course-mobile-css), focus-visible rings exist
globally (`site.css` L1496–1507). Gap: the AA *claim* is partly aspirational — no
repo artifact shows a full per-page 2.2 AA audit log, and "Known Limitations" lists
no specific open SCs, so it reads complete when conformance is asserted, not proven.

**Benchmark gap (GOV.UK / Apple).** GOV.UK publishes a dated accessibility
statement naming *specific* non-conformances against named SCs and target fix
dates. Ours is warmer but vaguer; it asserts "we meet 2.2 AA new criteria" without
a tested basis on file.

**The Extend-Past move.** Reframe the statement from a *claim* ("we conform to AA")
to a *ledger* ("here is every SC, its state, and where we exceed it") — the same
receipts-culture the rest of the site runs on, applied to accessibility. Layer a
named, *scoped* AAA badge ("AAA contrast + AAA target size on core reading paths")
that giants optimizing for ad density cannot honestly post.

**Actions.**
1. Build `scripts/check-a11y-ledger.mjs` + `data/a11y-conformance.json`: one row
   per 2.2 SC × surface, state in {meets/partial/gap/n-a}, evidence link. Gate warns
   if the statement's claim outruns the ledger. **(L × 5)**
2. Rewrite `accessibility.html` "Known Limitations" to render *from* that JSON, with
   dated open items (GOV.UK pattern). EN + ES parity required. **(M × 4)**
3. Add a scoped AAA self-assessment for the *reading path only* (article body +
   nav + footer), where AAA is already in reach (see Brief 58), and label it exactly
   that scope — never a blanket "AAA site." **(M × 5)**
4. Wire the ledger check into `check-all.mjs` so the claim can never silently
   exceed reality. **(S × 4)**

**Risks & honesty-gate notes.** The single largest risk in this whole domain is
claiming an AAA level we have not tested across all SCs — AAA includes non-contrast
SCs (sign language, extended audio description, reading level) we have NOT verified.
Every badge must name its scope. Do not let the rewrite imply the *client work* is
AAA; the statement covers the site.

**One proof metric.** % of WCAG 2.2 SCs with a state + evidence link in
`a11y-conformance.json` (target: 100% logged, even where the state is "gap").

---

### 57 · Screen-Reader / AT Specialist

**Aspect & why it decides success.** Whether a non-visual user — including a
low-vision operator running VoiceOver in Spanish — can *complete a task* (read an
article, run a calculator, reach Don), not just perceive that content exists.

**Current-state audit (score 7/10).** Unusually strong for a static site.
Every content figure carries a `data-audio-alt` written as full narration
(≥80 chars, gate-enforced) plus a `<figcaption>` — verified live in
`library/third-party-delivery-comparison/index.html` and four other articles. This
is a deliberate non-visual layer most sites lack. The Margin Math tool is
well-scaffolded: `role="status"` + `aria-live="polite"` results region (L900),
`role="group"` labelled action sets (L882), `aria-label`s throughout
(`tools/margin-math/index.html`). Nav (`_includes/nav.html`) has a skip link,
`aria-label`ed landmarks, `aria-expanded`/`aria-controls` on the menu toggle,
`.sr-only` " (opens in new tab)" on the Instagram link, and `aria-hidden` on
decorative SVGs/pulses. Gaps: `data-audio-alt` is a *custom* attribute — it feeds
the audio pipeline, NOT assistive tech, so a screen reader never reads it; the
visual `<figcaption>` is the only AT-exposed description, and complex viz-* figures
(trees, waterfalls) may under-describe for AT. No evidence of a documented
VoiceOver/NVDA pass; `aria-live` politeness on rapidly-updating calc fields can
over-announce.

**Benchmark gap (GOV.UK / VoiceOver).** GOV.UK ships components with documented
screen-reader test notes per AT (VoiceOver/JAWS/NVDA) and a known-issues list. We
have the markup discipline but not the *tested-with* evidence.

**The Extend-Past move.** We already author full prose narration for every figure
(the `data-audio-alt`). Bridge that asset into AT: give complex figures a visually
hidden long-description that screen readers actually reach — turning our audio
investment into a genuine non-visual *equivalence*, not two parallel layers.

**Actions.**
1. For complex viz-* figures, add an AT-reachable description (`aria-describedby` →
   `.sr-only` block, or `<figcaption>` carrying the full takeaway) so SR users get
   the same content the audio track narrates. Keep body text OUT of attribute
   values (article-graphics rule 8). **(M × 5)**
2. Document a VoiceOver-on-iOS-in-Spanish + NVDA pass for the 3 core templates
   (article, tool, contact) in the conformance ledger; log findings. **(M × 4)** [ASYMMETRIC]
3. Audit `aria-live` regions for over-announcement; debounce calc output and confirm
   `aria-live="polite"` (never `assertive`) on Margin Math. **(S × 3)**
4. Verify every interactive control has an accessible name in BOTH locales (the
   `aria-label`s in `_includes/nav.html` are English-only literals — confirm the ES
   nav partial localizes them). **(S × 4)** [ASYMMETRIC]

**Risks & honesty-gate notes.** `data-audio-alt` must never be conflated with alt
text in any claim — it is narration for the MP3 pipeline, invisible to AT. Don't
state "screen-reader tested" until a logged pass exists. ES `aria-label`s are a
parity item, not optional polish.

**One proof metric.** Task-completion rate in a logged VoiceOver(ES)/NVDA pass
across the 3 core templates (target: 3/3 templates complete end-to-end, 0 blockers).

---

### 58 · Contrast / Vision Specialist

**Aspect & why it decides success.** Whether the brand palette is legible for a
tired operator on a sun-glared phone — and whether we can push the *reading path*
to AAA contrast without abandoning the financial-grade slate+blue identity.

**Current-state audit (score 8/10).** Two CI gates already lock AA in both
themes (`check-contrast.mjs`, `check-dark-contrast.mjs`); dark mode is a principled
token-flip, not an allowlist (`scripts/build-dark-mode.mjs`). Computed ratios from
live tokens (WCAG 2.x; method per `check-contrast.mjs`) — the load-bearing finding
is that the body reading path is **already at AAA**, while the *accent* is the one
thing standing between us and an AAA reading-path claim:

| Pair (light) | Ratio | AA (4.5) | AAA (7) |
|---|---|---|---|
| ink `#16181D` on cream `#F6F7F8` | **16.56:1** | pass | pass |
| ink-soft `#4A4F59` on cream | **7.67:1** | pass | pass |
| teal `#2A50C8` on cream (links) | **6.36:1** | pass | **MISS** |
| teal-dark `#1F3A93` on cream | **9.39:1** | pass | **pass** |
| stone `#6B7280` on cream | 4.51:1 | pass | miss |
| rust `#C42E2E` on cream | 5.18:1 | pass | miss |

Dark mode: ink `#F1EDE5` on `#16181D` = **15.21:1** (AAA); teal `#7AA7FF` on bg =
**7.44:1** (AAA), but on raised cards `#1B1E24` = **7.00:1** — exactly at the AAA
line, i.e. fragile. The course page already ships `@media (prefers-contrast:more)`
to darken body text and invert table headers — a real high-contrast affordance.

**Benchmark gap (WCAG / Stark).** Stark-style audits flag "passes AA, fails AAA"
per element. Our links (`#2A50C8`, 6.36:1) and dark-mode card accent (7.00:1) are
exactly those near-miss cases. We already *own* an AAA-grade blue: `teal-dark`
`#1F3A93` at 9.39:1.

**The Extend-Past move.** Promote the existing AAA-grade `teal-dark` to the
default link/accent-*text* color on reading surfaces (keep `#2A50C8` for large
UI/fills where 3:1/4.5:1 large-text thresholds already pass). One token reassignment
moves the entire body reading path from "AA" to a defensible "AAA contrast,"
brand-intact — a values claim ad-optimized sites won't make because denser palettes
sell better.

**Actions.**
1. On reading surfaces, switch link/accent-text to `teal-dark` `#1F3A93` (9.39:1);
   reserve `#2A50C8` for large text and component fills. Regenerate via the token
   build so both gates re-verify. **(M × 5)** [ASYMMETRIC]
2. Nudge the dark-mode card accent off the 7.00:1 knife-edge (e.g. toward the
   `#9DBEFF` hover token, ~higher ratio) so AAA holds with margin; update the
   `DARK` map in `build-dark-mode.mjs` and re-run `check-dark-contrast.mjs`. **(S × 4)**
3. Extend `check-contrast.mjs` with an AAA tier (7:1 reading path) emitted as a
   *report* line, plus a hard fail for the reading-path link token specifically. **(M × 5)**
4. Propagate `@media (prefers-contrast:more)` from the course page to the global
   stylesheet (boost `stone`/`ink-soft` to `ink`, strengthen hairlines). **(M × 4)**
5. Add a non-color status channel everywhere status color is used (icon/text), so
   color-blind operators aren't reliant on the green/amber/red `ok/partial/gap`
   cells. **(S × 4)**

**Risks & honesty-gate notes.** Claim AAA only for the *named reading path*, not
the whole UI — large text and fills legitimately sit at AA thresholds and that's
compliant, not a defect. `stone` at 4.51:1 is a real AA floor: do not use it for
long-form body copy. Re-pigment must not break the tokens-parity guard with the
Ledger product (`check-tokens-parity.mjs`); `teal-dark` is already an
editorial-specific token, so reassigning its *usage* is safe.

**One proof metric.** % of reading-path text/link pairs (article body, nav, footer)
at ≥7:1 in both themes (target: 100%, up from links currently at 6.36:1).

---

### 59 · Cognitive-Load / Plain-Language Lead

**Aspect & why it decides success.** A stressed, low-digital-literacy operator
reading on a phone mid-shift abandons anything that feels like homework. Clarity is
the difference between "this helped" and a closed tab — in BOTH languages.

**Current-state audit (score 6.5/10).** The voice canon already bans jargon and
governs CTA language (`/methods/` #voice-contract; `docs/voice-canon-*.md`), and
the accessibility statement's "short version" callout is a model plain-language
pattern. The glossary (150 terms) + autolink system means jargon is *defined*
in-context. But there is no *measured* readability floor: no gate checks sentence
length or reading grade, and the financial subject matter (prime cost, break-even,
commission tiers — see Margin Math FAQ) trends well above GOV.UK's reading-age-9
target. The Spanish surfaces inherit English sentence structure via translation,
which often *raises* complexity rather than lowering it.

**Benchmark gap (GOV.UK plain English).** GOV.UK writes for reading age ~9,
sentences < 20 words, simple words over complex (ONS Service Manual; Home Office
Readability, retrieved 2026-06-16). We have a banned-words list but no
reading-level target and no measurement.

**The Extend-Past move.** Make plain language *measured*, not just aspirational —
a warn-first readability gate keyed to the actual audience, applied to ES on its own
terms (Spanish readability metric, not an English one applied blindly). Lead each
long article and tool with a GOV.UK-style "short version" summary box, mirrored in
ES, so an exhausted reader gets the answer before the depth.

**Actions.**
1. Add `scripts/check-readability.mjs` (warn-first): flag article/tool intros and
   the accessibility/legal pages above a target grade; report sentence-length
   outliers (>25 words). Tune thresholds to subject matter, not a blanket 9. **(L × 4)**
2. Standardize a "short version" summary box at the top of long library articles +
   each tool, EN and ES, ≤ 3 sentences (extends the existing `accessibility.html`
   pattern). **(M × 5)** [ASYMMETRIC]
3. Run the ES readability check with a Spanish-appropriate metric (e.g.
   Fernández-Huerta / INFLESZ family) — never score Spanish with an English
   formula. **(M × 4)** [ASYMMETRIC]
4. Add a "define-on-first-use" lint: any glossary term's first article appearance
   should carry the autolink, so jargon is always one tap from a definition. **(S × 3)**

**Risks & honesty-gate notes.** Readability gate is warn-first — never auto-rewrite
prose (the voice canon and fact gate govern wording; a rewrite could strip a cited
number or break the singular-operator bio). Plain-language edits must preserve every
sourced claim and the `<details class="cite">` drawers. ES is not "English, shorter"
— it gets its own measurement.

**One proof metric.** Median reading grade of article/tool intro paragraphs, EN +
ES, trending toward the audience target (illustrative target: ≤ grade 8), tracked
per release.

---

### 60 · Motor / Tap-Target Specialist

**Aspect & why it decides success.** The operator's hands are wet, greasy, cold,
and moving; the phone is one-handed. A 24px target is "compliant"; a 44px target is
*usable* in a working kitchen. This is where AA and AAA diverge in felt experience.

**Current-state audit (score 7.5/10).** Already ahead of AA. Form inputs are
`min-height:44px` (`site.css` ~L1311); the nav hamburger is an explicit
`width:44px;height:44px` (critical CSS, `_includes/nav.html` context); the course
page enforces `@media (pointer:coarse){…min-height:44px}` across pagers, buttons,
track tiles, and bumps drag handles / palette swatches to 44–56px on small screens
(`course/accessibility/index.html`). It also pairs targets with
`prefers-reduced-motion`-gated active states. So the *44px (AAA 2.5.5)* bar is
already met in several key places — a real foundation. Gaps: the 44px discipline is
applied per-surface, not site-wide; dense link clusters (footer nav columns
`_includes/footer.html`, breadcrumb, inline body links, glossary autolinks) likely
fail 2.5.8 spacing on a phone; no gate verifies target size, so it can regress
silently like the dark-contrast bug did.

**Benchmark gap (Apple HIG / Material).** Apple HIG: 44×44 pt minimum
(developer.apple.com/design/human-interface-guidelines, retrieved 2026-06-16);
Material uses 48dp. We hit 44 in places but have no enforcement and inconsistent
coverage in dense link areas.

**The Extend-Past move.** Adopt 44px (AAA 2.5.5 Enhanced) as the *site-wide default*
for every interactive target — not the 24px AA floor — and prove it with a gate.
"Usable with greasy hands" becomes a stated, enforced standard, the opposite of
ad-dense layouts that pack tiny tappable inventory.

**Actions.**
1. Add a base rule: all `a`/`button`/`[role=button]`/form controls get a
   min 44×44 hit area site-wide (padding or `::before` hit-expansion where layout
   forbids growth). Promote the course's `@media (pointer:coarse)` block toward a
   global default. **(M × 5)** [ASYMMETRIC]
2. Build `scripts/check-tap-targets.mjs` (static heuristic over rendered HTML/CSS):
   flag interactive elements whose computed box < 24px (hard fail, AA) and < 44px
   (warn, AAA target). Wire into `check-all.mjs`. **(L × 4)**
3. Fix dense clusters: footer columns, breadcrumb, inline/glossary autolinks — add
   vertical padding / line-height so spacing meets 2.5.8. **(M × 4)**
4. Keep the mobile sticky CTA bar buttons (`mobile-cta-bar`, `_includes/footer.html`)
   ≥ 44px and confirm thumb-zone placement. **(S × 3)** [ASYMMETRIC]

**Risks & honesty-gate notes.** Don't claim "AAA target size" site-wide until the
gate is green everywhere — today it's true on the course/forms, not yet on dense
link clusters; state the scope. Hit-area expansion must not create overlapping
targets (a 2.5.8 failure of a different kind). No fabricated "tested with N
operators" claims.

**One proof metric.** % of interactive targets ≥ 44×44px site-wide per the new gate
(target: ≥ 95%; 100% ≥ 24px AA floor as the hard gate).

---

### 61 · Inclusive-Design Researcher

**Aspect & why it decides success.** This is the domain's keystone. If the design
doesn't actually fit an immigrant, Spanish-first, low-digital-literacy operator on a
phone mid-shift, every other brief optimizes for the wrong person. Reaching the real
restaurant workforce IS the differentiated market position.

**Current-state audit (score 7/10).** The infrastructure for this audience is
genuinely unusual and largely real: full EN↔ES parity on most surfaces with an
enforced gate (`check-locale-parity.mjs`, `check-hreflang-orphans.mjs`); an opt-in
Spanish banner that speaks Spanish to Spanish-browser visitors and remembers the
choice (`_includes/nav.html` `#langHint`); audio narration in six languages
(en/es/fr/it/pt/zh) so a low-literacy or eyes-busy operator can *listen*; privacy-
first, account-free, client-side tools with no sign-up wall (`tools/margin-math/`).
This is a stack designed around the thesis audience, not retrofitted. Gaps: fr/it/pt/zh
are audio-only (no text parity) — a partial, not full, inclusion for those readers;
no logged research with actual operators (everything is inferred); the ES experience
depends on translation quality that isn't measured for *clarity* (see Brief 59); and
nav `aria-label`s are English literals (Brief 57) — a parity seam.

**Benchmark gap (GOV.UK / Airbnb).** GOV.UK and Airbnb run documented inclusive-
design research with users at the margins and publish what they changed. Our
audience-fit is *designed-for* and credible, but *assumed* — no field evidence on
file, which is itself an honesty-gate exposure if we ever claim "built with
operators."

**The Extend-Past move.** Turn the implicit thesis into an explicit, evidenced
design principle: a published "who this is for" inclusive-design note + a lightweight,
privacy-clean operator-feedback loop, so the audience-fit is demonstrated, not just
asserted — the proof a platform monetizing attention can't replicate because its
actual customer is the advertiser, not the operator.

**Actions.**
1. Write a one-page inclusive-design principle (the thesis audience, the constraints:
   phone, mid-shift, ES-first, low-digital-literacy) into `docs/` as a binding design
   canon other briefs cite. **(S × 5)** [ASYMMETRIC]
2. Add a privacy-clean, no-PII feedback affordance on tools/articles ("was this
   clear?" — bucketed, client-side, no raw text stored) to gather real signal in EN
   and ES. **(M × 4)** [ASYMMETRIC]
3. Decide and *state* the fr/it/pt/zh posture: either commit to text parity or label
   them explicitly "audio-only" in the conformance ledger so the limitation is honest. **(S × 4)**
4. Recruit a small, consented operator panel (paid, disclosed) for one task-based
   usability pass in Spanish on a phone; log it for the ledger. **(L × 5)** [ASYMMETRIC]
5. Validate the opt-in Spanish banner actually fires for `navigator.languages`
   Spanish users and respects the dismiss/cookie state across the 3 core templates. **(S × 3)**

**Risks & honesty-gate notes.** Never claim "designed/tested with immigrant
operators" until a logged, consented pass exists — until then the framing is
"designed *for*," which is honest. Any feedback mechanism must stay PII-clean and
client-side to survive the privacy-first constraint and the static/Cloudflare model.
The singular-operator bio holds in any new ES copy. fr/it/pt/zh audio-only must be
labeled, not implied as full support.

**One proof metric.** Whether ≥ 1 consented, logged operator-in-Spanish usability
pass exists per release cycle, and the # of changes shipped from it (target: ≥ 1
pass, ≥ 3 changes) — moving the thesis from asserted to evidenced.

---

*End Domain VIII. Cross-domain dependencies: contrast re-pigment (Brief 58) touches
the Brand/Design-System domain via the Ledger tokens-parity guard; the readability +
inclusive-design canons (59, 61) bind the Editorial/Voice domain; the conformance
ledger (56) is the artifact the Trust/Receipts domain should surface publicly.*


## Domain IX — Design System & Visual Craft

*Positioning Council batch · specialists 62–68 · prepared 2026-06-16. Strategy only; one part-file, no live-site edits. The window/muntin metaphor (a muntin is the bar between window panes) is the only sanctioned metaphor family below.*

**Domain-wide honesty notes.** Every repo number is file-cited; web benchmarks carry source + access date; anything else is labeled *analyst assessment* or *illustrative*. Four load-bearing facts shaped these briefs: (1) the brand runs **one palette in two registers** — editorial light (Fraunces + accent `#2A50C8` for AA on light) and product dark-first (Inter/Geist Mono + `#3B68F5`) — locked by `scripts/check-tokens-sync.mjs` against `data/muntin.tokens.json` via a pinned spine hash (`EXPECTED_SPINE_HASH`), with `scripts/vendor-tokens.mjs` as the publish-and-vendor step (this is the "build-tokens.mjs --check" guard named in the brief). (2) The **Golden Hour** expressive layer (marigold `#FFB020` / coral `#FF6B5C`) is editorial-ONLY and boundary-gated by ADR-001 (`EDITORIAL_ACCENT_IN_SPINE` in `check-tokens-sync.mjs`) — it must never enter the shared spine. (3) `brand/og/` holds **766 SVG + 766 PNG** cards generated from `scripts/build-og-cards.mjs` (5 manifest kinds + derived `people`; `grep "kind"` cards.json = article 80 / glossary 280 / page 64 / research 206 / tool 136). (4) Two live defects surfaced during the audit and are flagged honestly in the briefs that own them: the stale **`site.webmanifest`** theme/background hexes (66) and the **`viz-spark`/`viz-hero`/`viz-scroll`** "future phases" gap (62). No component-library / Figma export exists today (`find` for `tokens.css`/`storybook`/`figma` = 0 hits) — the recurring asymmetric gap.

---

### 62 · Design-System Architect

**Aspect & why it decides success.** The system is the leverage. A one-person studio ships 766 on-brand share cards, a token-locked palette, and a CI that fails on visual drift precisely because design decisions are *encoded once and propagated by build*, not hand-applied per page. This is the asymmetric thesis in literal form: the architecture, not headcount, does the work.

**Current-state audit (score 8/10).** The spine is genuinely strong. `data/muntin.tokens.json` is a typed source of truth (slate 0–950, accent editorial `#2a50c8` / product `#3b68f5`, rust `#c42e2e`, gold `#b7791f`, status triad, 4 radii, 3 easings + 4 durations 120–320ms, dual register documented). It is vendored from the product repo and pinned by a sha256 spine hash in two cross-repo guards (`check-tokens-sync.mjs` + the product's `check-tokens-parity.mjs`); `vendor-tokens.mjs --from/--diff/--check` mechanizes the copy. The Pane mark is consistent across `brand/mark/` (7 variants) and re-drawn identically in `build-og-cards.mjs` (`muntinMark()`, canonical 32-unit grid). **Gaps (the −2):** (a) `viz-spark`, `viz-hero`, `viz-scroll` are listed as families in CLAUDE.md and canon but exist in `assets/site-article.css` only as a "Future phases extend this with…" comment (line ~2867) — *named but unshipped*; the gate (`check-article-graphics.mjs`) counts "≥2 distinct viz-* kinds," so the corpus leans on the ~11 that are real. (b) No machine-readable token export beyond CSS `:root` and the JSON — no Style-Dictionary/W3C-DTCG output, no Figma variable bridge.

**Benchmark gap (Shopify Polaris).** Polaris ships a **primitive→semantic two-layer token model** (`--p-space-100` primitives; semantic tokens that "should never be used for anything other than the concept they're referencing") with a Figma UI kit kept in parity (github.com/Shopify/polaris-tokens; polaris.shopify.com/previous-releases/version-12, accessed 2026-06-16). Muntin's tokens are effectively one flat layer with a legacy alias map (`legacyVarMap`); intent ("this is the danger color") and value (`#c42e2e`) are not separated, so a re-pigment must touch alias names.

**The Extend-Past move.** Don't out-component Polaris (pointless for one person). Instead make the system *provably coherent and self-documenting* — a thing a 100-designer org struggles to keep honest: a generated, browseable token/viz reference page at `/system/` driven by the same JSON the gates enforce, so the documentation can never drift from the live palette.

**Actions.**
1. Promote `viz-spark`/`viz-hero`/`viz-scroll` from comment to shipped CSS (define the 3 wrappers + `data-audio-alt`/`figcaption` contract) OR demote them in CLAUDE.md + canon to "planned" so the named-vs-real set is honest. **S × 4**
2. Add a semantic alias tier in `muntin.tokens.json` (`--color-danger → status.danger`) and emit it; keep `legacyVarMap` as the back-compat shim. **M × 4**
3. Generate `/system/index.html` from `muntin.tokens.json` + a viz-family registry (swatches, contrast, the 11 live families with one live example each); gate it with a new `check-system-page.mjs` so it can't drift. **L × 5** *(ASYMMETRIC)*
4. Export a W3C-DTCG `tokens.json` build artifact (Style-Dictionary shape) so Figma/Canva MCP can consume one canonical source. **M × 3**

**Risks & honesty-gate notes.** Resolving (a) is itself an honesty fix — CLAUDE.md currently advertises capability the CSS doesn't fully ship. A generated `/system/` page must carry no invented metrics; swatches/contrast are computed, not claimed. Token edits must re-run `vendor-tokens.mjs` + re-pin the hash in BOTH guards or CI fails.

**One proof metric.** Named viz-* families == shipped viz-* families (currently a mismatch); `/system/` page regenerates green in `check-all.mjs`.

---

### 63 · Visual-Identity Lead

**Aspect & why it decides success.** Identity is the trust proxy. In a category whose default is a Toast/Wix template or Yelp clutter, a coherent restaurant-specific visual language is the single loudest signal of "trust me with your business" — it is craft a marketplace theme structurally cannot fake.

**Current-state audit (score 8/10).** The Pane mark is a real system, not a logo file: 7 mark variants (`brand/mark/`), 7 lockups (`brand/lockup/`: horizontal/stacked/wordmark × ink/teal/cream), patterns (`brand/patterns/`), and the mark re-expressed as the OG "muntin field" whisper texture (`muntinField()`, 4.5–5% opacity) and leitmotif. The window/muntin metaphor is disciplined and singular. Type pairing (Fraunces display + Inter body) is editorial-grade and self-hosted. **Defect found (honesty-gate):** `brand/favicons/site.webmanifest` ships `theme_color:#1F4E5B` (the **retired-warm teal**) and `background_color:#14161A` (pre-spine ink) — both off-spine values flagged in `retiredWarmPalette` / called out in `build-og-cards.mjs` as the old warm hexes. Android PWA install chrome therefore renders in the abandoned palette. The favicon README still prints the same stale `#1F4E5B`/`#FAF7F2` pair as "from the design tokens."

**Benchmark gap (Stripe / Linear / Apple).** Stripe and Linear earn trust through *relentless internal consistency* — one accent logic, one motion grammar, no orphan colors. Apple's craft signal is restraint plus precision. Muntin matches them on type and mark discipline; the gap is the leaked retired-warm value in the manifest (an identity surface most teams forget) and the absence of a single "brand surface" audit that proves no off-spine hex ships anywhere user-visible.

**The Extend-Past move.** Be the restaurant studio whose *own* brand passes the same forensic consistency bar it would sell to a client — then show the work. Fix the manifest, then add a gate that forbids retired-warm hexes in every shipped brand asset (manifest, OG, SVG, CSS), making "no orphan color" a CI invariant rather than a hope.

**Actions.**
1. Re-pin `site.webmanifest` to spine values (`theme_color:#2A50C8` or `#16181D`; `background_color:#16181D` light-mode ink) and correct the favicon README's quoted hexes. **S × 4**
2. Extend `migrate-warm-palette.mjs --check` (or a sibling gate) to scan `brand/**/*.{json,svg,webmanifest}` for `retiredWarmPalette` hexes; fail-CI. **M × 4** *(ASYMMETRIC)*
3. Commission a Figma brand-kit mirror (Figma MCP `create_new_file` + variables) seeded from the DTCG export in 62 — a shareable identity artifact for prospect decks, kept in token parity. **M × 3**
4. Add a one-screen `brand/README.md` "identity map" (mark/lockup/favicon usage rules + the singular metaphor) so the system is legible to a future collaborator. **S × 2**

**Risks & honesty-gate notes.** The manifest fix is a falsehood removal (README claims spine-sourced values that aren't). The new retired-warm scanner must allow `data/muntin.tokens.json#retiredWarmPalette` and docs (where the hexes are *documented as retired*, not *used*) — scope it to brand assets, mirroring how `check-tokens-sync.mjs` excludes `$meta`.

**One proof metric.** Zero `retiredWarmPalette` hexes in any shipped (non-doc) brand asset; new scanner green.

---

### 64 · Typography Specialist

**Aspect & why it decides success.** Type *is* the editorial register. The brand explicitly expresses warmth "through typography (Fraunces) + generous layout, NOT surface color" (`muntin.tokens.json#registers.editorial.warmthVia`). If the type system is editorial-grade, the static site reads as a publication; if it isn't, it reads as a template — exactly the line this whole studio is selling across.

**Current-state audit (score 8/10).** Mature foundation: Fraunces (display, self-hosted v38 with `Fraunces Fallback`) + Inter (body, v20 with `Inter Fallback`), preloaded (`inject-critical-fonts.mjs`, `inject-italic-font-preloads.mjs`), with a fluid clamp() type scale already wired (`--fs-eyebrow/body/lead/h4/h3` in `site.css`). Fraunces-italic is the signature editorial accent (used for the serif-italic headline word, OG `title_italic`, glossary AKA). TTF conversion for jsPDF is automated (`build-pdf-fonts.mjs`). **Gaps (the −2):** (a) bilingual EN↔ES type is mechanically identical but **Spanish runs longer (~15–25% expansion, illustrative/typesetting rule of thumb)** and there's no documented measure/leading adjustment for ES — wrap behavior is left to the same clamp; (b) Geist Mono is a *declared* tokens face (`scales.type.mono`) but is **product-register only** — `grep "Geist Mono" assets/site.css` = 0 hits — so the site has no canonical mono treatment for code/numbers (tools render numerics ad hoc).

**Benchmark gap (Apple / Medium).** Apple HIG and Medium both treat reading *measure* and vertical rhythm as first-class: Medium's article column is a tuned measure with a deliberate type scale; Apple's Dynamic Type guarantees legibility across sizes. Muntin has the scale and the faces; the gap is a codified reading measure + a bilingual-aware leading/measure rule, and a real mono for figures.

**The Extend-Past move.** Make the *reading experience* the moat: a documented editorial measure (≈66–72 char target, analyst assessment) enforced on article bodies, plus a register-correct mono for data, so every number on a tool reads as deliberately set. Editorial-grade type that a CMS theme can't match because it's tuned per language.

**Actions.**
1. Adopt Geist Mono (or a licensed mono) into the editorial register for tabular figures in tools/viz captions; add the `--font-mono` token + `font-variant-numeric:tabular-nums` on numeric cells. **S × 4** *(ASYMMETRIC)*
2. Codify an article reading measure (`max-inline-size` on `.article` body) and document the target in `voice-canon-library.md §8`; verify with a lightweight `check-reading-measure.mjs`. **M × 3**
3. Add an ES leading/measure note + (if needed) a slightly tighter clamp for ES article bodies; keep EN↔ES parity intact. **M × 3**
4. Document the type scale + italic-accent usage in the `/system/` page (62) so the scale is browseable, not folklore. **S × 2**

**Risks & honesty-gate notes.** Adding a mono is a perf line item — subset to digits + Latin, preload only on tool pages (LCP gate `check-image-*`/font budget). The 15–25% ES-expansion figure is labeled illustrative; no sourced number is asserted. Measure changes must not break `check-locale-parity.mjs`.

**One proof metric.** Article body measure within target on 100% of `library/` + `blog/` pages; tool figures render in tabular mono.

---

### 65 · Motion / Micro-Interaction Designer

**Aspect & why it decides success.** Motion is where craft and the perf gate collide. Done right, transitions read as polish that says "this was built, not bought"; done wrong, they cost CLS/LCP and fail CI. The asymmetric win is *delight that is provably free* — compositor-only, prefers-reduced-motion-honest.

**Current-state audit (score 7/10).** The token foundation is there: 3 easings + 4 durations in `muntin.tokens.json` (`ease-default/exit/emphasis`, 120/180/240/320ms), and `site.css` adds `--ease`, `--ease-out`, `--ease-spring` + `--t-micro/fast/med/slow`. Real motion is already compositor-correct: `viz-bars` animates `transform:scaleX` on intersection (`.in`), `viz-flow` reveal uses `opacity/transform` with staggered `transition-delay`, hovers use `transform:translateY` (`.tool-card:hover`). **Gaps (the −2):** (a) two motion vocabularies coexist — the tokens' 4-step duration ladder vs. site.css's `--t-fast/med/slow` (180/420/900ms) — they don't map cleanly, so timing is inconsistent across surfaces; (b) `prefers-reduced-motion` handling is per-block, not a single audited guard — no `check-reduced-motion.mjs` proving every keyframe/transition has an RM escape.

**Benchmark gap (Stripe / Linear).** Linear's motion is a tight spring grammar applied consistently; Stripe's is restrained and purposeful. Both treat reduced-motion as a first-class path. Material 3 Expressive (Google I/O 2025-05-13) just made **spring-based motion the system default** (blog.google; m3.material.io, accessed 2026-06-16) — the industry direction is *one coherent motion physics*. Muntin has the easings but two un-reconciled duration ladders.

**The Extend-Past move.** Ship a single, documented motion grammar (one duration ladder, one spring, one RM contract) and *prove the RM escape exists everywhere* via CI — delight that literally cannot regress performance or accessibility, which a template marketplace never guarantees.

**Actions.**
1. Reconcile the two duration ladders: map `--t-fast/med` onto the tokens' `dur-*` values (or document why editorial uses longer); record the canonical ladder in `/system/`. **S × 3**
2. Add `check-reduced-motion.mjs` to `check-all.mjs`: assert every `transition`/`@keyframes`-driven reveal sits under a `@media (prefers-reduced-motion: reduce)` reset. **M × 5** *(ASYMMETRIC)*
3. Constrain all animated properties to `transform`/`opacity` (lint for animating `width/height/top/left`); document the compositor-only rule. **M × 4**
4. Define one optional spring (`--ease-spring` already exists) as the single tactile press feedback; apply consistently to CTAs/cards. **S × 3**

**Risks & honesty-gate notes.** No content claims here — low honesty-gate risk. The real risk is CLS: any new reveal must reserve space (no layout-shifting entrances), respecting the existing `check-image-dimensions.mjs` philosophy. RM gate must allow genuinely instantaneous transitions.

**One proof metric.** 100% of animated selectors have a reduced-motion reset (new gate green); zero animations on layout properties.

---

### 66 · Dark-Mode / Theming Specialist

**Aspect & why it decides success.** "Legible at 11pm in a kitchen office" is the literal use case — restaurant operators read on phones in low light. A dark theme that's WCAG-correct *by construction* is both an accessibility win and a craft signal; one with invisible labels (the documented prior failure) destroys trust instantly.

**Current-state audit (score 9/10).** This is the strongest surface in the domain. `build-dark-mode.mjs` is a **token-flip architecture** (2026-05-30 rewrite): it remaps the base palette at the dark root so every `var(--cream)` surface and its `var(--ink)` text flip *together by construction* — structurally eliminating the light-on-light / dark-on-dark failures an allowlist guaranteed over a ~9,000-line stylesheet. Overloaded tokens are resolved two ways (correlated pairs self-resolve; inverted-by-design surfaces scope-restore light tokens — 25 catalogued surfaces). A short EXCEPTIONS list handles what a swap can't reach (hardcoded hexes, gradient-text, SVG data-URI strokes re-encoded with light strokes). Two activation paths (OS `prefers-color-scheme` gated so the explicit toggle wins, + `[data-theme="dark"]`), folded into render-blocking `site-core.css` to prevent flash. AA is machine-verified by `check-dark-contrast.mjs` with documented ratios (`--ink` 15.2:1, `--teal` 7.4:1, etc.). **Gap (the −1):** dark is product/site-toggle today; the editorial register is documented "light-only," so dark mode is a bolt-on flip rather than a first-class designed theme — the EXCEPTIONS list (≈20 entries) is the maintenance tax, and each hardcoded-hex surface is a future drift risk.

**Benchmark gap (GitHub / Linear).** GitHub ships multiple named themes (light/dark/dark-dimmed/high-contrast) from primitive token sets; Linear's dark is a designed surface, not an inversion. Muntin's flip is excellent engineering but is still *derived* from light, so it can't express a deliberately-different dark hierarchy (e.g., a dimmed variant for true night use).

**The Extend-Past move.** Keep the by-construction safety (it's better than most hand-built themes) but shrink the EXCEPTIONS surface to near-zero by killing hardcoded hexes at the source, then offer a "dimmed" night variant — the 11pm-kitchen theme as an *intentional* design, gate-verified for AA.

**Actions.**
1. Hunt and tokenize the hardcoded hexes the EXCEPTIONS list patches (nav rgba, `.tool-cta-form`, status pass/fail, hero panes) so the flip reaches them and the exception count drops. **M × 4** *(ASYMMETRIC)*
2. Add a "dark-dimmed" night variant (`[data-theme="dark-dimmed"]`) as a second token map; run it through `check-dark-contrast.mjs`. **L × 3**
3. Expose the theme toggle prominently (kitchen-office context) and persist choice; document the OS-gating logic in `/system/`. **S × 3**
4. Snapshot-test a few high-risk surfaces (forms, library cards, Listen dock) for both themes to lock the "no invisible label" win. **M × 3**

**Risks & honesty-gate notes.** Every token change must re-run `build-dark-mode.mjs` (the block is generated; hand-edits are forbidden by the `GEN:` markers) and pass `check-dark-contrast.mjs`. A dimmed variant doubles the contrast-verification matrix — gate it before shipping. No content claims; pure systems work.

**One proof metric.** `EXCEPTIONS` entries in `build-dark-mode.mjs` reduced ≥50%; both themes 100% AA in `check-dark-contrast.mjs`.

---

### 67 · OG / Social-Card Engineer

**Aspect & why it decides success.** Share previews are unpaid distribution at AI-search scale. Every glossary term, article, tool, and contributor that gets shared or cited paints a designed, on-brand card — or a generic one. At 766 cards, the system *is* the brand's most-reproduced surface.

**Current-state audit (score 9/10).** Best-in-class for a static site. `build-og-cards.mjs` is a spec-driven, manifest+typed-template engine: 6 templates (page/research/article/glossary/tool/people), 8 pluggable focus modules (list, funnel, quote, checks, score-ring, stat, type), a 15-entry glyph registry (drawn on the same 24-unit/1.75-stroke grammar as `brand/icons/`, capped at 16), an 8px baseline grid (`snap()`, `GRID_ROWS`), auto-fit titles (`fitTitle`), dek word-wrap (`dekTspans`), the Pane "muntin field" whisper texture + Golden Hour light layer. Output policy is sharp: SVG `viewBox` 1200×630, PNG rendered 2×; **content-based skip** (not mtime — git doesn't preserve mtimes, and CF Pages lacks `rsvg-convert`) with a `resvg-js` local fallback. Self-hosted Fraunces/Inter via fontconfig. 766 SVG+PNG pairs committed. **Gap (the −1):** rendering depends on `rsvg-convert` at build/local time (CF Pages "trusts what's checked in"); a manifest edit without a local render leaves a stale PNG with only a warning — there's no CI gate asserting every `cards.json` entry has a PNG whose SVG matches the current template output.

**Benchmark gap (Vercel OG / Satori).** Vercel OG runs **at the edge, JS-only, no Chromium** (Satori converts JSX+inline-CSS → SVG; runs on Cloudflare Workers/Deno; @vercel/og ≈500KB vs ~50MB Puppeteer) — dynamic per-request cards (vercel.com/docs/og-image-generation; vercel.com/blog/introducing-vercel-og-image-generation; npmjs.com/package/@vercel/og, accessed 2026-06-16). Muntin's model is the *opposite trade*: pre-rendered, committed, zero-runtime — which is correct for a static/CF site (no cold-start, no runtime cost) but means cards can silently go stale between builds.

**The Extend-Past move.** Don't chase edge-runtime (the committed model is the right asymmetric choice — every card is free at request time and survives on static hosting). Instead close the staleness gap: a CI gate that re-derives each card's SVG from the template and asserts the committed SVG+PNG match — so 766 cards can *never* drift from the manifest, a guarantee Vercel's per-request model gets for free but a committed pipeline must enforce.

**Actions.**
1. Add `check-og-cards.mjs` to `check-all.mjs`: for every `cards.json` entry (+ derived people), assert committed `<slug>.svg` == template output AND `<slug>.png` exists; fail-CI on drift. **M × 5** *(ASYMMETRIC)*
2. Optionally explore a **Cloudflare Worker + Satori** fallback route for long-tail/edge cases (new pages before a rebuild) — strategy only; keep committed PNGs as the default. **L × 2**
3. Lift the 16-glyph cap discipline into the manifest (validate `glyph` ∈ registry at build) so a typo'd glyph fails loudly instead of rendering blank. **S × 3**
4. Use Canva MCP brand templates as an authoring aid for one-off campaign cards that don't fit the 6 kinds, exporting to the same 1200×630 spec. **S × 2**

**Risks & honesty-gate notes.** The new gate must run only where `rsvg-convert` exists, or compare SVG-only on CF Pages (the script already documents this constraint) — assert SVG match always, PNG existence always, PNG pixel-match only locally. Card copy (`dek`, `stat.value`, `quote.text`) is content and falls under the fact gate — any numeric `stat`/`funnel` value must trace to `sourced-claims.json` or be illustrative.

**One proof metric.** OG drift = 0 (every manifest entry's SVG matches template output, PNG present) on every `check-all.mjs` run.

---

### 68 · Illustration / Iconography Lead

**Aspect & why it decides success.** Icons are the smallest unit of visual language and the easiest place to look generic. A custom, restaurant-specific icon set (reservations, delivery, reviews, margin, local-SEO) is a quiet but constant signal that the system was built for *this* category — the opposite of a Font Awesome grab-bag.

**Current-state audit (score 7/10).** A real, coherent set exists: 17 icons in `brand/icons/` drawn on a **24-unit grid, stroke-only, 1.75 stroke, round caps/joins, `currentColor`** (verified in `icon-window.svg` — the muntin mark itself as an icon). The OG glyph registry (`build-og-cards.mjs`) extends the *same* grammar with 15 restaurant-ops glyphs (reservations, delivery, reviews, conversions, local-seo, margin, glossary, research…) and explicitly states "same drawing language as /brand/icons/." So the vocabulary is consistent across two surfaces. **Gaps (the −3):** (a) the two icon sets live in **two places with no shared source** — 17 standalone SVGs + 15 inline template strings — so they can drift (a glyph fixed in one isn't fixed in the other); (b) no sprite/symbol system — icons are individual files/inline strings, not a `<symbol>` sheet, so reuse on the site is ad hoc; (c) no icon inventory/usage doc — the 16-glyph cap is enforced only by a comment.

**Benchmark gap (SF Symbols).** SF Symbols is the gold standard: one library, consistent weights/scales, and as of **SF Symbols 7 (WWDC 2025-06-09): Draw On/Off animation, automatic single-source gradients, Variable Draw, enhanced Magic Replace** (developer.apple.com/sf-symbols; 9to5mac.com/2025/06/11, accessed 2026-06-16). The relevant lesson isn't animation — it's *one canonical library, many surfaces, zero drift*. Muntin has the consistent grammar but two un-unified sources.

**The Extend-Past move.** Unify the icon language into one source of truth and ship it as a `<symbol>` sprite — a custom "restaurant-ops" icon system (the muntin/window as the brand anchor) that no template marketplace offers, drawn once and used everywhere (site + OG + PDF). The asymmetry: a category-specific icon vocabulary, system-maintained.

**Actions.**
1. Make `brand/icons/` the single source; refactor `build-og-cards.mjs` `GLYPHS` to import the same path data (read the SVGs at build) so a fix propagates to both surfaces. **M × 5** *(ASYMMETRIC)*
2. Generate a `brand/icons/sprite.svg` `<symbol>` sheet + a `check-icon-parity.mjs` asserting the OG registry and the icon files share identical path data. **M × 4**
3. Draw the 3–4 missing restaurant-ops icons to complete the set (e.g. ticket/kitchen, table-turn, allergen, hours) within the 16-cap and 24-unit/1.75 grammar. **S × 3**
4. Document the icon system (grid, stroke, naming, the cap, the muntin anchor) on the `/system/` page (62). **S × 2**

**Risks & honesty-gate notes.** Unifying sources is pure refactor (no content) — low honesty risk; the parity gate *prevents* future drift. New icons must hold the exact grammar (24-unit, 1.75 stroke, `currentColor`) or they'll read as foreign. Keep the muntin/window mark as the only metaphor anchor — no second metaphor family.

**One proof metric.** One icon source feeds both site + OG (parity gate green); restaurant-ops set complete within the 16-cap.

---

*End Domain IX. Cross-domain dependencies: actions 62.3 (`/system/` page), 64.4, 65.1, 66.3, 68.4 all converge on a single generated `/system/` reference — build it once. The DTCG token export (62.4) feeds the Figma brand kit (63.3) and Canva/Figma MCP authoring (67.4). The retired-warm scanner (63.2) and OG drift gate (67.1) and icon-parity gate (68.2) are three new `check-*.mjs` entries for `check-all.mjs` — sequence them behind the existing token/dark gates.*


## Domain X — Trust, Privacy & Security

*Positioning Council batch, specialists 69–75. Strategy only — nothing proposed here ships without passing `scripts/check-all.mjs` (~113 checks) and the honesty gate. Every external figure is dated + sourced or labeled "analyst assessment." Repo facts cite specific surfaces. Today: 2026-06-16.*

**The domain's asymmetric thesis (load-bearing for all seven briefs).** A platform funded by surveillance or rent — Google, Yelp, Toast, DoorDash — structurally *cannot* promise "we don't track you, your numbers never leave your laptop, we take no per-order rake," because that promise is adverse to its revenue. Muntin can make the promise *and prove it in the visitor's own browser*. Trust-as-architecture — provable, testable, falsifiable claims rather than asserted values — is the deepest moat a one-person shop holds against giants, because the moat is their business model, not their budget. Honesty is not a tone here; it is the positioning.

**Cross-cutting audit finding (referenced by briefs 69, 71, 73).** The trust spine is real and unusually deep for a one-person site — `/never/`, `/receipts/`, `/methods/`, `/security/`, `.well-known/security.txt`, `_headers`, plus the `check-no-third-party-plausible.mjs` CI guard — but it carries two coherence drags: (1) **stale services-era language** survives on the spine (`/never/` #5 "work I can't ship in the quoted window" + `#free-forever`'s "six polishes and one drop-in per week"; `/receipts/` "Two builds at a time," "Lead-to-call rate," "3 new productized offer pages at services/audit…"). This is not a fabrication-gate hit but it muddies the architecture story. (2) **The proofs are scattered across five URLs with no single canonical "Trust" index** a visitor or AI engine can land on. Several briefs converge on consolidating the spine into one provable surface.

---

### 69 · Trust-Architecture Lead

**Aspect & why it decides success.** For a one-person studio competing against funded incumbents, *trust is the entire product wrapper* — an operator hands over P&L-adjacent numbers only to a party they believe won't monetize them. The asymmetric advantage is that Muntin's trust claims are **architecturally testable**, not asserted; the job is to make that the site's defining noun, the way "infrastructure" is Stripe's.

**Current-state audit — score 8/10.** Among the strongest assets on the site. `/never/` ships five promises-by-absence (no lock-in, no data resale, no hidden pricing, no remarketing pixel on the library, no work outside the quoted window) with a changelog commitment if any breaks (`never/index.html` lines 430–456). `/receipts/` publishes a "What we don't track" block and ~60-event bounded registry, "updated weekly," last 2026-05-01 (`receipts/index.html` lines 458–481). `/security/` ships nine verifiable claims + a five-test self-audit + `integrity.txt` SHA-256 (lines 554–756). `.well-known/security.txt` is RFC 9116-valid (Expires 2027-05-01). The gap: these live as **four sibling pages with no parent "Trust" hub**, the footer "Trust" column (`security/index.html` lines 840–849) is the closest thing, and the spine carries stale services language (cross-cutting finding).

**Benchmark gap.** Stripe runs a public real-time status page (status.stripe.com) and a structured docs-grade trust center; Cloudflare publishes a system-status page and a public transparency report (analyst assessment, sources: status.stripe.com, cloudflarestatus.com, accessed 2026-06-16). DuckDuckGo's "we don't track you" is a single, repeated, falsifiable line (duckduckgo.com/privacy, accessed 2026-06-16). Muntin **leads** all three on *operator-runnable verification* (the five-test audit is unusual) and trails them only on *consolidation*: there is no single muntin.digital/trust front door, and no machine-readable status object.

**The Extend-Past move.** Build **`/trust/` as the canonical hub** that frames the spine as one architecture — "promises (`/never/`), proofs (`/security/`), public diary (`/receipts/`), sourcing (`/methods/`)" — and add a tiny self-hosted **status/uptime line** the studio can actually keep ("forms operational; last deploy hashed at /security/integrity.txt"). The giants can copy a trust page; they cannot copy *not having a rake to hide*, so the hub leads with the structural conflict, not feature parity.

**Actions (Effort × Impact).**
1. Ship `/trust/` hub (+ `/es/trust/` for locale parity) that links and summarizes the four spine pages; final-forever slug, so name it once and carefully. **Effort M × Impact 5 (ASYMMETRIC).**
2. Scrub services-era language from the spine (`/never/` #5 + `#free-forever`; `/receipts/` "two builds," "lead-to-call," "services/audit" bullets) so the architecture reads as a product company. **Effort M × Impact 4.**
3. Add a minimal, honest status indicator (static or `/api/health`-backed) — only claims the studio can hold, no fabricated 99.9% SLA. **Effort M × Impact 3.**
4. Stamp `/trust/` into the footer "Trust" column and the homepage trust strip as the single entry point. **Effort S × Impact 3.**
5. Add JSON-LD `WebPage` + `BreadcrumbList` to `/trust/` mirroring the `/never/` and `/receipts/` pattern. **Effort S × Impact 2.**

**Risks & honesty-gate notes.** A status page is a *promise generator* — only publish uptime/response claims that are measured (the "reply within 4 hours Mon–Fri" line is already on `/receipts/` and measurable in Plausible; do not invent a numeric SLA). `/trust/` must add an ES mirror or it fails `check-locale-parity.mjs` / `check-hreflang-orphans.mjs`. No new fabrication-gate exposure if it summarizes existing sourced claims.

**One proof metric.** Share of trust-spine sessions that pass through a single `/trust/` hub (vs. scattered direct hits to `/never//security//receipts/`), measured via the existing bounded page-arrival events on `/receipts/`.

---

### 70 · Privacy Engineer

**Aspect & why it decides success.** Privacy here is not a policy — it is **the product's core mechanism**: client-side tools that make no network call, so the operator's numbers are *un-leakable by construction*. This is the single most defensible asymmetry against any ad- or data-funded competitor, and it decides whether an operator types a real food-cost number into a tool at all.

**Current-state audit — score 9/10.** The strongest engineered asset in the domain. Tools run client-side; `check-tool-no-fetch.mjs` and `check-sheet-no-fetch.mjs` fail CI if a tool or sheet fragment contacts any URL (`data/security-claims.json` build-invariants; `security/index.html` claim 11). Plausible is self-hosted at `/assets/p.js`, proxied through `/api/event`, so the browser makes **zero third-party analytics requests** — enforced by `check-no-third-party-plausible.mjs` (fail-CI). The `_headers` CSP is `default-src 'self'` with a tight allowlist; `Permissions-Policy` disables camera/mic/geo and `interest-cohort=()` opts out of FLoC/Topics. Event properties are bounded enums ("a $25 ticket becomes 25-39"), never raw values. Near-perfect; the only gap is that the *no-fetch invariant is invisible to a non-technical visitor* until they open DevTools, and the audit-tool exemptions (`security-claims-exemptions.json`) are honest but not surfaced where a skeptic would look.

**Benchmark gap.** Apple's "what happens on your iPhone stays on your iPhone" frames on-device processing as the privacy guarantee (apple.com/privacy, accessed 2026-06-16); Proton ships open-source clients + published audits so claims are inspectable (proton.me, accessed 2026-06-16). Muntin **matches Apple's "on your device" architecture** for tools and **exceeds typical SaaS** by enforcing it in CI — but trails Proton on *legibility of the proof* (Proton's audits are linked front-and-center). Muntin's proof requires a DevTools step.

**The Extend-Past move.** Make the no-fetch invariant **demonstrable without DevTools**: ship a tiny, client-side **"network monitor" widget** on the `/security/` page (a `PerformanceObserver`/`fetch`-wrapper readout that shows "0 network requests fired while you used this tool" live), turning the inspect-this step into a visible, self-running proof. Apple says "on your device"; Muntin can *show the empty network tab to a non-engineer*.

**Actions (Effort × Impact).**
1. Build a client-side live network-activity readout on `/security/` (and optionally a tool page) — same-origin only, zero data leaves the page; itself an exhibit of the promise. **Effort M × Impact 5 (ASYMMETRIC).**
2. Surface the audit-tool exemptions honestly on `/security/` — a short "where a tool *does* fetch, and why" block sourced from `security-claims-exemptions.json` (audit tools take a URL the operator typed deliberately). **Effort S × Impact 4.**
3. Add a one-line "privacy by construction, enforced in CI" claim to the tool data-promise rail, linking the actual guard scripts by name. **Effort S × Impact 3.**
4. Document `interest-cohort=()` / no-Topics-API as an explicit promise on `/security/` or `/never/` — a falsifiable, dated absence most sites can't claim. **Effort S × Impact 3.**

**Risks & honesty-gate notes.** The live monitor must be *genuinely* client-side or it indicts the whole thesis; ship it under the existing CSP (no new third-party origin). Exemption copy must not overclaim — keep the "audit tools fetch a URL you typed; calculators never fetch your financial inputs" distinction exact (it's already the documented `security-claims-exemptions.json` rationale). Any new tool/sheet still routes through the no-fetch CI guards.

**One proof metric.** Tool engagement rate (first-result ÷ tool pageviews — already KPI #2 on `/receipts/`) on pages carrying the live monitor vs. those without; the hypothesis is that *visible* privacy lifts willingness to enter real numbers.

---

### 71 · Security Lead

**Aspect & why it decides success.** A tools site that asks operators to type business numbers must carry a **bank-grade transport and form posture** or the privacy promise is hollow. For a static Cloudflare site the bar is achievable solo, and a verifiably hard posture is itself a trust signal an under-resourced competitor skips.

**Current-state audit — score 8/10.** Excellent baseline. `_headers` ships HSTS with `includeSubDomains; preload`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`, and a scoped CSP. Forms are gated by Cloudflare Turnstile in Managed mode with a silent-OK honeypot fallback (`docs/turnstile-wiring.md`; the widget ships on the newsletter form, `security/index.html` line 877). `integrity.txt` publishes the deploy bundle's SHA-256. `.well-known/security.txt` gives a real disclosure channel. Two honest weaknesses: (1) the global CSP carries `'unsafe-inline'` in `script-src` (documented: required for inline JSON-LD + the Plausible init shim) and `'wasm-unsafe-eval'` site-wide (documented retraction after the invoice-decoder path-scoping broke, `_headers` lines 267–309) — both are reasoned trade-offs, but they're the softest spots in an otherwise tight policy; (2) there is **no public CSP/header report endpoint** so violations are invisible.

**Benchmark gap.** Stripe and Cloudflare publish status pages and run nonce/hash-based CSPs without blanket `'unsafe-inline'` (analyst assessment; status.stripe.com, cloudflarestatus.com, accessed 2026-06-16). Muntin's transport posture (HSTS preload, DENY, nosniff) is **at parity with bank-grade static sites**; it trails the giants only on CSP strictness (the `'unsafe-inline'` script allowance) and on having any violation telemetry.

**The Extend-Past move.** Tighten the script CSP toward **hash- or nonce-based inline allowance** (removing `'unsafe-inline'` from `script-src`), and add a `Content-Security-Policy-Report-Only` shadow policy + `report-to`/`report-uri` so the studio *sees* violations before enforcing — then publish "no `'unsafe-inline'` scripts" as a new `/security/` claim a competitor can verify in the response headers. The asymmetry: Muntin can show its CSP header is genuinely strict; most restaurant-SaaS marketing sites ship Tag Manager and can't.

**Actions (Effort × Impact).**
1. Pilot a `Report-Only` CSP that drops `script-src 'unsafe-inline'` (move inline JSON-LD + Plausible shim to hashes/nonce); measure violations via a report endpoint before enforcing. **Effort L × Impact 4.**
2. Add a 10th `/security/` claim — "strict CSP, no inline-script execution" — only after #1 enforces, with a `curl -I` verification step. **Effort S × Impact 3 (ASYMMETRIC; gated on #1).**
3. Verify the Turnstile site key is bound in production and the widget ships on **all four** documented endpoints (intake, sign-in, newsletter, checklist), not just the newsletter (per `docs/turnstile-wiring.md` §3). **Effort S × Impact 3.**
4. Add a Subresource-Integrity / pinned-version note for the one external script (Turnstile `api.js`) and confirm `connect-src` stays minimal. **Effort S × Impact 2.**
5. Bump `.well-known/security.txt` `Expires` review into the changelog cadence so it never lapses (currently 2027-05-01). **Effort S × Impact 1.**

**Risks & honesty-gate notes.** Do **not** publish a "strict CSP" claim until the header actually enforces it — the five-test ethos forbids a claim that fails its own inspect-this. CSP tightening risks breaking inline handlers (theme toggle, nav auth shim); use Report-Only first. Turnstile keys are owner-side secrets — the brief recommends verification, not committing keys. No fabricated penetration-test or "SOC 2" badge — receipts-based only.

**One proof metric.** Count of CSP violations in the Report-Only window trending to zero (proving the strict policy is safe to enforce), then the response-header `curl -I` check passing in CI.

---

### 72 · Data-Promise / Compliance Steward

**Aspect & why it decides success.** Promises an operator can verify beat policies they must trust. The asymmetry is **technically enforced compliance** — GDPR/CCPA data-minimization isn't a clause here, it's the architecture (no inputs collected = nothing to subject-access). Getting the legal rail and the engineering rail to say the *same* thing is what makes the promise un-fakeable.

**Current-state audit — score 8/10.** Strong and unusually coherent. `privacy.html` ships data-subject rights (access within 30 days, correction in 5 business days, self-serve deletion at `/account/`, marketing opt-out), names the GDPR/CCPA/PIPA frame, and commits to 72-hour breach notice + the 45-day Maryland PIPA filing window (lines 452–460). Vendors are enumerated with data-minimization rationale — Cloudflare, Resend, Plausible (+ Buttondown for lists) — each linked to its own policy (lines 462–467). `/receipts/` re-states the named commitments (CC BY-NC 4.0 library license, Maryland courts / no mandatory arbitration, three functional cookies). The data-promise rail (`security-claims.json#data_promise_rail_3line`) is stamped on every tool. The gap: there's **a minor vendor-list drift risk** (privacy.html names Resend for transactional email while `docs/turnstile-wiring.md` references the worker; the newsletter pitch says Buttondown in `privacy.html` but the footer form posts to `/api/subscribe`) — worth a single reconciliation pass — and **no machine-readable data-processing summary** for the AI/agent era.

**Benchmark gap.** Apple frames "on your device" so that the *absence of collection* is the compliance story (apple.com/privacy, accessed 2026-06-16); GDPR's data-minimization principle (Art. 5(1)(c)) and CCPA's right-to-know/delete (effective since 2020, CCPA/CPRA) reward exactly that posture (analyst summary of public regulation). Muntin **matches Apple's enforced-by-architecture model** and trails no one on small-studio compliance; the only headroom is *legibility* (a one-screen "your rights, the 60-second version") and machine-readability.

**The Extend-Past move.** Publish a **"Data promise, technically enforced"** one-pager that maps each legal right to its *architectural enforcement* ("Right to deletion → Workshop self-serve at /account/, effective in minutes; nothing to delete for anonymous tool use because nothing was collected"), and reconcile the vendor list to a single source of truth. Apple says on-device; Muntin can show the *clause-to-code* mapping line by line — a thing a data-broker-funded competitor cannot honestly print.

**Actions (Effort × Impact).**
1. Add a "rights → enforcement" mapping block to `/privacy.html` or `/security/` (legal clause on the left, the code/architecture that enforces it on the right). **Effort M × Impact 4 (ASYMMETRIC).**
2. Reconcile the vendor list (Resend / Buttondown / Cloudflare / Plausible) to one canonical list referenced by both `privacy.html` and `/receipts/`, so a new vendor is added in one place. **Effort S × Impact 4.**
3. Keep the 72-hour breach + 45-day PIPA commitment in sync between `privacy.html` and any `/trust/` hub (brief 69); date every change in the changelog. **Effort S × Impact 3.**
4. Confirm `/account/` deletion self-serve actually exists and matches the "effective within minutes" claim (it's `Disallow`-ed in robots.txt and noindex — verify the live behavior backs the prose). **Effort M × Impact 3.**

**Risks & honesty-gate notes.** Highest exposure is **claim-vs-reality drift**: every legal commitment (30-day access, 5-day correction, 72-hour breach, minutes-deletion) must be operationally true for a one-person studio — under-promise rather than overstate. The vendor list must be complete and current (an unnamed processor is a compliance and trust failure). Do not cite a specific GDPR/CCPA article number in visitor copy unless verified; "data-minimization" as a principle is safe, a mis-cited article is not.

**One proof metric.** Time-to-fulfillment on data-subject requests (access/deletion) measured against the published windows — the number that proves the legal promise is operationally real, logged via the Window thread that carries the request.

---

### 73 · Credibility / Social-Proof Engineer

**Aspect & why it decides success.** A one-person studio with no testimonials looks unproven *unless* it substitutes a harder currency: **receipts**. The asymmetry is that Muntin's credibility is built from verifiable artifacts (sourced claims, public counts, runnable tests, a real operator bio) rather than self-reported praise — which is both honesty-gate-safe and *more* trust-bearing to a burned operator than star ratings.

**Current-state audit — score 7/10.** Honest by design and correctly empty of fabrication: **no `AggregateRating`, no `Review` schema, no testimonials** are self-applied to Muntin's own LocalBusiness/Organization entity (verified — the only `reviewCount`/`AggregateRating` strings in the repo are the restaurant-audit tool *grading a customer's* GBP, and articles *teaching* schema). Credibility is carried instead by `/methods/` (sourcing policy, reviewed quarterly), `/receipts/` (public counts via `data/site-counts.json` sentinels), `/security/`'s five runnable tests, `data/sourced-claims.json`, and the dated, specific `/about/` operator timeline. The gap: this proof is **diffuse and not packaged as "proof"** — there is no single "Why trust a one-person studio" exhibit, and the receipts-based credibility isn't yet expressed in the kind of schema (e.g., `Claim`, `CreativeWork` citations) that AI answer engines reward.

**Benchmark gap.** Wirecutter's authority comes from *transparent methodology + named testers + disclosed conflicts* (nytimes.com/wirecutter, accessed 2026-06-16) — receipts, not stars. Stripe's credibility leans on named-customer logos with permission (analyst assessment). Muntin **matches Wirecutter's methodology-as-credibility model** (the `/methods/` + `/security/` spine is genuinely Wirecutter-grade for its size) and *correctly* declines Stripe's logo-wall (it has no permissioned client logos and must not fabricate them). Headroom is purely *packaging*.

**The Extend-Past move.** Build a **"Receipts, not reviews" credibility exhibit** that explicitly reframes the absence of testimonials as the proof: "We publish no testimonials. Here's what we publish instead — sourced claims, runnable tests, weekly counts, a real bio." It out-trusts a star rating precisely because a burned operator distrusts stars. If/when real permissioned proof exists (a named client quote with sign-off, a GitHub star count, a verifiable press mention), add it under a strict receipts-only rule.

**Actions (Effort × Impact).**
1. Ship a "Receipts, not reviews" section (on `/trust/` from brief 69, or `/methods/`) that names the substitution and links each proof artifact. **Effort S × Impact 4 (ASYMMETRIC).**
2. Add `Claim` / `ClaimReview`-adjacent or `CreativeWork`+`citation` JSON-LD to `/methods/` and `/security/` so answer engines can ingest the verifiable claims (extends the existing `/security/` `Claim[]` graph). **Effort M × Impact 4.**
3. Establish a **receipts-only intake rule** in `docs/` for any future social proof: a testimonial needs written sign-off + a `sourced-claims.json` entry before it ships; no stock logos, no invented ratings. **Effort S × Impact 3 (guardrail).**
4. Surface honest, already-true counts as proof chips (e.g., the `data/site-counts.json` sentinels: articles, tools, glossary terms) on the credibility exhibit. **Effort S × Impact 2.**

**Risks & honesty-gate notes.** This is the brief with the **highest fabrication temptation** — the antidote is the binding receipts-only rule: zero invented testimonials, logos, ratings, or "trusted by N restaurants" cohort claims (the latter is exactly the pattern `check-fabrications.mjs` blocks). Do **not** add self-applied `AggregateRating` schema (it would be unfounded and risks Google structured-data penalties). Any number on the exhibit must trace to `site-counts.json` or `sourced-claims.json`.

**One proof metric.** Conversion lift from the credibility exhibit — share of visitors who view "Receipts, not reviews" and then start a Window thread or run a tool (Window thread starts is KPI #6 on `/receipts/`).

---

### 74 · Consent / Cookie UX

**Aspect & why it decides success.** The consent experience is the *first* trust interaction on most sites and usually the most adversarial (dark-pattern banners). Muntin's asymmetry is that it has **almost nothing to consent to** — the right move is to make that absence legible and reassuring, not to bolt on theatre that would actively contradict the privacy thesis.

**Current-state audit — score 9/10.** Near-ideal and rare. `cookies.html` ships a "short version" stating three functional cookies (`md_locale`, `lang_hint_dismissed`, `md_session`), no tracking, no banner, Plausible cookieless — and explicitly argues *why* there's no banner ("Adding a banner would be theatre that hurts trust," lines 419–478). It distinguishes cookies from `md_*`/`workbench_*` localStorage, and offers three real opt-outs (use without sign-in, skip the language switcher, block cookies — site degrades gracefully). The Spanish language hint is opt-in (shown only if `navigator.languages` includes Spanish, not yet dismissed), which is itself good consent hygiene. The only gap: this excellent reasoning lives **only on `cookies.html`**; a first-time visitor never sees the "nothing to consent to" message at the moment they'd expect a banner.

**Benchmark gap.** GOV.UK's cookie pattern is the gold standard for minimal, honest, accessible consent (design-system.service.gov.uk, accessed 2026-06-16); DuckDuckGo's posture is "no cookie banner because no tracking" (duckduckgo.com, accessed 2026-06-16). Muntin is **at parity with DuckDuckGo** (genuinely nothing to consent to) and *ahead* of most sites that ship banners reflexively. The only headroom is making the absence a deliberate, visible trust beat.

**The Extend-Past move.** Turn the *non-banner* into a **one-line trust affordance** — a small, dismissible, non-blocking "No cookie banner, because nothing here tracks you. → How that works" link to `cookies.html`, shown once. It converts a missing dark pattern into an explicit promise. GOV.UK minimizes the banner; Muntin can *replace* it with a one-line brag that links to proof.

**Actions (Effort × Impact).**
1. Add a one-time, non-blocking "why there's no cookie banner" affordance (a quiet footer line or a dismiss-once note), linking `cookies.html`. **Effort S × Impact 4 (ASYMMETRIC).**
2. Keep it ES at parity and ensure it sets at most the existing `lang_hint_dismissed`-style functional flag (no new tracking cookie to remember dismissal — use the same minimal pattern). **Effort S × Impact 3.**
3. Reconcile the `md_session` description across `cookies.html` and `privacy.html` so the three-cookie list is identical wording in both. **Effort S × Impact 2.**
4. Confirm no third-party widget (Turnstile, embeds) sets a client-visible cookie that would break the "three cookies, that's the entire list" claim — Turnstile loads from `challenges.cloudflare.com`; verify it sets nothing first-party-visible on `muntin.digital`. **Effort S × Impact 3.**

**Risks & honesty-gate notes.** The "three cookies, no fourth" claim is falsifiable in DevTools — if Turnstile or any future embed sets a cookie on the apex, the claim breaks and `cookies.html` must update *first*. Do not add a consent banner "to be safe": it would contradict the documented privacy architecture and the `/never/` #4 promise. The dismissal mechanism must not itself introduce a tracking identifier.

**One proof metric.** Cookie-page → trust-spine flow (visitors who click the "how that works" affordance and land on `cookies.html`/`/security/`) — proof the absence is read as a feature, not an oversight.

---

### 75 · Reputation / Review Strategist

**Aspect & why it decides success.** Reviews are the one trust currency Muntin *doesn't yet hold* — and for a local DMV business (Silver Spring LLC), Google Business Profile reviews are decisive for local discovery and for the "is this real?" gut-check. This is **greenfield**: the asymmetry is to earn reviews honestly from real service interactions, never to manufacture them, and to turn the studio's own teaching (the published review-response playbook) into lived practice.

**Current-state audit — score 4/10.** The lowest score in the domain, by design rather than failure: there are **no published reviews and no `AggregateRating` schema** (correctly — fabricating them is the cardinal sin). But the *foundation* is unusually strong: `sameAs` on the business entity already lists Yelp and Google Maps profiles (`index.html` line 1283 ff.), the studio has published `library/google-review-response-playbook/index.html` (a full response playbook — teaching it but not yet living it), and `learn/research/dmv-restaurant-gbp-audit-2026/` shows GBP fluency. The gap is the entire *acquisition + response loop*: no documented ask-for-review moment, no response cadence, no honest seeding from real client/Window interactions.

**Benchmark gap.** Google's own guidance rewards *recency, volume, and owner responses*; Yelp explicitly penalizes solicitation and filters non-organic reviews (analyst summary of public platform policy, accessed 2026-06-16). Muntin **trails every established local competitor on review volume** (it has none visible) but is **uniquely positioned to do it cleanly** — it literally authored the response playbook and refuses fake reviews, which is exactly the posture Google/Yelp policy rewards and most small businesses violate.

**The Extend-Past move.** Operationalize an **honest review flywheel** that eats its own dog food: at the close of every genuine engagement (a completed Window thread that resolved, a shipped piece of work), a *non-incentivized* ask for an honest GBP review, paired with the published response playbook applied to every review within the studio's 4-hour reply standard. The asymmetry: Muntin can credibly say "we ask for honest reviews, never paid or filtered ones, and we respond to every one" — a claim the platforms' own policies bless and that a review-gaming competitor can't make.

**Actions (Effort × Impact).**
1. Write a one-page internal review-acquisition + response SOP in `docs/` (the honest ask: timing, wording, no incentive; the response cadence: every review, within the 4-hour standard, using the published playbook). **Effort S × Impact 4.**
2. Add a single, honest "leave an honest review" link to genuine post-engagement touchpoints (a resolved Window thread, an invoice footer) — never a pop-up, never incentivized. **Effort S × Impact 4 (ASYMMETRIC).**
3. **Defer `AggregateRating` schema until real reviews exist** — then add it sourced strictly from the live GBP count, with a `sourced-claims.json` entry; never hand-enter a rating. **Effort M × Impact 3 (gated).**
4. Apply the studio's own `google-review-response-playbook` to every received review publicly, as a living demonstration of the teaching. **Effort S × Impact 3.**
5. Keep Yelp posture policy-clean: do not solicit Yelp reviews (their policy penalizes it); let them be organic. **Effort S × Impact 2 (guardrail).**

**Risks & honesty-gate notes.** This is the **single highest fabrication-and-policy risk** in the domain. Absolute rules: no fake or incentivized reviews; no `AggregateRating` schema until a real, live rating exists and is sourced; no review-gating (asking only happy clients) — that violates platform policy and the honesty gate. Yelp solicitation is explicitly penalized — keep asks to GBP and keep them non-incentivized. Any review count that ever appears on-site must trace to the live platform, dated, in `sourced-claims.json`.

**One proof metric.** Count of organically earned GBP reviews + owner-response rate (target: 100% responded within the 4-hour standard) — the only review metric that is both honest and on-brand.

---

*End Domain X. Cross-domain dependencies are summarized in the digest returned to the council lead.*


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


## Domain XII — Analytics, Growth & Lifecycle

> Positioning Council batch brief. Strategy only — no live-site edits in this pass.
> Honesty gate: every number below is repo-sourced (file cited), web-sourced (source + date), or labeled *illustrative / analyst assessment*. No traffic or conversion numbers are asserted as fact — current performance baselines are **TBD until measured in Plausible**.
> Operator bio is singular (Don Goldstein, full-time FoH at Tacombi, Bethesda). Asymmetric thesis: a surveillance-funded giant grows by paid acquisition + retargeting; Muntin must compound via organic + AEO + operator word-of-mouth, measured **without** surveillance — a discipline the giant has no reason to build and no standing to claim.

---

### 82 · Growth / Acquisition Lead — channel strategy after the stall

**Aspect & why it decides success.** With no paid budget and a stalled publishing heartbeat, *every* future visitor must arrive through a compounding, owned channel: organic search, AI-search citation, the free tools, or operator referral. If the channel mix isn't deliberately re-pointed at compounding sources, the stall becomes the steady state.

**Current-state audit (score 6/10).** The acquisition surfaces exist and are unusually strong for a one-person shop: 47 articles + 13 tools + 150 glossary terms (`receipts/index.html` counts), a 7-corner diagnostic router (`data/start-here-journeys.json`), 7 library topics including a dedicated `ai-search` topic (`data/topics.json`), and a north-star KPI named *organic-search sessions/week* with `target_initial: 600 → target_q3: 1500` (`data/kpis.json`). What's missing is a *publishing cadence* and a single owned-channel scorecard — the stall named in the brief. Score reflects strong inventory, idle engine.

**Benchmark gap (Notion).** Notion turned user-generated templates + an unpaid ambassador program into "an organic, compounding force" ([Bettermode, "Notion Community Led Growth", 2024](https://bettermode.com/blog/notion-community-led-growth)). Muntin's tools + Cost Index are its template-gallery analog, but nothing yet recirculates that output into discovery.

**The Extend-Past move.** Treat the **13 tools + weekly Cost Index as the publishing heartbeat** — not the blog. A tool result and a Cost Index update are publishable, AEO-citable artifacts that need no new long-form. Re-anchor the cadence on "ship one tool improvement or one Cost Index reading per week," and let the library compound behind it.

**Actions.**
1. Define an "owned-channel mix" board on `/receipts/` (organic / AI-search / tool-direct / referral shares), all sourced from existing Plausible goals. **S × 4**
2. Re-cast the weekly heartbeat as Cost Index + one tool note (publishable without a full article). **M × 5**
3. Add AEO-targeted FAQ blocks to the 13 tool pages so each tool earns AI-Overview citation, not just rank. **M × 4** (article-graphics gate applies only to library/blog, not tool pages — confirm before shipping).
4. Stand up a quarterly "what compounded" note in `/learn/research/` tying traffic shape to publishing acts. **M × 3**

**Risks & honesty-gate notes.** Do not publish a "we grew N%" claim until Plausible has the baseline — current daily traffic is *faltering* (brief) and any growth figure today is fabrication. Cadence promises must respect the public "two builds at a time" commitment (`receipts/index.html`) — don't imply unbounded output.

**One proof metric.** Organic + AI-search sessions/week trending toward `target_initial: 600` (`data/kpis.json`), reported on `/receipts/`.

---

### 83 · Analytics Engineer — the privacy-first KPI loop

**Aspect & why it decides success.** The asymmetric thesis lives or dies here: prove a rigorous, *actionable* analytics loop on bucketed, cookieless data. If the loop is real, privacy becomes a growth advantage; if it's decorative, the giant's surveillance stack simply out-measures Muntin.

**Current-state audit (score 7/10).** Genuinely strong bones. Plausible is self-hosted (`/assets/p.js` same-origin, events POST `/api/event`) and a **fail-CI guard** forbids any third-party `plausible.io` request (`scripts/check-no-third-party-plausible.mjs`). Event naming is locked to a registry (`tools/_shared/analytics.js`, ~400+ names) by `check-analytics-vocabulary.mjs`, and prop cardinality is bounded (no raw URLs / emails / timestamps) by `check-event-prop-cardinality.mjs`. KPIs are documented and force-reviewed every 90 days (`check-kpi-doc.mjs`). **Two honest gaps drag the score:** (a) `data/kpis.json` defines **5** KPIs while `/receipts/` publishes **7** ("Library depth ratio" and "AI-search arrivals share" are public but not in the JSON) — the public page and the source of truth disagree; (b) `check-analytics-vocabulary.mjs` is still **warn-only** (`--check` documented as "Sprint 16 flips to fail-CI") — drift can land today.

**Benchmark gap (Amplitude / Mixpanel — concepts only).** Those tools offer funnel + path rigor Muntin lacks ([Webeyez, "Amplitude vs Mixpanel", 2025](https://webeyez.com/insights/guides/amplitude-vs-mixpanel-comparison-guide-2025)). But the cautionary half is the asymmetric proof: Mixpanel's **Nov 2025 breach** led OpenAI to terminate its contract ([SalesHive Mixpanel profile, 2026](https://saleshive.com/vendors/mixpanel/)). Muntin's bucketed-only posture means there is no user-level dataset to breach — a trust signal a surveillance vendor structurally cannot offer.

**The Extend-Past move.** Reconcile the KPI registry to the public list and **flip the vocabulary gate to fail-CI**, then publish the gate names themselves on `/receipts/` — "our analytics can't drift because the build won't let it." Rigor *as* the marketing.

**Actions.**
1. Reconcile `data/kpis.json` (5) with `/receipts/` (7): add the two missing KPIs to the JSON or correct the page; bump `_lastReviewed` (`check-kpi-doc.mjs` will pass it). **S × 5** [ASYMMETRIC]
2. Promote `check-analytics-vocabulary.mjs --check` to fail-CI in `check-all.mjs`; clear any stale registry entries first. **M × 4**
3. Add a one-line "verifiable in DevTools → Network" pointer beside each KPI on `/receipts/` (the no-keystroke-logging claim is already there). **S × 3** [ASYMMETRIC]
4. Document the bucketing rule (SHA256(sub‖YYYY-MM) / SHA256(IP‖UA‖YYYY-MM-DD), per `data/experiments.json` `_doc`) on `/system/` so the privacy method is auditable. **S × 3**

**Risks & honesty-gate notes.** The 5-vs-7 mismatch must be fixed *before* any "we measure ourselves rigorously" external claim — shipping the claim over a known inconsistency is the exact credibility risk the audience has been burned by. Targets in `kpis.json` are explicitly "aspirational, not promises" — keep that framing.

**One proof metric.** Zero KPI-definition drift: `data/kpis.json` count == `/receipts/` published count, both green under `check-kpi-doc.mjs`.

---

### 84 · Lifecycle / Email Lead — the Ledger-first drip

**Aspect & why it decides success.** The founding list is the only first-party lifecycle seed — the one channel Muntin owns outright, immune to algorithm shifts. An honest drip that *helps before it sells* converts the list into the warm pipeline for Muntin Ledger; a salesy drip burns the studio's hardest-won asset (trust).

**Current-state audit (score 5/10).** The capture exists and is on-brand: the `#founding` band (`index.html`, `founding-capture:start`) posts to first-party `/api/waitlist`, promises "no AI reads your numbers, no ads, no tracking," and a double-opt confirm ("check your inbox to confirm your spot"). Lifecycle events are pre-registered — `Newsletter Signup`, `Newsletter Confirmed`, `Lifecycle Email Opened`, `Lifecycle Email Click` (`tools/_shared/analytics.js`). **Real gap:** the form fires `data-event="Waitlist Signup"` (`index.html`) — a name **not in the registry** (registry has `Newsletter Signup`). Under the planned fail-CI vocabulary gate this drifts; today it's an untracked signup. No drip content is in-repo (no sequence doc). So: capture good, instrumentation inconsistent, nurture undefined.

**Benchmark gap (Morning Brew).** Brew's lifecycle is milestone-driven and near-zero marginal cost — exclusive content + community invites as rewards, with congratulate/nudge emails on a schedule ([ReferralRock, "Morning Brew Referral Program", 2024](https://referralrock.com/blog/morning-brew-referral-program/)). Muntin has the assets (tools, sheets, research notes) to build a *help-first* equivalent without discounting.

**The Extend-Past move.** A **"receipts drip"**: each email leads with one usable artifact (a sheet, a Cost Index reading, a tool walkthrough) and *defers the Ledger ask* to a single honest line at the foot — the email version of the homepage's "apply it yourself" stance (`index.html`).

**Actions.**
1. Reconcile the founding-form event to the registry — either rename the fire to `Newsletter Signup`/add `Waitlist Signup` to `analytics.js` first. **S × 5** (blocks the fail-CI flip in #83).
2. Draft a 4–5 email help-first sequence in `docs/` (artifact-led, single soft Ledger line), EN + ES for parity. **M × 4** [ASYMMETRIC]
3. Instrument open/click with the existing `Lifecycle Email Opened` / `Lifecycle Email Click` events; keep props bounded (`{ step }` enum). **S × 3**
4. Add a plain "what you'll get / what we'll never do" expectation line under the capture button. **S × 4**

**Risks & honesty-gate notes.** No fabricated list size or open-rate — baseline is TBD. "Opens this fall" (`index.html`) is a dated promise; the drip must not contradict it. Privacy: no open-pixel that sets a third-party cookie; Plausible-style first-party measurement only (consistent with `/never/`).

**One proof metric.** Founding-list confirm rate (`Newsletter Confirmed ÷ Newsletter Signup`) — baseline TBD, then a target after first 30 days.

---

### 85 · Referral / Word-of-Mouth Strategist — operator-to-operator loops

**Aspect & why it decides success.** In a tight-knit DMV operator world, a trusted peer's word outweighs any ad. Word-of-mouth is the one channel a surveillance budget can't buy and the one most native to Muntin's "operator who runs real shifts" credibility. Without an explicit loop, referrals stay accidental.

**Current-state audit (score 3/10).** Sharing primitives exist — `Share`, `Audit Shared`, `Audit Share Card Downloaded`, share-snapshot recipient banners (`tools/_shared/analytics.js`; Phase G.11 share group). Tools are no-signup and shareable, which is the right substrate. But there is **no referral mechanic, no double-sided incentive, no "invite a peer" surface** anywhere in the repo (registry + grep). Score reflects raw sharing telemetry without an intentional loop.

**Benchmark gap (Dropbox / Robinhood).** Dropbox's double-sided storage reward drove ~3900% growth in 15 months ([Prefinery case study](https://www.prefinery.com/blog/dropbox-referral-program-3900percent-growth-study/)); Robinhood proved exclusivity + clear mechanics rival cash ([Tremendous, 2025](https://www.tremendous.com/blog/10-examples-of-successful-referral-programs/)). Muntin can't (and shouldn't) pay cash — but it can offer *access* and *recognition*, the Robinhood lesson.

**The Extend-Past move.** A **"pass the tool" loop** with a non-monetary, privacy-safe reward: an operator who shares a tool result or the Cost Index earns earlier Ledger founding access (recognition, not cash) — measured by the *existing* `Share`/recipient events, no new cross-site identifier.

**Actions.**
1. Add a "send this to an operator who needs it" CTA on tool-result + Cost Index, firing the existing `Share` event (no new vocabulary). **S × 4** [ASYMMETRIC]
2. Tie a recognition reward (earlier founding access) to confirmed peer signups via first-party `/api/waitlist` referral source — bounded prop `{ ref: <bucketed-source> }`, never an email or raw URL (respects `check-event-prop-cardinality.mjs`). **M × 5** [ASYMMETRIC]
3. Seed a DMV "operators who use this" wall on a trust page (opt-in names only, fact-gated). **M × 3**

**Risks & honesty-gate notes.** **Privacy is the binding constraint:** referral attribution must be first-party + bucketed — no referral cookie that tracks across sites, no email in a prop. Any operator name shown must be opt-in and fact-checkable (no invented cohort). Reward must avoid manufactured urgency — "earlier access," not a fake countdown.

**One proof metric.** Operator-attributed founding signups/month (first-party `ref` bucket) — baseline TBD.

---

### 86 · Funnel / Attribution Analyst — tool → content → Ledger paths

**Aspect & why it decides success.** Muntin's value chain is *tool → content → founding list → Ledger*. If those hops aren't modeled, the studio can't tell which free tool actually feeds the product — and optimizes blind. Doing this *without* cross-site tracking is the discipline that proves the thesis.

**Current-state audit (score 6/10).** The funnel is unusually well-instrumented for cookieless: first-touch attribution + AI-search detection (`AI Search Landing`, `Returning Visitor`), tool micro-funnel (`Tool First Input → Tool First Result → Tool Save Intent`), `Article Scroll`, `Post-End CTA Click`, and the Ledger handoff (`Ledger Route Click`, bounded to `{ source: <feeder-slug> }` from `data/ledger-cta.json`) — all in `tools/_shared/analytics.js`. KPIs already encode two funnel ratios: `tool-engagement-rate` (`Tool First Result ÷ tools pageview`, target 0.28) and `workshop-save-rate` (target 0.12) (`data/kpis.json`). **Gap:** these are point metrics, not an end-to-end path; there is no documented model of tool→Ledger, and Plausible funnels/props aren't assembled into one view.

**Benchmark gap (Mixpanel).** Mixpanel's Flows show paths rigid funnels miss ([Webeyez, 2025](https://webeyez.com/insights/guides/amplitude-vs-mixpanel-comparison-guide-2025)). The asymmetric constraint: Muntin must reach that insight with *bucketed first-party events only* — no user-level identity stitch — which is harder, and the point.

**The Extend-Past move.** Build the **honest funnel as a Plausible goal-funnel** using only events that already exist (`AI Search Landing`/organic → `Tool First Result` → `Newsletter Signup` → `Ledger Route Click`), documented in `docs/` so the model is auditable and reproducible without a tracking vendor.

**Actions.**
1. Document the canonical tool→content→Ledger funnel (events + bounded props) in `docs/` and add it to `check-kpi-doc.mjs`'s review scope. **M × 5** [ASYMMETRIC]
2. Add a `step` enum prop (closed set) to lifecycle events so funnel position is queryable without per-path strings. **S × 4**
3. Surface the funnel's top line on `/receipts/` ("of tool users, N% reach the founding list") once baselined — label TBD until measured. **S × 3**

**Risks & honesty-gate notes.** No conversion-rate numbers until Plausible has data — publish the *model* now, the *numbers* later. Attribution must stay bucketed: no `location.href`, `pathname`, email, or session id as a prop (`check-event-prop-cardinality.mjs` is fail-CI). Do not stitch a cross-surface user identity to "complete" the funnel — the gap is acceptable; surveillance is not.

**One proof metric.** A reproducible Plausible funnel from organic/AI landing → `Ledger Route Click` with each hop's drop-off — assembled, baseline TBD.

---

### 87 · Experimentation / A-B Lead — the experiments.json system

**Aspect & why it decides success.** A live experiment loop is how a one-person studio earns the right to claim rigor — and avoids shipping on opinion. The apparatus exists but is idle; an unused testing system is just config.

**Current-state audit (score 4/10).** The framework is real and privacy-clean: `data/experiments.json` is read by `src/worker.js` HTMLRewriter, buckets per visitor (SHA256(sub‖YYYY-MM) signed-in; SHA256(IP‖UA‖YYYY-MM-DD) anon), stamps `data-experiment/data-treatment`, fires `Experiment Exposure` once/session (deduped via sessionStorage), and CSS swaps on `[data-treatment]`. Promotion is a config edit. **But the apparatus is idle:** exactly **one** experiment (`window-cta-copy`) in `status: "draft"`, `startedAt: null`, `concludedAt: null` (`data/experiments.json`). It has honest guardrails pre-set — `minExposuresPerArm: 200`, `minConversionDelta: 10`, `goalEvent: "Window Sent"`. Score reflects excellent infrastructure, zero shipped tests.

**Benchmark gap (Booking.com / Netflix).** Booking runs ~1,000 concurrent experiments and treats *experiment quality* as the goal — "no change ships without an A/B test proclaiming victory" ([VWO, "Booking.com CRO culture"](https://vwo.com/blog/cro-best-practices-booking/)). Muntin can't match volume; it can adopt the *discipline at n=1* — one well-powered test at a time, concluded honestly.

**The Extend-Past move.** **Ship the one draft experiment** end to end as the proof artifact, then publish the result (win *or* null) on `/receipts/` — "we test, and we tell you when the test said no." Honesty as the differentiator a hype-driven competitor won't replicate.

**Actions.**
1. Move `window-cta-copy` `draft → running`: set `startedAt`, confirm `goalEvent: Window Sent` is firing, respect `minExposuresPerArm: 200` before reading. **S × 5** [ASYMMETRIC]
2. Add a one-paragraph "how we decide a winner" note (the pre-set thresholds) to `/system/` or `/receipts/`. **S × 4** [ASYMMETRIC]
3. On conclusion, record outcome in `data/experiments.json` (`promoted`/`rolled-back`) and publish the call, including nulls. **S × 3**
4. Pre-register the *next* experiment (e.g., founding-band copy) so the apparatus stays warm. **S × 3**

**Risks & honesty-gate notes.** Do not read results before `minExposuresPerArm` — underpowered "wins" are the exact rigor failure to avoid; with low current traffic this may take weeks (honest, not a delay to hide). Bucketing already privacy-safe; keep `Experiment Exposure` props bounded. No invented lift numbers — report the actual delta or "inconclusive."

**One proof metric.** Experiments concluded with a published decision (target: ≥1 this quarter), each meeting `minExposuresPerArm: 200` (`data/experiments.json`).

---

### 88 · Community / Network Builder — DMV operators → national

**Aspect & why it decides success.** A community of operators who *belong* is the one moat a surveillance-funded giant cannot buy — it's earned through trust and local presence, exactly Muntin's edge (Don works real DMV shifts). It compounds the other six domains: members refer (85), test copy (87), seed the list (84), and create AEO-citable signal (82).

**Current-state audit (score 2/10).** There is **no community surface**. A repo grep for community/forum/cohort/directory returns only incidental prose mentions in library articles and tools — no member space, no operator directory, no gathering point. The raw materials are present: a tight DMV focus (`receipts/index.html` city subpages — Silver Spring, Bethesda, Takoma Park, DC, Arlington), the Window inbound channel (`/window/`), and the founding list. Score reflects strong latent network, zero structure.

**Benchmark gap (Indie Hackers / Notion).** Indie Hackers shows community is a multi-month commitment that converts far better than one-shot launches (~23% per engaged post in one 2024 study) and becomes an acquisition moat ([Awesome Directories, 2025](https://awesome-directories.com/blog/indie-hackers-launch-strategy-guide-2025/); [Built This Week, 2025](https://learn.builtthisweek.com/startup-life/best-online-communities-for-indie-hackers-in-2025)). Notion's unpaid ambassadors prove recognition alone sustains contribution ([Bettermode, 2024](https://bettermode.com/blog/notion-community-led-growth)).

**The Extend-Past move.** Start with a **low-cost "DMV operators' table"** — a privacy-first, opt-in surface (a periodic local note + an opt-in operator wall) rather than a heavy forum. Local-tight first, national later. No third-party community widget that sets cookies — the surface must survive `/never/` and the privacy gate.

**Actions.**
1. Ship an opt-in "DMV operators" page (fact-gated names, links to their sites) seeded from Window/founding contacts who consent. **M × 4** [ASYMMETRIC]
2. Convert the lifecycle drip (84) into a light "operators' note" with one local data point per send. **S × 4**
3. Recognition tier (Notion model): name contributors who share a tool win — recognition, not pay. **S × 3** [ASYMMETRIC]
4. Defer any hosted forum until the note has a repeatable cadence — avoid a third-party embed that breaks the privacy posture. **S × 3** (a *decision*, low effort).

**Risks & honesty-gate notes.** **Privacy first:** no third-party community SaaS that drops cookies or tracks across sites; opt-in only; every operator name fact-checkable (no invented members or cohort sizes — `check-fabrications.mjs`). Don't imply Don runs/mentors multiple restaurants — he convenes peers, he doesn't operate them (singular-bio constraint). No manufactured "join now" scarcity.

**One proof metric.** Opt-in operators on the DMV wall (consented, fact-gated) — baseline 0, growth tracked first-party.

---

*Cross-domain note:* #83's fail-CI vocabulary flip is blocked until #84 fixes the `Waitlist Signup` event-name drift. #85, #86, and #88 all depend on the bounded-prop discipline of `check-event-prop-cardinality.mjs` — referral source, funnel step, and any community signal must be first-party + bucketed.


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


## Domain XIV — Engineering, Build & Reliability

> Positioning Council batch, Domain XIV (briefs 95–100). Strategy only — no live-site edits; this batch produces this one part-file. Every number is repo-sourced (cited to file), web-sourced (labeled + dated), or marked *illustrative / analyst assessment*. Operator bio is singular throughout. Slugs are treated as final-forever; no rename is ever proposed. This domain's own success metric is the one it governs: **`scripts/check-all.mjs` stays green and EN↔ES parity holds for a decade, run by one person.**

**Asymmetric thesis for the domain.** A solo operator with a disciplined, self-enforcing pipeline ships at the quality and cadence of a 50-person team. Giants carry org overhead — release managers, QA teams, design-system councils — to hold a large surface coherent. muntin carries *automation* instead: ~173 distinct build/check scripts (`ls scripts/*.mjs` → 289 files; 90 `check-*`, 80 `inject-*`, 32 `build-*`, plus wire/sync/stamp/test families), a three-layer fact gate, an article-graphics gate with its own `node:test` suite, locale-parity gates, token guards, and idempotency re-runs that make a stale page structurally impossible to ship. The bet of this domain: **reliability and automated quality are not back-office hygiene — they are a publicly provable positioning claim** (visible at `/system/`, `/changelog/`, and a status page that does not yet exist). An AI-native agent workflow (this very refresh runs as Claude-on-web against the repo) extends the same leverage further: the same one person now also edits, audits, and ships like a team, governed by `CLAUDE.md` as the agent contract.

**The honest count (cited, because the mission's number is aspirational).** The mission brief references "183/183" and "~113 checks." The real number, read from the source: `scripts/check-all.mjs` runs a single `CHECKS` array of **183 entries** in stable order (`grep -cE` on the array literal → 183), each a `spawnSync` of a script in `--check`/`--strict`/`--self-test` mode. Of those 183, **85 are dedicated `check-*.mjs` gates**, **87 are idempotency re-runs** of `inject-*`/`build-*`/`wire-*`/`sync-*` scripts (run with `--check` so "the build would change this file" fails CI), and **10 are `--self-test` invocations** of the cost-index validators. The runner has **no fail-fast** — the header comment claims "fails fast," but the code (lines 427–448) runs *every* entry, tallies failures, prints a one-line-per-check table, and exits non-zero if any failed. CLAUDE.md's "runs every `check-*.mjs` script in sequence and fails fast" is therefore **stale on two counts** (it's 183 mixed entries, and it does not fail fast). That doc-vs-code drift is itself a finding (see brief 98). **Throughout this domain, "183 gate entries" is the cited figure; never "183/183 passing" — no run output is in the repo to confirm a green count.**

---

### 95 · Build-System / DX Architect

**Aspect & why it decides success.** The ~173 sentinel-driven scripts *are* the studio's headcount. Whether one person can hold ~850 pages, six audio languages, and EN↔ES parity coherent for a decade is decided by whether the build *enforces* structure automatically or merely *documents* it. This is the load-bearing asymmetry: the giant hires people to remember the rules; muntin compiles the rules into the build.

**Current-state audit — 9/10.** Among the most disciplined static pipelines in the category. The deploy command in `wrangler.jsonc` (lines 146) is a single ~80-step `&&` chain: `sync-includes` → page generators (`build-tools-index`, `build-sheet-pages`, `build-sheets-index`) → a *second* `sync-includes` (deliberate, to restore canonical nav over generator skeletons) → injectors (knit rails, schema, TL;DR, companion kit) → CSS shell split + cache-bust + critical-CSS + lazy-loader → `build-dark-mode` → a *second* shell/cache pass → `check-all.mjs` → tar into `dist/` → lightningcss minify → pagefind index. The sentinel pattern (`<!-- count:KEY -->N<!-- /count -->`, `<!-- LIBRARY:autolink:start -->`, `<!-- glossary-knit -->`) lets every injector be idempotent — it rewrites only between its own markers. Source of truth is consistently JSON in `data/` (`site-counts.json`, `tools.json`, `sheets.json`, `cost-index.json`), rendered into HTML by build scripts. No framework, no CMS, no client-side rendering (`/system/` line 449). The DX is genuinely good: each gate runs standalone for fast iteration, and `check-all.mjs` is the one-command aggregate.

The friction: the deploy chain is a single un-named bash `&&` string. One typo'd `&&`, one script that exits non-zero on a benign condition, and the whole deploy halts with no stage label. There is no `Makefile`/`justfile`/npm-script manifest naming the stages (package.json is gitignored by design — CLAUDE.md), so the build graph lives only inside a JSONC comment and the chain itself.

**Benchmark gap (Astro / Vercel DX).** Astro's content collections give a typed schema → content contract with named build steps and incremental builds; Vercel surfaces each build phase as a labeled, individually-retryable log section (Astro Docs, "Content Collections"; Vercel Docs, "Build Step" — both current as of 2026-01). muntin's equivalent is an opaque `&&` chain. The *enforcement* is stronger than Astro's (Astro validates frontmatter; muntin validates rendered HTML, locale parity, audio narration, and token spines). The *ergonomics* of the build graph are weaker.

**The Extend-Past move.** Keep the no-framework asymmetry; borrow Astro/Vercel's *named, ordered, individually-runnable stage* ergonomics. Lift the `&&` chain into a committed, documented step list (a plain `build.mjs` orchestrator that logs each stage and its timing) so the build graph is legible, a failed stage is named, and a re-run is one stage not eighty. This makes the pipeline a *teachable* artifact — directly feeding the `/system/` positioning page.

**Actions.**
1. Extract the `wrangler.jsonc` `&&` chain into `scripts/build-site.mjs` (an ordered array of `[label, script, ...args]`, same shape as `check-all.mjs`), logging each stage + duration; `wrangler.jsonc` calls `node scripts/build-site.mjs && node scripts/check-all.mjs && …tar…`. **M × 5** — biggest single DX + maintainability win in the domain; gate-neutral (same scripts, same order).
2. Add a `--list` flag to `build-site.mjs` and `check-all.mjs` that prints the ordered step manifest, and surface a generated count ("183 gate entries / 85 check scripts") into the `/system/` page via an existing sentinel rather than a hand-typed number. **M × 4**
3. Add a tiny `scripts/lib/` doc-string convention check: every `build-`/`inject-`/`check-` script must carry a header comment naming its sentinel + its source-of-truth JSON (most already do). **S × 3**
4. Record one full local `check-all.mjs` run's table output into `docs/editorial/ground-truth-pack.md` (dated), so "green" becomes a cited fact, not an assumption. **S × 4**

**Risks & honesty-gate notes.** The extraction in action 1 must preserve the exact step order (the double `sync-includes` and double shell pass are load-bearing — `wrangler.jsonc` comments explain why; reordering wipes Spanish nav or ships skeleton chrome). Do not claim a script *count* on a public surface without generating it from `ls` at build time — a hand-typed "289 scripts" rots the moment one is added. "183 gate entries" is cited from the array literal; no passing-count is asserted.

**One proof metric.** A single `node scripts/build-site.mjs` run prints a named, timed stage list and exits 0 — and the same step manifest is what `/system/` displays (generated, not hand-typed).

---

### 96 · CI / Quality-Gate Engineer

**Aspect & why it decides success.** "Green on every deploy" is the entire safety case for a solo founder shipping for a decade. The gates are what let one person move fast without the fabrication, parity, or regression risk scaling with the content. If `check-all.mjs` is trustworthy, the operator can ship on instinct; if it has blind spots, every blind spot is an un-staffed QA gap.

**Current-state audit — 8/10.** The gate suite is broad and the idempotency discipline is the standout. 87 of the 183 entries are `--check` re-runs of generators (`check-all.mjs` lines 139–331): `inject-site-counts --check`, `build-sitemap --check`, `inject-css-shells --check`, etc. — each fails if running the writer *would change* the committed file, which makes a stale generated artifact structurally impossible to merge. The CSS shell validator is exemplary: `check-css-shells.mjs` proves a *round-trip identity* (core+tool+article concatenated equals `site.css` byte-for-byte), *cascade safety* (no selector in core AND a supplemental shell), and *build freshness* (lines 1–26) — all fail-CI. The release-gate stamper (`stamp-release-gate.mjs`) runs "belt + suspenders" (robots `noindex` meta *plus* index-filter suppression for future-dated posts). The article-graphics gate (`check-article-graphics.mjs`, 8 rules) is itself pinned by a `node:test` suite (`run-article-graphics-tests.mjs` → `test-article-graphics.mjs`) — *a gate with its own tests* is rare in a one-person shop. Self-tests on the cost-index validators (10 `--self-test` entries) test the checker logic, not just the data.

The gaps are honest and visible in the array: several gates are **warn-only** by design during rollout — `check-banned-words` (line 99), `check-pricing-consistency` (235), `check-sheet-help-cadence` (292), `check-image-formats` (319), `check-audio-coverage --warn` (421), `check-cost-index-calibration`, all the `*-freshness (warn)` entries. Each carries a dated comment with the condition to flip it to fail-CI; until flipped, a real drift only warns. And the **three runtime nets are not in `check-all.mjs` at all**: Playwright (`playwright.yml`), Lighthouse CI (`lighthouse-ci.yml`), and the Window axe-core gate (`window-a11y.yml`) all run `continue-on-error: true` and are explicitly "promote to required-check once three consecutive PRs land green" — i.e. **currently advisory, not blocking** (tests/README confirms Playwright "Not yet wired into check-all.mjs").

**Benchmark gap (Google's testing culture).** Google's "Beyoncé Rule" — *if you liked it you shoulda put a test on it; if a thing should not break, there is a test that fails when it does* (Google, "Software Engineering at Google," Testing chapters; widely current) — is the bar. muntin meets it for *content/structure* invariants better than most teams meet it for code. It falls short on *runtime* invariants (the three CI nets that can't block) and on the warn-only gates (a known-bad pattern that only warns is a test that "should fail when it breaks" but doesn't yet).

**The Extend-Past move.** Close the loop the `loop-charter.md` already names as highest-leverage — "extend a gate to the surface it's missing" and turn every warn into a fail. Make `check-all.mjs` the single source of truth for *all* invariants including runtime: wire the Playwright/LHCI/axe nets to blocking once their baselines settle, and graduate the dated warn-only gates on their stated conditions. The proof artifact is a public, green, *complete* gate run.

**Actions.**
1. Graduate the runtime nets: flip `playwright.yml`, `lighthouse-ci.yml`, `window-a11y.yml` from `continue-on-error: true` to required-check via branch protection, per each file's own "three consecutive green" rule. **M × 5** — turns 3 advisory nets into real gates.
2. Walk the warn-only list and flip each whose stated condition is met (e.g. `check-banned-words` once existing usage is fixed; `check-image-formats`, `check-pricing-consistency` once their backlogs clear). One PR per flip, with the dated comment updated. **M × 4**
3. Add a CI workflow that runs `node scripts/check-all.mjs` on every PR to `main` (the gate exists but no workflow file invokes it standalone — it runs only inside the Cloudflare deploy build). A GitHub Actions run gives a *blocking PR check* before deploy, not at deploy. **S × 5** — currently a regression only fails at deploy, not at PR review.
4. Add a `check-all.mjs --json` mode emitting the results table as JSON, so a status page (brief 97) and `/changelog/` can consume a machine-readable last-run summary. **S × 4**
5. Pin the doc-vs-code drift: add a trivial check asserting CLAUDE.md's gate description matches the array length and fail-mode (catches the "fails fast / every check-*" staleness flagged in the domain preface). **S × 3**

**Risks & honesty-gate notes.** Flipping warn→fail must follow each gate's *own* dated precondition — flipping `check-audio-coverage` before the 14 unrendered pages ship would wedge CI on un-done work, exactly the failure mode `lighthouserc.js` avoids with its two-tier baseline. Do not assert "183/183 green" anywhere; the honest claim is "183 gate entries, runtime nets advisory pending promotion." The cost-index `*-freshness` gates are *intentionally* warn-in-PR / fail-in-scheduled-run (`cost-index-refresh.yml` line 152) — do not flip those to fail-in-PR (data ages naturally between runs).

**One proof metric.** A blocking PR check runs `check-all.mjs` (183 entries) + the three runtime nets, all required, zero `continue-on-error`, green before merge — and the warn-only count in the array trends to zero.

---

### 97 · Reliability / Uptime Lead

**Aspect & why it decides success.** "Built by one person, runs like infrastructure" only lands if the operator can *show* it stays up. Reliability is the trust substrate under every other claim: an operator deciding whether to bet their restaurant's web presence on a solo shop is really asking "will this still be here, and working, next year?" A visible uptime + incident + change record answers that question the way a SaaS status page does — and is the single biggest missing reliability *signal*, not a missing reliability *fact*.

**Current-state audit — 6/10.** The reliability *engineering* is strong; the reliability *signaling* has one clear hole. On the engineering side: Cloudflare Workers Static Assets with `observability.enabled: true` (`wrangler.jsonc` lines 5, 148–155), a free-tier-friendly architecture that "deploys in under a minute, runs on a free tier" (`/system/` line 449), `_headers`/`_redirects` for cache + 410s, and a genuinely sophisticated **honest-failure posture** in the scheduled pipelines: `cost-index-refresh.yml` (lines 14–24) documents "no keys → exit 0 (never a red X before secrets set); 0 points composed → refuse to write, keep last-good; gates fail → commit nothing; persistent stall → fail red so GitHub emails the founder." That is a mature reliability philosophy ("a stale-but-true index beats a fresh-but-wrong one"). `/changelog/` exists and is public, grouped by month/surface (`changelog/index.html`), and `/system/` already ships a public "how it's built" narrative *and* a live client-side fetch to `/api/auth/me`, `/api/workbench/count` (lines 366–388) — the plumbing to read live status exists.

The hole: **there is no public status / uptime page.** No `status/`, no `uptime/` directory (confirmed by `ls`). `/changelog/` is hand-authored and its JSON-LD `dateModified` is **2026-05-02** — *~6 weeks stale* as of today (2026-06-16), with the latest section headed "May 2026 · Refresh push." A reader cannot see "is the site up right now," "when did the last deploy succeed," or "was there an incident." The honest-failure posture (a scheduled run goes red → GitHub emails Don) is *invisible to the public* — it's a private alert, not a public signal.

**Benchmark gap (Cloudflare / Stripe status pages).** Cloudflare's `cloudflarestatus.com` and `status.stripe.com` (both current 2026-01) are the convention: a component-level up/degraded/down board, a 90-day uptime history, and a dated incident log with post-mortems. Atlassian Statuspage codified the pattern. These pages are trust infrastructure — a buyer checks them before committing. muntin has the *data* (Cloudflare deploy history, the gate's pass/fail, the cron heartbeat) and the *narrative surface* (`/system/`, `/changelog/`) but no *status board*.

**The Extend-Past move.** Ship a static, honest, zero-dependency status page that turns muntin's *reliability discipline* into a *visible signal* — and do it the way only a static site can: the "status" is the deploy log + the gate result + the cron heartbeat, rendered at build time, with a small client-side ping to confirm the edge is serving. A giant's status page is a separate paid SaaS; muntin's is a generated HTML page on the same free edge it's reporting on. The asymmetry: the thing being measured and the measurement ship together, for free.

**Actions.**
1. Create `/status/` (+ `/es/status/` for parity) as a generated static page: last successful deploy date, last `check-all.mjs` result (consume the `--json` from brief 97-adjacent action), the cost-index/pressure cron heartbeat (the freshness checkers already compute age), and a "site is responding" client ping to a cheap endpoint. New slug, final-forever — name it `/status/`. **L × 5** — the headline missing reliability signal. ASYMMETRIC.
2. Add a daily/weekly GitHub Action that re-stamps `/changelog/` (or at least its `dateModified`) and `/status/` from the commit log + last gate run, so neither goes stale by hand. Reuse the `cost-index-refresh.yml` commit-scoping pattern. **M × 4**
3. Make the honest-failure alerts *also* public: when a scheduled run goes red, append a dated line to a `data/incidents.json` the status page renders (privacy-clean: surface "cost-index refresh stalled," never secrets or internal paths). **M × 3**
4. Surface a public uptime figure only once it is *measured* — wire a free external monitor (or Cloudflare's own analytics) and render the rolling 90-day number; until then the page states "monitoring since <date>" honestly. **M × 4**
5. Add a Lighthouse/LHCI badge to `/status/` that links the *measured* perf number (coordinated with Domain VII, which owns re-measurement) rather than a claimed one. **S × 3**

**Risks & honesty-gate notes.** This is the highest honesty-gate-risk brief in the domain: a status page *invites* a precise uptime number, and there is **no measured uptime figure in the repo**. Until an external monitor produces one, the page must say "monitoring since <date>" / "no incidents recorded" — never a fabricated "99.9%." Cloudflare's own platform uptime is *Cloudflare's* claim, not muntin's; don't borrow it. Incident entries are confirm-tier facts (registered, dated) and must be PII-clean and path-clean per the `/never/` privacy contract. The status page must itself survive `check-all.mjs` (locale parity, OG image, image dims, hreflang).

**One proof metric.** A public `/status/` (EN+ES) that shows last-deploy date, last gate result, and cron freshness — auto-refreshed (never hand-stale) — with `/changelog/` `dateModified` within 7 days of the latest commit.

---

### 98 · Tech-Debt / Maintainability Steward

**Aspect & why it decides success.** The whole thesis — *a solo founder ships safely for a decade* — lives or dies here. 289 scripts and a single 850-page codebase are an asset only if one person can still understand, run, and trust them in year five. Complexity that a careful human must *remember* is debt; complexity the build *enforces* is leverage. The steward's job is keeping the ratio on the right side.

**Current-state audit — 7/10.** The architecture is deliberately Basecamp-simple where it counts (no framework, no CMS, plain `index.html` per page, JSON sources of truth) and the gate suite *converts remembered rules into enforced ones* — the single best maintainability move available, and the studio does it systematically (`loop-charter.md`: "a rule a careful human remembers protects today's article; a gate protects every article forever"). The runbook corpus is unusually deep for a solo shop: `docs/` holds `DEPLOY-CHECKPOINTS.md` (pending manual flips with rollback per item), ~25 cost-index docs, cutover/handoff runbooks, and editorial ADRs (`docs/editorial/decisions/ADR-000…004`). `CLAUDE.md` is a real agent contract. The honest-failure and "belt + suspenders" patterns reduce the blast radius of any one bug.

The debt is real and concentrated: (a) **289 scripts is a lot of surface for one person** — many are one-shot migrations/cutovers (`migrate-warm-palette`, `stamp-es-restaurant-audit`, `fix-library-lang-toggles`, dozens of `tone-edit-*`/`update-*`) that have served their purpose but still sit in `scripts/` indistinguishable from load-bearing gates. (b) **Doc drift**: CLAUDE.md describes `check-all.mjs` as "fails fast" running "every `check-*.mjs`" when it neither fails fast nor runs only check scripts (it runs 183 mixed entries). CLAUDE.md and `/system/` both say "~70" scripts; the real count is 289 files / 173 distinct. (c) **The deploy chain is an 80-step `&&` string** (brief 95) — the highest-risk single artifact to maintain. (d) **Comment-encoded knowledge**: critical ordering rules live in `wrangler.jsonc` comments, not in code that enforces them.

**Benchmark gap (Basecamp / 37signals simplicity).** 37signals' doctrine — "the majestic monolith," radically small teams, choosing boring/legible tools, deleting rather than accreting (Basecamp/37signals, "Shape Up" + Rework, ongoing) — is the right north star for a one-person shop. muntin matches the *small team* and *boring stack* parts. It diverges on *accretion*: 289 scripts trends toward the thing 37signals warns against — surface that grows faster than one person's working memory. The gates are the saving grace, but the script *inventory* itself needs the same pruning discipline applied to content slugs.

**The Extend-Past move.** Apply the gate philosophy *to the codebase itself*: make "is this script still load-bearing?" an enforced question, not a remembered one. Partition `scripts/` into `gates/` (in `check-all.mjs`), `build/` (in the deploy chain), and `archive/` (one-shot migrations, retired). The asymmetry a solo shop can claim: *the build is small enough to fit in one head, and a check proves it stays that way* — the opposite of the giant's ever-growing internal tooling no one fully understands.

**Actions.**
1. Audit `scripts/` and move spent one-shot migrations (`migrate-*`, `fix-*`, `tone-edit-*`, `stamp-es-restaurant-audit` once its ES master is stable, `update-*`) into `scripts/archive/`; leave only load-bearing gates + builders in `scripts/`. **M × 5** — biggest working-memory reduction; reversible (git history retains everything).
2. Fix the doc drift in one PR: correct CLAUDE.md's `check-all.mjs` description (183 mixed entries, no fail-fast) and replace every hand-typed "~70" with a generated count. Add the brief-96 doc-vs-code check so it can't re-drift. **S × 5** — cheap, high-trust; the agent contract must be accurate or every future Claude session inherits the error.
3. Promote `wrangler.jsonc`'s ordering rules from comments into the `build-site.mjs` orchestrator (brief 95) where order is *expressed in code*, not prose. **M × 4**
4. Add a dated "script inventory" section to `ground-truth-pack.md` (count by family, which are in `check-all.mjs`, which are in the deploy chain, which are archived) so the next session reasons from the real shape. **S × 4**
5. Establish a quarterly "prune cycle" in `loop-charter.md`'s cadence: every ~3 weeks, one retired script archived or one warn-gate graduated — debt paydown as a standing rhythm, not a crisis. **S × 3**

**Risks & honesty-gate notes.** Archiving is reversible but the deploy chain and `check-all.mjs` reference scripts by path — move nothing that either invokes without updating the reference (a moved-but-still-referenced script breaks the build). Verify against both the `wrangler.jsonc` chain and the `CHECKS` array before moving. The doc-drift fix is the one *binding* correction here: CLAUDE.md is the agent contract, and an inaccurate contract is a maintainability tax paid by every future session.

**One proof metric.** `scripts/` (excluding `archive/` and `lib/`) contains only scripts referenced by `check-all.mjs` or the deploy chain — enforced by a check — and CLAUDE.md's gate description matches the code.

---

### 99 · Automation / Agent-Ops Lead

**Aspect & why it decides success.** This is the thesis's frontier. The asymmetry isn't just "automation beats org overhead" — it's "an AI-native solo company ships like a team of 50." This very refresh runs as Claude-on-web against the repo; the gates are what make that *safe* (an agent can't fabricate past the fact gate, can't ship a stale page past the idempotency checks, can't break parity past the locale gates). Agent-ops decides whether that leverage compounds reliably or accrues silent risk. Done right, it is the single most defensible part of the whole positioning: a giant cannot retrofit a solo-founder-plus-agent operating model onto a 50-person org chart.

**Current-state audit — 7/10.** The *substrate* for safe agent work is excellent and largely already built — which is the surprising strength. `CLAUDE.md` is a genuine agent contract: it states the singular operator bio, the fact-gate, the slug-immutability rule, the "don't" list, and points at the canons. The gate suite is precisely the "guardrails an autonomous agent runs inside" that AI-native teams aspire to: the three-layer fact gate (`data/sourced-claims.json` → `check-fabrications.mjs` → `check-audio-fabrications.mjs`) means an agent's prose is *checked for invention in six spoken languages before it ships*. `loop-charter.md` already articulates an agent-flavored operating loop (ORIENT→DECIDE→WRITE→READ-ALOUD→FOLD-BACK) with explicit "human checkpoints (never automate away): new claims, the bio, slugs, new-post publication." The `session-start-hook` skill exists for setting up Claude-on-web repos. So the *practice* is mature.

The gap: **there is no formal agent-governance document.** No ADR or doc records *how* agent work is bounded — what an agent may ship unattended vs. what requires Don's sign-off, how agent commits are attributed/audited, what the rollback procedure is for an agent-introduced regression, or which model/tool config is sanctioned. `loop-charter.md` names the human checkpoints for *editorial* work, but there's no equivalent for *engineering/build* agent work (can an agent flip a feature flag? touch `wrangler.jsonc`? graduate a gate?). The governance lives in one person's head + CLAUDE.md's "don't" list — exactly the remembered-not-enforced pattern the studio elsewhere converts to gates. (The mission brief confirms: "No formal agent-governance doc yet.")

**Benchmark gap (AI-native engineering teams).** The emerging convention (Anthropic's own agent guidance + the broader "agentic coding" practice, current as of 2026-01) is an explicit *agent operating contract*: scoped permissions, a human-in-the-loop matrix (what ships unattended vs. gated), commit attribution, and an audit trail. Teams adopting Claude Code / agent SDK workflows codify "the agent may do X autonomously; Y requires review; Z is forbidden." muntin has the *enforcement* (gates) and a *partial* contract (CLAUDE.md) but not the *governance matrix*.

**The Extend-Past move.** Write the agent-governance doc the studio is one step from — turning "what Don remembers about how to run Claude safely" into a versioned contract, with the human-in-the-loop matrix made explicit and, where possible, *enforced by the same gates*. Then make it a positioning asset: a public, honest "how this site is built with an AI agent inside the guardrails" note (extending `/system/`) is a claim no incumbent can make credibly. The deepest asymmetry: muntin's agent doesn't need org trust because it runs inside a *machine-checked* contract.

**Actions.**
1. Write `docs/editorial/decisions/ADR-005-agent-operating-contract.md` (or `docs/agent-ops.md`): the human-in-the-loop matrix (autonomous: on-canon prose, gate-clean refactors, idempotent re-stamps · review-required: new claims, bio, slugs, feature-flag flips, `wrangler.jsonc`, gate graduation · forbidden: fabrication, slug rename, committing secrets/package.json), commit attribution convention, and the agent rollback procedure. **M × 5** — closes the one named gap; ASYMMETRIC.
2. Make the contract partly self-enforcing: a `check-agent-guardrails.mjs` that asserts the high-risk invariants an agent must never violate (no secret patterns in committed files, package.json still gitignored, no slug-rename against the removed-slugs registry — `check-removed-slugs.mjs` already does part of this). **M × 4**
3. Add a "for agents" section to `CLAUDE.md` pointing at the new contract + the `loop-charter.md` checkpoints, so every Claude-on-web session orients to the governance first. **S × 5**
4. Capture this refresh as the worked example: record (dated, in `ground-truth-pack.md`) that the Positioning Council ran as Claude-on-web, what it was allowed to touch (docs only — one part-file), and that it shipped nothing to the live site. Provenance as proof. **S × 4**
5. Draft (do not yet publish) a `/system/`-adjacent public note on the agent-in-the-guardrails model, fact-gated, for Brand/Positioning to place once the governance doc is real. **M × 3** — coordinate with Domain I (positioning).

**Risks & honesty-gate notes.** The governance doc itself is a confirm-tier artifact: it asserts *how the studio actually operates*, so it must describe reality (one operator, agent runs against the repo, gates enforce) — not an aspirational org. Do not publicly claim "fully autonomous" anything; the honest claim is "agent inside machine-checked guardrails, human sign-off on claims/bio/slugs/flags." Any public agent-ops note must clear the same fact gate it describes (no invented metrics about agent productivity). The self-enforcing guardrail check (action 2) must not duplicate or conflict with `check-fabrications.mjs`/`check-removed-slugs.mjs` — extend, don't overlap.

**One proof metric.** A versioned agent-operating contract exists, its high-risk invariants are gate-enforced (`check-agent-guardrails.mjs` green in `check-all.mjs`), and `CLAUDE.md` routes every session to it.

---

### 100 · Future-Proofing / Standards Watcher

**Aspect & why it decides success.** A decade is the planning horizon (the domain's own mandate). The studio's durability bet is that *open web standards outlast platforms* — plain HTML, schema.org, RSS, hreflang, and emerging AI-citation conventions will be readable and rankable long after any given SaaS pivots. The watcher's job is to adopt the standards that compound (AI-readability, structured data, the post-cookie web) *before incumbents notice* — and to avoid betting the farm on any one platform's proprietary API. Get this right and muntin's content is future-citable for free; get it wrong and a standards shift silently de-ranks the whole library.

**Current-state audit — 8/10.** Forward-leaning to a degree most solo shops never reach, *and already AI-native in its output*. The site ships `llms.txt` + `llms-full.txt` (`build-llms-txt.mjs`, `build-llms-full.mjs`) — the emerging convention for LLM-readable site summaries — plus per-section H2 anchor IDs so "AI search engines (Google AI Overview, Perplexity, ChatGPT) deep-link to a specific section" (`check-all.mjs` lines 134–138, `inject-h2-anchor-ids.mjs`). Structured data is everywhere and *gated for cleanliness*: JSON-LD across articles/glossary/tools/hubs, and `check-ingredient-jsonld.mjs` enforces that "structured data (lifted verbatim by answer engines) must never carry a $ figure or Offer/Product type" (lines 350–353) — a genuinely sophisticated AEO-safety invariant. `dateModified` freshness is machine-stamped (`inject-cost-index-dataset-date.mjs`) "a top AI-citation factor" (lines 387–390). Privacy posture is post-cookie-ready: self-hosted analytics, no third-party Plausible (CI-enforced, `check-no-third-party-plausible.mjs`), `interest-cohort=()`. Modern formats are pipelined (AVIF/WebP, variable woff2). Cloudflare `compatibility_date: 2026-04-15` is current (`wrangler.jsonc` line 4).

The gaps are watch-items, not failures: (a) no evidence of *automated* standards-drift monitoring — adoption has been manual/sprint-driven (someone decided to add `llms.txt`), so a *new* standard (e.g. a successor to `llms.txt`, MCP-style content endpoints, a schema.org type revision, the next Interop milestone) would be noticed only if Don happens to read about it. (b) The platform-lock surface is growing: Durable Objects, KV, R2, Workers AI bindings (`wrangler.jsonc`) are increasingly Cloudflare-proprietary — a sound bet today, but the content/static layer's portability is the durability guarantee and should stay clean of platform lock. (c) No `data/standards-watch.json` or doc tracking *which* standards the site has adopted, at what version, and what's on the horizon.

**Benchmark gap (W3C / Google / Anthropic emerging standards).** The bar is *anticipatory* adoption: W3C/WHATWG Interop (the annual cross-browser priorities, current 2026), Google's evolving structured-data + AI-Overview guidance, schema.org's quarterly releases, and Anthropic's MCP / agent-readability conventions (current 2026-01). Incumbent SaaS platforms are *slow* here — they adopt a standard only when it's commercially forced, because their stack is heavy. A static site is *light enough to adopt early* — that's the asymmetry. muntin adopts well but *reactively*; the gap is a *systematic watch*.

**The Extend-Past move.** Turn standards-adoption from an event into a *standing capability*: a tracked watch-list + a periodic review that asks "what did W3C/Google/schema.org/Anthropic ship this quarter, and does our light static stack let us adopt it before the giants?" Keep the content layer ruthlessly portable (HTML + JSON-LD + RSS + sitemaps) so platform bets stay confined to the dynamic edge. The durable claim: *muntin's content will still be readable, rankable, and AI-citable in 2036 because it's built on standards, not a platform* — a claim a SaaS-hosted competitor structurally cannot make.

**Actions.**
1. Create `data/standards-watch.json` + a short doc: every web/AI standard the site implements (HTML5, schema.org types in use, RSS, hreflang, `llms.txt`, H2-anchor deep-linking, AVIF/woff2), its adoption date, and a "horizon" list (candidates not yet adopted). Render a public summary into `/system/` (it already narrates the stack). **M × 4** — converts reactive adoption into a tracked posture.
2. Add a quarterly "standards review" to `loop-charter.md`'s cadence (alongside the prune cycle from brief 98): one session per quarter scans W3C Interop / Google Search Central / schema.org releases / Anthropic docs and files findings into the watch-list. **S × 4**
3. Adopt the next AI-readability standard proactively: evaluate an MCP-style or successor-to-`llms.txt` content-exposure endpoint now, while the stack is light, rather than after competitors. **M × 4** — coordinate with Domain III (AEO). ASYMMETRIC.
4. Add a portability guard: a check (or documented invariant) that the *content* layer (HTML + JSON-LD + RSS + sitemap + `llms.txt`) carries no Cloudflare-proprietary dependency, so the durability claim stays true even as the *dynamic* edge deepens its platform bets. **M × 3**
5. Keep `wrangler.jsonc`'s `compatibility_date` and the woff2/AVIF/schema pipelines on a dated review so "current standards" is a maintained fact, not a one-time setup. **S × 3**

**Risks & honesty-gate notes.** "Adopt the future before incumbents" must not become *speculative* adoption — only ship a standard that's stable enough to be safe (schema.org changes can de-rank if a type is deprecated; an unstable `llms.txt` successor could waste effort). The portability claim ("readable in 2036") is an *architectural assessment*, label it as such — not a guarantee. Don't claim AI engines cite the site at any specific rate without measured evidence; the honest claim is "built to be citable" (clean JSON-LD, deep-link anchors, fresh `dateModified`), not a citation count. Any new endpoint must clear `check-all.mjs` and the privacy contract.

**One proof metric.** A maintained `standards-watch.json` (adopted + horizon, dated) with a quarterly review on the calendar — and the content layer provably portable (no proprietary dependency in HTML/JSON-LD/RSS/sitemap).

---

> **Domain XIV close.** The engineering substrate already *is* the positioning: 183 gate entries, idempotent generators, a three-layer fact gate, and an honest-failure pipeline let one person hold a 850-page bilingual surface safely. The four gaps are all "a discipline that exists but isn't yet *visible* or *complete*": the build graph is opaque (95), the runtime nets and warn-gates don't yet block (96), reliability isn't publicly signaled (97), the script inventory and agent governance aren't yet enforced contracts (98, 99), and standards adoption is reactive (100). Every move above keeps `check-all.mjs` green, EN↔ES parity intact, and the operator bio singular — and converts a remembered discipline into an enforced, provable one. That conversion *is* the team-of-50 leverage.
