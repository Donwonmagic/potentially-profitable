<!-- PROVENANCE + STATUS — read before acting on anything below.

  Verbatim synthesis from a multi-agent strategy workflow, 2026-07-28. It is
  ADVISORY, not a decision of record. Nothing here is approved.

  Committed because the container is ephemeral: this lived only in /tmp. docs/
  is excluded from the deploy tar (verified 2026-07-28), so it is never served.

  TRUST CALIBRATION. Agent-produced. A subset was independently verified against
  the repo and is recorded in docs/handoff/strategic-council-board.md under
  "Verified facts" — those are reliable. Market and competitor claims are
  UNVERIFIED. The fact gate applies to this document like any other source:
  nothing here may be cited publicly without independent sourcing.

  VERIFIED FALSE — the headline "uncomfortable finding". Strategy 2 ("The
  Instrument") claims that of 19 ingredients withheld from the published CC0
  feed, "13 of those 19 still have a live /cost-index/<slug>/ HTML page
  rendering a reading", concluding "the machine feed abstains; the human page
  does not; the abstention is invisible on both."

  Checked directly on 2026-07-28. The withholding numbers are right: 100 tracked
  → 81 published → 19 withheld, 13 of which have an HTML page. Everything after
  that is wrong. All 13 of those pages explicitly abstain AND explain why — e.g.
  /cost-index/shrimp/ renders "Coverage in progress… we don't yet have a
  complete, free wholesale read we'd stand behind — so we're not publishing a
  number. The index shows a price only when public data supports an honest one."
  None renders a price. 13 of 13 abstain; 0 exceptions.

  The site's abstention discipline is intact on BOTH surfaces. Do not act on
  this finding. It is recorded here because it was the single most striking
  claim in the document and because it is a good example of why agent output
  gets verified before it is believed.

  KNOWN STALE PREMISE. Strategy 1 ("Freeze, Don't Delete") builds on
  data/article-cost-index-map.json, scripts/check-article-cost-index-map.mjs and
  scripts/inject-article-cost-reads.mjs, describing them as "already built and
  unshipped". Those files were written by an agent from a DIFFERENT workflow,
  were never reviewed, and were REMOVED from the branch in commit c454a320f —
  partly because one of them declared itself "HUMAN-AUTHORED" while being
  machine-generated. They are recoverable from c7e8de048 if the operator decides
  to build that path, but they do not exist on the branch today, and the "the
  wiring exists and has never been turned on" framing should be read with that
  in mind.
-->

# Legitimately useful — how to be better than the best

*Workflow run 2026-07-28 · 14 agents · 1,460,182 tokens.*

**The question asked.** "I want to make sure this is legitimately useful, beyond the glut of
information currently canvassing the web. How can we do this better than the best?"

**What it did.** Established who is actually best (trade press, vendor content marketing, USDA/BLS,
paid intelligence), what a working operator actually needs, what AI saturation has and has not
commoditised, and whether the corpus earns its keep — then defined an operational test for "useful",
proposed four strategies, and stress-tested them with three adversarial critics (anti-slop, evidence,
one-person-in-school).

---

# Is this legitimately useful? — the honest read, 2026-07-28

---

## 1. THE DIRECT ANSWER

**Most of the site is not useful. One part of it is the best thing of its kind on the public web, and it is almost entirely disconnected from everything you've written.**

The uncomfortable measurement holds up. I counted 40 library articles and 18 blog posts. Roughly 35 of them — web design, SEO, "does my restaurant need a website," "Toast vs Square vs Clover," schema markup, Google Business Profile — serve a business line your own project memory says is retired, in the one content category where the marginal value of another article is provably zero. Toast and 7shifts have staffed editorial teams with SEO specialists pointed at those exact queries. You cannot win there and the prize would be leads for a service you no longer sell.

Worse than the ratio: **zero deep links from any of the 40 library articles, or any of the 13 hand-written blog posts, to any of the 100 ingredient pages.** I checked directly. Every one of the ~100 deep links into `/cost-index/<slug>/` comes from the machine-generated dispatches. `library/what-beef-prices-mean-for-your-restaurant/` links `/cost-index/` six times and `/cost-index/ground-beef/` zero times. The prose and the measured asset are two websites sharing a footer.

And I have to correct something two of the strategy drafts told you. `data/article-cost-index-map.json`, `scripts/inject-article-cost-reads.mjs`, and `scripts/check-article-cost-index-map.mjs` **do not exist.** `find`, `ls`, and a repo-wide grep all return nothing. They lived on disk for a few hours today and were reverted in commit `c454a320f` — agent-authored code swept in by `git add -A`, never read by a human. Any plan that says "the wiring is built, just switch it on" is describing software that isn't there. Wiring articles to ingredient pages is a build, not a switch. (The honest de-scope: hand-write about twenty links across four articles. One hour. No build chain.)

**What is genuinely useful today, and I mean this literally:** `cost-index/ground-beef/` and its 99 siblings. Here is the working sentence, verbatim from the page:

> *"Pull your last ground beef invoice, in the same unit. Below the range is a good deal; inside is normal; well above is a vendor conversation."*

That page is the only thing on muntin.digital that changes what a person does. Note carefully **why** it works, because it is the whole answer to your question: it does not tell the operator the price. It tells them to bring their own invoice and compare it to a dated public range. The reader supplies the half that no model has. That's the product. Everything else on the site announces numbers at people.

Two live defects you should know about before anything else:

- **The abstention is inverted.** Your published feed tracks 100 ingredients and publishes 81 — 19 are withheld for staleness or low confidence. That withholding is correct and it's the discipline you're proudest of. But **13 of those 19 still render a live price on their HTML page** (shrimp, salmon-fillet, vegetable-oil, whole-salmon, tuna-loin, whole-lobster, watermelon, whole-halibut, whole-trout, octopus, whole-crab, salmon-skin-on-fillet, scallops), and the word "withheld" appears **zero times** in `cost-index/index.html`. The machine abstains, the human page contradicts it, and neither says so.
- **The refresh cron has missed two slots.** `data/cost-index.json` shows measured reads on 07-17, 07-20, 07-22 and nothing since, against a Mon/Wed/Fri cron. 07-24 and 07-27 produced no commit, in a week where you landed nine other commits. "The index runs itself" is the load-bearing premise of every plan in front of you and it is currently unverified. Check the Actions tab today.

---

## 2. THE TEST

Short enough to apply in your head, before you write a line:

> **Name the person, the decision, and the week-slot. Name the number that flips them from A to B, and the threshold it crosses. Name the free thing they'd use instead, and its specific defect. Name what would prove us wrong, and where they'd see it.**

Five names. If you can't fill all five from the artifact itself — not from your intent — it's interesting, not useful, and interesting is what the glut supplies for free.

Two rules that make it bite:

- **A category noun in any blank is a fail.** "Operators," "restaurants," "the market," "regularly." Specifics or nothing.
- **The flip is the whole game.** If the reader does the same thing whether the number is 4% or 14%, you wrote an explainer. "Now they understand why beef is expensive" is not an action.

Applied honestly, this fails `restaurant-prime-cost` — your best-sourced article, 18 citations — because prime cost is a definition and no value of any number sends the reader the other way. It passes `cost-index/ground-beef/`. The test doesn't reward topic. It rewards shape.

---

## 3. WHERE YOU CAN BE BEST IN THE WORLD

**Concede first, permanently, and stop thinking about these:**

| Dimension | Who owns it |
|---|---|
| Delivered/transacted price | Expana, MarginEdge ($350/mo/location), xtraCHEF, Buyers Edge |
| Audited measurement rigor | Expana — 90 IOSCO-assured assessments, annual external audit. You will never have an auditor. |
| Breadth | Circana SupplyTrack, Expana's 37,000+ series |
| Speed | USDA AMS publishes Baltimore terminal daily, free |
| Authority | BLS, USDA ERS, the National Restaurant Association |
| Distribution / link graph | Toast, DoorDash, 7shifts |

Anything requiring one of those is dead on arrival.

**The position that is actually open**, and it's narrow and real:

> Every free food-cost tool on the web asks the operator to type the ingredient price in. Every tool that supplies a real price is paid and reads your own invoices. Between "free arithmetic" and "$350 a month" there is nothing.

I had that checked against Supy, StockTake Online, foodcostcalculator.net, menucostcalculator.com, Toast's calculators, and MarginEdge's free download. All manual entry. None has a market behind it. **You have a market behind it, free, dated, and revisable.**

That's the structural claim, and it's checkable by a stranger in five minutes — which is what makes it different from "we're more authoritative."

Three things reinforce it, and each is expensive for a competitor precisely because it costs *refusal*, not money:

1. **You publish your error record.** `cost-index/revisions.json`, 8,576 entries, before → after → delta. A price reporting agency that did this would damage its subscription.
2. **You publish what you can't measure.** `data/cost-index.json` carries `measured: 101 / derived: 1 / absent: 129`, each gap with a written reason ("no free per-cut lamb wholesale price — LMR feed is volume-only"). Nobody publishes their holes, because publishing holes is negative-value to anyone selling coverage. This is unique and it is *not* useful to a chef deciding about limes — it's a trust signal, budget it in hours, don't call it the position.
3. **You refuse to answer.** Asked what butter did this week, a chatbot will always produce a number. Producing nothing, on policy, when you're capable of producing something, is a position generated output structurally cannot occupy — and it gets harder for them as models improve, not easier.

**One honest limit on the whole thesis that nobody in your dossier confronted:** the trade literature is clear that market data alone does not win a concession for a single-unit independent. Leverage is volume plus a credible willingness to switch. Your index supplies the knowledge half of D1/D2; the leverage half cannot be published into existence. That doesn't kill the position — knowing the market fell is still the precondition for asking — but don't let any page promise that the number wins the argument.

**And one free substitute nobody named:** Restaurant Depot. There's one in the DMV. An operator walks in and sees real prices on real SKUs today, free. Its defects are exactly your ground: no dated record over time, must attend in person, and no memory of what the rep claimed in April.

---

## 4. THE PLAN

Sort everything by one rule, because it's the only rule that survives a semester:

> **A recurring unit that is code is affordable. A recurring unit that is your sentences is not.**

**ARTIFACTS — compound while you're in class.**

**A0. FIRST MOVE — one day, and most of it is looking, not building.**

*Morning (2h, no code).* Log into Plausible and pull custom events for 2026-04-19 → today. Here's the thing the strategy drafts got wrong in your favor: **four of five tools have been emitting completion events for ~100 days.** I verified them — `Plate Cost Compute`, `Plate Cost Export`, `Plate Cost Signature`, `Cost Pulse Loaded`, `Cost Pulse Recipe Ripple`, `Menu Engineering Analysis/Whatif/Export`, `Margin Math PrimeCost/PriceRaise/BreakEvenCovers/DeliveryBreakeven`. You do not need to build instrumentation and wait thirty days. The number that decides whether anyone finishes a tool is already banked, collected before anyone had a stake in the answer. Then: GSC Performance → Pages, six months, export. Grep the Worker logs for `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`. Open the Actions tab and find out why 07-24 and 07-27 produced no read. Open restaurantfoodindex.com in a browser.

*Midday (30 min).* `tools/vendor-benchmark/index.html` has **zero** Plausible occurrences — plate-cost has 22. The tool that does the highest-value job has been live since June 2 and is completely dark. Tag it, add one completion event.

*Afternoon (3h).* Fix the abstention inversion. Stop rendering a reading for the 13 withheld slugs — replace the block with the withholding and its reason. Add a withheld count to `/cost-index/`. Add a gate that fails CI if a slug absent from the feed still renders a reading. This needs no analytics and no demand evidence: it's wrong at zero traffic and wrong at a million.

**A1. Convert the biggest commitment in the repo back into a machine.** `.github/workflows/cost-index-dispatch.yml` opens: *"MANUAL-ONLY (founder call 2026-07-09): the monthly dispatch is HAND-WRITTEN... the machine reminds, humans write."* `check-cost-index-dispatch-fresh.mjs` sets `MAX_LAG_DAYS = 38`; last edition 2026-07-06, so **CI goes red around 2026-08-13 and every month after** — mid-semester, forever. `scripts/build-cost-index-dispatch.mjs` still exists. Restore it as a **day-30 fallback**: if no hand-written edition has landed, auto-publish a machine edition, withheld where it must be. A withheld edition preserves the spine; a missing one destroys it; a red gate during finals gets ignored, and once you start merging past a red honesty gate the whole discipline is gone. Nobody proposed this and it matters more than most of what was proposed.

**A2. Reconcile direction before publishing it.** 29 of 80 parseable labels disagree with the reconciled `trend.dir`. It's latent today — `label` isn't in `cost-index/index.json`. The moment you publish a direction or run-length field, it becomes live. One gated commit, first.

**A3. Dry-run the down-move rule offline.** Before building anything, compute against `points[]` already on disk: how many ingredients have ever printed three consecutive reads below their own band? If the answer is near zero, `/cost-index/down/` dies for free in an afternoon. Nobody proposed this and it's the cheapest falsification available.

**A4. If A3 says it fires: ship `/cost-index/down/`.** Generated, cron-fed, degrades to "not enough history to call a run." Its recurring cost is a cron job.

**A5. Hand-write ~20 ingredient links into four articles.** `keep-plate-cost-honest`, `restaurant-prime-cost`, `restaurant-menu-engineering`, `what-beef-prices-mean`. One hour. No injector.

**A6. Publish the absence register** (`/cost-index/coverage.json` + a page). Cheap, and it backs a claim `/cost-index/` currently makes without evidence.

**COMMITMENTS — refuse or convert. These rot.**

- The hand-written monthly dispatch → convert (A1).
- Default-on editor's note → **refuse.** `data/cost-index-editors-notes.json` has exactly one key across four editions. Default-on turns a 25%-filled layer into a visible streak of blanks. Keep it opt-in, write one when you have one.
- The floor log (the Seam) → **refuse as a publication.** Best idea in the packet, worst risk profile. NLRA §7 protects nonsupervisory employees; an FOH manager likely sits outside it, so you have *less* protection than a line cook. Downside is the job, which funds the company, the 2027 product, and tuition. Upside is a few lines of redacted color that a reader cannot verify and that your own schema labels `first-hand-only`. Salvage the schema as *private* capture for Muntin Ledger, where arrived-vs-ordered and pack drift are computed from the operator's own invoices and carry no employment risk.
- Per-edition DOI minting → refuse unless the API call ships in the same commit. DOIs for editions 1–3 and none after looks worse than none.
- The weekly `.ics` → keep the quarterly one (D6 genuinely is quarterly). Make a weekly one opt-in from inside a tool after a first successful run. Never build a plan on it; you can't measure it, resend it, or fix it once installed.
- Any real-time alert with a reliability promise → refuse. A missed alert is a broken promise and there's nobody to answer the ticket.

**DEFER UNTIL AFTER THE COURSE:** the homepage rebuild and nav inversion (large, visible, unmeasured); the Baltimore/DMV metro column (genuinely uncontested — 673 Baltimore observations across 62 ingredients are already in `provenance` and thrown away at render — but it's a build with unvalidated demand); all new writing.

---

## 5. WHAT TO STOP

**Stop now, no analytics needed — four hard retirements:**
`library/menu-design-cuisines/` (433 words, orphan, retired product), `library/menu-design-themes/` (same), `blog/may-2026-wave-publishing-for-citation/` (a post about your own publishing wave), `blog/get-found-fathers-day-weekend-2026/` (expired seasonal). 301 to the nearest keeper, EN and ES, extend `check-removed-slugs.mjs` — and note its comment currently *protects* the two menu-design pages because "we keep" them. That comment is now false.

**Merge:** `third-party-delivery-comparison` + `third-party-delivery-economics` + `30-days-after-leaving-doordash` into `commission-free-online-ordering` (10 citations, genuinely margin content in a platform-comparison costume).

**Retire as an article:** `library/ingredient-yields` — 2,068 undated words, chatbot-substitutable, unfalsifiable. It's a tool input.

**Stop permanently:** net-new writing in procedural how-to, yes/no framing, product comparison from public specs, definitional glossary, restatements of official docs, roundups.

**Freeze the remaining ~30 — but correct the mechanism first.** The claim that one `noindex` stamp drops a page from four machine-facing surfaces is **false for the surface that matters most.** I read `scripts/build-llms-txt.mjs` — its `readMeta()` extracts title, description, and h1 and never inspects the robots meta. Sitemap, llms-full, and feed-discovery all honor `noindex`. llms.txt does not. It's a three-line fix plus a gate, and it must land *before* the loop runs, or 33 retired-line articles stay in the one file whose entire job is telling a crawling model what this domain is.

**And drop the hours-saved argument entirely — it's not true.** `check-locale-parity.mjs` line 50 skips `blog/` and `library/` on the forward check, and line 232 exits 0 on any drift in `--check` mode with a comment saying to flip it later. The ES mirrors cost zero CI today. Gates run on GitHub's machines, not your evenings. Frozen HTML nobody edits consumes no weekly attention. **Prune for signal, not for hours** — the case is what llms.txt and the sitemap say this domain is, and that case is strong enough alone. Sell it as time recovered and the payoff won't arrive.

**Do not 301 or delete anything else until the GSC export is in hand.** Freeze is reversible in an hour. A 301 that lands someone citing your schema-markup guide on a cost page is not.

---

## 6. WHAT WE DO NOT KNOW

| Assumption | Cheapest experiment | Cost |
|---|---|---|
| **Anyone has ever finished a tool run** | Plausible custom events, 2026-04-19 → today. Already collected. | A login |
| **The refresh cron is green** | Actions tab — why no read on 07-24, 07-27 | Minutes |
| **What the 35 retired-line articles earn** | GSC Performance → Pages, 6 months, export | 2 hours |
| **Any search demand for "wholesale [ingredient] price"** | Impressions on the 100 ingredient pages, same export | Included above |
| **The down-move rule ever fires** | Offline dry-run against `points[]` on disk | An afternoon |
| **Any AI system cites this domain** | Grep Worker logs for `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, and `chatgpt.com`/`perplexity.ai` referrers | Minutes |
| **restaurantfoodindex.com is dormant** | Open it in a browser | 1 minute |
| **Market data actually moves a price for a one-location independent** | You run it once, on one item, at your own rep conversation, and write down what happened | One conversation |

That last one is the biggest unaudited assumption in the entire packet. It sits under every strategy's payoff and nobody proposed to test it. It's n=1 and it's the only test available to you.

**One assumption that cannot be settled before 2028:** that anyone will want the archive. "A snapshot not taken cannot be taken later" is true. "Someone will want it" is untested and untestable at four editions. Keeping the spine unbroken costs almost nothing, so keep it — but do not let it justify any other spending.

---

## 7. THE ONE-LINE VERSION

> **Every free food-cost tool asks you what your ingredients cost. Muntin tells you — from a dated public price, kept unbroken, with every correction published and every gap it can't measure named — so you can hold it against the invoice in your hand.**

A competitor can't copy that, and not because it's hard. Expana would damage its subscription by publishing its error record. A GPO destroys its rebate by publishing the gap. Toast will never print a number that embarrasses a supplier. Everyone else in this market has a book. You don't — and this year, with the product deferred to 2027, that's the only asset you have that money can't buy.

**The honest closing note:** almost everything above that requires your sentences should wait until after the course. Everything that is a cron job, a template branch, a gate, or a one-time stamp should happen in the next two weeks — starting with the day described in A0, which is mostly reading dashboards you already own.

---

## The four strategies, as proposed

### Freeze, Don't Delete — one noindex stamp retires 35 articles from every machine-facing surface at once

**Thesis.** The site cannot be better than the glut while it is the glut. I verified the mechanism that makes this cheap: `scripts/build-sitemap.mjs` (line 112), `scripts/build-llms-txt.mjs`, `scripts/build-llms-full.mjs` and `scripts/inject-feed-discovery.mjs` all already honor `<meta name="robots" noindex>`. And 33 of the 35 retired-line articles are currently listed in `/llms.txt` — the one file whose entire purpose is telling a crawling model what this domain is. Right now it says: restaurant web-design blog.

So the correct subtraction is not of URLs. It is of **index surface and maintenance surface**, and one stamp per page does both: the page keeps 200-ing, keeps every inbound link (`noindex, follow`), keeps every external citation valid, and disappears from sitemap.xml (1,219 URLs), llms.txt, llms-full.txt and the feed simultaneously. It is fully reversible. A 301 is not.

This inverts the usual delete-vs-redirect debate. Freeze is the risk-free default; redirect is reserved for the handful of pages with no standalone reason to exist; delete is never. Slug immutability is untouched — CLAUDE.md forbids *renaming*, and freezing is not renaming.

The positive half costs zero new writing, because it is already built and unshipped: `data/article-cost-index-map.json` (created 2026-07-28, 6 edges), the gate `check-article-cost-index-map.mjs`, and the injector `scripts/inject-article-cost-reads.mjs` ("The Live Read"). I confirmed the injector appears in no workflow and no library article contains an ingredient deep link. The wiring exists and has never been turned on.

Subtraction is the only monotonic lever available. A new article can dilute topic, add gate load, and still fail the usefulness test. Freezing a retired-line article strictly reduces load and strictly increases topical concentration, and its only cost — forgone traffic — is measurable before you act.

**First move.** One day, entirely inside machinery that already exists, and it produces the artifact every later decision reads from.

**Morning — measure (2 hrs, no code).** Google Search Console → Performance → Search results → last 6 months → Pages tab → Export, all 58 EN + 51 ES URLs. Then GSC → Links → Top linked pages, export. Plausible is installed and first-party-proxied at `/api/event` (index.html:72, `_includes/footer.html`), so: Top Pages with an entry-page filter per retire candidate, counting sessions that later touched `/cost-index/*` or `/ledger/*`. If that segment does not already exist, create it now and note that this specific column cannot be filled for 30 days — freeze the rest anyway; the freeze is reversible.

**Afternoon — build the ledger and execute the free half (4 hrs).** Write `data/corpus-disposition.json` with the measured numbers pasted in and a tier per slug. Then execute end-to-end the four retirements that need no data at all: 301s in `_redirects` for `menu-design-cuisines`, `menu-design-themes`, `may-2026-wave-publishing-for-citation`, `get-found-fathers-day-weekend-2026` (EN + ES, 8 lines), extend `check-removed-slugs.mjs` and amend its now-false protective comment, delete their MP3s, flip their `data/article-audio.json` entries to `deferred`.

**Last 30 minutes — the proof-of-mechanism.** Stamp `noindex, follow` on exactly one Tier F candidate, run `node scripts/build-sitemap.mjs && node scripts/build-llms-txt.mjs`, and confirm the URL leaves both files. Once that diff is on screen, the remaining ~27 are a loop, not a decision.

Deliberately not in day one: the bulk freeze (waits for the GSC export) and the Live Read injector (day two — it is a build-chain change and deserves its own commit).

### The Instrument — the reading is the page

**Thesis.** Change the atomic unit of publication from the article to the reading. A "page" stops being a thing written to answer a query and becomes one ingredient, one date, one position in its own baseline band, one run-length, one revision history — or one stated absence with a reason. Prose survives in exactly three roles and no others: (a) the threshold sentence generated onto a reading, (b) Don's floor paragraph attached to a flagged mover, (c) method and refusal documentation. Everything else in the library is frozen, not improved.

The mechanism that makes this the right shape for one part-time person is the same mechanism that makes it non-glut: an instrument's marginal unit is a measurement cycle (cost: a cron job, already running Mon/Wed/Fri, 73 of 100 ingredients current to 2026-07-21), not an authoring session (cost: hours). Glut has unbounded supply at zero marginal cost. An instrument's supply is rate-limited by elapsed calendar and cannot be backfilled — a snapshot not taken on 2026-06-18 cannot be taken later by anyone, including Don.

The uncomfortable finding from this session is that the site is currently the inverse of an instrument in one specific, checkable way. Of 100 tracked ingredients, the published CC0 feed carries 81. The 19 withheld are 17 seafood items plus striploin and watermelon, dropped for staleness (asOf 2026-05-01 / 2026-06-01) or low confidence. That withholding is correct. But 13 of those 19 still have a live /cost-index/<slug>/ HTML page rendering a reading — and neither surface anywhere states that 19 were withheld or why. The machine feed abstains; the human page does not; the abstention is invisible on both. Muntin's single least-copyable asset is being exercised and then hidden.

**First move.** Ship /cost-index/down/ — the down-move ledger — generated entirely from data already on disk, and lift it into the homepage above-fold block.

Build: extend the record builder to compute `direction` and `runLength` from ingredients[k].points[] (newest-first; reduce on max asOf, do not slice(-1) — I made that mistake this session and it silently reads the oldest point) against pctInWindow, then render one line per ingredient whose run-length below its baseline band is ≥3 consecutive readings. Each line: ingredient, band, current pctInWindow, run-length, the date the run started, and a deep link to the reading. Items with nObs ≤ 1 or too few points render "not enough history to call a run" — the absence discipline applied to the ledger itself, not a hidden omission.

Same day, two smaller pieces that need no new computation: a withheld block stating "19 of 100 withheld — 17 stale beyond the 30-day bound, 2 low confidence" (a set difference between data/cost-index.json and cost-index/index.json, computable in ten lines), and a gate that fails CI if a slug absent from the published feed still renders a reading block on its HTML page.

Feasible in a day because the rails are finished: 44 cost-index scripts including build-cost-index-pages.mjs and build-cost-index-provenance.mjs, a working Mon/Wed/Fri refresh, and 114 check-*.mjs gates. This is a render-and-gate job over existing data, not new machinery. It is also the only surface in the plan that passes all four blanks on the day it ships.

### The Seam — a redacted floor log joined to the index

**Thesis.** The Cost Index measures the sell side's public reference price. Don stands on the buy side of that same transaction every week in the DMV. Nobody in the dossier's competitive map holds both: Expana surveys, MarginEdge holds invoices under contract, US Foods and Sysco *are* the sell side, Toast will not publish anything that embarrasses a supplier, and a content farm has no floor. The publication is the join — a dated, first-person, structured log of three things a floor can observe and no dataset in this category contains: (a) the reason a rep gave for a move, dated, vendor unnamed; (b) arrived-vs-ordered — short-ship, substitution, pack/spec drift; (c) a dated public price artifact from a Bethesda / Arlington / Silver Spring menu. Each entry attaches to the specific ingredient page the index already reads, so the seam renders exactly where the only passing surface in the repo already lives. Two design consequences follow and both are subtractions. The floor layer covers only the ~28 basket items a taqueria floor actually touches (lime, avocado, cilantro, onion, jalapeno, serrano, poblano, habanero, tomato, corn-on-the-cob, cabbage, romaine, pork-shoulder, pork-belly, chicken-thigh, ground-beef, short-rib, eggs, butter, vegetable-oil…) — outside that overlap the index is re-serving free federal data any agent with a FRED key fetches on demand, and inside it Muntin holds the only non-sell-side, non-generatable input in the category. And the entry is a filled schema, never composed prose: ≤320 characters into five fields, on a phone, in the walk-in — because a field survives a semester and a weekly essay does not.

**First move.** One day, three files, one real observation. (1) Create `data/cost-index-floor-log.json` with the five-field schema and the redaction rule written into `_doc`. (2) Write `scripts/check-cost-index-floor-log.mjs` enforcing the redaction blocklist, the 14-day recency bound, the required `verifiability` value, and the mandatory 'One floor, one week. Not a sample.' label; wire it into `check-all.mjs`. (3) Add the render block to `scripts/build-cost-index-pages.mjs` so an entry stamps a dated strip under the existing threshold block. Then log entry #1 from this week's actual shift — one observable ingredient, one of the three kinds, written the day it happened — and let it render. Nothing backfilled, nothing recalled, no second entry until the following week. If the gate rejects entry #1 because the only interesting version of it named a vendor or a price, that is the kill signal arriving on day one, which is the cheapest possible time to receive it.

### The Standing Order — move the centre of gravity from the library to the instruments that already exist

**Thesis.** The site does not need another article, and it does not need a new tool. It needs the tools it already built to be wired up, pointed at a moment, and put in the front door.

Measured in-repo today: `/home/user/potentially-profitable/tools/_shared/` holds 79 JavaScript modules and 47 `node:test` suites. Five tools are live (Plate Cost, Vendor Benchmark, Cost Pulse, Margin Math, Menu Engineering), all EN+ES, all reading `/data/cost-index.js` — a 535 KB static seed rebuilt automatically by `.github/workflows/cost-index-refresh.yml` (line 94, committed on line 256) every Monday, Wednesday and Friday. `scripts/check-tool-no-fetch.mjs` makes zero-fetch a CI-enforced build invariant, not a promise. So the instrument layer is already index-grounded, already self-updating three times a week at zero human cost, and already privacy-clean by gate.

Three findings say the problem is wiring, not building:

1. **46 of the 79 shared modules are loaded by no live tool page.** Among the orphans is `leak-of-the-week.js` — self-described in its own header as "the composable capstone… the SINGLE highest-value cost action this week — no dashboard to read, no nag." Its stated minimum contract is *Cost Index seed + `data/cost-pressure.json`* — both present, both on the automated refresh (`data/cost-pressure.json`, 86 KB, rebuilt 2026-07-23). It is unit-tested (`leak-of-the-week.test.mjs`) and connected to nothing. The Standard's own proof-of-satisfiability — "the down-move ledger" — is already written and switched off.

2. **The decision thresholds the Standard says the prose lacks are already in code.** `plate-advice.js` carries `DEFAULT_TARGET = 0.30` and `WATCH_BAND = 0.02` and forks to re-portion / re-price / hold. `cost-verdict.js` downgrades "structural" to "Watch" on thin data and withholds entirely when the multiplicity gate marks a move indistinguishable from the item's own noise. `vendor-ask.js` refuses to send an operator to fight a vendor over a market move because "a false alarm trains distrust." That is Blank 2 — a threshold with two sides and different behaviour on each — implemented, tested, and bilingual. The 40 library articles have none of it.

3. **The push channel exists and requires no server.** `tools/plate-cost/plate-cost.js:1367-1388` already emits a real `.ics` with `RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=8`, a `VALARM` at `TRIGGER:-P1D`, and a `URL:` field pointing back to the tool. The operator's own calendar is the delivery mechanism: no list, no mail service, no SLA, no subscriber data, no privacy exposure, nothing to break. It is currently set to quarterly — the cadence for D6 (the re-price window), which is the least frequent decision on the list.

The thesis: an article is read once and cannot be applied to the reader's numbers. An instrument is a decision procedure that a person runs against their own numbers, on a schedule, with a stated threshold and a public error record behind the number it uses. That is the difference between the glut and something that changes an order. Muntin already owns the harder half — a fact-gated, dated, revisable price source that no calculator on the web has. What it has not done is put that source in front of a decision at the moment the decision is made.

**First move.** One day, one file changed, no new data and no new prose: wire `tools/_shared/leak-of-the-week.js` into `/tools/cost-pulse/index.html` behind the basket already on that page, gated by `tools/_shared/cost-staleness.js` so items with a newest read older than 21 days are excluded and named rather than silently priced. Both modules are built, unit-tested, and currently loaded by nothing. The page already loads `cost-verdict.js`, so the calibrated Hold / Watch / Up-and-holding voice comes along unchanged and cannot drift from the ingredient pages.

Ship it dark-by-default: if nothing clears the bars the module returns `{leak: null}` and the card renders nothing. That behaviour is already in the contract and is the honest default.

The watchlist UI, the weekly Sunday `.ics`, and the analytics wiring are week two — each is a couple of hours, but only the first one is a day.


---

## Critic scores

**THE ANTI-SLOP CRITIC — verification-first review  I stripped the vocabulary and asked one question of each strategy: what does a r…**

- `PURSUE-NARROWED` (4/10) — Freeze, Don't Delete — one noindex stamp retires 35 articles from every machine-facing surface at once
- `PURSUE-NARROWED` (6/10) — The Instrument — the reading is the page
- `REJECT` (3/10) — The Seam — a redacted floor log joined to the index
- `PURSUE-NARROWED` (7/10) — The Standing Order — move the centre of gravity from the library to the instruments that already exist

**## What I checked, and what changed  I verified the load-bearing empirical claims in all four strategies against disk. Three findi…**

- `PURSUE-NARROWED` (6/10) — Freeze, Don't Delete — one noindex stamp retires 35 articles from every machine-facing surface at once
- `PURSUE-NARROWED` (6/10) — The Instrument — the reading is the page
- `PARK` (3/10) — The Seam — a redacted floor log joined to the index
- `PURSUE` (8/10) — The Standing Order — move the centre of gravity from the library to the instruments that already exist

**The one-person, in-school lens: ARTIFACTS compound while ignored; COMMITMENTS rot while ignored and decay into visible embarrassme…**

- `PURSUE-NARROWED` (8/10) — Freeze, Don't Delete
- `PURSUE-NARROWED` (8/10) — The Instrument — the reading is the page
- `REJECT` (3/10) — The Seam — a redacted floor log joined to the index
- `PURSUE-NARROWED` (7/10) — The Standing Order — wire the instruments that exist

