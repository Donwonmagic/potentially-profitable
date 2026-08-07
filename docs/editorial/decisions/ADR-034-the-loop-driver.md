# ADR-034 — The Loop Driver: readiness converges or the loop halts and says so

**Status:** ACCEPTED · **Date:** 2026-08-07 · **Owner:** Don Goldstein
**Supersedes nothing. Builds on** ADR-024 (the queue), ADR-027 (the hook), ADR-033 (the ninety days).
**Executable form:** `scripts/loop-driver.mjs` + `data/loop-policy.json`. This file is the reasoning; the script is the decision.

> Work is produced only by agent sessions, and no session has ever been pointed at the backlog.
> `scripts/loop-driver.mjs` is the thing that points one. It fires, it halts on named
> conditions, it claims one item atomically through `check-queue --claim`, it hands the
> session a brief with the proof command already written, and it appends one line to
> `data/loop-runs.jsonl`. **It is rate-limited by founder capacity, not by agent throughput**,
> and it stops when it stops moving.

## Context

Fifteen domain validators returned 13 NOT_READY, 2 READY_WITH_GAPS, 44 blocking gaps. The
obvious response — re-run the panel until it says READY — cannot terminate. Every validator
was told "a validator who finds nothing has not validated anything", so a gap-seeking agent
always finds a gap. That loop regresses forever or ends by exhaustion with the bar quietly
eroded. This company already owns 5,005 lines of planning corpus produced by exactly that
dynamic, against a **26% close rate with zero closures ever coming from anyone working a list.**

## Decision

**1. Readiness is an exit code.** A domain is ready when every blocking verifiable item in it
exits 0 (`check-readiness.mjs`, already built). The driver consumes that verdict; it never
renders one.

**2. A gap with no verify command is a DECISION, not work.** It routes to the founder and never
enters the loop. 18 of 101 register records are decisions today. The driver refuses to promote
one, and `check-readiness --self-test` refuses a decision that does not say what the question
is, why no test can be written, and who answers.

**3. The rate limit is founder capacity, in three bands** — all arithmetic in
`data/loop-policy.json`, all derived from `data/queue.json#capacity`, none invented here:

| band | threshold | derivation | what it stops |
|---|---|---|---|
| **INTAKE**, per window | 10.5 h open | 13 floor − 2.5 review overhead. Floor because `capacity.planAgainst` literally says `"floor"`. | promotion only — **agent execution is never blocked by founder load**, because punishing the cheap lane for the expensive one closes the loop entirely |
| **GROWTH**, per 5 briefs | +10.5 h | one window of executable capacity | the loop itself. The inherited backlog is not the loop's fault; growing it is. **This is the band that actually binds rule 3.** |
| **GLOBAL**, 90 days | warn 31.5 h / halt 70.5 h | (floor−overhead)×3 / (ceiling−overhead)×3 | everything. Floor-warns / ceiling-fails is not new — it is what `check-queue --budget` already does per window. |

An earlier draft halted the whole loop at the floor budget. It halted on its first run over a
0.25 h overage, and **a driver that never fires delivers nothing** — the same lesson as a hook
that breaks sessions. The cliff moved to the ceiling; the floor warns.

**4. Convergence is measured in closures, not in gap counts.** Over the last 5 EXECUTE briefs, at
least one queue item must have closed or one readiness item must have passed for the first time.
Zero = `DIVERGENCE` = halt and escalate. Not a raw blocking count: intake legitimately raises
that, and a loop halted for doing its job is a loop nobody runs twice. Closures cannot be
inflated — `check-queue --done` refuses to write one without a passing verify command.

**5. The target is "ready enough to start", and the founder already wrote the set down.**
`capacity.floorPlan.whatIsNeverDropped` — Q-002, Q-001, Q-013, Q-014. The driver reads that
field rather than inventing a bar. 4 of 4 are open today; execution and the loop run concurrently.

**6. Isolation.** Claims are taken serially in the main tree (single-writer JSON). Each lane's
session gets a **detached git worktree pinned to the sha in its brief**, so a measurement cannot
have its denominator move underneath it — the failure six concurrent agents in one tree already
produced in this engagement. Max 3 lanes; default 1. Selection is guarded by an `O_EXCL` lease
(90 min): the kernel picks the winner of a race, not this script.

**7. The write surface is three paths**, asserted by `--self-test`: `data/loop-lease.json`,
`data/loop-runs.jsonl`, and `data/queue.json` **only** by shelling out to `check-queue --claim`.

**8. The trigger is the session-start hook.** Measured: 1 of 108 transcripts carried a CLAUDE.md;
the hook ran in all of them. The storefront is PUBLIC and GitHub disables scheduled workflows in
public repos after 60 days idle, so **it gets no new cron**. The product repo's daily
`queue-consumer.yml` cannot check out the storefront without a cross-repo PAT that does not
exist — issuing it is a founder call, not something a session adds silently.

**9. The handoff is declared, not discovered.** Seven things the loop cannot do are enumerated in
`data/loop-policy.json#handoffLimits` and printed on every status run: no signature, no phone
call, no price decision, no real month-end, no counsel, no production deploy, no live data fetch.

## What this retires

- `docs/handoff/bones/validate-*.md` (15 files) **as a work source** — the driver reads
  `data/readiness-register.json` and nothing else; a `--self-test` assertion enforces it.
- `check-readiness --next` and `check-honesty-debt --next` as separate entry points a session
  must know about. One command answers "what do I do".
- The practice of a session choosing its own work. Selection is deterministic.
- The stack trace `check-readiness.mjs --brief` printed into every session from the hook,
  swallowed by `|| true`.

## Walk receipt — what running it actually found, 2026-08-07

Verification here is code reasoning + `--self-test` + real runs in this container. No browser,
no device, and no claim that any of this has yet closed a gap. Self-test counts at the time of
writing: loop-driver 50, check-readiness 58, check-convergence 52, check-readiness-register 12,
check-queue 46 — **218 assertions, all passing.** A self-test proves the arithmetic, not the
world; every one of them would still pass on a company with no customers, which is the company
this is.

1. **`check-readiness.mjs` had never been run against its own register.** The builder emits one
   schema, the gate expects another; `--brief` threw `TypeError: Cannot read properties of
   undefined (reading 'map')` on every session start. Fixed by an adapter
   (`normalizeRegister`), not a migration. Readiness now reports: **0/15 domains ready, 2/83
   verifiable items proved, 18 decisions routed to the founder, 66 agent-executable** out of 101
   loop-eligible records (32 duplicates and opinions dropped by the register's own classifier).
2. **The queue had been unusable since Q-084–Q-087 were added.** `validate()` returned 21 errors
   (missing priority, window, `blockedBy`, evidence; `founderHours > 0` on `owner:agent`), so
   `check-queue` refused **every `--claim` and every `--done`**. Nobody could have closed
   anything. Repaired using each validator's own declared cost, and `QUEUE-MALFORMED` is now a
   halt reason — the driver's first fire reported `IDLE`, which reads as "no work" instead of
   "the ledger is broken".
3. **M1 intake is closed.** 14.5 h of open founder work against 10.5 h executable, headroom
   −4.0 h. M2 +0.5 h, M3 +2.0 h. Windowing the four repaired items moved 1.25 h from *unbudgeted*
   into M2 — hours that always existed and were invisible to the budget.
4. **A two-lane fire worked end to end**: two atomic claims through `check-queue`, two detached
   worktrees at `2f43afab`, two complete briefs, two ledger lines, lease released. Claims were
   released afterward because this session was not doing the work.

## Alternatives rejected

**1. Loop until all 15 validators return READY.** This is the obvious design and it is the
reason this ADR exists, so it gets the most space.

It cannot terminate, and not for a tuning reason. Every validator was prompted that *"a
validator who finds nothing has not validated anything."* That instruction makes the verdict a
function of the prompt rather than of the repo: a gap-seeking agent asked to find gaps will
find gaps in a perfect artifact, because "find nothing" is indistinguishable from "did not
look". So the loop has exactly two ends. It regresses forever — each pass closes items and the
next panel discovers more, which is the close-3/discover-4 pattern `check-convergence.mjs`
detects by name. Or it ends by exhaustion: someone re-runs the panel until the count is small
enough to call it, and the bar is what eroded, silently, with no record that it moved. The
second ending is worse than the first because it *looks* like success.

The measured evidence that this is not hypothetical: this company owns **5,005 lines of
planning corpus across 18 artifacts**, produced by exactly this dynamic, against a **26%
historical close rate with zero closures ever coming from anyone working a list**. Running the
panel again is the activity that produced the corpus. It is not the fix for the corpus.

The replacement is not "trust the validators less". It is to strip the verdict of its authority
entirely: a domain is ready when **commands exit 0**, and the validator's prose survives only as
the claim a command retires. ADR-035 does the same operation on the panel's own numbers.

**2. Let the loop run to 100% before execution starts.** Rejected: the target is *ready enough
to start*, and the founder already wrote that set down in
`data/queue.json#capacity.floorPlan.whatIsNeverDropped` (Q-002, Q-001, Q-013, Q-014). The driver
reads that field instead of inventing a bar. Waiting for 100% is precisely how the planning
corpus happened; execution and the loop run concurrently, and `START GATE SHUT` reports the four
without blocking the loop.

**3. Rate-limit the loop by agent throughput.** Rejected, and this is the subtle one. Agent
throughput is effectively free and founder capacity is fixed at 13–26 h/month **permanently** —
so a loop tuned to close agent items quickly does not produce progress, it produces *review
debt* at a rate no one can absorb, and every unabsorbed item still reads as "closed" on the
agent side. The limit is therefore priced in founder-hours and applied at **promotion**, the
only step that can manufacture that debt. Agent execution is never blocked by founder load;
punishing the cheap lane for the expensive one just stops the loop.

**4. Measure convergence as a falling blocking count.** Rejected: intake legitimately *raises*
the blocking count, so this halts the loop for doing its job — and a loop that halts for doing
its job is a loop nobody runs twice. Convergence is measured in **closures**, which cannot be
inflated because `check-queue --done` refuses to write one without a passing verify command.

**5. Let an agent judge whether an unverifiable gap is closed.** Rejected: that is the
credulity failure ADR-035 measures, re-introduced at the point where it would do the most
damage. A gap no command can evaluate is a **decision**, it routes to the founder, and the
driver refuses to promote it — 18 of 101 loop-eligible records today.

**6. Make the loop a document describing how to run it.** Rejected on the forensic finding this
whole engagement turns on: the three design ADRs are live and the five design *plans* are not,
because an ADR is cited by gates and cannot be quietly abandoned while a plan has no citation
surface and dies silently. The loop is a script, a policy file, and two hooks that run it.

## Consequences

- Someone will be tempted to raise the intake ceiling when it blocks something they want. That
  edit is visible in `data/loop-policy.json` and its derivation string will no longer match
  `data/queue.json`, which `--self-test` fails on.
- The loop cannot certify the company ready. It can only prove that specific commands exit 0 and
  report honestly that 18 questions are waiting on one person.
- If the founder never answers those 18, the loop keeps running, keeps closing agent items, and
  keeps printing `START GATE SHUT`. **That is the correct outcome, not a bug** — it is the
  arithmetic of 13 h/month made visible every session instead of once a quarter.
