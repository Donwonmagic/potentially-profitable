<!-- Orchestrator resume point. Committed so any future session (yours or mine)
     can pick up the queue without the founder re-explaining anything. -->

# Strategic-council board — resume here

**What this is:** the running state of the "strategic council / orchestrator" work,
externalized so a fresh session can resume in one read. The environment is
ephemeral and a new session does not remember the prior chat — only what's in the
repo survives. Update this file as threads move.

**Branches:** both repos develop on `claude/muntin-strategic-council-exsghc`
(storefront `potentially-profitable`, product `Muntin-Invoice-Decoder`). Prior
council branches `-rqdehe` (PR #489) and `-fzdd1j` (PRs #493–#503 storefront,
#234–#239 product) are merged to main and closed.

## ⮕ CURRENT STATE — AUTONOMOUS REDESIGN RUN (updated 2026-07-11)

**Founder directive:** "Fold both plans together. Execute the entirety of the redesign as I sleep,
build → audit → iterate, frequently, all the way through." Macro-first. → **`docs/handoff/redesign-execution-plan.md`
is the execution spine** (folds the reinvention master plan + the locked macro design direction from
the flagship prototype). Autonomous run: one increment → adversarial/expert audit → iterate → commit+push →
update this block → continue.

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

## ⮕ CURRENT STATE — read this first (updated 2026-07-09)

### 🔴 TWO LIVE REDS ON MAIN — **both have fixes on `-exsghc`, UNMERGED (updated 2026-07-10)**

A fresh storefront session (branch `-rqdehe`, reset onto main) reconstructed state and
verified two independent reds on main. **Both are real, NOT the self-healing "(idem)"
deploy-regeneration class.** As of 2026-07-10 both fixes sit on the
`claude/muntin-strategic-council-exsghc` dev branch, pushed and gate-verified — **merging
that branch clears both reds.** RED #1's fix = the calibration re-stamp as the refresh
build's final action (found independently by the `-exsghc` lane on 07-09, same diagnosis).
RED #2's fix = the "companion tools" line (Cost Pulse + plate-cost) added to the frozen
07-06 weekly's Go-deeper list AND to both generator templates (weekly `goDeeperBlock` +
monthly methodology block in `build-cost-index-dispatch.mjs`) so no future emit can
reproduce it — guardrails now 98/98. Original findings kept below for the record.

**RED #3 — the REAL Cloudflare deploy blocker (found 2026-07-10 from PR #513's Workers
build log, fixed same session).** The Workers "muntin-digital" check was red — NOT a
build-infra glitch (initial hypothesis, wrong). The deploy runs the full build chain then
`check-all.mjs`, which exited 1 on its single non-idem failure: **`claims.json` out of
sync with `data/sourced-claims.json`**. The per-location pricing edit to the
`ledger_founding_offer_2026` claim never regenerated the public `claims.json`, and the
deploy build chain does NOT run `build-claims-json.mjs` (same non-self-healing class as
RED #2). Fixed: rebuilt `claims.json` (as_of 07-02→07-09, "$19 a month per location",
used_in += demo paths), committed `d04cf4f44`. `build-claims-json.mjs --check` in sync;
full suite now 0 non-idem reds. **Lesson for a fresh session:** whenever you edit
`data/sourced-claims.json`, also run `node scripts/build-claims-json.mjs` and commit
`claims.json` — the deploy won't do it for you.

**RED #1 — the MWF Cost Index heartbeat is FROZEN at the 2026-07-06 read.**
The 07-08 Wed refresh (`cost-index-refresh.yml` run #34, 2026-07-08T15:08Z, `schedule`)
**failed and committed nothing** — last data commit is still `9239d1ac` (07-06). Cause (from
run #34's job logs): the fresh read moved the calibration numbers, and
`inject-cost-index-calibration.mjs --check` found the methodology-page sentinels stale
(`✗ cost-index/methodology/index.html calibration sentinels are stale`, EN+ES → exit 1). The
workflow runs that injector in write mode (`cost-index-refresh.yml:141`) before the `--check`
(`:175`), so this is an **ordering bug** — a step between L141 and L175 re-emits the methodology
pages and drops the fresh sentinels. RECURRENCE of the #504 "calibration sentinels can't
self-heal" class. **Fix:** move/duplicate the calibration inject to run AFTER the final
methodology page-gen and before the `--check`, and stage `cost-index/methodology/index.html` +
`es/…`. Verify by reproducing the refresh's rebuild order locally. Until fixed, every MWF run
re-freezes.

**RED #2 — the next Workers deploy will fail on `check-content-guardrails`.**
`blog/cost-index-week-2026-07-06/index.html` has exactly **1** `/tools/<slug>/` link
(`/tools/cost-pulse/`); the gate (`check-content-guardrails.mjs:87`) requires **≥2**. Every
other link is `/cost-index/*`, which the matcher doesn't count. **Verified non-self-healing:**
the deploy build's CTA injectors (post-end-cta, smart-next, ledger-cta) leave it at 1. On main's
frozen tree this is the ONLY non-idem red, so a `wrangler` build of the next merge fails here
(same failure mode as #489). **Fix:** durably in the dispatch generator (so the first Aug monthly
edition can't reproduce it) AND a direct 2nd honest `/tools/` link on the frozen 07-06 weekly
(historical — cadence is monthly now — so a direct edit won't be clobbered). **RISK TO CONFIRM:**
if #2 has been red since ~07-06, Cloudflare Workers deploys may have been failing that whole time
→ the ledger-demo work (#505–508) may NOT be live. Cloudflare deploy status isn't visible from
the session; confirm.

**Recommended order:** fix #1 (unfreeze the heartbeat) → fix #2 (unblock the deploy) → resume the
July Monthly Dispatch edition build. Open PR **#501** (yn273q, Open-data `/open/`) still needs
triage. The 07-09 storefront catch-up itself was read-only (this board note is its only commit,
via PR #511 → superseded by this integrated version); develop on `-rqdehe`, author config
`Claude <noreply@anthropic.com>`.

### 🟣 SESSION 2026-07-09 (product repo, branch `claude/muntin-strategic-council-fzdd1j`) — `/try` demo finished + reliability roadmap closed

**⚠ Branch note:** this session was pinned to `-fzdd1j` (per its task config); its
product work merged to main via **PR #239** (Ledger) and the branch now sits at
latest main. The board's "active branch is `-exsghc`" line above predates this —
these two council branches ran concurrently. Nothing is lost; `-fzdd1j`'s work is
on main. Reconcile the branch name next session if the founder wants one lane.

**The arc (all on main via #239):** completed the first-try reliability roadmap AND
built + hardened + visually elevated the anonymous `/try` demo. Recorded as
**product ADR-007** (`docs/ux/decisions/ADR-007-try-anonymous-demo-and-gating.md`).

  - **Reliability roadmap COMPLETE** (`docs/plans/first-try-reliability-roadmap.md`):
    community column-rule pool Slices 1–6 (row-invariant `column_v2`, community
    confidence band, column-fan apply, held-out lift gate, pool-aware drift +
    supersession + distinct-org demote-back trigger), the first-try lift corpus, and
    the **OCR-noise measurement layer**. All adversarially verified.
  - **`/try` BUILT + hardened + ELEVATED:** deterministic live read (no LLM, no
    persistence — both CI-gated), animated read pipeline, ReadReceiptRail, "$X off"
    catch-as-hero, honest cause inference (`catch-cause.ts`), founding-list capture on
    every branch, phone-photo downscale, reactive Turnstile. Then a 9-agent design
    workflow re-skinned it to the **precision-instrument** language (mono tabular
    numerics, hairline grid, one blue accent, triple-encoded confidence, count-up
    total) — verified via Playwright across idle/reading/clean/catch in light+dark.
    Gate-green: tsc, next build, 111 vitest, focus-discipline, demo-no-persistence,
    locale-parity.

**⮕ WHAT'S LEFT before the demo can take a real invoice and reliably produce results
(i.e. flip `DEMO_ANONYMOUS_EXTRACT` on):** exactly ONE accuracy gate, plus ops.
  - **Gate (a) — real-invoice coverage.** The pool match is robust to value /
    positional / header case+whitespace noise but **breaks on header GLYPH
    corruption**. So un-gating requires (i) the actual top-~10 broadliner layouts
    (Sysco, US Foods, PFG, GFS…) as real reference-A + held-out-B pairs run through
    production docling, and (ii) **seeding header glyph-variants per column** (not one
    spelling), then a re-measured blended first-try F1 (Tier-1 PDF ≥ 0.90 held-out).
    The synthetic corpus proves the mechanism + names this requirement; it does not
    supply real invoices. **This is the single blocker.** Until it clears, `/try`
    degrades safely to the guided `/demo` sample (503 `fallback:"static"`), so the
    surface is already shippable at full craft.
  - **Ops (independent of gate a):** provision Turnstile keys
    (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + server secret); NCMEC enrolment before public
    promotion of an anonymous upload endpoint; decide the demo↔pool fork (roadmap
    §5.10 / Q7 — recommended: read-only pool exception for `demo:anon`).

**Bold-launch opener (founder asked "get people excited in a unique, bold way"):** the
precision-instrument surface is the vehicle; the missing spark is the LIVE own-invoice
read, which is exactly what gate (a) unlocks. Recommended sequence to a confident public
launch: author 2–3 real Tier-1 A/B pairs first (Sysco + US Foods cover the largest
first-upload slice) → re-measure F1 → flip the flag for those layouts → THEN promote.
Everything else (design, honesty architecture, capture, hardening) is done.

### 🟢 ACTIVE BUILD — updated 2026-07-09 (read ADRs 011/012/013 — all founder-signed)

**Governing decisions now in `docs/editorial/decisions/`:** ADR-011 (monthly first-Tuesday
dispatch + Mon/Wed/Fri refresh, edition slug `cost-index-YYYY-MM`), ADR-012 (**manual
authorship** — no cron, no generated posts; hand-written editions; dispatch workflow is
the manual EMAIL button only; refresh catch-up = red reminder at 38d; full publish
runbook inside), ADR-013 ($19/mo **per location**; **enterprise parked** post-GA, gated
on founding-list demand). ADR-010 carries the ratified one-print extension (site only).

**Merged to main (PRs #505/#507/#508):** cadence pivot + promise sweep; email P0 honesty
fixes + trust rails (golden render `data/email-preview/` + `check-cost-index-email.mjs`);
the ledger demo transformation (rule-true numbers ON BOTH the demo AND the /ledger/ hero
— the old $3.55 flag never fired `computePriceHike`; now $24.10/$24.35/$29.45 = +$5.23/
+21.6% over the $24.22 median everywhere, byte-verified); 3 review rounds + certification.

**On the dev branch, pushed, UNMERGED (founder: merge to resume the heartbeat):**
  - **Refresh fix (URGENT):** first MWF cron (07-08) vendored fresh data then failed the
    gates on stale calibration sentinels (fresh-data-only ordering; frozen-data testing
    can't reproduce). Fix = re-stamp `inject-cost-index-calibration` as the build's last
    action. **Heartbeat is stalled at the 2026-07-06 read until merged** — next cron
    Fri 07-10 13:00 UTC, or founder runs the workflow manually post-merge.
  - Per-location pricing on all surfaces + registered claim (ADR-013).
  - Monthly edition machinery (generator monthly-default, `.viz-spark` family + canon
    §8 + test fixtures, dispatch-fresh recognizes both slug families) — kept as dormant
    tooling per ADR-012; the generated July draft itself was deleted.
  - Manual-authorship pivot (both workflows per ADR-012).
  - **Demo app frame** (founder design direction: fixed stage, in-frame cross-fade,
    page height headless-verified constant): chrome strip + stage + control bar; step 3
    two-column; step 4 full-ink ask; per-location terms; EN+ES.
  - **RED #2 fix** (guardrails ≥2 tools links): companion-tools line on the frozen
    07-06 weekly + both generator templates. **July edition full-suite fixes:** TL;DR
    window (jump nav moved below In-short), intent=watch param dropped (plate-cost
    doesn't consume intents), viz-spark moved INTO the site.css partition (site-article
    .css is a GENERATED shell — never append to it directly) + shells rebuilt. Full
    check-all on the branch: 225/249, every remaining red is the (idem) baseline.

**FINAL DEMO CERTIFICATION — 2026-07-10 (run wf_cd93a13f-162, 5 fresh seats, honest record):**
All 5 seats `wouldShipToFortune500: true`. Verdicts: interaction-design **WORLD_CLASS**
(8.5/9/9); motion-design STRONG (8/8.5/9); copy-voice STRONG (9/8.5/8); frontend-eng
STRONG (9/8.5/9); chef-owner STRONG (9/8.5/9). The founder's page-height law verified
constant at every viewport/locale/scheme; deep-link, no-JS, PRM, quick-path all measured
correct. Post-cert fixes applied same day (commit ce629a5d7): banned-word + royal-we
canon violations (EN+ES), dark-mode ink moment restored (#0F1116 band vs #1B1E24
panels — the override had made them identical), desktop stage min 480→430 (short-laptop
control-bar clip 688.7→649.7 at 650svh; ≥690px unchanged). Headless re-verified ×6.

**Certification findings PARKED (recorded honestly, none blocks ship):**
  - **The one real design tension (founder fork):** at 1280×800 every step scrolls
    internally (52–127px hidden; stage 592 vs panels ≤719) and on phones >half of each
    step sits below the in-panel fold incl. the flag chart (step 3 hides 528px). This
    is inherent to fixed-stage + current content volume: the forks are (a) accept
    in-panel scroll as the app idiom (cues are honest and working), (b) trim step copy,
    or (c) shorten the marquee figures. Do NOT silently trim certified copy.
  - Smaller parked items: 3px frame-under-nav on desktop deep-link (nav renders 103px
    vs 100px offset budget — fixing it cascades through the pixel-exact reservation
    math in 2 files ×2 locales; left alone deliberately); keyboard-only users can't
    scroll overflowing panels (WCAG 2.1.1 edge — panels tabIndex −1); overflow cue not
    recomputed on resize/orientation; ~80ms stage dim on triple-click Next; 35px rail
    touch targets on mobile; mobile fade cue dims the flagged Jun 26 payoff row;
    step-4 left-column dead zone at desktop; aria-current on li not the link; ES step-4
    60px overflow at 1280×800 where EN fits; em-dash pairs vs sentence-shape rule 3.
  - **CTA canon fork (founder):** demo uses 'Run your own line' + 'Join the founding
    list' — both absent from the locked CTA canon (/methods/ #voice-contract). Seats
    rate the labels better than the canon's 'Try it free' for these jobs. Either add a
    canon v1.2 entry sanctioning them or conform the labels — founder's call, the canon
    is his governing doc. Related: '/ledger/' itself still says 'without us' (same
    royal-we idiom fixed on the demo); one-line fix pending the same call.
  - Stale '19 weeks out' count (formula says 18) — self-heals on next deploy build.

**Completed workflows (payloads in session transcripts):** `july-edition-product`
(wf_56eb545c-4ca — the July edition, built + audited + full-suite green);
`demo-world-class-pass` (wf_a2da5e7b-bcc — rounds 1–2 + closing pass);
`demo-final-certification` (wf_cd93a13f-162 — the record above).

**Parked / follow-ups:** demo OG card; `Demo Exit` analytics registry entry (product
repo `tools/_shared/analytics.js`); `.ld-wrap` 880px cap overridden by `.container`
(pre-existing, founder call); /ledger/ meta "six-month history" mentions; product repo:
3 failing nightlies (real failures, untriaged) + the 4 CI fixes still unmerged on its
dev branch (no PR without ask); ES edition decision for monthly dispatches; email P1
body due before 2026-08-04.

**Cadence truths a fresh session must know:** refresh = Mon/Wed/Fri 13:00 UTC from
main; dispatch cron REMOVED (ADR-012); the 38d dispatch-fresh gate is the publication
reminder; subscriber promise = "one email a month — the first Tuesday" (the editorial
deadline for hand-publishing).

### ✅ P0 OUTAGE RESOLVED 2026-07-06 — was: GitHub Actions dead ACCOUNT-WIDE since 2026-06-20

**Finding (session 2026-07-06, fully verified via the Actions API):** every GitHub
Actions job across BOTH repos has been refused a runner since 2026-06-20. Jobs
die in 2–4 s with `runner_id: 0`, no logs (404), no annotations — the signature
of a **billing lock** ("recent account payments have failed or your spending
limit needs to be increased"), NOT a code problem. All workflow YAML in both
repos validated clean (incl. duplicate-key check). Only the founder can fix it:
**GitHub → Settings → Billing and plans → check payment method / spending
limit.** Evidence:

  - `cost-index-refresh.yml`: last success run #13 **2026-06-19**; runs #14–#30
    (06-20 → 07-06) ALL failed pre-execution. Cost Pressure refresh: same.
  - `cost-index-dispatch.yml` (weekly subscriber email): run #1 (06-16) is the
    ONLY email ever delivered; #2 (06-23) and #3 (06-30) refused runners.
  - Storefront PR checks (Playwright / Lighthouse / axe) also get no runner —
    job-level failure in ~3 s even where the run-level rollup shows "success".
  - Product repo (private): `ci.yml` last executed **2026-06-19**. Every
    push/schedule run since 06-20 is a `startup_failure` attributed to a phantom
    deleted workflow (id 299264922, path "BuildFailed", created 06-20 04:37 ET).

**Impact (compounds daily):**
  1. **Live Cost Index data is frozen at the 2026-06-19 read** (last data commit
     `d2b598e88`). The daily-heartbeat promise ("level ≤1 day old") has been
     broken for 17 days. The 06-27 poblano and 07-03 pumpkin commits were HAND
     -fixes aging out points that the frozen data pushed past the stale gates —
     each passing calendar day risks another ingredient aging out and blocking
     Workers deploys of ANY merge.
  2. Weekly dispatch subscribers have received exactly one email, three weeks ago.
  3. Product PRs #234–#239 (fraud detectors, PII scrub, community pool, /try)
     merged with ZERO GitHub CI executed — the no-llm gate, privacy gates,
     vitest/golden suites ran only inside dev sessions. The "enforced in CI"
     trust claim on /ai + /never has not actually executed since 06-19.

**Recovery status (2026-07-06 ~17:05 UTC): billing UNBLOCKED** — founder paid;
runners returned instantly (probe: product CI run #1969 executed, first real CI
since 06-19). Founder's first refresh dispatch was cancelled cleanly (nothing
committed) pending ingredient-coverage confirmation. Grounded answer: the
roster (`data/cost-index-sources.json`) is unchanged since 06-16 — the batch-1
12 high-traffic ingredients are in it, the fetch iterates the roster on the
run's own ref, and below-bar newcomers graduate to the seed/pages automatically
via the shippable-bar gate. **But the pause caught a real wiring gap:** PR #490/
#500 added five committed live-data-derived artifacts + sync gates while the
heartbeat was dead (`cost-lockfloat.json/.js`, `cost-index-audit.json`,
`cost-index-calibration-report.json` + methodology sentinels,
`cost-forecast-backtest.json`, provenance `cost-index/sources.json`) — none
rebuilt/staged by the refresh workflow, so the FIRST post-freeze refresh would
have left every one drifted → red `--check` gates on all subsequent sessions.
**Patched on this branch** (cost-index-refresh.yml): rebuild steps in dependency
order, pre-commit `--check` re-derivation, the new honesty gates (basis-leak,
shippable-bar, seasonal-band, band-coverage, trend-skill) run before commit, and
the artifacts added to the scoped `git add`. Validated on frozen data: all six
write-mode runs byte-identical, all 11 gates pass.

**MERGED 2026-07-06 ~18:35 UTC as PR #504 (`c0e8e417d`) — Workers deploy green
(check-all 246/246).** The evening's additional findings, all fixed in the PR:
  - **Second artifact family** was also un-wired (embeds, `cost-index/feed.json`,
    revisions log, reproduce stamp, both confidence reports, speakable stamps) —
    now rebuilt + `--check`-gated + staged by the refresh workflow.
  - **Run #33's silent catch-up skip root-caused:** one unmatched pathspec
    (`es/blog/cost-index-week-*/`, generator writes EN only) voids the entire
    `git add`; `2>/dev/null || true` swallowed it. Both refresh + dispatch
    workflows now stage per-pathspec. Catch-up week 2026-07-06 published
    (basket −5.0%, 24/81 above baseline; dispatch lag 0d).
  - **`build-blog-index.mjs` ran in NO workflow** (dispatch's comment claimed it
    did) — weekly posts were invisible on /blog/ without a manual rerun. Added
    to both workflows.
  - **Footer-count landmine:** `_includes/footer.html` still said 13 tools/150
    terms (truth 5/171); the injector skipped `_includes`, so every
    sync-includes re-smeared stale counts sitewide. Injector now stamps the
    partials too (gate tightened); partial healed same commit.
  - **lhci had NEVER actually run since `44d64cc74`** (three deleted retired-
    tool scripts still in its build chain killed it at step 3; then its URL
    list gated retired pages → 404 crash). Dead calls removed, URLs swapped to
    living funnel equivalents (/tools/margin-math/, /cost-index/ + ES). It now
    measures real surfaces — first honest numbers may be red (advisory-only,
    `continue-on-error`).
  - **Rebase-staleness lesson:** artifacts stamped pre-rebase (calibration
    sentinels on the methodology pages) went stale when the bot's daily-read
    commit moved the report JSON — reproduced 245/246 locally via the deploy
    chain, restamped. The deploy chain does NOT re-run
    `inject-cost-index-calibration.mjs`, so this class can't self-heal.

Branch restarted from main post-merge (same name, merged-PR rule). Remaining
watch items: **07-07 13:00 UTC refresh cron** (first cron on the patched
workflow) and **07-07 ~16:20 UTC dispatch cron** (first subscriber email since
06-16 — post already current, so it should just send); confirm phantom
"BuildFailed" runs stopped on the product repo's next main push; then the
/status/ freshness-note honesty call (founder's if publicly visible).

### Delta — glossary + audio lane (branch `claude/compassionate-dirac-rdkw22`, work 2026-06-26/27, recorded 2026-07-09)

A **parallel lane** (separate from the council branch family) shipped + merged to main. Recording it here so the council lane and any fresh session know it happened and don't re-do or contradict it. All verified live on main `a0577ca3`.

- **Cost Data & Sources glossary class — SHIPPED (PR #488, merged).** A **9th glossary topic** (`learn/topics/cost-data/` + ES) tying the glossary to the Cost Index's own sources + methodology: **19 bespoke terms, EN+ES** — 9 source agencies (BLS, USDA Market News, USDA-LMR, USDA-Dairy/NDPSR, FRED, EIA, NOAA Fisheries **+ FDA and CME as honest negatives** — "safety not price", "futures not your invoice") and 10 methodology concepts (measured/derived/absent, price-confidence, shippable-bar, prediction-band, calibration, ratio-bridge, freshness, pressure-overlay, revisions, assessed-benchmark). Each term: a **bespoke page built by a per-term specialist (NOT a template)**, DefinedTerm+Article+FAQPage schema, a FAQ (+ a People-Also-Ask 4th question on each methodology term), a bespoke OG card (added a `source` glyph + AKA auto-fit to `build-og-cards.mjs`/`seed-glossary-og.mjs`), a Cost Pulse tie. SEO/AEO pass over all 19 (`data/glossary-seo.json`); 90-second explainers for 4 methodology terms (`data/glossary-explainers/`); the methodology-source sentence, the Cost Pulse lede, and **164 ingredient-page source lines** now link the term pages. Grounded to `methodology.json`/`sources.json`/`calibration.json` (band 80%→84%, calibration 48/51/58); zero inventions. This is the source of the **171 glossary terms / 9 topics** count referenced above.

- **Topic-page-schema idempotency fix — SHIPPED (PR #488, merged).** `check-all`'s "Topic page schema (idem)" went red the day the Father's-Day batch banner expired. Root cause: `listTopicArticles` (`inject-topic-page-schema.mjs`) scraped **every** `/blog/` href on the topic page — including the rotating batch-banner promo link — so the permanent JSON-LD `ItemList` was seeded from ephemeral content; because `inject-batch-banner.mjs` runs **after** the schema writer in the deploy chain and hid the expired banner, the end-of-build `--check` recomputed a shorter list → 14-page drift, blocking Workers deploys of any merge. **Fix (live at `inject-topic-page-schema.mjs:40`):** strip the `<!-- batch-banner:start -->…end -->` region before scraping, so the ItemList reflects the article cluster only. Same class of bug as the theme/cuisine-generator normalizer miss (PR #504) — see the new gotcha below.

- **Audio render batch — MERGED (PR #491).** The Colab's accumulated per-article blog+library listen-along `audio.json` + MP3 siblings (64 files).

- **Poblano hand-fix in PR #491 was REDUNDANT — superseded, correctly discarded.** This lane independently prepared a full *removal* of poblano when the 120-day level-staleness gate tripped (06-26). On rebase we found the council lane had already landed the **canonical fix** (`9239e0fe5` — age out to *expanding-coverage*: drop the 5 stale points, KEEP the 26-entry history + page) **plus the durable root-cause guard** (`buildCompositeInput` `levelEligible` at `tools/_shared/cost-index-sources.js:287` — a dead terminal feeds trend but never anchors/date-stamps the level). Adopted main's version wholesale; PR #491 reduced to the audio batch only. **No poblano action outstanding** — and note for the record: the heartbeat stall behind it was the **GitHub-Actions billing lock** (§"P0 OUTAGE RESOLVED 2026-07-06"), NOT a source-API-key issue.

### Delta 2026-06-28 → 07-06 (merged to main; board was stale for this window)

Storefront (PRs #490, #493–#500, #502–#503):
  - **Naming fork #5 partially RESOLVED:** "Cost Pulse" folded into the **Cost
    Index** brand (`78c8654a1`); "Muntin Bench" renamed **Vendor Benchmark**
    (`51d1e2edb`); OG cards re-arted. (Ledger split still off-site by design.)
  - **Ingredient card redesigned answer-first** + then-vs-now two-invoice-dates
    comparator on a new multi-year deep-history seed (PR #493).
  - **Bolder/premium design pass** sitewide EN+ES (PR #495; brief in
    `docs/handoff-bolder-pass.md`): /ledger/ goldenhour hero + ink pricing band,
    homepage "Receipts, not promises" stances, tools-hub "instruments at rest",
    footer trust column, founding-capture band.
  - **Own-invoice demo route CLOSED sitewide** → `/ledger/demo/` guided mockup
    walkthrough (EN+ES) ending in "run your own line" → live Vendor Benchmark.
  - **Vendor Benchmark rebuilt ground-up** Phases 1–2 (PRs #497/#498): market-
    window engine + honest chart layer; Price Journal (device-local compounding
    log), forecast + regime-break layer, whole-book worklist.
  - **Honesty-remediation wave** (PR #490 + #500): new fail-CI gates
    `check-cost-index-basis-leak.mjs` + `check-lockfloat-copy.mjs`; conformal
    coverage de-circularized; per-item null gate w/ Benjamini–Yekutieli; per-item
    provenance receipts; cross-repo conformal golden-vector parity lock.
  - **Lock-or-float reframe** on the live tool (PR #500): Lock Sheet (committed
    artifact + drift gate), Lock Book, Menu Cushion, contract checker, Backtest
    Replay, Ledger bridge.
  - **New library article** end-to-end in a day: beef-prices EN + native ES +
    EN audio (PRs #499/#502/#503). Ledger SoftwareApplication+Offer ($19/mo)
    JSON-LD EN+ES — first structured-data claim of the paid product.

Product (PRs #234–#239):
  - **cost-alerts comparability gate** — never accuse a vendor on a category
    error; proxy-quality registry (PR #234).
  - **PII-scrub donation disclosure** (5 adversarial rounds) + anonymous-demo
    no-persistence covenant promoted to a CI gate (PR #235).
  - **5 fraud/integrity detectors** wired into extract() w/ EN+es-MX reason
    copy + reason→safety-chip CI exhaustiveness gate (PR #235).
  - **Read Receipt trust rail** Phase 3 (cost + "safe to pay?" segments; binding
    cognitive-load canon) (PR #235).
  - **Community column-rule pool Slices 1–6 complete** (held-out lift gate,
    supersession + distinct-org demote-back, migrations 0056/0057). OCR-noise
    corpus isolated the one remaining un-park gate for /try: header glyph-variant
    seeding + real top-~10 broadliner layouts, then re-measure first-try F1.
  - **/try anonymous demo BUILT + hardened, PARKED behind `DEMO_ANONYMOUS_EXTRACT`**
    (founder: "not until it's the very best we can"). Plans:
    `docs/plans/try-anonymous-demo-plan.md`, `first-try-reliability-roadmap.md`.
  - Vendor-benchmark math parity-ported into the Ledger (golden vectors);
    `ledger-spec/cost-index/IS-IT-YOU-OR-THE-MARKET.md` specs the own-series
    overlay. **POS-SPEC.md** (07-05) carries its own tiered insight catalog §6 —
    reconcile with `docs/plans/muntin-plate-insight-catalog.md` before building
    Plate entries.

**Gate baseline re-verified 2026-07-06:** check-all = 226/246, 20 failures, ALL
"(idem)" deploy-regenerated drifts (warm-palette + cost-index sync now GREEN —
baseline improved from ~21). Hard gates all green; fabrications 0 hits.

**Open-PR triage (2026-07-06):** storefront #501 (residual diff on the merged
vendor-benchmark branch — CI failures are outage artifacts, but its Workers
Build failure needs real triage), #448 (stale audio PR), #374 (stale cursor
draft); product #237 (stale). None block main.

**Queue state:** A — Plate insight catalog **EXISTS**
(`docs/plans/muntin-plate-insight-catalog.md`, E1–E15 ranked, flagship = E1+E2
pair; ADR-010 + E14 already shipped) → thread A is now "pick the next entry to
BUILD", not "write the catalog". B — vertical generality **NOT STARTED**, and
the claim is already live in marketing (`/vs/marginedge` "vertical-agnostic";
homepage "for small business") while every code path is restaurant-hardcoded
(`seedDefaultsForOrg` → `RESTAURANT_DEFAULTS`, NRA-chart GL seed, all-restaurant
golden suite) — an honesty gap to either EARN (fixtures + vertical selector) or
SOFTEN (copy). C — social pre-launch still blocked on the founder IG decision.

---

### Prior state (updated 2026-06-27, superseded by the section above)

**Session on branch `claude/muntin-strategic-council-fzdd1j`** (PR #489 — the prior `-rqdehe` heartbeat/prune/anti-Factura work + the Worker-build fix — is **merged to main**, commit `3b3bb6cb0`). Caught up with main; `check-all` re-verified green (215/236 = the documented deploy-regenerated idempotency baseline; all hard gates + every cost-index gate GREEN even after calendar aging).

**Shipped this session:**
- **Durable cost-index fix (standing-queue #1) — DONE.** The 2026-06-26 poblano fix (commit `9239e0fe5`) only *dropped* the stale points by hand; the dead `usda-ams-los-angeles` terminal would re-poison the level on the next live refresh. Root cause: `composeIngredient` computed `levelEligible` per source (`fetch-cost-index-sources.mjs:270`) but `buildCompositeInput` (`tools/_shared/cost-index-sources.js`) ignored it — every non-index source's latest read was pushed into `levelObs`, so a stale terminal anchored the level AND left a >120d date in `level.provenance`, which is exactly what the `stale-level` gate (`check-cost-index-sync.mjs` `pointIssues`) checks. **Cure:** one guard in `buildCompositeInput` — a source contributes to the level only if `o.levelEligible !== false`; a stale terminal still feeds the **trend** (`sourceSeries`, per the line-265 design comment) but never anchors/date-stamps the level. Opt-in flag → existing callers unchanged. Pinned by a new self-test in `cost-index-sources.test.mjs` + verified end-to-end through the real engine against a poblano-style multi-terminal input (dead terminal aged out of level, gate no longer trips, both terminals still in trend). 0 new check-all failures.

- **Anti-Factura execution (standing-queue #2) — DONE** (`a8f4ebbe3`). Strengthened OUR provable commitments on `/ai`, `/never`, `/security` (EN+ES), no competitor named. **Verified each claim against the product repo** (`muntin-invoice-decoder`): `verify-explainers.ts` (`no-llm-ci` gate — "no language model ever reads the content of your invoice"; CI greps openai/anthropic/transformers/langchain, exit 1, no override), `lens-10` ("Docling runs on our infrastructure; the inference is local; no OpenAI/Anthropic/Google call in the extraction path"), the public `/promises` + `/verify/[slug]` surfaces. So "no language model in the customer-data path, runs on our own infrastructure, never trained on your data, verifiable" is true + earned-in-code — no fact fork. `/ai` "Train on your data" bullet + providers note re-anchored from studio-era "engagement letter" framing to the product path; `/never` guarantee two likewise; `/security` got a non-gated bridge sentence in the intro dek (no change to the gated claim/test/tier counts — security-claims + locale-parity stay green). Linked the proof at `ledger.muntin.digital/promises`. `dateModified` bumped honestly on `/ai` `/never` `/changelog`. Fact gate: 0 hits.
- **`/changelog` real entry (standing-queue #3) — DONE** (in `a8f4ebbe3`). A dated 2026-06-27 June entry (EN+ES) recording the trust-surface change — makes the `dateModified` bump honest (real new content, never a bare date bump).
- **ES driver-mechanism translation (standing-queue #3) — DONE** (`fbcec76d9`). Added `label_es`/`mechanism_es` to all 5 drivers in `data/cost-index-drivers.json` (faithful, preserves "association, not cause" + sourced meaning); wired `hubDriverInsight` in `build-cost-index-pages.mjs` to read them on `/es/` ("A menudo sigue a … (asociación, no causa)", "Evidencia/recuperado/fuente" drawer) with a missing-ES omission guard so a half-translated catalog can never leak English. EN output byte-identical. The 354 regenerated pages are emitted by the scheduled `cost-index-refresh` workflow (the established pattern — poblano fix didn't hand-commit pages either); only the durable source is committed.
- **Glossary-hub `dateModified` (standing-queue #3) — DONE** (`84fc54367`). Wired the glossary hub's truthful `article:modified_time` (2026-06-07) from the real `data/glossary-added.json` (newest term-added date) via `inject-hub-modified-time.mjs`; stamped `glossary/` + `es/glossary/`; regenerated `sitemap.xml`. `tools/` still skipped (no dated source).

- **`tools/start` prune (standing-queue #3) — DONE** (founder chose noindex-shelf). Applied the `method/` treatment: `<meta name="robots" content="noindex, nofollow">` on `tools/start/` + `es/tools/start/`, dropped both from the sitemap (1204→1202 URLs), page kept live, no redirect/link work, reversible. `nofollow` exempts it from locale-parity; hreflang-orphans + locale-parity stay green. (Retire+301 remains available later if the visible listing should go too — would need the Worker redirect map since `_redirects` is at CF's 100-rule cap, + repoint the ~6 inbound links.)

- **Thread D — remaining website prune — DONE (the genuine leftovers).** On grounding, most of D was already shipped: the 8 off-funnel tools were retired+301'd in `44d64cc74`, and `/method/` is already out of nav/footer/tools-hub. The real remaining debt was two things, both fixed (`2e6a0bbc7`): (1) the **primary nav still linked the retired `/start/`** on every page (a sitewide 301 hop) while the flagship **Cost Index had no nav entry** — repointed + relabelled the item to the Cost Index (`_includes/nav.html` "Start"→"Cost Index" `/cost-index/`; `_includes/es/nav.html` "Comienza"→"Índice de costos" `/es/cost-index/`), swept sitewide via sync-includes, then `inject-site-counts` to restore footer count sentinels (the documented build-chain order; net per-page diff is the nav link only); (2) removed orphaned `data/start-here-journeys.json` (referenced retired slugs, fed only the deleted `/start/`, no consumer). 0 new check-all failures.
  - **D follow-up — DONE** (`31b1a8c04`). The `library/index.html` (EN+ES) "Not sure where to start" hero advertised the retired `/start/` triage ("Three questions, one plan…"). Rewrote it to lead with the live, indexed guided tour at `/learn/start-here/` (which it already linked secondarily) and dropped the redundant secondary link; eyebrow + `#start-h` anchor unchanged. CTA canon clean; fact gate 0 hits. (The ~126 plain in-content body links to retired tools across articles still 301 by design — board-sanctioned, no broken-link gate; not worth a 126-file repoint sweep.)

## ⮕ AUDIT-EXECUTION (founder-commissioned full-site audit, 2026-06-27)

A 7-auditor panel canvassed every touchpoint; synthesis = "world-class house, weak front doors" (strong craft/content/trust, gaps in funnel wiring + lingering studio-era ghosts). Founder said execute the whole roadmap (build → adversarial audit → commit). **P0 (integrity) COMPLETE + the top P1 fix — all shipped, pushed, each verified 216/237 (baseline, 0 new fails), fact gate 0 hits:**
- `275b37b67` P0a/P0e — retired-audit CTAs killed sitewide (hero, flagship card → Muntin Bench, footer mobile bar → Cost Pulse); **new gate `check-retired-links.mjs`** (fail-CI on retired links in chrome/funnel; warns the ~237 in-content long tail); ES homepage re-synced to EN (moat line, CTAs, Muntin Bench, dropped ServSafe).
- `4da39928b` P0b — `/receipts/` de-studio'd to product-only "What's here now".
- `84fcc7bc0` P0c — tools hub: count reconciled (sentinel), dead roadmap + phantom Quick filter removed (made `build-tools-index.mjs` data-driven), SEO-era hero reframed.
- `146908216` P0d — `/security/` paid-clients → product-only Muntin Ledger billing.
- `331bd2420` P0f — founding date + offer published consistently (homepage + /ledger/, EN+ES): "Nov 13, 2026 · 3 months free, then $19/mo" (founder-approved publishing the specifics).
- `fa0b996ff` P1 — nav "Ledger" → on-site `/ledger/` explainer (was cold external subdomain).

**P1 FUNNEL WIRING — DONE (shipped after the P0 block):**
- `fa0b996ff` nav "Ledger" → on-site `/ledger/` explainer (was cold external subdomain).
- `adc5c91da` homepage trust-strip names the authorities ("Every number sourced — USDA · BLS · FRED") + links `/trust/`; footer foot-CTA product-forward ("See Muntin Ledger" primary, "Reach Don" → ghost). Swept sitewide.
- `8119ac199` Cost Index ingredient pages escalate to Ledger ("…that's Muntin Ledger — your data, no language model" → /ledger/), via `build-cost-index-pages.mjs` (source committed; refresh workflow regenerates the 162 pages).
- **Found already-built:** the article→Ledger rung exists (`inject-ledger-cta.mjs` + `data/ledger-cta.json`, 12 high-intent finance/cost articles, idempotency-gated in check-all). Funnel now escalates to the product from nav, footer, trust strip, Cost Index, and the key articles.

**P1d — Cost Index as a DATA PRODUCT (founder steer 2026-06-27: "make depth + actual usefulness as impressive as the app"). Ran a 5-expert depth panel (operator / data-journalist / ag-economist / adversarial fact-gate auditor / IA-stickiness). Meta-finding ALL FIVE reached independently: the depth is already computed and SHELVED — the work is surfacing + guarding, not inventing. Ranked roadmap (value × honesty-safety × data-readiness):**
- **#1 Seasonal "typical for this month" band — SHIPPED** (`6e8a60642`). `data/seasonality.json` (multi-year monthly median+p25/p75, ≥2-distinct-years gate, 41/101 ready) was rendered nowhere though the methodology promised it. `seasonalBand()` in `build-cost-index-pages.mjs` now renders it per ingredient (39×EN+ES): places the current read inside/above/below its own month's multi-year band (e.g. "$20.50 is below its typical June — seasonally cheap"). Bands carry `data-season-*` attrs; **new gate `check-cost-index-seasonal.mjs`** re-derives every band from seasonality.json + fails on drift / not-ready / <2-years (the recompute-and-diff net the regex gate can't give — the adversarial auditor's binding condition). Wired into check-all (gate + self-test 11/11). Also relabeled the trailing-window capsule "Normally"→"Recent range" (econ flagged: 26wk window ≠ a "normal" for seasonal items). Source-only; refresh workflow regens.
- **Composite basket band — SHIPPED earlier** (`241c2240e`). `CI.basket` (computed, rendered nowhere) now the hub's headline reading-against-baseline (breadth 8/6/2, confidence, as-of, provenance). Fixed false "refreshed daily" freshness line. No live cents.
- **#2 Ship the real multi-year history — SHIPPED** (`9346d078d`). `mergedSeries()` stitches the deep backfill (`cost-index-history.json`, 53 ing. back to 2023, was internal-only) with the live daily window into public `series.json/csv` — ribeye 26→62 rows, 2023-05-01→2026-06-18. Backfill points carry `reconstructed:true` (+ a reconstructedNote + coverage block); CSV gets a `reconstructed` column. Dataset `temporalCoverage` now spans the full series and `datePublished`=series start (was collapsing onto latest read, erasing history). On-page charts stay on the recent window (download carries all). Feed/reproduce/embed checks green.
- **#3 Basket transparency — SHIPPED** (`cc837b0ea`). Linked the hub-orphaned `/cost-index/basket/` (weights) from the composite drawer; fixed `+3.2%` false precision — band now says "nearly evenly split (agreement 52%), soft signal not a precise figure" when agreement<0.6. (No baseline-window DATES exist in the data — did not invent them.)
- **#4 Hub "all readings" comparison table — SHIPPED** (`bde28a8e7`). `allReadingsTable()` renders all 81 shippable readings as a scannable grid (ingredient · direction · verdict · indexed-spark · as-of), movers first. Price-free (hub contract); pure surfacing of per-page values (no new statistic). In the `.table-scroll` wrapper. Static (no client sort in v1 — server-ordered by urgency; sort is a safe later add).
- **#5 "What changed since last week" — DESCOPED.** `cost-index-readings.prev.json` holds only raw per-date PRICES (cents), not prior verdicts. The clean "N moved into Watch" needs prior computed tones (not stored) or puts cents on the hub (forbidden); a price-diff version needs a commensurability gate (the dispatch's week-over-week guards). Not a clean win from available data — revisit only if prior-verdict snapshots get persisted. (Surfacing the existing `cost-index/weekly/` archive + `/feed.xml` near the signup is still a cheap, safe return-loop win if wanted.)
- **#6 Portion-cost bridge** ($/unit → $/plated portion) — `data/ingredient-yields.json` + `build-ingredient-yield-pages.mjs` EXIST; operator's #1. NOT YET DONE. AUDITOR RED LINE: keep user-input/illustrative, NEVER a narrated plate-dollar margin (the May-2026 fabrication shape). Highest-care item — confirm approach before building.
- **Auditor red lines (binding for ALL further depth):** no forward *prices* (direction-with-track-record is the ceiling, per `pressureBlock`); no synthesized regional figures; no cross-basis composites; every new number = deterministic re-derivation with its enforcing recompute-and-diff check IN THE SAME COMMIT; narration (EN+ES audio) safety holds.
- **Optional P1 marginal:** expand `data/ledger-cta.json` to a few more clearly-relevant cost articles; a Ledger rung on cost/margin glossary terms (don't spam definitional terms). The nav primary-button "Reach Don" → product-CTA is a surfaced FORK (the Window is a deliberate brand signature — founder steer).
- **P1**: (a) product rung in the generated end-rails — article `smart-next`, glossary end-rail, Cost Index ingredient pages — add "Track this automatically → Muntin Ledger /ledger/" as the escalation after the free-tool CTA (edit the SOURCES: `data/post-end-cta.json`/`cross-surface-map`, smart-next + glossary-knit generators, `build-cost-index-pages.mjs` `hubDriverInsight`/ingredient footer; re-run injectors). (b) CTA hierarchy — demote "Reach Don"/Window to ghost everywhere except `/window/` + `/ledger/#contact` (canon + nav/footer/mobile-bar/smart-next). (c) Footer foot-CTA + mobile bar product-forward. (d) **Cost Index as a data product** — sortable index table w/ value+sparkline+trend%+verdict, KPI hero band (tracked count · last refresh · # moving), composite index line (no live cents on hub — relative-to-100 only); enrich sparklines (80% band, dates). (e) Trust on funnel — homepage "Sourced from USDA·BLS·FRED" authority row + a trust-strip link to `/trust/`.
- **P2 polish — STARTED 2026-06-27:**
  - **Warm-palette purge root fix — DONE** (`e2709809f`). The gate's 44 persistent failures were generator-root, not output: `build-library.mjs` + `build-people-pages.mjs` emitted `<meta theme-color #1F4E5B>` (retired warm teal), so migrating the output alone was non-durable churn. Fixed both generators → #2A50C8, ran migrate-warm-palette on the committed output (40 glossary EN+ES + learn/topics theme-color + tools-hub inline --ink/--ink-soft var fallbacks). Gate green across 2059 files, durable. **Baseline ✗ 21 → 20.**
  - **SearchAction JSON-LD — N/A (do not build).** No search endpoint/page exists (nav search button is display:none). Adding sitelinks-searchbox schema would advertise a capability that doesn't exist — against the honesty ethos.
  - **`/status/` "Refreshed every day" — NOT a bug.** Verified `cost-index-refresh.yml` runs `cron: 0 13 * * *` (daily; moved off weekly because LMR updates business-daily). The page's "pulls on a daily schedule, publishes when sources support it" is true. (Note: hub freshness line was separately changed to "refreshed as the sources publish · last reviewed {_lastReviewed}" — accurate, distinguishes the daily PULL from the manual review stamp + source-cadence publishing. No contradiction.)
  - **Waterfall gold dark-mode contrast — DONE** (`93d1c6d55`). `.viz-waterfall__seg[data-tone="gold"]` paired a FIXED gold bg with theme-flipping `var(--ink)` text → illegible light-on-gold in dark mode. Pinned text to `#16181D` (light mode unchanged). **Adversarial catch:** the board's "kill #C5A059 → rust" idea was WRONG — gold is the deliberate *watch/caution* tone (distinct from rust = re-price/alarm, mirrors the verdict chips). Left the tone intact; fixed only the broken bg/text pairing. Edited `site.css` (source) + the served `site-article.css` identically (a clean `build-css-shells` regen would DELETE `.viz-table` CSS / ADR-006 — the real cause of the "CSS shells" baseline ✗ — so a full rebuild is unsafe; the surgical edit avoids adopting that drift).
  - **"Proof you can check" cluster — ALREADY PRESENT (no work).** `/trust/` already states the data ships CC0, the method + per-ingredient sources + verified track record are open, and the claims ledger is machine-readable + checkable. Comprehensive (10 sections); adding more = redundant churn.
  - **REMAINING P2 — all are substantial standalones, NOT quick polish** (the cheap wins are now harvested): window/muntin motif on interior pages + mobile (port `muntinField()` SVG; needs visual verification); earn the golden-hour warm layer in 2-3 live moments (design/subjective); `#C5A059`→token tokenization (cosmetic only — the gold is intentional & the one real bug is fixed; low value, sits in the entangled CSS-shell zone); dark-mode hero gradient parity (CSS-shell zone); OG AVIF/WebP + flip format gate (binary asset generation + new gate); ES audio backfill (warn-only; audio pipeline). Each warrants its own focused pass.
- **Caveat**: sitewide sweeps (nav/footer) re-stamp via `sync-includes` + `inject-site-counts` (run BOTH, in that order) and dump full files into context — heavy; do them deliberately. The Cost-Index data-product build is calendar-sensitive (commit SOURCE; the refresh workflow regenerates pages).

### ⮕ EXPERIENTIAL AUDIT (founder-commissioned, 2026-06-27) — 6 target-user personas walked the live site
Ran 6 personas (first-impression, owner-operator, mobile chef, Spanish operator, skeptical CFO, accessibility) end-to-end; each fix grounded then adversarially re-reviewed (the skeptic overturned 3 of my initial reads + caught a regression I'd introduced).
**SHIPPED (all gate-green, fact gate 0):**
- Find-an-ingredient **search** on the hub table (`50da9a431`) — two personas bounced for lack of it.
- **Weekly-email capture on every ingredient page** (`358fd29a7`) — top conversion leak (was buried below the hub's longest scroll).
- **Father's Day blog CTA** repaired — orphaned "free audit" stamp re-added to post-end-cta.json with honest Margin Math copy (`265698cfb`).
- **Stale retired-audit tool meta** + "Halucinated" typo (`afec631f2`); **JSON-LD + body audit sweep** finished (`ca17a1359`).
- **ES `from=` attribution** fixed across all 27 ES posts — `inject-post-end-cta.mjs` dropped localSlug (`65cc8605d`).
- **ES "recently added" rail** — real ES titles/slugs, no English; also fixed `/blog/`→`/library/` 404s on the EN homepage (`f5af87d25`); latent edge-cases hardened (`0ca1a196e`).
- **Cost Pulse a11y** — real `<noscript>` fallback + `role=status` (`1908fa600`). (Live SR a11y was already JS-handled via `cost-index-ui.js:348`; the `<noscript>` is the real JS-off win.)
- **Hub "what's moving" curated** (`5d9ff6c6b`) — Maria #4: was ~20 movers repeating the same "elevated N weeks" note + re-listing ingredients already in the table/grid (my own "all readings" table worsened it). Now shows every act-now re-price + fills to a cap of 8 with watches + "+N more → the readings table." HUB IA is now coherent: composite band → orientation → curated movers (8) → searchable "all readings" table → category grid. **Note: the category grid is LOAD-BEARING and must NOT be removed** — every ingredient page's eyebrow links to `/cost-index/#<category>` (build-cost-index-pages.mjs:1823/1916), so the grid's `id=#beef` etc. section headings are the scroll targets for ~100 pages.
**VERIFIED NON-ISSUES (stale committed output, self-heals on regen — NOT bugs):** ES cost-index `inLanguage` (generator already emits es-US); footer counts (built pages correct, only the un-injected partial shows old numbers); the 5 library "free audit" hits (legacy body prose, not CTAs — those idem-pass).
**REMAINING EXPERIENTIAL (all in entangled/sitewide zones — deliberate scoped passes, not tail-of-session):**
  - **#10 ES see-also locale leak — DONE** (`cc099206a`). NOT the build-library regen the diagnosis feared: `injectSeeAlso` only writes blog/ + es/blog/ (never library), so the library see-also blocks are FROZEN hand-authored content from the blog→library migration — never regenerated. Hand-fixed 6 ES pages: localized the clean title-matched leaks (guia-conversion-reservas, doordash ES slug, /es/ research mirror, ingenieria-de-menu), removed a retired-tool dead card (/tools/menu-converter/ 404), and removed 2 migration-corrupted cards (title described a different EN-only article than the href). Every ES see-also card now resolves locale-correct + title-matched. (Original deferred diagnosis kept below for reference — it was wrong about the mechanism.)
  - ~~#10 deferred diagnosis (SUPERSEDED — the see-also is frozen, not generated):~~ `relatedItemsFor` (build-library.mjs:1486-1503) hardcodes `pathFor(locale, '/blog/${slug}/')` with the EN slug — so on ES pages see-also links resolve to EN posts (locale leak, not 404), AND for library-namespace posts the EN link is itself a 404 (`/blog/<lib-slug>/` doesn't exist — same `/blog/` bug the rail had). A correct fix needs BOTH: (a) namespace + ES-slug resolution in `relatedItemsFor` (via i18n-slug-map, skip no-mirror — mirror the rail fix), AND (b) `getMeta()` gains a `library` case (today its switch is blog/research/tools/checklists only, so a library post's ES title scrapes the wrong `es/blog/<slug>` path). Then a full `build-library` run regenerates — that mutates ~389 files (see-also + glossary-autolink + citation counts across all library/blog/glossary), the baseline idem-churn zone. So: fix the two source functions, run build-library, verify ES see-also hrefs, revert generated + commit SOURCE-ONLY (deploy regenerates), OR commit the full regen deliberately. Lowest-severity remaining ES item (links work, just cross-locale).
  - **#11b ES field-notes English form — DONE** (`69b2d45ea`). Root cause was `inject-article-fieldnote-form.mjs`: `localeFromPath` matched only `/es/blog/` (ES library → English form), and `articleSlugFromPath`/sign-in URL were blog-hardcoded (`/blog//` empty-slug sign-in return on ALL library pages, EN included). Fixed locale/slug/namespace; 50 library pages corrected (25 EN sign-in URLs + 25 ES form+URL).
  - **#13 calibration disclosure (CFO) — DONE** (`a6769a10b` + adversarial correction). Added a published-LABEL trend disclosure to the methodology track-record paragraph (EN+ES), data-driven via new `cal:label.*` sentinels (inject-cost-index-calibration.mjs reads cost-confidence-calibration.json): low 49% (UNDER its 52% baseline — no edge yet), medium 60% vs 53% baseline, top label 0 ingredients; band coverage holds "on every label with enough history to score." Adversarial review caught the first cut laundering the negative lift + an over-broad "every label" claim — both fixed. All figures injected + gate-checked (drift-safe).
  - **#15 footer-newsletter `aria-live`** — submit-into-silence (no announced confirmation; the founding form does it right). Fix is in `_includes/footer.html` → needs the heavy sitewide `sync-includes` + `inject-site-counts` propagation.
  - **Product-name soup (#5, founder call)** — Cost Index vs Cost Pulse vs Muntin Bench (URL /vendor-benchmark/) vs "Check prices"; the Ledger price+proofs living off-site at ledger.muntin.digital (deliberate split). Both need founder direction before sitewide renames.

**Standing queue is now CLEAR (A–D all addressed).** Next-thread candidates: A — Muntin Plate emergent-insight catalog (design doc); B — vertical-generality build (product, separate repo); C — social pre-launch (needs founder IG decision); the D follow-up above (library hero CTA). Recommend confirming direction before the next build.

---

### Prior state (branch `claude/muntin-strategic-council-rqdehe`, now merged via #489)

Branch `claude/muntin-strategic-council-rqdehe`: **22 commits ahead of main, all pushed, working tree clean.** No PR (none requested). Product repo untouched.

**Shipped this session (all independently audited + pushed):**
- **Phase 0 — freshness foundation:** sitewide `<head>` feed-discovery links; sitemap `lastmod` derives ONLY from real `dateModified` (git-mtime removed — it was re-flattening the signal); 6 collection hubs gained truthful `lastmod` (`inject-hub-modified-time.mjs`).
- **Phase 1 — the Cost Index made genuinely useful (ADR-010):** hub "What's moving now" is now empowering + evidence-backed (sourced driver association + Evidence drawer) + **price-free** (cents stay in the per-ingredient cited Market-read block) + a **price-free indexed movement chart** (`indexedMovement()`, hub mini + per-ingredient large). Fact-gate-reviewed 3× (caught + fixed a down/"up-and-holding" contradiction and an eggplant "rose"-while-falling).
- **Phase 2 — prune COMPLETE:** `method/` + 19 widgets noindex-shelved; 31 off-funnel sheets legacy-shelved; course nav-dot de-wired; **8 tools + `start/` retired+301** (full migration — Worker map `src/lib/tool-redirects.js`, regression-tested `scripts/test-tool-redirects.mjs`).
- **Strategy:** Factura competitive audit → `docs/strategy-anti-factura-positioning.md` (honesty-labelled, NOT publish-ready).

**Gate baseline (CRITICAL for counting regressions):** `check-all` = **~22 failing**, ALL deploy-regenerated idempotency drifts (CSS shells/cache-bust, glossary knit/OG/script/stamp/schema/sidecar, sheet/topic/tool rails, sheet OG cards, themes/theme-story/cuisine builders, warm-palette, RSS, llms.txt, hub schema, H2-anchors, lazy-loader, cost-index sync). These are NOT failures — the deploy regenerates them. **Only count NEW ones.** The hard gates are GREEN: locale-parity, hreflang-orphans, **check-fabrications**, check-intent-param-targets, check-audit-fetch-timeouts.

**NEXT QUEUE (recommended order):**
1. **Act on Factura** — strengthen `/never` `/security` `/ai` with the no-training / deterministic / "your data is yours" commitments (state OUR commitments; do NOT name Factura; ToS wording needs egress-verified before any public reference). Fact-gated prose.
2. **Prune leftovers** — `tools/start/` (survivor "pick a tool" page), tools/glossary hub `dateModified` source (need a real one — don't invent), ES driver-mechanism translation for the hub insight, a real `/changelog` entry (its 2026-05-02 date is HONEST — don't bump without new content).

Full detail + the tools-migration replacement map + gotchas are in the sections below. Cross-refs: `ADR-010` (insight grammar), `docs/plans/website-heartbeat-and-prune.md` (audit synthesis), `docs/strategy-anti-factura-positioning.md`.

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

## Shipped (this session — all committed + pushed)

| Thread | Result |
|---|---|
| Article enrichment | ADRs 005–009; `check-article-graphics` gate now counts `table`/`data-figure-kind` toward variety (backward-compatible, tested); pilot post `service-charge-vs-tipping-model` (EN+ES) uses a `viz-table` |
| Visual-system foundation | design ADR-001 + `docs/brand/visual-system.md` (the spine duality = the positioning); 2 CI guards (`check-og-accents` wired, `check-stone-2-usage` report-mode); craft tokens |
| OG-card rebrand | `home`/`learn`/`about` (EN) + `home-es`/`about-es` (ES) → "Modern tools. Old-fashioned honest." / cost-intelligence; orphaned retired-services cards removed (770→768) |
| Honest landing-claim fix | product `page.tsx` reworded (claim the universal core, drop untested verticals) |
| Cost Index "of record" | last gap closed — per-ingredient driver attribution for flagged movers (standing context, not causation) |
| **Landed** | storefront **#482** + product **#227** — reviewed and **merged to main** |

## The queue (remaining threads)

### A. Muntin Plate — emergent-insight catalog  *(design deliverable)*
- **Ground:** `docs/plans/muntin-plate.md` (build-ready costing plan) + `docs/plans/muntin-insight-layer.md`. Dedupe against the MVP/V2/V3 phasing.
- **Build:** draft the catalog of insights only possible from the *unity* of datasets (invoices × recipes × Cost Index × inventory × yields × dormant cohort). Flagship example: **vendor-vs-market discrimination** (your vendor raised romaine but the market index is flat → markup, here's the lever). Each insight: inputs, owner-facing one-liner (EN+ES), trigger/cadence, single action, confidence/honesty handling, privacy class, phase.
- **Constraints:** deterministic/no-LLM, show-your-work, empowerment ship-test, privacy (cohort insights dormant until opt-in + k≥10 + ratios-only + antitrust counsel), costing ≠ inventory.
- **Output:** a design doc/ADR.

### B. Vertical-generality build — *earn* the "any small business" claim  *(product feature)*
- **Why:** PR #227 made the claim honest by softening it; this makes it *true*.
- **Ground:** decoder onboarding/seed — `apps/api/src/lib/categories-store.ts` (`seedDefaultsForOrg` seeds `RESTAURANT_DEFAULTS` for every org; no vertical selector), `gl-seed.ts`, the extraction golden suite `services/extract/tests/golden/cases.py`.
- **Build (evidence-first, smallest increment):** add non-restaurant fixtures (retail/services/professional invoices) to the golden suite and verify the deterministic core extracts vendor/date/total/line-items. Then the real feature: a **vertical selector at onboarding** + **non-restaurant category taxonomies**.
- **Audit:** product CI — `check-verboten-phrases`, `check-voice-boundary`, `check-copy-grade`, vitest, the extraction golden tests.

### C. Social pre-launch  *(strategy + execution)*
- Prompt already delivered. **Founder decision needed:** Instagram revive-vs-fresh-start; Bluesky activation.
- Tie to the new brand line + the content engine (weekly Cost Index dispatch, rebranded cards). Next concrete: the IG decision, then the pre-launch anticipation arc + first posts.

### D. Website refresh — heartbeat + prune  *(audit done → awaiting founder go)*
- **Plan:** `docs/plans/website-heartbeat-and-prune.md` (synthesis of a 4-specialist read-only audit).
- **Core finding:** cost-intelligence core is clean; over-extension = studio/course-era survivors (`method/workshop/` 19 widgets, off-funnel `/tools/` clusters, `course-*`/`brand-design`/`local-seo`/`conversions` sheet packs, `start/`, frozen-course nav plumbing). Freshness engine already half-built but a **P0 sitemap `lastmod` bug** (bulk-stamped → crawlers distrust it) is the literal cause of the post-refresh trail-off.
- **Phase 0 — SHIPPED + pushed** (`claude/muntin-strategic-council-rqdehe`, commits `098f3de1`→`83023f46`→`f6e1791a`): `<head>` feed-discovery `<link>` tags sitewide (1328 pages, anchored ABOVE the i18n:hreflang region); sitemap `lastmod` now derives ONLY from real `dateModified` (git-mtime fallback DELETED — adversarial review caught that it would re-flatten ~1030 URLs on every sitewide pass; honest-absent is the fix). 298 URLs truthful-dated, 1030 omit lastmod (spec-valid). Phase 0c regen-on-deploy already covered by the weekly dispatch workflow. 0 new check-all failures vs main (baseline = 20–21 deploy-regenerated drifts on main itself, not ours). Adversarially reviewed twice → SHIP.
- **Posture LOCKED (founder):** prune = retire+301 Tier 1, legacy-shelf Tier 2, de-wire course nav dot. Start point = Phase 0 (done).
- **Phase 1 (heartbeat harvest) — IN PROGRESS.**
  - **SHIPPED** (`b99e1b1b`+`b4d216b7`, ADR-010): the Cost Index hub "What's moving now" is now an *empowering, evidence-backed* insight per mover — magnitude + as-of + measured persistence (elevated N weeks) + the verdict engine's note + a **sourced driver association** (mechanism + Evidence cite drawer, labelled "association, not cause", up-read-only) + action + full-read link. Grammar recorded in **ADR-010** (= first entry of the Plate insight catalog, queue A). Twice adversarially fact-gate-reviewed (caught + fixed a down/"up-and-holding" contradiction). The cost-index hub also gained a truthful `dateModified` lastmod. ES gets the structural enrichment minus the EN-only driver mechanism (catalog has no ES prose → **follow-up: translate `data/cost-index-drivers.json` mechanisms/labels or add `mechanism_es`**).
  - **SHIPPED** (`009bbce2`): hub is now **price-free** — live cents stay in the per-ingredient cited Market-read block only (founder confirmed; ADR-010 updated).
  - **SHIPPED** (`e0a15d9f`): **price-free indexed movement chart** (`indexedMovement()`) — hub mini sparkline + per-ingredient large chart, normalized to 100 at the window's first read, true-to-scale, caption labels the REAL date window (never claims a span we lack), direction word derives from the index endpoint so it can't contradict the curve. Fact-gate reviewed (caught + fixed eggplant "rose" while index fell to 57). Reuses `MuntinSparkline`.
  - **SHIPPED** (`f6f1275c`): truthful `article:modified_time` on 6 collection hubs (homepage/blog/library EN+ES) via `inject-hub-modified-time.mjs` (newest-child date) → they now carry a sitemap `lastmod`.
  - **Remaining:** `tools/` + `glossary/` hubs still lastmod-less (their children carry no `dateModified` — need a real date source, e.g. `data/glossary-added.json` / a tool-release date — do NOT invent). `/changelog/` is **honestly dated** (2026-05-02 matches its newest May entry — the earlier "stale" claim was a misread); to freshen it, WRITE a real new entry (content task), never bump the date alone. Weekly dispatch automation = already DONE (verify `COST_INDEX_BROADCAST_SECRET`). ES driver-mechanism translation for the hub insight still pending.
- **Phase 2 (the prune) — IN PROGRESS.** Redirect mechanism = `/_redirects` (CF Pages, `SOURCE DEST 301`; existing precedent lines for retired services/tools). Gate notes: removing an EN page needs its ES twin too (locale-parity); noindex+**nofollow** exempts a page from parity; only `tools.live` count (13→5) changes; sheets aren't counted.
  - **SHIPPED** (`cf8c2c0e3`): `method/` + 19 workshop widgets noindex-shelved (EN+ES, 40 pages dropped from sitemap). **ADAPTATION:** these were Tier-1 (retire+301) but the frozen-but-live course links into `method/workshop/rhythm-calendar`, so 301 would break a kept-live surface → noindex-shelf instead. Follow-up: drop `/method/` from `_includes/nav.html` + `tools/index.html` (needs the sync-includes sweep).
  - **Remaining Tier 1 (retire+301) — RE-SCOPED: this is a MIGRATION, not a prune. Attempted 2026-06-26, executed in full, then DISCARDED uncommitted** because it shipped breakage. **Finding:** the 8 off-funnel tools (`gbp-grader, store-hours, storefront-health, menu-copy, photo-brief, menu-converter, brand-suite, restaurant-audit`@`tools/audits/restaurant/`) are first-class data-model entities, not lightweight pages — they're referenced across `data/cross-surface-map.json` (~70), `data/post-end-cta.json` (~42), `kind-registry`, `og-coverage`, `glossary-tool-anchors`, AND have ~12 dedicated test files + scorers (`test-gbp-scorer`, `test-menu-copy`, `test-photo-brief`, `test-brand-suite`…). Deleting the pages broke 2 fail-CI gates: **`check-intent-param-targets`** (128 injector-emitted `intent=` deep-links across ~30 articles point at the removed tools — they come from `data/post-end-cta.json`/`cross-surface-map.json`, fix the SOURCE not the outputs) and **`check-audit-fetch-timeouts`** (hardcodes `tools/audits/restaurant/index.html`). Also stale: a hand-maintained `ItemList` JSON-LD (`numberOfItems:14`) in `tools/index.html` + ES still advertising the 8 retired tool URLs. **DO THIS AS A DEDICATED, SCOPED MIGRATION:** decide each retired tool's replacement target (live tool vs `/tools/` hub vs `/cost-index/`), retarget the CTA/cross-surface configs + re-run injectors, fix the 2 gates' target lists, update the ItemList, retire the scorers/tests, THEN delete pages + add 301s. The redirect chain-repointing (store-hours/restaurant-audit are 301 targets of open-hours/holiday-hours/audit/wellness) was worked out and is in this session's discarded diff if needed. The chain repoints + tools.json 13→5 mechanics are sound — it's the cross-surface/test/CTA unwinding that makes it a migration.
  - **Cleaner low-entanglement prune still available (do these as a focused pass, NOT entangled with the tools):** Tier-2 sheets legacy-shelf + Tier-3 course nav-dot de-wire (below). Or apply the **method/ treatment (noindex-shelf, keep live)** to the 8 tools as a lighter interim — drops them from search without the data-model unwind — if the visible `/tools/` listing reduction can wait.
  - **Tier 2 (legacy-shelf) — SHIPPED** (`a07628e8d`): `data/sheets.json` 6→2 packs / 46→15 sheets; 31 off-funnel sheets noindex+nofollow'd EN+ES (66 pages, dropped from sitemap, kept live). Also fixed a latent crash in `sync-sheet-og-cards.mjs` (`preserved`→`filtered`).
  - **Tier 3 (de-wire) — SHIPPED** (`a07628e8d`): course nav-dot block removed from `_includes/nav.html`, propagated sitewide.
  - **Tools migration — SHIPPED** (`44d64cc74`): 8 off-funnel tools + top-level `start/` retired+301 (full migration: refs retargeted before deletion so gates stayed green; 301s via new Worker map `src/lib/tool-redirects.js` since `_redirects` was at CF's 100-rule cap; regression-tested `scripts/test-tool-redirects.mjs` 14/14). `tools.json` 13→5 (operations-margin only). 0 new check-all failures; 2 baseline resolved. **Prune follow-ups (off-funnel survivors, not blockers):** `tools/start/` (the "pick the right tool" page, distinct from the removed top-level `start/`) still has plain links that 301 cleanly — a reasonable next prune; `data/start-here-journeys.json` references retired slugs but feeds only the deleted `start/` (no gate consumes it). Hundreds of plain in-content body links to retired tools 301 via the Worker map by design (no broken-link gate exists).
  - **Tools-migration REPLACEMENT-TARGET MAP (used; intent=watch went to `margin-math` not cost-pulse — cost-pulse isn't watchable):**
    - `menu-copy`, `menu-converter` → `/tools/menu-engineering/` (live, menu-related)
    - `gbp-grader`, `storefront-health`, `photo-brief`, `brand-suite`, `restaurant-audit`, `store-hours` → `/tools/` hub (plain links)
    - ANY `intent=watch` deep-link (gate needs a live *watchable* tool) → `/tools/cost-pulse/`
    - Then: retarget `data/post-end-cta.json` (~42) + `data/cross-surface-map.json` (~70) + glossary-tool-anchors etc. → re-run injectors; fix `check-intent-param-targets` (source-level) + `check-audit-fetch-timeouts` (drop the removed audit page from its TARGETS list); update the hand-maintained `ItemList` JSON-LD in `tools/index.html` + ES (numberOfItems 14→5); retire the ~12 scorers/test files; THEN `git rm` the 9 dirs + add 301s (chain-repoints worked out, in the 2026-06-26 discarded diff). Sheet-shelf left 5 deploy-regenerated idempotency drifts (sheet sidecar/OG-cards/tool-rail/topic-rail/site-counts) — regenerate-on-deploy class, not failures.
  - **Sitewide-sweep caveat:** nav/footer/count-sentinel edits trigger a `sync-includes`/`inject-site-counts` re-stamp entangled with main's pre-existing drift; scope each commit like the dispatch workflow (`git add <targets>; git checkout -- .`) or commit the full intended sitewide sweep deliberately.

### (Note) Cost Index convergence — *coordinate, don't duplicate*
`main` is building the convergence plan's "Fair-Price Audit" (market-prior invoice auto-audit, lighting up `verdict_compute.py`). Stay clear of that lane.

## Parked decisions / locked lockups

- **EN lockup (locked):** "Modern tools. Old-fashioned honest." / subhead "The cost sense the big players have — sourced, private, and on your side." Lives on the OG cards. **Deliberately NOT forced into the homepage H1** — that H1 is already a strong specific-value hero ("Know what every plate costs before the week eats the margin.").
- **ES tagline (locked):** "Herramientas modernas. Honradez de toda la vida." (on `home-es`).
- **Product sibling line:** default **"No black box."** (Register B) — recorded, not yet applied (product hero already strong/gate-clean; apply only if desired).
- **Enrichment ADRs 005–009:** PROPOSAL status. Shipped: gate amendment + pilot. Remaining: image kinds (photo/scan/render) + ADR-008 provenance gate + more pilots; then ratify.
- **Visual Tier-3 aesthetic** (Golden Hour / focus modules): **recommended SKIP** — the system is already gold-standard; restraint.

## Gotchas (save a future session the rediscovery)

- **`check-all` baseline:** ~230/237, **7 known idempotency failures** the deploy regenerates (CSS shells, CSS cache-bust, glossary verified-stamp, glossary article-schema, themes review-board, theme story pages, cuisine landing pages). These are **not** your failures — only count NEW ones.
- **OG cards render locally** via `@resvg/resvg-js` at `/tmp/og-render-deps` (no `rsvg-convert`); committed PNGs can be `Read` to see/verify a card. Build one: `node scripts/build-og-cards.mjs <slug>`.
- **es-MX voice gates (product)** are strict: no `inteligencia artificial`, `sin esfuerzo`, regressive tone, or "no AI" — describe the *mechanism* ("never a language model") instead.
- "The window in." is **sanctioned brand equity** (the muntin/window metaphor), not stale — keep it.
- **Derived committed content must never scrape ephemeral injector regions.** An injector that reads a page to build permanent output (JSON-LD `ItemList`, normalized snapshots) must exclude the regions later injectors rewrite at build time — the **batch-banner** (`inject-batch-banner.mjs`, hides an expired promo), perf-critical CSS, lazy-load. Two instances bit us: the topic-page `ItemList` scraping the banner's `/blog/` link (PR #488, fixed at `inject-topic-page-schema.mjs:40`) and the theme/cuisine `--check` normalizer not stripping the feed-discovery block (PR #504). Symptom is always the same: a silent end-of-build idempotency `--check` drift when the ephemeral region changes.
- **Standalone page-generator reruns STRIP injected furniture.** `build-cost-index-pages.mjs` / `build-library.mjs` are NOT in the deploy chain; committed pages carry furniture added by later injectors (the WebPage/speakable JSON-LD node, css cache-bust hashes). Regenerating a single page by hand drops that furniture + resets hashes. For a small surgical change (e.g. removing one cross-link), **edit the committed page directly** rather than regenerate — regeneration is only safe as the full cron sequence (generate → sync-includes → inject-* → scoped commit). Verified on the 06-27 poblano attempt.
