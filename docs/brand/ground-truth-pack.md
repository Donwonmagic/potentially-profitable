# Brand Ground-Truth Pack

**The point of this file:** so no one ever briefs off a stale doc again. It is a
**dated, code-verified** snapshot of what is actually true across both repos —
explicitly distinct from the design docs, several of which are stale. Treat *this*
as truth, and treat anything older than its "verified" stamp as a hypothesis until
re-checked.

- **Verified:** 2026-06-07 (✓ = confirmed against live code this date; ◦ = from
  the cross-repo recon, high-confidence, file:line cited but re-confirm if load-bearing)
- **Decays:** fast — both `main` branches move quickly. **Refresh procedure at the
  bottom.** If this stamp is > ~3 weeks old, re-run it before trusting it.
- `{site}` = `potentially-profitable` · `{product}` = `Muntin-Invoice-Decoder`

## 1. Source-of-truth map (what governs what)

| Concern | Canonical source | Notes |
|---|---|---|
| Voice / naming / registers | `{site}/docs/brand/voice-and-naming-architecture.md` | The cross-product verbal authority (lives in `{site}`, referenced by both). ◦ |
| Design tokens (palette/type/motion) | `{product}/packages/ui/muntin.tokens.json` | ✓ exists. Canonical; **vendored** into `{site}/data/muntin.tokens.json` (✓ exists). |
| Token runtime (product) | `{product}/packages/ui/tokens.css` | `--mun-*` vars; JSON mirrors it. ◦ |
| Token runtime (site) | `{site}/assets/site.css` `:root` | legacy var names (`--cream`/`--teal`…), mapped via JSON `legacyVarMap`. ◦ |
| Tool/product names | `{site}/data/tools.json`; product copy `{product}/apps/web/lib/copy.{ts,es.ts}` | ◦ |
| Cross-repo SEO/entity | `{site}/docs/seo-handoff-both-repos.md` | one Org `@id`, one GA4. ◦ |

## 2. The brand model (verified essentials)

**One palette, two registers.** Divergence is allowed on **exactly three axes** —
typography, theme, primary-blue — and nowhere else.

| | Register A — Studio (`{site}` → muntin.digital) | Register B — Product (`{product}` → app.muntin.digital) |
|---|---|---|
| Speaker / POV | one person, **"Don"**, first-person **"I"**; "we" banned | the **system**: **"we"** (mechanism) + **"you"**; "I" only on the learning surface; never "Don" |
| Type | Fraunces (display) + Inter | Inter + Geist Mono (Fraunces → `--mun-font-editorial` only) |
| Theme | **light only** | **dark-first** |
| Primary accent | **`#2a50c8`** ✓ | **`#3b68f5`** ✓ (dark accent `#5b82ff` ✓) |
| Var vocabulary | legacy (`--cream`,`--teal`,`--ink`,`--rust`) | `--mun-*` |
| Shared by both | no exclamation/emoji, no marketing-speak, ≤ grade-7, window/muntin metaphor only |

**Boundary rule:** the named *persona*, not the pronoun. Cross-references use the
neutral name ("See Muntin Ledger").

**Naming canon:** Muntin Digital (studio/parent) · Muntin Ledger (product; short
"Muntin") · future products = "Muntin &lt;Noun&gt;" · **"Invoice Decoder" is RETIRED**
as a name (repo/analytics/code identifier only). ◦

## 3. The token spine + its lock (the most load-bearing mechanism)

- Canonical `{product}/packages/ui/muntin.tokens.json` → vendored copy
  `{site}/data/muntin.tokens.json`. **Manually copied.**
- Pinned by a SHA-256 spine hash: `EXPECTED_SPINE_HASH` in **both**
  `{site}/scripts/check-tokens-sync.mjs` ✓ and `{product}/scripts/check-tokens-parity.mjs` ✓.
  A token change must update **both** hashes + re-copy the JSON, in lockstep, or
  both repos' CI fails. This is **fragile by design and a P1 to harden.**
- `legacyVarMap` (in the JSON) is the Rosetta Stone between `--mun-*` and the
  site's legacy names. **Legacy names are load-bearing — do not "clean them up."** ◦

## 4. ⚠️ Stale docs (✓ all three exist on disk — do NOT cite as truth)

| Doc | Why stale |
|---|---|
| `{site}/docs/design-system.md` | §OG palette lists the **retired warm** scheme |
| `{site}/docs/brand/graphic-asset-audit-2026-05.md` | claims icons/mark/OG still warm — all already migrated |
| `{product}/docs/visual-design-system.md` | locked 2026-05-11; predates the slate+blue re-pigment by 5 days |

Retired warm hexes (`#1F4E5B`, `#FAF7F2`, `#B8541A`) are **forbidden in chrome**
(`migrate-warm-palette --check`).

**Resolved 2026-06-07 (cycle 1):** the current guideline
**`docs/brand/visual-system.md`** now supersedes the palette/OG claims in all three;
each carries a dated supersession banner. Live grep confirmed `brand/og/*.svg` (764
files) carry **0** retired-warm hexes — so the `graphic-asset-audit`'s "OG/icons still
warm" claim was itself stale, now flagged as such on the doc.

## 5. Cohesion gates (where each lives — asymmetries are deliberate)

- **`{site}`** (`node scripts/check-all.mjs`): check-tokens-sync, migrate-warm-palette,
  check-contrast (AA light+dark), check-banned-words, check-cta-canon,
  check-button-vocabulary, check-name-coherence, check-og-{images,coverage,template-grid},
  check-cls-animation (keyframes), check-css-drift, check-css-shells, locale-parity/hreflang,
  **check-tokens-sync** (also asserts the Golden Hour accent stays out of the spine — ADR-001),
  **check-mark-geometry** (studio marks conform to the window-mark spec). ◦
- **`{product}`** (`.github/workflows/ci.yml`): check-tokens-parity ✓, check-contrast,
  check-icon-source (lucide-only via `@muntin/ui/icons`), check-focus-discipline
  (`.mun-focus`), check-keyframes-allowlist, visuals-budget, **check-voice-boundary**
  (bans the studio persona in product copy — ✓ references "studio"), check-verboten-phrases,
  check-copy-grade (FK≤7), check-pronunciations,
  **check-editorial-accent-boundary** (bans the studio Golden Hour accent anywhere in the
  product — ADR-001), **check-mark-geometry** (WindowMark/favicon/gradient clip conform to
  the window-mark spec), **check-brand-asset-palette** (icon/favicon SVGs stay on the cool
  spine), **check-cross-repo-seams** (window→source=ledger attribution + shared business
  @id + contact). Plus Lighthouse + Playwright visual baselines. ◦
- **Asymmetries (don't "fix" without a charter):** the "Don" gate + the lucide
  icon-lock exist *only* in `{product}`; the site ships bespoke `currentColor`
  icons. The **merged two-tier banned list** (one list read by both) is *specified*
  but *not built* (P1).

## 6. Cross-product seams ✓ (Golden Hour at `build-og-cards.mjs:62-80` — now governed)

> **Golden Hour update (2026-06-07):** marigold `#FFB020` + coral `#FF6B5C` are live in
> **765/766** OG cards and marigold doubles as the editorial "Tools / free-course badge"
> accent. **Decided** (ADR-001): a sanctioned *editorial-only* accent, excluded from the
> spine and from `{product}`. Enforcement gate still pending (P1).


> **Mapped + corrected (cycle 5):** the full, code-verified seam inventory is now
> `docs/brand/cross-repo-seams.md` (treat IT as truth where it disagrees with this §6).
> Two §6 claims were aspirational and are fixed/corrected there: the shared Org `@id`
> was **not** actually referenced by the product (now linked + gated), and funnel event
> names are **not** shared across repos (different analytics by design — not a gap).

- **Storefront → Ledger:** `{site}/data/ledger-cta.json` + `inject-ledger-cta.mjs`
  (end-of-article aside) + nav CTA → `ledger.muntin.digital`; Plausible "Ledger Route Click". ✓
- **Ledger → Studio:** `{product}` `MarketingFooter.tsx` links muntin.digital;
  contact routes to `muntin.digital/window?source=ledger`; `@muntin/ui` ErrorBanner
  hardcodes `hello@muntin.digital`. ✓ (attribution + entity gated by `check-cross-repo-seams.mjs`)
- **Shared business entity:** `@id` `https://muntin.digital/#business` — declared by
  `{site}` (777×); `{product}` `parentOrganization` now anchors to it. ✓
- **Mark geometry** — one spec now governs all encodings: `docs/brand/window-mark-geometry.md`
  (transom 9.5u/15.5u, r6, channel 3u, 32u grid) + `check-mark-geometry.mjs` in **both** repos.
  Verified 2026-06-07: all encodings agree (WindowMark.tsx ≡ favicon paths; site 128u marks
  = 32u ×4; gradient clip at transom proportion). ✓

## 7. Open findings (the live backlog this pack supports)

- **DONE (P0)** "Golden Hour" marigold/coral accent — **decided** (ADR-001): blessed as
  editorial-only, excluded from spine/`{product}`. Documented in `visual-system.md §3`.
- **DONE (P0)** Stale design docs → one current guideline (`visual-system.md`); 3 docs
  banner-superseded.
- **DONE (P1, cycle 2)** Golden Hour **boundary gate** — `{product}/check-editorial-accent-boundary.mjs`
  (bans the hexes anywhere in the product, in `ci.yml`) + `{site}/check-tokens-sync.mjs`
  (asserts absent from the shared spine). Both self-tested + negative-tested. (Dim 2 → 3.)
- **P1** Manual/fragile token-sync → real publish-and-vendor step.
- **P1** Merged two-tier banned list → implement, read by both repos.
- **DONE (P2, cycle 3)** Mark-geometry single spec — `window-mark-geometry.md` +
  `check-mark-geometry.mjs` in both repos. (Dim 6 → 3.)
- **DONE (P2, cycle 4)** Favicon palette drift — `muntin-ledger.svg` re-pigmented to the
  cool spine (`#F6F7F8`/`#16181D`); `check-brand-asset-palette.mjs` keeps the product's
  icon/favicon chrome warm-free (scoped to brand assets — does not touch the demo
  letterhead/receipt, which deliberately depict third-party vendor paper).
- **DONE (P2, cycle 5)** Cross-repo coupling — mapped in `cross-repo-seams.md` + gated
  (`check-cross-repo-seams.mjs`); linked the product's `parentOrganization` to the shared
  business `@id`. (Dim 9 → 3.)
- **P2** Naming seam (Workshop/Ledger) — still undocumented.
- **P3** Analytics unification — {site} Plausible vs {product} custom funnel + GA4 are
  separate by design; revisit only if a single cross-domain funnel is wanted (a
  product/analytics call, not brand).
- **P3** Legacy-alias migration mid-flight — finish or freeze deliberately.

## How to refresh this pack (do this when the stamp is stale)

1. Re-run both gate sets + `git log --since=<last stamp>` in each repo for brand-
   relevant changes (tokens, voice, OG, marks, naming).
2. Re-verify §2–§3 hexes/paths against live files (don't trust this snapshot).
3. Diff against the previous stamp; note what changed and update the date.
4. If a *fact* changed (not just drift), check whether an ADR is owed.

> Verification log:
> `2026-06-07 — created; §1–6 spot-verified against live code.`
> `2026-06-07 — cycle 1: tokens.json byte-identical + hashes equal; brand/og/*.svg = 0 warm hexes, Golden Hour in 765/766; §4/§6/§7 updated; ADR-001 logged; visual-system.md published.`
> `2026-06-07 — cycle 2: audited Golden Hour hexes (product = 0, both spines = 0, site uses --light-marigold/--light-coral editorial tokens); built + self/negative-tested the boundary gates both repos; Dim 2 → 3 (25/30).`
> `2026-06-07 — cycle 3: audited all ≥6 mark encodings (agree at scale 32/128/320/400); wrote window-mark-geometry.md + check-mark-geometry.mjs both repos (self+negative-tested); found favicon palette drift (#FAF7F2/#14161A → P2); Dim 6 → 3 (26/30).`
> `2026-06-07 — cycle 4: re-pigmented the product favicon to the cool spine; built check-brand-asset-palette.mjs (scoped to icon/favicon chrome, ignores comments + demo paper; self+negative-tested). Hardening — total holds at 26/30.`
> `2026-06-07 — cycle 5: audited the seams (found the shared @id was NOT actually referenced by the product; funnel vocab not shared by design); wrote cross-repo-seams.md, linked product parentOrganization to …/#business, built check-cross-repo-seams.mjs (self+negative-tested); Dim 9 → 3 (27/30).`
