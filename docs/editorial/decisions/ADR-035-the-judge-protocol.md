# ADR-035 — The judge protocol: how a panel verdict earns the right to be quoted

**Status:** Proposed — awaiting founder ratification
**Date:** 2026-08-07
**Owner:** Don Goldstein
**Related:** ADR-023 (a check that has never been SHOWN to run is not evidence),
ADR-024 (the queue), ADR-033 (the ninety days and its falsifiers)
**Instrument:** `scripts/audit-validator-calibration.mjs` (+ `scripts/lib/validator-corpus.mjs`),
`data/validator-calibration.json`, `data/validator-neutral-verdicts.json`

> **Decision.** No panel verdict enters a founder decision unless it carries four
> things: a verdict **defined as a decision procedure over recorded per-claim
> booleans** rather than as a label; a **refuting command** on every claim, where
> a claim with no possible refuting command is reclassified as a DECISION and
> routed to the founder instead of into the work; **planted controls in both
> directions**, so the judge's own error rate is measured in the same run; and a
> **deduplicated** finding count, because N lenses over one artifact rediscover
> the same holes and the raw count is a function of N. Applied retroactively to
> Phase H: the sampled claims hold at **10 of 12**, the 44 BLOCKING gaps resolve
> to **20 distinct defects**, and on a 7-domain sample **3 of 7 verdicts move**
> under a defined bar — two toward READY and one away from it. "13 of 15
> NOT_READY" and "44 blocking" are retired as headline numbers.

## Context — two opposite calibration failures, same models, same repo

This engagement has now run the same judgement task twice and failed it in
opposite directions.

**Phase 1 — too credulous.** Adversarial verifiers were pointed at 151 claims and
refuted **1** (0.7%). They were shown the maker's reasoning alongside the claim
and asked to check it. A judge that reads why something was done adopts the
frame in which it was reasonable.

**Phase H — too critical.** Fifteen domain specialists were told, in the prompt,
that *"a validator who finds nothing has not validated anything."* Thirteen
returned NOT_READY and **44** gaps came back marked BLOCKING. A judge paid in
findings finds.

Neither number measured the repo. That is the whole problem: the founder was
about to make a go/no-go call off a pair of numbers that were substantially
produced by the instruction, and there was no way to tell which part was which,
because nothing in either protocol measured the judge.

Three defects are common to both runs, and one is unique to each:

1. **The verdict was never defined.** "Is this domain ready?" carries no
   threshold, no date and no consequence. An undefined threshold is filled in by
   whatever disposition the reader arrives with — which in Phase H had just been
   set by the prompt. *This is the largest single effect and it is common to both
   runs.*
2. **The judge's error rate was never measured.** Neither run contained a single
   item with a known answer. There was no way for either panel to be wrong on
   the record.
3. **The finding count was reported raw.** Fifteen lenses over one plan is not
   fifteen independent samples; the same hole gets found repeatedly and counted
   repeatedly.
4. Phase 1 only: **the judge saw the maker's reasoning.**
5. Phase H only: **the judge was rewarded for a negative verdict.**

## Decision

1. **The judge sees the artifact and the repo. It does not see the maker's
   reasoning.** Design rationale, "here is why we chose this", and prior verdicts
   are withheld. Phase 1's 0.7% refutation rate is what contamination costs.

2. **The verdict is a decision procedure, not a label.** State the question with
   a date and a consequence attached — for readiness, *"can execution begin
   within 30 days without producing an artifact that is false, unsafe, or
   unrecoverable?"* — then state the rule that computes the label from booleans
   recorded per claim. Phase H's neutral re-run uses four:
   `bitesInM1`, `needsFounderOrThirdParty`, `hasQueueItem`, `hasProofCommand`,
   with NOT_READY iff some claim satisfies (a) ∧ (b) ∧ ¬(c).
   **A verdict a reader cannot recompute from the record measured the judge.**

3. **Every claim ships with the command that would REFUTE it** — not the evidence
   that supports it. Evidence is what a gap-seeking judge produces in abundance;
   a falsifier is what distinguishes a defect from a worry. **A claim with no
   possible refuting command is not a gap. It is a DECISION**, it routes to the
   founder, and it leaves the loop. Two of the seven neutral-arm domains are
   NOT_READY on exactly such claims (what the founder may spend; who may read a
   customer invoice), and no amount of agent work will ever close them.

4. **Plant controls in both directions, before the run.** At least one item the
   judge should pass and at least one it should fail. A judge that flags the
   plant it should pass is over-critical; one that misses the plant it should
   fail is over-credulous; the split is its measured error rate. This is the part
   both prior runs lacked entirely, and it is non-negotiable — it is the only
   mechanism here that produces a number about the judge rather than about the
   repo. Where planting is impossible after the fact, the substitutes are a
   **severity control** (sample a MAJOR and a MINOR alongside the BLOCKINGs; if
   they reproduce at the same rate, the severity labels carry no information) and
   a **verdict control** (re-judge a domain that did *not* return the majority
   verdict; if the rubric cannot move it, the rubric is agreeing with itself).
   Phase H's retroactive audit uses both.

5. **Deduplicate before reporting the count.** Cluster claims by a *declared*
   concept lexicon, record every assignment, and report distinct defects plus the
   rediscovery multiplier. A raw count from an N-lens panel is an artifact of N.

6. **Publish the judge's precision as a re-runnable number, not an assertion.**
   `node scripts/audit-validator-calibration.mjs --reproduce` re-executes the
   sampled claims against the current repo on demand. Per ADR-023, a hit rate
   that has never been shown to run is not evidence of anything.

## Walk receipt

Run on 2026-08-07 in this container, against both repos at HEAD.

- `node scripts/audit-validator-calibration.mjs --self-test` → **35/35 assertions
  pass**. The self-test caught a real defect in this instrument before it
  reported anything: the pointer regex ordered its extension alternation
  `js|json`, so `data/queue.json:1613` truncated to `data/queue.js` and read as a
  broken citation. Uncaught, it would have made the validators look measurably
  sloppier than they are.
- **Reproduction, 12 sampled claims (10 BLOCKING + 1 MAJOR + 1 MINOR control).**
  Two readings, hours apart, because **a claim closed underneath the instrument
  while it ran**:
  - 23:0x — 8 REPRODUCES, 2 SUBSTANCE-HOLDS, 1 STALE, 1 REFUTED → **10 of 12**.
  - 23:29 — 6 REPRODUCES, 3 SUBSTANCE-HOLDS, 2 STALE, 1 REFUTED → **9 of 12**.
    `ci-integrity#1` moved REPRODUCES → STALE: all six `check-queue` modes exited
    2 in the first reading; by the second, a concurrent session had set Q-004's
    status to `ready` and every mode passed.

  That drift is the single best argument for decision 6. A frozen report would
  still assert "the plan's central instrument is dead in every mode" and would
  have been wrong within the hour — the same defect class as `HD-14`'s
  hand-editable snapshot. **Quote the command, never the number.** Both readings
  agree on the thing that matters: the sampled evidence holds at ~75-83%, and the
  one claim that fell did so because someone *fixed it*.

  Phase 1's comparable exercise scored 6 exact / 2 inflated /
  2 refutable of 10; the two runs agree within noise, which is itself the useful
  result: **the validators' EVIDENCE is good and their VERDICTS were not
  calibrated.** Those are separable, and only the second was damaged by the
  prompt.
- **Severity control:** the MAJOR (R11) reproduced exactly; the MINOR (R12) was
  the only outright REFUTED claim. Weak evidence that severity labels carry
  signal at the extremes — one sample each, not a rate.
- **Concentration:** 44 BLOCKING claims → **20 distinct defects**, a **2.20×**
  rediscovery multiplier. The most-rediscovered: `dpa-clocks` (5 claims, 3
  domains), `first-dollar-undefined` (4 claims, 4 domains), `desk-minutes`
  (4 claims, 4 domains).
- **Pointer integrity:** 434 pointers cited. Of the 144 carrying a line number,
  **130 resolve to a line that exists (90.3%)**. 30 further pointers are
  `CITED-AS-ABSENT` — a file named precisely because it does *not* exist, which
  is the claim rather than an error.
- **Neutral arm, 7 domains:** 3 verdicts move. `ci-integrity` and `strategy`
  NOT_READY → READY_WITH_GAPS; `ops-capacity` READY_WITH_GAPS → **NOT_READY**;
  `content-editorial` holds as a control. In the sample, NOT_READY falls from
  **5 of 7 to 4 of 7**.
- **Routing (Rule 3 — the loop is rate-limited by the founder, not by agents):**
  the 15 reports propose **89 Additions** — 51 agent-owned, 36 founder-owned —
  and the founder hours declared in the validators' *own* cost brackets sum to
  **37.00h** (73 of 89 parseable; 3 founder-owned unparseable, reported as
  unparseable rather than as zero). The quarter's founder floor is **39h and is
  already spent at 100.6%**. Acting on this output as written would add **94.9%
  more founder time than the entire quarter has** — which is what "the loop
  closes agent items faster than the founder can absorb them" looks like as a
  number. **6 of 89** Additions carry a `doneWhen` with no command-shaped proof;
  under decision 3 those are DECISIONS and leave the loop.
- **Independently recomputed, not taken from the report:** the founder-hour
  budget sums to M1 17.00h + M2 11.25h + M3 11.00h = **39.25h against a 39h
  floor = 100.6%** — plus **2.25h of unwindowed founder work the budget does not
  count at all**, which takes it to 106.4% and which the validator missed. The
  ops-capacity claim was *understated*.

**Honest verification limits.** The neutral arm is **one agent applying a
declared rubric, not five independent blinded re-runs** — no general-purpose
subagent tool was available in this container, so it could not be blinded to the
original verdicts. The confound is anchoring and it runs *toward* agreement,
which makes the measured movement a **floor** on the true prompt effect and makes
the single downgrade (`ops-capacity`) the load-bearing evidence that the rubric
is not a whitewash. The 7-domain sample was chosen, not randomised, and 3-of-7
should not be scaled to 15 without re-running the remaining eight. The
reproduction, concentration and pointer-integrity sections carry no such
confound: they are commands, and they re-run.

## Alternatives rejected

- **Re-run all 15 domains with a neutral prompt.** Correct, and unaffordable
  here: it is the expensive half and the cheap half (reproduction) already
  answers the founder's actual question — is the evidence good? It is. The
  remaining eight are queued work, not a conclusion.
- **Average the two arms.** Averaging a contaminated estimate with an anchored
  one produces a number with no interpretation. The arms measure different
  questions; the fix is to define the question, not to blend.
- **Drop the "find something" instruction and re-run as-is.** Insufficient. The
  Phase-1 failure had no such instruction and was worse. The instruction is
  defect 5; the undefined verdict is defect 1 and is the larger one.
- **Wire this into `check-all`.** No. It executes a command registry and shells
  into the product repo, neither of which belongs in a deploy, and the deploy is
  already red at 320/328. It is `audit-*` and periodic, like
  `audit-gate-teeth.mjs`, for the same reason.

## Consequences

**What this retires** (ADR-028's rule — a mechanism states what it displaces):

- **"13 of 15 NOT_READY" and "44 blocking" are retired as decision inputs.**
  They are superseded by *20 distinct defects*, a *10-of-12 evidence hit rate*,
  and per-domain verdicts computed from a stated rule. The reports stay on disk
  as evidence; the headline numbers stop being quoted.
- **The raw panel finding count is retired as a reporting format.** Any future
  multi-lens panel reports distinct defects and its rediscovery multiplier.
- **`push-*.md` and future panel verdicts are non-quotable without controls.**
  A verdict with no planted control and no decision procedure is a worry, filed
  as such.

**What it costs.** Every future panel run carries two planted controls and a
written rubric — roughly 20 agent-minutes of setup, and zero founder-hours. That
is the entire price, and ADR-033's floor plan is untouched.

**What it does not do.** It does not close a single one of the 20 defects. It
changes which of them the founder is asked to look at first, and it removes the
two that no agent can ever close from the loop entirely, which is Rule 1.
