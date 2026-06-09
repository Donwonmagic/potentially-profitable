# Editorial Voice Scorecard — Muntin (all written content)

A **re-runnable, falsifiable** measure of editorial health. The point is a
*repeatable* read so "is the content more truthful, more on-voice, and better
governed than last cycle?" has evidence — and the strongest evidence is the **fact
gate** plus the **read-aloud test**, not a sentence that merely *sounds* right.

**Score each dimension 0–3 — and the editorial bar for `3` is canon-clean + gated +
verified:** `0` broken/absent · `1` partial / canon-only (no gate) · `2` gated but
incomplete reach · `3` canon-clean **AND** gate-enforced **AND** verified (incl. the
read-aloud check where it applies). The verified clause matters most on dimension 1:
a claim that passes by eye but isn't registered is a `1`, because the renderer will
say it aloud in six languages.

## How to run (≈35 min)
1. Run `check-fabrications` + `check-banned-words` + `check-cta-canon` +
   `check-article-graphics` + `check-overview-quality` + `check-locale-parity` /
   `check-hreflang-orphans` (studio) and `check-voice-boundary` +
   `check-verboten-phrases` + `check-copy-grade` + `check-email-templates` (product).
2. **Check gate REACH** (the volatile part): does verboten/grade scan email? does a
   per-language audio fact-gate exist? is product-ES reviewed + gated? are the two
   banned lists merged? Each "no" caps a dimension at 2.
3. Spot the **read-aloud test**: pick a recent article; read a claim-bearing
   paragraph aloud. If a number isn't registered/cited/illustrative, that's a dim-1
   finding no matter how it reads.
4. Score the table; for anything < 3, link evidence (file:line) + the gate that will
   close it. **Extend the gate's reach, don't just fix the instance.**

| # | Dimension | What it measures | Check | Target |
|---|-----------|------------------|-------|--------|
| 1 | **Fact integrity** | Every claim registered/cited/illustrative; bio singular; zero inventions | `check-fabrications`; `sourced-claims.json`; read-aloud | 3 |
| 2 | **Voice & register fidelity** | Right byline/POV per surface; banned words out; registers never blend | voice canons; `check-voice-boundary`; banned-word gates | — |
| 3 | **Audio truthfulness** | Verbatim scripts clear the fact gate in ALL 6 langs; match the article | `article-audio.json`; (per-lang fact gate?) | — |
| 4 | **EN↔ES parity & i18n** | Slug map intact; locale coverage; ES voice canon honored (both repos) | `check-locale-parity`/`hreflang-orphans`; `voice-es-mx` status | — |
| 5 | **CTA & smart-next discipline** | Locked verbs; one-to-one EN/ES pairs | `check-cta-canon` | 3 |
| 6 | **Reading-grade & clarity** | Product FK ≤7 across copy + routes + email; studio register clarity | `check-copy-grade` reach | — |
| 7 | **Product-copy governance** | UI strings, errors, email under voice/grade/verboten gates | gate TARGETS vs surfaces | — |
| 8 | **Banned-word & verboten coverage** | One merged list, both tiers, both repos, email included | the two gate files; merge status | — |
| 9 | **Article craft & structure** | H2 walk, dek length, captions, ≥word floor, living-doc | `check-article-graphics`/`overview-quality` | 3 |
| 10| **Cross-surface voice coherence** | studio↔product read as one family at the seams (naming, "we" boundary) | `voice-and-naming-architecture.md`; `check-name-coherence` | — |

## Current snapshot — 2026-06-07 (code-assessed; re-check gate REACH on engagement start)
| Dim | Score | Note |
|---|---|---|
| 1 Fact integrity | **3** | The crown jewel: absolute gate, registry, singular bio, born of a real incident and enforced because the renderer speaks violations aloud. Protect it without exception. |
| 2 Voice & register fidelity | **3** | `check-voice-boundary` blocks "Don" (product); `check-studio-voice-boundary` now blocks the fake-team "we" (studio, marketing-scoped); byline canon corrected to past tense (confirmed at `methods/index.html:520`). Both blockers cleared. |
| 3 Audio truthfulness | **3** | **Per-language audio fact-gate shipped** (`check-audio-fabrications.mjs`, wired into `check-all.mjs`): scans all ~328 `audio.<lang>.json` the HTML gate skips — invariant URL rules on every track, en/es/fr/it/pt/zh bio-drift rules on their own track (shared registry `scripts/lib/fabrication-patterns.mjs`), plus warn-first numeric-parity (a translation may not speak a number absent from the source). On first run it caught the retired two-restaurants bio live in 6 languages across 3 stale pre-cleanup renders + the Spanish voice-clone reference — all dated-waived and tracked for re-render (see backlog). Residual: a rogue-number-free prose mistranslation in fr/it/pt/zh (ADR-001 follow-on). |
| 4 EN↔ES parity & i18n | **2** | Studio EN↔ES is strong + gated (would be 3 alone) — pulled down by **product-ES**: draft v0.1 canon, unreviewed `copy.es.ts`, no `check-voice-es-mx`. |
| 5 CTA & smart-next | **3** | Locked verbs, one-to-one EN/ES, gated by `check-cta-canon`. Clean. |
| 6 Reading-grade & clarity | **2** | Product FK≤7 gate exists but scans **`copy.ts` only** — route inline copy + email escape it. |
| 7 Product-copy governance | **3** | `copy.ts` + **email** now under voice-boundary + verboten + grade (email added to TARGETS; copy-grade grades email prose-filtered/English-only). Routes remain a reading-grade gap → tracked under Dim 6. |
| 8 Banned-word & verboten coverage | **3** | The Brand lead shipped a two-tier banned-vocab model (Tier-1 cross-brand core enforced by BOTH repos' gates; studio Tier-2) and promoted `check-banned-words` to fail-CI (canon §3a). Email is now in the product verboten TARGETS (this work). Both tiers, both repos, email included. **Proposed hardening:** unify the parallel inline lists into one shared hash-locked catalog (ADR-004 — needs Brand coordination). |
| 9 Article craft & structure | **3** | 8-rule graphics gate + stricter overview bar + ≥2,800-word floor + living-doc discipline + JSON-LD. Mature. |
| 10 Cross-surface voice coherence | **3** | Register split documented + naming gated, and the boundary is now **enforced bidirectionally**: product blocks "Don"; studio blocks the fake-team "we". |
| **Total** | **28 / 30** | Six-language audio fact-gate; email under all three product gates; bidirectional voice boundary; Brand's two-tier banned-vocab (fail-CI). The two non-3 dims are **human/toolchain** calls, not missing gates: **Dim 4** awaits the es-MX bilingual canon review (Don) — the register machine-check (`check-voice-es-mx`) is shipped; **Dim 6** (route reading-grade) needs a JSX AST parser or copy.ts-centralization. |

> History (append each cycle):
> - `2026-06-07 — 23/30 — baseline (canons strong; gate reach is the work).`
> - `2026-06-08 — reach audit re-confirmed; 23/30 baseline holds.`
> - `2026-06-08 — 24/30 — shipped per-language audio fact-gate (Dim 3 2→3). Gate caught the retired two-restaurants bio spoken live in 6 langs across 3 stale renders + the Spanish voice-clone reference; dated-waived, re-render tracked in ground-truth backlog. Dim 1 stays 3.`
> - `2026-06-08 — 28/30 — rebased onto current main (Brand had independently merged a two-tier banned-vocab model + fail-CI promotion). Salvaged the complementary gates: email verboten+grade coverage (Dim 7→3), es-MX register gate (`check-voice-es-mx`), studio fake-team-"we" boundary + byline fix (Dim 2→3, Dim 10→3), and audio numeric-parity v2. Dim 8→3 reflects Brand's merge + email coverage. Dim 4/6 remain human/toolchain. Catalog unification proposed (ADR-004, coordinate with Brand).`
