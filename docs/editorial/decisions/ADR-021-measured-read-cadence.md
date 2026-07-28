# ADR-021 — The measured read publishes on the refresh; the dispatch stays monthly

- **Status:** Accepted (founder decision, 2026-07-28, in session)
- **Date:** 2026-07-28
- **Owner:** Cost-Index / publication thread
- **Review by:** 2027-01-28
- **Relates to:** **ADR-011 (monthly cadence — stands, unchanged)**, **ADR-012 (manual
  authorship — stands, unchanged; no cron generates or publishes a post, and the email
  remains a one-click manual button)**, ADR-010 (citable publication), ADR-015 (CC0/CC-BY
  split), `docs/fact-check.md`.

> Decision: the **measured basket read** becomes an of-record artifact on every Mon/Wed/Fri
> refresh, recorded in its **own append-only spine** and surfaced as an observation band on
> `/cost-index/`. The **dispatch remains monthly, hand-written and hand-published**, and the
> subscriber email remains manual. A read is recorded **only when it actually changes**;
> unchanged refreshes advance a `lastCheckedAt` stamp instead of republishing.

## Context

The founder asked: "we should produce a basket read update every time the index refreshes
(M/W/F), just hold the full dispatch for monthly. But the basket read doesn't have to wait
for monthly."

Investigation found the read was **already live** — the hub renders the current basket
reading and the refresh regenerates `cost-index/` M/W/F — but the **citable record was
not**. `data/cost-index-editions.json` gains an entry only when
`build-cost-index-dispatch.mjs` runs for a hand-published edition; it held 4 entries, the
most recent `2026-07-06`, while the pages had moved on. The refresh does not run that
builder and does not commit that file.

Two facts then shaped the design.

**1. The edition spine cannot absorb refresh observations.**
`build-cost-index-archive.mjs` renders `/cost-index/weekly/` as "an index of every weekly
dispatch **edition** … each edition is a permanent, citable record" — a record of
*publications*. And `computeWoW(current, prev)` anchors against the previous spine entry,
so adding M/W/F rows would silently redefine "edition-over-edition" as
"two-days-over-two-days". That is precisely the commensurability hazard ADR-011 guards.
A measured read and a published edition are **different objects**.

**2. The basket does not actually move three times a week.**
Measured on 2026-07-28: of the basket's 16 contributors, **10 sat at data vintage
2026-04-01**, 4 at 2026-06-05, 2 at 2026-06-01. The basket rides mostly monthly public
series. Appending one row per refresh would republish identical numbers under a
fresher-looking date three times a week — manufactured freshness, which `docs/fact-check.md`
forbids as squarely as an invented number.

## Decision 1 — A separate, append-only measured-read spine

`data/cost-index-reads.json` (internal) with public CC0 mirrors at `cost-index/reads.json`
and `cost-index/reads.csv`, built by `scripts/build-cost-index-reads.mjs`. It is a
deterministic recompute of public-domain US government data, so CC0 per ADR-015 Decision 2.

`data/cost-index-editions.json` is untouched and keeps its meaning: the record of
hand-published dispatches, and the only thing WoW may anchor on.

## Decision 2 — Append on change; confirm in place otherwise

A row is appended only when the read's **signature** changes: data vintage, freshest
contributor date, basket pct/dir/agreement/confidence/coverage, contributor counts, and the
measured-ingredient count. When the signature is unchanged, the existing row's
`lastCheckedAt` advances and **no duplicate row is minted**.

"We looked on this date and nothing moved" is a true and useful statement to an operator.
"Updated today" over an April vintage is not.

## Decision 3 — The two dates are never collapsed

Every row and every rendered sentence carries both:

- **`dataAsOf`** — the vintage of the underlying public series (plus
  `freshestContributorAsOf`, the newest contributor date, since `basket.asOf` alone
  understates it).
- **`firstSeenAt` / `lastCheckedAt`** — when Muntin observed it.

The hub band therefore reads: *"Observed Mon/Wed/Fri · unchanged since 28 Jul 2026, last
checked 30 Jul 2026 · data through 2026-06-01"*, with the standing caveat that this is a
wholesale reference, never a delivered price and never a forecast.

## Decision 4 — ADR-012 is NOT reversed

No post is generated. No email is sent. The dispatch remains monthly, hand-written and
hand-published; `cost-index-dispatch.yml` keeps its no-cron, one-click-email posture. This
ADR adds a **data artifact and a status band**, not a publication. The founder was asked
directly and chose to keep the email monthly.

## Consequences

- Between dispatches there is now a citable, dated trail of what the instrument measured
  and when it looked — and, importantly, an honest record of *stillness*.
- The read log makes source **revisions** visible: if an agency revises history, the read
  changes between observations even when the data vintage does not, and that becomes a
  recorded row.
- The `/cost-index/weekly/` archive stays a clean record of publications.
- Wired into `cost-index-refresh.yml` (run + pre-commit `--check`, and
  `data/cost-index-reads.json` added to the commit set) and into `check-all.mjs` (both
  self-tests + both `--check`s), per the standing rule that any injector owning a page
  region must be registered in both.
- If the read log ever grows a row per refresh, something is wrong: either the change
  detector broke or the sources genuinely turned high-frequency. Both are worth knowing.

## What would reverse this

- Sources becoming genuinely high-frequency for most of the basket, at which point
  "append on change" and "append per refresh" converge and the distinction stops paying.
- A decision to make the read a *publication* (its own dated URL per read, or an email).
  That would need a new ADR, because it re-opens ADR-012's clause; the founder explicitly
  declined both on 2026-07-28.
