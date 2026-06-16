## Domain IX — Design System & Visual Craft

*Positioning Council batch · specialists 62–68 · prepared 2026-06-16. Strategy only; one part-file, no live-site edits. The window/muntin metaphor (a muntin is the bar between window panes) is the only sanctioned metaphor family below.*

**Domain-wide honesty notes.** Every repo number is file-cited; web benchmarks carry source + access date; anything else is labeled *analyst assessment* or *illustrative*. Four load-bearing facts shaped these briefs: (1) the brand runs **one palette in two registers** — editorial light (Fraunces + accent `#2A50C8` for AA on light) and product dark-first (Inter/Geist Mono + `#3B68F5`) — locked by `scripts/check-tokens-sync.mjs` against `data/muntin.tokens.json` via a pinned spine hash (`EXPECTED_SPINE_HASH`), with `scripts/vendor-tokens.mjs` as the publish-and-vendor step (this is the "build-tokens.mjs --check" guard named in the brief). (2) The **Golden Hour** expressive layer (marigold `#FFB020` / coral `#FF6B5C`) is editorial-ONLY and boundary-gated by ADR-001 (`EDITORIAL_ACCENT_IN_SPINE` in `check-tokens-sync.mjs`) — it must never enter the shared spine. (3) `brand/og/` holds **766 SVG + 766 PNG** cards generated from `scripts/build-og-cards.mjs` (5 manifest kinds + derived `people`; `grep "kind"` cards.json = article 80 / glossary 280 / page 64 / research 206 / tool 136). (4) Two live defects surfaced during the audit and are flagged honestly in the briefs that own them: the stale **`site.webmanifest`** theme/background hexes (66) and the **`viz-spark`/`viz-hero`/`viz-scroll`** "future phases" gap (62). No component-library / Figma export exists today (`find` for `tokens.css`/`storybook`/`figma` = 0 hits) — the recurring asymmetric gap.

---

### 62 · Design-System Architect

**Aspect & why it decides success.** The system is the leverage. A one-person studio ships 766 on-brand share cards, a token-locked palette, and a CI that fails on visual drift precisely because design decisions are *encoded once and propagated by build*, not hand-applied per page. This is the asymmetric thesis in literal form: the architecture, not headcount, does the work.

**Current-state audit (score 8/10).** The spine is genuinely strong. `data/muntin.tokens.json` is a typed source of truth (slate 0–950, accent editorial `#2a50c8` / product `#3b68f5`, rust `#c42e2e`, gold `#b7791f`, status triad, 4 radii, 3 easings + 4 durations 120–320ms, dual register documented). It is vendored from the product repo and pinned by a sha256 spine hash in two cross-repo guards (`check-tokens-sync.mjs` + the product's `check-tokens-parity.mjs`); `vendor-tokens.mjs --from/--diff/--check` mechanizes the copy. The Pane mark is consistent across `brand/mark/` (7 variants) and re-drawn identically in `build-og-cards.mjs` (`muntinMark()`, canonical 32-unit grid). **Gaps (the −2):** (a) `viz-spark`, `viz-hero`, `viz-scroll` are listed as families in CLAUDE.md and canon but exist in `assets/site-article.css` only as a "Future phases extend this with…" comment (line ~2867) — *named but unshipped*; the gate (`check-article-graphics.mjs`) counts "≥2 distinct viz-* kinds," so the corpus leans on the ~11 that are real. (b) No machine-readable token export beyond CSS `:root` and the JSON — no Style-Dictionary/W3C-DTCG output, no Figma variable bridge.

**Benchmark gap (Shopify Polaris).** Polaris ships a **primitive→semantic two-layer token model** (`--p-space-100` primitives; semantic tokens that "should never be used for anything other than the concept they're referencing") with a Figma UI kit kept in parity (github.com/Shopify/polaris-tokens; polaris.shopify.com/previous-releases/version-12, accessed 2026-06-16). Muntin's tokens are effectively one flat layer with a legacy alias map (`legacyVarMap`); intent ("this is the danger color") and value (`#c42e2e`) are not separated, so a re-pigment must touch alias names.

**The Extend-Past move.** Don't out-component Polaris (pointless for one person). Instead make the system *provably coherent and self-documenting* — a thing a 100-designer org struggles to keep honest: a generated, browseable token/viz reference page at `/system/` driven by the same JSON the gates enforce, so the documentation can never drift from the live palette.

**Actions.**
1. Promote `viz-spark`/`viz-hero`/`viz-scroll` from comment to shipped CSS (define the 3 wrappers + `data-audio-alt`/`figcaption` contract) OR demote them in CLAUDE.md + canon to "planned" so the named-vs-real set is honest. **S × 4**
2. Add a semantic alias tier in `muntin.tokens.json` (`--color-danger → status.danger`) and emit it; keep `legacyVarMap` as the back-compat shim. **M × 4**
3. Generate `/system/index.html` from `muntin.tokens.json` + a viz-family registry (swatches, contrast, the 11 live families with one live example each); gate it with a new `check-system-page.mjs` so it can't drift. **L × 5** *(ASYMMETRIC)*
4. Export a W3C-DTCG `tokens.json` build artifact (Style-Dictionary shape) so Figma/Canva MCP can consume one canonical source. **M × 3**

**Risks & honesty-gate notes.** Resolving (a) is itself an honesty fix — CLAUDE.md currently advertises capability the CSS doesn't fully ship. A generated `/system/` page must carry no invented metrics; swatches/contrast are computed, not claimed. Token edits must re-run `vendor-tokens.mjs` + re-pin the hash in BOTH guards or CI fails.

**One proof metric.** Named viz-* families == shipped viz-* families (currently a mismatch); `/system/` page regenerates green in `check-all.mjs`.

---

### 63 · Visual-Identity Lead

**Aspect & why it decides success.** Identity is the trust proxy. In a category whose default is a Toast/Wix template or Yelp clutter, a coherent restaurant-specific visual language is the single loudest signal of "trust me with your business" — it is craft a marketplace theme structurally cannot fake.

**Current-state audit (score 8/10).** The Pane mark is a real system, not a logo file: 7 mark variants (`brand/mark/`), 7 lockups (`brand/lockup/`: horizontal/stacked/wordmark × ink/teal/cream), patterns (`brand/patterns/`), and the mark re-expressed as the OG "muntin field" whisper texture (`muntinField()`, 4.5–5% opacity) and leitmotif. The window/muntin metaphor is disciplined and singular. Type pairing (Fraunces display + Inter body) is editorial-grade and self-hosted. **Defect found (honesty-gate):** `brand/favicons/site.webmanifest` ships `theme_color:#1F4E5B` (the **retired-warm teal**) and `background_color:#14161A` (pre-spine ink) — both off-spine values flagged in `retiredWarmPalette` / called out in `build-og-cards.mjs` as the old warm hexes. Android PWA install chrome therefore renders in the abandoned palette. The favicon README still prints the same stale `#1F4E5B`/`#FAF7F2` pair as "from the design tokens."

**Benchmark gap (Stripe / Linear / Apple).** Stripe and Linear earn trust through *relentless internal consistency* — one accent logic, one motion grammar, no orphan colors. Apple's craft signal is restraint plus precision. Muntin matches them on type and mark discipline; the gap is the leaked retired-warm value in the manifest (an identity surface most teams forget) and the absence of a single "brand surface" audit that proves no off-spine hex ships anywhere user-visible.

**The Extend-Past move.** Be the restaurant studio whose *own* brand passes the same forensic consistency bar it would sell to a client — then show the work. Fix the manifest, then add a gate that forbids retired-warm hexes in every shipped brand asset (manifest, OG, SVG, CSS), making "no orphan color" a CI invariant rather than a hope.

**Actions.**
1. Re-pin `site.webmanifest` to spine values (`theme_color:#2A50C8` or `#16181D`; `background_color:#16181D` light-mode ink) and correct the favicon README's quoted hexes. **S × 4**
2. Extend `migrate-warm-palette.mjs --check` (or a sibling gate) to scan `brand/**/*.{json,svg,webmanifest}` for `retiredWarmPalette` hexes; fail-CI. **M × 4** *(ASYMMETRIC)*
3. Commission a Figma brand-kit mirror (Figma MCP `create_new_file` + variables) seeded from the DTCG export in 62 — a shareable identity artifact for prospect decks, kept in token parity. **M × 3**
4. Add a one-screen `brand/README.md` "identity map" (mark/lockup/favicon usage rules + the singular metaphor) so the system is legible to a future collaborator. **S × 2**

**Risks & honesty-gate notes.** The manifest fix is a falsehood removal (README claims spine-sourced values that aren't). The new retired-warm scanner must allow `data/muntin.tokens.json#retiredWarmPalette` and docs (where the hexes are *documented as retired*, not *used*) — scope it to brand assets, mirroring how `check-tokens-sync.mjs` excludes `$meta`.

**One proof metric.** Zero `retiredWarmPalette` hexes in any shipped (non-doc) brand asset; new scanner green.

---

### 64 · Typography Specialist

**Aspect & why it decides success.** Type *is* the editorial register. The brand explicitly expresses warmth "through typography (Fraunces) + generous layout, NOT surface color" (`muntin.tokens.json#registers.editorial.warmthVia`). If the type system is editorial-grade, the static site reads as a publication; if it isn't, it reads as a template — exactly the line this whole studio is selling across.

**Current-state audit (score 8/10).** Mature foundation: Fraunces (display, self-hosted v38 with `Fraunces Fallback`) + Inter (body, v20 with `Inter Fallback`), preloaded (`inject-critical-fonts.mjs`, `inject-italic-font-preloads.mjs`), with a fluid clamp() type scale already wired (`--fs-eyebrow/body/lead/h4/h3` in `site.css`). Fraunces-italic is the signature editorial accent (used for the serif-italic headline word, OG `title_italic`, glossary AKA). TTF conversion for jsPDF is automated (`build-pdf-fonts.mjs`). **Gaps (the −2):** (a) bilingual EN↔ES type is mechanically identical but **Spanish runs longer (~15–25% expansion, illustrative/typesetting rule of thumb)** and there's no documented measure/leading adjustment for ES — wrap behavior is left to the same clamp; (b) Geist Mono is a *declared* tokens face (`scales.type.mono`) but is **product-register only** — `grep "Geist Mono" assets/site.css` = 0 hits — so the site has no canonical mono treatment for code/numbers (tools render numerics ad hoc).

**Benchmark gap (Apple / Medium).** Apple HIG and Medium both treat reading *measure* and vertical rhythm as first-class: Medium's article column is a tuned measure with a deliberate type scale; Apple's Dynamic Type guarantees legibility across sizes. Muntin has the scale and the faces; the gap is a codified reading measure + a bilingual-aware leading/measure rule, and a real mono for figures.

**The Extend-Past move.** Make the *reading experience* the moat: a documented editorial measure (≈66–72 char target, analyst assessment) enforced on article bodies, plus a register-correct mono for data, so every number on a tool reads as deliberately set. Editorial-grade type that a CMS theme can't match because it's tuned per language.

**Actions.**
1. Adopt Geist Mono (or a licensed mono) into the editorial register for tabular figures in tools/viz captions; add the `--font-mono` token + `font-variant-numeric:tabular-nums` on numeric cells. **S × 4** *(ASYMMETRIC)*
2. Codify an article reading measure (`max-inline-size` on `.article` body) and document the target in `voice-canon-library.md §8`; verify with a lightweight `check-reading-measure.mjs`. **M × 3**
3. Add an ES leading/measure note + (if needed) a slightly tighter clamp for ES article bodies; keep EN↔ES parity intact. **M × 3**
4. Document the type scale + italic-accent usage in the `/system/` page (62) so the scale is browseable, not folklore. **S × 2**

**Risks & honesty-gate notes.** Adding a mono is a perf line item — subset to digits + Latin, preload only on tool pages (LCP gate `check-image-*`/font budget). The 15–25% ES-expansion figure is labeled illustrative; no sourced number is asserted. Measure changes must not break `check-locale-parity.mjs`.

**One proof metric.** Article body measure within target on 100% of `library/` + `blog/` pages; tool figures render in tabular mono.

---

### 65 · Motion / Micro-Interaction Designer

**Aspect & why it decides success.** Motion is where craft and the perf gate collide. Done right, transitions read as polish that says "this was built, not bought"; done wrong, they cost CLS/LCP and fail CI. The asymmetric win is *delight that is provably free* — compositor-only, prefers-reduced-motion-honest.

**Current-state audit (score 7/10).** The token foundation is there: 3 easings + 4 durations in `muntin.tokens.json` (`ease-default/exit/emphasis`, 120/180/240/320ms), and `site.css` adds `--ease`, `--ease-out`, `--ease-spring` + `--t-micro/fast/med/slow`. Real motion is already compositor-correct: `viz-bars` animates `transform:scaleX` on intersection (`.in`), `viz-flow` reveal uses `opacity/transform` with staggered `transition-delay`, hovers use `transform:translateY` (`.tool-card:hover`). **Gaps (the −2):** (a) two motion vocabularies coexist — the tokens' 4-step duration ladder vs. site.css's `--t-fast/med/slow` (180/420/900ms) — they don't map cleanly, so timing is inconsistent across surfaces; (b) `prefers-reduced-motion` handling is per-block, not a single audited guard — no `check-reduced-motion.mjs` proving every keyframe/transition has an RM escape.

**Benchmark gap (Stripe / Linear).** Linear's motion is a tight spring grammar applied consistently; Stripe's is restrained and purposeful. Both treat reduced-motion as a first-class path. Material 3 Expressive (Google I/O 2025-05-13) just made **spring-based motion the system default** (blog.google; m3.material.io, accessed 2026-06-16) — the industry direction is *one coherent motion physics*. Muntin has the easings but two un-reconciled duration ladders.

**The Extend-Past move.** Ship a single, documented motion grammar (one duration ladder, one spring, one RM contract) and *prove the RM escape exists everywhere* via CI — delight that literally cannot regress performance or accessibility, which a template marketplace never guarantees.

**Actions.**
1. Reconcile the two duration ladders: map `--t-fast/med` onto the tokens' `dur-*` values (or document why editorial uses longer); record the canonical ladder in `/system/`. **S × 3**
2. Add `check-reduced-motion.mjs` to `check-all.mjs`: assert every `transition`/`@keyframes`-driven reveal sits under a `@media (prefers-reduced-motion: reduce)` reset. **M × 5** *(ASYMMETRIC)*
3. Constrain all animated properties to `transform`/`opacity` (lint for animating `width/height/top/left`); document the compositor-only rule. **M × 4**
4. Define one optional spring (`--ease-spring` already exists) as the single tactile press feedback; apply consistently to CTAs/cards. **S × 3**

**Risks & honesty-gate notes.** No content claims here — low honesty-gate risk. The real risk is CLS: any new reveal must reserve space (no layout-shifting entrances), respecting the existing `check-image-dimensions.mjs` philosophy. RM gate must allow genuinely instantaneous transitions.

**One proof metric.** 100% of animated selectors have a reduced-motion reset (new gate green); zero animations on layout properties.

---

### 66 · Dark-Mode / Theming Specialist

**Aspect & why it decides success.** "Legible at 11pm in a kitchen office" is the literal use case — restaurant operators read on phones in low light. A dark theme that's WCAG-correct *by construction* is both an accessibility win and a craft signal; one with invisible labels (the documented prior failure) destroys trust instantly.

**Current-state audit (score 9/10).** This is the strongest surface in the domain. `build-dark-mode.mjs` is a **token-flip architecture** (2026-05-30 rewrite): it remaps the base palette at the dark root so every `var(--cream)` surface and its `var(--ink)` text flip *together by construction* — structurally eliminating the light-on-light / dark-on-dark failures an allowlist guaranteed over a ~9,000-line stylesheet. Overloaded tokens are resolved two ways (correlated pairs self-resolve; inverted-by-design surfaces scope-restore light tokens — 25 catalogued surfaces). A short EXCEPTIONS list handles what a swap can't reach (hardcoded hexes, gradient-text, SVG data-URI strokes re-encoded with light strokes). Two activation paths (OS `prefers-color-scheme` gated so the explicit toggle wins, + `[data-theme="dark"]`), folded into render-blocking `site-core.css` to prevent flash. AA is machine-verified by `check-dark-contrast.mjs` with documented ratios (`--ink` 15.2:1, `--teal` 7.4:1, etc.). **Gap (the −1):** dark is product/site-toggle today; the editorial register is documented "light-only," so dark mode is a bolt-on flip rather than a first-class designed theme — the EXCEPTIONS list (≈20 entries) is the maintenance tax, and each hardcoded-hex surface is a future drift risk.

**Benchmark gap (GitHub / Linear).** GitHub ships multiple named themes (light/dark/dark-dimmed/high-contrast) from primitive token sets; Linear's dark is a designed surface, not an inversion. Muntin's flip is excellent engineering but is still *derived* from light, so it can't express a deliberately-different dark hierarchy (e.g., a dimmed variant for true night use).

**The Extend-Past move.** Keep the by-construction safety (it's better than most hand-built themes) but shrink the EXCEPTIONS surface to near-zero by killing hardcoded hexes at the source, then offer a "dimmed" night variant — the 11pm-kitchen theme as an *intentional* design, gate-verified for AA.

**Actions.**
1. Hunt and tokenize the hardcoded hexes the EXCEPTIONS list patches (nav rgba, `.tool-cta-form`, status pass/fail, hero panes) so the flip reaches them and the exception count drops. **M × 4** *(ASYMMETRIC)*
2. Add a "dark-dimmed" night variant (`[data-theme="dark-dimmed"]`) as a second token map; run it through `check-dark-contrast.mjs`. **L × 3**
3. Expose the theme toggle prominently (kitchen-office context) and persist choice; document the OS-gating logic in `/system/`. **S × 3**
4. Snapshot-test a few high-risk surfaces (forms, library cards, Listen dock) for both themes to lock the "no invisible label" win. **M × 3**

**Risks & honesty-gate notes.** Every token change must re-run `build-dark-mode.mjs` (the block is generated; hand-edits are forbidden by the `GEN:` markers) and pass `check-dark-contrast.mjs`. A dimmed variant doubles the contrast-verification matrix — gate it before shipping. No content claims; pure systems work.

**One proof metric.** `EXCEPTIONS` entries in `build-dark-mode.mjs` reduced ≥50%; both themes 100% AA in `check-dark-contrast.mjs`.

---

### 67 · OG / Social-Card Engineer

**Aspect & why it decides success.** Share previews are unpaid distribution at AI-search scale. Every glossary term, article, tool, and contributor that gets shared or cited paints a designed, on-brand card — or a generic one. At 766 cards, the system *is* the brand's most-reproduced surface.

**Current-state audit (score 9/10).** Best-in-class for a static site. `build-og-cards.mjs` is a spec-driven, manifest+typed-template engine: 6 templates (page/research/article/glossary/tool/people), 8 pluggable focus modules (list, funnel, quote, checks, score-ring, stat, type), a 15-entry glyph registry (drawn on the same 24-unit/1.75-stroke grammar as `brand/icons/`, capped at 16), an 8px baseline grid (`snap()`, `GRID_ROWS`), auto-fit titles (`fitTitle`), dek word-wrap (`dekTspans`), the Pane "muntin field" whisper texture + Golden Hour light layer. Output policy is sharp: SVG `viewBox` 1200×630, PNG rendered 2×; **content-based skip** (not mtime — git doesn't preserve mtimes, and CF Pages lacks `rsvg-convert`) with a `resvg-js` local fallback. Self-hosted Fraunces/Inter via fontconfig. 766 SVG+PNG pairs committed. **Gap (the −1):** rendering depends on `rsvg-convert` at build/local time (CF Pages "trusts what's checked in"); a manifest edit without a local render leaves a stale PNG with only a warning — there's no CI gate asserting every `cards.json` entry has a PNG whose SVG matches the current template output.

**Benchmark gap (Vercel OG / Satori).** Vercel OG runs **at the edge, JS-only, no Chromium** (Satori converts JSX+inline-CSS → SVG; runs on Cloudflare Workers/Deno; @vercel/og ≈500KB vs ~50MB Puppeteer) — dynamic per-request cards (vercel.com/docs/og-image-generation; vercel.com/blog/introducing-vercel-og-image-generation; npmjs.com/package/@vercel/og, accessed 2026-06-16). Muntin's model is the *opposite trade*: pre-rendered, committed, zero-runtime — which is correct for a static/CF site (no cold-start, no runtime cost) but means cards can silently go stale between builds.

**The Extend-Past move.** Don't chase edge-runtime (the committed model is the right asymmetric choice — every card is free at request time and survives on static hosting). Instead close the staleness gap: a CI gate that re-derives each card's SVG from the template and asserts the committed SVG+PNG match — so 766 cards can *never* drift from the manifest, a guarantee Vercel's per-request model gets for free but a committed pipeline must enforce.

**Actions.**
1. Add `check-og-cards.mjs` to `check-all.mjs`: for every `cards.json` entry (+ derived people), assert committed `<slug>.svg` == template output AND `<slug>.png` exists; fail-CI on drift. **M × 5** *(ASYMMETRIC)*
2. Optionally explore a **Cloudflare Worker + Satori** fallback route for long-tail/edge cases (new pages before a rebuild) — strategy only; keep committed PNGs as the default. **L × 2**
3. Lift the 16-glyph cap discipline into the manifest (validate `glyph` ∈ registry at build) so a typo'd glyph fails loudly instead of rendering blank. **S × 3**
4. Use Canva MCP brand templates as an authoring aid for one-off campaign cards that don't fit the 6 kinds, exporting to the same 1200×630 spec. **S × 2**

**Risks & honesty-gate notes.** The new gate must run only where `rsvg-convert` exists, or compare SVG-only on CF Pages (the script already documents this constraint) — assert SVG match always, PNG existence always, PNG pixel-match only locally. Card copy (`dek`, `stat.value`, `quote.text`) is content and falls under the fact gate — any numeric `stat`/`funnel` value must trace to `sourced-claims.json` or be illustrative.

**One proof metric.** OG drift = 0 (every manifest entry's SVG matches template output, PNG present) on every `check-all.mjs` run.

---

### 68 · Illustration / Iconography Lead

**Aspect & why it decides success.** Icons are the smallest unit of visual language and the easiest place to look generic. A custom, restaurant-specific icon set (reservations, delivery, reviews, margin, local-SEO) is a quiet but constant signal that the system was built for *this* category — the opposite of a Font Awesome grab-bag.

**Current-state audit (score 7/10).** A real, coherent set exists: 17 icons in `brand/icons/` drawn on a **24-unit grid, stroke-only, 1.75 stroke, round caps/joins, `currentColor`** (verified in `icon-window.svg` — the muntin mark itself as an icon). The OG glyph registry (`build-og-cards.mjs`) extends the *same* grammar with 15 restaurant-ops glyphs (reservations, delivery, reviews, conversions, local-seo, margin, glossary, research…) and explicitly states "same drawing language as /brand/icons/." So the vocabulary is consistent across two surfaces. **Gaps (the −3):** (a) the two icon sets live in **two places with no shared source** — 17 standalone SVGs + 15 inline template strings — so they can drift (a glyph fixed in one isn't fixed in the other); (b) no sprite/symbol system — icons are individual files/inline strings, not a `<symbol>` sheet, so reuse on the site is ad hoc; (c) no icon inventory/usage doc — the 16-glyph cap is enforced only by a comment.

**Benchmark gap (SF Symbols).** SF Symbols is the gold standard: one library, consistent weights/scales, and as of **SF Symbols 7 (WWDC 2025-06-09): Draw On/Off animation, automatic single-source gradients, Variable Draw, enhanced Magic Replace** (developer.apple.com/sf-symbols; 9to5mac.com/2025/06/11, accessed 2026-06-16). The relevant lesson isn't animation — it's *one canonical library, many surfaces, zero drift*. Muntin has the consistent grammar but two un-unified sources.

**The Extend-Past move.** Unify the icon language into one source of truth and ship it as a `<symbol>` sprite — a custom "restaurant-ops" icon system (the muntin/window as the brand anchor) that no template marketplace offers, drawn once and used everywhere (site + OG + PDF). The asymmetry: a category-specific icon vocabulary, system-maintained.

**Actions.**
1. Make `brand/icons/` the single source; refactor `build-og-cards.mjs` `GLYPHS` to import the same path data (read the SVGs at build) so a fix propagates to both surfaces. **M × 5** *(ASYMMETRIC)*
2. Generate a `brand/icons/sprite.svg` `<symbol>` sheet + a `check-icon-parity.mjs` asserting the OG registry and the icon files share identical path data. **M × 4**
3. Draw the 3–4 missing restaurant-ops icons to complete the set (e.g. ticket/kitchen, table-turn, allergen, hours) within the 16-cap and 24-unit/1.75 grammar. **S × 3**
4. Document the icon system (grid, stroke, naming, the cap, the muntin anchor) on the `/system/` page (62). **S × 2**

**Risks & honesty-gate notes.** Unifying sources is pure refactor (no content) — low honesty risk; the parity gate *prevents* future drift. New icons must hold the exact grammar (24-unit, 1.75 stroke, `currentColor`) or they'll read as foreign. Keep the muntin/window mark as the only metaphor anchor — no second metaphor family.

**One proof metric.** One icon source feeds both site + OG (parity gate green); restaurant-ops set complete within the 16-cap.

---

*End Domain IX. Cross-domain dependencies: actions 62.3 (`/system/` page), 64.4, 65.1, 66.3, 68.4 all converge on a single generated `/system/` reference — build it once. The DTCG token export (62.4) feeds the Figma brand kit (63.3) and Canva/Figma MCP authoring (67.4). The retired-warm scanner (63.2) and OG drift gate (67.1) and icon-parity gate (68.2) are three new `check-*.mjs` entries for `check-all.mjs` — sequence them behind the existing token/dark gates.*
