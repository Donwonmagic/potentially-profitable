# Voice reference files (F5-TTS voice cloning) + voice rubric

Two related concerns live here:

- **`don-rubric.md`** — a one-page rubric for *written* voice across
  Muntin Digital. Read this before drafting a tool hero, a glossary
  entry, or a blog post. Distilled from Don's existing flagship
  long-form. Sprint 9 (cohesion).
- **`don-reference.m4a`** + **`don-reference.txt`** — a reference
  recording for *spoken* voice cloning via F5-TTS, used by the
  audio narration pipeline below.

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

> Hi, I'm Don from Muntin Digital — I manage two restaurants and build
> websites for operators across the DMV. Most restaurant sites quietly
> leak about a third of their mobile traffic before a diner even tries
> to book a table. This post breaks down the six places that leak
> usually happens.

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

Runtime, per post:
  Apple Silicon (MPS):  ~2–3 min
  Plain CPU:            ~6–10 min

All 8 posts together: ~15 min on MPS, ~60 min on CPU.

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
