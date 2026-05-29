# Publisher Brief — *Privacy-Forward Restaurant Bookkeeping*

Audience: the article publisher. Goal: take `article-draft.md` to a live,
`check-all`-green library article in **both** locales.

## Identity (final-forever — do not rename slugs)

| | |
|---|---|
| EN slug | `privacy-forward-restaurant-bookkeeping` |
| EN path | `library/privacy-forward-restaurant-bookkeeping/index.html` |
| ES slug | `contabilidad-de-restaurante-con-privacidad` |
| ES path | `es/library/contabilidad-de-restaurante-con-privacidad/index.html` |
| Byline | **The Muntin Desk** (JSON-LD `author` still references Don Goldstein) |
| Pillars | `information-security` (primary) + `operations-margin` (secondary) — both real keys in `data/topics.json` |
| Title | `Privacy-Forward Restaurant Bookkeeping: What a Digital Ledger Should Never Do` |
| Meta description (≤155 — **gate is now hard-fail**) | `Privacy-forward restaurant bookkeeping: the five things a digital ledger should never do with your numbers — and how to verify each yourself.` |

## Build steps

1. Create the EN `index.html` from `article-draft.md`: the `<article id="post-body">`
   body is in the draft; copy the surrounding chrome (`<head>` + JSON-LD `@graph`,
   nav, breadcrumb, hero/header, footer, trailing scripts) **verbatim from the
   exemplar** `library/how-to-tell-if-a-restaurant-tool-is-safe/index.html`,
   swapping only the per-article values in the draft's "Boilerplate swaps" table.
2. Create the ES translation (see release blockers).
3. Wire the data manifests:
   - `data/i18n-slug-map.json` → `"privacy-forward-restaurant-bookkeeping": "contabilidad-de-restaurante-con-privacidad"`
   - `data/library-tags.json` (`blog_posts` object) → the entry in the draft's
     front-matter (`namespace: "library"`, `topics`, `date`, `read_min`).
   - `data/article-audio.json` → add with `status: "pending"`; must reach
     `rendered` for all six languages before release.
   - `data/sourced-claims.json` → **no new entries expected** (the draft uses zero
     hard numbers; the Sources drawers cite NIST / GDPR-principles / OWASP by name
     only). The one exception is the "ten years" line flagged below.
4. Run the build cascade, then `node scripts/check-all.mjs` until **126/126**:
   `build-library.mjs` (injects glossary autolinks, see-also, schema, read-time) →
   `build-sitemap.mjs` → `build-rss.mjs` → `build-llms-txt.mjs` (+ es). The
   glossary-autolink `<!-- LIBRARY:autolink … -->` sentinels in the draft body are
   *placeholders*; `build-library.mjs` owns them — don't hand-place them.

## Release blockers

- **ES translation** — translate the framework, recast the rhythm (canon §10,
  `docs/voice-canon-library.md`). Ship the ES figures **complete** (a fresh
  article shouldn't lean on a `check-article-graphics` `HISTORICAL_WAIVERS` entry).
- **OG image** — produced by the UX/UI specialist (see `b-landing-brief.md`). The
  `<head>` `og:image` must point at a real asset; a 404 path trips the image
  gates. Coordinate the path with them.
- **Six-language audio** — per-post `audio.json` + `audio.<lang>.json`
  (en/es/fr/it/pt/zh) rendered by `scripts/render-post-audio.mjs`. **Canon §12
  blocks publish until `status: rendered`.** The audio `text` is read aloud
  verbatim and must clear `check-fabrications` in every language.

## Gates the finished article must pass (all inside `check-all`)

- `check-fabrications` — zero invented numbers (the draft complies; preserve that
  in translation + audio). **Reconcile the "ten years on restaurant floors" line
  in §5** to the registered operator figure or recast it non-numerically.
- `check-article-tldr` — TL;DR aside + key-takeaways aside (both in the draft).
- `check-article-graphics` — ≥2 figures, ≥2 distinct `viz-*` kinds, ≥80-char
  `data-audio-alt` + `<figcaption>` on each, teal↔rust balance. The draft uses
  `viz-flow` (rust) + `viz-ba` + `viz-tree` (teal) → satisfied.
- `check-meta-description-length` — ≤155, **now hard-fail**.
- `check-locale-parity` + `check-hreflang-orphans` — EN↔ES parity.

## Internal links already wired in the draft

- → `library/how-to-tell-if-a-restaurant-tool-is-safe/` (the tool-safety companion)
- → `/never/` (the studio trust page)
- → `https://ledger.muntin.digital` (the product — closing section)
- post-end CTA → `/learn/checklists/audit-any-tool/`
- smart-next + see-also: tool-safety audit, `/tools/cost-pulse/`, `/never/`
