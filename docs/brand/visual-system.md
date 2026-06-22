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

> **2026 visual evolution (added 2026-06-20).** §0 below is the canonical framing
> added by `decisions/ADR-001-visual-evolution-v1.md`: it names the spine duality as
> the literal expression of the storefront line **"Modern tools. Old-fashioned honest."**
> Sections 1–5 (the code-verified guideline) remain the detailed authority and are
> unchanged. Values in §0 are read from `assets/site-core.css :root` and
> `data/muntin.tokens.json`.

---

## 0. The duality is the positioning — "Modern tools. Old-fashioned honest."

The brand has exactly one visual idea, and it is the storefront line made visible:

- **The cool slate/blue spine = the MODERN.** Financial-grade, calm, data-first. This is
  "modern tools." It is the whole architecture — frame, glass, rigor.
- **Fraunces + the Golden-Hour "light through the pane" = the OLD-FASHIONED HONEST.** A
  warm display serif with real history in its letterforms, plus a rationed marigold→coral
  light that blooms through the muntin grid on earned moments. This is the human, honest,
  hand-built half — warmth carried by **type and light, never by chrome color.**

One spine, two things said at once: the rigor *and* the honesty. That tension is the brand.

### The token spine — summary (real values)

Read from `assets/site-core.css :root` (editorial register) and `data/muntin.tokens.json`
(the cross-repo canonical spine). Lowercase = product anchor; the site `:root` mirrors it.

| Axis | Tokens / values |
|---|---|
| **Color — surfaces** | `--cream` (bg) `#F6F7F8` · `--cream-2` `#EDEEF1` · `--white` `#FFFFFF` (slate 0/25/50/100 etc. in the spine `core.slate`) |
| **Color — ink / text** | `--ink` `#16181D` · `--ink-soft` `#4A4F59` · `--stone` `#6B7280` · `--stone-2` `#9AA0AB` (decoration-only — fails AAA as body text) |
| **Color — accent (blue)** | editorial `--teal` `#2A50C8` (AA on cream) · press `--teal-dark` `#1F3A93` · tint `--teal-tint` `#EAF0FE`. Product register: `#3b68f5` (dark `#5b82ff`). The name `--teal` is legacy; the pigment is blue. |
| **Color — status** | `--rust` `#C42E2E` (danger/alert) · `--gold` `#B7791F` (warning) · lines `--line` `#E3E5E9` / `--line-dark` `#D7DAE0` / `--line-input` `#868D9A` |
| **Type — families** | `--font-display: 'Fraunces'…serif` · `--font-body: 'Inter'…sans-serif` |
| **Type — fluid scale** | `--fs-eyebrow` 11→13 · `--fs-body` 15→17 · **`--fs-emphasis` 16→18 (new, ADR-001)** · `--fs-lead` 17→20 · `--fs-h4` 17→19 · `--fs-h3` 20→26 (clamp() px) |
| **Spacing / layout** | `--max: 1200px` · `--pad-x: clamp(20px, 4vw, 64px)` |
| **Radii** | **`--r-xs` 4px (new, ADR-001)** · `--r-sm` 8px · `--r-input` 12px · `--r-md` 14px · `--r-lg` 22px · pill `999px` |
| **Elevation / motion** | shadows via `--elev-1/2/3` + `--ring-focus` (see drift guard) · eases `--ease` / `--ease-out` / `--ease-spring` · durations `--t-fast` 180 / `--t-med` 420 / `--t-slow` 900 / `--t-micro` 120ms |

The spine values above are **frozen** — the 2026 evolution is additive (the two `(new)`
tokens) and documentary only. Do not change a spine value without a confirm-tier ADR
(ADR-000) — it is a cross-repo, dual-hash event.

### When Golden Hour is earned

Golden Hour is the **expressive warm layer**, not routine UI. Approved warm stops:
**marigold `#FFB020`** and **coral `#FF6B5C`** (sanctioned editorial accents, never on the
retired-warm blocklist, never in the shared spine — see §3).

- **Earned (positive / brand moments):** hero light washes, OG / share cards, lifecycle
  "win" states, the Tools / free-course badge hue (marigold), and the "light through the
  pane" bloom on brand-forward surfaces.
- **Never:** routine chrome, body text, form states, data-viz default tones, dense UI, or
  anything in the product register. Warmth there comes from Fraunces + layout, not pigment.

### Two registers, one spine

The accent blue is **one hue at two values**, and that is deliberate, not drift:

- **Editorial accent `#2A50C8`** — the deeper blue. It carries **AA on cream**, so it is
  the studio's primary on its light, type-warm surfaces.
- **Product accent `#3b68f5`** — the brighter blue. It is **dark-first readable**, so it is
  the Ledger's primary on dark grounds (dark theme lifts to `#5b82ff`).

Same hue, two values chosen for contrast on opposite backgrounds. The shared cool palette,
the Pane mark, and the muntin metaphor keep them one brand; only **type, theme, and which
blue is primary** diverge (the three sanctioned axes — see §1).

### OG card system — overview

Share images are spec-driven and are the most visible place the duality lives (cool grounds
+ Golden-Hour light through the muntin field). **Source of truth:
`scripts/build-og-cards.mjs`** — it holds the `PALETTE`, the per-kind templates
(`page / article / research / tool / glossary / people`), the muntin-field texture, the
`goldenHour()` light layer, and the focus modules; `brand/og/cards.json` is the manifest.
Card `accent` values must be PALETTE keys (`teal / rust / gold / ink / cream`), gate-enforced
by `scripts/check-og-accents.mjs`. Detailed kind/coverage rules live in §5 and in
`scripts/build-og-cards.mjs`. (Any *visible* OG template change is Tier 3 — render-verified
on preview first; see ADR-001.)

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

- **Where it is sanctioned:** studio (`{site}`) surfaces only. It is a first-class
  editorial token here — **`--light-marigold` / `--light-coral`** in `assets/site.css`
  (+ `site-core.css`), used by editorial chrome like `.sidelight__pulse` and
  `.window-composer__submit`; a generator constant in `scripts/build-og-cards.mjs:62-80`
  (rendered into 765 of 766 OG cards); and marigold doubles as the "Tools / free-course
  badge" hue across editorial pages.
- **The hard boundary:** Golden Hour is **never a product accent, never in the shared
  token spine, and must not appear in `{product}`.** The product stays single-accent
  (`#3b68f5` / `#5b82ff`). The accent lives in the studio's **own** editorial CSS
  (`--light-*`), deliberately **not** in the cross-repo `muntin.tokens.json` spine —
  that separation is the honest encoding of "editorial-only."
- **Why blessed, not retired:** it is already shipped at scale across the OG system and
  is a deliberate brand-refresh choice; retiring it would revert 765 committed assets.
  See ADR-001 for the steelman of the alternatives and the pre-mortem.
- **Enforced (cycle 2):** the boundary is now **gate-enforced**, not just documented:
  `{product}/scripts/check-editorial-accent-boundary.mjs` forbids `#FFB020`/`#FF6B5C`
  anywhere in the product (wired into `ci.yml`), and `{site}/scripts/check-tokens-sync.mjs`
  asserts they never enter the shared spine. Both ship with `--self-test`.

---

## 4. Marks and icons

- **One mark, "The Pane":** a solid rounded square with the muntin cross cut as a
  negative channel (four filled panes). Both repos use it — `{product}/packages/ui/src/
  WindowMark.tsx` is canonical (32u grid, transom 9.5u/15.5u, r6, channel 3u); `{site}`
  ships six SVG variants in `brand/mark/` at 128u (the canonical paths ×4). The earlier
  "studio outline vs. product solid" split is **resolved** — `brand/mark/*.svg` are all
  solid Panes.
- **Geometry is spec'd + gated** (cycle 3): the single source of truth is
  **`docs/brand/window-mark-geometry.md`**; `check-mark-geometry.mjs` in **both** repos
  asserts every encoding (WindowMark, favicon, gradient-field clip, the six studio
  variants) conforms. Negative-tested.
- **Icons:** `{product}` is **lucide-only**, re-exported through
  `packages/ui/src/system-icons.ts` and locked by `check-icon-source.mjs`. `{site}`
  ships bespoke `currentColor` icons. This asymmetry is a deliberate seam.
- **Favicon on the cool spine (cycle 4):** the product favicon (`muntin-ledger.svg`)
  was re-pigmented from retired-warm `#FAF7F2`/`#14161A` to the cool spine
  (`#F6F7F8`/`#16181D`); geometry unchanged. `check-brand-asset-palette.mjs` keeps the
  product's icon/favicon chrome warm-free (it deliberately does **not** touch the demo
  letterhead/receipt, which depict third-party vendor paper).

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
| Golden Hour accent boundary | `check-tokens-sync` (absent from spine) | `check-editorial-accent-boundary` (absent anywhere) |
| Window-mark geometry | `check-mark-geometry` (128u studio variants) | `check-mark-geometry` (32u: WindowMark/favicon/clip) |
| Brand-asset palette | `migrate-warm-palette` (chrome) | `check-brand-asset-palette` (icon/favicon SVGs) |

**Deliberate asymmetries (don't "fix" without a charter):** the "Don" gate and the
lucide-lock live only in `{product}`; `{site}` ships bespoke icons.

**Not yet gated (tracked backlog):** the **merged two-tier banned list** read by both
repos (specified, not built — P1), token-sync hardening (manual vendor step — P1), and
doc-vs-code currency (no gate asserts these docs still match the code — refresh on cadence).

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
