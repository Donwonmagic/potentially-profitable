# May 2026 fact-check — audio re-translate runbook

## Why this is needed

The May 2026 fact-check round rewrote prose in 30+ articles across both
locales. The audio narration scripts (`audio.json`, `audio.es.json`,
`audio.fr.json`, `audio.it.json`, `audio.pt.json`, `audio.zh.json`) were
generated from the *pre-cleanup* prose and still carry the fabricated
operator-data claims that the HTML no longer has — "two restaurants I
manage," "Llevo dos restaurantes," "paired-restaurant operating ledgers,"
"100-restaurant DMV cohort," "$4,000 incremental margin," the NNG
`/fittss-law/` typo, the Fivestars/Como `$165–$249` band, the SEL
`-453174` article-ID hallucination, and the rest.

Until the audio is re-rendered, the narration will diverge from the
HTML — a reader who hits "Listen" will hear the old fabrications even
though the page text is clean.

## What needs re-rendering

11 EN narrations + their ES/FR/IT/PT/ZH counterparts. The full list is
the union of every article touched by the fact-check commits:

```
blog/30-days-after-leaving-doordash-restaurant-case-study/
blog/an-honest-doordash-math-for-independent-restaurants-2026/
blog/how-to-get-cited-in-google-ai-overviews-restaurant/
blog/how-to-get-more-google-reviews-for-your-restaurant/
blog/how-to-respond-to-google-reviews-restaurant-playbook-2026/
blog/how-to-set-up-google-business-profile-for-your-restaurant/
blog/instagram-as-restaurant-seo-strategy-2026/
blog/loyalty-programs-for-independent-restaurants-what-works-2026/
blog/may-2026-wave-publishing-for-citation/
blog/my-restaurant-isnt-on-google-maps-10-minute-diagnostic/
blog/restaurant-schema-markup-complete-paste-ready-example/
blog/service-charges-vs-tipping-restaurant-operator-math-2026/
blog/uber-eats-vs-doordash-vs-grubhub-restaurant-math-2026/
blog/why-your-restaurant-loses-reservations-every-night/
blog/how-to-recover-reservations-from-googles-find-a-table/
blog/wix-vs-custom-for-restaurants/
blog/toast-vs-square-vs-clover-for-restaurants/
learn/research/local-business-websites/
```

(The `learn/research/local-business-websites/` page was rewritten from
"NNG study summary" to "Muntin UX-practice note" — its narration carries
the false Nielsen/Pernice attribution and needs to re-render alongside
the blog set.)

## The command

From the repo root, on the machine that has the Kokoro model files:

```sh
node scripts/render-post-audio.mjs --all \
  --force-retranslate \
  --kokoro-model  ~/kokoro-models/kokoro-v1.0.onnx \
  --kokoro-voices ~/kokoro-models/voices-v1.0.bin
```

`--all` walks every article declared in `data/article-audio.json` and
re-renders any whose source HTML hash has changed since the last
render. `--force-retranslate` invalidates the translation cache so the
FR/IT/PT/ZH chunks pick up the cleaned ES prose-source rather than
serving stale translations.

If you'd rather re-render only the fact-check set explicitly (instead
of trusting the hash-change detection):

```sh
# 18 directories, six languages each. Quote each path on its own line
# to keep the invocation legible.
node scripts/render-post-audio.mjs \
  blog/30-days-after-leaving-doordash-restaurant-case-study \
  blog/an-honest-doordash-math-for-independent-restaurants-2026 \
  blog/how-to-get-cited-in-google-ai-overviews-restaurant \
  blog/how-to-get-more-google-reviews-for-your-restaurant \
  blog/how-to-respond-to-google-reviews-restaurant-playbook-2026 \
  blog/how-to-set-up-google-business-profile-for-your-restaurant \
  blog/instagram-as-restaurant-seo-strategy-2026 \
  blog/loyalty-programs-for-independent-restaurants-what-works-2026 \
  blog/may-2026-wave-publishing-for-citation \
  blog/my-restaurant-isnt-on-google-maps-10-minute-diagnostic \
  blog/restaurant-schema-markup-complete-paste-ready-example \
  blog/service-charges-vs-tipping-restaurant-operator-math-2026 \
  blog/uber-eats-vs-doordash-vs-grubhub-restaurant-math-2026 \
  blog/why-your-restaurant-loses-reservations-every-night \
  blog/how-to-recover-reservations-from-googles-find-a-table \
  blog/wix-vs-custom-for-restaurants \
  blog/toast-vs-square-vs-clover-for-restaurants \
  learn/research/local-business-websites \
  --force-retranslate \
  --kokoro-model  ~/kokoro-models/kokoro-v1.0.onnx \
  --kokoro-voices ~/kokoro-models/voices-v1.0.bin
```

## What to expect

- Runtime: roughly 30–45 minutes per article per language. 18 articles ×
  6 languages × ~35 minutes ≈ 60+ hours of compute total. Run it
  overnight; the orchestrator is resumable.
- The script writes both the new MP3 files and the new `audio.<lang>.json`
  chunk-timing manifests. The on-page highlight tracks the new audio.
- Translation cache: `--force-retranslate` re-hits Cloudflare Workers AI
  (or the Google Translate fallback if CF env vars are unset) for every
  chunk. Be ready for the CF token to do real work.

## Verification afterward

```sh
# Quick check: any audio.json still referencing the patterns we cut?
grep -l 'two restaurants I manage\|los dos restaurantes que manejo\|paired-restaurant\|fittss-law\|two DMV restaurants\|100-restaurant DMV cohort\|maneja dos\|Llevo dos\|administra dos\|paired-query\|90 days of paired' \
  blog/*/audio*.json learn/research/*/audio*.json 2>/dev/null
# Expected: no output. Any hit means that article's manifest didn't pick
# up the cleaned prose — re-render it explicitly with the per-directory
# invocation above.
```

```sh
# Then run the audit:
node scripts/check-audio-coverage.mjs
# Should show coverage at 100% (or whatever the declared spec demands) and
# no stale-chunk warnings.
```

## After the run

- Commit the new `audio.*.json` manifests and `audio.*.mp3` files.
  (MP3s are large but live in-tree per the architecture decision in
  `docs/audio-pipeline.md` § "Architecture (zero ongoing cost).")
- The `check-fabrications.mjs` blocklist excludes `audio.<lang>.json`
  from its scan (because the manifests regenerate from the cleaned HTML);
  but a manual grep like the one above is the right way to confirm a
  particular file has actually been re-rendered.
- No knock-on rebuild is needed for `feed-llm.json`, `llms-full.txt`, or
  `feed.xml` — those don't include audio chunks. They were rebuilt
  during the fact-check commits and already carry the cleaned prose.

## Why this isn't automated

Kokoro is local-rendered on Don's hardware. The repo does not run audio
generation in CI. Re-render lands in a single overnight window when
Don's at a machine with the model files and an unused 60+ hours of
compute time. The orchestrator is resumable, so partial runs are fine
and the next invocation continues from where the last one stopped.
