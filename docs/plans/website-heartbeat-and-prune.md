<!-- Strategic-council deliverable. Synthesis of a 4-specialist read-only audit
     (inventory/funnel-fit, technical-SEO/crawl, content-heartbeat, brand-coherence).
     Status: PROPOSAL — founder picks prune posture + start point before any build. -->

# Website refresh — heartbeat + prune plan

**Date:** 2026-06-26 · **Status:** PROPOSAL (audit done; awaiting founder go)
**Origin:** founder asked for a complete site audit → every surface must earn its
place via (1) legitimate usefulness, (2) SEO value, or (3) credit-building
consumer-confidence for the coming product; plus a freshness engine to counter
"traffic spikes after a refresh, then trails off in a few days."

## What the audit converged on

The cost-intelligence **core is clean and on-funnel** (Cost Index + 99 ingredient
pages, on-funnel tools, library/blog, glossary, the trust spine, Ledger, ES
mirrors). Two problems, both concentrated and fixable:

1. **Over-extension** is entirely **studio/course-era survivors** — three of four
   specialists independently flagged the same cluster. A one-person
   cost-intelligence company still ships a web-studio toolkit + sheet library as
   equal-weight surfaces; to a buyer that reads as an SEO/branding agency, not
   focus.
2. **The freshness engine is already half-built but invisible and broken.** A
   daily cron refreshes ~99 Cost Index pages, but a **P0 sitemap bug** makes the
   freshness signal actively counter-productive — the literal mechanism behind the
   spike-then-trail-off.

## Part 1 — Prune (subtract to look deep-and-focused, not broad-and-spread)

Recommended posture: **retire + 301-redirect** the clearly off-funnel surfaces;
**relabel borderline** sheet packs under a "legacy" shelf; **never hard-delete**
(protect indexed URLs / backlinks). Gate every removal through
`check-locale-parity` + `check-hreflang-orphans` + sitemap regen.

**Tier 1 — retire/redirect (off-funnel studio-era):**
- `method/workshop/` — 19 website-build widgets (font-pair-picker, menu-builder,
  gbp-card-preview, deploy-stepper, before-after-slider, keyword-builder…). Biggest
  over-extension signal.
- Off-funnel `/tools/` clusters presented as first-class in `data/tools.json` /
  `tools/index.html`: **Local SEO & Presence, Conversions & Content, Brand & Design**
  (gbp-grader, photo-brief, brand-suite, menu-copy = 4 of 13). Demote/retire so
  `/tools/` reads as one focused thing (Operations & Margin).
- `start/` (30-sec restaurant-website triage), `learn/checklists/restaurant-website-checklist`,
  `workbench/` — website-funnel entry points / thin studio-era pages.

**Tier 2 — prune or shelve as clearly-labeled legacy:**
- 15 `course-*` sheets (course-naming, course-palette-voice, course-photo-brief,
  course-local-seo…) — companions to the frozen course; 31% of all sheets.
- `brand-design` + `local-seo` + `conversions` sheet packs (~14 sheets;
  brand-asset-inventory, signage-spec-sheet, photo-shot-list, nap-consistency-tracker,
  gbp-monthly-audit, social-content-calendar…). CLAUDE.md already flags brand/design
  as a prune candidate; unchanged since the 2026-06-17 cleanup → read as abandoned.

**Tier 3 — de-wire / consolidate:**
- Frozen course retains **live nav plumbing** — `_includes/nav.html` fetches
  `/api/course/progress` and injects a `nav-course-dot`. Stop signaling active
  investment in a frozen asset.
- `learn/` (topics 11 / research 8) overlaps `library/` + `blog/` → canonicalize /
  consolidate to kill thin-duplicate-intent risk.

## Part 2 — Heartbeat (turn the existing data engine into trustworthy, visible freshness)

The engine exists (`.github/workflows/cost-index-refresh.yml` daily cron, 99
ingredient series from USDA/BLS/FRED/EIA, editions archive, drivers, seasonality,
gate-clean number provenance via `print-weekly-read.mjs`). Make it *count*:

**P0 — fix the cause of the trail-off:**
- **Sitemap `lastmod` is bulk-stamped** — 1,168 of 1,286 URLs share `2026-06-20`
  because `gitMtime()` reads repo-wide `git log` mtime (`build-sitemap.mjs:103`).
  Crawlers learn lastmod is untrustworthy and discount it. **Stamp lastmod from each
  page's own `dateModified`** so only genuinely-changed pages advance. Single biggest
  lever.
- **No `<head>` feed-discovery `<link>` tags anywhere** — RSS/JSON/llms reachable
  only via a footer link. Add `application/rss+xml` (+ ES feed on ES pages) and
  `feed-llm.json` to the shared head partial; declare secondary feeds in robots.txt.

**P1 — harvest the daily engine into dated HTML surfaces:**
- Automate the **weekly Cost Index dispatch** end-to-end (EN+ES; cron exists).
- **"Biggest movers this week" strip** on the `/cost-index/` hub (auto from the
  edition snapshot) — makes the most-cited page visibly change weekly.
- **Regenerate sitemap/RSS/llms on deploy** (today they're `--check`-only).
- Surface **per-ingredient "updated" stamps** (unlocks 99 already-daily-refreshed
  dated surfaces); resuscitate `/changelog/`; monthly "basket in review" roll-up.

**P2 — evergreen rotation:** 1–2 library articles/month rewritten in place + real
`dateModified` bump (the sanctioned revision path; slugs are final-forever).
Seasonal operator notes from `data/seasonality.json`.

## Part 3 — Amplify (credit-building, the moat) 

- Promote **Cost Index methodology + calibration** (83.6% coverage, conformal bands,
  USDA/BLS/FRED sourcing) to hero-level — the best "earned in the code" proof.
- Promote the **trust spine** (`/never/`, `/security/`, `/privacy.html`,
  "never a language model") to hero; confirm the homepage hero carries the trust
  line, not just the value line.
- Trust gaps before GA: thin `/status/`, `/ai/` policy dated 2026-05-02, and the
  unfilled named-proof path in `/receipts/`.

## Recommended sequence

- **Phase 0 (no fork — clearly-correct eng, fixes the stated symptom):** P0 sitemap
  lastmod fix + `<head>` feed-discovery tags + regen-on-deploy. Highest ROI, lowest
  risk, reversible.
- **Phase 1 (heartbeat harvest):** automate weekly dispatch + movers strip +
  changelog.
- **Phase 2 (the prune):** subtraction pass via 301s, gated. Founder sets posture.
- **Phase 3 (amplify + trust gaps).**

## Open forks (founder's call)

1. **Prune posture** — retire+301 outright vs. demote/relabel-as-legacy vs. hold.
   (Rec: retire+301 Tier 1; legacy-shelf Tier 2; de-wire Tier 3.)
2. **Start point** — Phase 0 now (rec), or lead with the prune, or the amplify pass.
3. **Course de-wire** — stop the nav progress dot on the frozen course? (Rec: yes.)
