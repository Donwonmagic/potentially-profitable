# ADR-001 — Per-language audio fact-gate

- **Status:** Accepted
- **Date:** 2026-06-08
- **Owner:** Editorial Lead
- **Review by:** 2026-09-08
- **Relates to:** ADR-000 (doctrine); ground-truth-pack.md §3 seam #2 (now closed)

> Decision: extend the absolute fact gate to the surface where its founding risk
> actually lives — the six-language audio narration that the renderer speaks
> *verbatim*. Until today the fact gate scanned the HTML the article is read *from*
> but not the JSON it is *spoken from*.

## Context

The fact gate (`check-fabrications.mjs`) is the crown jewel of the editorial OS and
the reason the May-2026 fabrication incident can't recur in published prose. But it
**explicitly skipped every `audio*.json`** (`check-fabrications.mjs:203`), on the
rationale that audio is "regenerated from cleaned HTML; not source of truth." Meanwhile
`CLAUDE.md` and the voice canons assert the spoken script "must clear the fact gate in
every language." The canon promised a guarantee the gate did not enforce — and the
renderer (Kokoro / F5) reads `chunks[].text` aloud, verbatim, in en/es/fr/it/pt/zh.

Two facts made this the highest-blast-radius open seam:
1. **Truth is value #1** in the doctrine, *because* violations are spoken aloud.
2. The non-EN tracks are produced by a **machine-translation pass** outside any gate,
   so a clean EN article can still yield a translated script that drifts — and nobody
   on the team reads Mandarin to catch it.

This was not theoretical. On its first run the new gate caught the retired
**two-restaurants bio** (the exact incident) being **spoken aloud right now in all six
languages** across three stale pre-cleanup renders, plus the Spanish voice-clone
reference. See ground-truth-pack §3a.

## Decision

Ship `scripts/check-audio-fabrications.mjs`, wired into `scripts/check-all.mjs` right
after the HTML fact gate, with a **shared pattern registry** so the two gates can never
drift apart.

1. **Shared registry** — `scripts/lib/fabrication-patterns.mjs` holds the one `BLOCKED`
   list (+ the verified-deep-link allowlist and addressing-the-reader contexts). Both
   `check-fabrications.mjs` and the audio gate import it. Every rule is tagged
   `langs: ['invariant' | 'en' | 'es' | 'fr' | 'it' | 'pt' | 'zh']`.

2. **Two tiers in the audio gate:**
   - **Pattern tier (fail-CI):** invariant rules (fabricated source deep-links, which
     survive translation byte-for-byte) on *every* track; per-language bio-drift rules
     on their own track. The keystone "two restaurants" bio — a *closed, known*
     fabrication — was extended to fr/it/pt/zh so the translated drift is caught
     permanently, not just by hand this once.
   - **Numeric-parity tier (warn-first):** narration is generated *from* the
     fact-gated article, so every number/%/$/year a translation speaks should appear
     in the source (sibling `index.html` ∪ source `audio.json`). Locale separators are
     normalized to bare digits ("$40,000" / "40.000" / "40 000" → `40000`). This is the
     genuinely language-invariant catch for fr/it/pt/zh prose, where pattern rules
     can't reach. Warn-only at launch (prints, never fails) to gather signal and seed
     `PARITY_ALLOW` for legitimate formatting diffs before promotion — the same
     warn-first→fail rollout the repo used for banned-words.

3. **Dated waivers, never silent edits.** Three stale pre-cleanup posts are dated-waived
   in `STALE_AUDIO_WAIVERS` (and the Spanish voice reference in the HTML gate's
   `SKIP_PATHS`), so the gate is green and protects all other content. A text-only edit
   was rejected: it would clear the gate while the MP3/M4A kept *speaking* the
   fabrication — the precise failure the gate exists to prevent. Remediation
   (re-render / re-record) is confirm-tier, owned by Don, tracked in ground-truth §3a.
   The gate prints every waiver loudly each run and flags any waiver that no longer
   matches, so waivers can't rot.

4. **Pinned** by `scripts/test-audio-fabrications.mjs` (`node:test`).

## Honest coverage limit (the residual)

- **en / es** audio gets the full pattern set — parity with the HTML gate.
- **fr / it / pt / zh** get invariant URL rules + per-language bio-drift + numeric
  parity.
- **Not caught:** a freshly *mistranslated prose* fabrication in fr/it/pt/zh that
  carries no rogue number and no URL. Closing it needs a spoken-language fact check
  (e.g. back-translation or an LLM judge) — out of scope here.

## Follow-ons

1. Triage the ~45 numeric-parity warnings; promote the tier **warn → fail** once
   `PARITY_ALLOW` is seeded.
2. Re-render the 3 waived posts and re-record the Spanish voice reference; delete each
   waiver as it clears.
3. Next seam (ground-truth §5): extend verboten + grade to **email**.

## Consequences

- Scorecard Dim 3 (Audio truthfulness) **2 → 3**; total **23 → 24**. Dim 1 stays 3.
- The fact gate now reaches the spoken surface in all six languages; the
  fabrication risk no longer scales silently with translation volume.
