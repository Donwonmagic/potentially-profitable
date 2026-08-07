# ADR-024 — The Queue: work is a machine-readable list with proof-of-done, not a document

**Status:** Accepted
**Date:** 2026-08-07
**Owner:** Don Goldstein

> **Decision.** All work in both repos lives in one machine-readable queue
> (`data/queue.json`), rendered to `docs/handoff/QUEUE.md`. Every item carries an
> objective `doneWhen` and a `verify` command. **An item is closed only by running
> that command and observing exit 0** — `--done` refuses to write a closure
> otherwise — and `--verify --all` re-runs every closure and reopens what
> regressed. **A HIGH item with nobody's name on it makes `check-queue.mjs` exit
> 1**, and that gate is run by a `SessionStart` hook in both repos rather than by
> `check-all`, because the gate is supposed to be red and the deploy is not. The
> `strategic-council-board.md` keeps narrative history and **loses the tracking
> job**.

## Context

Measured across 8 prior audit artifacts and 49 named findings, on 2026-08-07:

- **26% close rate.** 14 findings were fixed by the same session that found them
  (0 days). Of the 38 that outlived their session, **10 were ever closed — every
  one incidentally**, by a later thread that happened to touch the file.
- **Zero closures in the company's history came from anyone working an audit's
  list.**
- 80–84% of commits in both repos are authored by "Claude"; there had been zero
  human commits in either repo for seven days.

So the bottleneck is not recording. `docs/handoff/strategic-council-board.md` is
1,488 immaculate lines and `board-archive.md` is another 993. The bottleneck is
that **only an agent session produces work, and no session was ever pointed at a
backlog.** Four scheduled workflows in the product repo already diff-and-open-an-
Issue; nothing consumed that queue either.

Two more measurements shaped the design:

- **The contract does not load.** 1 of 108 agent transcripts in this engagement
  carried a `CLAUDE.md`. Every rule that was obeyed was obeyed because a human
  hand-copied it into a prompt. Anything that depends on `CLAUDE.md` being read is
  not a mechanism.
- **Green does not mean grounded.** 27 of 40 hand-classified gates assert the
  presence of a shape; 56 of `check-all`'s entries are tautologies where the deploy
  runs a builder and then asks the builder whether its own output matches. And
  `check-cost-index-basis-leak.mjs` passed for months while naming as *covered* the
  very file publishing a BLS index value as `$393.06/lb` (ADR-023).

## The flow

```
   the four crons (product repo)          a session (either repo)
   flake / mutmut / hypothesis /                    │
   competitor-claims / ocr-bench                    │  SessionStart hook
            │                                       ▼
            ▼                            check-queue.mjs --brief
   queue-consumer.yml  09:00 UTC          "NEXT: Q-00N … claim it: …"
            │                                       │
            ▼                                       ▼
   data/queue-inbox.json  ──── --absorb ───►  data/queue.json  ◄── --claim / --done
   data/queue-heartbeat.json                        │
            │                                       ▼  (auto-render)
            └──── --heartbeat ──────────►  docs/handoff/QUEUE.md
```

## Decision

1. **`data/queue.json` is the source of truth; `docs/handoff/QUEUE.md` is a
   rendered view.** Every write path in `check-queue.mjs` re-renders the board, so
   the two cannot drift except by hand-editing the markdown, which `--check`
   catches. A human-readable board that a machine cannot claim against is what the
   last four tracking surfaces were.

2. **Every item carries a `verify` command, and `--done` runs it.** A closure
   records `verifiedBy` (the exact command) and `verifiedIn` (which repo). Validation
   rejects an item with no `verify.cmd`, a `doneWhen` under 30 characters, no
   evidence, or a closure with no proof command. *Done is a claim until proven* is
   enforced in code, not asked for in prose.

3. **`--verify --all` re-proves every closed item and reopens what regressed.** A
   tidy board can be out of date; this is how it finds out. Status is never read
   from the `status` field — it is recomputed from evidence (`closed` record, open
   blockers, live claim), and the cached field is corrected on disk on every write.

4. **Claims expire after 7 days and are released by the machine.** Sessions end
   without warning; a dead session must not be able to park a HIGH item forever.
   The release is written into the file, because bookkeeping cannot live in agent
   memory.

5. **The gate is invoked by a `SessionStart` hook in both repos, and is NOT wired
   into `check-all`.** `check-all` runs inside the Cloudflare deploy, and this gate
   is *supposed* to be red while HIGH work is unclaimed; wiring it would make a red
   deploy the normal state and teach everyone to ignore the deploy — the disease,
   not the cure. (The board already records PR #536 "merged with three reds the
   founder accepted.") It is registered in `check-gate-coverage.mjs`'s `UNWIRED`
   registry, **in no mode at all**: that registry classifies by substring match on
   the filename, so wiring even the harmless `--self-test` would mark the script
   "wired" and hide that the gate never runs in CI — the same blind spot this repo
   found in `check-idem-coverage`.

6. **The consumer lives in the PRIVATE product repo.** GitHub disables scheduled
   workflows in **public** repositories after 60 days of inactivity, and the
   storefront is public. `queue-consumer.yml` runs at 09:00 UTC — after the 06:00,
   07:00 and 08:00 nightlies — reads its own repo's Issues with the built-in
   `GITHUB_TOKEN`, and maintains **one rolling `[queue]` Issue** rather than one per
   finding. No cross-repo PAT is minted; that stays a founder call (Q-053).

7. **`data/queue-heartbeat.json` proves the consumer is alive.** `--heartbeat` goes
   red past 3 days. A scheduler that has been silently switched off is otherwise
   indistinguishable from one where nothing is wrong — which is the same argument
   `check-gate-coverage.mjs` makes about gates.

8. **A cron finding is a signal, not a decision.** The consumer never promotes an
   inbox entry into a queue item. Promotion means writing a done-condition and a
   command that proves it, which is a judgement. Auto-promotion would refill the
   queue with rows nobody wrote a `doneWhen` for.

9. **One in, one out.** An item with `kind: "mechanism"` is rejected by validation
   unless it names a non-empty `retires` list, and closing it appends that list to
   `retirementLedger`. In a company running ~53 obligation-hours against 13–26
   available, a new mechanism that retires nothing is addition wearing a plan's
   clothes.

10. **Founder items get machine-checkable traces too.** `--attest` requires a dated,
    named, substantive statement in the queue for acts an agent cannot perform (a
    signature, a declined option). The act stays human; the *record* of it is
    mechanical.

## What this retires

| Retired | Kept |
|---|---|
| `strategic-council-board.md` as a **tracker** — its CURRENT STATE / in-flight / open-questions role | The board as narrative history, append-only |
| §2 of `docs/handoff/company-audit-2026-08-07.md` as a live to-do list | The audit as a dated, frozen findings document |
| Ad-hoc "next steps" sections across the other handoff docs | Those docs as reference |
| The unbounded per-finding Issue pile from four crons | One rolling `[queue]` Issue + a machine-readable inbox |

That is the honest accounting. Deleting 162 already-orphaned pages (Q-052) is
*not* counted here: **retiring what nothing reaches retires zero obligation.**

## Walk receipt

Verified in this container on 2026-08-07:

- `node scripts/check-queue.mjs --self-test` → OK, 31 assertions (including that a
  `status: "done"` with no closure record is **not** done, that an unknown blocker
  blocks, that a mechanism retiring nothing is rejected, and that `render()` is
  deterministic).
- `node scripts/queue-ingest.mjs --self-test` → OK, 15 assertions.
- `node scripts/check-queue.mjs` → exit **1**, 10 unclaimed HIGH items, top item
  printed with its claim command.
- `node scripts/check-queue.mjs --done Q-003 --by session:phase-e-queue` → ran the
  item's own verify command, which printed `basis-leak self-test: 23/23 passed` and
  `feed.json: 0 of 82 references diverge >3x from index.json`, then wrote the
  closure. **The first item ever closed at Muntin by proof rather than by
  assertion.**
- `node scripts/check-gate-coverage.mjs` → 131 scripts, 126 wired, 5 documented,
  0 silent gates.
- Both `SessionStart` hooks executed directly and printed the brief.

**Honest limits.** `queue-consumer.yml` has **not** run — it needs a scheduled
trigger on GitHub, which this container cannot produce, so `--heartbeat` is red and
Q-051 is open rather than closed. `--absorb` has been exercised only against an
absent inbox. And the queue is committed to a **public** repo: it enumerates live
defects on a public site, which is a deliberate acceptance — the audit that names
the same defects is already committed there, and the strategy of record
(`/close/limits/`, `/cost-index/corrections/`) publishes defects on purpose.

## Alternatives rejected

- **A markdown-only board.** Simplest, and it is what already failed four times. A
  machine cannot claim, expire a claim, or refuse a false closure in prose.
- **Wiring the gate into `check-all`.** Would red the Cloudflare deploy by design.
- **Auto-promoting cron findings to queue items.** Produces rows with no
  done-condition; that is how the backlog becomes unreadable.
- **A cross-repo PAT so one queue spans both repos.** Correct eventually, but it
  mints a credential on a workflow's own initiative. Recorded as Q-053 instead.
- **Putting the scheduler in the storefront.** Public repo; 60-day silent disable.

## Consequences

- Any session, in either repo, is told the top item before it invents work — whether
  or not `CLAUDE.md` loads.
- The queue is red today and will stay red until HIGH items are claimed. That is the
  intended reading, exactly as `check-cost-index-dispatch-fresh` reding means "write
  this month's edition."
- A closed item can reopen itself. Expect the board's "Done" column to move
  backwards occasionally; that is the mechanism working.
- Two documents lose a job. Nothing new is added to the board, and the audit is
  never edited again.
