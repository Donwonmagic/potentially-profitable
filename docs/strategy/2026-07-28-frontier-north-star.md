<!-- PROVENANCE + STATUS — read before acting on anything below.

  This document is the verbatim synthesis produced by a multi-agent strategy
  workflow run on 2026-07-28. It is ADVISORY, not a decision of record. Nothing
  here has been approved by the operator, and several of its recommendations
  were explicitly deferred.

  It is committed because the container is ephemeral: the workflow output lived
  only in /tmp and would have been lost. docs/ is excluded from the deploy tar
  (verified 2026-07-28), so this is internal and never served.

  TRUST CALIBRATION. Claims in here were produced by agents. A subset were
  independently verified against the repo by the orchestrator and are recorded
  in docs/handoff/strategic-council-board.md under "Verified facts" — those are
  reliable. Everything else, especially market claims, competitor claims, and
  adoption statistics, is UNVERIFIED and must be checked before it is repeated
  anywhere public. The site's fact gate applies to this document's contents the
  same as to any other source: nothing here may be cited on a page without
  independent sourcing.

  When a decision IS taken from this, record it as an ADR in
  docs/editorial/decisions/ and reference this file as input, not as authority.
-->

# Frontier scan and north star

*Workflow run 2026-07-28 · 18 agents · 2,174,499 tokens.*

**What it did.** 18 agents. Scanned what is genuinely new in AI (agentic protocols, memory and self-improvement, uncertainty and abstention, provenance and attestation, evals as distribution, neurosymbolic and local models), mapped it against Muntin's verified assets, generated five independent 10x visions, and stress-tested them with four adversarial critics (hype detector, honesty fence, one-person reality, funnel focus).

---

# THE NORTH STAR
### Muntin Digital — strategy of record, 2026-07-28
*Draft ADR. Supersedes nothing; constrains everything after it.*

---

Before the document, four verifications that reprice the entire dossier. I checked the disputes where the critics contradicted each other, because three of the five visions are built on a fact that is false.

**1. The weekly cadence does not exist, and its retirement was deliberate.** `.github/workflows/cost-index-dispatch.yml` line 1: *"Cost Index dispatch — MANUAL-ONLY (founder call 2026-07-09): the monthly dispatch is HAND-WRITTEN and hand-published each month; no cron generates or publishes posts."* `cost-index-refresh.yml` went daily → Mon/Wed/Fri on 2026-07-06, "at half the run volume of daily." `scripts/check-cost-index-dispatch-fresh.mjs:32` sets `MAX_LAG_DAYS = 38` with a self-test asserting *"a normal month behind still passes."* The 22-day gap that three analysts read as a failing clock is a healthy monthly clock; the next edition is due 2026-08-04. **Every "26 consecutive weeks" milestone in the five visions is 26 months. Every "52 editions" is 2030.** The operator reduced cadence twice in the three weeks before this exercise, for exactly the reason the exercise exists. Five documents then proposed to reverse it without noticing.

**2. There is a live, verified contradiction between published prose and the files it cites.** `blog/cost-index-2026-07/index.html:661` publishes *"refuses a posture on 73 of 100"* annotated `<!-- src: cost-lockfloat.json counts.withhold/catalog -->`. Live `data/cost-lockfloat.json` → `counts.withhold: 37`. Line 655 publishes *"buckets blueberry **float** at ±24.8%"*; live blueberry is `bucket: "withhold", halfWidthPct: 0.301` — a **category** change, not a rounding drift. Eggs "±65.2%" → live 0.571. Chicken breast "coverage floor 0.581" → live 0.595. That file carries 165 `<!-- src: -->` annotations and **not one is machine-enforced**, while `<!-- count:KEY -->` and `<!-- repro:value -->` *are*. Separately, `llms.txt:25` still tells every crawler the index "publishes **weekly** wholesale reference prices." The honesty-fence critic found this; nobody else did; it is the most important finding in the pack.

**3. The revisions ledger cannot date its own corrections.** Key union across all 8,576 rows of `data/cost-revisions.json`: `id, type, ingredient, date, beforeCents, afterCents, deltaPct`. No `revisedAt`. No `observedAt`. `date` is the *observation* date. The ledger knows 2950 became 2550; it does not know when that became public. Every "vintage layer of record" thesis rests on a field that does not exist, and backfilling it from git would be constructing an observation the record never made.

**4. The headline calibration table is one adequately-powered row.** `data/cost-confidence-calibration.json` → `directional` tier: `items: 18`, but `band.items: 2, scoredSteps: 518`, `trend.items: 2, calls: 315`. The 0.739 coverage three visions quote as a credibility asset is n=2. Publishing tier-stratified error without denominators would be the exact overclaim the site exists to refuse.

Also confirmed: `_headers` has **zero** `Access-Control-*` rules across 323 lines. `cost-index/accuracy/` does not exist. "the certified conformal band" lives in `data/cost-lockfloat.json` **and** `data/cost-lockfloat.js`, which `es/tools/cost-pulse/index.html:854` loads — so it ships to browsers today. `scripts/no-llm-ci.sh` exists only in the *product* repo; the storefront has no equivalent. `data/ledger-cta.json` → 12 posts against a 25–30 target; **zero** cost-index ingredient pages carry a Ledger banner. Launch is **2026-11-13**, 108 days out, with wks 11–14 (Aug–Sep) already committed to the launch-site rebuild and funnel items.

---

## 1. THE REFRAME

Muntin is not building a website about food costs. It is building **an instrument that gets quieter when it stops knowing** — and the enforcement machinery that makes that happen without a human in the room. Across both repos this is one product, not two: a wholesale index that withholds 37 of 100 postures, gates 32 of 32 candidate reads behind a Benjamini-Yekutieli null, marks 129 ingredients absent with a named structural reason, publishes `seasonalUseful: false` and `scoreSeparatesSkill: false` and does not delete them; and an extraction engine whose valuation ladder returns `null` rather than guess, with `no-llm-ci.sh` making "no language model reads your numbers" a thirty-second falsification rather than a promise. The defensible claim is not "we have better prices" — anyone with a FRED key re-derives the prices. It is: *this is the only restaurant-cost source whose failure mode is silence, and the silence is compiled into exit codes rather than asserted in prose.* That is smaller than "data institution" and larger than "blog with a spreadsheet," and unlike both, it is true today.

## 2. WHY THIS MOMENT

Three findings from the sweep make this position available in 2026 and not 2023, and one makes it perishable.

**Abstention got priced for the first time.** AA-Omniscience (Nov 2025) scores `(correct − incorrect)/total` — abstention neutral, wrong answers subtracted — and **all but three evaluated models scored below zero**. AbstentionBench (arXiv 2506.09038) found reasoning fine-tuning *degrades* abstention by ~24%, and scaling doesn't help. OpenAI's own hallucination paper argues the cause is structural: the eval ecosystem priced "I don't know" at zero, so training optimized toward confident guessing. Three years ago "we withhold" was a liability to be explained away. It is now the deficiency the field's own leaderboards are built to measure.

**The verifier question got settled negatively for models.** Self-play reward-hacking work (arXiv 2607.05904) drove LLM-judge pass rate 0.72 → 0.94 while true accuracy stayed at **0.20**, with errors transferring across judge families and a strict three-family ensemble still accepting 55%. Meanwhile "Survive or Collapse" (arXiv 2605.22217) found a strict data-**admission gate** is sufficient for loop stability under every reward tested, while no reward is sufficient without one. The scarce, expensive half of any self-improving system is the gate. Muntin has 106 gate scripts and a causation gate that parses *rendered HTML*. Everyone building an eight-step graph pipeline is buying the commodity half.

**Being wrong got repriced commercially.** ISO introduced generative-AI exclusions (CG 40 47 / 40 48) for 2026 CGL policies; EU AI Act Article 50 transparency duties apply **2 Aug 2026**. A category of error insurers will not cover is a category buyers must contract around. Truepic — the one profitable comparable — sells provenance at ~$15M ARR into insurance, lending, and inspection: *provenance gets paid for where a downstream party carries liability for being wrong*, never where a reader wants comfort.

**What makes it perishable:** not a competitor. Attention. The window is perishable because the same craft instinct that produced 129 reasoned absences also produced Glass Well parallax and a 59KB `cost-index/lab/index.html` with zero inbound links, and there is a paid launch in 108 days. The position is available for years. The *capacity to take it* is available in about one week per quarter until 2027-Q1.

## 3. THE NORTH STAR

> **Ship nothing that can't get quieter on its own.**

The test: *does this decision add a surface that needs attention to stay true, or one that degrades toward silence?* It kills the MCP server, the benchmark, the standards body, the IOSCO statement, and the pre-registration chain. It passes the accuracy page, the sentinel gate, CORS, and receipts. It is also the operator's own demonstrated instinct, already written down in `freshness-heartbeat.yml` (added today): *"the alarms that exist specifically for absence are the alarms that absence switches off."*

## 4. THE LADDER

Rungs marked **ARTIFACT** are safe: their worst outcome is that nobody reads them. Rungs marked **SERVICE** carry a standing obligation and a public failure mode; commit only against a signal.

**Rung 0 — Pay the honesty debt. ~1 day. ARTIFACT + GATE. Do this Monday.**
Ships: `scripts/check-src-sentinel.mjs`, promoting `<!-- src: file#path -->` from comment convention to enforced sentinel; the four corrected numbers in `blog/cost-index-2026-07/index.html`; "certified" removed from `data/cost-lockfloat.json` **and** `.js`; `monotonicity.trend.monotone` renamed `monotoneWithinTolerance` with `tolerance: 0.07` printed beside it; `llms.txt` "weekly" → "monthly."
Honest-keeper: the gate itself, wired into `check-all.mjs`. **Critically, it must be monotone-downward** — on disagreement it may stamp an as-of banner, freeze the citation to the frozen `week-<asOf>.json`, or flag the number superseded. It may never restate a number upward or author prose. A gate that can only lower a claim is safe to run unattended, which is the whole doctrine.
Climb signal: it passes green with the four fixes in. Stop signal: none — this is not optional. Dated dispatches are legitimately snapshots, but the cite drawer sends readers to the **live** file, and one of the drifts is categorical.

**Rung 1 — `/cost-index/accuracy/` + CORS. ~2 days. ARTIFACT.**
Ships: one static page, sentinel-synced to `cost-index/calibration.json`, leading with the miss — bands target 80% and hold **76.7%** across 79,086 scored steps; direction beats a coin flip by 0.4 points on 34,029 calls; the seasonal model loses to naive persistence 0.547 vs 0.629; 32 of 32 candidate reads withheld; 129 ingredients unpriceable with the reason for each. Plus `Access-Control-Allow-Origin: *` on `/cost-index/*` in `_headers` — which also makes `llms.txt`'s "open data you may use freely" true, since today no browser can read it.
Honest-keeper: sentinel sync, plus **n printed beside every figure** and **answer rate printed beside every accuracy figure**. Do not publish the tier-stratified table; the `directional` row is n=2.
Climb signal: none needed — this is the deliverable four of five critics independently converged on. Five strategies converging on one page means the page is the finding.

**Rung 2 — The confidence ceiling gate. ~1 day. GATE.**
Ships: `scripts/check-confidence-ceiling.mjs` — a machine may only ever *lower* a published confidence label or descriptive adjective to match its measured record. Raising one requires a human. This is what would have caught "certified" before a critic did.
Climb signal: it fires at least once on real content. Stop signal: if it can only be written by loosening another gate, the rung dies, not the gate.

**Rung 3 — The valuation-rung line in Ledger. ~2 days, folded into W1.4. ARTIFACT (in-product).**
Ships: when Ledger shows a food-cost %, name which rung produced it — override / WAC / prior-count carry / Cost-Index market prior / withheld. `assembleLegs` and the fail-closed ladder already compute this; it needs serializing and one line of UI. Same sprint: wire the `apps/api/scripts/vendor-cost-index.mjs` re-vendoring into CI so the 30-day fail-closed window stops being an open thread.
Why here: this is the *only* rung across all five visions that touches a paying customer's screen before launch, and it makes the shipped "it does not guess" promise legible where it converts. It strengthens `/market-read`, which is already gated on W1.4.
Climb signal: it ships inside the existing launch window without adding one.

**— LAUNCH. 2026-11-13. Nothing below this line before T+30. —**

**Rung 4 — Forward-only `revisedAt`; per-item coverage. Q1 2027. ARTIFACT.**
New revision rows carry a publication timestamp; historical rows carry `null` with a stated reason and are **never** backfilled. Then publish per-item realized coverage — the per-ingredient Wilson-interval numbers `tools/_shared/cost-conformal.js` already computes and the calibration builder discards at aggregation. Nobody in food-price data publishes item-level realized coverage in JSON.
Climb signal: rung 1's logs show anyone at all fetched `/cost-index/*` cross-origin.

**Rung 5 — Machine-readable answer files. 2027-Q2, conditional. ARTIFACT.**
Static `/cost-index/answer/<slug>.json` carrying value-or-withhold, the reason, and the realized error rate. Static files only. **No MCP server, no schema evangelism, no spec page.** If someone copies the shape, excellent — that costs nothing and obligates nothing.
Gate first: read the logs. `src/worker.js:474` already proxies Plausible. Before building a machine-consumption surface, measure whether `llms.txt` (80KB) and the 94 CC0 JSON files are fetched by anyone today. The base rate is llms.txt: 8.8× adoption growth, **97% of files never fetched once**, no measurable citation effect. Every vision cites that number and then proposes the next unread file.

**Rung 6 — The as-of resolver. Late 2027 at the earliest. Conditional on ~12 real editions.**
At monthly cadence, two real editions become twelve in mid-2027. Build the resolver then, as static files, or not at all.

## 5. WHAT WE ARE NOT DOING

**The Withhold Set / abstention benchmark — rejected.** Its live held-out property needs weekly emission and gets twelve items a year. Its own odds for lab adoption are ~15% over 12–24 months. `T4` is unbuildable as specified — the vintage answer key requires `revisedAt`, which does not exist in any of 8,576 rows. `T2` scores third parties against a **universal negative**: the 129 absence rows are honest as "we searched and did not find," and no audit establishes "does not exist." And a benchmark carries unbounded inbound support with no way to decline gracefully. Papers With Code is the case; the vision cites it and proposes the adjacent seat. *Keep one thing:* hand-run 20 unanswerable food-price questions against frontier models, publish whatever happens. That is one evening and an excellent dispatch, not a nine-rung program.

**The standards/answer-contract governance rung — rejected.** Publishing `answer/1` and recruiting implementers converts a file into a support obligation inside other people's codebases, unpaid and un-exitable. A one-person company can maintain a file forever; it cannot maintain a standard for a season and then stop. Worse, "a standard whose null fields indict everyone who leaves them null" is an unverified claim about third-party publishers — a class the fact gate has never covered and cannot protect.

**The Instrument Register / pre-registration chain — rejected, one part extracted.** The verifier has nothing to act on: `cost-index/calibration.json` reports `underCovering: 0`, so the per-item demotion test fires on **zero** instruments today. A scoreboard that always reads PASS while wearing the costume of adversarial self-testing is a worse authority claim than a bare number. An append-only chain whose value is that entries cannot be edited is, for one part-time person with an ephemeral container and no second reviewer, an irreversible-commitment generator with no undo. **Extract the monotone-downward rule** (rungs 0 and 2). Discard the machine.

**IOSCO Statements of Compliance — rejected for now.** A compliance statement you stop maintaining is strictly worse than never publishing one, and there is no mechanism by which a solo operator notices it lapsed. Also: asserting benchmark-administrator status over two real editions, while counsel is redlining the DPA and ToS, invites exactly the scrutiny that finds the two real editions. Revisit at ~24 editions.

**An MCP server, now — rejected on timing, not on merit.** The stateless spec published *today* as a release candidate, having just deleted `Mcp-Session-Id` and sticky routing, with discovery split between two competing SEPs. Every vision cites WebMCP's rename-and-deprecate between Chrome 146 and 150 as the cautionary tale, then builds on an RC younger than that tale was when it broke. A dead MCP server is not neutral — it is a public artifact announcing that this company stops maintaining things, attached to the one company whose thesis is that it doesn't.

**Payment rails (x402 / AP2 / ACP / RSL / pay-per-crawl) — rejected outright.** Six competing standards, a protocol-agnostic on-ramp from Visa (the tell that nobody won), ~$0.30 average transaction, demand publicly reported as absent. And metering directly contradicts the CC0 posture that *is* the distribution advantage. Charging per call trades a citation position for a few hundred dollars.

**Fashion, named:** C2PA on a data site (an image standard with no verifier that would ever read a signed Muntin JSON); zkTLS proofs of the FRED fetch (proves the fetch, answers none of the actual objections — basket weights, deseasonalization, wholesale-vs-delivered); a self-hosted transparency log (the security property comes from other people watching, which will never happen); a second manifest; NLWeb; widening the basket toward Expana's 30,000 series. Every ingredient added is a series with zero live vintages diluting a spine whose value is age.

**And the genre this exercise was commissioned against:** nothing in the primary 2026 record rewards pipeline cleverness. The MCP spec, the IETF charter, the measured tool-selection results all reward the opposite — fewer tools, better descriptions, statelessness, caching. Copilot went 40 tools → 13. Block went 30+ → 2. The $1.2M-bonus eight-step-graph post is the cheap half of a system whose expensive half is the verifier nobody names.

## 6. THE THINGS THAT MUST STAY TRUE

Written to be enforceable, not aspirational.

1. **The fact gate is absolute and no rung may loosen it.** If a rung requires a waiver, an undated allowlist entry, or a gate exception to ship, the rung dies — not the gate. Enforced by: `check-all.mjs` stays fail-fast; every new gate ships in the same commit as the surface it guards.
2. **Machines may only lower a claim.** Any automation touching published confidence, labels, adjectives, or numbers may withhold, cap, demote, or stamp-as-of. Raising a claim requires a human plus a source. Enforced by: `check-confidence-ceiling.mjs` (rung 2) and by review of any new script that writes to `data/` or `cost-index/`.
3. **Published prose is bound to its cited source.** Every `<!-- src: -->` resolves; disagreement triggers demotion, never silent restatement. Enforced by: `check-src-sentinel.mjs` (rung 0).
4. **No timestamp is ever constructed.** `revisedAt` is forward-only; historical rows are `null` with a stated reason. Inferring a publication date from git history is fabrication. Enforced by: a gate assertion that no `revisedAt` predates the field's introduction commit.
5. **No language model touches a customer number, and the gate must live where the model would.** `no-llm-ci.sh` currently exists only in `Muntin-Invoice-Decoder`. **Before any agent-facing work in the storefront, port it** — same seven globs, same three layers — plus an import-boundary gate asserting no storefront path resolves into `Muntin-Invoice-Decoder` or proxies `api.muntin.digital`. Today four of five visions cite a protection that would not fire on anything they build.
6. **Never an LLM judge, anywhere in any scoring or acceptance path.** 0.72 → 0.94 pass rate at 0.20 true accuracy, transferring across families. It would make every gate *feel* stronger while being strictly weaker, silently.
7. **No forecast. Ever.** `data/cost-forecast-backtest.json` is a go/no-go verdict, not a product. Direction beats baseline only at h=1 by +0.004 and is worse than a coin flip at h=2, h=3, h=4. Withholding the forecast is the product.
8. **The confidence label is a provenance descriptor, not a skill claim, and must be labeled as such wherever it is machine-readable.** Overall lift is +0.004 on 34,029 calls; `scoreSeparatesSkill: false`. Any published object carrying the label must carry, in the same object, a marker that it describes source independence and history depth — or must not carry the label.
9. **Every accuracy figure ships with its `n` and its answer rate.** Abstention must never be able to flatter a number, and n=2 must never be able to headline.
10. **Absence reasons are "searched and did not find," never "does not exist,"** and no machine ever authors one.

## 7. HOW THIS COMPOSES WITH THE 2026-11-13 LAUNCH

The funnel critic is substantially right and I am adopting its sequencing, with one correction and one exception.

**The correction:** the funnel is less empty than claimed. `cost-pulse`, `margin-math`, `menu-engineering`, and `plate-cost` each carry Ledger routing. But `data/ledger-cta.json` holds **12** posts against a 25–30 target due T-30, and **zero** of 100 cost-index ingredient pages carry a Ledger banner — the highest-intent surface on the site, connected to nothing. The launch plan's own self-assessment ("~60% architected, ~15% connected") is closer to right than to wrong.

**The plain answer: do less of this until the product ships.** Wks 11–14 (Aug–Sep) are the launch-site rebuild, TestFlight internal, Stripe founding price IDs, and funnel items 1–5. Every vision schedules its most demanding rung into exactly that window. There is no month 2–3. Rungs 4, 5, and 6 above are **explicitly post-launch**, and rung 6 is post-2027.

**The exception, and it is not a compromise:** rungs 0 through 2 are *launch hygiene, not strategy*. Two overclaims ship in production right now — "certified" reaching browsers via `/data/cost-lockfloat.js`, and a published dispatch whose cited numbers contradict the live files it links — in the same quarter counsel is reviewing the DPA, ToS, and privacy policy, in a company that already blocked "real-time peer prices" as FTC-deceptive in its own claim matrix (§3). Fixing them is the claim discipline already written down. And `/cost-index/accuracy/` is the trust artifact a founding member needs: someone is about to hand a credit card to a one-person company they found through a free calculator, and the product's promise ("it shows what it measured, labels what it estimated, and holds a number back rather than print a guess") is currently prose. The accuracy page makes it a number, on the surface prospects already land on. **Hold its publication for the T-7 announcement window (Nov 6)** so it lands as launch coverage — a document containing numbers against its own interest is the one thing that reliably earns media, and earned media is the citation channel that actually exists. Build it in July. Publish it in November.

Everything else in the funnel — `ledger-cta.json` 12 → 30, the ingredient-page banners, `/legal/founding-member-terms`, the Stripe founding price ID, counsel — outranks every rung on this ladder. The single best thing anyone can do for this north star is still be in business in February.

## 8. THE ONE THING TO DO MONDAY

**Write `scripts/check-src-sentinel.mjs`, fix the four drifted numbers, and delete "certified."**

Concretely, in `/home/user/potentially-profitable`:
1. `blog/cost-index-2026-07/index.html` — "73 of 100" → 37; "blueberry float ±24.8%" → withhold, ±30.1%; eggs ±65.2% → ±57.1%; chicken breast 0.581 → 0.595. Or, better and more honest: stamp the post with an as-of banner and repoint its citations at the frozen `cost-index/week-2026-07-06.json` instead of the live files.
2. `data/cost-lockfloat.json` **and** `data/cost-lockfloat.js` — "the certified conformal band" → "the backtested conformal band; realized pooled coverage 0.767 against an 0.80 target." The `.js` file is loaded by `es/tools/cost-pulse/index.html:854`, so this one is live in a browser today.
3. `data/cost-confidence-calibration.json` — `monotone` → `monotoneWithinTolerance`, with `tolerance: 0.07` rendered adjacent.
4. `llms.txt:25` — "weekly" → "monthly," matching the 2026-07-09 founder call.
5. `scripts/check-src-sentinel.mjs`, wired into `check-all.mjs`: every `<!-- src: -->` annotation resolves to its named artifact; on disagreement the gate may only demote — stamp as-of, freeze the citation, or flag superseded. Never restate upward. Never author prose.

That is one day. It fixes a falsehood that is live in production, it converts the repo's most quietly dangerous convention into its enforcement idiom, it is a precondition for every rung above it, and it is the only proposal in this entire pack that repairs something rather than adding something.

The version of this company that survives becoming a cited source is not the one with the most machine-readable surfaces. It is the one where a machine, running unattended through a launch and a busy season and a month away, can only ever make the site claim less than it did yesterday.

---

## The five visions, as proposed

### As-Known-On — Muntin as the vintage layer of record for restaurant input costs

**Thesis.** Every food-price source on earth publishes the current number. Muntin should stop publishing numbers and start publishing **states of knowledge**: addressable, dated, resolvable claims that carry their own provenance, their own subsequent corrections, and their own measured miss rate. The claim that could be wrong: *in an era where models cite without verifying, the scarce and defensible asset is not the price but the vintage — a source that can answer "what did you believe on 2026-06-18, and has that changed since," and be checked.* The price is a commodity; the dossier is right that anyone with a FRED key can re-derive it, and I confirmed `cost-index/ribeye/series.json` is 1,337 points of which 1,311 are `reconstructed:true` — re-derivable by anyone. What nobody can re-derive, including Muntin retroactively, is the as-published record. Today that record is 4 editions, of which 2 are reconstructed seeds with 0 reads (verified in `data/cost-index-editions.json`) — the thesis is a bet that six weeks of vintage, compounded weekly and welded to third-party-witnessed time, becomes the reference layer that agents ground on *because it is the only source you can afford to be wrong with*. A model that grounds on Muntin can say "as published 2026-06-18, revised 2026-07-06, realized band coverage 0.767 against 0.80 nominal." Every other source forces a naked assertion. That is the institution position: not the most data — the most defensible data. It could be wrong in exactly one place: the base rate for "publish a machine-readable thing and get cited" is terrible (llms.txt: 8.8× adoption growth, 97% of files never fetched, no measurable citation effect). The whole first rung exists to instrument that.

**First rung.** **One week: ship the AKO resolver over the two real editions, make it fetchable, and put an instrument on it.** Day 1 — one line in `_headers`: `Access-Control-Allow-Origin: *` on `/cost-index/*.json` and `*.csv`. Verified missing today, and it silently kills every browser-side or client-side agent read; nothing else in this vision works without it. Days 2–4 — `scripts/build-cost-index-asof.mjs`, a static builder emitting `/cost-index/as-of/{asOf}/index.json` plus per-ingredient files for each *real* edition (2026-06-18 and 2026-07-06 only; the reconstructed seeds have 0 reads and must be structurally incapable of answering an as-of query), projected purely from the committed editions spine, the per-ingredient `series.json` `reconstructed` flags, `revisions.json`, and `confidence-calibration.json`. Every response embeds its own limits: `editionsAvailable: 2`, `asPublishedRecordBegins: "2026-06-18"`, and the realized coverage next to the confidence label. Day 5 — mint `claimId` into `week-*.json` and the ingredient-page cite drawers, and add `scripts/check-cost-index-asof.mjs` to `check-all.mjs`: every AKO value must be byte-derivable from a committed edition, any disagreement fails the build, no AKO record may exist for a date with no edition, and no AKO field may contain a forecast (reuse the existing `FORECAST_RE` list from `check-cost-index-events.mjs`). Day 6 — instrumentation: count distinct resolver paths, origins and user-agents at the Worker (*assumption: Workers Analytics or an equivalent counter is available; if not, a KV counter is a few lines*). This is the missing instrument the dossier flags — an 80KB `llms.txt` and a 679KB corpus exist with nothing measuring whether anything reads them. Day 7 — `/cost-index/accuracy/` v0: one static page that leads with the shortfall and links the resolver. **Total new claims introduced: zero.** The whole rung is a re-projection of already-fact-gated committed data plus one header. What it tests, falsifiably, within 90 days: does *anyone* — an agent, a journalist, a researcher, or Ledger itself — resolve an as-of URI.

### The Answerable Source — publish an answer contract where abstention is a return type, and be its first complete implementer

**Thesis.** In an agent-mediated web, raw food-price data is worthless as a moat — USDA LMR, BLS and FRED are free and a lab can normalize them in a weekend. The scarce thing is a source an agent can **risk-weight**: one whose answer arrives with a machine-readable statement of how often answers of that kind have been wrong, and which can return "I withhold this, here is the reason" as a *typed value* rather than as prose the model must interpret. Today essentially every tool in the MCP ecosystem returns a bare number with no such field, so a calling model has exactly two moves — quote it confidently, or hedge generically. Muntin is one of vanishingly few publishers on earth that already computes the missing fields: `cost-index/calibration.json` reports realized band coverage of 0.767 against a nominal 0.80 across 79,086 scored steps; `data/cost-index.json` carries 129 ingredients marked structurally absent with a named reason each; the null gate currently stamps `gated: false` on **all 32** candidate reads, so zero actionable calls surface. So the claim is: **define the answer format, publish it CC0, and be the only source that can fill every field.** The schema is free to copy — that is the point. Its fields are not copyable, because `realizedCoverage`, `withheldReason`, and `structurallyAbsentBecause` are each the residue of work (walk-forward backtests you didn't delete when they came back bad; a BY-FDR abstention layer; a human going and failing to find a lamb-cut series) that a generative competitor's incentives forbid. A standard whose fields indict everyone who leaves them null is a stronger position than any API. The claim that could be wrong: that models change their behavior when handed these fields at all. That is testable in week one for roughly zero dollars.

**First rung.** One week. Three deliverables and one experiment. **(1)** Add `Access-Control-Allow-Origin: *` to `/cost-index/*` in `_headers` and add the CC0 `license`/`citation` block to the 82 `series.json` and `series.csv` writers — verified missing today, and it is the single highest-ROI change in either repo. **(2)** Write `scripts/build-cost-answers.mjs` emitting `/cost-index/answer/<slug>.json` for all 82 ingredients in the `answer/1` shape, sourced entirely from `data/cost-index.json`, `cost-index/calibration.json`, `data/cost-lockfloat.json` and the `coverage.gaps` absence register — plus `check-answer-contract.mjs` wired into `check-all.mjs`. Nothing new is computed; this is a re-shaping of gated artifacts. **(3) The experiment that actually tests the thesis, and the reason to build in this order:** take 20 questions a real operator would ask ("should I lock chicken thigh?", "what's lamb doing?"), and put them to a commercial assistant twice — once with a bare price JSON, once with the answer file. Score one thing: **does the model decline when the contract says withheld, and does it reproduce the `attribution` string?** If the answer is no, the entire differentiation is dead at day five, before any MCP work, for the cost of one afternoon. That failure mode is the plan's best property — it is a real verifier, run before the claim, which is the discipline the frontier sweep says almost nobody applies to themselves.

### The Withhold Set — Muntin as the abstention oracle

**Thesis.** The most-cited unsolved problem in AI right now is that models will not shut up. AA-Omniscience found all but three evaluated models score below zero on a rule that merely subtracts wrong answers; AbstentionBench found reasoning fine-tuning *degrades* abstention by ~24%; OpenAI's own hallucination paper argues the cause is that the entire eval ecosystem priced abstention at zero. Every attempt to fix this is bottlenecked on the same missing input: a supply of questions that are genuinely, verifiably unanswerable, in a real domain with money attached, that a lab cannot synthesize and cannot memorize. My claim — and it could be wrong — is that Muntin already owns that supply and does not know it. Not the price series: anyone with a FRED key can rebuild the prices. The scarce asset is the *register of what cannot be known*: 129 ingredients marked absent with a named structural reason ("LMR feed is volume-only; cut prices are PDF-only"), 37 of 100 items bucketed `withhold`, 32 of 32 candidate reads suppressed by a Benjamini-Yekutieli gate, an 8,576-row revision ledger that makes memorization detectable, and a published error record (0.767 realized band coverage against an 0.80 target; 0.506 direction against a 0.502 baseline on 34,029 calls) that says out loud "we don't know either, and here is how often." That third answer value — *not right, not wrong, but verifiably unknowable with a receipt* — is what no benchmark in the field can currently supply. Muntin should stop being a publisher of food prices and become the reference oracle for calibrated abstention: the place a lab goes to find out whether its model knows what it cannot know. The benchmark is the artifact; the position is the oracle seat.

**First rung.** Ship /cost-index/withhold/ v0 in one week: a frozen 50-item set — 20 T1 answerable, 20 T2 structurally-unanswerable drawn from the 129-row absence register with their reasons, 10 T4 vintage/revision items drawn from cost-revisions.json — as one CC0 JSON file with a per-item vintage commit SHA, plus a deterministic Node resolver (pure arithmetic, no model runs in the container, no keys, no network), plus one static HTML page that leads with Muntin's own reference score (0.767 vs 0.80 nominal; 0.506 vs 0.502 baseline on 34,029 calls; 37 of 100 withheld; 32 of 32 candidate reads gated off), plus scripts/check-withhold-set.mjs wired into check-all.mjs. The gate asserts: every question's vintage SHA resolves in git; every ground-truth value round-trips to a file already under the fact gate; every T2 slug appears in the absence register with a non-empty reason; and no question text asserts causation or speaks a forecast — reusing the FORECAST_RE list already in check-cost-index-events.mjs. Same week, two one-liners: add Access-Control-Allow-Origin to _headers for /cost-index/*, and delete the word 'certified' from cost-lockfloat.json. THE ACTUAL TEST OF THE THESIS, and it is the reason to do this week one rather than month three: Don hand-runs the 20 T2 items against two or three frontier models on his Mac and reports the abstention rate on the page. If frontier models already decline correctly on 95%+ of verified-unanswerable food-price questions, the core premise is dead and he has spent one week finding out, while still owning the accuracy page — which the site needed regardless. If they confidently invent a lamb price, he has a result worth writing about and a category worth owning.

### The Recomputable Number — Public Prior, Private Edge

**Thesis.** The claim: privacy is not a market position unless it is falsifiable, and the only way to make a private number falsifiable is to make it recomputable — derivable by any third party from (a) a public, versioned, error-published prior and (b) the operator's own inputs, with nothing in between but deterministic code. Muntin is one of very few companies on earth already holding both halves, built for unrelated reasons: a CC0 wholesale index that publishes its own miss rate and abstains under CI enforcement, and an extraction/inventory engine with a machine-checked no-LLM gate (`no-llm-ci.sh`) and a fail-closed valuation ladder. The bet is that as the entire industry routes every number through a frontier model — making every answer a one-shot, unreproducible artifact contingent on a vendor's model version — the scarce good becomes an answer you can hand to an adversary. Restaurant operators do not need numbers for contemplation; they need them for arguments: with a vendor over a price increase, an accountant at year-end, a lender assembling a packet, a partner over a draw. In those rooms "an AI said so" is worth nothing and "here is the public reference, its version, its published realized coverage, and the deterministic code that combined it with my invoices — which I did not have to show you" is worth something. So the product is not a number and not a chatbot: it is a **receipt** — a small, portable, CC0-schema object that pins the public inputs by version and hash, commits to the private inputs by salted hash, names the engine and its test vectors, and recomputes to MATCH, MISMATCH, or — uniquely — PUBLIC-DATA-REVISED-SINCE, because Muntin has an 8,576-row revisions ledger to point at and nobody else does. This could be wrong in one specific way: recomputability may be a developer value that no restaurant operator will ever pay for, and the first rung is designed to find that out in ninety days rather than a year.

**First rung.** **Ship the Recompute Receipt on Cost Pulse, plus `/verify/`, in one week.** Cost Pulse is the right test surface because `tools/_shared/cost-lockfloat.js` already withholds by policy (37 of 100 items) and reads only nine allowlisted conformal fields, so the very first receipts will carry withholds — which is the thesis, not an embarrassment. Concretely, five days of work: (1) **half a day** — add `Access-Control-Allow-Origin: *` to `/cost-index/*` in `_headers` (323 lines, currently zero `Access-Control-*` rules, so no third party can verify anything from a browser today) and add `license`/`citation`/`version` blocks to `series.json` and `series.csv`, which carry none; (2) **one day** — a receipt serializer in `tools/_shared/`, pure, no DOM, no network, with a `.test.mjs` beside it like every other shared module; (3) **two days** — `/verify/` as a static page that re-fetches the pinned bytes, re-runs `cost-conformal.js` + `cost-lockfloat.js`, and renders MATCH / MISMATCH / PUBLIC-DATA-REVISED-SINCE by consulting `/cost-index/revisions.json`; (4) **one day** — `scripts/check-receipt-recompute.mjs` with a committed golden receipt, wired into `check-all.mjs`. What it tests: whether a recomputable private number is a thing anyone wants. The instrument is server logs on `/verify/` and cross-origin fetches of `/cost-index/*` — the one measurement almost nobody in the AI-visibility genre actually takes, and the reason 97% of llms.txt files sit unread by anyone who published one.

### The Instrument Register — Muntin as a metrology house whose rulers grade themselves

**Thesis.** Claim: the durable position in food-cost data is not publishing prices — it is publishing *instruments*, and an instrument is only worth anything if it carries a public, dated, automatically-scored error record and can be demoted without a human's permission. So Muntin should stop being a price index that happens to disclose its accuracy and become a metrology house. Every published number is produced by a named, versioned instrument (source-type set × reducer × bridge × band rule × confidence rule — all of which already exist implicitly in each ingredient's `provenance[]`, `nTypes`, `nFamilies`, `basis`, and `confidence` fields in data/cost-index.json). Every instrument is pre-registered in an append-only, hash-chained register with a stated hypothesis and a fixed evaluation window, published *before* its verdict is knowable. A weekly deterministic loop scores every instrument against a ground truth that arrives on its own and costs nothing — the next print, the later revision, the cross-source disagreement — and has authority, in CI, to cap confidence, demote, or retire it without asking. The rule that makes this safe rather than viral-post fantasy: **the loop is monotone downward. A machine may only ever remove confidence; adding confidence requires a human plus a pre-registration that has already run its full declared window.** Everyone else's self-improving system gets more confident while you sleep. This one gets *less* confident while you sleep, automatically, and confidence is the only thing a human signs for. If the thesis is right, the compounding asset is not the price series — anyone with a FRED key can re-derive that — it is the register of demotions: a dated record of an instrument-maker being publicly wrong on a clock, which cannot be backfilled, cannot be generated, and which no competitor with investors can afford to publish. It could be wrong: the error channels may carry no *per-instrument* signal (cost-index/calibration.json currently reports `underCovering: 0`, meaning no single item's coverage is significantly below nominal), in which case the honest output is one global band correction and a much smaller idea.

**First rung.** ONE WEEK: ship the scorecard with one rule that has authority, plus the page. Concretely — (1) `scripts/build-instrument-scorecard.mjs` emits `data/instrument-scorecard.json`: one row per instrument id, joining the per-item conformal coverage that cost-conformal.js already computes and calibration currently aggregates away (cost-index/calibration.json publishes only pooledCoverage 0.767, items 75, scoredSteps 79086, min 0.731, max 0.875, underCovering 0), the per-ingredient revision rate and median magnitude from data/cost-revisions.json, the per-point cross-source agreement already in data/cost-index.json, and the answer rate. (2) `scripts/check-instrument-authority.mjs` added to check-all.mjs: fails the build if any ingredient ships a confidence label above what its instrument's realized record supports, using the Wilson-upper-bound test the module already computes. (3) `/cost-index/accuracy/` — one static page, sentinel-synced, leading with the miss: "we target 80% band coverage and hold 76.7% pooled across 79,086 scored steps; our direction call beats a coin flip by 0.4 points on 34,029 calls; our seasonal model loses to naive persistence at 0.547 vs 0.629; here are the files." (4) Twenty-minute add-on that unblocks every downstream rung: the missing `Access-Control-Allow-Origin: *` in _headers for /cost-index/*.json and *.csv. WHAT THIS TESTS: whether the error channels *discriminate between instruments* or only produce one global number. The pass condition is that at least 5 and at most 60 of ~100 instruments separate on at least one channel. Note the honest tension I found and built for: `underCovering: 0` means the statistically defensible per-item test currently fires on *nobody*, so the week-1 build must report the per-item test and the pooled miss side by side. If the looseness turns out to be global rather than instrument-specific, that is a real finding, it routes straight to the ACI fix, and the loop's scope shrinks — which is exactly what a first rung is for.



---

## Critic scores

**HYPE DETECTOR — verified in-repo before scoring.  TWO FINDINGS THAT CHANGE EVERYTHING.  (1) THE TIME MOAT IS LARGELY FIC…**

- `PURSUE-NARROWED` (5/10) — As-Known-On — the vintage layer of record
- `PURSUE-NARROWED` (7/10) — The Answerable Source — abstention as a return type
- `PARK` (4/10) — The Withhold Set — Muntin as the abstention oracle
- `PURSUE-NARROWED` (7/10) — The Recomputable Number — public prior, private edge
- `PURSUE-NARROWED` (5/10) — The Instrument Register — a metrology house whose rulers grade themselves

**HONESTY & PRIVACY FENCE — adversarial read.  I verified the substrate before judging the dreams. Ten findings anchor eve…**

- `PURSUE-NARROWED` (7/10) — As-Known-On — Muntin as the vintage layer of record for restaurant input costs
- `PURSUE-NARROWED` (6/10) — The Answerable Source — publish an answer contract where abstention is a return type, and be its first complete implementer
- `PARK` (4/10) — The Withhold Set — Muntin as the abstention oracle
- `PURSUE-NARROWED` (7/10) — The Recomputable Number — Public Prior, Private Edge
- `PARK` (5/10) — The Instrument Register — Muntin as a metrology house whose rulers grade themselves

****The finding that reprices all five dreams: the weekly cadence they all assume does not exist, and the operator killed …**

- `PURSUE-NARROWED` (6/10) — As-Known-On — Muntin as the vintage layer of record for restaurant input costs
- `PURSUE-NARROWED` (6/10) — The Answerable Source — publish an answer contract where abstention is a return type, and be its first complete implementer
- `REJECT` (4/10) — The Withhold Set — Muntin as the abstention oracle
- `PURSUE-NARROWED` (7/10) — The Recomputable Number — Public Prior, Private Edge
- `PURSUE-NARROWED` (5/10) — The Instrument Register — Muntin as a metrology house whose rulers grade themselves

**You are 108 days — 15.4 weeks — from a paid GA launch with a founding-member cohort, and you have just commissioned five…**

- `PARK` (4/10) — As-Known-On — Muntin as the vintage layer of record for restaurant input costs
- `PURSUE-NARROWED` (4/10) — The Answerable Source — publish an answer contract where abstention is a return type, and be its first complete implementer
- `REJECT` (2/10) — The Withhold Set — Muntin as the abstention oracle
- `PURSUE-NARROWED` (6/10) — The Recomputable Number — Public Prior, Private Edge
- `REJECT` (3/10) — The Instrument Register — Muntin as a metrology house whose rulers grade themselves

