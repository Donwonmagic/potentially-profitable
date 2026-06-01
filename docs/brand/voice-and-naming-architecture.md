# Muntin Voice & Naming Architecture

**Author:** Brand Strategy (verbal identity & cross-product governance)
**Date:** 2026-06-01
**Scope:** How Muntin sounds and what Muntin calls things, across both
surfaces — `potentially-profitable` (muntin.digital, the studio/editorial
site) and `Muntin-Invoice-Decoder` (Muntin Ledger, the product) — plus
the surfaces no single canon has covered: transactional email, digests,
and audio narration.
**Purpose:** Muntin already governs color (one token spine, CI-locked) and
visuals (the Graphic-Asset Audit, `docs/brand/graphic-asset-audit-2026-05.md`).
The verbal layer is governed *per surface* and never *across* them. This
document is the missing top layer: it states the relationship between the
voices, names the surfaces that fall through the gaps, and specifies the
enforcement that keeps it from drifting like a document.

> **Division of labor.** UX decides *what* screens exist. The Graphic Lead
> owns *how* visuals are built. This document owns *how Muntin reads* — POV,
> register, naming, banned language — and the boundary between the two
> voices. It does not redesign screens or re-pigment assets.

---

## 0. TL;DR — the one finding that matters

**Muntin has two correct voices and no document that says so.**

The studio speaks as one person: *"I," Don, never "we."* The product speaks
as a system doing the work for the operator: *"we"* (about 264 strings in
`apps/web/lib/copy.ts`) and *"you,"* mechanism-first, never as a fake team.
Each voice is right for its surface and each is enforced inside its own
repo. But nothing connects them, so a reader who crosses from
`muntin.digital` to `ledger.muntin.digital` meets two personalities with no
stated relationship. The inconsistency is in the **governance**, not the
copy.

Two consequences follow, and this document fixes both:

1. The boundary between the voices is undocumented and unenforced, so it can
   erode in either direction (the studio's named voice, "Don," leaking into
   the product; a fake-team "we" leaking into editorial).
2. At least one customer-facing surface — transactional/digest **email**
   (`apps/api/src/lib/email.ts`) — sits outside every voice gate.

---

## 1. The system as it stands (verbal)

Existing, per-surface, and healthy:

- **Storefront contract** — `methods/index.html` (#voice-contract): five
  lines (POV, register, sentence shape, vocabulary, never-list) plus a
  banned-word list and a POV-by-page-type table.
- **Storefront canons** — `docs/voice-canon-library.md`,
  `docs/voice-canon-blog.md`, `docs/voice-canon-sheets.md`. Siblings for
  three content types. None mention the product.
- **Product gates** — `scripts/check-copy-grade.mjs` (Flesch-Kincaid ≤ 7,
  target 6) and `scripts/check-verboten-phrases.mjs` (32 patterns, EN + ES).
- **Product Spanish canon** — `docs/voice-es-mx.md` (draft, v0.1, pending
  bilingual review) and its English contributor companion
  `runbooks/brand-voice-es-mx.md`. These already exist; this document does
  not replace them.

What is missing: an English voice canon for the product on a par with the
es-MX one, and any document that governs the two voices *together*.

---

## 2. The two voices

| | **Register A — Studio / Editorial** | **Register B — Product** |
|---|---|---|
| Surfaces | `muntin.digital`: marketing, library, blog, sheets, trust, legal | Muntin Ledger app, product email, digests, in-app audio |
| Speaker | One person, **Don** | The product — **the system that does the work** |
| POV | First-person singular **"I"**; **never "we"** | **"we"** (the system) + **"you"** (the operator); a first-person **"I"** only on its learning surface; **never speaks as the named person "Don"** |
| Why | The studio is one person. A "we" would be a fiction. | A product genuinely acts for the operator. "We file it / we never see your fingerprint" is truer than implying Don reads every invoice. Its learning surface ("what I learned for this vendor") personifies the system as one learning agent — not as Don. |
| "We" rule | Banned outright | Allowed, but **mechanism-first only** — describe what the system does. A fake-team reassurance ("your data is safe with us") stays banned. |
| Shared | No exclamation marks. No emoji. No marketing-speak. The window/muntin metaphor is the only sanctioned metaphor family. Reading level ≤ grade 7. | Same. |

This split is deliberate and worth keeping. Note one correction to the
record: the product's first-person voice is a **convention** the team
adopted (the verboten gate bans the third-person phrase *"the engine"* and
its rationale points contributors toward "we"/"I"), **not** a rule the gate
affirmatively enforces. Section 4 closes that gap.

### The boundary rule

The boundary is the **named persona**, not the pronoun. The product has its
own legitimate first person — "we" for what the system does, and an "I" on
its learning surface ("what I learned for this vendor," "this week I
noticed"). It also reflects the operator's own "I"/"my" in labels and
questions ("Can I export my data?"). None of that is a violation. The line is:

- The studio's named voice — **"Don"** — never appears in product chrome,
  product email, or in-app audio. (A blanket "no 'I' in the product" rule was
  considered and rejected: it only produced false positives against real,
  deliberate copy.)
- A fake-team or marketing **"we"** never appears in studio/editorial copy.
  (The studio's only first person is "I," Don.)
- Cross-product references use the **neutral product name** — "See Muntin
  Ledger," not either voice. (The storefront's `data/ledger-cta.json`
  already does this.)

---

## 3. Naming canon

| Name | Meaning | Where it is correct |
|---|---|---|
| **Muntin Digital** | The studio / parent brand | Apex `muntin.digital`: titles, OG, JSON-LD, footers |
| **Muntin Ledger** | The product | `ledger.muntin.digital`, app, product email, README |
| **Muntin** | Short form | Only where space forces it: PWA `short_name`, ES "Registro" |
| `muntin.digital` / `ledger.muntin.digital` | Domains | URLs, email addresses, `security.txt` |
| **Muntin `<Noun>`** | Future products | One word, a noun from the window/operator family |

**Retired:** "Invoice Decoder" / "the Decoder" as a *product name*. It
predates the Ledger naming. Retirement is **scoped to user-visible prose
only**. It is explicitly retained where it is an identifier rather than a
name:

- analytics event names (e.g. "Invoice Decoder Read") — renaming breaks the
  analytics vocabulary;
- code/CSP comments and internal doc filenames;
- the repo name `Muntin-Invoice-Decoder` itself (a separate, optional
  housekeeping decision — repo renames are out of scope here).

---

## 4. Enforcement — why this is not just a sixth document

Muntin already had five voice documents and still drifted (a stale "hairline"
mark note, lingering "Invoice Decoder," an ungoverned email surface). Prose
does not hold a line; a gate does. This document ships with three machine
checks, proposed as additive — they do not change the behavior of the
existing gates until reviewed.

1. **Close the boundary.** Flag the studio's named voice **"Don"** in product
   user-facing copy — the one line that is both true and machine-checkable.
   (Running the prototype proved that a "no 'I'" rule is wrong: the product's
   learning surface and the operator's quoted "I" are legitimate. The
   we-vs-"I" judgment stays human, owned by `voice-canon-ledger.md`.) The
   mirror check on the storefront side flags a fake-team "we."
2. **Cover the email surface.** Add `apps/api/src/lib/email.ts` and the
   digest builders (`apps/api/src/lib/accountant-digest.ts` and the
   scheduled `apps/api/src/scheduled/{accountant,ops}-digest.ts`) to the
   verboten gate's `TARGETS`. They carry customer-facing "we" copy that no
   gate reads today.
3. **One banned list, two tiers.** Merge the storefront's 24 entries
   (`check-banned-words.mjs`) and the product's 32 patterns
   (`check-verboten-phrases.mjs`) into one shared core plus per-register
   extensions (see §5), read by both repos. Until that lands, the two gate
   files remain the executable source of truth.

Checks (1)+(2) ship as `scripts/check-voice-boundary.mjs` in the product
repo, wired into the `node-lints` job in `.github/workflows/ci.yml`. It
passes clean today (91 files) and blocks a regression — the named voice
"Don" leaking into product copy — pre-merge. Check (3), the merged banned
list, is the remaining follow-on.

---

## 5. The merged banned list (specification)

The executable source stays in the two gate files until the shared list
lands. The merge policy:

- **Universal core (both surfaces):** marketing clichés and hype —
  *solutions, leverage, synergize, world-class, best-in-class, robust,
  scalable, end-to-end, unleash, unlock, empower, ecosystem, journey,
  seamless, powerful, growth-hack, just, simply, easy, dive in, deep-dive,
  loop in, circle back, low-hanging fruit, move the needle*; no "Welcome
  to"; no exclamation marks; no emoji.
- **Product-tier additions (Register B):** mechanism-and-honesty rules —
  *AI-powered, 99% accurate (without a dataset), "the engine", deterministic
  (in customer copy), privacy-first, "your data is safe with us", "we value
  your privacy", "we never train on your data", human-in-the-loop, no-AI /
  AI-free, sparkle, "just docling", "empowering", "designed for X like
  yours"*, and the regressive-tone set (*luddite, old-school, back-to-basics,
  traditional*).
- **Spanish equivalents:** the es-MX bans already in the gate — *potente,
  mundialmente reconocido, sin esfuerzo, Bienvenido a, inteligencia
  artificial*, and the opening *¡*. Owned by the es-MX canon.

---

## 6. Ungoverned surfaces this document brings in scope

- **Transactional / digest email** — `apps/api/src/lib/email.ts` and the
  digest builders under `apps/api/src/lib/` and `apps/api/src/scheduled/`.
  Register B. Brought under the verboten gate by §4(2).
- **Audio narration** — multi-locale scripts (the storefront's
  `docs/audio-pipeline.md` covers production standards, not voice). Register
  follows the surface: editorial audio is Register A; in-app audio is
  Register B.

---

## 7. What this does not touch

- **Visual execution** — the 748 OG cards and 18 icons on the retired warm
  palette are the Graphic Lead's "Project 1." Not re-opened here. (One
  correction owed to that audit: its description of the site mark as a
  "hairline outline" is stale; `brand/mark/mark-ink.svg` ships solid panes
  on `main`.)
- **The token spine** — governed and CI-locked. No edits.
- **Rewriting the product's ~264 "we" strings** — they are correct under
  Register B and stay. (If the founder chooses one literal voice instead,
  that is a separate, larger pass; this document recommends governing the
  split, not erasing it.)

---

## 8. Map of the verbal system (index)

| Surface / concern | Authority |
|---|---|
| Cross-product voice + naming + boundary | **this document** |
| Studio contract (POV, banned words, CTAs) | `methods/index.html` #voice-contract |
| Library / Blog / Sheets voice | `docs/voice-canon-{library,blog,sheets}.md` |
| Product voice (EN) | `Muntin-Invoice-Decoder/docs/voice-canon-ledger.md` |
| Product voice (ES, draft) | `Muntin-Invoice-Decoder/docs/voice-es-mx.md` + `runbooks/brand-voice-es-mx.md` |
| Reading grade / verboten phrases | `Muntin-Invoice-Decoder/scripts/check-copy-grade.mjs`, `check-verboten-phrases.mjs` |
| Banned words (storefront) | `potentially-profitable/scripts/check-banned-words.mjs` |
| Color / tokens | `muntin.tokens.json` + token-parity gates |
| Visual execution | `docs/brand/graphic-asset-audit-2026-05.md` |
