# Cost Index — accessibility, clarity & researchability plan

_Synthesis of a four-expert review (information architecture · accessibility + plain
language · methodology visibility/researchability · cross-platform) of the finalized
94-page Cost Index hub + ingredient pages + methodology page. Goal: make the tool
understandable at every skill level, make the work clearly visible and researchable,
and place methodology inputs in the right spots — without burying the simple read._

## The one-paragraph diagnosis

The **data model and methodology are genuinely strong** (split level/trend confidence,
measured/derived/absent honesty spine, backtested conformal coverage shown per item,
dated public provenance, CC0 series files, rich JSON-LD). The deficit is almost entirely
**exposure and layering**: the front door under-sells the depth and never links the
methodology; the per-page rigor sits in the novice's path instead of in a drawer; the
machine-readable proof (series CSV/JSON, the calibration record) exists but is invisible
to a human; and there is no print path for the one workflow the brand names out loud (a
controller PDF-ing a reading for a vendor). Four reviewers, four lenses, **the same three
words: visible, layered, openable.**

## Personas to design against (IA lens)

| Persona | The 5-second answer | The "go deeper" they need |
|---|---|---|
| **Line cook / sous** | price range + up/down + verdict | nothing — must not scroll past jargon |
| **Chef / owner (re-pricer)** | the verdict + "up and holding 8 weeks" | how-to-use + Plate Cost link |
| **Controller / accountant** | the Verified coverage line + "as of" date | series CSV download + #track-record + **print** |
| **Analyst / journalist** | the Urner-Barry contrast | full methodology + cointegration + data + calibration record |

Today the IA serves personas 1–2 and reaches 3–4 almost by accident. No surface tells a
first-timer which of the four they are or routes them.

## What's already strong — do NOT regress

- Fluid hub grid (`repeat(auto-fill,minmax(min(260px,100%),1fr))`) — the responsive hero.
- Verdict chips carry their **word** (Re-price/Hold/Watch) — meaning survives grayscale.
- Pre-rendered inline SVG sparkline with a full `aria-label`, restated in visible capsule
  prose — instant paint, survives a dead network, screen-reader-equivalent.
- Ingredient-page body copy reads at ~8th grade ("below the range is a good deal; inside
  is normal; well above is a vendor conversation") — model plain language.
- Methodology TL;DR (`.ci-tldr`), the honesty spine table, the no-forecast stance, the
  stated-limitations section. JSON-LD (Dataset/DataDownload/citation/isBasedOn, CC0).

---

## P0 — do first (each flagged by 2+ reviewers, or breaks a named workflow)

| # | Fix | Why / who flagged | Where |
|---|---|---|---|
| P0-1 | **Link the hub → methodology**, and add a 3-cell "what this is / who it's for / how it's different" orientation band under the hero (pull the Urner-Barry contrast forward). | The hub links methodology **nowhere** — the entire credibility argument is unreachable from the front door. (IA + Methodology) | `cost-index/index.html` (hub template in builder) |
| P0-2 | **Surface the data downloads** as a visible "Download this series (CSV · JSON)" link on every ingredient page. | series.csv/json exist but live **only in JSON-LD** — invisible to humans, screen readers, and the controller/journalist who most need them. Also the a11y data-table fallback for the chart. (Methodology + A11y + Cross-platform) | ingredient template, near `ci-read__method` |
| P0-3 | **Add a print/PDF stylesheet** (`@media print`): hide nav/CTAs/sibling-runs/footer/forms, reset `main` padding, force `<details>` open, force verdict chips to print with border+text (not color-only), keep the read + sparkline + capsule + sources + "as of". | The controller→vendor-email workflow is named by the brand and is currently the **worst** surface — fixed nav overlap, collapsed provenance, color-only meaning. **No `@media print` anywhere.** (Cross-platform) | shared/inline CSS |
| P0-4 | **Promote the answer above the lede** on the ingredient page: a one-line "Up · ~$12.32–$13.16/lb · as of 2026-06-12" banner with the verdict chip, immediately under the H1; demote the deferring lede below it. | The literal 5-second answer is currently below a lede that says "open the reading below." (IA) | ingredient template render order |
| P0-5 | **Fix the amber "Watch" chip contrast** (`#8a6d1f` on cream ≈4.0:1 at 11px; border ≈1.7:1) → darken toward `#6f5712` + darker border. | WCAG 1.4.3 / 1.4.11 fail. (A11y) | inline CSS `.ci-read__verb[data-bias="watch"]` |
| P0-6 | **Define `--teal-wash`** (the `.ci-read__verified` background falls back to an off-brand green tint) and verify the Verified block text clears 4.5:1. | A real token bug (introduced with the Verified line). (A11y) | inline CSS `:root` + `.ci-read__verified` |

## P1 — strong improvements

**Layering & clarity**
- Collapse the analyst-grade **Verified coverage line + Sources** into a "How sure is this?"
  `<details>` drawer (keep range/direction/verdict always-open on top). Cleans the
  novice→expert layering. (IA + A11y)
- **Wire the glossary to the terms that confuse a novice**: add a missing **`wholesale`**
  glossary entry (the most load-bearing word on every page, currently undefined), and
  inline-link first occurrences of *wholesale, typical range, confidence, 80% band* via the
  existing `.ci-inline` dashed style. (A11y)
- **Plain gloss next to each technical claim** (the methodology already does this for
  "absent" — make it the rule for cointegration / conformal / no-skill baseline). Reword the
  confusing "**Higher than 0 of its last 12 reads**" → "at the bottom of its recent range";
  lead the Verified line with a plain version ("our predicted range has been right 85% of the
  time") and keep the rigorous one in the drawer. (A11y)
- **Expand abbreviations on first use** (USDA/BLS/FRED/EIA/AMS/LMR/NOAA) via `<abbr title>`. (A11y)

**Hub & navigation**
- Add a **client-side filter** to the 94-card wall (name search + verdict toggles using the
  existing `data-bias`) and **category jump-links**; add the index-wide "as of" date to
  "What's moving." (IA + Cross-platform)
- **Fix the nav inconsistency**: ingredient pages ship a *stripped* nav (logo only — no menu,
  no search) while methodology ships the full nav. Ingredient pages are the high-traffic
  surface and are mobile dead-ends. Align them. (Cross-platform)
- **Cap the sibling list** (avocado lists ~70 produce links in one inline run — a tap-target
  spacing fail and a second copy of the hub) to ~6–8 nearest + "Browse all →"; render as a
  `<ul>`/chip list, not a hairline-underlined `<p>`. (IA + A11y + Cross-platform)

**Methodology visibility & researchability**
- **Publish the calibration record at a routable URL** (`/cost-index/calibration.json` or a
  small page) and link it from `#track-record` — "the calibration table *is* the trust
  artifact; it must be openable, not just quoted." (Methodology)
- **Render a reliability visual** on the methodology page (nominal 80% vs realized 83%; the
  low/med/high trend tiers with n vs the 50% baseline). The data is already in the report;
  today it's prose only. (Methodology)
- **Expose the full trend record** (add the medium tier 50.8%/n=673 + overall 53.9%, not just
  high/low) and **name the conformal method** ("split/EnbPI conformal, ACI-widened", "42 of 83
  bands widened") on the methodology page — rigor you've done and hidden. (Methodology)
- **Per-item "verify this yourself" path**: the per-item Verified line should sit next to that
  item's series download + dated source list, so the loop headline→range→raw series→source
  report→coverage completes on one page. (Methodology)

**Accessibility & touch**
- Promote methodology **FAQ questions from `<p>` to `<h3>`** (six missing outline stops). (A11y)
- Add a **visually-hidden data table** (or feed `dataLabels` so `sparkline.js` emits `<desc>`)
  and mention the band/midline in the chart's text alternative. (A11y + Methodology)
- **Tap targets**: pad `<details>` summaries (≈12px text today), lift verdict chips to ≥24px
  effective height, space the dense link runs — WCAG 2.5.8. Add `:focus-visible` outlines
  (only the skip-link has one today). (Cross-platform + A11y)
- **Dark mode doesn't reach cost-index content** (inline `:root` hardcodes light tokens; the
  toggle restyles nav/footer but leaves the reading on cream). Add a
  `@media (prefers-color-scheme:dark)` + `[data-theme=dark]` override. (Cross-platform)
- Add `.mtn-spark{max-width:100%;height:auto}` so the fixed-248px SVG can't clip on narrower
  containers. (Cross-platform)

## P2 — polish

- **Reconcile the ingredient count** (hub prose says 82, methodology 83, CLAUDE.md 94, disk
  96) to one injected source of truth (`data/site-counts.json`). Flagged by **three**
  reviewers — small but a credibility paper-cut. (IA + A11y + Methodology)
- **Distinguish nominal (80%) from realized (83%)** explicitly wherever both appear. (Methodology)
- **Per-ingredient OG title/image** (every reading currently shares one "Cost Pulse" card, so a
  shared ribeye link says nothing). (Cross-platform)
- Reconsider "Open Cost Pulse" as the *primary* (filled) CTA on a page that already answers the
  question — make "browse / stay" primary, Cost Pulse the ghost button. (IA)
- A one-line **"reproduce this"** note on methodology (CC0 data + downloadable series +
  CI-rechecked calibration). (Methodology)

## Placement map — which methodology element lives where

| Element | Hub | Ingredient page | Methodology page | Data files |
|---|---|---|---|---|
| Simple read (range, trend, verb) | verb badge | **primary, above lede** | — | — |
| Per-item coverage ("Verified") | — | yes, **in a drawer** | — | calibration.json |
| Per-item series download | — | **add visible link** | — | the file |
| Link to methodology | **add (P0)** | keep | self | — |
| Pooled coverage + trend tiers + reliability chart | trust badge linking out | summary line | **full visual (P1)** | calibration.json |
| Conformal method name / widened count | — | — | **add (P1/P2)** | already there |
| Calibration record (openable) | linked | linked per-item | **linked + charted** | **publish routable (P1)** |
| Ratio-bridge / cointegration / freshness | — | — | keep (strong) | bounds/health JSON |

## Suggested execution order

1. **P0 batch** — almost all live in `scripts/build-cost-index-pages.mjs` (hub template,
   ingredient template, inline CSS) + a rerun + the 194-gate suite. One coherent commit per
   theme: (a) hub orientation + methodology link, (b) ingredient answer-banner + download link
   + drawer, (c) print stylesheet, (d) contrast/token fixes.
2. **P1 glossary + plain-language** — needs a `wholesale` glossary entry + inline links + a few
   rewordings (touches the fact/voice gates — keep prose clean).
3. **P1 methodology visuals + routable calibration** — a small build step to emit
   `/cost-index/calibration.json` + a reliability figure on the methodology page.
4. **P1 nav/dark-mode/tap-targets** — CSS + template alignment.
5. **P2 polish** — count reconciliation, OG, nominal/realized.

Everything is verifiable here (the 194-gate suite + the builder); none of it needs the live
vendor pipeline.
