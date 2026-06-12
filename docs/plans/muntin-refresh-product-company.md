# Muntin refresh: traffic recovery + product-company repositioning

Synthesized 2026-06-11 from a 15-seat specialist audit (services-sunset pod:
information architect, migration-SEO engineer, conversion strategist,
CI-gates engineer, offer strategist; traffic pod: SEO content strategist,
AI-answer specialist, cadence analyst, technical-SEO auditor, digital-PR
strategist; brand pod: brand strategist, design-system lead, voice
architect, trust designer, positioning analyst). Companion to the Ledger
launch plan (`Muntin-Invoice-Decoder/runbooks/launch-plan-2026-11-13.md`).

## 1. Diagnosis — why daily visitors are faltering

The May strategy was sound and then stopped. Evidence in this repo:

1. **Publishing momentum lost (primary).** Nine bilingual posts shipped
   May 11–30 (the "wave"), then nothing. The wave thesis was recency +
   citation; the recency signal decayed within weeks. The May posts
   themselves committed to "future batches… hooked to current events" —
   that queue never materialized.
2. **The freshness heartbeat never started (secondary).** The cost index
   went live ONCE (2026-06-05, 16 verified ingredients) with no weekly
   automation, no visible "updated N days ago," and a stale `_doc` header
   in `data/cost-index.json` still claiming the file is empty (it isn't —
   fix the header). A weekly-updated, dated data surface is the single
   strongest recurring freshness + citation signal this site can emit.
3. **Library staleness (tertiary).** 122 library pages with old
   dateModified stamps; AI-era discovery weights freshness heavily.
4. **No feedback loop.** KPI dashboard last reviewed 2026-04-30; no
   AI-referral metric despite the entire May wave being about AI search.
5. **Distribution incomplete.** 2 of 9 wave posts still have pending
   audio (no owner assigned).

## 2. Founder decisions needed (gate the work below)

- **D1 — Sunset depth.** RECOMMENDED: full services sunset — delete
  `/services/*` + ES mirrors, 301 → `/studio/` (which is rewritten as the
  company page). Alternative: archive page. Either way, services leave
  nav/funnel/drip.
- **D2 — Revenue check FIRST.** If care plans ($99/$225-mo) have active
  subscribers, migrate them (e.g., founding Ledger rate) before sunset.
  Audit the subscriber store before Phase R2 starts.
- **D3 — Keep `/studio/call/`?** Recommended: keep, reframed as a
  20-minute operator consult (relationship + research channel), not a
  sales funnel.

## 3. R1 — Traffic recovery: start the heartbeat (week 1; highest leverage)

1. **Automate the weekly read.** GitHub Actions (or the ledger-spec cron
   worker) weekly: fetch USDA/BLS/FRED → `build-cost-index.mjs` → commit
   `data/cost-index.json` → deploy. Surface "Data updated <asOf>" on
   `/cost-index/` + ingredient pages + `/tools/cost-pulse/`. Fix the stale
   `_doc` header. This is also the launch plan's "un-backfillable clock."
2. **Publish a weekly dispatch** anchored to the data: one short, dated
   blog post per week ("the basket read, week of …"), EN+ES — the
   recurring publication the May posts promised. Hold/watch/act flags are
   already computed (`tools/_shared/cost-spike.js`); the post writes
   itself from the data.
3. **Restart event-hooked waves**: 1–2 posts/month on Google updates,
   delivery-platform policy, wage-law inflections (the founder's own
   committed cadence). Maintain a visible queue in `blog/drafts/`.
4. **Finish the two pending audio renders** (`data/article-audio.json`:
   instagram-seo, ai-platform-recommendations) — assign voice, run
   `render-post-audio.mjs`.
5. **Freshness pass**: genuinely re-review the top ~20 cost/margin
   library articles (tag-ranked), update content where stale, bump
   dateModified honestly (review-with-changes only — no fake bumps; the
   fact gate culture applies to dates too).
6. **Close the loop**: refresh `data/kpis.json` review; add an
   AI-referral segmentation (ChatGPT/Perplexity/Gemini referrers) to the
   KPI dashboard so the next wave has a scoreboard.

## 4. R2 — Services sunset (gate-aware runbook; after D1–D3)

Precedent: the retired invoice-decoder pattern (`_redirects` 301s +
`check-removed-slugs.mjs` allowlist).

1. Pre-flight: subscriber/revenue audit (D2); pause drip emails 04–06
   (services-pitch sequence); Search Console backlink snapshot of
   `/services/*`.
2. One PR, EN+ES together (locale-parity gate): delete
   `services/*` + `es/services/*`; add 301 blocks → `/studio/` (+
   `#pricing` anchors); extend `check-removed-slugs.mjs` patterns;
   `check-pricing-consistency.mjs` gains a sunset skip (services list
   empty ⇒ pass); `data/services-pricing.json` marked historical.
3. Rewrite `/studio/` as the COMPANY page (see R3): what Muntin Digital
   builds (Ledger + the free cost-intelligence toolset + the library),
   the consult call as the only "service" remnant.
4. Rewrite drip 04–06 → Ledger-first (pricing → founding rate; care-plan
   → Ledger care; direct-ask → try Ledger / book consult).
5. Homepage funnel: primary CTA becomes the app + free tools ("Try it
   free" canon CTA → cost tools; "See pricing" → ledger.muntin.digital);
   "Run my free audit" stays (it's a free tool, top-of-funnel).
6. Rebuild: sitemap/hreflang/llms regenerate clean; run `check-all.mjs`;
   regenerate `feed-llm.json` so AI engines stop citing dead offers.

## 5. R3 — Brand elevation: rigor, not size (parallel with R2)

Pod-C verdict: **the two-register voice architecture already supports
this** — the studio register (Don, "I") and product register ("we" = the
mechanism/company) both stay; what changes is announced identity: from
size ("one-person studio") to discipline ("the company whose CI fails on
a lie").

1. **Surface fixes (exact strings located):** remove "one-person studio"
   framing from `about/index.html:8`, `blog/index.html:8`,
   `_includes/footer.html:23` (then `sync-includes` to propagate),
   `privacy.html:436`, `receipts/index.html:40`,
   `about/portrait/README.md`; replace with "Muntin Digital — a
   restaurant web studio in Silver Spring, MD" or let the work speak.
   ES mirrors in the same PR. (The `about/` OG "two current DMV
   restaurants" fabrication was fixed 2026-06-11 — also: extend
   `check-fabrications.mjs` to scan meta/OG attribute values, since this
   one hid in an attribute.)
2. **Canon clarification, versioned (v1.1, dated):** one line in
   `/methods/#voice-contract` — "No royal 'we' — never a fake team.
   'Muntin Digital' is the company name, not a plural persona." Mirror
   note in `check-studio-voice-boundary.mjs` comments. **No gate is
   loosened.** "Our team/our staff" remain fail-CI forever.
3. **Positioning statement (passes all gates):** "Muntin Digital builds
   the cost-intelligence tools and the invoice ledger independent
   restaurants run on. Every number on this site is sourced; the CI
   gates fail the build on invented data. We compete with the largest
   vendors on credibility, not headcount — honesty here is automated."
4. **Amplify the assets the giants can't copy:** /never/, /receipts/
   (live public KPIs), /methods/ (sourced claims), /security/, /ai/, the
   gates themselves, `/about/cost` unit economics on the Ledger side.
   These move from footer trust links to first-class positioning.
5. **Keep exactly:** "Two builds at a time" honesty (reframed as "fewer,
   deeper"), Don's bylines on blog, the Muntin Desk byline, the
   /about/ timeline. The founder's floor time is a credential, not a
   liability.

## 6. R4 — Linkable assets (weeks 2–4; the PR engine)

1. `/research/` press + data page: the May waves' findings, the cost
   index (sources, cadence, methodology), the platform-recommendation
   experiment — one canonical citation target.
2. Cost-index **CSV/JSON downloads with attribution license** (series
   exports already build: `series.json`/`series.csv`) + an embeddable
   mini-chart widget — the earn-links mechanics.
3. Methodology page upgrade: how the index is built, the shippable bar,
   confidence gates — already drafted across docs; make it one public
   page.

## 7. Sequencing vs the Nov-13 launch

R1 starts NOW (it is also launch-plan W7's freshness machinery). R3
surface fixes ship this week (small, high-visibility). R2 ships after
D1–D3 — recommended before the T-30 CTA-extension milestone so the
funnel is app-first when launch traffic arrives. R4 fills weeks 2–4.
Nothing here displaces launch W1 (verdicts/recipes/overlay) — the
heartbeat automation and the launch's cost-index work are the same
artifact.

## 8. Verification

- `node scripts/check-all.mjs` green on every PR (fabrications, CTA
  canon, locale parity, pricing consistency, voice boundary).
- Weekly action run produces a fresh `cost-index.json` two consecutive
  weeks; pages show the new asOf.
- Search Console: `/services/*` 301s resolving, no 404 spike.
- KPI dashboard reviewed with AI-referral segment live; cadence queue
  has ≥2 scheduled posts at all times.
