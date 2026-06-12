# Weekly basket read — the dispatch playbook

The recurring freshness post. Every Monday after the cost-index refresh
workflow lands (`.github/workflows/cost-index-refresh.yml`), the week's
post is a fill-in, not a blank page:

1. `node scripts/print-weekly-read.mjs` (and `--es`) — the headline
   numbers: basket trend, biggest movers, per-ingredient flags,
   confidence, asOf. Every number traces to `data/cost-index.json`
   provenance, so the fact gate is satisfied by construction.
2. Slug pattern: `basket-read-YYYY-MM-DD` (EN) mapped to
   `lectura-canasta-YYYY-MM-DD` (ES) in `data/i18n-slug-map.json`.
   Slugs are final-forever; the date IS the slug.
3. Shape: short dispatch (Don's byline, blog canon). One viz-bars
   figure (movers) + one viz-spark or table figure (basket trend) —
   that satisfies the article-graphics gate (≥2 figures, ≥2 viz kinds,
   data-audio-alt ≥80 chars, figcaptions, cite drawers pointing at the
   USDA/BLS/FRED provenance).
4. Voice: measured and dated, never forecast verbs ("is up", "came
   down", "looks structural per the breadth×persistence rule" — the
   banned-words gate enforces). Flags speak as hold / watch / act.
5. Release per `blog/drafts/README.md` (move folder, drop noindex,
   index card, sitemap) + audio scripts per the audio pipeline.

Why weekly: the May waves proved recency drives AI-era discovery and
then stopped. This post is the heartbeat that doesn't stop — and the
public, dated, append-only track record the Ledger launch leans on.
