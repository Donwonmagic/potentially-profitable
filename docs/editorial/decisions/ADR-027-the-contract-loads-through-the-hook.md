# ADR-027 — The contract is a function of scope, delivered by the hook, with compiled facts

**Status:** Accepted
**Date:** 2026-08-07
**Owner:** Don Goldstein

> **Decision.** The rules that govern this company become data — `docs/contracts/rules.json`,
> one record per rule with an id, a glob `scope`, a `priority`, the `source` line it
> was written at, and the gate that enforces it. `scripts/lib/contract.mjs` exports
> `contractFor(paths[])`, which returns the always-on CORE plus every rule whose scope
> intersects the paths a task will touch. **The delivery channel is
> `.claude/hooks/session-start.sh`, not `CLAUDE.md`**, because 1 of 108 agent
> transcripts in the 2026-08 engagement carried a `CLAUDE.md` and the hook runs
> whether or not the contract loads. `scripts/check-contract-injection.mjs` fails if
> the hook stops rendering the contract, if a committed spawner builds a prompt
> without it, or if a rule's prose `source` no longer contains its `anchor`.
> Separately, **every factual claim CLAUDE.md makes about this repo is COMPILED**
> from `data/system-graph.json`, `data/surface-inventory.json` and the filesystem
> into `<!-- fact:KEY -->N<!-- /fact -->` sentinels by
> `scripts/build-contract-facts.mjs`, and **no committed file may state a literal
> branch name as "the current branch"**.

## Context

Three measurements, all taken 2026-08-07.

**1. The contract does not load.** Across the 108 agent transcripts of this
engagement — the largest in company history — the marker `# claudeMd` /
"project instructions, checked into the codebase" appears in **one**. 37 of the
56 unique subagents ran with cwd = `/home/user/potentially-profitable` and
received nothing. The premise underneath every CLAUDE.md discipline ("the file
loads into every session, so every line must earn universal applicability") is
false here, because the workforce is workflow subagents.

Adherence tracked the **task prompt**, not the file. Board-read language appeared
in 41 of 56 first-user-messages, root-list discipline in 14, the fact gate in 16 —
and where the prompt carried the rule, compliance was near-perfect: all 5 agents
that wrote a scanner declared an explicit skip list with per-entry reasons, which
is exactly what the most-emphasised storefront rule demands. So the mechanism
works. The hand-copying is the defect.

A rule's value is `P(the session sees it) x P(the session is in scope)`. Measured,
`P(sees it)` is **0.9% through CLAUDE.md** and effectively **100% through the
SessionStart hook**. Routing is a ~100x larger lever than pruning.

**2. The contract publishes falsehoods about its own repo.** The file that
governs an absolute fact gate was wrong in three places:

| CLAUDE.md | claimed | measured |
| --- | --- | --- |
| :21 | "`scripts/` … ~70 of them" | 391 `.mjs` directly under `scripts/` |
| :52 | "483 of 1428 pages" | 1,327 routable pages (`data/surface-inventory.json` `summary.pages`); 1,314 of them `index.html` |
| :54 | "`check-all` `--check`s 96 `(idem)` builders" … "Today: 83 builders" | 83 — `node scripts/check-idem-coverage.mjs` and an entry-tuple parse of `check-all.mjs` both say 83. The 96 was never right. |

Every one of these was correct once. Correcting them by hand recreates the decay
site. The company already invented the cure in its **public** prose —
`<!-- count:KEY -->N<!-- /count -->` sentinels re-derived from
`data/site-counts.json` — and never pointed it at the file a session reads first.

**3. Four artifacts declared four different current branches.** `CLAUDE.md` in the
product repo, the board header, the board's CURRENT STATE block and actual `HEAD`
all disagreed. Nothing single-sourced a mutable fact, so every restatement was an
independent decay site.

## The flow

```
docs/contracts/rules.json          the rules, as data (id · scope · priority · source · anchor · enforcedBy)
        │
        ├── scripts/lib/contract.mjs  contractFor(paths[]) → CORE + scope-matched rules, under a token budget
        │        │
        │        ├── .claude/hooks/session-start.sh    ← the measured delivery channel (100%)
        │        └── any committed spawner             ← required by check-contract-injection assertion C
        │
        └── scripts/check-contract-injection.mjs
                 A registry coherence + anchor-still-present
                 B the hook still renders it
                 C every spawner injects
                 D the glob matcher's own self-test
                 E the two repos share one selector

data/system-graph.json ─┐
data/surface-inventory.json ─┼── scripts/build-contract-facts.mjs → data/contract-facts.json
the filesystem ─────────┘                                        → <!-- fact:KEY --> sentinels in CLAUDE.md
                                                                 → refuses any literal "current branch" claim
```

## Decision

1. **`docs/contracts/rules.json` is the rule registry**, one per repo. The
   storefront's is public; the product repo keeps its own, because that repo is
   private and its architecture rules should not be published as a side effect of
   this mechanism. The **selector** (`scripts/lib/contract.mjs`) is byte-identical
   in both and gate-checked for it.

2. **CORE is capped at 8 rules.** The always-on block is the only part every
   session pays for, and an uncapped one becomes wallpaper. `check-contract-injection`
   fails above the cap, so adding a ninth core rule requires scoping or retiring
   another — the same one-in-one-out policy `data/queue.json` applies to mechanisms.

3. **Every rule cites `file:line` plus a verbatim `anchor`.** When prose moves, the
   gate fails with the line the anchor moved to, and **`--fix-anchors` repositions
   every moved source in one command**. It never changes an anchor, never touches a
   rule whose anchor has vanished, and refuses when the anchor became ambiguous —
   ambiguity is a judgement. That mode is not a convenience: editing CLAUDE.md by two
   lines moved 21 anchors within minutes of this ADR being written, and a red that
   costs 21 hand edits is a red that gets ignored.

   When the anchor vanishes entirely, the rule must be re-anchored or retired — a
   rule whose prose was deleted is a rule nobody decided to keep. That fired too:
   a parallel session rewrote the product repo's pricing paragraph while this was
   being built, and `PR-NO-BILLING-FIRST-COHORT` failed until it was re-anchored to
   the new sentence.

   **One gate checks both registries.** The product repo gets no gate of its own —
   a second gate is a second obligation, and that repo's `check-gate-coverage` would
   then demand it be wired into a workflow this container cannot run. Registry
   coherence is repo-agnostic, so it is checked from the side that has a runner.

4. **`enforcedBy: "none"` is a legitimate, published value, not a placeholder.**
   Five active rules have no detector (SF-ROOT-LIST, SF-SLUGS-FINAL, SF-ADR,
   SF-BYLINE, SF-NO-PACKAGE-JSON) and the rendered contract labels them
   *"NO DETECTOR — this rule is obeyed only if you obey it."* Pretending otherwise
   is what a partial gate does.

5. **The hook is the delivery channel.** `.claude/hooks/session-start.sh` prints the
   core contract at session start, in both repos. It never exits non-zero: a hook
   that breaks sessions gets deleted, and a deleted hook delivers nothing.

6. **Facts are compiled, not typed.** `build-contract-facts.mjs` measures a declared
   set of numbers from named sources and rewrites `<!-- fact:KEY -->` sentinels.
   It runs in **write mode** from the hook, so it self-heals before any session reads
   the file. Its `--check` mode exists for CI and is registered UNWIRED, because a
   script count drifts every time anyone adds a script and CLAUDE.md:54 already names
   that failure mode: *a builder the gate verifies but nothing re-runs turns drift
   into a red deploy no automation can clear.*

7. **A branch name is not a fact a document can hold.** No committed file may state
   a literal `claude/*` branch as the current branch; write `git branch --show-current`
   instead. Four historical/finding documents are allow-listed with reasons, because
   naming the branch a shipped thread ran on is the record, not a claim about today.

## Walk receipt

Verified in this container, which has no browser and no live agent harness:

- `node scripts/lib/contract.mjs --self-test` → **OK, 18 assertions** (glob matcher,
  path normalisation, scope selection, core cap).
- `node scripts/lib/contract.mjs --core` renders 8 CORE rules, ~1,100 tokens.
- `node scripts/lib/contract.mjs library/foo/index.html` adds SF-ARTICLE-FIGURES,
  SF-VIZ-SIGNED, SF-AUTOLINK-ATTR, SF-BYLINE, SF-DISPOSITION and **states in the
  output** that 2 lower-priority rules were dropped to stay inside the budget.
  A `data/cost-index-drivers.json` task receives SF-DRIVERS and SF-BASIS and **not**
  the article-figure rules — that asymmetry is the whole point.
- `node scripts/check-contract-injection.mjs` **failed on its own author** three
  separate times while being written: (1) two rules cited ADRs that did not yet
  exist; (2) the hook did not yet invoke `contract.mjs`; (3) a two-line edit to
  CLAUDE.md moved 21 anchors, and a parallel session rewriting the product repo's
  pricing paragraph broke a 22nd outright. All three are recorded here rather than
  quietly fixed, because they are the evidence that the detector detects.
- `node scripts/build-contract-facts.mjs --json` measures 31 facts. `gates.idemEntries`
  = **83**, independently matching `check-idem-coverage.mjs`'s own report — which is
  how we know the "96" in CLAUDE.md:54 was invented rather than stale.

**Honest limits.** Assertion C — "every spawner injects the contract" — is
**currently vacuous**: there are zero committed subagent spawners in either repo
(432 files scanned), because the orchestration lives in the harness outside both
trees. The script prints that on every run rather than reporting a green that
sounds like proof. Nothing here has been observed to change the behaviour of a real
spawned session; what has been demonstrated is that the rules a given task should
see can now be produced mechanically instead of recalled.

## Alternatives rejected

- **Prune CLAUDE.md to under 200 lines and trust that it loads.** It does not load.
  55 of 56 sessions — including all 5 that wrote code — ran with none, so a perfectly
  pruned file would have changed nothing about this engagement.
- **Introduce `IMPORTANT` / `YOU MUST` markers.** Both files have used them zero
  times and are already emphasis-saturated (64 bold spans in 113 storefront lines).
  A second emphasis channel on top of an exhausted unmanaged one dilutes both.
- **Correct the three wrong numbers and move on.** They were correct once too.
- **One shared `rules.json` across both repos.** The storefront is public and the
  product private; a single registry would publish the product's internal
  architecture as a side effect of a memory mechanism.
- **A gate asserting that CLAUDE.md "contains" a rule.** That is a shape assertion —
  it would go green while 108 of 109 sessions never saw the file.

## Consequences

- Adding a rule now costs a registry entry with a scope, a source line and an
  honest `enforcedBy`. Prose alone no longer counts as a rule.
- The 8-rule core cap will be hit. That is the intended pressure.
- `check-contract-injection.mjs` is **wired into `check-all`** (it passes today).
  `build-contract-facts.mjs --check` is **UNWIRED** with the reason above.
- **Retires:** the hand-copying of rules into task prompts as the delivery
  mechanism; the hand-typed numbers at CLAUDE.md:21, :52 and :54; and the practice
  of any document naming the current branch. `docs/contracts/rules.json` also
  supersedes the never-built five-store memory stack proposed in
  `docs/handoff/bones/os-claude-md.md` §3 — one registry per repo is the whole
  affordable store.
