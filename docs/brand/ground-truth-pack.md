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
(`migrate-warm-palette --check`). Superseding these docs with one current guideline
is **P0**.

## 5. Cohesion gates (where each lives — asymmetries are deliberate)

- **`{site}`** (`node scripts/check-all.mjs`): check-tokens-sync, migrate-warm-palette,
  check-contrast (AA light+dark), check-banned-words, check-cta-canon,
  check-button-vocabulary, check-name-coherence, check-og-{images,coverage,template-grid},
  check-cls-animation (keyframes), check-css-drift, check-css-shells, locale-parity/hreflang. ◦
- **`{product}`** (`.github/workflows/ci.yml`): check-tokens-parity ✓, check-contrast,
  check-icon-source (lucide-only via `@muntin/ui/icons`), check-focus-discipline
  (`.mun-focus`), check-keyframes-allowlist, visuals-budget, **check-voice-boundary**
  (bans the studio persona in product copy — ✓ references "studio"), check-verboten-phrases,
  check-copy-grade (FK≤7), check-pronunciations. Plus Lighthouse + Playwright visual baselines. ◦
- **Asymmetries (don't "fix" without a charter):** the "Don" gate + the lucide
  icon-lock exist *only* in `{product}`; the site ships bespoke `currentColor`
  icons. The **merged two-tier banned list** (one list read by both) is *specified*
  but *not built* (P1).

## 6. Cross-product seams ✓ (Golden Hour confirmed at `build-og-cards.mjs:62-67`)

- **Storefront → Ledger:** `{site}/data/ledger-cta.json` + `inject-ledger-cta.mjs`
  (end-of-article aside) + nav CTA → `ledger.muntin.digital`; demo-handoff magic-link. ◦
- **Ledger → Studio:** `{product}` `MarketingFooter.tsx` links muntin.digital;
  contact routes to `muntin.digital/window?source=ledger`; `@muntin/ui` ErrorBanner
  hardcodes `hello@muntin.digital`. ◦
- **Shared:** Org `@id` `https://muntin.digital/#business`; one GA4 + cross-domain;
  funnel event names must match across repos. ◦
- **Mark geometry** duplicated in ≥4 places (transom 9.5u/15.5u, r6, channel 3u). ◦

## 7. Open findings (the live backlog this pack supports)

- **P0** "Golden Hour" marigold/coral accent — ✓ real, `{site}/scripts/build-og-cards.mjs:62-67`;
  not in spine/docs/product; contradicts single-accent. *Confirm-tier decision.*
- **P0** Stale design docs → one current guideline.
- **P1** Manual/fragile token-sync → real publish-and-vendor step.
- **P1** Merged two-tier banned list → implement, read by both repos.
- **P2** Naming seam (Workshop/Ledger); mark-geometry single spec; cross-repo
  coupling (studio inbox, `/window`).
- **P3** Legacy-alias migration mid-flight — finish or freeze deliberately.

## How to refresh this pack (do this when the stamp is stale)

1. Re-run both gate sets + `git log --since=<last stamp>` in each repo for brand-
   relevant changes (tokens, voice, OG, marks, naming).
2. Re-verify §2–§3 hexes/paths against live files (don't trust this snapshot).
3. Diff against the previous stamp; note what changed and update the date.
4. If a *fact* changed (not just drift), check whether an ADR is owed.

> Verification log: `2026-06-07 — created; §1–6 spot-verified against live code.`
