# ADR-004 (PROPOSAL) — Unify banned-vocab into one shared, hash-locked catalog

- **Status:** **Proposed** — needs Brand coordination before adoption
- **Date:** 2026-06-08
- **Owner:** Editorial Lead (proposing); **Brand & Cohesion Lead owns the canon**
- **Relates to:** ground-truth seam #4; Brand `voice-and-naming-architecture.md` §3a (the two-tier canon); ADR-002/003

> Proposal: replace the **parallel inline banned-vocab lists** (one in the studio's
> `check-banned-words.mjs`, one in the product's `check-verboten-phrases.mjs`, kept in
> sync by a comment asserting "the product enforces the same Tier-1 set") with **one
> shared, vendored, hash-locked catalog** read by both gates — so the cross-repo identity
> is *machine-enforced* rather than comment-asserted.

## Context

The Brand lead shipped the two-tier banned-vocab **canon** (§3a) and its enforcement:
- studio `check-banned-words.mjs` — inline `BANNED`, Tier-1 (cross-brand core) + Tier-2
  (studio-only), promoted to fail-CI;
- product `check-verboten-phrases.mjs` — inline `BANNED`, "seven mirror the studio's
  Tier-1 entries" (per its comment).

This is correct and good. The one fragility: **the Tier-1 cross-repo identity is asserted
by a comment, not enforced.** If a future edit changes Tier-1 in one repo and not the
other, nothing fails — the two cores drift silently. (This is the same class of risk the
token spine solved with a SHA-256 hash-lock.)

## Proposal

Adopt, for banned-vocab, the exact mechanism the **token spine** already uses:

1. **`data/banned-words.json`** — one catalog, tiers `core` (= Brand Tier-1, cross-brand)
   + `product` + `es` + `studio` (= Brand Tier-2 + the fake-team "we" from ADR-003).
   Each entry `{ id, pattern, flags, why, fail: [repos that hard-fail it] }`.
2. **`scripts/lib/banned-words.mjs`** — loader: `entriesFor(repo)` (fail/warn partition)
   + `assertHash(EXPECTED_BANNED_HASH)`.
3. Both gates read the catalog; the JSON + loader are **vendored byte-identical** into
   both repos and each gate pins the same `EXPECTED_BANNED_HASH`. A drift in either copy
   fails that repo's gate — the cross-repo identity is now machine-enforced.

A working prototype of exactly this (catalog + loader + hash-lock + both gates refactored
+ a `*.test.mjs`) was built earlier in this engagement and lives in git history on
`claude/editorial-lead-onboarding-fPoLO` at commit `54909b7` (and its product twin). It
passed both repos' gates. It can be lifted onto current `main` if this proposal is
accepted — adapted to use **Brand's §3a Tier-1 as the `core`** (Brand owns the canon).

## Why not just adopt it unilaterally

Brand owns the banned-vocab **canon and strategy** (the doctrine's seam: "Brand owns
strategy & naming; Editorial owns the words"). Brand already chose and merged the
inline mechanism. Switching to a shared catalog is a mechanism change to Brand's merged
work — a coordinate-and-confirm decision, not an editorial drive-by. Hence: **Proposed**.

## Decision needed (from Brand + Don)

- Keep the parallel-inline lists (status quo; identity comment-asserted), **or**
- Adopt the shared hash-locked catalog (identity machine-enforced), with `core` = §3a
  Tier-1.

## Trade-offs

- **For the catalog:** machine-enforced cross-repo identity; one place to add a word;
  warn→fail promotion is a one-line catalog edit; the product + studio cores cannot drift.
- **Against:** a vendored file + hash-lock to maintain (the token-spine pattern, already
  familiar in this codebase); a migration touching both gates.
