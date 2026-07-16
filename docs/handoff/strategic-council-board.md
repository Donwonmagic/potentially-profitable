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

**Branches.** This session develops on `claude/strategic-council-board-docs-g9yuen` (both repos,
fresh from `main`). Prior council branches are all merged to `main` and closed: storefront
`-exsghc` (#520), `-m3w6dy` (#521), `-rqdehe` (#489), `-fzdd1j`; product `-fzdd1j` (#239),
inventory `-b4ze1p` (#243), earlier `#222`/#234–#239. Restart a branch from latest `main` if a
merged PR needs follow-up (never stack new commits on merged history).

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
  dup-canonical refetch = LOW efficiency, deferred (correctness unaffected). **NOT built — staging-gated
  (mechanical accountant-digest mirrors whose only real verification is a staging DB/Resend run;
  fully specified in blueprint §5/§6):** weekly cron (`scheduled/cost-watch-digest.ts` + index/
  wrangler), D1 `cost_watch_subscriptions` store + migration 0031 (default-off), opt-in route.
  **Before the flag flips on:** the 5 staging checks in ADR-010's walk receipt (impact end-to-end,
  null/held frequency, 10th cron slot, recipient re-resolve, Resend delivery). Then Phase 0 full
  auto-refresh cron (needs the storefront-read token).

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
  E1–E15 ranked; ADR-010 + E14 shipped). Thread is "pick the next entry to BUILD."
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
