# Design Ground-Truth Pack — Muntin (one palette, two registers)

**Purpose:** a dated, code-verified snapshot of the *actual* visual system, so the
Lead reasons from the token spine and the rendered pixel — not a Figma, a hex in
isolation, or a memory of the palette. Anchors are evidence; **re-confirm
load-bearing file:lines before acting** (the system ships weekly).

- **Verified:** 2026-06-07 (visual-design code recon across both repos). **Decays:**
  the spine and lock are stable; the *drift* (off-spine hardcodes, stale assets) is
  the volatile part — re-scan it each cycle. **Sibling doc:** `../brand/` (strategy,
  voice, naming) and `../brand/graphic-asset-audit-2026-05.md`.
- Repos: `Muntin-Invoice-Decoder` (canonical spine `packages/ui/muntin.tokens.json`;
  `packages/ui` components; product Register B) · `potentially-profitable` (vendored
  spine `data/muntin.tokens.json`; the `viz-*` system; OG generation; Register A).

## 1. The one-paragraph truth
The token system is **gold-standard**: one spine, two registers, bidirectionally
**locked by a SHA-256 spine hash** in both repos' CI. The registers are cleanly
separated (no `--mun-*` in the studio CSS; no legacy `--cream/--teal/--ink` in the
product CSS), the components are 100%-token-driven, and the `$meta` accurately
describes the architecture. **The inheritance risk is not the system — it's the
orphans that escaped it:** ~99 hardcoded hex values in the product illustration SVGs
frozen in a **retired warm palette**, a `viz-waterfall` `gold` (`#C5A059`) that
isn't in the spine, rgba gradient literals, and OG accents declared as raw hex. The
spine is law; bring the orphans home, then make a gate so they can't escape again.

## 2. The spine + the lock to PROTECT (verified — these are the crown jewels)
- **Canonical spine:** `Muntin-Invoice-Decoder/packages/ui/muntin.tokens.json` — a
  `$meta` "one palette, two registers" statement; a slate ramp (12 steps, ~220° hue,
  2–4% sat, `#ffffff`→`#0c0d10`); surfaces, text, border/focus, accent (`#3b68f5`
  default, `#2a50c8` deeper-for-AA `text`), status; a full **dark** override; scales
  (radius xs–pill, motion eases + 120/180/240/320ms durations, type Inter/Geist
  Mono/Fraunces).
- **The lock (do NOT let it drift):** `EXPECTED_SPINE_HASH` pinned identically in
  `check-tokens-parity.mjs` (product, ~:159) and `check-tokens-sync.mjs` (studio,
  ~:96). The product gate locks `packages/ui/tokens.css` (hand-authored) to the JSON,
  light AND dark; the studio gate locks the site `:root` legacy vars via a
  `legacyVarMap`. Bidirectional, SHA-256, un-bypassable.
- **Register A (studio):** `potentially-profitable/assets/site.css` `:root` — legacy
  vars (`--cream #F6F7F8`, `--ink #16181D`, `--teal #2A50C8`, `--rust`, `--stone`,
  `--line`, `--gold`); Fraunces display + Inter body; light-only.
- **Register B (product):** `Muntin-Invoice-Decoder/packages/ui/tokens.css` (~:24–331)
  — `--mun-*` semantic vars; Inter everywhere + Geist Mono for data, Fraunces
  surviving only as `--mun-font-editorial`; **dark-first** (`@media prefers-color-scheme`
  + `data-theme="dark"`); accent `#3b68f5` (light) / `#5b82ff` (dark).
- **The `viz-*` craft (studio):** `assets/site-article.css` (~:2853+) — `viz-bars`,
  `viz-waterfall`, `viz-slider`, `viz-magbar`, `viz-ba`, `viz-gauge`, `viz-flow`,
  `viz-tree`, `viz-ring`/`spark`/`hero`/`scroll`. The **teal↔rust tone-balance rule**
  is enforced by `check-article-graphics.mjs` (~:507–513): a `data-tone="teal"`
  figure obliges a `data-tone="rust"` somewhere in the body. Distinctive, custom,
  largely on-spine.
- **Components (product):** ~35 files in `packages/ui/src/` — 100% token-driven via
  Tailwind `@theme`, `motion-safe:` transitions, two radii (6px / pill), consistent
  4px spacing rhythm. Covered by light+dark visual regression (`styleguide-themes.spec.ts`).
- **OG/social:** `scripts/build-og-cards.mjs` — 4 templates (page/article/research/tool),
  1200×630 @2×, idempotent, mostly on canonical palette; `brand/og/cards.json` manifest.

## 3. ⚠️ The real backlog — drift (everything off-spine, prioritized)
| # | Sev | Drift | Evidence | Fix (then gate it) |
|---|---|---|---|---|
| 1 | HIGH | **Illustration SVGs frozen in retired warm palette** (~99 hex): `#faf7f2` cream, `#14161a` ink, `#92600f` warning, etc. — don't adapt to dark, clash with current slate | `packages/ui/src/illustrations/*` (TenantIsolation, LockAndLedger, RetentionClock, ReadPipeline, AuditChain, DepthPane, HandoffEnvelope, EmptyLedger, PhotoPrep) | Re-render onto spine tokens OR `fill="currentColor"` + token utilities; verify in dark |
| 2 | MED | **`viz-waterfall` `gold` is off-spine** — `#C5A059` exists nowhere in the spine | `assets/site-article.css:2910` | Define a spine `gold` token (if warranted) or remap to an existing tone |
| 3 | MED | **rgba gradient literals** in viz internals won't follow a token change | `site-article.css` ~:2915,2943 (e.g. `rgba(42,80,200,0.08)`) | Define a `--teal-tint` token; reference it in the gradient |
| 4 | LOW | OG accents declared as **raw hex** (marigold `#FFB020`, coral `#FF6B5C`) not sourced from a token | `scripts/build-og-cards.mjs` ~:69–70 | Export a PALETTE JSON; import it; document as sanctioned expressive tier |
| 5 | LOW | Work-thumbnail decorative gradients are **craft orphans** (off-spine, undocumented) | `assets/site.css` ~:1197–1199 | Comment-flag as "decorative, not spine-bound" or scope to a `.brand-gradients` layer |
| 6 | LOW | **No CI ban on raw hex outside the token files** — nothing stops the next orphan | (absence) | A `check-no-offspine-color.mjs` grep: raw hex only in token files + an allowlist |
| 7 | INFO | Expressive tier (chrome/editorial/expressive) exists in code but **isn't formalized as a guide**; expressive tokens (`--mun-gradient-brand-*`, grain) ungated | `packages/ui/tokens.css` ~:206–237 | Write the tier guide; document what may use the expressive layer |
| 8 | INFO | Studio is light-only by design but the **asymmetry isn't documented** in the sync gate (a new dark-only product token has no legacy alias) | `check-tokens-sync.mjs` (legacyVarMap) | Comment the gate: "studio register is light-only; dark tokens have no legacy alias" |

> Coordinate, don't collide: item 1 is **also** a UX finding (the illustrations lack
> `aria-label`/`aria-hidden`). The **palette re-render is yours**; the **a11y labels
> are UX's**. Same files, different lens — sequence them together.

## 4. The CI craft-net (the gates that keep the system honest)
`check-tokens-parity.mjs` (product: tokens.css↔JSON, light+dark, + spine hash) ·
`check-tokens-sync.mjs` (studio: legacy `:root`↔JSON, + same spine hash) ·
`check-article-graphics.mjs` (the `viz-*` rules incl. teal↔rust tone balance) ·
`check-contrast.mjs` + `check-dark-contrast.mjs` (AA at the token level, both themes) ·
the styleguide visual-regression suite (light+dark pixel baselines). **The gap:**
nothing yet bans a raw hex *outside* the token files — that's the highest-leverage
gate to add (item 6), because it converts the whole "everything traces to the spine"
doctrine from a habit into an invariant.

## 5. The highest-leverage move, always
**Turn the spine into an enforced spine.** Re-rendering the illustrations by hand
fixes today; a `check-no-offspine-color` gate fixes forever. The single biggest jump
is to (a) bring the orphans home (items 1–3) and (b) ship the raw-hex ban (item 6)
in the same cycle — so the drift you just cleaned can never silently return.

## 6. How to refresh this pack
1. **Re-scan for drift:** grep both repos for raw hex (`#[0-9a-fA-F]{3,8}`) outside
   the token files; diff against the allowlist. New orphans are §3's next rows.
2. Re-derive the spine hash on `muntin.tokens.json`; confirm both gates still pin it.
3. **Render-check:** open the styleguide in light AND dark; eyeball both registers
   side by side; confirm the illustrations adapt (or are flagged).
4. `git log --since=<stamp>` for `packages/ui/**`, `assets/site*.css`, `scripts/build-og*`,
   and the token files; re-confirm any file:line you're about to act on.
> Log: `2026-06-07 — created from visual-design code recon.`
