<!-- Full two-repo company audit, 2026-08-07. Produced by a 38-agent coordinated workflow
     (15 domain auditors + 15 adversarial verifiers + 8 cross-cutting lenses), with the
     highest-stakes claims independently reproduced by the orchestrator before publication.

     PROVENANCE + TRUST. Findings marked CONFIRMED survived an adversary instructed to refute
     them. Findings marked REPRODUCED were re-run by the orchestrator personally against the
     working tree. Everything else is advisory. Per the site's own fact gate, nothing in this
     document may be cited on a public page without independent sourcing.

     This file is internal. docs/ is excluded from the deploy tar. -->

# Muntin — full company audit

**Date:** 2026-08-07 · **Scope:** both repos (`potentially-profitable`, `Muntin-Invoice-Decoder`)
**Method:** 38 agents, ~5.8M tokens, 2,900 tool calls, adversarial verification on every domain
**Findings:** 235 (118 critical/high after severity correction) · **Adversary downgraded 54, upgraded 9**

---

## 0. Read this part if you read nothing else

Muntin is a **company with two uncommon assets and no working connection between them and any
human being.** The engineering is better than the marketing says. The honesty machinery is real
and is the most defensible thing here. And essentially every distribution surface that would
turn either into a customer **stops one line short of working.**

Four facts, each independently reproduced:

1. **The monthly dispatch is mailed to almost nobody.** `src/worker.js:8793` sends only where
   `sub.source === 'cost-index'`. Across 777 subscribe forms the live values are **613 `footer`,
   162 `cost-index-ingredient`, and 2 `cost-index`.** So 775 of 777 signup forms produce a source
   the broadcast filter skips — while 83 Cost-Index pages promise a monthly email in their footer.
2. **The funnel has four mouths.** Exactly **4 of 1,368 pages** carry `action="/api/waitlist"`
   (`index.html`, `ledger/index.html`, and their two ES mirrors). Zero across 142 cost-index,
   221 library, 172 glossary, 40 sheets, 8 tools, 20 blog pages.
3. **Every product CTA points at an unrouted hostname.** 547 occurrences of
   `ledger.muntin.digital` across 405 storefront files. Neither repo routes it;
   `NEXT_PUBLIC_SITE_URL` is set in no wrangler config, no `.env`, no workflow, no deploy script,
   so the product also ships that hostname as its own canonical URL, sitemap host, `metadataBase`
   and Organization `@id`. `guard-web-deploy-env.mjs` blocks a deploy over exactly this failure
   mode for the sibling variable `NEXT_PUBLIC_API_BASE_URL`, and never mentions this one.
4. **The storefront deploy is blocked right now.** `check-all.mjs` exits 1 at **312 of 320**.
   Because `build.command` runs 75 builders *then* `check-all` at step 76, in-chain drift
   self-heals — so the true blockers are the **5 builders absent from that chain**:
   `build-themes-review-board`, `build-theme-story-pages`, `build-cuisine-landing-pages`,
   `build-cost-index-picker`, `build-ingredient-state-record`.

**ADDED 2026-08-07 (found by the Phase-D blind adversarial pass, after this audit shipped) — the
worst live falsehood on the site, and the purest instance of the disease:**

> `cost-index/feed.json` publishes **ground-beef at `priceUsd: 393.06`, `source: "bls"`** — a BLS
> *index value* rendered as dollars per pound on the machine-readable feed built for AI crawlers and
> journalists. `cost-index/index.json` publishes **$5.51/lb** for the same slug. **Two published
> surfaces disagree by 71×.**
>
> And `scripts/check-cost-index-basis-leak.mjs` — the gate written for exactly this — **passes**,
> printing "every rendered $ (seed, index.json, **feed.json**, …) traces to a dollar-basis level in
> the source; no index/farm-gate/customs basis leaks a price." It names the leaking file as covered.
> The gate cross-references at the INGREDIENT level (ground-beef does have one $5.51 wholesale
> level) and never checks the basis of the specific observation rendered. Its own docstring names
> this failure mode and cites a salmon-fillet precedent.
>
> This is the strongest single argument in the audit that green means nothing here — and it was
> found only once a verifier was denied the maker's reasoning.

**The single most important finding is not on that list.** It is this:

> **Auditing at Muntin has a 26% close rate, and zero closures in the company's entire history
> came from anyone working an audit's list.** Across 8 prior audit artifacts, 49 named findings:
> 14 were fixed by the same agent session that found them (0 days); of the 38 that outlived their
> session, 10 were ever closed — every one incidentally, by a later thread that happened to touch
> the file. 80–84% of commits in both repos are authored by "Claude"; there have been zero human
> commits in either repo for seven days.

The bottleneck is not recording — the board is 1,488 immaculate lines. It is that **only an agent
session produces work, and no session has ever been pointed at the backlog.** The company converts
findings into *registries* faster than into *fixes*, and a registry entry has exactly the
enforcement power of the document it replaced.

**Which means the predictable fate of this document is to become finding #50.** The
counter-measure is in §2: seven changes, all small, most one line, each with its command.

---

## 1. The three structural findings

### 1.1 The capacity ratchet — a 2.7x deficit, already visible in the failures

Recurring obligations total **~53 founder-hours/month**. The founder's own written capacity is
"~a few hours/week" (`docs/seo-handoff-both-repos.md:23`, 2026-07-05) = 13–26 h/mo. Maintenance
alone (31 h/mo, before a word is written) is **1.6x capacity**.

You need not trust that estimate, because the failures measure it directly. In the 30 days to
2026-08-07, roughly **3 of 31 maintenance-hours-due were actually paid (~10%)**:

| Obligation | State on 2026-08-07 |
|---|---|
| Warrant canary | 3 monthly signings overdue (last signed 2026-05-10, 89 days) |
| Q2 transparency report | 37 days past its own published date |
| Monthly Cost Index dispatch | 2026-08-04 came and went; 83 pages promise "first Tuesday" |
| Changelog | 40 days stale, while `methods/index.html:470` tells readers changes appear there |
| Unexpected frozen price feeds | doubled, 8 → 16 |
| The 6 ADR-013 government datasets | fetched exactly once, ever |

The obligation side compounds faster than capacity: the same doc that recorded "a few hours/week"
recorded "~90 checks." `check-all` now runs **320 — a 3.5x in 33 days.** Nothing in either repo
ever retires a gate, a page, or a cadence.

The realized split is ~88% creation / ~10% maintenance. That is the right instinct for a
pre-revenue company and the **wrong one for this one**, because everything decaying is a *trust*
artifact, and trust is the entire differentiator.

### 1.2 Green does not mean grounded — and the meta-gates are each other's blind spot

40 gates hand-classified: **27 of 40 assert a SHAPE** (a string is present, two committed files
agree, a count matches a manifest); 9 assert grounding and can fail; 4 assert grounding but are
wired so they cannot. Across all 169: **zero of the 129 storefront gates ever perform network
I/O**, only 10 consult wall-clock time, and **56 of `check-all`'s 320 entries are tautologies** —
the deploy runs a builder, then asks the builder whether its own output matches.

The structural hole: `check-gate-coverage` enumerates `scripts/check-*.mjs`; `check-idem-coverage`
enumerates builders already inside `check-all`. **Neither can see the 33 builders on disk that
ship a `--check` mode nobody runs.** That is not theoretical — `build-cost-index-pages.mjs:43`
says in its own header it was written to be wired "into check-all in --check mode," is wired
nowhere, and consequently `/about/` publishes "Eggs +71.7% as of 2026-07-21" while today's data
says **+148.2% as of 2026-08-04**. The Mon/Wed/Fri bot rebuilds the correct number and throws it
away on every run.

The most elegant instance sits in the gate written to prevent exactly this.
`check-idem-coverage.mjs:168`:

```js
const wf = Object.keys(workflows).find((f) => workflows[f].includes(e.script));
if (wf) { out.workflow.push({ ...e, wf }); continue; }
```

"Run by a workflow" is satisfied by a **substring match on the filename anywhere in the YAML —
including inside a comment.** `cost-index-refresh.yml:98` mentions `check-cost-index-picker` in a
comment; line 99 rebuilds `data/cost-index-picker.js`; the `git add` allowlist at lines 302–311
omits it; line 313 `git checkout -- .` discards it. The gate cannot see that the workflow throws
the output away 200 lines later. **This is the third live instance of that same staging-allowlist
bug** — the comment block above the allowlist documents the two prior ones, each closed by
appending a filename, never by fixing the pattern.

Cost side: `check-all` takes 186 seconds, and **3 of the 8 reds a founder sees locally are
phantoms the deploy heals** — a 37.5% false-alarm rate on his only feedback loop. That is how a
red deploy becomes background noise. The board already records the precursor: PR #536 "merged with
three reds the founder accepted."

### 1.3 The honesty machine is inverted on its flagship page

This company's entire differentiation is that it does not publish numbers it cannot stand behind.
That makes published-falsehood risk **existential here in a way it is not for a normal company.**

All 165 `<!-- src: -->` annotations in `blog/cost-index-2026-07/index.html` were evaluated against
live data: **at least 72 distinct published claims are currently false.** Every one was *true on
publication day* — commit `9f11e0885` (2026-07-06) matches the prose exactly. Two days later
`bae8c9d31` regenerated seven artifacts under the standing page. **61 of the 165 annotations point
at files the append-only editions spine does not freeze.**

This is a missing mechanism, not sloppiness. `<!-- count:KEY -->` and `<!-- repro:value -->`
sentinels *are* machine-enforced; `<!-- src: -->` is not.

**The single most dangerous artifact in either repo is line 852** — a reader-visible
`<details class="cite">` drawer that tells a skeptic the cited files are "both rebuilt from
committed data on every refresh and re-checked in CI. Every number in this section traces to one
of them." All 21 numbers in that section are now wrong, no such gate exists on disk, and
**the repo is public** — anyone can verify the refutation in thirty seconds using the page's own
instructions. Six claims have *inverted* rather than drifted: the outlook reads "building/+0.055"
where the page asserts "a faint downward lean/−0.145."

The founder already designed the fix — `check-src-sentinel.mjs`, named "rung 0" in
`docs/strategy/2026-07-28-frontier-north-star.md:165`, ten days ago. It was never carried into the
resume-here board, so **the resume protocol lost the company's own sharpest finding.**

---

## 2. Do these seven things first

Ordered by (damage prevented) ÷ (founder-minutes). Every one is small; five are one line.

| # | Change | Where | Est. |
|---|---|---|---|
| 1 | **Align the subscribe source with the broadcast filter — AND raise the send cap.** Accept `footer` and `cost-index-ingredient`, or widen the filter at `src/worker.js:8793`. **CORRECTED 2026-08-07:** this alone is NOT a 15-minute fix. `src/worker.js:8789` sets `const CAP = 90; // Resend free tier is 100/day`, and line 8782 stamps `cost-index:broadcast:<asOf>` so a re-fire returns `already-sent`. Widening the filter without batching would reach 90 of 775 and then record the edition as delivered. Needs batching or a paid Resend tier. | storefront | 3 h |
| 2 | **Resolve the hostname.** `curl -sI https://ledger.muntin.digital` decides it. If it does not resolve, 547 CTAs across 405 pages are dead and so is the product's own canonical URL. Then set `NEXT_PUBLIC_SITE_URL` and add it to `guard-web-deploy-env.mjs` beside its sibling. | both | 30 min |
| 3 | **Green the deploy.** Run the 5 out-of-chain builders and commit; then add them to `wrangler.jsonc` `build.command` so nothing re-stales them. Note `build-ingredient-state-record` needs your Mac + API keys — it cannot be cleared from a container. | storefront | 1 h |
| 4 | **Fix the staging pattern, not the case.** Replace the `git add` allowlist in `cost-index-refresh.yml:302-311` with a path-scoped `git add -A` plus a denylist, and narrow or delete `git checkout -- .` on line 313. Retires the bug class instead of its third instance. | storefront | 30 min |
| 5 | **Correct or retract the July dispatch** — starting with the line-852 cite drawer, which invites verification and fails it. Then write `check-src-sentinel.mjs` and point the annotations at the frozen edition spine rather than the live files. | storefront | 2 h + 3 h |
| 6 | **Fix the Stripe seat multiplication before it can ever fire.** `billing.ts:174-175` sets `line_items[0][price]` = the **base** price and `quantity` = seats. A 5-seat Team is charged **$300** (should be $60 — `seatPriceCents` is 0); a 5-seat Accountant **$750** (should be $270); at 50 seats, **$7,500 vs $1,620**. `monthlyTotalCents()` at `stripe-tiers.ts:119` computes it correctly and checkout never calls it. Harmless only because nothing reaches checkout today. | product | 1 h |
| 7 | **Fix the founding-lead enum.** 100% of founding signups are relabeled `studio` — the retired web-studio line's name — because neither the storefront allowlist (`src/worker.js:8921`) nor the product enum contains `home-founding` or `ledger-pricing`. Then give `listFounding()` its first caller; it has none. | both | 45 min |

Total: **under one working day.** Items 1, 2 and 7 are the difference between having an audience and not knowing whether you have one.

---

## 3. Calibration — how much to trust this

An independent critic re-checked 10 findings against the code: **6 reproduced exactly, 2 were
right in substance but overstated in magnitude, 2 are contradicted by their own cited evidence.**
An **80% substantive survival rate** — genuinely good, with both failures pointing in the
sensational direction. Treat single-source severity claims as provisional; treat anything marked
REPRODUCED as fact.

Two corrections the orchestrator made to its own agents' work, recorded because they matter:

- **"The deploy is red" was reported by four domains and is true — but not for the reasons three
  of them gave.** All five cost-index gates pass; `check-cost-index-sync` reports OK. The block is
  the 5 out-of-chain builders.
- **"The build graph has a cycle" is wrong.** A convergent order exists and is encoded in
  `build.command`'s 79 steps (which deliberately re-runs `sync-includes`, `inject-article-tldr`,
  `build-css-shells`, `inject-css-shells` and `inject-css-cache-bust` twice each to settle
  ordering). What is true: **that order exists nowhere a human can run**, so clearing reds locally
  in any ad-hoc order does not converge — verified across three full `check-all` passes
  (312 → 317 → 312).

**Also worth correcting: the founder-vision doc is stale on its own headline design finding.**
The "two design languages" fork it describes as open is **closed** — the token spine is
byte-identical and hash-locked across both repos.

---

## 4. The upside case — what to do *more* of

Every other lens hunts defects. This one matters as much.

**Graded honestly, three assets are real and three are overrated.**

The archive is real but smaller than it looks: **83,695 of 85,720 published observations (97.6%)
are marked `reconstructed:true`** — an after-the-fact backfill any competitor with the same
USDA/BLS/FRED feeds can rebuild. The genuinely unfabricatable asset is the **2,025 live-captured
points since 2026-05-01**, the 10,294-entry append-only revisions ledger, and the dated
publication chain. Those compound **only if the cadence never breaks** — and 26 of 100 series are
already frozen 58–77 days.

The determinism guarantee is the strongest single differentiator: `no-llm-ci.sh` makes "no
language model reads your numbers" **falsifiable by a stranger in thirty seconds**, in a market
where every competitor says "AI-powered." It is enforced, not asserted — the gate walks all
tracked source files and blocks SDK imports, LLM HTTP destinations, and LLM-only env vars.

**The highest-leverage strategic fact in this audit:** ADR-020 made the data line "the company for
the next year" and gave it **no revenue mechanism**. But the methodology page's independence
contract forecloses only *placement and influence* — it does **not** foreclose selling analysis,
service, or expertise over data that stays free. Two paths to a first dollar need **zero billing
code and zero new product**:

1. **A paid monthly read over the free index** — the interpretation, not the data.
2. **Paid cost work inside the founder's own vendor network** — he runs FOH at a two-location
   restaurant and has the invoices, the vendors, and the standing.

And the distribution machinery is *built and disconnected*: 162 ingredient pages promise an email
a five-element allowlist makes impossible to send; **1 embeddable card exists out of 82**; a
complete DataCite record sits with `"doi": null`.

---

## 5. What this audit cannot see

This audit is **unusually accurate about the machine and structurally silent about the business.**
Across 235 findings and 15 domains there is not one finding about market attractiveness,
willingness to pay, channel strategy, support capacity, insurance, or **whether the food-cost
number the product exists to print is accounting-correct.**

The sharpest evidence: **ADR-020 — the decision to defer all revenue by twelve-plus months, the
largest strategic act in the company's history — is 80 lines containing the words "market,"
"competitor," "revenue," and "customer" exactly zero times.** No domain flagged that. Meanwhile
the product repo already holds a dated 12-competitor analysis naming two live dislocations
(**Hubdoc shut 2026-05-08; Toast bundling invoice scanning to ~120K restaurants**) that appears in
zero findings.

It is also repo-bound in a way it must state plainly: **no agent here could resolve a hostname,
read a traffic dashboard, or see a bank balance.** Six facts only Don possesses would move more of
this audit's conclusions than any of its 118 critical-and-high findings:

1. Does `ledger.muntin.digital` resolve? (Decides whether the funnel exists at all.)
2. What is actual traffic, and to which pages?
3. Has any non-founder human ever used the product? (No artifact in either repo names one.)
4. What is the real monthly infra bill, and against what runway?
5. What does *success* mean here — lifestyle business or venture scale? The whole audit assumed one.
6. How many hours per month does he actually have, now that coursework is starting?

**The honest bottom line.** Zero confirmed users after ~15 months. The founder dogfoods the
extraction *engine* on real Tacombi invoices but has **never run the product end-to-end** — so the
activation path is untested by anyone, including him. That is simultaneously the most alarming
fact in this audit and the cheapest one to fix: he is one shift away from being his own first
customer.

---

## Appendices

- `company-audit-2026-08-07/findings.json` — all 235 findings with evidence, impact, recommendation, and adversary verdict
- `company-audit-2026-08-07/lens-*.md` — the 8 cross-cutting analyses in full
- `company-audit-2026-08-07/check-all-*.log` — the three `check-all` passes
