<!-- Orchestrator resume point. Committed so any future session (yours or mine) can pick
     up the queue without the founder re-explaining anything. The environment is ephemeral;
     only what's in the repo survives. Keep THIS file loadable in one read — append current
     state + open threads here; when a thread is fully shipped and superseded, summarize it
     to a line and let the detail live in the archive. -->

# Strategic-council board — resume here

**What this is:** the running state of the "strategic council / orchestrator" work across
both repos, externalized so a fresh session resumes in one read. Update this file as threads
move. Full pre-2026-07-16 history (every shipped-pass log, resolved reds, the P0 Actions
outage, the /try demo, the 06-27 audits, prior branch states) is frozen verbatim in
**`docs/handoff/board-archive.md`** — read it only for the detail behind a summarized line.

**Branches:** both repos develop on `claude/muntin-strategic-council-exsghc`
(storefront `potentially-profitable`, product `Muntin-Invoice-Decoder`). Prior
council branches `-rqdehe` (PR #489) and `-fzdd1j` (PRs #493–#503 storefront,
#234–#239 product) are merged to main and closed.

## ⮕ CURRENT STATE — CHECKABILITY THREAD (updated 2026-07-28)

**Branch:** `claude/vendor-benchmark-redesign-yn273q` (restarted from main after PR #523
merged). 5 commits pushed, `check-all --baseline --jobs 4` = **EXIT 0, zero NEW
regressions, 7/7 baselined**.

**Origin:** two viral X posts on "graph engineering" were fact-checked by a 14-agent run.
Both were fabrications wrapped around real technique (no $1.2M bonus exists; "+42%" has no
source; the "Google course" is DeepLearning.AI × Neo4j from 2025-08-27 with fabricated
timestamps). Full fact-check + verification:
`docs/handoff/2026-07-28-graph-strategy-findings.md`. Decision of record:
**ADR-020 `graph-engineering-declined`** — our edges are AUTHORED foreign keys with a zero
extraction-error rate; LLM relation extraction (~75% precision) would strictly LOWER it.
Rules of record: *an edge is publishable only when authored, not inferred*; *parallelism is
free only where its output requires no human read*.

**Shipped this thread:**
1. `7592d7363` — **CC0 attribution leak fixed.** `llms.txt` told every crawler our CC-BY
   compilations were public domain (contradicting ADR-015 and its own line 37). Fixed in
   EN + ES **and in `build-llms-txt.mjs`**, which rewrites the file inside the deploy chain
   and would have reverted a file-only edit. Also: `CLAUDE.md` drift (386 scripts not ~70;
   check-all does NOT fail fast; dispatch is MONTHLY/hand-written per ADR-011+012; ADR
   namespace collision documented), and 16 dangling ES hreflangs on `/open/*` killed, with
   `check-hreflang-orphans.mjs` RULE 2 added to catch them (proven to bite).
2. `91fb18838` — **provenance hop.** `sources.json` (81 ingredients → named agency report)
   and `revisions.json` (9,257 records) were published but unreachable from any ingredient
   page. 162 pages (EN+ES) now carry "the source registry names the N public reports behind
   it, and this series carries N recorded revisions". Counts computed at build time. The 12
   seafood/oil pages with no published series are deliberately left out. Also fixed a live
   falsehood on `/cost-index/methodology/` ("ledger empty until a reading is revised" while
   holding 9,257).
3. `e03432666` — healed the 2 outstanding idem regressions; **baseline pruned 25 → 7**
   (18 were passing at HEAD). The "~25 always-red gates" story is obsolete; it is 7.
4. `81c6882a3` — **`--jobs` on check-all: 219s → 94s (2.33×)**, serial stays the default and
   `wrangler.jsonc` never passes it. Acceptance = identical label+status sets (325 checks,
   7 failing, zero disagreements). NB: the first acceptance run passed VACUOUSLY on two
   empty sets — a shell regex failed on the tick glyphs. Assert a non-trivial count.
5. `72702e6ff` — **§4 "sea-why" re-landed and `check-seasonality-fusion` RE-ENABLED.** The
   #523 merge dropped the ADR-019 mechanism render, leaving that gate defined-but-unenforced.
   The lib survived intact; only the renderer was lost, so it was rebuilt as
   `inject-seasonality-why.mjs` over main's engine. Of 84 settled windows: 28 import-value
   counter-phase, 42 domestic-season low, 14 no import calendar; 44 concentrated
   single-origin import value.
6. `7c1b76f2f` — **the measured basket read now records on every M/W/F refresh** (founder
   ask), in its OWN append-on-change spine (`data/cost-index-reads.json` + CC0 mirrors),
   with a hub observation band. Two findings shaped it and both argued against the obvious
   fix: the edition spine cannot absorb refresh rows (it is a record of *publications*, and
   `computeWoW()` anchors on it), and the basket does not move three times a week (10 of 16
   contributors sat at vintage 2026-04-01), so a row per refresh would manufacture
   freshness. A row is appended only when the read CHANGES; otherwise `lastCheckedAt`
   advances in place. **ADR-021.** ADR-012 is not reversed — no post, no email.
7. **Coverage regime qualifier (ADR-022).** Every banded ingredient page published "our 80%
   range caught the next print about 77% of the time" — a lifetime average that hides *when*
   it misses. Measured over 74,208 walk-forward reads on 67 ingredients: **77.74% outside a
   detected price episode, 60.74% inside one — a ~1.8× higher miss rate exactly when a price
   is moving.** 134 pages (EN+ES) now carry the split. Two defects were caught in my own
   draft before it shipped, both the very class being fixed: (a) it measured
   `cost-lockfloat.json`'s **window-26** replay while the page's sentence is **window-52** —
   a number about one instrument printed under another's claim; (b) it dated every step
   `span.from + 7i` although part of the panel is **monthly**. Now recomputes the identical
   `conformalNext(alpha .20, window 52)` call the engine makes and dates each step from its
   own history row. Internal check: the recomputed pooled rate (76.8%) lands on the ~77% the
   pages themselves print. Also: 14 pages carry a `Verified:` line with NO coverage clause
   (the engine withholds it below 0.75) — anchoring on the paragraph would have put a rate on
   pages that deliberately publish none, so the anchor requires the clause per locale and a
   page that stops publishing a rate loses the note automatically. 41/41 self-test.

8. **Cross-surface yield agreement gated.** A prior finding said "46 of 112 shared
   ingredients (41%) disagree between two yield tables." Narrowed on inspection: most never
   collide, because `/cost-index/menu-pricing/`'s profile table renders a different cohort
   than the library yield pages. **22 slugs land on both surfaces and 7 publish two
   different numbers** — Swiss chard reads 92% on menu-pricing and 75% on
   `/library/ingredient-yields/swiss-chard/`; whole branzino 35% vs 55%. **Neither side is
   uncited** (an earlier draft of mine wrongly said the yields table had no source):
   `ingredient-yields.json` is gated against the CIA `YIELD_TABLE` in
   `tools/plate-cost/plate-cost.js`; `ingredient-depth.json` names USDA FDC / Book of Yields
   / FAO and carries a `cutSpec`. They disagree because they **measure different cuts** —
   chard stems-in (0.92) vs leaves-only (~0.60); orange JUICE (0.50) vs flesh. So the real
   defect is that a yield is published **without the cut spec and authority that give it
   meaning**. `check-yield-agreement.mjs` pins the 7 with dated, individually-reasoned
   entries and **fails on an 8th**; it reads the rendered pages (the invariant is what a
   reader sees) and fails loudly on a zero-size cohort so a broken scraper can't pass
   vacuously. **FOUNDER CALL:** which spec each surface should publish — resolving a number
   changes published trim-tax math, and the CIA table is a deliberate single source of truth
   for the plate-cost tool.

9. **Claim staleness gated.** `data/sourced-claims.json` is the absolute fact gate, but
   nothing ever re-read `date_verified` — a vendor pricing page verified in May 2026 could
   keep backing a published dollar figure indefinitely. `check-claim-staleness.mjs` is
   offline by necessity (no network/keys in the container), so age is the signal.
   **Volatility is INFERRED** from the claim text ($ / % / a specific year → volatile;
   otherwise structural) rather than hand-maintained across 47 entries that would drift.
   Two tiers so it reminds before it blocks: warn at 365d/1095d (still exit 0), fail at
   550d/1460d. All 47 are currently fresh (oldest 75d), so this is preventive —
   time-travel-verified: exit 0 at +10 months with 23 warnings, exit 1 at +16 months.

10. **Ingredient identity crosswalk shipped (completes ADR-017).**
   `cost-index/ingredient-codes.{csv,json}` — 475 rows, 164 slugs, 5 authorities
   (census_hs 250, usda_nass 102, usda_ers 71, ghcn_weather 28, noaa_fisheries 24). Two
   columns carry the honesty: **`granularity`** is an ABSOLUTE cross-authority level
   (`line` finer than commodity / `commodity` / `group` coarser / `proxy` = a weather region
   standing in for the ingredient, not an identity of it), derived mechanically — HS code
   LENGTH, presence of a NASS class split, NOAA `serves[]`. That makes ADR-017 §3's
   granularity-mismatch withholding rule inspectable from published data instead of living
   only in code. **`binding`** discloses that **24 HS codes stand for TWO ingredients** the
   schedule cannot split — `080550` is lemon AND lime; `0201305045 …LOIN` is striploin AND
   beef-tenderloin — so any per-slug figure from one is really the pair's combined figure;
   `shared_with` names them. 78 of 475 rows are so flagged. Licensed **CC BY 4.0**
   (`muntin_compilation`, not CC0 — the codes are federal, the mapping is ours), registered
   in the generated catalog (now 24 datasets, 15 CC0 / 9 CC-BY).
   **Corrected a stale doc while grounding:** `ingredient-hs-codes.json` `_doc` claimed
   "HS6 is the finest public aggregation" while 104 of its own 226 codes are HS10; ADR-017 §1
   was right and the table's doc was wrong. Also found the doc's "combined codes — noted"
   promise only half-kept (7 of 24 shared codes carried a note); the crosswalk's
   `shared_with` column is now the authoritative disclosure and the doc says so.
   *A false alarm I checked before reporting:* 66 HS / 20 NASS / 6 ERS slugs appear to name
   unknown ingredients — they all resolve against the ADR-017 §4 specialty registry.

11. **The standing conventions are now enforced, and enforcing them found a live defect.**
   `check-agent-guardrails.mjs` turns four prose rules into mechanical gates: **R1** an
   `inject-*` run in the COMMITTING refresh chain must be registered in `check-all.mjs`;
   **R2** it must also carry a pre-commit `--check` inside `cost-index-refresh.yml`; **R3**
   every script named in check-all must exist on disk; **R4** every baseline exemption must
   carry a dated reason. Scoped to injectors deliberately — applying R1/R2 to every `build-*`
   would fire on ~24 scripts that are gates themselves or gated elsewhere, and a rule with
   false positives gets suppressed.
   **It found 3 violations on first run, one of them live:** `inject-about-cost-read.mjs`
   ran only in the refresh with no check-all entry, and **`/about/` + `/es/about/` were
   serving a stale basket read** — "Eggs +71.7%" against a committed **+132.1%**, and
   "Chicken breast (boneless) ▼ −25.3%" where the data says **"Whole chicken ▲ +27.6%"**:
   wrong ingredient, opposite direction, stamped 2026-07-21 against 2026-07-24 data. Pages
   regenerated; all 3 violations fixed; probes confirm each rule fires when its fix is undone.

**The dominant failure mode in this repo, hit 4× today:** committed HTML is regenerated by
an engine or injector in the deploy/refresh chain, so a hand-edit silently reverts
(`/open` gates, `llms.txt`, ingredient pages, `/open/seasonality/`). **Always ask what
regenerates a file before editing it.** Injectors that own page regions must be registered
in BOTH `cost-index-refresh.yml` (run + pre-commit `--check`) and `check-all.mjs`.

**Founder's calls, deliberately untouched:**
  - **Spanish `/open`: finish or declare.** 16 explorers have no ES counterpart; three
    (`labor`, `demand`, `recalls`) are generated, so a hand-translated ES would drift — they
    need a generator locale, not a fan-out. Dangling hreflangs are fixed either way.
  - **Is `open-data-catalog.json` exhaustive or /open-scoped?** 7–8 published `cost-index/`
    files are absent. Write the scope rule down before registering.
  - **Does any of this beat writing the next dispatch?** All of it is infrastructure; none
    of it publishes an edition.

**Deferred (not lost):** engine-mirror re-do for the events surface; ES `/open` translations
(task P4); identity crosswalk CSV (`cost-index/ingredient-codes.csv`, completes ADR-017).

---

## ⮕ CURRENT STATE — UX/UI ELEVATION PROGRAM (updated 2026-07-18)

**Branch:** `claude/strategic-council-board-docs-m3w6dy` (a distinct thread from the redesign
run below). **Directive:** make every surface feel native at every viewport, build → audit →
iterate; no horizontal scroll; "the very best we can make it."

**Merge of record (2026-07-18):** merged `origin/main` (the "warmth" thread — 50 commits: on-device
Golden-Hour whisper via `warmth.js` + `.hero::after --gh-eve`, theme cross-fade, cost-index fresh
2026-07-17 read + reconciliation, cost-watch operator loop, breadcrumbs, copy-link reassurance beat)
into this branch for PR #526. **1199 conflicts, all mechanical or reconciled — no work lost either side:**
`site.css` was a clean union (9041 = base 8758 + our 263 + their 20; golden-hour gradient rebalance now
layers *under* main's `--gh-eve` warmth wash — both intents live); 3 CSS shells regenerated from it;
1191 pure cache-bust/count/sentinel conflicts collapsed to `theirs` then re-canonicalized by
`inject-css-cache-bust` (new hashes: site c878eb6bc574 / core f8b6c001b1bb / tool 1f57a490e24f /
article 8787ec2df8b4); 5 hand-resolved (**404 EN+ES** kept our site.js double-load fix + took main's
`20260717-reassure` bump + warmth.js parity; **cost-index EN+ES** took main's fresh-data render, our
nav tabs survived via auto-merge; **board** kept ours). Sheets took `theirs` head (drops the duplicate
batch-banner sentinel main relocated) with `sheets.css` restored to `20260717b` (merged content = our
sheets.css exactly). Caught + fixed one regression the collapse introduced: main's `sheets/index.html`
was **missing `site-tool.css`** (main also fails that idem check) — `inject-css-shells` restored it, so
the merge is cleaner than main there. **Gate: 255/258** — the 3 remaining are pre-existing baseline
idem-drift (Critical-CSS fonts, Glossary article schema, Glossary verified stamp); **0 new failures**,
and the merge *resolved* 18 of the 21 idem-drifts our pre-merge branch carried.

**Depth & immersion dream (2026-07-23):** founder idea — "make the user feel *inside* the data;
a little visual depth; on the cutting edge of tech = empowered = comes back." Founder also stated,
for the record, **openness to a genuinely new look**, not only additive depth. Ran a 62-agent
coordinated dreaming workflow (ground → 7 divergent lenses → 6 adversarial critics each → 3 competing
syntheses → merge → completeness). **Plan of record: `docs/design/depth-immersion-dream-backlog.md`.**
All 7 lenses converged independently on ONE metaphor — *a precision instrument on a worktop*; the merge
resolved the flash-vs-restraint tension to **restraint-as-craft** ("depth must MEAN a data fact or it
does not ship"; honesty carried by WORDS first, visual depth a gate-enforced redundant second channel;
the number is sacred/static). The north star unifies the three Cost-Index dialects (`ci-*`/`evh-*`/`viz-*`)
into one "Glass Well" instrument down the whole funnel, **first shipped standalone on `/about/`** at the
sentence that pledges "the same numbers I check on my own floor." **Completeness critic returned
`readyToBuild:false`** and caught the headline risk: a confidence-as-*solidity* ramp (low→high) would
encode a certainty ordering the project's OWN `cost-confidence-calibration.json` contradicts (realized
low-tier hit-rate is negative/non-monotonic) → an honesty feature that ships an honesty breach. Resolution
baked into the doc: ship a **calibration-monotone 2-state** now, register chip labels in `sourced-claims.json`,
gate label-present + low<high + per-tier AA/3:1 in both themes + EN↔ES parity. Open forks for the founder:
confidence-tier fidelity, the return-cadence privacy stance (client-only visit memory vs. of-record purity),
dusk-warmth on the /about/ instrument (needs an ADR amendment if yes), View-Transitions ROI, events-fusion
distance.

**Depth *feel* LOCKED (2026-07-23, founder-approved after 3 live prototypes):** depth = **layer
separation + parallax by translation, NOT rotation** (the plane stays square; a rotate tilt was rejected
as "screen motion, not depth"). Certified basket floats nearest; measured movers recede as separate,
dimmer/blurrier strata behind it (distance = provenance). Gentle pointer parallax (front slides across the
strata → you look *around* the read), ~3° resting recline, dark-mode-forward, and a first-class flat
fallback (`Depth off` ≡ reduced-motion / low-end / no-JS → fully-composed flat read, number/label/"Not your
prices" intact). Feel spec + reference prototype: `docs/design/depth-immersion-dream-backlog.md` §Locked +
`docs/design/prototypes/depth-instrument.html`.

**SHIPPED — the `/about/` depth read (2026-07-23):** `scripts/inject-about-cost-read.mjs` stamps a
sentinel-bracketed instrument at the pledge ("the numbers I check on my shifts"), EN + ES, from the LIVE
`data/cost-index.json` basket — the same read the hub now features (so they agree). The locked depth feel
realized: the composite floats in front, its 3 biggest real movers (eggs +72% / romaine −67% seasonal /
chicken −25%) recede as separate strata behind it; parallax by translation, no rotation; **flat-first**
(reduced-motion / no-JS / low-end → a fully-composed flat stack, verified `is-3d:false`), 3D as
progressive enhancement with the height locked to the flat height so **CLS = 0** (flat 526px == 3D 526px).
Honesty holds: number static, "medium confidence" word leads, "Not your prices" + `as of 2026-07-21` +
"3 of 16 holding last-good since 2026-06-01" all present. Audited on the headless render (0 h-overflow at
1280/390, both themes) + full gate **253/258, zero new failures**. Wired into `cost-index-refresh.yml`
(build + `--check`) so it refreshes daily with the data. Movers read against their own baseline; romaine
tagged seasonal.

**SHIPPED — hub composite depth (2026-07-23):** carried the Glass Well material onto the Cost Index hub's
"Where the basket sits" composite band (`compositeBand()` in `build-cost-index-pages.mjs`). The reading now
sits recessed in a lit Glass Well inside an elevated instrument frame (`--elev-feature`), with a dark-theme
inset-shadow override — unifying the hub hero's material with `/about/`. Scoped, additive (wrapped the
existing read+spread in `.ci-composite__well`, elevated `.ci-composite`); NO strata/parallax on the hub yet
(restraint-forward first step; the table below carries the per-ingredient depth). Applied to the build
script AND directly to the committed EN+ES hubs (deterministic string edit — no regen, so no nav-strip
drift; exactly 3 files). Audited on the render: 0 h-overflow at 1280/390, both themes legible, well recessed
in dark. **SHIPPED — ingredient-pages depth (2026-07-23):** carried the Glass Well material onto the ~94×2
per-ingredient "Market read" blocks (`.ci-read`, `marketReadBlock()`). Each read is now an elevated
instrument card (`--elev-feature`) with its key price sentence (`.ci-read__line`) recessed in a lit well
(dark-shadow override); the sparkline/verdict/provenance stay outside the well (content-rich block kept
clean). Applied to the build script AND directly to 192 committed pages (deterministic string+regex edit,
idempotent, no regen → no nav drift). Rendered clean light+dark, 0 h-overflow at 1280/390. Gate 253/258,
zero new failures. **The whole Cost Index funnel — /about/, hub composite, 94 ingredient reads — now speaks
one instrument material.**

**SHIPPED — the honesty gate (2026-07-23):** `scripts/check-cost-index-confidence.mjs` (wired into
`check-all.mjs` + the refresh workflow's check block) locks the framing across all three instrument
surfaces so a future generator/injector edit can't silently drop it: every `.ci-read` carries wholesale
framing + a confidence label; the hub composite carries confidence + "against baseline" + "not a
week-over-week" ; the `/about/` read carries the "Not your prices"/"no es tu precio" negation + wholesale
reference + confidence — EN and ES. It guards presence only (never invents/grades confidence). Verified:
passes on the tree (162 reads + hub + /about/), fails the negative test (broken negation caught), gate
count 258→259. **NEXT (optional):** receding-strata+parallax on the hub composite (only if it should
*move* like /about/); the pre-existing revisions-log roll (founder go needed — publishes a public record).

**Plan of record:** `docs/design/elevation-dream-backlog.md` — the reconciled output of two
adversarial "dreaming" workflows (top-down design-language + bottom-up per-surface), with the
north star, principles, the phased build sequence, per-surface top tier, and the completeness-
critic's 11 coverage gaps. **Read it first to resume.**

**Method:** Phase 1 = pure-additive token foundation in the CORE `:root`, seeded to current
values, referenced by nothing (provably inert — verify with a repo-wide `var(--token)` collision
scan before shipping; the `--accent` role is DEFERRED because cost-pulse/plate-cost/seasonality
reference an undefined `var(--accent)`). Then adopt-as-you-touch, SCOPED per surface (never move
global `--max`/`--pad-x`; the coherence rule is *prose stays narrow ~68ch, data breaks wide* to
the new `--measure-*` tokens). Every visible change verified on the headless render across the
7-viewport native matrix + dark + ES, gated, committed per increment (push is the only durable
artifact — the container restarts).

**Shipped so far (all pushed):**
- `b23fba57a`, `3e2853cd5` — margin-math: calculator fits 360px + in-box "read more" links wrap (no leak).
- `91fe5d081` — **design-system token foundation** (semantic role layer + `--measure-*` + `--sp-*` +
  motion + `--r-pill` + `--elev-feature`), inert, in core `:root`.
- `83d6509f1` — home: stances → 3-up principles masthead at ≥1024 (adopts `--measure-wide`).
- `3f1a0b199` — home: recently-added ledger widens to `--measure-wide`; orphaned 3rd service card spans full-width at tablet.
- `d7f6f9279` — home: FAQ → 2 columns at ≥1024.
- `11a985e71` — **articles** (all ~100): H2 section-start hairlines + see-also 2-up band at tablet.
- `1daf2a39b` — CI ingredient (99 EN + 99 ES + generator): center the reading column on wide bands (kills the right void).
- `d47276398` — CI ingredient: events → card grid, sparkline stays on one row, price sentence anchored (17px/600).
- `85cddd2fa` — CI hub (+ES + generator): catalog grid density (3-up tablet / 4-5 wide) + editorial category dividers.
- `b7b8133ae` — CI events (+ES + generator): zone width release + `.evh-card` 2-col ledger rows at ≥880 (date/magnitude gutter + narrative).
- `acc20a8ad` — CI weekly dispatch: `.ci-dispatch>.viz-figure` breaks onto a min(960px,92vw) stage at ≥1024 (scoped; print-neutralized; EN-only).
- `90d5d7ac4` — Library hub: 2-column back-of-book article index at ≥1024.
- `e2631eb42` — Vendor-benchmark (+ES): framed fluid shell (no edge-to-edge tablet / stranded ribbon).
- `642f46802` — Plate-cost (+ES): 44px tap targets on calculator inputs (touch a11y).
- `c5614d621` — **adversarial-review follow-up:** backfilled `.ci-dispatch` onto ALL dispatch editions (the current *monthly* was untagged) + corrected the "weekly-only" comment.
- `51c8f862e` — **viz-spark phone overflow fix** (found via the adversarial pass): long nowrap annotations forced h-scroll on the monthly dispatch at 360/390; annos wrap ≤520px + minmax(0,1fr) grid hardening. Shared — hardens every viz-spark.

**Adversarial-pass discipline (per founder directive):** each risky increment gets an independent
reviewer that refutes scope/overflow/print/dark/regression before or right after commit. The dispatch
review verified the breakout clean AND caught the monthly-untagged rollout gap → led to the real
viz-spark h-scroll bug fix. This is the loop working: adversarial review → real defect found → fixed.

- `a88782790` — Glossary term (~149 pages): center the reading column on wide bands.
- `b74e25b53` — **founder feedback:** retire the expired Father's Day dispatch banner (inject-batch-banner
  had not been re-run since batch expired 2026-06-22; collapsed to empty sentinels site-wide, 0 drift).
- `6983d5897` — **founder feedback ("leaning right"):** rebalance the golden-hour hero wash off the
  top-right corner (peak 88%→68% center-top, alpha 0.26→0.20) + `-soft` variant; verified balanced on the
  1280 render. Container is centered; the lean was purely the asymmetric warm wash stacking on the card side.
- `d81c1a204` — **founder feedback (nav "more space left of logo than right of Contact"):** remove the
  Contact pill from the primary nav (EN). Root cause: the filled pill was the widest right-side item, so
  `justify-content:space-between` dumped the row's overflow onto it (logo 84px from left, Contact 17px from
  right). Contact stays in footer + mobile menu + mobile sticky bar. `.js-window` hard-coded (no JS hook);
  `#navWindowPulse` referenced by no JS. Also normalized 42 glossary pages missing the platform-kbd script.
- `d5648837a` — **founder feedback ("nav looks plain… make them tabs"):** nav-links → **uppercase tab bar**
  (12.5px, tracked, 600-wt) with an **auto-detected active tab** (best href-prefix match → `aria-current=page`
  → teal label + persistent underline; hover fades the same underline in). Detection is a synchronous script
  in the nav partial (runs everywhere incl. cost-index pages). Completed the ES Contact removal (was EN-only;
  610 /es/ pages still carried it). Made the nav width-discipline **unconditional** (icon-only search + 22/16
  gaps at every width) now that the overflowing Contact CTA is gone → **symmetric at ALL widths** (diff 0 at
  1200/1280/1440/1512/1680/1920; was ~100px right-lean on wide monitors). Tabs are EN-desktop; ES desktop is
  hamburger-only (pre-existing `:root:lang(es)` rule — Spanish labels don't fit the row).
  · **Active-tab detection adversarially verified across 14 page types (14/14):** Library hub+article,
    Cost-Index hub+ingredient, Open-data, Tools hub+tool, Company(/studio/), Ledger all light the right tab;
    home/glossary/about/methods/blog correctly light none. Feature is robust.
  · **ES desktop tabs — first rejected at 12.5px, then SHIPPED smaller.** At the EN 12.5px/.085em the ES
    row is ~778px and leaned; but at **12px / .02em / gap 18** (scoped `:lang(es)`, labels untouched) it fits
    balanced (diff 0 at 1280). Since ES already showed the full nav >1400, the win was to apply the smaller
    type + lower the hamburger threshold 1400→1200 → ES gets the real desktop tab bar (with active underline)
    from 1200px up; <1200 still hamburgers. `feat(nav): ES desktop tab bar` below.
- `3a3d17f97` — **ES desktop tab-bar parity** (12px/.02em/gap18 scoped, threshold 1400→1200). Verified
  balanced at 1280, active tab "Índice de costos" lit, 0 overflow, ES phone still hamburgers, EN untouched.
- **Systemic tier — led with the real-bug hunt, not the invisible refactor.** The deferred `--accent`
  "collision" turned out to hide a **real user-facing bug**, which generalized to a whole bug class:
  · `6378f9d06` (cost-pulse --accent) — the lockfloat/line-finder `.lf-*` styles reference
    `var(--accent)` with NO fallback, but `--accent` was undefined on the page (only scoped to
    `.theme-social/.theme-brand` site-wide) → drawer toggle / stars / starters / **focus outlines** rendered
    inherited black-gray instead of teal-green (`.lf-drawer-sum` computed #16181D not #1f6f6a). Defined
    `--accent:#1f6f6a` at page root (EN+ES). The `.cp-*` accent elements only escaped it via inline `,#1f6f6a`.
  · `1c0d838b5` (undefined-token sweep) — built a **site-wide scanner** for the same
    class (`var(--X)` no-fallback where `--X` defined nowhere). Found `--amber` on 404 (should be
    `--light-amber` — the "/" slash was inheriting teal) + `--cream-1` on plate-cost EN+ES (should be
    `--cream-2` — advice-option was transparent). **Rescan after fixes: 0 files** (was 4 files / 32 refs).
  · **Remaining systemic items (semantic-role token migration off raw --teal/--rust; dark-mode --mtn-*/--refresh-*
    consolidation) are genuinely INVISIBLE refactoring** — the undefined-token bugs were the only user-facing
    defects hiding in the tier. Scanner (theme-agnostic) confirms no undefined dark tokens either. Recommend
    against autonomous churn: regression risk across ~1200 pages for zero visible change. Reviewed session only.
- **Runtime/console-error sweep** (26 representative page types): 25 clean; caught 1 real bug.
  · `edfd0a2b3` — 404.html + es/404.html loaded site.js TWICE (stray eager `<script src>` + the
    standard lazy-loader every other page uses alone) → `const i18n` re-declared → "SyntaxError: Identifier
    'i18n' has already been declared" aborted site.js init on the 404 page. Removed the eager tag. Re-swept: 26/26 clean.
- **Broken-internal-link sweep (redirect-worker-aware).** Naive scan found 93; the site has TWO Cloudflare
  Worker redirect maps (`src/lib/tool-redirects.js` 8 tool slugs, `src/lib/blog-library-redirects.js` 91→93
  keys) that `_redirects` is too capped (100-rule cap, error 100324) to hold — accounting for both collapses
  93 → **15 truly broken**. So the retired-tool + moved-blog links are ALREADY handled; nothing to add to the
  capped `_redirects`. Founder approved fixing the unambiguous groups B/C/D:
  · **B** (`2ffca30dc`) — 2 library articles the blog index links at `/blog/<slug>/` were missing from
    the blog→library Worker map (keep-plate-cost-honest, what-beef-prices-mean). Added to the map.
  · **C** — 3 EN + 3 ES library "Keep reading" blocks linked `/blog/drafts/<slug>/` for posts published at
    `/library/<slug>/` (`/es/library/<es-slug>/`). Repointed.
  · **D** (`00164c9a4`) — ES pages linked ES library articles by their ENGLISH slug (404). Fixed at
    the SOURCE (pages would drift): `inject-tool-knit.mjs` articleUrl() now translates EN→ES via the i18n map
    (regen 5 ES tool rails); `data/topic-essays.json` 12 inline links remapped (regen 6 ES topic pages).
  · **DEFERRED per founder ("you decide per-group, I'll list") — the remaining ~15:** (A) library-hub links to
    5 dead `/learn/topics/` slugs (restaurant-websites, menus-and-pricing, conversion-and-reservations,
    margin-and-aggregators, photography-and-brand — the live topics are ai-search/brand-design/conversions/
    cost-data/information-security/local-seo/operations-margin/speed-mobile/trust-reviews; needs old→new map);
    (E) ES blog cross-language gaps; (F) `/blog/how-to-tell-if-your-restaurant-has-a-data-leak/` (no library
    version), `/es/glossary/care-plan/`; (G) `/audio/assets/course/` (~40 refs, course frozen). Re-run
    `scratchpad/scan-true.mjs` (worker-map-aware) to resume. **Scanner caveat:** a naive files+_redirects scan
    gives false positives — MUST load both `src/lib/*redirects*.js` maps (scan-true does).
  · **A** (`b2f92a90a`) — library hub's "Browse by what you're fixing" was hand-coded against the OLD
    7-pillar taxonomy (5 dead `/learn/topics/` links). Rebuilt from canonical `data/topics.json` (9 pillars);
    heading now uses the `count:topics` sentinel so it can't drift. 15 → 10.
  · **E** (`3cafef425`) — 4 ES pages linked ES posts by their English slug (404); repointed to the
    Spanish slug / ES library home via the i18n map (href-only, hardcoded, gate byte-identical to baseline). 10 → 6.
  · **F/content-gaps** (`828c8e5ea`, founder-approved) — the 4 genuine gaps: removed the dead data-leak
    "Keep reading" card; repointed the honest-doordash-math references (never existed in any namespace) to the
    live `/es/library/uber-eats-vs-doordash-vs-grubhub-cuentas-para-restaurante-2026/` via topic-essays regen +
    prose, and **unwrapped the 2 self-references** inside that same article (its own margin-walk content);
    dropped the retired `care-plan` override in `inject-smart-next-cta.mjs` so the CTA auto-detects a live term
    (→ lighthouse) + re-ran mentions/topic-page-schema so JSON-LD no longer names the dead term. Injector drift
    on unrelated cost-index/el-niño articles reverted; gate back to 237/258 baseline. 6 → 2.
  · **THREAD COMPLETE — 0 real broken links.** The final 2 are false positives: `/audio/assets/course/` and
    `/blog/'+escHtml(item.articleSlug)+'/` are JS-constructed URLs inside `<script>` (scan-true matches `src="…"`
    prefixes in JS; TODO improve the scanner to skip script blocks). **Session arc: 93 raw → 30 worker-aware →
    0 real (15 fixed across A–F; 2 JS false positives).** NOT touched (not broken links, data-quality only):
    the `used_in` metadata for the removed honest-doordash post lingers in `data/sourced-claims.json` (fact-gate
    registry) — a separate hygiene item, left for a fact-gate-aware pass.

**Done surfaces:** homepage, article shell, CI ingredient, CI hub, CI events, **CI weekly+monthly
dispatch** (funnel spine complete), library hub, vendor-benchmark, plate-cost a11y, viz-spark (shared),
glossary term.

**Assessed & deliberately NOT changed (adversarial rigor — verified already-good or not-an-improvement):**
footer (5 explicit responsive breakpoints, well-handled); 404 (already a composed centered masthead);
glossary hub / about / tools-hub / methods heroes (already centered/composed, no void); **sheets-hub
3-col catalog — TESTED on the render and REJECTED** (the elevated content-rich 2-col cards go ragged/
cramped at 3-col; the dream's "bold" call predated the card elevation). Not every dream survives contact
with the real render — that's the point of verifying.

**Remaining work is now either checkpoint-gated or JS-dependent — surface-elevation pass is
substantially complete:**
- RISKY-SHARED — **INVESTIGATED 2026-07-18 (founder said "take it on"); finding: NO genuine user-facing
  defect here worth the ~1,200-page blast radius. It is code-hygiene refactoring + already-done items.**
  Evidence:
  · `:focus-visible` — ALREADY a mature unified system: global recipe `a/button/.btn:focus-visible`
    {2px teal outline + offset + `--ring-focus`} at site.css:1659, inverse-surface override
    (`.final/.process/footer` → cream) at :1661, form-input focus at :1466. 88 focus rules. Not a gap.
  · `--elev-feature` "invisible-shadow-in-dark" — `.intake-form` is on NO served page (moot); `.edu-result`
    (tool results) keeps separation in dark via its re-tokenizing `--line` border + teal left-accent — the
    faded shadow is imperceptible depth loss, not a defect. Dark mode already reads correctly (verified
    repeatedly all session).
  · Dark-mode consolidation (retire `--mtn-*`/`--refresh-*` into the token-flip) — the three mechanisms
    are redundant but WORKING; the divergences are imperceptible (#1a1d22 vs #1B1E24). Pure maintainability
    refactor with real regression risk on every dark surface. Poor risk/reward for autonomous execution.
  · Semantic-role adoption / body-size / radius — inert refactoring or the red-team's cut-from-rollout set.
  **Recommendation: do the systemic tier only in a dedicated, reviewed session (not autonomously). The
  user-facing elevation program is complete.**
- JS-DEPENDENT / lower-leverage: mobile-drawer polish + search-overlay cap (need interaction to verify);
  tool empty/loading/validation states (per-tool inline JS work); tools-hub tier-badge/hover polish.
- The full semantic-role adoption (migrate surfaces off raw `--teal`/`--rust` onto the Phase-1 role
  tokens, incl. resolving the deferred `--accent` collision on cost-pulse/plate-cost/seasonality). **Generator discipline confirmed working:**
surgical inline-CSS edits across the committed cost-index pages + mirror into `build-cost-index-pages.mjs`
(never run it — it carries a half-finished template rollout); every ci patch verified `0 drift lines`.

**Next (queued):** CI hub remaining (full-width composite/scorecard masthead — bold; orient about-strip;
basket display-figure; movers board — judge pushed back on the 2-col, do carefully); CI events surface +
CI weekly dispatch (figure-breakout, scoped `.ci-dispatch > .viz-figure`); remaining article wins
(`.smart-next` card, scoped figure-breakout); then the critic's coverage gaps (global chrome + mobile
drawer, tool empty/validation states, print neutralization, Ledger page, legal template, 404,
`:focus-visible` token, ES end-to-end). Deferred to explicit checkpoints (red-team risky set): fluid
body-size reflow, dark-mode mechanism consolidation, radius value bumps. Harness:
`python3 -m http.server 8099` + headless_shell on a fresh port;
scratchpad has `shot.mjs`/`clip-sec.mjs`/`clip-cv.mjs`/`leak-detect.mjs`. Chrome HTTP-cache can serve
stale renders — use a fresh port or a `?x=` query buster when verifying edits.

## ⮕ CURRENT STATE — AUTONOMOUS REDESIGN RUN (updated 2026-07-11)

**⚠ OPS NOTE (2026-07-11) — container reverted TWICE; both recovered.** It has now happened twice in this
run (same signature both times: HEAD drops to the stale demo checkpoint `e6afa2258`, remote-tracking ref
stale, "Reach Don" reappears in the working tree). **Second occurrence:** mid-turn, AFTER a good push —
detected when a headless glossary screenshot showed "Reach Don" though origin was correct. Recovery is the
same and reliable: `git fetch origin claude/muntin-strategic-council-exsghc && git reset --hard origin/…`.
**Hardened rule:** commit + push every increment BEFORE running the (slower) headless audit — the push is the
only durable artifact; anything uncommitted when the container rolls is gone. The glossary sweep below was
pushed first (`597bc5f23`) precisely for this reason, and survived. Original first-occurrence note follows.

**⚠ OPS NOTE (2026-07-11) — container reverted; recovered.** A worker restart reverted this container's
working tree to a STALE demo-thread checkout (HEAD `e6afa2258` "wip(demo): single-frame no-scroll redesign",
remote-tracking ref stale at `2401bf103`) — 192 commits behind, my entire redesign cascade absent locally,
`index.html` showing pre-de-solo "Reach Don"/"Email Don". **All work was safe on origin** (pushed). Recovery:
`git fetch` then `git reset --hard origin/claude/muntin-strategic-council-exsghc` (working tree was clean).
The orphan demo-wip is preserved as tag `orphan-demo-wip-e6afa2258` if ever needed. **Runbook for a future
session:** if HEAD looks wrong (demo commits, missing redesign, "Reach Don" on the home), you're on a stale
checkout — `git fetch origin claude/muntin-strategic-council-exsghc && git reset --hard origin/…` to restore.
Push every increment (the only thing that survives a restart). Post-recovery: clean, synced at `1ca49932d`,
gates green (fabrications 0, newsletter-copy ✓, css-drift 504); restored cost-index nav correctly shows "Contact".

**Founder directive:** "Fold both plans together. Execute the entirety of the redesign as I sleep,
build → audit → iterate, frequently, all the way through." Macro-first. → **`docs/handoff/redesign-execution-plan.md`
is the execution spine** (folds the reinvention master plan + the locked macro design direction from
the flagship prototype). Autonomous run: one increment → adversarial/expert audit → iterate → commit+push →
update this block → continue.

**✅ COMPLETE — SITE-WIDE v3 PROPAGATION (founder picked ALL 4 levers + de-solo newsletter + keep human seat, 2026-07-11).**
ALL SHIPPED + pushed: newsletter de-solo `d9dd78900`; type `31f4013a5`; radius `84273de79`; hubs cost-index
`2b567e382` / ledger `c434c77d5` / tools `987aeb3a7` / library `8a391210c`; tool-card layout `63f6cb55f`.
/about/ + /window/ kept personal (no change). All EN+ES, both themes headless-verified; css-drift 502 (improved
from 504); gates green (fabrications 0, newsletter-copy ✓ enforcing company voice, locale-parity). Hub polish
ran via workflow w71suln37 (polish+adversarial-verify per hub); the tools raw-6px radii were tokenized to
var(--r-md) post-verify to hold drift; the library cost-index-hero was made durable by bumping its injector
template (inject-library-cost-index-hero.mjs 16→8px) + re-running. Blueprint from workflow wbr35q2x7. **CERTIFIED 2026-07-11** — full 258-gate `check-all.mjs` run (task
ba3butwm6, exit 0): 233/258 passed; all 25 failures are deploy-healed `(idem)` builders (sitemap, OG cards,
CSS cache-bust, site-counts, glossary/hub schema, RSS, H2 anchor IDs, theme/cuisine build pages) — matching
the pre-redesign idem baseline exactly, ZERO non-idem regressions from the levers / mono-token / newsletter
work. CSS shells verified in sync (rebuild = 0 changes). HEAD `8dc1788ee` == origin. Original plan:

**✅ LONG-TAIL SWEEP (founder picked it, 2026-07-11) — `597bc5f23`.** Glossary index app-chrome brought onto
the v3 tokens: search box / filter bar / empty states off raw 10·14·22px radii → `--r-input`/`--r-md`/`--r-lg`;
the recently-added link cards dropped the old focus-ring box-shadow for the muntin top-accent hover-reveal +
2px lift, dates now tabular-mono. EN+ES; verified headless both themes AND by computed-style assertions
(mono/tabular/overflow:hidden/accent scaleX 0→1/translateY-2px all PASS). **Sheets index needed nothing** —
it reuses the already-swept `.tool-card--compact`. **Tool-page section `<h2>`s = deliberate keep** (not a gap):
section-level heads stay Fraunces by the system's own rule, and they're mixed-register even within one panel
(cost-pulse `.cp-card` has data-title "Drift this week" beside framing "What this dashboard isn't."), so there's
no clean scope and a blanket demote would flatten warmth. Full reasoning in `docs/handoff/redesign-v3-system.md`
(Deliberate keeps). The v3 storefront redesign is complete.

**➡ PIVOT TO PRODUCT REPO (founder, 2026-07-11).** After storefront v3 was certified + long-tail-swept, the
founder chose to carry the v3 language onto the paid **Ledger product** (`Muntin-Invoice-Decoder`, app
`apps/web`, same branch). **Key finding on arrival:** the product does NOT need v3 applied — it IS the CANONICAL
SOURCE of the v3 language and MORE mature than the storefront. `packages/ui/tokens.css` is a financial-grade
token system (Linear/Mercury/Ramp), WCAG baked into token comments, gated by `check-contrast` /
`check-focus-discipline` / `check-editorial-accent-boundary` / `check-keyframes-allowlist`, dark-canon,
chrome/editorial/expressive tiers. It DELIBERATELY diverges on two axes: (1) accent — product `--mun-accent`
#3b68f5 light / #5b82ff dark vs storefront `--teal` #2A50C8 / #7AA7FF (same blue family; product's #2A50C8 is
its `--mun-accent-text`); (2) display face — product RETIRED the serif from chrome (Inter-only; Fraunces only
as `--mun-font-editorial`, gated), storefront KEEPS Fraunces display. Applying storefront tokens wholesale
would REGRESS the product. **Founder chose "full parity audit first"** → workflow `wzy4egv8m` (6 dimension
auditors × both repos → synthesized reconciliation plan → adversarial verify). No token edits until reviewed.
⚠ The product repo has NO CLAUDE.md yet — add continuity there once the reconciliation direction is set.
⚠ Container reverted a THIRD time this session (storefront only; product repo stable) — same runbook, recovered.
**FOUNDER STEER (2026-07-11): "I really like the current design language of the Ledger — the app itself."**
→ The product's design language is the KEEPER; nothing regresses it (no Fraunces into app chrome, no swapping
its a11y-tuned #3b68f5 accent). This removes "converge product→storefront" from the table. Reconciliation, IF
any, is storefront-side only (the storefront optionally moves toward the product's accent); the deliberate
Fraunces-storefront / Inter-product divergence otherwise STANDS. The parity audit now serves as a map of what a
storefront-side nudge would entail + a clean-bill on the product side, not a to-do list against the product.

**✅ PARITY AUDIT COMPLETE (workflow `wzy4egv8m`, 6 dims + synth + adversarial-verify, 2026-07-11).** Result:
**the product gets a CLEAN BILL — zero changes.** The light-mode token spine is already pigment-identical across
both repos (verified exact: storefront `--teal` #2A50C8 == product `--mun-accent-text`; `--teal-tint` #EAF0FE ==
`--mun-accent-soft`; `--rust` #C42E2E == `--mun-danger`; `--gold` #B7791F == `--mun-warning`; `--line-input`
#868D9A == `--mun-border-strong`; full neutral ramp). The two headline divergences (accent FILL #2A50C8 vs
#3b68f5 — same hue ~226°, value/chroma split for AA-on-cream vs bright-on-dark; Fraunces display kept vs serif
retired from product chrome) are DELIBERATE, documented on both sides, and gated — KEEP. So are the warm-cream
vs cool-slate dark text, the 6px vs 8px card radius register, and the muntin-hover vs inset-ring interaction
grammar (the two properties are meant to feel different; shared brand-DNA — muntin/pane vocab, 120/180ms
durations, the cubic-bezier(.16,1,.3,1) emphasis easing — is intact).
  - **Adversarial verify overturned one item (holdsUp=false):** the synthesis proposed nudging storefront
    `--stone` #6B7280→#5f6670 and called it "ungated" — WRONG. `--stone` is one of 15 tokens locked by
    `check-tokens-sync.mjs` (fail-CI); changing it breaks CI, and the spine-hash pin blocks the JSON path too.
    DROPPED. The plan also cited a phantom `build-tokens.mjs` color-lock (real enforcer is check-tokens-sync).
  - **Survivors = small, storefront-only, verified-ungated hygiene:** (1) **focus-glow mis-pigment** — site.css
    `--ring-focus` glow is hardcoded rgba(59,104,245,.3)=#3b68f5 (the PRODUCT's accent) while the focus OUTLINE
    is --teal #2A50C8, so one focused control shows two blues. Recommended pilot fix (one-liner, ungated).
    (2) stale radius comments/fallback (site.css L95-98 says --r-sm 8/--r-md 14; real = 6/6/8; also a stale set
    in check-css-drift.mjs's own comment). (3) off-scale raw radii sweep (storefront onto 6/8; INTRA-repo only).
  - **✅ SHIPPED `03d8ebe00` (survivors 1+2):** `--ring-focus` now **derives from --teal via color-mix** (not a
    hardcoded teal) so the glow tracks the accent in EVERY scope — storefront resolves #2A50C8 (matches outline);
    the `.ld-wrap` Ledger demo, which deliberately re-skins --teal to the app's #3b68f5, gets a matching glow for
    free (a hardcoded teal would have created a NEW two-blue mismatch inside the demo — caught in verification).
    color-mix already used 22× in site.css. Regenerated the 3 CSS shells (build-css-shells.mjs); check-css-shells
    clean; tokens-sync clean. (check-all exits 1 with 233/258 — but the 25 misses are all "(idem)" build-freshness
    reporters — site-counts/sitemap/glossary-schema/cache-bust "would update N files" — that fail IDENTICALLY at
    the parent commit; container build-drift the operator's pipeline regenerates, NOT a regression from this change,
    verified parent-vs-HEAD on cache-bust.) Also refreshed stale radius docs to the v3 6/6/8 scale. NOTE: the
    demo's `#3b68f5` is CORRECT/deliberate (the storefront's mini-mirror of the product app) — do NOT "fix" it.
  - **HELD for founder (survivor 3 + editorial):** off-scale raw-radii sweep is cosmetic churn with real visible
    corner changes across many components — not shipped without a look. Plus the two editorial calls below.
  - **DEFER / maintenance notes:** dark-accent seam #7AA7FF vs #5b82ff (only accent slot no gate cross-checks)
    + dark status pigments diverge independently (storefront ships a full dark theme the shared spec says doesn't
    exist — stale spec). Dark --stone-2 #99A0AB is under-flipped but it's DECORATIVE (dividers/ring-tracks), not
    disabled text — don't dim it toward #5a5f68 blindly. All generated (build-dark-mode.mjs) — regen, don't hand-patch.
  - **Genuine EDITORIAL open questions for founder (NOT token edits):** (a) Cost-Index money direction — storefront
    shows elevated cost in --rust / calm in neutral, never a green "prices fell/good"; deliberate one-directional
    honesty stance, or an unadopted-spine gap? (b) does the storefront want a dedicated --info hue (today info-blue
    folds onto --teal) and should it match product #3b68f5 or stay deeper editorial teal?

- **[DONE `d9dd78900`] Newsletter de-solo** — "We send…"; G.10 gate updated to require company framing (teeth kept).
- **[1] Type unification** (site.css, LOW risk): do NOT split the global `h1,h2,h3,h4{font-family:var(--font-display)}`
  (:743) — that would demote every article h3-h4. Instead add scoped `font-family:var(--font-body)` on the
  product-UI selectors: `.score-card-title/.score-card-value` (:428-429), `.mtn-card__title/.mtn-modal__title/.mtn-empty__title`
  (:7837/:7929/:7892). Reconcile `.logo` (:868, inline blocks hardcode Georgia) → var(--font-display). DEFER viz-* numerals.
  Regenerate 3 shells. Hero/masthead/.serif-italic/.foot-cta-text/home stances KEEP Fraunces.
- **[2] Radius→6px** (site.css tokens, HIGH risk/blast): FIRST give `.portrait` (:1218, reads --r-lg) an explicit radius
  or images square. THEN retokenize `--r-sm`(8)/`--r-md`(14)/`--r-lg`(22)/`--r-input`(12) toward 6px (:1,:99) — sweeps
  ~200 card call-sites in one edit. Bump `.ci-inst` 8→6 (:1114). Leave 999px pills / 50% circles. Regenerate shells.
  Visually once-over FROZEN surfaces (/studio/, /course/, .plan) since the sweep hits them.
- **[3-6] Hub polish** cost-index → ledger → tools → library (each inline-CSS, one EN+ES commit): scoped mono stack
  (--ci-mono/--lg-mono/--tc-mono/--lib-mono) for the DATA voice (numbers/dates/tier-labels → tabular-mono), app
  titles/heads → Inter, uppercase labels → mono, hardcoded radii → 6px, and REPLACE the static `border-top:3px ink`
  slab with the home hover-reveal muntin top-accent. Use color-mix (css-drift 504). PRESERVE (documented warmth):
  ledger `.lg-pricing` ink band + its intentional hexes, cost-index semantic left-rails (signal), `.ledger-asym`
  ordinals, library autolink sentinels + its hairline article-row dividers (rows NOT cards).
- **[7] Tool-card layout fix** (home `.tool-card-flagship` :2770+): blueprint's spec agent failed — spec it inline;
  land AFTER tools so it inherits the unified grammar.
- **FORKS proceeding with defaults (reversible, flag in commits):** (a) unify hub "3px ink slab" → home's
  hover-reveal accent — overrides the recent "bolder passes" but IS what "unify treatment" means; (b) keep the ONE
  ledger $19 pricing lockup as an editorial moment (mono only the date). Founder can veto either.

**Macro direction LOCKED — flagship prototype v3** (`docs/handoff/redesign-flagship-prototype.html`,
artifact "flagship-macro-v3"): one unified app-grade language (slate + electric-blue #3b68f5/#5b82ff,
tabular-mono data voice, dark-first both themes, the **muntin grille AS structure** — flush hairline
panes, not gapped cards), one-window-many-panes registers, the emotional arc, trust stated ONCE
(ambient). Iterated through 2 adversarial/expert panels (design-craft + brand/operator) — fixed
grille-as-decoration, type weight range, accent identity, AA contrast, one boot sequence, believable
real-data read, honest pricing, no-JS degrade; headless-clean both themes at 360/390/1280.

**⚠ POSITIONING PIVOT (founder, mid-build) — recorded in `founder-vision.md`:** "No face; be a big
CAPABLE company; I worry 'just me' gets the product discounted." → removed the founder-face/kinship
centerpiece; lead with **product capability + company voice**; operator-grounding reframed as
capability, not smallness. **HARD HONESTY BOUNDARY:** project capability + use company "we" + don't
advertise headcount — but NEVER fabricate a team/scale (that lie breaks the honesty brand + is
discoverable). Capability is shown, never invented.

**LIVE CASCADE — shipped:**
- **`ffabeeadf` — home hero de-solo (EN+ES).** Positioning pivot on the flagship: dropped the first-person
  "numbers I check on my own shifts" + removed the hero-meta-note (Don byline + "Reply within 4 hours").
  Removal only, honesty boundary held. Gates green; headless clean.
- **`37c70aac4` (+`00e596345` missed shell) — home hero window → live Cost Index instrument (EN+ES).**
  Decorative empty muntin window → functional sample cost read: tabular-mono headline (+14.6% count-up),
  flagged mover chip, hairline rows (grille AS structure), verdict. Real 07-06 DIRECTIONS, labelled
  SAMPLE/ILLUSTRATIVE/"Not your prices" (fact gate 0 hits). Scoped `.ci-inst` CSS (tokens only, css-drift
  unchanged 504), auto-themes, scan boot, degrade-safe. Screenshots sent. **Strong, app-grade both themes.**
- **`fe1e76808` — de-solo the nav + footer + home CTAs, company voice, SITE-WIDE (EN+ES).** "Reach Don" →
  "Contact" / "Contacta a Don" → "Contacto" across nav CTA + footer CTA + footer link + mobile sticky bar;
  first-person "A direct line to Don. I read every one." → "A direct line to Muntin — every message is
  read."; neutralized the "Don is around" presence-pulse titles. Canonical `_includes/{,es/}{nav,footer}.html`
  → sync-includes (1235 nav + 727 footer, sync --check clean, no count drift). Home body final-CTA also
  de-solo'd (first-person → company voice). Honesty boundary held (company voice only, nothing fabricated).
  Verified: gates + headless both themes EN/ES. **Deferred:** body-content solo residuals on ~13 other pages
  (/window/ itself, ledger, studio, for/restaurants, course) + the generator-owned cost-index/open pages
  (regen picks up the synced chrome). NOTE: h1 still Fraunces serif — type unification is a considered
  SITE-WIDE decision (don't do piecemeal). The /window/ page is inherently "the line to Don" — its
  personal-access framing may be a deliberate FEATURE, not a bug: **founder-fork to surface** (keep the
  human-access differentiator vs full company-voice?).
- **`9b47e6763` — finish body-content de-solo (product/company pages, EN+ES).** Reframed first-person
  narration + CTAs to company voice on ledger, for/restaurants, studio, trust, es/404 (+ ES): "I run
  front-of-house… numbers I check on my own shifts" → universal, "straight to me / I read every one" →
  "straight to us / every one gets read", body "Reach Don" → "Contact". **Deliberately KEPT** (appropriate):
  /about/+es (Don's story = the human seat), the library articles (voice canon permits first-person
  operator voice), the frozen course, /window/ (the fork). **→ Positioning-pivot de-solo is now
  substantially COMPLETE** (chrome site-wide + home + product/company; only intentional keeps + the
  generator-owned cost-index/open pages remain, which regen with the synced chrome on deploy).

- **`efc151449` — app-grade re-skin of the flagship free-tools section (Workbench pane, EN+ES).** Scoped
  CSS-only (cards are home-only): soft 14px cards + big lift → sharper 6px hairline cards, tighter
  hairline-depth hover, muntin top-accent on hover; pill teal chips → mono uppercase hairline labels;
  glyph-notes → tabular mono (the DATA VOICE). Kept the honest illustrative viz glyphs + live tool links;
  titles stay Fraunces (type unification deferred). Tokens-only (css-drift unchanged 504), shells regen'd,
  headless both themes clean. Screenshots sent.

**✓ ADVERSARIAL HOME REVIEW complete** (agent a3cf6e82…) — **verdict: ADJUST** (direction right, the top
third proves it works; finish the cascade + tighten, not a rethink). Its 3 highest-leverage moves — all now SHIPPED:
- **Move #1 (solo tail) — `c902109c4` + `92238ce51`.** The review's #1 seam + brief-violation was the About
  teaser (founder photo + "I'm Don"). `c902109c4`: retired the portrait → a literal **muntin window** (cool
  glass, six panes, sash — the metaphor in the adjacent headline; scoped .about-window CSS, token-only, both
  themes, css-drift 504), rewrote About to company "we", CTA "The story behind Muntin →" (still → /about/,
  where Don's story lives), + swept FAQ eyebrow "Questions I get"→"we get" and founding error "I'll add
  you"→"we'll". `92238ce51`: last chrome solo tell — footer newsletter "I send a short note"→"We send"
  (EN+ES templates, surgical string-propagate across 728 pages, **zero count-sentinel touch** — no idem
  drift chased). EN+ES.
- **Move #2 (hero instrument believability) — `a64bf8662`.** The load-bearing fix: the big +14.6% was the
  ONION move under a "sample basket" label (contradicted caption/verdict/math). Reconciled to "basket steady,
  onions the mover": big → **+0.6% basket net**, chip "onions leading", protein rows tamed to a genuine ease
  (ribeye 3.1→2.4, chicken 14.4→3.8), caption rewritten, the flagged Onion +14.6% row keeps the drama;
  count-up boot retargeted. Still illustrative; EN+ES; both themes + count-up verified.
- **Move #3 (data voice past the fold), surface 1 — `5a4514738` (+`e88a8f8bf` shell sync).** Trust-strip
  recast as a **mono system-readout** (scoped --ts-mono, teal status-LED per fact, tabular "43", middots
  dropped) → reads as capable infrastructure; + reframed the residual solo fact "Built by a working
  front-of-house manager"→"Grounded in a working restaurant floor — Tacombi" (honest, no fabricated scale).
  Token-only, css-drift 504, both themes.
- Review also flagged for later: type unification is **#2, a site-wide call, NOT the #1 fix** (deferring is
  defensible; if touched, neutralize the serif titling on product-UI surfaces locally). Flagship tool-cards'
  wide single column + small left glyph is the least-resolved layout (composition, not chrome). Desktop pins
  ~104px of chrome above the fold (banner+nav) — revisit whether the dispatch marquee must stay pinned on desktop.

**CASCADE CONTINUED (momentum surfaces + a fork):**
- **`b33fe119d` — recently-added rail → dense mono app-index.** Mono tabular dates + mono uppercase section
  tags + mono column headers (scoped --li-mono), hairline rows, subtle teal row-hover. Also fixed a latent
  overflow bug: `table-layout:auto` + long titles blew the table to 1661px inside a 994px scroll container,
  hiding the Last-updated + Contributor columns → `table-layout:fixed` (820px, all 4 columns, titles wrap).
- **`0b3fb7b96` — recents contributor by byline canon.** The rail hardcoded every contributor to "Don
  Goldstein" — a byline-canon violation (library = "The Muntin Desk") AND, once the table tightened, a
  column of 8× "Don Goldstein" that read as a one-person shop. Now derived from the URL namespace
  (library/tools → "The Muntin Desk", blog → "Don Goldstein"); regenerated EN+ES home + /learn/ rails; matches
  the live article bylines. Fixes correctness + de-solos in one move.
- **`21d677c84` — founding band → product enrollment.** CSS-only (form machinery untouched): mono field
  labels (scoped --fd-mono), hairline inputs (--line-dark) + 6px radii, and the GA countdown wrapped in a
  mono teal readout ("19 weeks out" — sentinel intact inside the span). Enrolling in a product, not a newsletter.
- **`dd841e383` — library-island cards → flagship hairline pattern.** learn-tool cards get 6px hairline,
  muntin top-accent on hover, −2px lift, mono uppercase kickers (rust body-font → mono stone). `.service`
  product 3-card DEFERRED (shared with /studio/ pricing tiers → cross-page risk).
- **⚠ FORK — footer newsletter reverted to Don's gated voice (`01d13d038`, reverts `92238ce51`).** The
  full-gate audit (`check-all` 232/258; the 25 other misses are all `(idem)` deploy-healed drift) caught the
  ONE real regression: `check-newsletter-copy.mjs` (Phase G.10) REQUIRES "when I publish something" / "cuando
  publique algo" — Don's humble first-person newsletter framing, an explicit anti-corporate-SaaS guard. The
  de-solo pass overreached into that gated, intentional keep. Resolved toward the gate ("never loosen gates";
  a warm first-person footer note doesn't dent the capability positioning). **Open founder decision:** de-solo
  the newsletter too (→ update the G.10 gate) or keep it personal (current). The rest of the solo-tail de-solo stands.

**AUDIT CHECKPOINT (`check-all`, post-cascade):** 232/258. Every miss is `(idem)` deploy-regeneration drift
(sitemap, OG cards, CSS cache-bust, site-counts 359-file drift, glossary schema, RSS, etc. — the standing
deploy-healed set, NOT chased per board rule) EXCEPT the newsletter-copy gate, now fixed (`01d13d038`).
Per-increment gates were green throughout (fabrications 0, css-drift 504, locale-parity, footer-payload, sync).

**✅ HOME v3 CASCADE COMPLETE.** All review moves + momentum surfaces shipped (`c902109c4`→`528368966`).
The `.service` 3-card is DONE (`528368966`). The stances section is intentionally LEFT (review: lowest
priority; its `cal:band.*` sentinels are SENSITIVE/heartbeat-tied — not worth touching unattended for low reward).

**OFF-HOME ASSESSMENT (2026-07-11, autonomous):** the funnel pages were **already given prior v3 passes** and
are substantially aligned — NOT soft-card pages needing transformation:
- **/tools/** — inline "Bolder pass 2026-07" (3px ink top-frame cards, teal "You leave with:" walkaways, tier
  badges, muntin dark-closer lines) "matching the homepage closer." Already capability-forward.
- **/cost-index/**, **/library/** — heavy mono/hairline/tabular signal (25 / 46 hits); library has 0 soft cards.
- **/ledger/** — its "soft" signals are deliberate instrument panes (`.lg-pane`/`.studio-card` = 1px line +
  3px ink top-frame), an illustrative rotated sheet graphic, and callout boxes — not generic soft cards.
- **/about/** — least mono, no bolder pass, BY DESIGN: it's the founder's human seat (personal voice KEPT per
  the pivot). Re-skinning it cold would fight its role.
→ **Conclusion: the visible v3 redesign is SUBSTANTIALLY COMPLETE across the funnel.** The home was the one
untransformed flagship; it's now done + audited. No clear high-value off-home transformation remains.

**REMAINING = FOUNDER-LEVEL, SITE-WIDE DECISIONS (surface, don't do unattended):**
- (a) **Footer newsletter** — keep Don's gated first-person voice (current) or de-solo it too (→ update the
  G.10 `check-newsletter-copy` gate).
- (b) **Type unification** (Fraunces→Inter on product-UI surfaces — review's #2, a site-wide call).
- (c) **Radius/treatment unification** — home uses 6px hairline; off-home funnel uses 10–12px softer radii from
  earlier passes. Unifying to 6px site-wide would make it read as ONE app-grade system (site-wide call, may
  conflict with prior deliberate passes — founder's call).
- (d) The **/window/** personal-access founder-fork; the **flagship tool-card composition** (2-up / full-width glyph).

**OPTIONAL internal cleanup (non-visible, low-priority):** 6 duplicated scoped mono stacks (`--ci-mono`,
`--ts-mono`, `--li-mono`, `--fd-mono`, `--lt-mono`, `--sv-mono`, all identical) → one global `--font-mono`
token. Deferred: needs the token-sync gate + data/muntin.tokens.json editorial-register updated; gate risk not
worth taking unattended for a non-visible DRY win.

**NEXT (autonomous, ordered) — SUPERSEDED** by the review-driven NEXT above (item 1 instrument shipped as
`37c70aac4`+`a64bf8662`; item 2 stances now deferred behind the momentum surfaces). Retained context: the
pane archetypes + token re-pigment (accent already blue #2A50C8/#7AA7FF — nudge to electric #3b68f5/#5b82ff
only if AA holds; the v3 feel is mostly composition + mono voice); Phase 0 remainder (cost-index cadence,
/security/, generator-owned footer handler) in parallel where independent.

**Thread (prior):** executing the fully-mapped storefront reinvention (`docs/handoff/reinvention-master-plan.md`)
in the founder's build → audit → iterate cadence, expert-verified per increment. Strategy docs on
this branch: `founder-vision.md`, `retention-strategy.md`, `tools-strategy.md`, `site-coverage-ledger.md`,
`every-surface-map.md`, `library-audit-full.md`, `site-reinvention-blueprint.md`. Strategy = PRUNE →
REFOCUS → ELEVATE; 7 phases (0 correctness → 1 prune → 2 re-pigment → 3 retention engine → 4 trust/human
→ 5 content refocus → 6 signature craft). Demo work + #501 already merged to main; this branch had been
docs-only until Phase 0 build started.

**Phase 0 (correctness/staleness) — SHIPPED so far (each committed + pushed + gate-verified):**
- **Increment 1 (`3be5e1d82`) — retired-tool dead-navs + OCR privacy violation.** Removed, EN+ES:
  (a) Menu Engineering's "Open N in Menu Converter" card — the P0 menu-wipe (menu-converter 301-loops
  back to menu-engineering → reloaded the page with an empty grid, destroying the typed menu); plus the
  menu-copy/photo-brief quadrant handoffs + dead briefLinkFor/priorityForQ + stale edu link. (b) Plate
  Cost's Tesseract-CDN OCR (CSS+HTML+JS) — it lazy-loaded ~3MB from cdn.jsdelivr.net, breaking the page's
  own "no upload… Zero requests fire" promise (P0 honesty); + the retired photo-brief "Brief your
  photographer" button. (c) Margin Math's menu-copy cross-suggest. (d) Pruned `next-tool-map.json`
  24→3 live→live rules (killed the recommender's retired-tool cards). Verified: all inline scripts parse,
  zero orphans, check-all 236/258 with a **byte-identical failing set to the pre-edit baseline** (all 22
  are deploy-regen idempotency drift), tool-no-fetch/retired-links(chrome)/locale-parity(239)/banned-words green.
- **Adversarial review** (general-purpose agent, 32 tool-uses): verdict FIX-FIRST — findings 1/2/5/6 CLEAN,
  honesty materially fixed; caught ONE completeness gap (4 sibling escalate CTAs still → retired audit).
- **Increment 1b (`29343de52`) — closed that gap.** Repointed margin-math's 4 result-flow escalate CTAs
  off retired `/tools/audits/restaurant/` to topic-matched live reads (channel→delivery-economics,
  prime-cost→pricing guide, break-even→menu-engineering read, raise→Menu Engineering tool); link+copy only,
  JS toggles untouched; correct ES library slugs. Reworded menu-eng's "same architecture as Brand Suite"
  data-posture line off the retired brand-suite tool. Gates green.

**Phase 0 — STILL OPEN (next increments, ordered):**
1. **Fire-and-forget forms that fabricate success** (founding-list + newsletter) — honesty defect, HIGH.
2. **Cost-index stale-anchor + cadence contradiction → monthly everywhere** — trust-debt ("teaches people
   not to return"); site says monthly/quarterly/weekly simultaneously. HIGH.
3. Audit-found fact defects; `/security/` claim-count + schema bugs.

**Deferred by design (logged so not lost):**
- **Increment 2 — chrome-freshness sweep:** the bottom "Where to go next" (mm-next) blocks + the stale
  "Free tools" footer nav on margin-math (7 retired links) + menu-engineering (1) still list retired tools;
  the clean `_includes/footer.html` dropped the Free-tools column entirely (plate-cost/cost-pulse/vendor-
  benchmark already synced). Bring the two stale footers in line; verify `check-footer-payload`. Homepage
  `index.html:654` prose also still names retired tools.
- **plate-cost "Zero requests fire" honesty reconciliation:** plausible IS loaded (`/api/event`) and fires
  on Compute, so that exact line is a (pre-existing) overstatement; it's synchronized across prose +
  JSON-LD FAQ + audio script + the "5 verifiable claims" artifact (both locales) + likely security-claims —
  fix all instances together, or it desyncs / trips the audio-fabrication + security-claims gates.
- **plate-cost Invoice-Decoder integration** (`pcPullInvoice`/`pcStaleBanner`/stale error string) — a whole
  retired-tool FEATURE, not a stray link; Phase-3 tools-loop rebuild decision.

## ⮕ CURRENT STATE — Cost Index data-company expansion (updated 2026-07-11)

**Session on branch `claude/vendor-benchmark-redesign-yn273q`** (storefront `potentially-profitable`). Thread: turn the Cost Index into a genuine **data company + open library** — surface the deep price history, add the "events that moved the market" layer, and wire the HONEST use of new public data (NASS/Census/EIA). Cadence: plan → build → audit → iterate, with **expert panels at the forks**. `check-all` baseline unchanged (232–233/252; the ~19 failures are the deploy-regenerated site-wide idempotency drift, NOT ours — see Gotchas). Every cost-index/events/context gate GREEN.

### ⮕ VB WHOLE-PRODUCT AUDIT LOOP (2026-07-10) — recurring improvement loop, founder directive

After ROADMAP COMPLETE, founder asked for "a recurring improvement loop until this product is the best we can make." Ran a **39-agent whole-product adversarial audit** (7 lenses → per-finding adversarial verify → synthesis) → 28 confirmed findings + a ranked 21-item roadmap. Read: VB is **near-optimal on privacy-mechanics + compute-correctness** (the adversarial pass refuted/downgraded ~⅓ of raised leverage — the "live leak", "illegible verdict", "no shareable artifact" headlines all softened vs the code); real headroom is (1) activation/funnel, (2) kitchen-phone perf, (3) answer legibility + cheap a11y regressions. Full synthesis: the audit output; roadmap ranks in this block.

**SHIPPED (each committed + pushed, gate-green, EN/ES `<style>` byte-identical):**
- **Pass A — S-effort a11y+correctness hygiene batch (`efe5c5e05`).** #7 row IDs `performance.now()`→monotonic `VB_UID` counter (Firefox/Safari clamp collapsed rows to dup ids → both date labels bound to row 1); #6 Your Book chips encode over/under/in-line **in text** not color alone (sparkline is aria-hidden — WCAG 1.4.1/1.3.1); #5 restored skip-link + `<main id="main">` EN+ES (parity regression); #12 combobox active rail new `--vb-signal-strong` token (darker teal, ≥4:1 on the tinted row vs the old ~2.55:1 — WCAG 1.4.11; verdict tones untouched); #9 dropped the duplicate "Load the example" button (the 3-scenario demos row is now the single onboarding affordance + carries the first-run promotion); #21 deleted dead `timelineBlock` + orphaned strings.
- **Pass B — minify the Cost Index browser seed 887KB→469KB (`33120a0f1`).** `build-cost-index-seed.mjs` `JSON.stringify(,,2)`→compact (correct target format going forward) + re-serialized the CURRENT committed data compact (whitespace-only, parsed object char-identical to HEAD — 468339 both). 47% fewer bytes on the dominant kitchen-phone main-thread script, zero behavior/privacy change, still no-fetch. **Deliberately NOT a fresh rebuild** — see the FINDING below.
- **Pass C — single-price compute tier, THE BIGGEST LEVER (`2d7ef7665`).** Meets the most common arrival state — one invoice in hand ("ribeye came in at $14.40 — is that high?"), which the tool used to refuse. Item + one priced row (dated or not) → an honest **level** read via `FairPriceGap.assess`: a delivered price above wholesale is NORMAL, so "above reference" is calibrated as your level (never overpayment proof); only >60% far-above raises a non-accusatory "worth asking your rep" flag. Shows the reference $-anchor + "your price never leaves your browser"; ADR-012 context reused via a new `contextBlockForKey()` extraction (never the operator's price); index-basis/thin → lighter "add a second dated invoice" track block; no-match → clears. Upsell CTA appends a PRIOR-dated row (21d back, never future) + focuses its price → the two-date engine takes over. Verified the exact template assembly + FPG verdicts against the real seed (14.40→at-reference, 22→far-above +67% worth-asking, 6→below, zucchini→no-level, unknown→clears).

**⚠→✅ FINDING (found + adversarially verified + FIXED) — seasonal normals were nominal-dragged (`03f42d599` finding, `04268f66b` fix; doc `docs/handoff/FINDING-seasonal-nominal-drag.md`).** `build-seasonality.mjs` computed each "typical {month}" normal from the **full 25-year raw-nominal deep history** (no CPI/detrend), so the **live ingredient pages** rendered false level signals — ribeye "current read ($13.14) is running above its typical June" off a $6.82 25yr-dragged median (a ~97% false alarm on **58 live pages**; butter inverted to false "cheap"). The reconciliation gate was blind to it; ADR-014 already legislated the fix. (Note: the *seed*/Cost-Pulse cards were on the safe recent-window normals — the drag was live on the *pages*, not the seed; Pass B correctly preserved the seed.) **Operator chose the trailing-window fix.** SHIPPED: `WINDOW_YEARS=5` — each month's normal now pools only observations within 5yr of the series' own latest print (deterministic, ADR-014 precedent); deep history still feeds the relative SHAPE surfaces (cheapest/priciest month, 12-mo curve). ribeye typical-June $6.82→$10.76 (range $9.97–$11.59); $13.14 now reads an honest ~+22% (beef genuinely elevated in 2026). New bounded-window `--check` invariant (no month pools > WINDOW_YEARS) + 3 self-tests (22/22). `seasonality.json` regenerated; `build-seasonality --check`/`--self-test` GREEN. **ACTIVATION (remaining):** the ingredient pages bake bands at build time — run `node scripts/build-cost-index-pages.mjs` (or the daily `cost-index-refresh` workflow, which already runs it) to re-render the 58 pages with the honest 5yr bands and reconcile `check-cost-index-seasonal`; this is the SAME page regen the 196-file `build-cost-index-pages --check` baseline drift already awaits (so `check-cost-index-seasonal` reads red until that one regen runs — same deploy-regen class, not a new defect).

- **Pass D — chart craft + funnel/date polish (`d2b3be4cb`).** #17 drew the promised faint value gridlines (consume the `--vb-grid` token that was declared on all four themes but referenced zero times) at round index levels + toned the legend "you" swatch to the verdict line (data-tone on figcaption; was hardcoded `--ink`, so a rust line sat above a black swatch). #16 dedup the Ledger CTA — when the strong funnel card renders its CTA, the Your Book rollup drops its duplicate "See Muntin Ledger" link (keeps the count as text), gated via a `lastStrong` flag. #20 clamp the +21-day "Add a purchase" default to ≤ today (never pre-fill a future date). (#21 lazy-build combobox deferred — minimal-impact perf micro-opt on the adversarially-verified combobox machinery, not worth the regression risk.)
- **Pass E — share-fragment + privacy-proof hardening (`394065405`, #8/#15).** The "sent anywhere: 0" counter is the moat's differentiator, so six proof-soundness fixes (no live leak exists — VB loads no analytics, fires zero requests): register the encoded share payload with the monitor (new `vbShareTokens`, scanned in `vbScan` — the raw prices never appear literally in a `#b=` link, so the monitor was blind to a leaked fragment); `shareLink` no longer writes `#b=` into the sender's address bar (removed `history.replaceState` — the link still goes to clipboard/native-share by choice, but the bar/bookmarks/analytics stay price-free); `hydrateFromHash` strips `#b=` BEFORE hydrating so recipients don't retain the sender's prices; `track()` refuses to emit while a `b=` fragment is present (defensive); native-share path now shows the "includes your prices" disclosure too (new `shareShared`); reworded the pre-click tooltip off the absolute "never sent to a server." No-fetch invariant holds (monitor still wraps by reference); consistent with `security-claims.json` "fragment-only-share-links". **Adversarial security-verify dispatched.**

### ⮕ RE-AUDIT #1 (2026-07-10, 39 agents, adversarially verified) — batch landed clean; front door finished

Ran the recurring-loop re-audit after Passes A–E + seasonality (6 lenses → per-finding adversarial verify → synthesis). **Read: "substantially clean"** — A/B/D/E + seasonality confirmed CLOSED, all invariants (no-fetch, byte-identical style, wholesale honesty, fact gate) hold; the adversarial pass refuted a third of raised leverage. **4 regressions (all minor/safe-direction) + Pass C shipped under-finished.** Verdict: NOT yet convergence — one coherent high-lever thread left (finish + monetize the single-price front door, ranks 1–6), after which it converges to nits.

- **Pass F — fixed the 4 re-audit regressions (`f62d69399`).** [HIGH-IMPACT] chartSvg gridline loop could **freeze the tab** on a dropped-decimal typo (fixed gridStep × unbounded index range → thousands of `<line>`s); gridStep now DERIVED from range (nice 1/2/5×10ⁿ, ~6 lines) + hard-capped at 16 (verified: 100×/1000× typo → 2 lines). [minor] a corrupt inbound `#b=` fragment silently muted ALL analytics for the session (strip was on the success path only, track() gated on `b=`) → strip now UNCONDITIONAL at the top of hydrateFromHash. [minor] single-price ran the 81-item name-match 3× per settle → new `labelForKey()` reads the label from the picker by the key FPG already returned. [nit] `run()` called `currentPurchases()` twice on the early-return path → once.
- **Pass G — finished the single-price front door (`74cafdc13`, ranks 1/2/5).** A11y parity: real `<h2 class=vb-sp-h>` verdict heading + the SR announce now speaks the ACTUAL verdict+detail (was a constant); no focus-steal on the debounced render. Moat seed: **"Watch this item ☆"** adds the item to Your Book straight from the one-price arrival (`saveWatch` keyed by the same Cost Index key `saveToJournal` uses → a later 2-date check UPGRADES in place, never dupes, never downgrades). No-match feedback: a not-tracked item shows an honest "we don't track {item} yet; add a second dated invoice and the tool still tracks your OWN trend" + announces it, instead of blanking.

- **Pass H — Your Book LIVE on-return watchlist (`2fe374fd5`, rank 3).** Pairs with Pass G's watch: the book showed gaps FROZEN at check-time. Now `renderJournalRail` recomputes a live market pulse on every load — "Your book today: N of your M tracked items are running above their normal market right now (K below); {top} furthest up ~X%." Reads each item's CURRENT vs-normal state from `MUNTIN_COST_CONTEXT` by key (`marketNowFor`) — reference state only, never the operator's price, only fires on a live elevated/depressed signal. `.vb-book-live` uses `--vb-signal` chrome.

- **Pass I — two-tier result for the 2-date engine (`908a13ba4`, rank 4, L).** render() split into ANSWER (verdict headline · ADR-012 context reframe · "will it stick" spike · since-last-check · THE ACTION moved up under the verdict · funnel) always-visible, and SUPPORTING (chart+table · own-history · regime/forecast · attribution) behind one `<details class=vb-analysis>` ("See the chart & the full analysis"). Honesty reframes (context+spike) deliberately stay in the answer, never behind a click. `analysisOpen` state + `wireAnalysisToggle()` preserve the open/closed choice across per-keystroke re-renders. No transparency loss (always-on provenance strip stays at top). Structurally verified (syntax, byte-identical style, details-wrapper assembly, gates); NOT browser-tested here — re-audit #2 exercises it.
- **Pass J — gate journal side-effects (`f894fd077`, rank 6, M).** The 2-date path now calls saveToJournal + renderJournalRail only when a journal signature (journalKeyFor·gap·tier·thin) CHANGED — killing the whole-blob localStorage read/parse/write + full rail rebuild that fired on every keystroke and seed/shard re-render even for a byte-identical entry. `lastJournalSig` resets on page load (first result per visit still records a new-sitting check → cross-visit "since your last check" preserved) + in the data-jclear handler. Verified 5 settles → 3 saves.

**RE-AUDIT #1's ranks 1–6 thread COMPLETE** (regressions F + front door G + watchlist H + two-tier I + journal-gate J).

### ⮕ RE-AUDIT #2 (2026-07-11, 16 agents) — thread landed clean; CONVERGED after one fix pass

**"The F–J thread landed cleanly on the hard part."** The highest-risk change — Pass I's two-tier `render()` restructure, which I could not browser-test — **SURVIVED** verification (answer/supporting split correct, empty-supporting guard, `analysisOpen`+`wireAnalysisToggle` preserve disclosure state across per-keystroke re-renders, `wireChartHover` still binds inside the collapsed `<details>`, verdict h2 + count-up stay visible, EN/ES `<style>` byte-identical, no fetch, honesty intact). Pass F & J fully closed. Caught **2 coupled regressions, both on the single-price-watcher RETURN path** (S-effort, graceful, no moat/honesty breach) → **fixed in Pass K**:
- **Pass K (`17c8b0500`).** (1) Watch-chip reopen dead-ended — `saveWatch` stored no `purchases`, so reopening emptied the form + blanked the result + focused null. Now the single priced row is carried on `lastSingle` + stored in the watch entry, so reopening restores the price → single-price read; `revealResult` falls back to focus `#vbSpH`. (2) Live pulse absent on return — it painted once at boot before the lazy `MUNTIN_COST_CONTEXT` seed landed; the lazy-seed `onload` now calls `renderJournalRail()` after `run()` so the pulse paints once context is available.
- **Pass L (`8c6111986`).** Drained re-audit #1's #14 nit: `saveToJournal` returns early when `!seedsPresent()`, dropping the transient pre-seed `item:<name>` phantom duplicate (no-match own-history still saves post-seed).

**⮕ LOOP CONVERGED.** Re-audit #2's prediction ("converges after one tight pass") is met: the two blocking regressions are fixed + the #14 nit drained. Remaining is **only nits + strategic L-plays** — the recurring loop reached the founder's stated stopping condition ("until the audit returns only nits / diminishing returns"). **Strategic next frontier (each L, a NEW product direction — founder's call):** (1) operator's OWN cross-vendor delivered comparison — the only HONEST path to an actual "you're overpaying" verdict the wholesale reference can't give (compare the operator's own delivered prices for one item across vendors; on-device, no crowd, no backend); (2) on-device book export/import ("your book is a file you own" — neutralizes a sync-backed competitor within the moat); (3) #10 zero-input market briefing (M — empty-state biggest-movers-vs-normal). **Nit tail:** #19 chart labels 320–390px (M), #18 glossary cross-surface `vendor-benchmark` entry (S, needs library regen).

<!-- (superseded) RE-AUDIT #2 was dispatched to catch regressions + confirm convergence — done, above. --> **DONE this session (~35 commits):** S-cluster (A) · #2 perf (B) · #1 biggest lever (C) · chart/polish (D) · #8/#15 honesty+verify (E) · 4 regressions incl. gridline-freeze (F) · single-price front-door a11y+watch+no-match (G) · live watchlist (H) · two-tier result (I) · journal gating (J) · + the seasonal nominal-drag fix. **Remaining tail (post-re-audit-2):** category-ceiling L plays (own cross-vendor delivered comparison; on-device book export/import) · #10 zero-input briefing · #19 chart labels 320-390px · #18 glossary cross-surface entry · #14 phantom pre-seed dup · honesty copy reconciliation.

**SHIPPED this session (all committed + pushed, each gate-green):**
- **Notable price events surface — ADR-011.** Deterministic detection (`scripts/build-cost-index-events.mjs` → `data/cost-index-events.json`: biggest SUSTAINED moves off a centered ±26-wk local median + duration / own-season / co-movement; 432 events / 80 ingredients) rendered on every cost-index ingredient page, JOINED to the site's existing curated, CITED registry (`cost-index/events.json`, 39 documented events, USDA/CDC/NOAA) as CO-OCCURRENCE context (never cause). Retired the interim hand-drafted notes. Honesty gate `scripts/check-cost-index-events.mjs` (self-test + live, now also scans the hub).
- **Operator takeaway** on each events section — computed volatility verdict (fix vs float the menu price), median recovery-time, the market-vs-vendor read. Operator-grounded; no forecast/sourced-claim needed.
- **Vendor Benchmark market-context — ADR-012.** The tool reads the REFERENCE's own state (elevated/depressed vs its trailing-year normal + most-recent documented event), NEVER the operator's price, so the fair-price-gap wholesale contract holds. Seed `scripts/build-cost-index-context.mjs` → `data/cost-index-context.js`.
- **/cost-index/events/ hub** — the 39-event registry as a browsable, category-filterable, cited history joined to detection magnitudes; Dataset JSON-LD + CC-BY open-data link. EN full accounts; ES Spanish UI with the English source behind an "(en inglés)" disclosure. `check-banned-words` scrub extended to exempt quoted registry text (`data-quoted-source` / `.ci-events__ctx`).
- **NASS cold-storage deseasonalization — ADR-014.** `coldStorageAnomaly` (same-month 5-yr median deviation) + `transform:"anomaly"` on the 5 cold-storage specs + 17/17 tests. Pure code; activates on the operator's live NASS fetch. **The blocking prerequisite from the data panel — DONE.**
- **EIA freight demotion — ADR-013 EIA "NEXT" #1 (manifest `_version` 2026-Q2-19).** Removed the per-item `diesel` PRESSURE contributor from all 78 items (inert — signal 0 on 6 of 7 built items; only beef-tenderloin=+1; mechanism-less as a per-ingredient arrow). A **3-designer + skeptic-synthesizer panel** found the "single index-wide freight backdrop" ALREADY EXISTS — the FRED **GASDESW** measured driver (`cost-index-sources.json` `drivers.diesel`, `kind:energy`, `leads:[]`, "coincident gauge… association only", rendered as the one "Diesel / freight" hub direction) — so the 78 votes were a double-count of one EIA quantity; **removed them, minted no new surface** (a drivers-layer freight driver was rejected — its per-cluster `affects[]` would rebuild the false per-item arrow). **RESOLVED the ADR-013 open freight-double-count question** (exactly one live freight series now = GASDESW). Diesel spec kept **dormant**; `button-mushroom` (diesel-only) retired; `freight` group stays live via `deep-sea-freight` (distinct ocean series). Honest recompute: chicken high→moderate (breadth floor — the inert 3rd signal had propped them), beef-tenderloin high/3→moderate/2 (loses its lone real diesel vote), russet moderate→high (inert diesel was diluting agreement). `check-all` 233/252 (baseline, 0 new fails).
  - **Explanatory-layer reconciliation (follow-up commit)** — the adversarial verify caught that removing diesel from the overlay made the site's own *explanatory* pages wrong: glossary **EIA** + **pressure-overlay** terms (term-def, term-why, FAQ, term-examples, SEO/OG meta) and `cost-index/methodology` all still called diesel a *leading* pressure signal that "cleared its track record." Reconciled **EN+ES** to the new truth (diesel = coincident index-wide GASDESW backdrop; the overlay's leading edges are supply signals — cattle-on-feed→beef, feed→chicken/pork), via an editorial-agent draft I fact-checked + applied (4 glossary seeds + 4 hand-authored HTML surfaces per page + 2 methodology pages). Gates green: locale-parity, hreflang-orphans, glossary-hub, **fabrications (fact gate)**, banned-words. Note: the `glossary-og-focus.json` seed is updated but its **OG PNG cards regenerate on the next `build-og-cards` run** (skipped here to avoid the unrelated OG-image inject drift). Thin-survivor completeness: `vegetable-oil` (feed-soymeal only) also drops to a lone real indicator (off the built set — no shippable anchor), alongside the 5 deep-sea-freight imports + sweet-potato.
- **Cold-storage per-commodity gating — ADR-014 §3/§4 (`fd19515a8` + the honesty-hardening follow-up).** Applied the gate in the manifest: **cheese/poultry/beef cold-storage votes REMOVED** (confounded → descriptive-only via the `/open/` specs, machine-marked with a new `_gate` field on each spec; poultry export-confounded, cheese secular-growth-confounded, beef inventory-cycle-confounded incl. the short-rib/ground-beef stragglers the Q2-18 beef drop missed); **pork KEPT scored -1** (coincident, N=102) on loin/shoulder/belly; **butter demoted tier B/weight2 → tier C/weight1** (weak/uncalibrated — it had been weighted ABOVE the proven pork edge). Added `coincident:true` to the 4 kept cold-storage indicators + propagated it through the engine (`cost-pressure.js`) so the **dispatch (`build-cost-index-dispatch.mjs`) never attaches a "N-week lead" phrase to cold-storage** (renders "(concurrent)" instead) — closes the ADR-014 §4 "no lead-lag phrasing" gap at the source. Rebuilt `cost-pressure.json` + `cost-outlook.json` + Lab artifacts; live snapshot hand-trimmed (pending next fetch). **Adversarially verified** (3-lens panel: ADR-fidelity + mechanical + skeptic → unanimous SHIP, fidelity FAITHFUL). All pressure/outlook gates GREEN.
- **Vendor Benchmark redesign — Phase 1 (in progress).** Founder ask: make the tools "cutting edge and futuristic" to build company confidence + add an ingredient dropdown (we don't surface all items yet). Landed so far: the **`--vb-*` "market instrument" token/material layer** (Invoice Desk / Instrument Readout / Market Well / Ledger Tape) across both locales (byte-identical, all theme paths: light + prefers-color-scheme dark + `[data-theme]` + print); **ingredient-picker manifest** `data/cost-index-picker.js` (`window.MUNTIN_CI_PICKER` = **array** of 81 pickable items `{key,label_en,label_es,unit_en,unit_es,group,dollarRef}`; groups beef4/poultry4/pork2/produce68/dairy-eggs3; 20 firm-$ refs) + builder `build-cost-index-picker.mjs` + gate `check-cost-index-picker.mjs` (13 self-tests, tamper-tested) + shared taxonomy `scripts/lib/cost-index-categories.mjs`. **Token-layer cascade fixes** (`fae37c3e4`): chart labels `--stone`→`--ink-soft` (WCAG AA on the recessed `--surface-inset` well), pulled `.vb-headline` out of the dark-override groups so the readout wash + tone bezel survive (new `--vb-readout-bg/-edge` tokens, all theme paths), dropped `.vb-prow` dark `border-color` so `--vb-rule` shows. Reserve `--vb-signal` for picker chrome, never verdict tones.
- **Ingredient combobox — SHIPPED + adversarially verified (`31f2b0092` + fixes `97efda958`).** Accessible ARIA-1.2 editable combobox over `#vbItem` (3-lens design panel → build → 4-lens adversarial verify). Progressive enhancement (no-JS = plain input); grouped filterable listbox of the 81 items (diacritic-insensitive substring on label+key); sticky scope header + `$`-legend; no-match invites free-text; sr-only count region; on select writes the label + fires `input` (existing pipeline re-matches), **never touches `#vbUnit`** (carton/sack aren't options); `isTrusted`-guarded. Manifest reshaped to `{count,dollarRefCount,groups:[{key,label_en,label_es}],items:[…]}` — group labels from the shared taxonomy (drift-gated 1:1 with the category pages). **Adversarial panel caught + we fixed:** (1) BLOCKER honesty bug — ES "Butter lettuce" (`label_es` "Lechuga mantequilla (Boston)") resolved to BUTTER via the shared lookup's token-subset propose (the incoming name wasn't parenthetical-stripped like `cands()` are). **Fixed in `tools/_shared/cost-index-lookup.js`**: `match()` now compares the parenthetical-stripped incoming name too and an EXACT match always wins over stem/propose (benefits Plate Cost + Ledger; existing lookup+bench-lookup tests still pass). **New round-trip gate** in `check-cost-index-picker.mjs` (`validateRoundTrip`, loads the real browser-equivalent lookup) asserts all 81×2 labels resolve to their own item — 0 failures, 21/21 self-tests. (2) MAJOR a11y stale active-option (clear by `activeEl` reference, not `results[activeIdx]`). (3) orphaned `aria-describedby` note (now appended). (4) caret → 44×44. Placeholder fixed to in-list examples. **All gates green.**
- **⮕ WORLD-CLASS ELEVATION (in flight, founder directive 2026-07-10):** "make this tool rival all the biggest tech/SaaS companies in power, UX, cutting-edge feel, and the largest segments they compete in" — WITHIN the honest/on-device/no-backend/private-prices moat (the moat is the differentiator vs data-monetizing incumbents). 10-segment competitive-teardown + capability-gap panel running (onboarding/aha · analysis-power · visual-motion · a11y · performance/PWA · shareable-deep-linked-state · power-user/⌘K · trust-provenance-as-product · mobile · personalization) → product-council synthesizer → ranked honest roadmap → build top increments. Task #11. **Full 15-item ranked roadmap + 6 honest rejections persisted at `docs/handoff/vb-world-class-roadmap.md`** (the resume-here plan). Founder then said "continue through the ENTIRETY of the plan, Build/Audit/Iterate with frequent expert specialists" → marching it foundations-first.
  - **SHIPPED so far (each committed + pushed, gates green, expert-verified where honesty-sensitive):** **#1 mobile floor** (`--vb-touch:44px`, 16px fields kill iOS zoom, 44px targets) `fae…`; **#5a ADR-012 market-context line** — lit up the loaded-but-dead `MUNTIN_COST_CONTEXT` (reference's own elevated/depressed-vs-normal + volatility + recent co-occurring event; reference-state only, never operator price; honesty-specialist verified CLEAN, then tightened to fire only on a live signal) `3ddfe92`; **#4 journal history spine** — per-item capped ring of checks + `priorCheck` reads from storage so "since your last check" survives a refresh (fixed the in-memory `reopenBaseline` cold-load bug); back-compat reader; ring algo unit-verified `b84be17`; **#6 a11y core** — verdict `<h2 id=vbVerdictH tabindex=-1>` + focus-on-explicit-actions, chart aria-label states its takeaway + thin hedge, bad-price `aria-describedby` (WCAG 3.3.1), reduced-motion scroll gating `cffb4d6`; **#7a provenance strip** — four-cell instrument-panel (SOURCE/BASIS/AS OF/SCOPE), as-of from `seed.generatedAt` on load + live count from the picker manifest, never a fake date, no-fetch invariant holds `71bc597`.
  - Also shipped: **#7b live privacy counter** (`+hardening`) — Ledger-Tape "kept here: N · sent anywhere: 0"; an OBSERVE-ONLY fetch/XHR/sendBeacon monitor wrapped BY REFERENCE (never writes a send-literal → no-fetch invariant holds, 116 files green); scans each outbound url/body (incl. FormData/URLSearchParams) for the typed price (len≥4) → stays `--status-good` 0. **Security-specialist adversarial-verified CLEAN** (pass-through, never-throw, no-leak, idempotent). **#3 motion-epoch gate + #12 core** `+` — render-epoch identity signature (item·tone·thin·sign(gap)·phase) → `animateThis` fires motion ONLY on a new answer, SNAPS on same-identity keystroke (gate logic verified); hero gap-number rAF **count-up** landing exactly on target (dollars never tween); result fade/rise reveal; `--vb-ease/-t-*` tokens. All reduced-motion + no-rAF safe.
  - Also shipped: **#2 seed-sharding** (`+cache fix`) — `build-cost-index-history-seed.mjs` emits 81 per-item shards `data/ci-history/<key>.js` (~20KB) verified byte-equal to the monolith; VB dropped the 1.6MB monolith tag, `maybeLoadHistoryShard(res)` loads only the picked item's shard on demand (same-origin `<script>`, path-injection-guarded, graceful→shallow spark). **Security/data-path specialist verified** 7 axes CLEAN + caught 1 MEDIUM (immutable-cache staleness footgun) → fixed to `max-age=1d + stale-while-revalidate` (freshness no longer depends on bumping `HIST_V`). Monolith kept for Cost-Pulse pages. **#8a first-run onboarding** — `data-first-run` shell flag: singular filled CTA "See it work →", Add demoted, Clear hidden; ghost readout (em-dash placeholders, reserves the region); retired the instant a real answer renders.
  - **⮕ ROADMAP COMPLETE (2026-07-10)** — all 15 items resolved by disposition; ~19 increments, each committed + pushed + gate-green, expert-verified on honesty/security/data-path items. Capstone gate sweep all green (no-fetch invariant, picker round-trip, VB-scenarios honesty gate, banned-words, fabrications, locale-parity, hreflang, lookup tests, EN/ES `<style>` byte-identical). **SHIPPED:** #1 mobile floor · #2 seed-sharding (+verified, cache-fixed) · #3 motion gate · #4 journal ring · #5a market-context · #6 a11y core · #7a provenance strip · #7b live privacy counter (+verified) · #8a onboarding · #8b 3-scenario demo (+`check-vb-scenarios.mjs` gate) · #10 paste-a-table/Enter · #11 Your Book (sparkline+distribution) · #12 count-up + chart stroke-draw · #13 shareable URL (fragment, sanitized) · #14 native share sheet. **HONESTLY NOT SHIPPED (moat/scope):** #14 offline-CACHING SW **REJECTED** (violates the documented no-fetch-interception posture in `security-claims.json` — the moat wins over offline; a no-op installability SW like `course/sw.js` is a documented future option). #12 native View Transitions **DEFERRED** (optional, browser-specific, untestable in-container; existing count-up + stroke-draw + result-fade deliver the signature motion). #9 while-you-were-away **SUBSUMED** by #4 (the trend already survives refresh, per-item). #15 capstone = the final gate sweep + this documentation.
  - **(historical) remaining-then:** **#8b** 3-scenario switcher (Vendor-ran-hot / tracked-market / thin-hold with LIVE-computed verdicts — needs build-time tone verification via MW.compute), #9 while-you-were-away re-read (note: #4 already made "since your last check" survive refresh — #9 is the more prominent welcome-back surface), #9 while-you-were-away re-read (uses the #4 ring's prior check on cold load), #10 power-user/⌘K, #11 Your Book dashboard (extend the existing `vb-book` rollup in renderJournalRail; earned-significance read + drill-to-source), **#12 remainder** (per-path chart stroke-draw via stroke-dashoffset keyframes gated on `data-animate`; native `document.startViewTransition` crossfade w/ view-transition-name on the gap number — both browser-specific, deferred), #13 shareable URL codec (hash-encoded, prices stay client-side; site.js has URL-state precedent), #14 PWA/offline + mobile finish (course/sw.js + course/manifest.webmanifest are the pattern to adapt), #15 craft capstone. Cadence: Build/Audit/Iterate with expert-specialist verify on honesty/security/complex items. All gated by the honest/on-device/no-backend moat; the 6 rejected patterns (cross-device sync, crowd-sourced vendor prices, server analytics, multiplayer, cloud TTS/PDF) stay rejected.

**Gov data-sources plan (NASS / Census / EIA) — 13-expert + 3-adversary panel synthesis, recorded in ADR-013.** All three were built-but-DORMANT (never pulled; shipped price history is 100% USDA-AMS/LMR/FRED/BLS/NOAA). Verdict: light up only the honest subset — nothing touches the measured tier or the Vendor Benchmark reference. Sequenced runbook + guardrails + open questions all in ADR-013.

**RUNBOOKS for the operator's Mac (keys + network — the container has neither):**
- Zero-code wins: `NASS_KEY=… EIA_KEY=… node scripts/fetch-pressure-observations.mjs --live` (cattle-on-feed placements = the one calibration-proven NASS lead; diesel driver labels).
- Census/EIA exotics: `EIA_KEY=… node scripts/fetch-cost-index-sources.mjs --live` (Census keyless), then `verify-cost-index-sources.mjs --flip` for coffee HS 090111 / cocoa HS 180100 (derived tier only).

**IN FLIGHT:** (a) **glyph design system** — a mono-line ingredient-card pictogram set, refined through a render→agent-reviews-the-pixels→redraw visual loop (harness `scratchpad/glyph-sheet.mjs` + headless Chromium proven). (b) ADR-013 build sequence: deseasonalization DONE, **per-commodity cold-storage gating DONE**, **EIA per-item diesel demotion DONE**. Remaining EIA sub-items (deferred; some need the live fetch): commercial electricity as a standalone `kind:'energy'` context trend; `energy-oils` driver renewable-diesel→soy-oil enrichment; the read-only diesel context line on Vendor Benchmark's wholesale-vs-delivered explanation (strictest guard — never a pass-through number, never the gap verdict). Then Census coffee/cocoa derived-tier flip (operator's live fetch).

**OPEN QUESTIONS carried (founder call — in ADR-013/014):** re-validate `cold-storage-pork` calibration after the deseasonalization patch (was computed on the raw path); build a NASS price-fetcher for feed drivers or keep FRED/BLS; vanilla publish-threshold; freight double-count (pressure `eia-diesel` vs the shipped FRED GASDESW).

**DEFERRED follow-ups from the cold-storage adversarial panel (non-blocking, logged so they aren't lost):**
- **Pork/butter cold-storage `lead:{4,8}` vs the coincident label.** The structured `lead` field is retained (the "pending more evidence" fetch/calibration hypothesis) while `coincident:true` now suppresses the public lead-lag phrasing. When the pork RAW-path re-validation lands, either set `lead`→coincident(~0) or document in-field why 4–8wk is retained. (The dispatch already renders correctly regardless.)
- **Two dated weekly dispatches** (`blog/cost-index-week-2026-06-1{1,8}/`) still render the pre-ADR-014 cold-storage "(4–8 week lead)" dairy framing. Panel read (concur): these are **dated, audio-free, point-in-time snapshots** that predate the ADR — leave them (rewriting a dated dispatch is revisionist, cuts against "dispatches are dated"). The *builder* is now fixed so all future dispatches are §4-compliant. Founder call if the two homepage-linked ones warrant an in-place `dateModified` rewrite.
- **/open/ descriptive wiring** for the orphaned cold-storage-cheese/poultry specs (now `_gate`-marked "descriptive-only") — a separate deliverable, not a blocker.

**DEFERRED forks from the EIA diesel-demotion design panel (non-blocking, founder-optional):**
- **Optional:** collapse the hub's per-page "Diesel / freight (dir)" echo (measured-layer `whyMovingBlock`, ~78 pages) into a single standing index-level line. The panel's call: LEAVE it — it already renders the ONE index-wide GASDESW direction with "moves alongside food costs, association not cause" framing, so it is honest, not a per-item computed arrow; collapsing is a cosmetic/UX preference that expands scope onto the measured tier. Founder call only if the per-page repetition reads as clutter.
- **5 deep-sea-freight-ONLY import items** (tuna-loin, whole-lobster, banana, pineapple, ginger) now rest on a lone ocean-freight signal (capped 'low' by the breadth floor). Kept — `deep-sea-freight` is a genuinely distinct verified ocean series and OUT of the diesel-scoped sub-item; a future call on whether a lone freight-family signal earns an overlay at all. (`sweet-potato→drought-ca-az` similarly carries a known region-fit weakness — NC storage crop vs a CA/AZ drought series — logged for calibration, not this change.)

**ADRs added this thread (all in `docs/editorial/decisions/`):** ADR-011 (events surface), ADR-012 (Vendor Benchmark market-context), ADR-013 (gov data-sources policy), ADR-014 (cold-storage deseasonalization).

---

## ⮕ CURRENT STATE (updated 2026-07-16)

### This session — "loops"-inspired loop-gap closes (founder directive)
The founder saw the viral "AI loops" explainers and asked what we could apply. Muntin is
already loop-native (CLAUDE.md + this board = Memory; the `check-*.mjs` gates + adversarial
sub-agent panels = Verifier; build→audit→iterate = the loop). The gaps were the half-open
loops — the "nobody tells you" boxes: Verifier, Stop-condition, Memory. Closing all four
(founder picked all):
- **[DONE] Product: re-vendor the market-prior snapshot** (`ba2e49a`, product repo). The
  vendored `apps/api/src/data/cost-index-snapshot.json` fails closed at 30d/point and was 2
  days from going dark. Re-ran `apps/api/scripts/vendor-cost-index.mjs` against the storefront's
  fresh fact-gated Cost Index (asOf 06-13..06-18 → 07-04..07-14; 24 slugs; every value verified
  a real transcription). Clock reset to ~2026-08-03.
- **[DONE] Product: gate the snapshot against silent staleness** (`cfca1f9`, product repo).
  New `scripts/check-cost-index-snapshot-fresh.mjs` (mirrors `check-subprocessor-freshness`) reds
  10 days before the cliff (STALE SOON) and hard-fails past it (DORMANT); 12-assertion self-test;
  wired into `ci.yml`. Turns a silent lapse loud. Full auto-refresh (cross-repo cron) is the
  follow-up fork (needs a storefront-read token — founder call).
- **[DONE] Storefront: truthful `check-all` verdict** — see the deploy-regen runbook below.
- **[Phase-1 BUILT to tsc/gate — staging-gated] Product: operator watch→flag→act loop.** Founder
  greenlit 2026-07-16: operator recipient · moderate ~$25/wk floor · implicit whole-catalog · weekly ·
  rate-of-change · email-only · opt-in default-off. **Decision of record: product ADR-010**
  (`Muntin-Invoice-Decoder/docs/ux/decisions/ADR-010-operator-cost-watch-digest.md`). Spec
  (`docs/plans/operator-watch-act-loop-spec.md`, `b3c4041`) + adversarially-verified impl blueprint
  (`docs/plans/costwatch-phase1-blueprint.md`, `6bc5bab`). **BUILT + verified (tsc/gates/tests):**
  `cost-watch-digest.ts` assemble + materiality (`9e01535`/`a0b0a81`/`f179e27`, 22-case suite);
  `cost-watch-impact.ts` the only new number, INCREMENTAL spend×Δ/(1+Δ), null=held (`cf0bad5`,
  6 tests); `cost-watch-scan.ts` I/O feeder, typechecks vs every real store sig (`5dbfea0`);
  `email.ts` render+send, copy-gates green, prints NO $ (`417a825`). **Impl adversarially audited
  (3-skeptic workflow) → 3 defects FIXED (`d7a7b1f`):** materiality now per-ITEM not per-row (dup-
  itemId hikes can't double-count a held move or show an item as both fired+held); the email splits
  `belowFloor` (measured, "under the $X line") vs `unmeasuredHeld` ("not measured yet") so it never
  asserts a magnitude for an unmeasured move; a measured $0 never fires. Scan's serial vendor-ask +
  dup-canonical refetch = LOW efficiency, deferred (correctness unaffected). **WIRING NOW BUILT
  end-to-end (tsc/gate/stub-tests; NOT runtime-verified — mechanical accountant-digest mirrors):**
  D1 subscription store + migration 0031 default-off + 7 stub tests (`f19dd43`); weekly cron
  `scheduled/cost-watch-digest.ts` (re-resolves the current owner) + index/wrangler `"0 15 * * 2"`
  10th slot (`8dac1d4`); opt-in route `/v1/cost-watch` GET/PUT (`8a9bae3`); scheduled file added to
  both copy gates. Whole cron→scan→digest→email→store→owner-resolver→audit path typechecks.
  **apps/web settings toggle BUILT** — `settings/notifications/cost-watch-client.tsx` (optimistic
  PUT + aria-live) + `page.tsx` section + `costWatchSettings` copy in EN+ES; opt-in default-off.
  **WIRING ADVERSARIALLY AUDITED (workflow) → 5 findings, all FIXED (`170b5f6`, product repo):**
  [MED] cron fail-soft gap — `resolveActiveOwnerEmail` was the one unguarded per-org await, so one
  org's D1 failure rejected `ctx.waitUntil` and aborted the batch; now try/catch → `failed`+continue,
  plus a `.catch` backstop on the outer run. [MED] route floor-wipe — an enabled-only PUT overwrote a
  custom floor to NULL; now an enabled-only toggle routes through `setEnabled` (preserves floor +
  owner_email), floor persisted only when present. [LOW] null/array/scalar body → 400 not 500. [LOW]
  opt-out on a non-subscriber is now a no-op (no disabled row). [LOW] web "saved→idle" timer held in a
  ref, cleared on re-toggle + unmount. Added a store test pinning setEnabled-preserves-floor.
  **REMAINING = staging + one optional launch item (need the founder/staging):** the 5 ADR-010 staging
  checks before enabling (impact end-to-end + floor calibration, null/held frequency, confirm 10th
  Workers cron slot, recipient re-resolve, Resend delivery + unsub toggle); + a signed one-click
  unsubscribe endpoint (the email currently links to the settings page, which works). Then Phase 0
  auto-refresh cron (needs the storefront-read token).

### This session (cont.) — next surface: Ledger cost-intelligence bricks
With cost-watch parked on the founder/staging, moved to the next autonomous surface: the grounded
**`Muntin-Invoice-Decoder/docs/ledger-cost-intelligence-upgrade-plan.md`** (items A–K, the sibling of
the E1–E15 catalog). State: the NOW bricks A/B/C are all at first-brick-done — **A confirmed already
shipped** (`22415549`, `reference()` carries `epCents`+`trend`+`verdict`; the plan just lacked the DONE
marker), B (`contract_price.py`) + C (`price_trend_pct`) done-unwired earlier.
- **[DONE — first brick, `4ccbf32`] Item D: fold buy-or-ride into `/reorder`.** The market-aware
  "buy ahead vs. ride it out" read lived one screen over under `/insights`; put it on the exact rows
  where the order is committed. `GET /v1/inventory/reorder` now fetches `recentPriceHikes` (7d) and
  attaches the E7 card (`buildBuyOrRideFromContext` + `resolveCostIndexTrend`) **only when a hike meets
  known days-of-cover** — every other row `buyOrRide: null`, never a guess. Honest degrade (no hike / no
  cover / null-or-stale trend → cover-only or nothing). Reuses the parity-locked pure engine + the
  `testCostIndexOverride` snapshot seam. Web `ReorderRow` gains an optional read-subset type (no render
  yet). Route test mirrors `buy-or-ride-route` (watch/buy-now by cover + 3 honesty holds); tsc (2
  baseline) + prettier clean; runs in CI. **Web render shipped (`310fbf5`) — item D is now end-to-end:**
  a calm one-line market read on the `/reorder` card, keyed by `tier` through EN+ES copy (the API
  headline is EN-only, so tier-keyed copy keeps the gated parity honest). Copy-grade + verboten +
  prettier clean; web tsc/build:cf/vitest run in CI, not the container. Optional later: thread the web
  user's locale into the reorder request to render the richer calibrated server headline directly.
- **[DONE — item A first consumer lit, `b0f0f286`] Plate Cost verdict hint.** Lit the first consumer of
  A's widened `reference()`: `plate-cost/cost-index-hint.js` now renders the calibrated buy/hold/watch
  verb next to the wholesale reference (attached to the Cost Index read, never the operator's price).
  Additive + fail-silent; verbs from `cost-verdict.js` (no new copy/fact); neutral styling (no green
  "prices fell" — one-directional honesty); cache-bust bumped EN+ES; lookup test pins the EN+ES verb
  contract (10/10). DOM render is browser-verified in the real env, not this container.
- **[DONE — item A second consumer, engine layer, `2c988fe3`] fair-price-gap marketTrend.**
  `fair-price-gap.assess()` now carries `marketTrend` ({pct,dir}|null) on every matched path (comparable,
  unit-mismatch, index-basis-no-level — direction is honest without a $-level), so a price gap reads WITH
  market context (above a rising vs falling reference). Node-verified: 3 new vectors, 13/13; cache-bust
  bumped EN+ES. Render in the Vendor Benchmark is the follow-on (its intricate localized verdict/focus/
  motion chrome wants a browser). **The node-verifiable ENGINE layer of "widen → consume" is now complete
  across both storefront consumers; every remaining stroke is a render (browser-verified).**
- **Next candidate bricks — each with a container caveat (a real fork, not an obvious default):** E
  (demo→Vendor Benchmark URL-fragment prefill; the "lands as comparable" acceptance is a browser hand-test
  we can't run here) · the B/C **Python wiring** (`off_contract`/`price_creep` capture + SOFT registration;
  needs `pytest` — installable — but the core-pipeline stakes + the corpus-calibration the plan itself
  requires make this better done on a full dev machine) · item F (`above_market`, gated on a Python
  hit-rate probe that needs a real line corpus) · more A consumers (`fair-price-gap.js`, the trend arrow,
  the no-dollar verdict path). **The cleanly-in-container-verifiable well is thinning — the remaining
  value increasingly needs a browser / pytest+DB / real corpus. Surface the fork; don't force a
  low-confidence brick.**

### Storefront (`potentially-profitable`) — v3 redesign COMPLETE + CERTIFIED
The app-grade v3 language (slate + electric-blue, tabular-mono data voice, muntin-grille-as-
structure, 6px hairline) is shipped site-wide and certified (full 258-gate run, 0 non-idem
regressions). All 4 founder-picked levers landed (type unification, radius→6px, hub polish,
tool-card layout) + newsletter de-solo + focus-glow fix (`03d8ebe00`, `--ring-focus` derives
from `--teal` via color-mix). The visible redesign is done. **Remaining = FOUNDER-LEVEL, SITE-
WIDE decisions (surface, don't do unattended):**
- (a) **Footer newsletter** — keep Don's gated first-person voice (current; `check-newsletter-copy`
  G.10 requires "when I publish something") or de-solo it too (→ update the gate).
- (b) **Off-scale raw-radii sweep** — remaining components on 10–14px vs the v3 6/8 scale;
  cosmetic churn with visible corner changes across many components (HELD for a look).
- (c) **Cost-Index money direction** (editorial) — elevated cost renders `--rust`, calm neutral,
  never a green "prices fell/good": deliberate one-directional honesty, or an unadopted gap?
- (d) A dedicated `--info` hue (today info-blue folds onto `--teal`) — match product `#3b68f5`
  or stay deeper editorial teal?
- (e) The **/window/** personal-access founder-fork (keep the human-access differentiator vs
  full company voice?).
- **Product/storefront token parity: CLEAN BILL** — the product Ledger's design language is the
  keeper (nothing regresses it); the deliberate divergences (accent fill `#2A50C8` vs `#3b68f5`;
  Fraunces display kept vs retired from product chrome) are documented + gated. KEEP.

### Cost Index as a data company — roadmap COMPLETE, loop CONVERGED
ADR-011 (events surface) · ADR-012 (Vendor Benchmark market-context) · ADR-013 (NASS/Census/EIA
policy) · ADR-014 (cold-storage deseasonalization) all shipped + gated. The Vendor Benchmark
"world-class" roadmap (15 items) and two recurring adversarial re-audits converged to nits.
Notable fix: the **seasonal nominal-drag** bug (live ingredient pages showed false level signals
off a 25yr-dragged median) → `WINDOW_YEARS=5` trailing-window normals (`build-seasonality.mjs`).
**Open (founder / operator-Mac):** re-validate `cold-storage-pork` calibration on the deseasonalized
path; NASS/EIA live-fetch sub-items (need the operator's Mac keys+network — the container has
neither); vanilla publish-threshold. Freight double-count RESOLVED (one live series = FRED GASDESW).

### Product Ledger (`Muntin-Invoice-Decoder`) — inventory landed; front door parked
- **Inventory Tier 0→3 landed** (PR #222, on `main`): `Beginning + Purchases − Ending = Usage`
  → real food cost; WAC + Cost-Index market-prior fallback (ADR-009); Tier-2 variance; Tier-3
  pars + days-of-cover; multi-location picker. Honesty spine: measured-beats-estimated, every
  estimate labeled + confidence-docked. **Merged ≠ shipped** (a prod OpenNext+Worker deploy is
  separate, unconfirmed from the container).
- **`/try` anonymous demo** BUILT + hardened + certified (product ADR-007), PARKED behind
  `DEMO_ANONYMOUS_EXTRACT`. **Single blocker to un-gate:** real top-~10 broadliner A/B layout
  pairs + header-glyph-variant seeding, then re-measure first-try F1 (Tier-1 PDF ≥ 0.90 held-out).
  Ops: Turnstile keys, NCMEC enrolment. Degrades safely to `/demo` until then.

---

## Runbooks (a fresh session needs these)

- **Container reverts mid-session (seen ≥3×).** Signature: HEAD drops to a stale checkout
  (demo commits, "Reach Don" back on the home, redesign cascade missing). **All pushed work is
  safe on origin.** Recover: `git fetch origin <branch> && git reset --hard origin/<branch>`
  (working tree is usually clean). **Rule: commit + push every increment BEFORE any slower audit
  — the push is the only durable artifact.**
- **`check-all` deploy-regen baseline — the "(idem)" set.** A partial container run of
  `node scripts/check-all.mjs` reds on ~25 of ~258 checks; **all are deploy-healed idempotency
  builders** (sitemap, OG cards, CSS cache-bust, site-counts, glossary/hub schema, RSS, H2
  anchors, theme/cuisine pages). They are NOT regressions — the real deploy runs the full build
  chain, which regenerates them, so its `check-all` exits 0. **Only count NEW reds.** As of
  2026-07-16 there's a truthful verdict tool: **`node scripts/check-all.mjs --baseline
  scripts/check-all-baseline.json`** partitions results and exits 0 on "zero NEW regressions"
  (reds only on an unexpected fail). The plain `check-all.mjs` (no flag) stays STRICT — that is
  the Cloudflare deploy gate; never weaken it. Add a new idem check to the baseline (dated reason)
  only if it's a deploy-healed builder; hard gates are denylisted and the tool refuses them.
  **As of 2026-07-16 the baseline'd run exits 1 on TWO items on purpose** — `Cost-index picker`
  (a stale `dollarRef` flag) + `Cost-index revisions sync` (readings moved on the 07-13/07-15
  reads): both are healed by the `cost-index-refresh` workflow (which rebuilds the picker + the
  revisions log), NOT by the standard deploy, and both flag SEMANTIC data drift, so they are
  deliberately kept OUT of the baseline (the tool surfacing them is the point). They clear on the
  next refresh run; do not hand-rebuild (calendar-sensitive).
- **Cost-Index pages: commit the SOURCE, not the generated pages.** `build-cost-index-pages.mjs`
  / `build-library.mjs` are NOT in the deploy chain; the `cost-index-refresh` workflow regenerates
  the 58/196 pages. Hand-regenerating a single page strips injected furniture — edit the committed
  page directly for a small change.
- **Edit `data/sourced-claims.json` → also `node scripts/build-claims-json.mjs` + commit
  `claims.json`.** The deploy build does NOT run it; a drift there is a real (non-idem) deploy red.
- **Cost-index refresh flows: do NOT run `sync-includes`** — the `_includes` footer template drifts
  vs live count sentinels and would regress them.
- **Product snapshot cadence:** re-run `node apps/api/scripts/vendor-cost-index.mjs` + commit on the
  storefront's weekly cost-index cadence; `check-cost-index-snapshot-fresh` now reds if you forget.

## ADR index

Storefront (`docs/editorial/decisions/`): ADR-010 (insight grammar) · ADR-011 (events surface) ·
ADR-012 (VB market-context) · ADR-013 (NASS/Census/EIA data-sources) · ADR-014 (cold-storage
deseasonalization). Product (`docs/ux/decisions/` + `docs/security/decisions/`): ADR-006 (count
sheet) · ADR-007 (/try anonymous demo) · ADR-008 (ingest status surface) · ADR-009 (valuation &
market prior).

## The singular vision (the thing everything ladders to)

muntin is the honest, privacy-first, operator-built, **modular** restaurant
cost-intelligence company — Cost Index + free tools + Muntin Ledger (invoice
decode, inventory, Plate). Pre-release toward GA (Ledger 2026-11-13). The moat is
**trust vs. conflicted incumbents**. Brand line: **"Modern tools. Old-fashioned
honest."** — earned in the code (deterministic, no-LLM in the customer-data path,
private, your data is yours).

## Operating mode

Cadence: **ground → build → audit → iterate**, run as a quiet subscript (not a
ceremony). Lean. Dispatch heavy reads/builds to sub-agents to preserve context.
Record decisions as ADRs (open decision logs). Commit increments to the dev branch
(reviewable); **no PR without an explicit ask**. Surface only genuine forks.
Don't loosen gates. Fact gate is absolute (it's spoken aloud in EN+ES).

## Parked decisions / locked lockups

- **EN lockup (locked):** "Modern tools. Old-fashioned honest." / subhead "The cost sense the big players have — sourced, private, and on your side." Lives on the OG cards. **Deliberately NOT forced into the homepage H1** — that H1 is already a strong specific-value hero ("Know what every plate costs before the week eats the margin.").
- **ES tagline (locked):** "Herramientas modernas. Honradez de toda la vida." (on `home-es`).
- **Product sibling line:** default **"No black box."** (Register B) — recorded, not yet applied (product hero already strong/gate-clean; apply only if desired).
- **Enrichment ADRs 005–009:** PROPOSAL status. Shipped: gate amendment + pilot. Remaining: image kinds (photo/scan/render) + ADR-008 provenance gate + more pilots; then ratify.
- **Visual Tier-3 aesthetic** (Golden Hour / focus modules): **recommended SKIP** — the system is already gold-standard; restraint.

## Older open threads (detail in the archive)

- **A — Muntin Plate emergent-insight catalog** (`docs/plans/muntin-plate-insight-catalog.md`,
  E1–E15 ranked; ADR-010 + E14 shipped). Thread is "pick the next entry to BUILD." Its grounded
  product-side sibling is `Muntin-Invoice-Decoder/docs/ledger-cost-intelligence-upgrade-plan.md`
  (items A–K; A/B/C first-brick done, **D shipped this session** — see CURRENT STATE above).
- **B — vertical generality** (product): the "any small business" claim is live in marketing while
  every code path is restaurant-hardcoded — an honesty gap to either EARN (non-restaurant fixtures
  + a vertical selector) or SOFTEN (copy).
- **C — social pre-launch** — blocked on the founder's Instagram revive-vs-fresh decision.

## Gotchas (save a future session the rediscovery)

- **`check-all` baseline (current):** ~25 of ~258 checks fail on a partial container run — ALL
  deploy-regenerated idempotency builders (sitemap, OG cards, CSS cache-bust, site-counts,
  glossary/hub schema, RSS, H2 anchors, theme/cuisine pages). NOT your failures — only count NEW
  ones, or run `check-all.mjs --baseline scripts/check-all-baseline.json` for the truthful verdict.
- **OG cards render locally** via `@resvg/resvg-js` at `/tmp/og-render-deps` (no `rsvg-convert`); committed PNGs can be `Read` to see/verify a card. Build one: `node scripts/build-og-cards.mjs <slug>`.
- **es-MX voice gates (product)** are strict: no `inteligencia artificial`, `sin esfuerzo`, regressive tone, or "no AI" — describe the *mechanism* ("never a language model") instead.
- "The window in." is **sanctioned brand equity** (the muntin/window metaphor), not stale — keep it.
- **Derived committed content must never scrape ephemeral injector regions.** An injector that reads a page to build permanent output (JSON-LD `ItemList`, normalized snapshots) must exclude the regions later injectors rewrite at build time — the **batch-banner** (`inject-batch-banner.mjs`, hides an expired promo), perf-critical CSS, lazy-load. Two instances bit us: the topic-page `ItemList` scraping the banner's `/blog/` link (PR #488, fixed at `inject-topic-page-schema.mjs:40`) and the theme/cuisine `--check` normalizer not stripping the feed-discovery block (PR #504). Symptom is always the same: a silent end-of-build idempotency `--check` drift when the ephemeral region changes.
- **Standalone page-generator reruns STRIP injected furniture.** `build-cost-index-pages.mjs` / `build-library.mjs` are NOT in the deploy chain; committed pages carry furniture added by later injectors (the WebPage/speakable JSON-LD node, css cache-bust hashes). Regenerating a single page by hand drops that furniture + resets hashes. For a small surgical change (e.g. removing one cross-link), **edit the committed page directly** rather than regenerate — regeneration is only safe as the full cron sequence (generate → sync-includes → inject-* → scoped commit). Verified on the 06-27 poblano attempt.
