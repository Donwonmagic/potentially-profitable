<!-- GENERATED FILE — do not hand-edit.
     Source of truth: data/queue.json. Regenerate: node scripts/check-queue.mjs --render
     Drift is caught by: node scripts/check-queue.mjs --check -->

# The Queue

**The only place work is tracked.** `docs/handoff/strategic-council-board.md` keeps the
narrative history and loses the tracking job — see Q-050. Prior audits closed at **26%**,
and zero closures in company history came from anyone working an audit list, because only
an agent session produces work and none had ever been pointed at a backlog.

**Claiming and closing happen through the machine, not through this file:**

```sh
node scripts/check-queue.mjs                       # the gate — exits 1 on unclaimed HIGH work
node scripts/check-queue.mjs --claim Q-003 --by "session:$ID"
node scripts/check-queue.mjs --done  Q-003 --by "session:$ID"   # runs verify; refuses to close on failure
node scripts/check-queue.mjs --verify --all        # re-proves every closed item; reopens what regressed
```

**Strategy of record:** docs/editorial/decisions/ADR-022-the-queue.md

> Muntin sells a closed month: a dated, signed statement of food cost where Beginning + Purchases - Ending = Usage foots on screen, every estimate is labeled, and any number that cannot be stood behind is withheld. $600/location/month, hand-invoiced, ~40 locations ever, no billing code for the first cohort.

> **Doctrine.** Credibility is a CLOSING asset, not a demand asset. Pay the honesty debt IN FULL before amplifying a single page of reach.

---

## Right now

**Next:** `Q-001` — Founder runs one month end-to-end through his own product and records four numbers  _(HIGH, founder, 4-6h, product)_

**Gate:** 10 HIGH item(s) unclaimed → `check-queue` exits **1**.

**Board:** 27 items — 16 ready · 1 claimed · 10 blocked · 0 done.

**Needs Don (9):** `Q-001`, `Q-002`, `Q-005`, `Q-006`, `Q-009`, `Q-010`, `Q-030`, `Q-031`, `Q-053`.
These do not move without a signature, a conversation, a credential or a judgment.

---

## Ready (16)

Highest first. A HIGH row here is why the gate is red.

| ID | Item | Pri | Phase | Owner | Effort | Blocked by |
|---|---|---|---|---|---|---|
| `Q-001` | Founder runs one month end-to-end through his own product and records four numbers | HIGH | P0 | founder | 4-6h | — |
| `Q-002` | Written employer authorization before any real invoice data is published — or the specimen moves | HIGH | P0 | founder | 1h + a conversation | — |
| `Q-003` | The basis leak — feed.json publishes a BLS index value as $393.06/lb | HIGH | P0 | agent | 2h | — |
| `Q-004` | check-all is NOT idempotent — two runs give different totals and dirty the working tree | HIGH | P0 | agent | 3h | — |
| `Q-006` | Move FRED_KEY / BLS_KEY / AMS_KEY into GitHub Actions secrets | HIGH | P0 | founder | 20m | — |
| `Q-008` | llms.txt still tells crawlers the Cost Index publishes weekly | HIGH | P0 | agent | 15m | — |
| `Q-009` | Warrant canary, Q2 transparency report, changelog — sign them or retire them | HIGH | P0 | founder | 45m | — |
| `Q-010` | Take down the five posted prices; post 'Pricing set at the close of the pilot' | HIGH | P0 | both | 2h | — |
| `Q-050` | Freeze the board — the queue becomes the only place work is tracked | HIGH | RET | agent | 1h | — |
| `Q-051` | Stand up the cron consumer so the four nightly Issue-openers reach a human | HIGH | RET | agent | 2h | — |
| `Q-012` | ADR foreclosing the operator-submitter data lane — write it now, while writing it is free | MED | P0 | agent | 45m | — |
| `Q-023` | inventory-reconcile.ts:249 — an empty `if (estimated) {}` whose comment claims a behavior the code does not perform | MED | P1 | agent | 1h | — |
| `Q-032` | /tools/pack-check/ — ship the dead honesty engines as the public falsifier | MED | P2 | agent | 6h | — |
| `Q-033` | /cost-index/refusals/ and /cost-index/freshness/ — publish what Muntin will not say | LOW | P2 | agent | 4h | — |
| `Q-052` | Delete the 162 provably-dead pages — frozen AND orphaned | LOW | RET | agent | 2h | — |
| `Q-053` | Cross-repo PAT so the product inbox and the storefront queue are one list | LOW | RET | founder | 15m | — |

## In progress (1)

Claims expire after 7 days and are released by the machine.

| ID | Item | Pri | Phase | Owner | Effort | Blocked by |
|---|---|---|---|---|---|---|
| `Q-007` | 72 published falsehoods in the July dispatch — correct in place, wire check-src-sentinel | HIGH | P0 | agent | 5h | — |

## Blocked (10)

Blocked by an item that is still open. Unblocking is done by closing the blocker.

| ID | Item | Pri | Phase | Owner | Effort | Blocked by |
|---|---|---|---|---|---|---|
| `Q-005` | Green the deploy — the 5 builders absent from build.command | HIGH | P0 | both | 1h agent + Mac time for one builder | Q-004 |
| `Q-020` | Purchases leg: line_item_observations was built for price intelligence and reused unchanged | HIGH | P1 | agent | 8h | Q-001 |
| `Q-021` | Default count mode writes un-entered items at expected-on-hand, so their usage is arithmetically zero | HIGH | P1 | agent | 5h | Q-001 |
| `Q-022` | Purchases roll-up has no location predicate while counts are per-location | HIGH | P1 | agent | 4h | Q-001 |
| `Q-024` | Food-cost % prints against a partial POS denominator | HIGH | P1 | agent | 3h | Q-001 |
| `Q-011` | Kill the 2026-11-13 GA date and the three-months-free term everywhere they are written | MED | P0 | agent | 1h | Q-010 |
| `Q-025` | /close/limits/ — the append-only, code-cited defect register | MED | P1 | agent | 4h | Q-020, Q-021, Q-022, Q-024 |
| `Q-030` | The specimen close — one complete month with the exceptions shown | MED | P2 | both | 6h | Q-001, Q-002, Q-020, Q-021, Q-022, Q-024 |
| `Q-031` | Two CPA / bookkeeper conversations on the specimen close | MED | P2 | founder | 3h | Q-030 |
| `Q-040` | /close/apply/ replaces all four waitlist forms | LOW | P3 | agent | 5h | Q-010, Q-030 |

## Done (0)

Closed only by a `verify` command that exited 0. Re-proved by `--verify --all`.

_Nothing here._

---

## Detail

### `Q-001` — Founder runs one month end-to-end through his own product and records four numbers

**HIGH** · ready · P0 · owner **founder** · product · 4-6h · kind `fix`

After fifteen months the founder has never run the product once. Every independent critic named this the most valuable item in the material, and no agent session can substitute for it. Below ~70% invoice-dollar survival into a valued Purchases leg, the pilot does not open and the quarter is saved.

**Evidence**

- verdict:synthesis[8] — 'the twenty-invoice founder walk, promoted from eleventh to FIRST'
- verdict:ranked[1].verdict — 'three mandatory repairs', of which this is the second

**Only Don can do this:** Only Don has a real month of invoices, a real count, and the standing to judge whether the number is one he would sign.

**Done when:** docs/handoff/receipts/founder-walk.json exists in the PRODUCT repo, with a nonzero invoiceCount and all four numbers present and non-null: countMinutes, dollarSurvivalPct, needsReviewRows, legsFooted.

```sh
# cwd: product
node -e "const r=require('./docs/handoff/receipts/founder-walk.json');const need=['invoiceCount','countMinutes','dollarSurvivalPct','needsReviewRows','legsFooted'];for(const k of need){if(r[k]===undefined||r[k]===null)throw new Error('missing '+k)}if(!(r.invoiceCount>0))throw new Error('invoiceCount must be > 0');console.log('founder walk recorded:',JSON.stringify(r))"
```

### `Q-002` — Written employer authorization before any real invoice data is published — or the specimen moves

**HIGH** · ready · P0 · owner **founder** · both · 1h + a conversation · kind `fix`

The winning bet proposes publishing Tacombi's complete month — vendor names, negotiated prices, food cost — permanently and publicly, signed, by an employee, to sell his own company. Zero of six strategy proposals contain the words authorization, consent, or employer. The same rule retroactively covers the real invoice fixtures committed under an MIT LICENSE in the product repo: a hygiene problem today, an incident the moment that repo opens.

**Evidence**

- verdict:synthesis[13] — 'MY OWN GRAFT, non-negotiable'
- verdict:killed[8] — 'Publishing Tacombi's real September in full, forever, publicly'

**Only Don can do this:** A signature, and a conversation with an employer. No agent session can obtain consent.

**Done when:** docs/legal/specimen-authorization.md exists in the storefront repo and declares exactly one of three bases — `written-authorization` (with a signer, a date, and a scope), `redacted` (vendor identity and contract prices generalized), or `third-party` (a consenting restaurant) — and names the fixture files it covers.

```sh
# cwd: storefront
node -e "const fs=require('fs');const t=fs.readFileSync('docs/legal/specimen-authorization.md','utf8');const b=(t.match(/^basis:\\s*(written-authorization|redacted|third-party)\\s*$/m)||[])[1];if(!b)throw new Error('no `basis:` line declaring written-authorization | redacted | third-party');if(!/^signedOn:\\s*20\\d\\d-\\d\\d-\\d\\d/m.test(t))throw new Error('no signedOn: date');if(!/^covers:/m.test(t))throw new Error('no covers: list of fixture paths');console.log('specimen authorization basis =',b)"
```

### `Q-003` — The basis leak — feed.json publishes a BLS index value as $393.06/lb

**HIGH** · ready · P0 · owner **agent** · storefront · 2h · kind `fix`

cost-index/feed.json ingredients[41] publishes ground-beef at priceUsd 393.06, source 'bls', basis 'wholesale', unit 'lb' — a BLS INDEX VALUE rendered as dollars per pound on the machine-readable feed built for crawlers. cost-index/index.json publishes 5.51 for the same slug. 71.3x apart, on a public site whose entire differentiation is that it does not publish numbers it cannot stand behind. Verified 2026-08-07 by direct read of both files; exactly 1 of 82 feed ingredients diverges from index.json by more than 3x.

**Evidence**

- cost-index/feed.json — ingredients[41].reference = {priceUsd: 393.06, source: 'bls', date: '2026-06-01'}
- cost-index/index.json — ground-beef priceMedianUsd = 5.51
- scripts/check-cost-index-basis-leak.mjs — PASSES and names feed.json as covered; it cross-references at the INGREDIENT level, never at the basis of the observation rendered

**Done when:** The gate checks the OBSERVATION, not the ingredient: check-cost-index-basis-leak.mjs --self-test seeds a feed.json entry whose reference basis is an index value and FAILS on it; and no feed.json reference diverges from its index.json median by more than 3x.

```sh
# cwd: storefront
node scripts/check-cost-index-basis-leak.mjs --self-test && node -e "const f=require('./cost-index/feed.json'),i=require('./cost-index/index.json');const m=Object.fromEntries(i.ingredients.map(x=>[x.slug,x.priceMedianUsd]));const bad=f.ingredients.filter(g=>{const p=(g.reference||{}).priceUsd,q=m[g.slug];return p&&q&&(p/q>3||q/p>3)});if(bad.length)throw new Error('basis leak still live: '+bad.map(b=>b.slug).join(','));console.log('feed.json: 0 of '+f.ingredients.length+' references diverge >3x from index.json')"
```

### `Q-004` — check-all is NOT idempotent — two runs give different totals and dirty the working tree

**HIGH** · ready · P0 · owner **agent** · storefront · 3h · kind `fix`

Measured 2026-08-07 in this container: three consecutive `node scripts/check-all.mjs` runs, no other command between them, returned 311/320, 306/320 and 309/323 — the DENOMINATOR moved. Working-tree dirty count went 208 -> 215 across the runs. The deploy gate writes files while checking, which is why clearing reds locally never converges and why the founder's only feedback loop has a false-alarm rate he has learned to ignore (the board already records PR #536 'merged with three reds the founder accepted'). This is upstream of every other red: until check-all is a pure function of the tree, no agent session can prove it fixed anything.

**Evidence**

- audit §3 — 'verified across three full check-all passes (312 -> 317 -> 312)'
- measured 2026-08-07: 311/320, 306/320, 309/323; git status --short 208 -> 215

**Done when:** Two consecutive check-all runs on a clean tree produce byte-identical final lines AND leave the tree clean.

```sh
# cwd: storefront
test -z "$(git status --porcelain)" && node scripts/check-all.mjs > /tmp/qa.txt 2>&1; node scripts/check-all.mjs > /tmp/qb.txt 2>&1; test -z "$(git status --porcelain)" || { echo 'check-all dirtied the tree'; exit 1; }; diff <(tail -1 /tmp/qa.txt) <(tail -1 /tmp/qb.txt)
```

### `Q-005` — Green the deploy — the 5 builders absent from build.command

**HIGH** · blocked · P0 · owner **both** · storefront · 1h agent + Mac time for one builder · kind `fix`

check-all runs inside the Cloudflare deploy (wrangler.jsonc build.command), so a red gate blocks the deploy and no agent session reaches production. build.command runs 75 builders THEN check-all, so in-chain drift self-heals; the true blockers are the builders absent from that chain. build-ingredient-state-record needs the founder's Mac and API keys and cannot be cleared from a container — that half is founder-only.

**Evidence**

- audit §0 fact 4 — 'the true blockers are the 5 builders absent from that chain'
- measured 2026-08-07: Themes review board, Theme story pages, Cuisine landing pages, Cost-index picker, Ingredient state record all red

**Only Don can do this:** build-ingredient-state-record needs the operator's Mac plus the NASS/Census/EIA keys. The container has neither.

**Done when:** All five builders appear in wrangler.jsonc build.command, and check-idem-coverage classifies each as deploy-run rather than MANUAL.

```sh
# cwd: storefront
node -e "const t=require('fs').readFileSync('wrangler.jsonc','utf8');const need=['build-themes-review-board','build-theme-story-pages','build-cuisine-landing-pages','build-cost-index-picker','build-ingredient-state-record'];const miss=need.filter(n=>!t.includes(n));if(miss.length)throw new Error('absent from build.command: '+miss.join(', '));console.log('all 5 out-of-chain builders now in build.command')" && node scripts/check-idem-coverage.mjs
```

### `Q-006` — Move FRED_KEY / BLS_KEY / AMS_KEY into GitHub Actions secrets

**HIGH** · ready · P0 · owner **founder** · storefront · 20m · kind `fix`

The refresh workflow no-ops without the keys, holding last-good, so the editions spine stops advancing silently. The only unfabricatable asset this company owns is the 2,025 live-captured points and the dated publication chain, and it compounds ONLY if the cadence never breaks — 26 of 100 series are already frozen 58-77 days against a 120-day drop cliff. The highest-value single founder hour in the material after the walk, and the only move no agent can execute.

**Evidence**

- verdict:synthesis[12] — 'get the live fetch off the founder's Mac'
- audit §4 — '83,695 of 85,720 published observations are reconstructed; the genuinely unfabricatable asset is the 2,025 live-captured points'

**Only Don can do this:** The keys exist only on the operator's Mac. Writing a repository secret requires his GitHub session.

**Done when:** data/cost-index-editions.json has a commit newer than 2 days, authored by the refresh workflow rather than by hand.

```sh
# cwd: storefront
node -e "const {execSync}=require('child_process');const iso=execSync('git log -1 --format=%cI -- data/cost-index-editions.json').toString().trim();const age=(Date.now()-Date.parse(iso))/86400000;if(!(age<=2))throw new Error('editions spine last advanced '+age.toFixed(1)+' days ago — the refresh workflow is still no-opping');console.log('editions spine advanced '+age.toFixed(1)+'d ago')"
```

### `Q-007` — 72 published falsehoods in the July dispatch — correct in place, wire check-src-sentinel

**HIGH** · claimed · P0 · owner **agent** · storefront · 5h · kind `fix`

165 `<!-- src: -->` annotations in blog/cost-index-2026-07/index.html; at least 72 published claims are currently false; 61 point at files the append-only editions spine does not freeze. Every one was TRUE on publication day. Line 852 is a reader-visible cite drawer telling a skeptic the cited files are 're-checked in CI' when no such gate existed on disk — in a PUBLIC repo, verifiable in thirty seconds using the page's own instructions. Static prose cannot cite a moving file; the repair is to repoint dated prose at the frozen edition snapshot.

**Evidence**

- audit §1.3 — 'the single most dangerous artifact in either repo is line 852'
- verdict:synthesis[1] — 'the src-sentinel and corrections program, grafted whole and moved to Phase 0'
- scripts/check-src-sentinel.mjs — written 2026-08-07 16:50 UTC by a concurrent session; anchored `<!-- src: edition:YYYY-MM-DD ... -->` grammar

**Done when:** check-src-sentinel.mjs passes with zero unanchored annotations in blog/cost-index-2026-07/, it is registered in check-gate-coverage (wired or documented), and /cost-index/corrections/ carries an entry naming the gate that now prevents recurrence.

```sh
# cwd: storefront
node scripts/check-src-sentinel.mjs && node scripts/check-corrections-ledger.mjs && node scripts/check-gate-coverage.mjs
```

_Claimed by session:phase-e-honesty-debt at 2026-08-07T16:50:21Z._ Landed check-src-sentinel.mjs, check-corrections-ledger.mjs, build-corrections-page.mjs, data/src-sentinel-{budget,worklist}.json, data/cost-index-corrections.json and cost-index/corrections/. Observed on disk by the queue author at 16:55 UTC; not yet verified green.

### `Q-008` — llms.txt still tells crawlers the Cost Index publishes weekly

**HIGH** · ready · P0 · owner **agent** · storefront · 15m · kind `fix`

The cadence went monthly by founder call on 2026-07-09. llms.txt line 25 still says 'publishes weekly wholesale reference prices' — a false statement of fact aimed specifically at the machine readers this company is courting, in the file whose entire purpose is to be believed without checking. Cheapest honesty repair on the board.

**Evidence**

- llms.txt:25 — 'The Muntin Cost Index publishes weekly wholesale reference prices'
- .github/workflows/cost-index-dispatch.yml header — MONTHLY, hand-written, by founder call 2026-07-09

**Done when:** No shipped surface describes the index cadence as weekly, and the generator that produces llms.txt emits the corrected string so it cannot regress on the next build.

```sh
# cwd: storefront
node -e "const fs=require('fs');const bad=[];for(const f of ['llms.txt','llms-full.txt']){if(!fs.existsSync(f))continue;const t=fs.readFileSync(f,'utf8');if(/publishes weekly/i.test(t))bad.push(f)}const g=fs.readFileSync('scripts/build-llms-txt.mjs','utf8');if(/publishes weekly/i.test(g))bad.push('scripts/build-llms-txt.mjs');if(bad.length)throw new Error('still says weekly: '+bad.join(', '));console.log('cadence copy is monthly everywhere')"
```

### `Q-009` — Warrant canary, Q2 transparency report, changelog — sign them or retire them

**HIGH** · ready · P0 · owner **founder** · storefront · 45m · kind `decision`

Canary 89 days lapsed (last signed 2026-05-10, three monthly signings overdue); Q2 transparency 37 days past its own published date; changelog 40 days stale while methods/index.html:470 tells readers changes appear there. A lapsed canary is worse than no canary — it is the exact signal a canary exists to send. This company has retired exactly one subsystem in fifteen months, and recurring obligations run ~53 founder-hours/month against 13-26 available. The honest options are sign it on a cadence you will actually keep, or publish a dated retirement notice. Both are acceptable; leaving it lapsed is not.

**Evidence**

- audit §1.1 — the obligation table, 2026-08-07
- audit §1.1 — '~3 of 31 maintenance-hours-due were actually paid (~10%)'

**Only Don can do this:** A warrant canary is a personal attestation. An agent signing one would be the fabrication the whole fact gate exists to prevent.

**Done when:** For each of the three surfaces: either a signature/publication dated within its own stated cadence, or a dated retirement notice on the page and the promise removed from every surface that makes it.

```sh
# cwd: storefront
node scripts/check-queue.mjs --attest Q-009
```

### `Q-010` — Take down the five posted prices; post 'Pricing set at the close of the pilot'

**HIGH** · ready · P0 · owner **both** · both · 2h · kind `retire`

Five posted prices, zero coherent, one billable. pricing-constants.ts marks founding billable:false — no SKU, no priceIdForTier branch, no STRIPE_PRICE_* field — while Solo ($25) and Team ($60) are per_account with no location cap, so a three-location founding member pays $57 against an unlimited-location $25 tier, and the posted 150-invoice Solo cap is enforced nowhere. The strategy of record replaces all five with one price and, for the first cohort, no billing code at all.

**Evidence**

- verdict:killed[1] — the $19 rate and the Solo/Team/Accountant tiers
- verdict:synthesis[14] — 'no billing code for the first cohort'
- apps/web/lib/pricing-constants.ts — the registry that documents its own four-part gap

**Only Don can do this:** Setting a price is a founder call. The agent half is removing the copy and collapsing the registry once the call is made.

**Done when:** No shipped web surface states a dollar price for the product; pricing-constants.ts declares exactly one entry ($600, per_location, billable:false, hand-invoiced); check-pricing-consistency passes.

```sh
# cwd: product
node scripts/check-pricing-consistency.mjs && node -e "const t=require('fs').readFileSync('apps/web/lib/pricing-constants.ts','utf8');for(const s of ['19','25','60','179']){}if(/60000|\\$600/.test(t)===false)throw new Error('the $600 per-location price is not declared');console.log('single-price registry present')"
```

### `Q-011` — Kill the 2026-11-13 GA date and the three-months-free term everywhere they are written

**MED** · blocked · P0 · owner **agent** · both · 1h · kind `retire`

trial_period_days is set nowhere so the term was never implemented, and three months from mid-November lands the first charge in mid-February — Census MARTS medians Jan 0.913 / Feb 0.917, the second-worst cash month of the restaurant year. A locked launch date with no billing engine behind it is a promise the company cannot keep, on a date it chose badly. ADR-020 already deferred the launch; the copy has not caught up everywhere.

**Evidence**

- verdict:killed[0]
- board CURRENT STATE — 'ten hand-written copies of 2026-11-13 sat in' copy while LAUNCH_DATE_ISO called itself canonical and nothing checked them

**Done when:** The string 2026-11-13 and any 'three months free' phrasing appear in no shipped surface of either repo, and a gate makes their reappearance fail.

```sh
# cwd: storefront
node scripts/check-queue.mjs --grep-absent '2026-11-13' --grep-absent 'three months free'
```

### `Q-012` — ADR foreclosing the operator-submitter data lane — write it now, while writing it is free

**MED** · ready · P0 · owner **agent** · storefront · 45m · kind `retire`

Accepting operator-submitted prices converts the index's one honest property — every number traceable to a public government series — into a permanent, undelegatable founder moderation queue, in a company already ~2.7x oversubscribed. Closing a door costs nothing today and costs everything after the first submission arrives.

**Evidence**

- verdict:synthesis[7]
- verdict:killed[11] — 'killed pre-emptively while killing it is still free'

**Done when:** An ADR exists in docs/editorial/decisions/ with Status: Accepted, stating that Muntin does not accept operator-submitted price observations into the Cost Index, and naming the mechanism that would have to change for that to be revisited.

```sh
# cwd: storefront
node -e "const fs=require('fs');const f=fs.readdirSync('docs/editorial/decisions').find(n=>/operator-submitter|submitter-lane/.test(n));if(!f)throw new Error('no operator-submitter ADR on disk');const t=fs.readFileSync('docs/editorial/decisions/'+f,'utf8');if(!/Status:\\s*Accepted/i.test(t))throw new Error(f+' is not Accepted');console.log('foreclosed by '+f)"
```

### `Q-020` — Purchases leg: line_item_observations was built for price intelligence and reused unchanged

**HIGH** · blocked · P1 · owner **agent** · product · 8h · kind `fix`

The Purchases leg of the identity the company is selling is fed by a table designed for a different job. It drops credit memos, drops $0 promo lines, drops unparseable pack tokens, and stores unit_price x quantity rather than the printed line_total. Every one of those biases the Purchases leg — and therefore the headline food cost — in a direction a CPA is professionally trained to catch. This is the product spec now, not a defect list: correctness IS what is being bought at $600.

**Evidence**

- brief: correctness debt item 1
- apps/api/src/lib/inventory-purchases-store.ts — 'value uses the ACTUAL unit_price_cents x quantity that was paid'

**Done when:** A test asserts each of the four behaviors on real-shaped fixtures — a credit memo reduces Purchases, a $0 promo line appears with zero value rather than vanishing, an unparseable pack token surfaces as an uncovered row rather than a silent drop, and the stored value reconciles to the printed line_total within rounding — and each assertion FAILS when its fix is reverted.

```sh
# cwd: product
pnpm --filter @muntin/api exec vitest run -t 'purchases leg'
```

### `Q-021` — Default count mode writes un-entered items at expected-on-hand, so their usage is arithmetically zero

**HIGH** · blocked · P1 · owner **agent** · product · 5h · kind `fix`

An item nobody counted comes out with Beginning + Purchases - Ending = 0 usage. That biases the headline food-cost percentage LOW, silently, in exactly the direction that makes a restaurant look healthier than it is. A number biased low is the one number an evidence brand cannot print.

**Evidence**

- brief: correctness debt item 2

**Done when:** An un-entered item is reported as UNCOUNTED and excluded from the usage roll-up with the exclusion disclosed on the close, rather than imputed at expected-on-hand; a test pins the behavior and fails when the default is restored.

```sh
# cwd: product
pnpm --filter @muntin/api exec vitest run -t 'uncounted item does not impute zero usage'
```

### `Q-022` — Purchases roll-up has no location predicate while counts are per-location

**HIGH** · blocked · P1 · owner **agent** · product · 4h · kind `fix`

inventory-purchases-store.ts:19-20 states plainly: 'No location filter: invoices are not tied to a location_key, so for the single-location MVP the window is org-wide.' Counts ARE per-location. A two-location org therefore cross-contaminates its Purchases leg — and the buyer profile in the strategy of record is a 1-3 location independent. The MVP assumption and the target customer contradict each other.

**Evidence**

- apps/api/src/lib/inventory-purchases-store.ts:19-20
- verdict:theCompany — 'the owner of a 1-3 location independent'

**Done when:** Either invoices carry a location attribution and the roll-up filters on it, or a multi-location org's close REFUSES to print a per-location food cost and says why. A test covers both a single-location and a two-location org.

```sh
# cwd: product
pnpm --filter @muntin/api exec vitest run -t 'purchases roll-up is location-scoped'
```

### `Q-023` — inventory-reconcile.ts:249 — an empty `if (estimated) {}` whose comment claims a behavior the code does not perform

**MED** · ready · P1 · owner **agent** · product · 1h · kind `fix`

The block reads `if (estimated) { /* counted toward confidence below via estimatedCount/valued share */ }` — and does nothing. estimatedCount is incremented 39 lines earlier at line 210 under a DIFFERENT condition than the `estimated` computed at 244-247. So either the comment is false or the accounting is. In the one file that computes the honesty checksum for the product being sold, a comment that lies is worse than a bug.

**Evidence**

- apps/api/src/lib/inventory-reconcile.ts:249 — empty block
- apps/api/src/lib/inventory-reconcile.ts:210 — estimatedCount += 1 under a different predicate

**Done when:** The dead block is gone and a test pins which predicate actually drives estimatedItems in the reconciliation output, so the two can never diverge silently again.

```sh
# cwd: product
node -e "const t=require('fs').readFileSync('apps/api/src/lib/inventory-reconcile.ts','utf8');if(/if \\(estimated\\) \\{\\s*\\/\\*[^*]*\\*\\/\\s*\\}/.test(t))throw new Error('the empty if (estimated) block is still there');console.log('dead block removed')" && pnpm --filter @muntin/api exec vitest run -t 'estimatedItems'
```

### `Q-024` — Food-cost % prints against a partial POS denominator

**HIGH** · blocked · P1 · owner **agent** · product · 3h · kind `fix`

The percentage is correctly withheld when net sales is null — but a POS window with 12 of 30 days settled prints against a partial denominator, which is worse than withholding because it looks like an answer. This is the withhold-rather-than-guess promise failing in the exact place the promise is sold.

**Evidence**

- brief: correctness debt item 5

**Done when:** The percentage is withheld unless the sales window covers the count period, with the shortfall named on the close (e.g. '12 of 30 days settled'); a test pins the refusal.

```sh
# cwd: product
pnpm --filter @muntin/api exec vitest run -t 'food cost withheld on partial sales window'
```

### `Q-025` — /close/limits/ — the append-only, code-cited defect register

**MED** · blocked · P1 · owner **agent** · storefront · 4h · kind `mechanism`

Every defect entered with file and line, maintained as a by-product of the fix commits, never retroactively edited. Fact-gate-safe by construction because every line cites a file rather than a market claim. Under a $600 close it stops being an apology and becomes the artifact the price is justified by — the CPA reads it before recommending you, and nobody else in the category publishes it.

**Evidence**

- verdict:synthesis[3]

**Retires**

- The obligation to describe product limitations in prose on /ledger/ and in sales conversations — the register becomes the single place a limitation is stated, and the marketing copy links rather than restates.

**Done when:** /close/limits/ ships, generated from a committed append-only JSON, every entry carrying file:line and the queue ID that closed it; a gate fails if an entry is edited rather than appended.

```sh
# cwd: storefront
node scripts/check-limits-register.mjs
```

### `Q-030` — The specimen close — one complete month with the exceptions shown

**MED** · blocked · P2 · owner **both** · storefront · 6h · kind `fix`

Nobody in this category publishes a complete worked close with its exceptions visible. It is the single artifact that converts a forty-minute read into a recommendation, and it is the storefront's whole job under the qualification doctrine.

**Evidence**

- verdict:theCompany — '/close/specimen/ ... authorized, redacted, or from a consenting restaurant'

**Only Don can do this:** The month is his; the signature on it is his.

**Done when:** /close/specimen/ publishes one month where the four legs foot on screen, every estimate is labeled, and every exception carries a receipt — under the basis declared in docs/legal/specimen-authorization.md.

```sh
# cwd: storefront
node scripts/check-specimen-close.mjs
```

### `Q-031` — Two CPA / bookkeeper conversations on the specimen close

**MED** · blocked · P2 · owner **founder** · none · 3h · kind `decision`

Two questions decide the commercial argument: does this tie to what you call food purchases, and is a disclosed market index acceptable as a management estimate. The half-the-labor-at-twice-the-sticker argument dies if the CPA rejects the market prior — which is why the conversation is scheduled BEFORE the price is posted.

**Evidence**

- verdict:theCompany — Phase 2

**Only Don can do this:** A relationship and a conversation. No agent can hold it, and its output is a professional judgment.

**Done when:** docs/handoff/receipts/cpa-review.json records, for each of two named reviewers, a date and a verdict on both questions (tiesToFoodPurchases, marketPriorAcceptable) with a free-text objection field.

```sh
# cwd: storefront
node -e "const r=require('./docs/handoff/receipts/cpa-review.json');if(!Array.isArray(r.reviews)||r.reviews.length<2)throw new Error('need two reviews');for(const v of r.reviews){for(const k of ['reviewer','date','tiesToFoodPurchases','marketPriorAcceptable']){if(v[k]===undefined||v[k]===null)throw new Error('review missing '+k)}}console.log(r.reviews.length+' CPA reviews recorded')"
```

### `Q-032` — /tools/pack-check/ — ship the dead honesty engines as the public falsifier

**MED** · ready · P2 · owner **agent** · storefront · 6h · kind `fix`

pack-shrink.js, vendor-ask.js, vendor-switch.js, silent-bleed.js and url-fragment.js are on disk, parity-locked to the product's TypeScript, EN+ES, honesty-gated, and referenced by ZERO of 1,327 pages. A tool that visibly declines to answer when the evidence is inconclusive is a stronger honesty proof than the 89 pages that merely claim honesty — and a stranger can run it in a browser with no repo access, which is exactly what no-llm-ci.sh (private repo) can never be.

**Evidence**

- verdict:synthesis[6]
- verdict:killed[7] — 'Any public no-llm-ci.sh falsification command, until the script is publicly executable'

**Done when:** /tools/pack-check/ ships, is reachable from at least one indexed page, and a test drives it with an inconclusive input and asserts it REFUSES rather than answers.

```sh
# cwd: storefront
node scripts/check-pack-check-tool.mjs
```

### `Q-033` — /cost-index/refusals/ and /cost-index/freshness/ — publish what Muntin will not say

**LOW** · ready · P2 · owner **agent** · storefront · 4h · kind `fix`

The 100 pre-written toHigh blocker strings in data/cost-index-health.json and the 42 written structural gap reasons in data/cost-index.json#coverage.gaps already exist. Nobody has to write them. Publishing them makes highEligible:0 a disclosed fact rather than a discoverable one — the cheapest confidence artifact available.

**Evidence**

- verdict:synthesis[11]

**Done when:** Both pages ship, generated from those two files rather than hand-written, and re-generate identically under --check.

```sh
# cwd: storefront
node scripts/build-refusals-page.mjs --check && node scripts/build-freshness-page.mjs --check
```

### `Q-040` — /close/apply/ replaces all four waitlist forms

**LOW** · blocked · P3 · owner **agent** · storefront · 5h · kind `retire`

Exactly 4 of 1,368 pages carry action="/api/waitlist". At forty customers ever, qualification IS the funnel: an application with five qualifying questions (locations, active vendor count, broadliner yes/no, who does the count today, who reviews the number) beats a waitlist that collects an address and produces a founding-lead enum nobody reads.

**Evidence**

- audit §0 fact 2 — 'exactly 4 of 1,368 pages carry action="/api/waitlist"'
- audit §2 item 7 — 'listFounding() has no callers'

**Retires**

- All four /api/waitlist forms and the founding-lead enum path behind them.

**Done when:** Zero pages carry action="/api/waitlist"; /close/apply/ ships with the five qualifying fields; a submission lands somewhere with a caller that reads it.

```sh
# cwd: storefront
node -e "const {execSync}=require('child_process');const n=execSync('grep -rl \\\"/api/waitlist\\\" --include=*.html . || true').toString().trim();if(n)throw new Error('waitlist forms still live:\\n'+n);console.log('0 waitlist forms')"
```

### `Q-050` — Freeze the board — the queue becomes the only place work is tracked

**HIGH** · ready · RET · owner **agent** · storefront · 1h · kind `retire`

docs/handoff/strategic-council-board.md is 1,488 lines and board-archive.md is 993, and the measured close rate of work recorded on them is 26% with ZERO closures ever coming from anyone working the list. The board is an excellent narrative history and a failed tracker. It keeps the first job and loses the second. This is the retirement that pays for the queue: two tracking surfaces become one, and the queue is machine-read at session start rather than hoped-for.

**Evidence**

- audit §0 — 'auditing at Muntin has a 26% close rate, and zero closures came from anyone working an audit list'
- wc -l docs/handoff/strategic-council-board.md = 1488; board-archive.md = 993

**Retires**

- The board's CURRENT STATE / in-flight / open-questions tracking role (narrative history is kept, append-only).
- Section 2 of docs/handoff/company-audit-2026-08-07.md as a live to-do list — the audit is frozen as a dated finding document.
- Ad-hoc 'next steps' sections in the other handoff docs, which become pointers.

**Done when:** The board's header states that work tracking has moved to the queue and links it; no NEW open-item list is appended to the board after this date; the audit's section 2 carries a dated pointer to the queue items that absorbed it.

```sh
# cwd: storefront
node scripts/check-queue.mjs --retirement Q-050
```

### `Q-051` — Stand up the cron consumer so the four nightly Issue-openers reach a human

**HIGH** · ready · RET · owner **agent** · product · 2h · kind `mechanism`

mutmut-nightly, flake-tracker and competitor-claims open Issues into a queue nothing consumes. ocr-bench-nightly does not even do that — its permissions are `contents: read`, so a preprocessing regression fails into the Actions tab and is seen by nobody. Four alarms, zero listeners. The consumer ingests all four into data/queue-inbox.json and maintains ONE standing Issue rather than a new one per finding.

**Evidence**

- .github/workflows/mutmut-nightly.yml, flake-tracker.yml, competitor-claims.yml — all `gh issue create`
- .github/workflows/ocr-bench-nightly.yml — `permissions: contents: read`, no issue step; verified 2026-08-07

**Retires**

- The unbounded per-finding Issue backlog: from this workflow forward, the four crons' findings are represented by ONE rolling `[queue]` Issue plus a machine-readable inbox, not by an ever-growing label pile.

**Done when:** queue-consumer.yml has run at least once, data/queue-inbox.json exists with a `lastRun` newer than the heartbeat window, and check-queue --heartbeat passes.

```sh
# cwd: storefront
node scripts/check-queue.mjs --heartbeat
```

### `Q-052` — Delete the 162 provably-dead pages — frozen AND orphaned

**LOW** · ready · RET · owner **agent** · storefront · 2h · kind `retire`

Already noindexed AND already unlinked: no crawler sees them, no internal link leads to them. The one deletion that risks nothing and needs no traffic data. Explicitly NOT counted as the retirement that pays for a new mechanism — retiring what nothing reaches retires zero obligation. That honest accounting is the difference between motion and closure.

**Evidence**

- verdict:synthesis[9] — 'the provably-dead cut as the only Phase-0 deletion'

**Done when:** The pages are gone or 301'd, data/link-graph.json rebuilds with no dangling edges, and the sitemap count drops by the same number.

```sh
# cwd: storefront
node scripts/build-link-graph.mjs --check && node scripts/build-sitemap.mjs --check
```

### `Q-053` — Cross-repo PAT so the product inbox and the storefront queue are one list

**LOW** · ready · RET · owner **founder** · both · 15m · kind `decision`

The queue lives in the public storefront; the four crons live in the private product repo and can only write their own repo with the built-in GITHUB_TOKEN. So today the product side maintains data/queue-inbox.json and a session absorbs it with `--absorb`. Merging the two automatically needs a cross-repo token — which the snapshot-freshness thread already flagged as a founder call, not something to add silently. Recorded here rather than assumed.

**Evidence**

- product CLAUDE.md — 'Full automation would need a cross-repo PAT (no workflow in either repo checks out the other) — a founder call, not added silently'

**Only Don can do this:** Minting a credential.

**Done when:** Either a scoped PAT exists as a repository secret in the product repo and queue-consumer.yml pushes absorbed items to the storefront queue, or this item is closed as declined with a dated note and the manual --absorb step stays documented.

```sh
# cwd: storefront
node scripts/check-queue.mjs --attest Q-053
```

