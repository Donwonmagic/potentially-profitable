# Voice reference files (F5-TTS voice cloning) + voice rubric

Two related concerns live here:

- **`don-rubric.md`** — a one-page rubric for *written* voice across
  Muntin Digital. Read this before drafting a tool hero, a glossary
  entry, or a blog post. Distilled from Don's existing flagship
  long-form. Sprint 9 (cohesion).
- **`don-reference.m4a`** + **`don-reference.txt`** — a reference
  recording for *spoken* voice cloning via F5-TTS, used by the
  audio narration pipeline below.
- **`don-reference.es.m4a`** + **`don-reference.es.txt`** — the Spanish
  counterpart. Lets F5 clone Don's voice *speaking Spanish* (paired
  with the F5-Spanish fine-tuned checkpoint) so the `/es/` course +
  library narration is Don's own voice instead of a stock TTS voice.
  The `.es.txt` transcript already exists; the `.es.m4a` recording is
  what Don needs to make (see "Recording the Spanish reference" below).

The audio side (below) is used by `--engine f5` in
`scripts/render-post-audio.mjs`. The cloned voice never leaves the
build machine — only the rendered MP3s ship to browsers.

## Files

```
don-rubric.md         written-voice rubric (Sprint 9 — cohesion)
don-reference.m4a     ~21 s recording of Don reading the script below
don-reference.txt     exact transcript (so F5-TTS can align voice
                      features to phonemes — must match the audio
                      word-for-word)
```

New recordings of the same style audio (`.wav`, `.mp3`, `.m4a`, or
`.flac`) are gitignored by default so experiments don't accidentally
commit. The canonical `don-reference.*` pair is tracked by hand when
intentionally updated.

## Reference script

> Hi, I'm Don from Muntin Digital — I'm front-of-house manager at a DMV
> restaurant and I build websites for operators across the region. Most
> restaurant sites quietly leak about a third of their mobile traffic
> before a diner even tries to book a table. This post breaks down the
> six places that leak usually happens.

## Recording the Spanish reference (`don-reference.es.m4a`)

To clone Don's voice in Spanish, F5 needs ~20–30 seconds of Don
speaking *Spanish*, with a transcript that matches the audio
word-for-word. The transcript is already written for you at
`don-reference.es.txt`:

> Hola, soy Don, de Muntin Digital. Administro dos restaurantes y diseño
> sitios web para operadores en toda la región del DMV. La mayoría de
> los sitios de restaurantes pierden casi un tercio de su tráfico móvil
> antes de que el cliente intente reservar una mesa. En este artículo te
> muestro los seis lugares donde suele ocurrir esa fuga.

How to record it:

1. **Read the script above out loud, exactly as written** — every word,
   in order. If you misspeak, restart; don't ad-lib or skip words. F5
   aligns the cloned voice to the transcript, so any drift between what
   you say and what's in `.es.txt` hurts quality.
2. **Same setup as the English clip**: quiet room, phone or laptop mic
   ~a hand's width away, no background music or TV. One clean take.
3. **Length**: ~20–30 seconds. The script runs about that at a natural
   pace. Don't rush — read the way you'd narrate a lesson.
4. **Export** as `.m4a` (or `.wav`/`.mp3`) and save it here as
   `don-reference.es.m4a`. Phone Voice Memos exports `.m4a` directly;
   AirDrop it over and rename.
5. If your Spanish pronunciation isn't fully native, that's fine and
   on-brand — the clone captures *your* voice. Just read clearly.

> Don't speak Spanish comfortably? Re-run with
> `--f5-languages en` (English only) for now, or fall back to Kokoro's
> native Spanish voice — see the parent audio runbook. But the
> Spanish-clone path needs this clip.

## One-time install (on your Mac)

```
pip install f5-tts
```

This pulls PyTorch + F5-TTS (~3 GB total). On first render the F5-TTS
model itself (~1.5 GB) downloads automatically from HuggingFace into
your local cache; subsequent runs reuse the cache.

## Render English in your voice

From the repo root:

```
node scripts/render-post-audio.mjs --all --engine f5 --languages en
```

The `--f5-ref-audio` and `--f5-ref-text` flags default to the files
in this folder, so you don't need to specify them unless you're
auditioning a different reference.

## Render Spanish in your voice (F5-Spanish)

Once `don-reference.es.m4a` exists, download the Spanish fine-tune and
render the `/es/` pages with `--f5-languages en,es`. The Spanish track
needs a checkpoint that knows the language — the base model only knows
English + Chinese:

```sh
# One-time: grab the F5-Spanish checkpoint + vocab (~1.3 GB)
python3 -c "from huggingface_hub import hf_hub_download as d; \
  print(d('jpgallegoar/F5-Spanish','model_1200000.safetensors')); \
  print(d('jpgallegoar/F5-Spanish','vocab.txt'))"
# ^ prints the two cached paths; use them as --f5-ckpt-es / --f5-vocab-es

# Render the whole course in Don's cloned voice (EN + ES), native only,
# no machine translation and no Kokoro:
node scripts/render-course-batch.mjs --run --native-only \
  --engine f5 --f5-languages en,es \
  --f5-ckpt-es  /path/to/model_1200000.safetensors \
  --f5-vocab-es /path/to/vocab.txt \
  --f5-model-name-es F5TTS_Base \
  --resume
```

`don-reference.es.m4a` / `.es.txt` are picked up automatically by the
`--f5-ref-audio-es` / `--f5-ref-text-es` defaults. Output lands at
`es/course/<slug>/audio.mp3` (native Spanish, Don's voice) and
`course/<slug>/audio.mp3` (English, Don's voice).

Runtime, per post:
  Apple Silicon (MPS):  ~2–3 min
  Intel Mac / x86 CPU:  ~6–10 min
  Colab T4 GPU:         ~6–10 min (free tier)

All 8 posts together: ~15 min on MPS, ~60 min on Intel CPU, ~45-75 min on Colab T4.

### Don't have Apple Silicon? Two options.

**Option 1 — run locally on Intel CPU.** Same `pip install f5-tts` and same render command above. PyTorch ships x86_64 wheels; it just doesn't accelerate. ~60 min in the background; the laptop stays usable for everything else while it runs.

**Option 2 — run on a free Colab GPU** (the path most operators pick). The notebook at `colab-f5-render.ipynb` next to this README does the whole flow: clones the repo, installs deps, renders, post-processes, zips, hands you a download. ~45-75 min wall-clock end-to-end, no local install. Set `Runtime → Change runtime type → T4 GPU` before running the cells.



Output per post:
```
blog/<slug>/audio.mp3    ← your cloned English narration (overwrites Kokoro's)
blog/<slug>/audio.json   ← chunk timings (voice: "f5:don-reference.m4a")
```

After the render finishes, `git add blog/*/audio.mp3 blog/*/audio.json`
and push. The runtime player picks up the new audio automatically —
no HTML edits, no cache-bust, no JS change.

## Troubleshooting

* **"f5-tts not installed"** — `pip install f5-tts` in the venv or
  interpreter `python3` points to.
* **Download fails on first run** — network access to `huggingface.co`
  is required. Corporate VPN or firewall may block; try from a
  personal connection once.
* **Render is very slow on CPU** — reduce quality by passing
  `--f5-nfe-step 16` (halves per-chunk time, slightly rougher audio).
* **Want to try a different voice** — record a new reference (see
  script above), drop it in this folder, pass
  `--f5-ref-audio scripts/voice-refs/<new>.wav
   --f5-ref-text  scripts/voice-refs/<new>.txt`.
