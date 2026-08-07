# ADR-033 — The ninety days, the founder's irreducible work, and the three ways to know this is wrong

**Status:** Proposed — awaiting founder ratification (queue Q-019)
**Date:** 2026-08-07
**Owner:** Don Goldstein
**Related:** ADR-024 (the queue), ADR-025 (the storefront is an audit file),
ADR-030 (one price, one cohort, no billing code), ADR-031 (submitter lane
foreclosed), ADR-032 (ratchets released),
`Muntin-Invoice-Decoder/docs/ux/decisions/ADR-013` and `ADR-014`

> **Decision.** The next ninety days run in three windows against a declared
> founder budget of **13-26 hours/month**, sized against the **floor**. M1 is the
> three mandatory repairs and the honesty debt (16h founder, with a written drop
> order to 12.5h if only the floor arrives); M2 is the five correctness fixes,
> **deployed**, then reviewed by two working CPAs (11.25h); M3 is eight
> qualification conversations and the first hand-sent invoice (11h). The whole
> plan is arithmetic fiction unless the **~53h/month standing maintenance
> calendar is suspended in writing** (Q-013), which is therefore the first
> item that is never dropped. Three checkpoints — **CP-30, CP-60, CP-90** — each
> carry named **kill criteria**, live in `data/queue.json#checkpoints`, and make
> `check-queue` **exit 1 the day they pass unrecorded**. The plan is the queue;
> this ADR is why it has that shape.

## Context

Two measurements set every constraint in this document.

**The plan cannot be prose.** Prior audits at this company close at **26%**, and
zero closures in company history came from anyone working an audit's list
(ADR-024). Every fix that ever landed was made by the session that found it, or
landed incidentally. So this ADR does not contain the plan. `data/queue.json`
contains the plan; 42 items, each with an objective `doneWhen` and a `verify`
command, closable only by a command that exits 0.

**The plan cannot exceed capacity.** Recurring obligations total ~53
founder-hours/month (`docs/handoff/company-audit-2026-08-07.md:89-91`) against a
written capacity of "~a few hours/week" = 13-26 h/mo
(`docs/seo-handoff-both-repos.md:23`). In the 30 days to 2026-08-07, roughly **3
of 31 maintenance-hours due were actually paid — ~10%**. A plan that fits only if
the founder performs at 4x his measured rate is the failure mode this whole
engagement diagnosed.

An adversarial feasibility review of the first draft of the queue found the fit
was fake: the 90-day load fits *only* if the standing calendar is suspended,
which no item did. With the calendar, eight-week demand was ~130 hours against
26-52 available — a 2.5-5x deficit, invisible because the queue priced only
founder-owned rows and never the review, the deploys or the dispatch.

## The decision

### 1. Three windows, one declared budget, computed by the machine

`data/queue.json#capacity` declares the floor, the ceiling, the source, and a
**2.5h/month review-and-deploy overhead that no item prices**, added to every
window so the budget cannot be gamed by omission. Every item declares
`founderHours` (a number, 0 for agent work) and a `window`. `check-queue
--budget` sums them:

| window | what it is | founder hours |
|---|---|---|
| **M1** (2026-08-07 → 09-06) | The mandatory repairs and the honesty debt | **17.0h** — over the floor, under the ceiling |
| **M2** (09-07 → 10-06) | Correctness, deployed, then reviewed by a CPA | **11.25h** — fits the floor |
| **M3** (10-07 → 11-06) | The price, the conversations, the first invoice | **11.0h** — fits the floor |

Over the **ceiling** fails the gate. Over the **floor** warns. M1 warns, so the
drop order to exactly 13.0h is written down **now**, in `capacity.floorPlan`,
rather than being made in week three by drift: Q-006 moves to M2 (−0.5h), Q-009
takes the retire fork rather than the sign fork (−0.5h), Q-010's price call moves
to M2 (−1.0h), and Q-001 lands at its 4h lower bound rather than its 6h ceiling
(−2.0h). Four things are never dropped: **Q-002** (authorization), **Q-001** (the
founder walk), **Q-013** (the maintenance suspension), **Q-014** (the snapshot
re-vendor).

M1 was 16.0h when this ADR was drafted and reached 17.0h the same day, when a
parallel thread added a founder-costing item. That is not a defect in the plan;
it is the plan working. **Any item added to M1 after 2026-08-07 must either carry
`founderHours: 0` or name the row of the drop order it displaces** — `--budget`
fails past the ceiling, but it does not decide the cut, and nobody should be
deciding it in week three.

### 2. The three mandatory repairs come first, in this order

1. **Q-002 — written employer authorization, and it BLOCKS the walk.** The
   verdict's own graft, corrected on one point: the consent-triggering event is
   **ingestion**, not publication. Vendor identities and negotiated prices leave
   the employer's control at upload, into a service the employee owns. So
   authorization must cover ingestion, storage, retention and publication — or
   the walk moves to a consenting third restaurant or reconstructed data. The
   seven real invoice fixtures already committed under an MIT LICENSE in the
   private product repo are covered retroactively by the same instrument.
2. **Q-001 — the founder runs one month end-to-end, in week one.** Four recorded
   numbers: `countMinutes`, `dollarSurvivalPct`, `needsReviewRows`, `legsFooted`.
   After fifteen months the founder has never run the product once, and the load-
   bearing assumption of the entire company is currently a hope.
3. **No billing code for the first cohort** (ADR-030 here, ADR-013 in the product
   repo). Removes the 2026-11-13 GA from the critical path entirely rather than
   rescheduling it.

### 3. Q-014 is a precondition of the walk, not an afterthought

The vendored `cost-index-snapshot.json` covers 2026-07-18..07-28 against
`STALE_AFTER_DAYS = 30`, so 18 of 24 slugs go over the cliff on **2026-08-27**. A
walk run after that date measures a dormant market prior: `legsFooted` degrades
for reasons that have nothing to do with the product, and CP-30's kill criterion
could fire on an artifact of a stale file. This exact lapse already happened once
and went unnoticed for twelve days.

### 4. Two hard dates the plan would otherwise walk into

- **~2026-08-16** — `check-cost-index-dispatch-fresh.mjs` reds at 38 days. Q-015
  takes the fork **deliberately in week one**: write the edition (4-6h) or
  publish a dated cadence pause (30m). Either is honest; drifting into a red CI
  email in week two is how the warrant canary reached 89 days.
- **2026-08-27** — the snapshot cliff above.

### 5. Three checkpoints with named kill criteria

Stored in `data/queue.json#checkpoints`; rendered into `QUEUE.md`; enforced by
`check-queue`, which **exits 1 the day a checkpoint's date passes with `result`
still null**, and no amount of closed items clears it. The permitted results are
`proceed`, `amend`, `kill`. An amendment must say what replaced the checkpoint's
terms, or it is a kill being called a proceed.

**CP-30 (2026-09-06) — did he run it, and is anything still false?**
Kills: `dollarSurvivalPct < 70` → the pilot does not open this quarter; the
Purchases leg is rebuilt and re-walked first. No authorization basis declared →
no real invoice data is processed at all and the evidence base moves. `legsFooted
=== false` with an unexplained residual → the identity does not hold on real
data, which is the entire product claim.

**CP-60 (2026-10-06) — does a CPA accept the artifact?**
Kills: both reviewers reject the market prior → the count burden returns in full,
"half the labour at nearly twice the sticker" is no longer true, and $600 is not
posted until the price is re-derived. Both reviewers say it does not tie to what
they call food purchases → **abandon the strategy**; a statement that does not
reconcile to the books is a dashboard with a signature on it. `deskMinutesPerClose
> 60` → the ceiling is not forty locations, and that is decided before the first
customer rather than after the tenth.

**CP-90 (2026-11-06) — did anyone pay, and if not, what was wrong?**
Kills: eight qualified conversations and zero signed → the price or the buyer is
wrong, and **no more product gets built until one of them changes**. Fewer than
two of eight asking to see the specimen unprompted → the object is not wanted and
price is not the variable; stop and re-derive from the recorded objections. Three
or more signed but `deskMinutesPerClose > 90` → the business is real and the
one-founder ceiling is 9-17 locations, not 40; re-price before cohort two and
publish the revised ceiling.

### 6. The founder's irreducible work, in the order it unblocks everything

**31.75 founder item-hours across ninety days** (39.25 with the review overhead),
in 21 items that no agent workforce can absorb. Ordered by what they release:

| # | Hours | What only Don can do |
|---|---|---|
| 1 | 2.0 | **Q-002** — ask his employer for written authorization. A conversation with a person who signs. Blocks everything downstream that touches a real invoice. |
| 2 | 0.25 | **Q-014** — re-vendor the snapshot from his Mac with both repos checked out. |
| 3 | 6.0 | **Q-001** — run one real month end to end and write down four numbers, including the ones that embarrass the product. |
| 4 | 0.5 | **Q-013** — decide, in writing, to stop doing things he promised in public. An agent suspending a published commitment on his behalf is the fabrication the fact gate forbids. |
| 5 | 0.5 | **Q-015** — write the August edition or pause the cadence. The byline is his. |
| 6 | 0.5 | **Q-005** — read the Cloudflare Workers Builds log. Sixty seconds, his session, and it decides whether the next hour is worth spending. |
| 7 | 0.75 | **Q-009** — sign the warrant canary and the transparency report, or retire them. A personal attestation cannot be delegated; retiring one honestly is also a signature. |
| 8 | 1.0 | **Q-019** — ratify six ADRs. An agent may draft a decision; it may not make one. |
| 9 | 0.5 | **Q-007** — the line-524 sign flip. An editorial judgment about a market read under his own byline. |
| 10 | 1.0 | **Q-010** — the billing-term call: monthly for cohort one, annual-in-peak at renewal. |
| 11 | 0.5 | **Q-006** — confirm the repository secrets and read the workflow run history. |
| 12 | 1.5 | **Q-017** — deploy api and web to production from his Mac and record both SHAs. Twenty agent-hours reach zero customers until this happens. |
| 13 | 2.0 | **Q-030** — the specimen close is his month, and the signature on it is his. |
| 14 | 3.0 | **Q-031** — two CPA/bookkeeper conversations. A relationship, and a professional judgment as its output. |
| 15 | 0.5 | **Q-072** — approve the page that says what Muntin sells. |
| 16 | 1.5 | **Q-071** — two pillar essays in his own register about his own floor. |
| 17 | 0.25 | **Q-053** — mint a cross-repo credential. |
| 18 | 0.5 | **Q-040** — decide the five qualifying questions. Who gets told no is a founder call. |
| 19 | 6.0 | **Q-041** — eight conversations with owners. A phone call, and the standing of a working FOH manager talking to another operator about his floor. |
| 20 | 2.0 | **Q-042** — sign a close and send an invoice. **The one thing in this company that can never be delegated to any workforce, agent or human.** |
| 21 | 1.0 | **Q-082** — approve the harness change that injects the contract at the spawn site (added by a parallel thread the same day; displaces a drop-order row, per §1). |

Everything else — 25 items, roughly 80 agent-hours — is an agent session's work,
and each carries a command that proves it.

Read the table as five kinds of thing, because they fail differently: a
**signature** (Q-009, Q-019, Q-042) cannot be forged; a **conversation**
(Q-002, Q-031, Q-041) needs a person on the other end and a relationship to hold
it; a **credential** (Q-005, Q-006, Q-017, Q-053) needs a session an agent does
not have; a **judgment** (Q-007, Q-010, Q-013, Q-015, Q-040, Q-072) needs
somebody who can be wrong on the record; and a **physical act** (Q-001, Q-014,
Q-030) needs hands on a real month of paper. Nothing on the list is founder work
because it is hard. It is founder work because a machine doing it would be
producing a fabrication.

### 7. What was cut, and named as cut

Recorded in `data/queue.json#capacity.cuts`, because a plan that quietly drops
things is how a 26% close rate is produced:

- The **August and September dispatches are not written**; the cadence is paused
  with a dated public note.
- The **standing maintenance calendar is suspended** for M1-M3.
- **Ten locations by day 90 becomes three**, plus one signed close and one
  invoice. Ten inside four weeks needs sales hours that do not exist.
- **$6,000 annual becomes $600 monthly** for cohort one (ADR-030).
- **The two pillar essays move out of M1.**
- `/tools/pack-check/`, `/cost-index/refusals/`, `/close/apply/` and the taxonomy
  migration carry **zero founder hours**. If they slip, they slip.

## Consequences

- **The gate can now be red for three different reasons** — unclaimed HIGH work,
  an over-ceiling window, or a past-due checkpoint — and the third cannot be
  cleared by doing more work. That is deliberate: a falsifier that closing items
  can silence is not a falsifier.
- **`QUEUE.md` shows one founder item, not a list of twenty.** Nine founder items
  delivered as a list is the artifact shape that closed at 26%.
- **Claims now expire at 21 days, not 7**, matching the measured burst pattern
  (24 of 60 days idle; 266 of 344 storefront commits on 8 days). A 7-day expiry
  released most claims without any state change.
- **The plan is falsifiable in three places and abandonable in two of them.**
  CP-60's "does not tie to food purchases" and CP-90's "nobody wants the object"
  both end the strategy rather than adjusting it.
- **This ADR will be wrong somewhere.** The checkpoints are where it finds out,
  and `amend` exists so that being wrong about a checkpoint is not confused with
  being wrong about the bet.

## Alternatives rejected

- **Keep the plan as prose in `strategic-council-board.md`.** Rejected by
  measurement: 1,488 immaculate lines, 26% close rate, zero closures from anyone
  working the list.
- **Budget against the 26h ceiling.** Rejected: the ceiling is his best month and
  the measured payment rate is ~10%. A plan sized to the ceiling has never once
  been delivered by this company.
- **Skip the maintenance suspension and "just triage as it comes."** Rejected:
  that is precisely what produced an 89-day lapsed warrant canary, a transparency
  report 37 days past its own date, and a 40-day-stale changelog. Triage-as-it-
  comes is not a policy; it is the absence of one, observed.
- **Milestones without kill criteria.** Rejected in code — `validate()` refuses a
  checkpoint whose `killIf` is empty. A bet you cannot kill is a bet you cannot
  learn from.
- **Ten locations by day 90, as the strategy stated.** Rejected on arithmetic:
  eight conversations is already 6 of the 11 founder-hours available in M3. Three
  signed, one close delivered, one invoice sent is the smallest fact that
  distinguishes a business from a plan, and it is enough to fire every CP-90 kill
  criterion.
