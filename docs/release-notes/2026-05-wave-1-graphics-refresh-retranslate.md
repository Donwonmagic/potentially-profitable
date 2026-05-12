# 2026-05 Wave-1 graphics refresh — audio retranslate runbook

## What changed

The 10 May-2026 wave-1 articles each received new `<figure
class="viz-figure article-figure">` blocks (waterfalls, sliders, flow
diagrams, decision trees, recovery stacks, bar charts) with new
`data-audio-alt` narrations. The audio renderer extracts those
narrations as separate chunks, so the existing per-language MP3 tracks
no longer match the on-page content.

Branch: `claude/improve-article-graphics-sGuSm`. Three commits land the
refresh:

- `bed725a84` — pilot (Uber/DoorDash/Grubhub, service-charge vs tip, 30-days)
- `68b42f3b6` + `db28be1f6` — batch 2 (AI Overviews, maps diagnostic,
  schema example, reviews playbook)
- `b60793af4` — batch 3 (Instagram SEO, loyalty, overview hub)

## Run this when the PR merges to main

Renders all 6 languages, forces retranslation so the new audio-alt
chunks reach FR/IT/PT/ZH, commits per-article so a network drop
doesn't lose everything:

```bash
node scripts/render-post-audio.mjs \
  blog/may-2026-wave-publishing-for-citation \
  blog/how-to-get-cited-in-google-ai-overviews-restaurant \
  blog/restaurant-schema-markup-complete-paste-ready-example \
  blog/my-restaurant-isnt-on-google-maps-10-minute-diagnostic \
  blog/how-to-respond-to-google-reviews-restaurant-playbook-2026 \
  blog/instagram-as-restaurant-seo-strategy-2026 \
  blog/uber-eats-vs-doordash-vs-grubhub-restaurant-math-2026 \
  blog/30-days-after-leaving-doordash-restaurant-case-study \
  blog/loyalty-programs-for-independent-restaurants-what-works-2026 \
  blog/service-charges-vs-tipping-restaurant-operator-math-2026 \
  --engine f5 \
  --languages en,es,fr,it,pt,zh \
  --kokoro-model  ~/kokoro-models/kokoro-v1.0.onnx \
  --kokoro-voices ~/kokoro-models/voices-v1.0.bin \
  --force-retranslate \
  --commit-per-article
```

Expected runtime: roughly 30–45 minutes for 10 articles × 6 languages
on the F5 + Kokoro pipeline. Each article commits as it finishes, so
if the run is interrupted the rest can be re-invoked with the same
flags.

## Verify before promoting

After the run:

1. Spot-check the DoorDash article's MP3 at `blog/<slug>/audio.es.mp3`
   — should narrate the new waterfall figure.
2. `node scripts/check-audio-coverage.mjs` (warn-only; should report
   no gaps).
3. `node scripts/check-all.mjs` — must stay 114/114.

## ES body text — NOT retranslated

The ES HTML body content was hand-mirrored to match the new EN
figures (op-ed agents wrote the Spanish prose with localized strings
and Spanish-numeral data-audio-alt narrations). `translate.py` only
touches audio chunks, not HTML body — so the ES HTML quality stays at
hand-translation level. No body-text retranslation needed.
