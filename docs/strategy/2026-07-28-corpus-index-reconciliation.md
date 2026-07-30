<!-- PROVENANCE + STATUS — read before acting on anything below.

  Verbatim synthesis from a multi-agent design workflow, 2026-07-28. ADVISORY,
  not a decision of record. Nothing here is approved or built.

  Committed because the container is ephemeral: this lived only in /tmp. docs/
  is excluded from the deploy tar (verified), so it is never served.

  TRUST CALIBRATION. Agent-produced. Its honesty critic independently
  re-derived the publication facts against the repo and agreed with the
  orchestrator's own checks (data/ crawlable and NOT in the tar exclude list;
  docs/ excluded; robots.txt Allow: / with named allows for GPTBot, ClaudeBot,
  PerplexityBot and Google-Extended — i.e. the site explicitly opts into AI
  retrieval). Those are reliable. Market claims are not.

  NOTE ON "ALREADY BUILT". One design describes map/gate/injector artifacts as
  already built with passing self-tests. Those files were written by an agent in
  a different workflow, never reviewed, and REMOVED from the branch in c454a320f
  (one of them declared itself "HUMAN-AUTHORED" while machine-generated). The
  workflow's own honesty critic caught the same discrepancy. They are
  recoverable from c7e8de048 but do not exist on the branch today.

  THE GOVERNING RULE the operator set for this feature, which every design
  respects: it may say "the ground truth under this article moved — a human
  should look." It may never assert an article is wrong, never auto-edit prose,
  and never publish a machine-made claim. A review queue, not a verdict.
-->

# Corpus ↔ Cost Index reconciliation — design review

*Workflow run 2026-07-28 · 11 agents · 1,371,719 tokens.*

**The ask.** "I want to make sure that the index references the entirety of the corpus to actively
monitor the ground truth for changes and indicators."

**Measured going in.** 21 genuine food-cost articles; exactly 1 links to a live ingredient page.
Naive ingredient-name matching is disqualified — it flagged 55/55 articles because "apple" matches
Apple, and lemon/lime/date/turkey/sage are homographs. So any mapping must be curated or
evidence-derived, never fuzzy.

---

## The four designs

### The Desk Queue — an inward corpus-review instrument (docs/ only)

A curated, gated article→ingredient map plus a deterministic pointer-only review queue that lives under docs/ and is delivered through the existing Saturday freshness-heartbeat issue — it names the articles a human should re-read, and never says an article is wrong.

*Maintenance:* `low`

**What becomes public:**

- NOTHING NEW BECOMES A PUBLIC URL. That is the design, and it is enforced rather than assumed by scripts/check-docs-not-published.mjs.
- The one change under public data/ is data/library-tags.json — already public today, already crawlable at muntin.digital/data/library-tags.json, already carrying titles, deks and dates. The added fields are `cost_index_ingredients` (a list of slugs), `cost_index_reviewed` (a date), `cost_index_scope` (an enum). No number, no price, no percentage, no judgment about an article.
- License: unchanged. data/library-tags.json carries no per-file license today and this adds none. The CC0 per-week snapshots (cost-index/week-*.json|csv) and the CC-BY event registry (cost-index/events.json) are untouched — this feature reads them and writes nothing back.
- docs/handoff/corpus-review-queue.md, docs/handoff/corpus-review-queue.json, docs/editorial/corpus-review-state.json, docs/editorial/decisions/ADR-015-*.md and the strategic-council-board sentinel block are all under docs/, which wrangler.jsonc's build.command tar excludes. They are repo-visible to anyone with the GitHub repo and unreachable at any muntin.digital URL.
- No JSON-LD is emitted anywhere by this feature — scripts/check-ingredient-jsonld.mjs bars a $ figure, price field, or Offer/Product type from structured data, and the safest way to honor it is to emit none.
- OPTIONAL LATER, NOT IN THIS DESIGN: the same map could feed a reader-facing per-article Cost Index tile. That would be a public surface and needs its own decision — it is Case B in the build chain, must be a sentinel-bounded machine-owned tile carrying `as of` + a confidence word, and must never be woven into evergreen prose (docs/cost-index-experience-map.md:51 already forbids live cents in evergreen prose). I am deliberately NOT bundling it here.

### The Live Read — a sentinel-bounded market tile per article, and its inverse rail per ingredient

A curated, gated article↔ingredient edge list drives one machine-owned tile inside each food-cost article showing what those exact ingredients reference right now — so the prose stays durable while the numbers stay live — plus the reverse rail on each ingredient page listing the articles that discuss it.

*Maintenance:* `low`

**What becomes public:**

- data/article-cost-index-map.json — becomes live and crawlable at muntin.digital/data/article-cost-index-map.json (data/ is NOT in the wrangler tar's exclude list; robots.txt is Allow: /). This is intended and safe: it is a human-authored statement about our own prose ('this article I wrote leans on beef'), contains no measurement, no verdict and no third-party claim. It inherits the site's existing public-data posture alongside the CC0 per-week snapshots and the CC-BY cited events registry.
- The injected tile inside library/<slug>/index.html, es/library/<slug>/index.html, blog/<slug>/index.html, es/blog/<slug>/index.html — 11 pages at seed. Renders public USDA/BLS/FRED-derived wholesale references already published on the ingredient pages; adds no new public claim, only a second placement of an existing one.
- The reverse rail inside cost-index/<slug>/index.html and es/cost-index/<slug>/index.html — internal links and article titles only.
- NOT published: nothing new goes to docs/ from this feature; the review queue that consumes the map is a separate docs/ artifact and stays out of the tar.

### The Measured-Claim Spine

Give every index-derived number in the corpus a frozen, machine-checkable provenance record (claim id + ingredient key + asOf + cents), so the existing fact gate verifies at build time that the prose still matches the vintage it cited — an exact integer equality on an exact key, with a human review queue when the vintage can no longer be resolved.

*Maintenance:* `low`

**What becomes public:**

- /claims.json — gains a `measured` sub-object per measured claim. Every field in it (ingredient key, asOf, medianCents, basis, provenance) is a TRANSCRIPTION of a value the site already publishes at /cost-index/ribeye/ and in the CC0-licensed cost-index/week-*.csv. It asserts nothing new about the world. Inherits the existing /claims.json terms.
- /data/sourced-claims.json — already publicly served and crawlable today; gains the same additive block. No new claim class of information becomes public.
- NOT PUBLISHED: docs/handoff/cost-index-corpus-review.md (the review queue) and docs/editorial/decisions/ADR-015-*.md. docs/ is excluded from the wrangler build.command deploy tar. This is deliberate and load-bearing — a machine-generated 'the ground truth under this article moved' list written to data/ would become a live crawlable machine-authored claim about the operator's own articles.
- No new JSON-LD. check-ingredient-jsonld.mjs forbids $ figures / price fields / Offer / Product in structured data, and this feature emits none.

### Declared Ingredients — a corpus ledger with a heartbeat, not a monitor

One hand-curated field on every article entry in data/library-tags.json saying which tracked ingredients that article leans on, defended by a fail-CI integrity gate, plus a three-trigger Saturday nudge bolted onto the freshness-heartbeat workflow that already exists — no new artifact, no new publication surface, no reader-facing change.

*Maintenance:* `low`

**What becomes public:**

- NOTHING NEW BECOMES A PUBLIC URL. That is the point of this design.
- data/library-tags.json is already public and crawlable (the wrangler.jsonc tar excludes docs/, scripts/, _includes/, src/, .github/ — but NOT data/; robots.txt is Allow: /). It gains two fields that are human-authored and assertion-free: a curator's statement about their own text. No license change; it inherits whatever the existing file carries.
- The review queue is a GitHub issue in a private repo — not a file, not in data/, not in docs/, not in the tar, not routable. It cannot be crawled because it does not exist as a served artifact.
- docs/editorial/decisions/ADR-015-*.md is excluded from the deploy tar (verified: --exclude=docs in build.command). Not web-routable.
- cost-index/events.json is read but never written; it is already public under CC-BY with framing:'co-occurrence-not-causation'.


---

## Critic verdicts

**HONESTY & PUBLICATION-SURFACE REVIEW. I re-derived every load-bearing publication claim against the repo rather than trusting the dossier.  WHAT I CON…**

- `ADOPT-REDUCED` (7/10) — The Desk Queue — an inward corpus-review instrument (docs/ only)
- `REJECT` (3/10) — The Live Read — a sentinel-bounded market tile per article, and its inverse rail per ingredient
- `ADOPT-REDUCED` (6/10) — The Measured-Claim Spine
- `ADOPT` (8/10) — Declared Ingredients — a corpus ledger with a heartbeat, not a monitor

**MECHANICAL FEASIBILITY REVIEW — measured against the repo at /home/user/potentially-profitable, 2026-07-28.  I ran the pipeline rather than reasoning …**

- `ADOPT-REDUCED` (5/10) — The Desk Queue — an inward corpus-review instrument (docs/ only)
- `ADOPT-REDUCED` (6/10) — The Live Read — a sentinel-bounded market tile per article, and its inverse rail per ingredient
- `DEFER` (7/10) — The Measured-Claim Spine
- `ADOPT-REDUCED` (7/10) — Declared Ingredients — a corpus ledger with a heartbeat, not a monitor

**VERDICT UP FRONT: the null hypothesis mostly wins. Hand-curate links on the six articles that matter, hand-fix the one live contradiction, and build e…**

- `ADOPT-REDUCED` (5/10) — The Desk Queue — an inward corpus-review instrument (docs/ only)
- `ADOPT-REDUCED` (4/10) — The Live Read — a sentinel-bounded market tile per article, and its inverse rail per ingredient
- `ADOPT-REDUCED` (6/10) — The Measured-Claim Spine
- `ADOPT-REDUCED` (6/10) — Declared Ingredients — a corpus ledger with a heartbeat, not a monitor


---

## Plan of record

# PLAN OF RECORD — Corpus ↔ Cost Index

**Date:** 2026-07-28 · **Repo:** `/home/user/potentially-profitable` · **Status:** decided, pending operator sign-off on §1

Every number below was re-measured against the tree today, not carried from the dossier. Where the dossier, a design, or a critic was wrong, the correction is marked **[verified]**.

---

## 1. THE HONEST ANSWER TO THE ASK

The corpus does not need ground-truth monitoring, and building it would produce a machine that fires on the wrong articles. Measured drift under both flagship evergreens is 0.0%; the largest drift in the corpus (romaine −66%) sits under an article that uses romaine as a *rhetorical example of a spike*, and the second largest (eggs +84%) sits inside a dated, cited dispatch. The three articles with the most food-cost language are the most deliberately hedged — `library/restaurant-prime-cost/index.html` says outright *"(Every figure in this walkthrough is illustrative, chosen for round arithmetic, not measured.)"* — so their durability is load-bearing, not accidental. Meanwhile the strongest available trigger, `flag.gated`, is **true for 0 of the 32 ingredients that carry the field [verified]**, the editions spine is **4 entries deep with exactly one commensurable per-ingredient pair [verified]**, and 3 of 39 curated registry events run into the live window. A monitor built on this emits nothing on day one and stays that way. What the operator actually means by "the index references the entirety of the corpus" is served by two things the evidence does support. **First, the join does not exist at all: zero editorial articles link any `/cost-index/<ingredient>/` page [verified — the only four files in `library/` + `blog/` carrying a per-ingredient href are the machine-generated dispatches; 191 editorial files link the `/cost-index/` hub and stop there].** `library/what-beef-prices-mean-for-your-restaurant/` leans on ribeye, beef-tenderloin, short-rib and ground-beef — all four tracked, all four with live rendered pages — and links none of them. **Second, every genuine rot instance in this corpus is a declared claim contradicting another declared claim, not a price moving:** the site currently asserts USDA beef at +12% seven times in the evergreen and six times in its Spanish mirror **[verified]**, while `blog/restaurant-cost-pressure-2026/index.html` — published eight days *earlier* — reports the revision to +7.5% and says so explicitly, and `data/sourced-claims.json#claims.usda_beef_veal_forecast_2026` still holds 12.1% with `used_in` naming only the two dispatch slugs **[verified]**. So: build the join, fix the contradictions, and monitor our own declarations against each other — never the market against the prose.

---

## 2. WHAT SHIPS — PHASED

### Phase 0 — Unblock and hand-fix (≈1 hour, blocking, do first)

**What it does.** Two things that need no system and are currently more valuable than anything else in this plan.

**0a. The deploy is red right now [verified].** `node scripts/check-all.mjs` exits 1: **256 of 260**, failing on `CSS cache-bust (idem)`, `Themes review board (idem)`, `Theme story pages (idem)`, `Cuisine landing pages (idem)`. `check-all` is the tail of the `wrangler.jsonc` `build.command` chain, immediately before the tar — and **three of those four generators are not in the chain [verified: `build-themes-review-board.mjs`, `build-theme-story-pages.mjs`, `build-cuisine-landing-pages.mjs` each appear 0 times in `wrangler.jsonc`]**, so the deploy build will not self-heal them. Fix:

```
node scripts/inject-css-cache-bust.mjs
node scripts/build-themes-review-board.mjs
node scripts/build-theme-story-pages.mjs
node scripts/build-cuisine-landing-pages.mjs
```
then commit. Nothing else in this plan may land until `check-all` exits 0.

**0b. Reconcile the USDA beef forecast.** By hand, in one sitting:
- `library/what-beef-prices-mean-for-your-restaurant/index.html` — 7 occurrences of `12%` including the lede, the FAQ and a `viz-diverge__num` figure
- `es/library/precios-de-la-carne-de-res-para-tu-restaurante/index.html` — 6 occurrences
- `data/sourced-claims.json#claims.usda_beef_veal_forecast_2026` — `12.1%`, `date_verified: 2026-06-14`, `used_in: ["restaurant-menu-inflation-2026","inflacion-de-menu-de-restaurante-2026"]`

Target: +7.5% inside the 3.1–12.2% band, matching what `blog/restaurant-cost-pressure-2026/` and `blog/el-nino-food-prices-2026/` already say; bump `date_verified`; add the evergreen and its mirror to `used_in`; bump `dateModified` on both articles. **No system finds this and none is needed.** Note the existing gate is structurally blind to it: the evergreen renders the ERS URL **zero times [verified]**, so `check-claim-usage.mjs` cannot see it.

**Output:** existing files only. **Gate:** `check-all` back to green; `node scripts/check-claim-usage.mjs` still 0 violations. **Signal to continue:** it's an hour; there is no stop condition.

---

### Phase 1 — The edge list, its gate, and hand-placed links (ONE DAY)

**What it does.** Creates the corpus↔index join that every design and every critic converged on, and spends it immediately on the reader-facing win.

**Files:**

| Path | Kind | Note |
|---|---|---|
| `data/article-cost-index-map.json` | NEW, hand-authored | **PUBLISHED** (`data/` is not in the tar's exclude list **[verified]**; `robots.txt` is `Allow: /`) |
| `scripts/check-article-cost-index-map.mjs` | NEW, ~130 lines | pure exported `mapIssues(map, env)` + `--check` + `--self-test`, structural clone of `scripts/check-ingredient-aliases.mjs` |
| `scripts/check-all.mjs` | EDIT, 2 lines | beside the alias gate |
| ~6 article HTML files + ES mirrors | EDIT, by hand | the actual links |
| `docs/editorial/decisions/ADR-015-corpus-cost-index-linkage.md` | NEW | **INTERNAL** (`--exclude=docs` **[verified]**) |

**Host: a standalone file, not `data/library-tags.json`.** This is the one place a minority design (B) wins and I am adopting it. `library-tags.json` is missing **both** `restaurant-prime-cost` (the #1 offender at 79 food-cost mentions) and `cost-index-2026-07` **[verified: 53 entries, neither present]**; ~19 scripts read it and ~10 write it; and decisively, `scripts/build-cost-index-dispatch.mjs:772` and `:1996` do `data.blog_posts[slug] = { … }` — a **whole-object replace [verified]** — with `.github/workflows/cost-index-dispatch.yml` git-adding the result. Any required per-entry field there is destroyed by CI on the next publish and fails the deploy at the tail of the chain, with no human in the loop. A standalone file owes that exemption zero times and covers `restaurant-prime-cost` on day one with no schema surgery and no side effects on the library index, the recent rail, or `check-pillar-coverage.mjs`.

**Shape** — keys are `"<library|blog>/<slug>"` so the namespace is resolved in the key, never by probing:

```jsonc
{
  "_doc": "Hand-curated. Which tracked Cost Index ingredients an article leans on. NEVER seeded by name matching — see ADR-015.",
  "_lastReviewed": "2026-07-28",
  "articles": {
    "library/what-beef-prices-mean-for-your-restaurant": {
      "ingredients": ["ribeye", "beef-tenderloin", "short-rib", "ground-beef"],
      "reviewed": "2026-07-28",
      "note": "Four tracked cuts, all page-backed; article currently links none."
    },
    "library/restaurant-prime-cost": { "ingredients": ["green-beans"], "reviewed": "2026-07-28" },
    "library/keep-plate-cost-honest-when-prices-change": { "ingredients": ["romaine-lettuce","tomato"], "reviewed": "2026-07-28" },
    "library/restaurant-menu-engineering": { "ingredients": [], "scope": "none", "reviewed": "2026-07-28" }
  }
}
```

**Gate rules** (`check-article-cost-index-map.mjs`, fail-CI):

0. **Enumeration completeness.** Walk `library/*/index.html` and `blog/*/index.html`, minus `scripts/lib/library-skips.mjs`'s three collection landings. Every article must appear in the map — either with `ingredients` or with `scope: "none"`. *This is the literal, permanently-gateable reading of "the index references the entirety of the corpus." Completeness of the **enumeration** is gateable forever; completeness of the **mapping** is a human judgment and the ADR must say so in its opening paragraph.* Exempt `/^cost-index-(week-)?\d{4}/` so the dispatch upsert can never fight it.
1. Every mapped article slug resolves to a real `index.html`.
2. Every ingredient key is a key in **`data/cost-index.json#ingredients` (100 keys)** — *not* `cost-index-sources.json`'s 231, which would admit 131 keys with no index entry at all **[verified: 231 source keys, 100 index keys]**.
3. Every ingredient key has a rendered `cost-index/<key>/index.html`. **[verified: 100 page dirs, 6 are hubs → 94 ingredient pages; 6 index keys are pageless: `striploin`, `squid`, `clams`, `shrimp-head-on`, `shrimp-pd`, `pork-belly`]** Without this rule a declaration ships 404s from high-traffic articles.
4. No duplicates; cap 5 per article.
5. `reviewed` is ISO-8601; **warn** past 365 days, never fail — the `retrievedAt` posture from `check-cost-index-drivers.mjs`.

**The volatility firewall (non-negotiable).** This gate reads **only** the map, `data/cost-index.json`'s key list, and filesystem existence. It must never read a `level`, `trend`, `flag`, or `confidence`. A Mon/Wed/Fri refresh changes values, not keys, so it can never redden a local `node scripts/check-all.mjs`. That is the single property that decides whether a one-person repo can carry this during a semester.

**Then spend the map.** Hand-place the links in the ~6 articles, EN and ES. **All four flagship ES mirrors exist [verified: `costo-primo-de-restaurante`, `ingenieria-de-menu-para-restaurantes`, `costo-del-plato-cuando-cambian-los-precios`, `precios-de-la-carne-de-res-para-tu-restaurante`], and `data/i18n-slug-map.json` carries a 37-entry `library` section the dossier never mentioned [verified].** The bilingual half is free and three of four designs left it on the table. `check-locale-parity.mjs:50` skips `blog/` and `library/`, so ES is upside, not obligation.

**Effort:** ~1 day. Map seeding ~45 min by hand (pick from `data/ingredient-yields.json`'s 118 slugs, cross-check each against `ls cost-index/<key>/`); gate ~2 hr; links ~1.5 hr across 12 files; ADR ~30 min.

**Continue/stop signal:** Rule 0 must catch at least one real thing on the first run (it will — it flags every article, forcing the triage pass). Stop and reassess if seeding the map takes more than one sitting, or if fewer than 5 articles yield a non-empty array — that would mean the corpus is even more abstract than measured and there is nothing to link.

---

### Phase 2 — Supersession, on the drawers that carry contested external claims (≈half day, CONDITIONAL)

**Precondition:** Phase 0b actually happened by hand, and a *second* declared-claim supersession occurs. Do not build this pre-emptively.

**What it does.** Adds `supersedes` to `data/sourced-claims.json` and `data-claim="<id>"` to the ~10–15 cite drawers carrying contested *external* claims (USDA forecasts, DoorDash tiers, vendor rates) — **not** all 295. **[verified: 295 bare `<details class="cite">` across `library/` + `blog/` + `es/`, zero carrying any attribute — the dossier's "163" undercounts.]** Extends the existing `scripts/check-claim-usage.mjs` (already live, already green) rather than adding a new script.

**Severity, corrected from Design C:** a supersession finding is **WARN, never fail-CI**. A fail-CI tier here is coercive — the cheapest way to green is to *delete the `data-claim` attribute*, silently unlinking the claim and destroying the exact bookkeeping the feature exists to build. Same for any vintage mismatch: `scripts/build-cost-index.mjs:83` is `byAsOf.set(p.asOf, p) // incoming wins on same asOf`, so an upstream restatement of a past vintage would block a deploy over a number that was point-in-time correct. WARN, and let the human adjudicate.

**Explicitly deferred within Phase 2:** the vintage-resolution ladder. It guards against past vintages being silently rewritten — an event nobody has observed — and its CC0 fallback rung is **already broken [verified: only `cost-index/week-2026-06-18.json` and `week-2026-07-06.json` exist; `blog/cost-index-2026-07/` shipped with no snapshot and no editions entry, the ADR-012 obligation confirmed lapsed]**.

**Output:** `data/sourced-claims.json` (PUBLISHED, already is), article HTML attributes. **Effort:** ~half day. **Signal:** ship only on a second real supersession.

---

### Phase 3 — The review queue (NOT SCHEDULED)

Build only if **either** `flag.gated` becomes `true` for a key declared in the map, **or** a third claim supersession occurs. If it is ever built: `scripts/build-corpus-review-queue.mjs` → `docs/handoff/` (**INTERNAL**), delivered as one line in the `GATES` heredoc of `.github/workflows/freshness-heartbeat.yml`, which already opens-or-updates a single rolling `freshness`-labelled issue. No new cron, no new script in `check-all`, no state ledger, no ack CLI.

**Precondition nobody verified and everybody assumed:** confirm the GitHub repo's visibility before writing a single machine-generated row anywhere outside the container. "Excluded from the Cloudflare tar" is not "not published." If `Donwonmagic/potentially-profitable` is public, a committed `docs/` queue file and a GitHub issue are both world-readable and indexable — the exact species the honesty rule forbids, relocated to a surface the designs did not check. `gh` is unavailable in this container.

---

## 3. THE MECHANICAL ANSWER ON (idem) BYTE-STABILITY WITH LIVE VALUES

**The premise every design inherited from the dossier is false, and I have the receipt.** "check-all runs only at the tail of `build.command`, after all ~75 injectors, so an (idem) check can never fail at deploy" is wrong. The chain has **79 `node scripts/*.mjs` steps [verified]**, `check-all` registers 88 `(idem)` checks, and a large minority are not in the chain — proven by the three failing `(idem)` checks today whose generators appear **0 times in `wrangler.jsonc` [verified]**. For that class, `check-all` is a genuine drift gate against committed state and the deploy build does *not* regenerate it. `build-claims-json.mjs` and `inject-library-cost-index-hero.mjs` — the two precedents the dossier reasoned from — are both in that not-in-chain class **[verified]**.

**The resolved rule, in three cases:**

- **Case A — output derives only from non-volatile committed data.** Register the `--check` in `check-all`. Phase 1's gate is here, and trivially so: it writes zero bytes, so there is no emitted byte to be unstable. Its inputs (the hand-authored map, the index *key list*, filesystem existence) change only when a human edits them.
- **Case B — output derives from live index values.** The injector goes in the `build.command` chain and is **deliberately not registered in `check-all`**. This is the documented exclusion at `scripts/check-all.mjs:368-376` for `build-ingredient-yield-pages.mjs`. Byte-stability is achieved by placement, not by the generator: the deploy build regenerates from whatever `data/cost-index.json` is committed, so `--check` can never fail at deploy. What you *buy* with this is a permanent, ungated gap between committed HTML and deployed HTML.
- **Case C — page generators that emit whole pages.** Refresh workflow only.

**So: is the outward-facing live-value version possible at all? Yes — and we are not doing it.** It is mechanically achievable as Case B, and the trade is explicit: **stale cents frozen into committed `/library/` HTML that no gate re-verifies.** That is the one directory `check-banned-words` scans and `check-fabrications` reads, and it would create a new fact-gate surface where a number in committed prose has no gate tying it to data. Three further hazards make the call easy:

1. **`scripts/check-cost-index-confidence.mjs:35` iterates only `['cost-index','es/cost-index'] [verified]`** and keys on `class="ci-read"`. The site's own enforcement of *"wholesale, never delivered price"* + *"a confidence label is present"* does not reach `library/` or `blog/`. Any approved live-value surface must **widen that gate's roots and reuse `.ci-read`**, never fork a parallel gate beside it.
2. **`scripts/build-llms-full.mjs:91` strips `<aside>`** before emitting the full-body corpus that `llms.txt` advertises to GPTBot/ClaudeBot/PerplexityBot/Google-Extended — and that script is in **neither the chain nor `check-all` [verified: grep count 0 in both]**. A tile is safe from the AI-citation corpus only by virtue of one HTML tag, with nothing guarding it. (Separately: `llms-full.txt` is therefore drifting from the live site right now, unwatched. Worth a small independent fix.)
3. The concrete case kills it anyway. A tile on `library/what-beef-prices-mean-for-your-restaurant/` declaring `ground-beef` would print **$5.51 wholesale, asOf 2026-06-10 [verified]** inside the same `<article>` as the prose *"low four dollars a pound at wholesale"* — same basis, 37% apart, in EN and ES. The dossier lists that as an unresolved rot finding requiring human adjudication. The tile renders it instead of adjudicating it, and the cheapest way to make the page stop contradicting itself becomes *deleting one array element* — the feature would reward concealment.

**Phase 1 sidesteps all of this by carrying no values.** A hand-placed `<a href="/cost-index/ribeye/">` is static HTML in a committed file. There is no injector, no sentinel, no volatility, and no `(idem)` question to answer.

---

## 4. WHAT WE ARE NOT BUILDING

- **A price-drift monitor.** 0.0% measured drift under both flagships; the two largest drifts land on a rhetorical example and a dated dispatch. It would be a noise generator whose noise lands on the most carefully written articles.
- **The forward live-value tile inside article prose** (Design B's core). See §3. Also: the four artifacts it reported as BUILT with passing self-tests **do not exist on disk [verified]**, and `HEAD~2` is `c454a320f revert: remove three unreviewed agent-authored files I committed by mistake` **[verified]**. Price it as unbuilt.
- **A review queue or attention gate in the first increment** (Design A's generator, Design D's T1/T2/T3). All triggers verified at ~zero rate: `flag.gated` true 0/32; 3 of 39 registry events in window; 4-entry spine with one commensurable pair; 1 known audit finding. Design D's T1 is worse than advertised — `build-cost-index-pages.mjs` has **no prune logic**, so a retired ingredient's page rots in place rather than 404ing, meaning "lost its page" can essentially only fire on the 6 already-pageless keys.
- **The ack ledger** (`docs/editorial/corpus-review-state.json`, `firstSeen`/`ackedAt`). An acknowledgment record for a queue that emits nothing, and a mechanism whose failure mode — acking without opening the article — manufactures a false record that the corpus was reviewed.
- **`check-docs-not-published.mjs`.** Guards an invariant never violated and visible in one grep **[verified: `--exclude=docs` present, `--exclude=data` absent]**. Put it in the ADR as prose.
- **Hosting the map in `data/library-tags.json`.** See §2 Phase 1.
- **Fail-on-absence across all 53 `library-tags` entries.** A permanent publishing tax on every future article, forever, to feed a gate that fires never. Enumeration completeness lives in the standalone map, where the dispatch upsert cannot reach it.
- **Automated map seeding.** Naive entity matching flagged 55/55 articles. Any script that infers the edge list reintroduces it inside a published file.
- **Pettitt regime breaks, `cost-outlook.json` tilt, per-revision churn, confidence-shadow relabels, low-confidence pressure flips, `elevatedWeeks` as a trigger.** Record the refusal and its reason in ADR-015 so the next session cannot relitigate from first principles.
- **More than one ADR.** All four designs proposed ADR-015. There is one: `docs/editorial/decisions/ADR-015-corpus-cost-index-linkage.md`, and its most important content is the refusals plus the measured evidence behind them.

---

## 5. THE HONESTY FENCE

Rules a gate can actually test, in order of how load-bearing they are.

**GOVERNING RULE.** *This system produces a review queue, never a verdict.* It may say "the ground truth under this article has moved — a human should look." It may never assert that an article is wrong, never auto-edit prose, never present co-occurrence as cause, and never publish a machine-made claim. Enforced by the rules below, not by intention.

**The sharp line, verbatim for the ADR:** *A human-authored statement about our own prose may live in `data/`. A machine-computed statement about our own prose may not.* `cost_index_ingredients: ["ribeye"]` is a curator's claim about a file the operator wrote — it has no truth conditions in the world and nothing for a pattern blocklist to adjudicate. That is exactly why it is safe in a directory that is live and crawlable at `muntin.digital/data/*` under `Allow: /` with named allows for GPTBot, ClaudeBot, PerplexityBot and Google-Extended.

Testable rules for `check-article-cost-index-map.mjs` (Phase 1) and any future queue:

1. **No name matching, structurally.** Every edge must be an explicit key in the committed map. The gate rejects any ingredient key not literally present in `data/cost-index.json#ingredients`. There is no string-matching code path to regress into.
2. **No machine write-back.** Nothing computed may ever write into `data/article-cost-index-map.json`. Testable: the map's only writer is a human; assert no `scripts/*.mjs` other than the validator opens it for write.
3. **No dead links.** Every declared key has a rendered `cost-index/<key>/index.html`.
4. **No values in the map.** Assert the map contains no numeric field, no `$`, no `¢`, no `%`. It is slugs, dates and prose notes only.
5. **Queue rows (if Phase 3 ever ships) carry no magnitude.** No digit outside an ISO date. That single rule makes the wholesale-vs-delivered rule, the no-forecast rule, the no-driver-magnitude rule, the no-price-in-an-inferred-block rule and the no-dollar-off-a-non-dollar-basis rule all unbindable by construction rather than by policing.
6. **Point-in-time framing is mandatory and testable.** Every row carries the article's `dateModified` *and* the signal's own date, and ends with the invariant sentence: *"A human should look. This is not a finding that the article is wrong."* Assert every emitted row ends with that exact string.
7. **No causal or forecast construction.** Replay `CAUSAL_RE` and `FORECAST_RE` from `scripts/check-cost-index-events.mjs` over the rendered output; assert zero hits.
8. **An INADMISSIBLE constant with a zero-row `--self-test`,** naming Pettitt regime breaks, outlook tilt, revision churn and shadow relabels with their disqualifying reasons inline. Makes the refusal automatic rather than a matter of anyone remembering ADR-011 §1.
9. **Severity discipline.** No gate in this family may be fail-CI when the cheapest path to green is editing published prose or deleting a linkage attribute. Supersession and vintage findings are WARN. Structural findings (dangling slug, invalid key, missing page) are fail-CI.
10. **Any live-value surface must extend `check-cost-index-confidence.mjs`'s roots and reuse `.ci-read`** — never a parallel gate. And it must be wrapped in `<aside>` until `build-llms-full.mjs` is itself gated.

---

## 6. HOW THIS COMPOSES WITH THE TWO KNOWN DEFECTS

**The 20 broken `used_in` edges are already fixed. [verified]** Commits `9bd4dc8da` and `c7e8de048` landed `scripts/check-claim-usage.mjs`; I ran it: *"144 used_in edge(s) across the registry all resolve. 0 violations."* The brief's stated opportunity-cost baseline is stale. What remains is softer and does **not** block anything here: 23 warnings (a page cites a claim without rendering its URL) and 10 claims registered but cited nowhere (`uber_eats_published_rates`, `grubhub_published_rates`, `past_roles`, …). That gate is also the structural template Phase 2 extends — do not write a new script beside it.

**The unlinked cite drawers are the real prerequisite, they are 295 not 163 [verified], and they block Phase 2 only — not Phase 1.** Every one is the bare string `<details class="cite">`; not one carries `data-claim` or any id. That is why the registry cannot be mechanically joined to the prose, and why `check-claim-usage.mjs` is blind to the beef contradiction: the join today is a `source_url` string match, and the evergreen renders the ERS URL **zero times [verified]**. So a 295-drawer retrofit is *not* Phase 1's prerequisite — Phase 1's join is article→ingredient, which needs no drawer linkage at all.

**Ordering, decided:**

1. **Phase 0a first, absolutely.** Nothing ships onto a red `check-all`; three of the four failures will not self-heal at deploy.
2. **Phase 0b second, and uncoupled.** The 12% / 7.5% split is shipping in two languages on the highest-ranking evergreen right now. It is twenty minutes of hand work and it outranks every system in this plan. Do not let building the join become the reason it stays unfixed.
3. **Phase 1 third.** It depends on neither defect. It is the input every deferred phase consumes, and — decisively — it keeps all of its value if every queue and every tile is later killed, which at 0.0% measured drift is the outcome to plan for.
4. **The drawer retrofit only when Phase 2 triggers, and only for the ~10–15 drawers carrying contested external claims.** A blanket 295-drawer pass will not happen during a semester, and scoping it to "newest-first, opt-in" is how it silently never happens at all. Scope it to the claims that have actually been superseded.

**Two adjacent lapses, cheaper than anything here, worth naming so they are not lost:** the ADR-012 obligation has already broken — `blog/cost-index-2026-07/` is live at 2026-07-09 with **no editions entry and no `cost-index/week-2026-07*.json|csv` snapshot [verified: spine holds 4 entries ending 2026-07-06; only two week snapshots exist]** — and `/about/`'s live basket read is frozen because `cost-index-refresh.yml`'s `git checkout -- .` reverts `inject-about-cost-read.mjs`'s stamp, with no gate reporting it.

**Uncertainty I am not papering over.** (a) Repo visibility is unverified and it changes the safety verdict on any future queue. (b) `reviewed` with a 365-day warn is a weak instrument, and it is load-bearing: the whole map's truth depends on declared arrays still matching what the articles discuss, and its own failure mode — the ledger lying quietly — has no detector. (c) The forward-tile refusal rests partly on a strict reading of `docs/cost-index-experience-map.md:51`; if the operator reads "transcluded tile" permissively and wants live cents in the corpus, that is a legitimate editorial call, and §3 states exactly what it would cost and exactly which two gates (`check-cost-index-confidence.mjs` roots, `build-llms-full.mjs` registration) must be widened first.