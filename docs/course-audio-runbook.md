# Course audio runbook — render all 40 bootcamp lessons via Kokoro

Focused quick-start for narrating the "Open the Doors" bootcamp end to
end. The general audio pipeline lives at
[`docs/audio-pipeline.md`](./audio-pipeline.md); this doc is the
copy-paste path for the bootcamp specifically.

## What you're rendering

40 audio files — 20 lessons × 2 locales (EN + ES) — landing at
`<lesson-dir>/audio.mp3` alongside each lesson's `index.html`. The
runtime player at `/assets/js/listen.js` auto-attaches when the file
is on disk; `scripts/inject-course-listen.mjs` stamps the listen
button into the page during the next build run.

Manifest is already populated. All 40 lessons show `status: pending`
in `data/article-audio.json` (sections `course` + `es-course`):

```sh
node -e "
const m = require('./data/article-audio.json');
const c = Object.keys(m.course||{}).filter(k => !k.startsWith('_'));
const ec = Object.keys(m['es-course']||{}).filter(k => !k.startsWith('_'));
console.log('course:', c.length, 'es-course:', ec.length);
"
# → course: 20 es-course: 20
```

## One-time setup (~10 minutes + ~330 MB model download)

### 1. Python + Kokoro

```sh
# Synthesis + WAV concat helpers
pip install kokoro-onnx soundfile

# Kokoro model + voices (~330 MB total)
mkdir -p ~/kokoro-models
curl -L -o ~/kokoro-models/kokoro-v1.0.onnx \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o ~/kokoro-models/voices-v1.0.bin \
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

# ffmpeg — concatenates the per-paragraph WAVs and transcodes to MP3
brew install ffmpeg                 # macOS
# or:
sudo apt-get install ffmpeg         # Debian/Ubuntu
```

### 2. (Optional) Cloudflare Workers AI for editorial-tone translation

The bootcamp manifest only declares **two** locales (EN + ES). The ES
lesson HTML is already hand-translated — the renderer reads the
existing `/es/course/.../index.html` rather than running a fresh
translation. **You do NOT need CF AI for the bootcamp's first render.**

If you later add FR/IT/PT/ZH to the bootcamp manifest, that's when
the editorial-tone CF AI setup matters; until then skip it.

### 3. Verify the setup with a dry-run

```sh
node scripts/render-course-batch.mjs --languages en,es --engine kokoro
```

This is print-only — it lists the 40 commands that **would** run,
without rendering. If you see 40 lines of `node scripts/render-post-audio.mjs ...`,
the manifest is wired correctly. If you see "nothing pending,"
something in the manifest already shows `status: rendered` (unusual
for a clean repo).

## The render

```sh
node scripts/render-course-batch.mjs \
  --run \
  --languages en,es \
  --engine kokoro \
  --kokoro-model  ~/kokoro-models/kokoro-v1.0.onnx \
  --kokoro-voices ~/kokoro-models/voices-v1.0.bin
```

Time budget: roughly **8–14 hours on CPU**. Kokoro runs at ~2× realtime
on a modern laptop CPU; 40 lessons × ~6 min average ≈ 4 hours of audio
× 2 (CPU rate) = 8 hours minimum, plus paragraph-WAV concat overhead
and per-lesson setup. GPU acceleration via onnxruntime-gpu cuts this
to under 2 hours.

The batch script renders lessons SEQUENTIALLY — one lesson at a time,
all six (or two, with `--languages en,es`) languages per lesson before
moving to the next. A failure on lesson N logs the error but continues
with lesson N+1; the summary at the bottom tells you which ones to
re-run individually.

### Filtering for partial runs

Render one lesson while iterating:

```sh
node scripts/render-course-batch.mjs \
  --run --slug m1-orient/welcome --languages en,es --engine kokoro \
  --kokoro-model  ~/kokoro-models/kokoro-v1.0.onnx \
  --kokoro-voices ~/kokoro-models/voices-v1.0.bin
```

Render one locale at a time (EN first, ES later):

```sh
# English only — about 4-7 hours of CPU time
node scripts/render-course-batch.mjs \
  --run --locale en --languages en --engine kokoro \
  --kokoro-model ... --kokoro-voices ...

# Spanish only — about 4-7 hours of CPU time
node scripts/render-course-batch.mjs \
  --run --locale es --languages es --engine kokoro \
  --kokoro-model ... --kokoro-voices ...
```

### Picking voices

Defaults (from `scripts/render-post-audio.mjs`'s `LANG_VOICE` table):

- English → `am_michael` (American male, warm)
- Spanish → `em_alex` (Spanish male, neutral)

Override per language with a flag:

```sh
node scripts/render-course-batch.mjs --run ... \
  --kokoro-voice am_eric              # EN
  --kokoro-voice-es ef_dora           # ES
```

The kokoro-onnx voice list is at the
[upstream releases page](https://github.com/thewh1teagle/kokoro-onnx/releases).
Voices follow `<lang_letter><gender>_<name>` — `am_michael` is
American-male-Michael; `ef_dora` is European-Spanish-female-Dora.

## After the render

### 1. Stamp the listen button into every lesson

```sh
node scripts/inject-course-listen.mjs
```

The script walks `data/course-lessons.json`, looks for `audio.mp3` next
to each lesson, and inserts a `<button id="listen-btn">` (and the
`listen.js` script tag) into pages that have audio. Lessons without
audio are silently skipped. It's idempotent — running it twice does
nothing if state is current.

The matching `--check` mode is wired into `scripts/check-all.mjs`, so
CI catches any lesson that has audio on disk but hasn't been stamped.

### 2. Audit coverage

```sh
node scripts/check-audio-coverage.mjs --section course
```

Flags:
- **MISSING** — lesson declared in the manifest but no `audio.mp3` on disk
- **STALE** — lesson HTML changed since the audio was rendered (the
  `contentHash` in `audio.json` won't match the new HTML)
- **NO-HASH** — soft warning for older audio rendered before
  `contentHash` was wired in

### 3. Commit + push the rendered files

Audio files are ~5-8 MB each at the Kokoro default bitrate. 40 lessons
≈ 200-300 MB of MP3s + chunk-timing JSONs. Git LFS isn't configured for
this repo — the MP3s commit directly. If size becomes a concern, the
audio files can move to R2 (Cloudflare's S3-compat) and the lesson
pages can rewrite their src; that's a separate infra task.

```sh
git add -A
git commit -m "audio: render bootcamp lessons via Kokoro (EN + ES)"
git push origin <current-branch>
```

## Troubleshooting

### "kokoro-onnx: ModuleNotFoundError"

The Python from `pip` doesn't match the `python3` the renderer
invokes. Check:

```sh
which python3
python3 -m pip show kokoro-onnx
```

If they disagree, install via the matching Python:

```sh
python3 -m pip install kokoro-onnx soundfile
```

### "ffmpeg: command not found"

ffmpeg isn't on `$PATH`. macOS Homebrew installs to `/opt/homebrew/bin`;
make sure that's in your shell's PATH. On Apple Silicon, the renderer
uses `ffmpeg` from PATH directly with no fallback.

### "No paragraphs found in <lesson>/index.html"

The renderer looks for `<article id="post-body">`. Every course
lesson stamps this id on its `<article class="course-body">` tag (the
scaffolder `scripts/new-course-lesson.mjs` bakes it in; existing
lessons were bulk-stamped). If a lesson is missing it, run:

```sh
grep -L '<article class="course-body" id="post-body">' course/ es/course/ -r --include='*.html'
```

(That returns paths that DON'T match — those are the broken ones.)

### "Kokoro is slow"

CPU is the expected path. For GPU on Linux + NVIDIA:

```sh
pip install onnxruntime-gpu kokoro-onnx
```

The `kokoro-onnx` library auto-detects CUDA when `onnxruntime-gpu` is
installed. Apple Silicon goes through CoreML automatically if
`onnxruntime` was built with CoreML support (the default wheel for
macOS arm64 does this).

### "I want F5-TTS voice clone for English"

Different render path — see `docs/audio-pipeline.md`. F5 needs a
3-minute voice reference WAV at `scripts/voice-refs/<voice-name>.wav`.
The default engine in `render-course-batch.mjs` is `f5` for that
reason; pass `--engine kokoro` (as this runbook does) to skip F5
and use Kokoro for everything.

## What ships when the audio lands

Each lesson page picks up:

1. A `<button id="listen-btn">Listen to this lesson</button>` near the
   top of the article body
2. The `assets/js/listen.js` runtime player (the same one the blog
   articles use), which upgrades the button into the rich
   `.listen-card` UI with play/pause/15s-skip/speed/voice controls
3. Paragraph-by-paragraph highlight as the audio plays (driven by
   the `audio.json` chunk-timing manifest)
4. Cross-paragraph scroll-sync so the visible viewport tracks the
   narration

All of this happens automatically once the MP3 + JSON files are on
disk and `inject-course-listen.mjs` has run. No lesson-page edits
needed beyond the stamp.
