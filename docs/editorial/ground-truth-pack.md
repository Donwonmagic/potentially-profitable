# Editorial Ground-Truth Pack — Muntin (all written content)

**Purpose:** a dated, code-verified snapshot of the *actual* written-content surface
and the rules that govern it, so the Lead reasons from the canons and the gates —
not from a memory of the voice or a stale doc. Anchors are evidence; **re-confirm
load-bearing file:lines before acting.**

- **Verified:** 2026-06-07 (editorial code recon across both repos). **Decays:** the
  canons are stable; the *governance coverage* (which surfaces a gate actually
  reaches) is the volatile part — re-check it each cycle. **Sibling doc:**
  `../brand/voice-and-naming-architecture.md` (the canonical register split).
- Repos: `potentially-profitable` (the prose heart — library/blog/glossary/tools/
  sheets + `es/` + audio; Register A) · `Muntin-Invoice-Decoder` (product copy,
  email, legal; Register B).

## 1. The one-paragraph truth
The editorial discipline is **the most mature in the codebase.** The **fact gate is
absolute** (`check-fabrications.mjs` + `data/sourced-claims.json`) — born from a real
May-2026 fabrication incident, and load-bearing because the **audio renderer speaks
prose verbatim in six languages.** The voice canons are strong and the article/CTA/
i18n craft is well-gated. **The inheritance risk is not bad prose — it's governance
coverage:** several gates don't reach far enough (email is under-scanned; product-ES
is unreviewed and ungated; the two banned-word lists aren't merged; there's no
per-language audio fact-gate; the studio "we" isn't machine-banned). Every open seam
is "a canon that isn't yet a gate." Close them, in that order of blast radius.

## 2. The binding canons + the fact gate to PROTECT (verified — these govern)
- **The voice contract (governs all):** `methods/index.html#voice-contract` (~:490–526)
  — POV-by-page-type table, the **24-word banned list** (solutions, leverage, robust,
  just, simply, …), CTA canon, no exclamation marks/emoji, the window/muntin metaphor
  family.
- **Library canon:** `docs/voice-canon-library.md` — byline **The Muntin Desk**; "I"
  only for personal operator practice; ≥2,800-word floor; living documents (revise in
  place). **Blog canon:** `docs/voice-canon-blog.md` — byline **Don Goldstein**; "I"
  is the narrator's seat; warmth = specificity. **Sheets canon:**
  `docs/voice-canon-sheets.md` — consequence-named lexicon; the operator gets the
  last word; ES uses **tú** imperative.
- **The fact gate (ABSOLUTE):** `docs/fact-check.md` + `data/sourced-claims.json` +
  `scripts/check-fabrications.mjs`. Three valid patterns only — **registered / cited
  inline (`<details class="cite">`) / labeled illustrative.** Blocks: unregistered
  operator percentages & dollar amounts, invented datasets & cohort sizes, AI-Overview
  figures outside the single registered measurement, and **bio drift** (the bio is
  singular: Don Goldstein, FOH Manager at Tacombi in Bethesda).
- **Product voice canon:** `Muntin-Invoice-Decoder/docs/voice-canon-ledger.md` —
  "we" (mechanism, never reassurance) + "you" (operator); "I" on the learning surface
  only; **never "Don";** FK ≤7. Enforced by `check-voice-boundary.mjs` (blocks "Don")
  + `check-verboten-phrases.mjs` (32 patterns) + `check-copy-grade.mjs`.
- **The register split (canonical):** `docs/brand/voice-and-naming-architecture.md` —
  Register A "I"/Don (studio) vs Register B "we"/"you" (product); naming canon
  (Muntin Digital / Muntin Ledger / Muntin; "Invoice Decoder" RETIRED as a name).
- **The audio pipeline as content:** `data/article-audio.json` (manifest, status
  rendered/partial/pending) + per-post `audio.<lang>.json` for en/es/fr/it/pt/zh, read
  **verbatim** by Kokoro voices; plus `data-audio-alt` (full narration, ≥80 chars) on
  every figure. **The audio text must clear the fact gate in every language.**

## 3. ⚠️ The real backlog — governance-coverage seams (prioritized by blast radius)
| # | Sev | Seam | Evidence | Fix (turn the canon into a gate) |
|---|---|---|---|---|
| 1 | HIGH | **Email copy under-gated** — transactional + digest email follows the product canon but `check-verboten-phrases` & `check-copy-grade` don't scan it (only `check-voice-boundary` does) | `apps/api/src/lib/email.ts`, `…/accountant-digest.ts`, `scheduled/{accountant,ops}-digest.ts` | Add email files to the verboten + grade TARGETS |
| 2 | ✅ CLOSED 2026-06-08 | ~~No per-language audio fact-gate~~ — **shipped** `scripts/check-audio-fabrications.mjs` (wired into `check-all.mjs`). Scans all ~328 `audio.<lang>.json` (the HTML gate skips them) using the shared registry `scripts/lib/fabrication-patterns.mjs`: invariant URL rules on every track, en/es/fr/it/pt/zh bio-drift rules on their own track, + warn-first numeric-parity. Pinned by `scripts/test-audio-fabrications.mjs`. See ADR-001. | `scripts/check-audio-fabrications.mjs`, `scripts/lib/fabrication-patterns.mjs` | Residual (ADR-001 follow-ons): promote numeric-parity warn→fail; a rogue-number-free prose mistranslation in fr/it/pt/zh is still not caught (needs a spoken-language detector) |
| 3 | MED | **Product-ES unreviewed & ungated** — `copy.es.ts` has key-parity but the es-MX voice canon is **draft v0.1, pending bilingual review**, and `check-voice-es-mx.mjs` doesn't exist | `Muntin-Invoice-Decoder/docs/voice-es-mx.md` ~:3–4,145–146; `apps/web/lib/copy.es.ts` | Complete the bilingual review; ship the gate (no "Bienvenido a", no "potente", **tú** not **usted**) |
| 4 | MED | **Two banned-word lists, unmerged** — studio's 24 (`check-banned-words`) and product's 32 (`check-verboten-phrases`) don't cross-reference; a phrase banned in one is allowed in the other | `voice-and-naming-architecture.md` ~:152–182 (§4–5) | One shared `banned-words.json` both repos read, core + per-register tiers |
| 5 | MED | **Studio "we" not machine-banned** — the contract bans the royal "we" but no gate checks it; fake-team "we" could slip into studio marketing | `voice-and-naming-architecture.md` ~:78,95; `check-banned-words.mjs` (no "we") | Add a "we" pattern to the studio gate (allowlist changelog/methods/quotes) |
| 6 | MED | **Product grade gate misses route inline copy** — `check-copy-grade` reads `copy.ts` only; a route file can inline FK-10 copy | `scripts/check-copy-grade.mjs`; `check-verboten` walks routes but doesn't grade | Grade the route tree too, or enforce "import from copy.ts" by review |
| 7 | LOW | **Byline canon doc is stale** — `voice-canon-library.md` still says the methods POV table "should now read…" but the HTML was already updated | `voice-canon-library.md` ~:74–76 vs `methods/index.html:520` (already correct) | Update the canon prose to past tense (confirm, don't prescribe) |
| 8 | LOW | **Voice-boundary check is one-directional** — product checks for "Don"; studio has no reverse check that product's "we" hasn't leaked into editorial | `Muntin-Invoice-Decoder/scripts/check-voice-boundary.mjs` (product only) | Comment the asymmetry; optionally a studio-side belt-and-braces check (overlaps #5) |

### 3a. Confirm-tier remediation queue (surfaced by the audio gate, 2026-06-08)
The per-language audio gate immediately caught the retired **two-restaurants bio**
(the exact May-2026 incident) being **spoken aloud right now in all six languages**.
Source HTML is clean — these are stale pre-cleanup artifacts. They are **dated-waived**
in the gate (so it stays green and protects everything else) and are **confirm-tier**:
the honest fix is re-render / re-record, not a text edit (a text-only edit leaves the
MP3/M4A still speaking it). Owner: **Don** (needs the TTS / recording toolchain).

| Artifact | What it speaks | Fix | Where waived |
|---|---|---|---|
| `library/does-my-restaurant-need-a-website/audio.{json,es,fr,it,pt,zh}` (gen 2026-05-10) | "I manage two restaurants" + 5 translations | Re-render from clean HTML (`render-post-audio.mjs`) | `check-audio-fabrications.mjs` `STALE_AUDIO_WAIVERS` |
| `learn/research/dmv-restaurant-gbp-audit-2026/audio.*` (gen 2026-05-09) | "manages two DMV restaurants" + 5 translations | Re-render | same |
| `learn/research/the-1-percent-margin-audit-50-restaurant-websites-2026/audio.*` (gen 2026-05-09) | "manages two DMV restaurants" + 5 translations | Re-render | same |
| `scripts/voice-refs/don-reference.es.txt` + `README.md` (paired with `don-reference.es.m4a`) | "Administro dos restaurantes…" (Spanish voice-clone seed) | Re-record the Spanish reference to the singular bio, update transcript | `check-fabrications.mjs` `SKIP_PATHS` (dated) |

Remove each waiver the moment its artifact is re-rendered/re-recorded — the audio gate
prints a notice when a waiver no longer matches anything. **Numeric-parity** also flagged
~45 files (warn-only) worth a triage pass for translation-introduced figures.

## 4. The CI editorial-net (the gates that keep content honest)
Studio: `check-fabrications` (ABSOLUTE — bio drift, invented data; HTML/JSON/MD) ·
**`check-audio-fabrications` (ABSOLUTE — the same registry over all 6 spoken-language
narration tracks)** · `check-banned-words` (24) · `check-cta-canon` (locked verbs) ·
`check-article-graphics` (8 rules incl. caption/figcaption) · `check-overview-quality`
(stricter overview bar) · `check-audio-coverage` · `check-locale-parity` +
`check-hreflang-orphans` (EN↔ES) · `check-name-coherence`. Product: `check-voice-boundary` (no "Don") · `check-verboten-phrases` (32)
· `check-copy-grade` (FK≤7) · `check-email-templates` (privacy placeholders) ·
`check-es-coverage`. **The pattern in §3:** the gaps are all *reach* — a gate exists
but doesn't cover email / routes / product-ES, or the two lists aren't unified.
Closing a seam = extending a gate's TARGETS or shipping the one missing gate.

## 5. The highest-leverage move, always
**Turn the canon into a gate — or extend the gate to the surface it's missing.** The
canons are strong; the leverage is *coverage*. The per-language audio fact-gate (the
top-blast-radius jump — a Mandarin script nobody on the team speaks) **shipped
2026-06-08** and immediately caught live fabrications no human had re-heard. The next
highest-blast-radius jump is **email**: extend verboten + grade to the transactional +
digest templates (item 1) — a digest nobody re-reads. A canon protects what a careful
human remembers; a gate protects what everyone forgets.

## 6. Content inventory (for scale)
Studio (Register A): ~39 library articles · ~10 blog (+ `blog/drafts/`) · 151
glossary · 49 sheets · 22 tools · full `es/` mirror · 6-language audio per library
article. Product (Register B): `copy.ts` (~3.2k lines) + `copy.es.ts` (~2.7k lines)
canonical strings · `email.ts` (~55KB) transactional + digests · legal (`docs/dpa.md`,
`privacy-policy.md`, `docs/es/` mirrors — intentionally exempt from marketing gates).

## 7. How to refresh this pack
1. **Re-confirm gate reach** (the volatile part): does verboten/grade scan email yet?
   does the per-language audio gate exist? is product-ES reviewed? are the banned
   lists merged? Each "no" is a §3 row still open.
2. Run `check-all.mjs` (studio) + the product CI; note any new gate or new canon.
3. `git log --since=<stamp>` for `docs/voice-canon-*`, `methods/index.html`,
   `data/sourced-claims.json`, `apps/web/lib/copy*.ts`, `apps/api/src/lib/email.ts`,
   and the `check-*` gates; re-confirm any file:line before acting.
> Log: `2026-06-07 — created from editorial code recon.`
