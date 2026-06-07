# Muntin Visual System — the current, code-verified guideline

- **Status:** Authoritative (current). The single visual/token guideline for the
  Muntin brand across both repos.
- **Verified:** 2026-06-07 (against live code — see *How this was verified*).
- **Owner:** Brand & Cohesion Lead · **Review by:** 2026-09-07
- **Pairs with:** `voice-and-naming-architecture.md` (the **verbal** authority).
  This doc is its **visual** counterpart.
- **Reads from, not instead of:** `ground-truth-pack.md` (dated facts),
  `decisions/ADR-000-operating-doctrine.md` (doctrine), `decisions/ADR-001-…md`
  (the Golden Hour accent decision).

> **Why this doc exists.** Three older design docs drifted from the code after the
> Wave 8b re-pigment (2026-05-16) and would mislead anyone briefing off them. This
> guideline supersedes the **palette/OG claims** in all three (see *Supersession*),
> and is checked against live tokens and generators rather than asserted from memory.
> Treat the **token spine and the generators as truth**; treat any visual doc older
> than this stamp as a hypothesis until re-verified.

`{site}` = `potentially-profitable` (muntin.digital) · `{product}` =
`Muntin-Invoice-Decoder` (Muntin Ledger).

---

## 1. One palette, two registers

Muntin is **one brand in two disciplined registers**. Cohesion ≠ uniformity:
divergence is allowed on **exactly three axes — typography, theme, primary-blue —
and nowhere else.**

| | Register A — Studio (`{site}`) | Register B — Product (`{product}`) |
|---|---|---|
| Surfaces | muntin.digital: marketing, library, blog, sheets, tools | Muntin Ledger app, product email, digests |
| Theme | **light only** | **dark-first** |
| Type | **Fraunces** (display) + Inter | **Inter + Geist Mono** (Fraunces → `--mun-font-editorial` only) |
| Primary blue | **`#2a50c8`** (deeper, for AA on light) | **`#3b68f5`** (dark accent **`#5b82ff`**) |
| Var vocabulary | legacy `--cream`/`--teal`/`--ink`/`--rust` | `--mun-*` |
| Shared by both | the **cool slate + blue** financial-grade palette; no exclamation/emoji/marketing-speak; ≤ grade-7; window/muntin metaphor only |

The accent blue is **the same hue, two values**: `#2a50c8` carries AA on the studio's
light surfaces; `#3b68f5` (and dark `#5b82ff`) is the product's primary on dark. This
is a sanctioned divergence, not drift.

**Warmth comes from type and layout, not surface color.** The retired warm palette
(`#1F4E5B` teal, `#FAF7F2` cream, `#B8541A` rust, `#C5A059` gold) is **forbidden in
chrome** and gate-enforced by `scripts/migrate-warm-palette.mjs --check`.

---

## 2. The token spine and its lock (the load-bearing mechanism)

- **Canonical:** `{product}/packages/ui/muntin.tokens.json` →
  **vendored, byte-identical**, into `{site}/data/muntin.tokens.json`.
- **Locked both ways** by a SHA-256 `EXPECTED_SPINE_HASH`
  (`3681742a5d58d95835dee6f1a67fd4c550f6ba929548d1b872ff0b079dcb6e11`) pinned in
  **both** `{site}/scripts/check-tokens-sync.mjs:96` and
  `{product}/scripts/check-tokens-parity.mjs:159`. A token change must update **both
  hashes + re-copy the JSON in lockstep**, or both repos' CI fails.
- The JSON's **`legacyVarMap` is the Rosetta Stone** between `--mun-*` and the site's
  legacy names. **Legacy var names (`--cream`/`--teal`/`--ink`/`--rust`…) are
  load-bearing — do not "clean them up."** `--teal` is now blue (`#2a50c8`); the name
  stayed, the pigment changed.
- **Today the vendor step is a manual copy** — fragile by design, tracked as **P1**
  (a real publish-and-vendor step). It is a fragility, not a cohesion-score hit: the
  hash lock makes silent drift impossible.

---

## 3. The Golden Hour editorial accent (marigold + coral)

A warm two-color expressive layer — **marigold `#FFB020` + coral `#FF6B5C`** — sits
on top of the cool slate/blue spine. The spine is the **architecture** (frame, glass,
rigor); Golden Hour is the **light** that blooms through the muntin grid.

**Decision (ADR-001):** Golden Hour is a **sanctioned _editorial_ expressive accent**,
not a second brand accent.

- **Where it is sanctioned:** studio (`{site}`) surfaces only — OG/social cards
  (rendered into 765 of 766 cards via `scripts/build-og-cards.mjs:62-80`) and editorial
  marketing accents (marigold doubles as the "Tools / free-course badge" hue on
  `/workbench/`, `/ai/`, `/services/*`, `/tools/brand-suite/`).
- **The hard boundary:** Golden Hour is **never a product accent, never in the shared
  token spine, and must not appear in `{product}`.** The product stays single-accent
  (`#3b68f5` / `#5b82ff`). Keeping marigold/coral as `{site}`-scoped generator
  constants (not spine tokens) is the honest encoding of "editorial-only."
- **Why blessed, not retired:** it is already shipped at scale across the OG system and
  is a deliberate brand-refresh choice; retiring it would revert 765 committed assets.
  See ADR-001 for the steelman of the alternatives and the pre-mortem.
- **Pending hardening (P1):** an enforcement gate — ban `#FFB020`/`#FF6B5C` in
  `{product}`, assert absence from the shared spine, allow in `{site}` editorial. Until
  it lands, this boundary is doc-enforced, not gate-enforced.

---

## 4. Marks and icons

- **Product mark:** `{product}/packages/ui/src/WindowMark.tsx` — the solid "Pane"
  (filled panes, muntin cross as negative channel; 32u grid, transom proportion
  9.5u/15.5u, r6 fillets, channel 3u). `BrandLockup.tsx` pairs it with the wordmark.
- **Studio mark:** `{site}/brand/mark/` — a hairline **outline** sash window.
- **Icons:** `{product}` is **lucide-only**, re-exported through
  `packages/ui/src/system-icons.ts` and locked by `check-icon-source.mjs`. `{site}`
  ships bespoke `currentColor` icons. This asymmetry is a deliberate seam.
- **Open (P2):** the window-mark geometry is duplicated in ≥4 places with no single
  governing spec, and the studio outline vs. product solid "Pane" split is unresolved.
  Not decided here.

---

## 5. Where enforcement lives (and what is not yet gated)

| Concern | `{site}` gate | `{product}` gate |
|---|---|---|
| Token-spine parity | `check-tokens-sync` | `check-tokens-parity` |
| Retired-warm purge | `migrate-warm-palette --check` | (spine-locked) |
| Contrast (AA, both themes) | `check-contrast` | `check-contrast` |
| Voice / persona boundary | `check-banned-words` | `check-voice-boundary` (bans "Don") |
| Icon source | (bespoke) | `check-icon-source` (lucide-only) |
| OG currency / coverage | `check-og-{images,coverage,template-grid}` | — |

**Deliberate asymmetries (don't "fix" without a charter):** the "Don" gate and the
lucide-lock live only in `{product}`; `{site}` ships bespoke icons.

**Not yet gated (tracked backlog):** Golden Hour accent scope (P1), the **merged
two-tier banned list** read by both repos (specified, not built — P1), and doc-vs-code
currency (no gate asserts these docs still match the code — refresh on cadence).

---

## Supersession

This guideline supersedes the **palette / OG claims** in:

| Doc | What is stale | Still valid |
|---|---|---|
| `{site}/docs/design-system.md` | the `## OG cards (Sprint 8 — locked)` section (warm `#FAF7F2`/`#1F4E5B`/gold) | its core token table (matches the spine) |
| `{site}/docs/brand/graphic-asset-audit-2026-05.md` | claims OG cards / icons "still warm" — the OG migration has shipped (0 warm hexes in `brand/og/*.svg`) | its inventory counts + punch-list framing (historical) |
| `{product}/docs/visual-design-system.md` | §5 palette hexes (`--mun-ink #14161A`, `--mun-teal #1F4E5B`, `--mun-cream #FAF7F2`) — pre-Wave-8b | its motion / type / layout system |

Those docs carry a dated banner pointing here. They are not deleted (links, history).

## How this was verified (2026-06-07)

- `data/muntin.tokens.json` and `{product}/packages/ui/muntin.tokens.json` diffed →
  **byte-identical**; both `EXPECTED_SPINE_HASH` constants read equal.
- `brand/og/*.svg` grepped (764 files): **0** occurrences of `#1F4E5B`/`#FAF7F2`/
  `#B8541A`/`#C5A059`; `#2A50C8` in 509, `#F6F7F8`/`#16181D` in 766, `#FFB020`/`#FF6B5C`
  in 765.
- Golden Hour PALETTE confirmed at `scripts/build-og-cards.mjs:62-80`; marigold badge
  usage confirmed in live page chrome.
- Re-verify against live files before trusting this stamp if it is > ~3 weeks old; the
  refresh procedure lives in `ground-truth-pack.md`.
