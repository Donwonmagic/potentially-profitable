# Audio pipeline — operator runbook

Studio-tier multilingual audio for every long-form piece in the
library. One curated voice per language, contextually aware
translations, native-feel pronunciation, all rendered locally with
free open-source tools.

## What "studio standard" means here

Each declared piece in `data/article-audio.json` ships:

- `audio.mp3` — primary-language narration
- `audio.es.mp3`, `audio.fr.mp3`, `audio.it.mp3`, `audio.pt.mp3`, `audio.zh.mp3` — translated narrations
- `audio.json` + `audio.<lang>.json` — chunk-timing manifests so the
  on-page highlight tracks the audio paragraph by paragraph
- `translations.<lang>.json` — UI string overrides (Listen button,
  share row, figure labels) so the player chrome localizes when a
  reader switches language mid-listen

All six languages use a single curated voice per language so brand
recognition compounds as readers move between articles. The voices
live in `scripts/render-post-audio.mjs`'s `LANG_VOICE` table — Don
overrides any of them with the matching `--kokoro-voice-<lang>` flag
when a better voice ships.

## Architecture (zero ongoing cost)

```
   data/article-audio.json      ← coverage manifest (declared spec)
   data/audio-pronunciation.json← phonetic overrides (proper nouns,
                                  acronyms, neighborhood names)

         │
         ▼
   ┌──────────────────────────────┐
   │ scripts/check-audio-coverage │ ← warn-only audit, wired into
   │   .mjs                       │   scripts/check-all.mjs
   └──────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────┐
   │ scripts/render-post-audio    │ ← orchestrator
   │   .mjs                       │
   └──────────────────────────────┘
         │
         ├───► scripts/lib/translate.py
         │       │
         │       ├── PRIMARY: Cloudflare Workers AI (Llama 3.3 70B)
         │       │   With editorial-tone prompt locking Don's voice.
         │       │   Free tier on the existing CF account.
         │       │
         │       └── FALLBACK: Google Translate unauthenticated endpoint
         │           Used when CF env vars unset OR CF call fails.
         │           Solid mechanical translation with glossary lock.
         │
         ├───► applyPronunciation()    ← per-locale phonetic overrides
         │     (in render-post-audio.mjs)  applied to chunk text
         │                                 BEFORE Kokoro sees it; the
         │                                 audio.<lang>.json keeps
         │                                 canonical text for highlight
         │                                 sync
         │
         └───► scripts/lib/kokoro_render.py  (open-source Kokoro
                                              82M TTS, runs locally
                                              on CPU at ~2× realtime)

         ▼
   <article>/audio.mp3 + audio.<lang>.mp3 + manifests
```

Cost: **$0/mo recurring.** Kokoro runs locally. Cloudflare Workers
AI free tier is included with the existing CF account. Google
Translate fallback is a free public endpoint.

## First-time setup (once per machine)

### 1. Python + Kokoro

```sh
# Python deps for synthesis + translation helpers
pip install kokoro-onnx soundfile

# Kokoro model + voices (~330 MB, one-time)
mkdir -p ~/kokoro-models
curl -L -o ~/kokoro-models/kokoro-v1.0.onnx \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o ~/kokoro-models/voices-v1.0.bin \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

# ffmpeg (WAV concat + MP3 transcode)
brew install ffmpeg          # macOS
# or: apt-get install ffmpeg # Debian/Ubuntu
```

### 2. Cloudflare Workers AI (the editorial-tone translator)

This is the difference between "Google Translate Spanish" and
translations that actually feel like Don's voice in another
language. Free tier on the existing Cloudflare account.

1. **Enable Workers AI** in the Cloudflare dashboard:
   - Log in to https://dash.cloudflare.com
   - Sidebar → AI → Workers AI → Enable (one click; no credit card).
2. **Create an API token**:
   - My Profile (top-right) → API Tokens → Create Token.
   - Use template "Custom token" with these permissions:
     - **Account → Workers AI → Read**
       (Cloudflare calls model-invocation permission "Read"; this
       is what lets the renderer call Llama 3.3.)
   - Account Resources: Include → your specific account.
   - TTL: 1 year is reasonable for build credentials.
   - Copy the token — Cloudflare shows it once.
3. **Find your account ID** — top-right of the dashboard, or in
   any URL after `/accounts/`. 32 hex chars.
4. **Set the env vars** before invoking the renderer:
   ```sh
   export CF_ACCOUNT_ID="<your-32-char-account-id>"
   export CF_AI_TOKEN="<your-api-token>"
   # Optional model override (default: llama-3.3-70b-instruct-fp8-fast):
   # export CF_AI_MODEL="@cf/meta/llama-3.3-70b-instruct-fp8-fast"
   ```
   Add these to your shell profile (`~/.zshrc` / `~/.bashrc`)
   or to a `.env.local` file you `source` before running the
   renderer. Do NOT commit them.

### 3. Verify the LLM is reachable

```sh
node scripts/render-post-audio.mjs \
  blog/wix-vs-custom-for-restaurants \
  --languages fr \
  --kokoro-model  ~/kokoro-models/kokoro-v1.0.onnx \
  --kokoro-voices ~/kokoro-models/voices-v1.0.bin \
  --force-retranslate \
  --dry-run
```

The renderer will print one of:
- `Translation backend: Cloudflare Workers AI (editorial-tone prompt active)` — you're good.
- `CF_ACCOUNT_ID/CF_AI_TOKEN not set — using Google Translate fallback` — env vars not picked up.
- `CF Workers AI failed (...); falling back to Google Translate` — token / permission issue.

Without CF AI, translations will go through Google Translate and
**lose the editorial register** — accurate but generic. The
runbook will warn you on every run; the audit's `ENGLISH-IN-FOREIGN`
heuristic won't catch tone drift, so it's worth getting CF AI
configured before the bulk render.

(F5-TTS for the voice clone of Don's English voice is optional —
shipped at `scripts/voice-refs/`. See the F5 section below.)

## The render command

```sh
node scripts/render-post-audio.mjs \
  --manifest data/article-audio.json \
  --languages en,es,fr,it,pt,zh \
  --kokoro-model  ~/kokoro-models/kokoro-v1.0.onnx \
  --kokoro-voices ~/kokoro-models/voices-v1.0.bin
```

Reads the manifest, walks each declared piece, and renders any
language whose audio is missing or stale. Skips up-to-date editions
automatically (hash-keyed cache). Pass `--force-retranslate` to
re-run the translation step (required for the FR/IT/PT/ZH tracks
that currently contain English text — see "Migrating the existing
audio" below).

For one piece only:

```sh
node scripts/render-post-audio.mjs \
  blog/an-honest-doordash-math-for-independent-restaurants-2026 \
  --languages en,es,fr,it,pt,zh \
  --kokoro-model ... --kokoro-voices ...
```

## The audit

```sh
node scripts/check-audio-coverage.mjs
```

Reports:

- **MISSING** — declared `(slug × lang)` has no MP3 + JSON on disk.
- **STALE** — article prose changed since the audio was rendered
  (`contentHash` mismatch).
- **ENGLISH-IN-FOREIGN** — non-English manifests whose chunk text
  is still in English (the symptom of an old `--use-existing-translations`
  run against a stale manifest).
- **NO-HASH** — soft warning for audio rendered before the
  `contentHash` field was wired in. Re-render to bake it in.

The audit is wired into `scripts/check-all.mjs` as warn-only during
the rollout. Once the renderer has run a clean pass and the audit
returns 0 issues, flip the entry from `--warn` to `--check` to
make it a hard gate.

`--pending` mode lists every slug that needs a render — useful as
input to a batched render command.

## Production-layer assets (`audio/assets/`)

Four optional one-time recordings that lift Kokoro renders from
"AI demo" to "produced editorial." Auto-detected: when the file exists
at `audio/assets/<name>.wav`, the pipeline uses it; when absent, the
chain runs unchanged.

| Asset                | Used by                       | Effect                                       |
| -------------------- | ----------------------------- | -------------------------------------------- |
| `intro.wav`          | `audio-post-process.mjs`      | Prepended ahead of voice on every MP3        |
| `chapter-sting.wav`  | `render-post-audio.mjs`       | Plays at every H2 transition (in place of silence) |
| `breath.wav`         | `render-post-audio.mjs`       | Plays in the middle of every paragraph-end gap |
| `bed.wav` (optional) | (not currently wired)         | Would replace synthetic pink-noise bed        |

`audio/assets/README.md` has the full per-asset recording spec.

Disable per-run flags:
- `audio-post-process.mjs --no-intro` skips the intro splice.
- `render-post-audio.mjs` has no per-asset disable — to skip the sting
  or breath, remove the file under `audio/assets/` and re-render.

When any asset is added, removed, or replaced, bump `PIPELINE_VERSION`
in the consuming script so cached output re-renders.

## Voices (current canon)

| lang | voice id    | gender | timbre                              |
|------|-------------|--------|-------------------------------------|
| en   | (varies — F5 clone of Don when available; else `am_michael`) | M | Warm, conversational |
| es   | `em_alex`   | M      | Neutral Spanish, conversational      |
| fr   | `ff_siwis`  | F      | Soft French                          |
| it   | `im_nicola` | M      | Italian, measured                    |
| pt   | `pm_alex`   | M      | Brazilian, paced                     |
| zh   | `zm_yunxi`  | M      | Mandarin, narrative                  |

Listen to alternates and override on the command line:

```sh
--kokoro-voice-fr fm_henri    # swap French voice
--kokoro-voice-en am_eric     # swap English voice (Kokoro mode)
```

Once a voice change ships, re-render the affected language for the
whole library — that's why `LANG_VOICE` is the single source of
truth, not a per-article setting.

## Pronunciation overrides

`data/audio-pronunciation.json` holds per-locale phonetic overrides
for Kokoro. Add entries when you hear a term mispronounced:

```json
{
  "en": {
    "Polyface Farm": { "say-as": "POH-lee-face Farm" }
  }
}
```

Three formats supported:

- `say-as` — phonetic respelling Kokoro's English voice will read
  correctly. Easiest path; works for most cases.
- `ipa` — strict IPA notation. Use when respelling doesn't carry.
- `spell` — read letter-by-letter. Best for acronyms (`GBP`, `POS`).

Re-render the affected language after editing the dictionary; the
pronunciation step happens during synthesis, not extraction.

## Translation tone

The translator (`scripts/lib/translate.py`) preserves Don's
editorial register by:

- **Glossary lock** — brand names, restaurant industry terms,
  proper nouns, and acronyms are substituted with placeholder
  tokens before the translator sees them, restored after. List
  lives in `scripts/lib/translate.py` `GLOSSARY = [...]` — extend
  it as new terms come up in articles.
- **Document-context batching** — chunks are concatenated (up to
  ~4000 chars) so the translator sees surrounding narrative
  before deciding tone. Sentence-level isolation gets fired off
  to a separator-split.
- **Hand-translated ES override** — for blog posts that have a
  hand-written Spanish mirror at `/es/blog/<slug>/`, pass
  `--use-existing-translations` so the renderer pulls Spanish
  prose from the existing `audio.es.json` (or, in the new
  workflow, directly from the ES article HTML) rather than
  round-tripping English through machine translation. Don's
  authored Spanish always wins.

## Migrating the existing audio

The 19 EN blog articles that currently ship audio were rendered with
Kokoro's foreign voices but **English chunk text** for FR/IT/PT/ZH.
That's not real native narration. To fix in-place:

```sh
# Re-render only the languages whose chunks are stale-English
node scripts/render-post-audio.mjs --all \
  --languages fr,it,pt,zh \
  --force-retranslate \
  --kokoro-model  ~/kokoro-models/kokoro-v1.0.onnx \
  --kokoro-voices ~/kokoro-models/voices-v1.0.bin
```

Estimated runtime on an M-series Mac or a recent Linux laptop:
~30-45 minutes per article × 19 articles × 4 languages, running
unattended overnight.

After the run, the audit should report the FR/IT/PT/ZH manifests as
no longer English-in-foreign. ES and EN remain as-is (already correct).

## New-article workflow

When Don publishes a new article:

1. Add an entry to `data/article-audio.json` under the right
   section (`blog`, `es-blog`, `research`, `checklists`):

   ```json
   "new-slug": { "languages": ["en","es","fr","it","pt","zh"], "status": "pending" }
   ```

2. Run the listen-btn injector (idempotent — adds the markup if
   missing, leaves it alone otherwise):

   ```sh
   node scripts/inject-listen-btn.mjs
   ```

3. Render the audio:

   ```sh
   node scripts/render-post-audio.mjs <path-to-article-dir> \
     --languages en,es,fr,it,pt,zh \
     --kokoro-model ... --kokoro-voices ...
   ```

4. Re-run the listen-btn injector — it now adds `data-audio-src="audio.mp3"`
   to the button automatically once the MP3 exists, upgrading the
   page from speech-tier (Web Speech API fallback) to studio-tier.

5. Update the manifest entry: `"status": "rendered"`.

6. `node scripts/check-audio-coverage.mjs` → expect 0 issues.

## F5-TTS voice clone (optional, English only)

For the strongest brand-voice match, English narration uses F5-TTS
to clone Don's actual reading voice from a 30-min reference. Setup:

```sh
pip install f5-tts
# Reference assets already shipped at:
#   scripts/voice-refs/don-reference.m4a
#   scripts/voice-refs/don-reference.txt
```

Render with the F5 engine:

```sh
node scripts/render-post-audio.mjs --all --engine f5 --languages en \
  --kokoro-model ... --kokoro-voices ...
```

F5 is English-only by design (multilingual cloning quality lags
Kokoro's per-language native voices). For a multilingual run that
uses F5 for English and Kokoro for the rest:

```sh
node scripts/render-post-audio.mjs --all --engine f5 \
  --languages en,es,fr,it,pt,zh \
  --kokoro-model ... --kokoro-voices ...
```

## Speech-tier fallback

Pages with `id="listen-btn"` but no `audio.mp3` on disk get the
**Web Speech API** at runtime — listen.js detects the missing
`data-audio-src` and uses the browser's built-in TTS. Quality varies
(macOS Safari has the best default voices; Chrome on Linux is the
weakest). The fallback is a temporary state — every piece in
`data/article-audio.json` should reach studio-tier.

The listen-btn injector flips between the two states automatically:
it sets `data-audio-src="audio.mp3"` when audio.mp3 exists in the
article directory, omits it otherwise. So the moment Don renders a
piece's audio, the next run of `inject-listen-btn.mjs` upgrades the
button silently — no manual page edit required.

## What's NOT in scope

- **Topic landing pages** (`/learn/topics/<slug>/`) — nav hubs.
  Audio narration of "here are the articles in this topic" doesn't
  serve the listener.
- **Glossary entries** (`/glossary/<slug>/`) — definitional pages.
  The per-term inline popover already reads the definition; no
  value in standalone audio editions.
- **Tools** (`/tools/<slug>/`) — interactive worksheets. Audio
  narration would describe a UI the listener should be touching.
- **Operator sheets** (`/sheets/<slug>/`) — same logic as tools.

## File layout reference

```
data/
  article-audio.json              ← coverage manifest
  audio-pronunciation.json        ← phonetic overrides

scripts/
  check-audio-coverage.mjs        ← audit (warn-only via check-all.mjs)
  inject-listen-btn.mjs           ← stamps the listen-btn markup
  render-post-audio.mjs           ← synthesis orchestrator
  lib/
    translate.py                  ← EN → target lang
    kokoro_render.py              ← Kokoro synthesis helper
    f5_render.py                  ← F5-TTS voice-clone helper

  voice-refs/
    don-reference.m4a             ← Don's voice sample (F5 input)
    don-reference.txt             ← matching transcript
    README.md                     ← how to record a new reference

<each article directory>/
  index.html
  audio.mp3                       ← primary-language narration
  audio.es.mp3                    ← Spanish translation
  audio.fr.mp3
  audio.it.mp3
  audio.pt.mp3
  audio.zh.mp3
  audio.json                      ← chunk timings (primary lang)
  audio.es.json                   ← chunk timings (Spanish prose)
  audio.fr.json
  audio.it.json
  audio.pt.json
  audio.zh.json
  translations.es.json            ← UI string overrides
  translations.fr.json
  translations.it.json
  translations.pt.json
  translations.zh.json
```

## Promoting the audit to fail-CI

Once the migration's done and `node scripts/check-audio-coverage.mjs`
returns 0 issues:

1. Edit `scripts/check-all.mjs`:
   ```diff
   - ['Audio coverage (warn)', 'check-audio-coverage.mjs', '--warn'],
   + ['Audio coverage',        'check-audio-coverage.mjs', '--check'],
   ```

2. From that point on, any new article whose manifest entry isn't
   followed by a render breaks CI — the same gate that catches
   missing OG cards or stale glossary stamps now catches missing
   audio.

That's the goal: studio-standard audio, in every language, on every
written piece, with the gate that keeps it from regressing.
