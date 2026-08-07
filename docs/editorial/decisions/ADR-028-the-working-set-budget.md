# ADR-028 — Forgetting is a budget that fails CI, not a chore

**Status:** Accepted
**Date:** 2026-08-07
**Owner:** Don Goldstein

> **Decision.** The documents this company keeps are classified into exactly three
> states in `docs/contracts/working-set.json` — **working** (a session is pointed at
> it, counted against a line budget), **reference** (retrievable on demand, cited by
> something, not read by default), **archive** (moved under `docs/archive/`, out of
> the working set). There is no fourth state, and an unclassified document fails
> `scripts/check-working-set.mjs`. The working set is capped at **400 AUTHORED lines**
> — generated working documents are reported but not budgeted — and any working
> document at **35% episodic narration**. Raising the budget requires an ADR. The 2026-08-07 retirement is `docs/contracts/retirement-2026-08-07.json`:
> **21 files / 5,668 lines ARCHIVED**, **16 files / 1,374 lines DELETED** (all
> byte-identical duplicates). **ADRs never retire.**

## Context

**A forgetting policy already exists here and it loses.** The board was
consolidated to 252 lines on 2026-07-17 with the note "consolidated to load in one
read", and reached **1,504 lines within fourteen days** across three further manual
compactions, each re-inflated inside 48 hours. Measured by
`git show <sha>:docs/handoff/strategic-council-board.md | wc -l` at every commit
touching the file: 252 → 1155 → 851 → 920 → 1237 → 937 → 1439 → 1001 → 1488.
**Decay implemented as a chore loses to write pressure 3 out of 3 times measured.**

**The store is mostly log, and the non-log part is where the falsehoods are.**
`node scripts/check-working-set.mjs --json` classifies the board at **87.3% log
(1,314 of 1,505 lines)** — 100 FACTS lines, 91 SKILLS lines, 1,314 LOGS —
concentrated in six stacked `CURRENT STATE` blocks of 394, 323, 282 and 113
lines. Across the whole 2,823-line working set: **FACTS 1,396 (49.5%), SKILLS 91
(3.2%), LOGS 1,336 (47.3%)** — and 1,181 of those FACTS lines are the generated
`QUEUE.md`, so of the 1,622 lines a human actually wrote and a session actually
reads, **only 215 are facts or skills.** The fact-lines are also the ones that
went false: five different branch names in one file, two different `(idem)`
builder counts, an ADR index naming 5 of 31 ADRs.

This is the ratio the deliverable asked for, and it is worse than the headline:
the board is not 87% log *and* 13% useful. It is 87% log, 6% skills, and 7%
facts of which several are wrong.

**Founder capacity is ~13–26 hours a month against an obligation load already
2–4x that.** The measured payment rate on existing maintenance obligations is
about 10%. Anything that costs founder-hours on a cadence will not be paid.
Something that fails CI will be.

**Growth is the default and nothing has ever been retired.** 90 → 320 gates in 33
days. 239 markdown files under `docs/`, 40,846 lines. ~70 runbooks. 16 planning
docs across 2,937 lines. 76 of the 239 docs are referenced by nothing in either
repo. 16 are byte-identical duplicates of each other.

## The flow

```
ROOTS = docs/**, CLAUDE.md          (SKIP list: 5 trees, each with a stated reason)
        │
        ▼
docs/contracts/working-set.json     every file → working | reference | archive + why
        │                            unclassified → FAIL (no fourth state)
        ▼
scripts/check-working-set.mjs
   ├─ Σ lines(working, authored) ≤ budget.lines (400)   → else FAIL, naming the largest
   ├─ logRatio(each working file) ≤ 0.35                → else FAIL, naming the sections
   └─ every classified path still exists                → else FAIL (stale registry)
        │
        ▼
docs/contracts/retirement-2026-08-07.json   the actual list: 21 ARCHIVE, 16 DELETE
        │
        ▼
queue Q-080 (execute) → Q-081 (wire into check-all)   the only things that run it
```

## Decision

1. **Three states, no fourth.** Deliberately the same shape as
   `check-gate-coverage.mjs` (wired / UNWIRED-with-reason / nothing else) — the one
   meta-gate in this repo that demonstrably forced its own registry to be cleaned
   when PR #530 deleted a script.

2. **The budget is 400 AUTHORED lines**, and generated working documents are
   reported but not budgeted. `CLAUDE.md` is 117; the remaining 283 is headroom for a
   contract that has to fit inside a session's first read. `docs/handoff/QUEUE.md`
   (1,201 lines, rendered from `data/queue.json`) is excluded because its length is a
   function of how much OPEN WORK exists — budgeting it would punish the one
   mechanism in this company that turns a finding into work, and the only way to
   clear that red would be to close items (real progress, but not something a budget
   should be able to demand) or delete work nobody did (the disease itself).

3. **A working document may be at most 35% log.** Episodic narration belongs in
   `git log`, which holds the same events with authorship and diffs and has never
   gone false. `QUEUE.md` is allow-listed with a reason: it is generated, and its
   `evidence` fields legitimately cite commit SHAs that the line-level heuristic
   reads as narration.

4. **Archive is the default; delete is the exception.** Same reasoning as
   CLAUDE.md:32 on pages: the artifact costs nothing to keep and something to
   re-derive; what costs is **maintenance and attention**, and archiving removes
   both. Deletion is reserved for content that provably loses nothing — here, 16
   byte-identical duplicates under `docs/handoff/bones/panels/`, md5-verified against
   their siblings.

5. **Nothing is rewritten, summarised or condensed.** A summary is a new document
   with a new decay curve; a move is not. The three prior board compactions were
   rewrites, and all three re-inflated.

6. **ADRs never retire.** `docs/editorial/decisions/**`, `docs/design/decisions/**`
   and `docs/brand/decisions/**` are excluded by rule. They are decisions of record;
   their whole value is that they outlive the thread that produced them.

7. **The retirement executes through the queue, not through this document.**
   `retirement-2026-08-07.json` is a manifest; **Q-080** is what runs, with a
   `verify` command that must exit 0 before a closure is written. A
   retirement list that only lives in prose has, by this company's own measurement,
   a 26% chance of mattering.

## Walk receipt

- `node scripts/check-working-set.mjs --self-test` → OK (3 assertions on the
  section classifier).
- `node scripts/check-working-set.mjs` **exits 1 today, by construction**:
  1,622 authored lines against a 400 budget, and the board at 87% log against a 35%
  ceiling. It names the four offending sections with their line numbers.
- The 87% figure was produced independently by this script and matches the 87.8%
  hand-classification in `docs/handoff/bones/os-memory.md` (1,307 of 1,489 lines,
  measured at a different commit). Two methods, one answer.
- After Q-080 the authored working set is `CLAUDE.md` alone — 117 of 400 lines,
  2% log — and the gate goes green. Checkable in advance with
  `node scripts/check-working-set.mjs --json`.
- ADRs auto-classify as `reference` by a directory DEFAULT rather than by
  enumeration. That was not the first design: the gate initially demanded every ADR
  be named, and within minutes it redded on `ADR-030` and `ADR-031`, written by a
  parallel session. A gate that punishes writing an ADR teaches people not to write
  ADRs, so the rule became a rule.
- Duplicate detection is md5 over every file under `docs/`: 16 redundant copies,
  1,374 lines, all in `docs/handoff/bones/panels/`.

**Honest limits.** The FACTS/SKILLS/LOGS classifier is a heuristic over headings
and line markers (`SECTION_KIND`, `LINE_LOG` in the script), not semantics. It will
mis-file a runbook written in the past tense. That is why it reports the ratio with
the specific sections it counted rather than rewriting anything. The gate also
cannot tell whether a `reference` document is *actually* referenced by anything —
that is a separate scan, deliberately not built today, because the one thing this
company does reliably is add mechanisms.

**And the honest risk:** this gate fails on the day it is written, which is exactly
the shape of a red that gets ignored. See "Consequences".

## Alternatives rejected

- **"Adopt a forgetting policy: dedup, consolidate, decay on a cadence."** That
  policy already exists, in the board's own header, and lost three times in
  fourteen days.
- **Compact the board again.** Four data points say it regrows. The fourth would be
  a fourth data point.
- **Rewrite the board into a facts section and a skills section.** Prose facts are
  exactly what rotted. A move preserves the record; a rewrite creates a new one to
  maintain.
- **Delete the superseded planning docs.** They cost nothing on disk and their
  reasoning is occasionally the answer to "why is it like this". Archiving removes
  the attention cost, which is the actual cost.
- **A five-store memory stack** (standards / project / fragile / handover /
  vocabulary). Five stores for a one-person company is the additive reflex that
  produced 320 gates and 239 docs with nothing ever retired.

## Consequences

- `scripts/check-working-set.mjs` is **UNWIRED** on arrival and registered as such
  in `check-gate-coverage.mjs` with its measured failing status — because
  `check-all` runs inside the Cloudflare deploy and CLAUDE.md:50 forbids wiring a
  failing gate. It is invoked by `.claude/hooks/session-start.sh`. **It gets wired
  into `check-all` by Q-081, after Q-080 clears it** — that ordering is a decision,
  not an oversight.
- **Will this become another ignored red?** Possibly. The three properties that
  make it different from the compaction chore: (a) it costs zero founder-hours
  until it fires; (b) the fix is a `git mv` list already written out in
  `retirement-2026-08-07.json`, not a judgement call; (c) it is cleared by a queue
  item with a `verify` command, so "done" is proven rather than asserted. The
  property that would make it *fail* is the one thing not yet true: it is not in
  `check-all`, so nothing forces the issue except a session reading the hook
  output. **The single change that would most improve its odds is Q-081 landing** —
  a gate in the deploy is paid; a gate in a hook is read.
- **Retires:** `docs/handoff/strategic-council-board.md` and `board-archive.md`
  from the working set (2,497 lines); 19 further superseded or retired-line
  documents; 16 duplicate files. Total: **37 files, 7,042 lines** out of the working
  set, of which only the 16 provable duplicates leave the repository.
- The board's tracking role was already retired by ADR-024. This retires its
  **read-first** role, which ADR-024 left in place.
