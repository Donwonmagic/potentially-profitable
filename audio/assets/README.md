# Production-layer audio assets (Track 1C)

Four one-time recorded assets that lift Kokoro renders from "AI demo" to
"produced editorial." All four are optional — the pipeline detects which
files exist and uses them; the rest of the chain (`scripts/audio-post-
process.mjs` ffmpeg graph) keeps working when they don't.

The asset budget is small **on purpose** — these are signatures, not
soundtracks. Each one should be a single recording session, then they
compound across every render forever.

## Files this directory should hold

| File                  | Length      | Where it goes                                | Status  |
| --------------------- | ----------- | -------------------------------------------- | ------- |
| `intro.wav`           | ~2 s        | Prepended before voice on every MP3          | TODO    |
| `chapter-sting.wav`   | ~1 s        | Replaces silence at every H2 transition      | TODO    |
| `breath.wav`          | ~0.3 s      | Replaces a slice of silence at paragraph ends | TODO    |
| `bed.wav` (optional)  | ≥120 s loop | Substitutes for the synthetic pink-noise bed | NOT NEEDED |

`bed.wav` is intentionally low priority: the existing pink-noise bed
inside `audio-post-process.mjs` already provides the "ambient warmth
under the voice" cue that the plan called for. A recorded music bed
would distract from the narration; the synthetic bed is the cleaner
choice and ships today.

## intro.wav — the brand audio signature

**Script (suggested):**

> "Muntin Digital. Operator's edition."

**Specs:**
- 44.1 kHz, 24-bit, mono WAV
- Peak around -3 dBFS (the post-process loudnorm pass will normalize)
- 200 ms of pad silence at the head
- Word "Operator's" lands roughly 600-800 ms in (so the listener has
  oriented before the brand-name lands; cold openers fail because the
  first half-second always gets dropped while the player tab is still
  focusing)
- Plate-reverb tail: ~120 ms (just enough to feel like a studio, not a
  cathedral)

**Voice options:**

1. **Don himself** — strongest brand option. Three takes, pick the cleanest.
2. **Don through F5-TTS** — use `scripts/voice-refs/don-reference.m4a`
   as the reference, run the intro script through the F5 colab notebook,
   trim to 2 s.
3. **The Kokoro voice canon** — render the intro line through
   `am_michael` (the EN default), apply the full post-process chain,
   save as `intro.wav`. Lowest effort, weakest brand signal.

Recommendation: option 1 if the recording environment is quiet; option 2
otherwise. Option 3 is the fallback for a fast first pass.

## chapter-sting.wav — the H2 transition cue

**The sting:** a single soft piano note (mid-octave, e.g. middle C or D)
with a ~600 ms decay tail. NOT a chord. NOT a stab. Think of it as a
visual paragraph break audibly expressed — restrained, neutral in
emotion, present but not announcing itself.

**Specs:**
- 44.1 kHz, 24-bit, mono WAV
- Total length ~1.0 s (note onset at ~50 ms, tail trailing into silence
  by ~950 ms)
- Peak around -12 dBFS (so the sting sits clearly UNDER the voice's
  -16 LUFS landing without becoming a transient that breaks listening
  flow)
- No reverb beyond the natural piano decay

**Source options:**
1. **Recorded** — sample any acoustic piano at middle C, ProTools / Logic
   trim + fade.
2. **Synth** — a Rhodes or felt piano patch in any modern DAW works.
3. **Royalty-free clip** — search "single piano note, mp3 royalty-free"
   on Pixabay / Freesound. The chosen sample must be CC0 or
   redistribution-licensed.

The sting replaces (does not augment) the current 1.10 s of silence at
heading transitions. When `chapter-sting.wav` exists, the pipeline
substitutes it; when absent, the silence stays.

## breath.wav — the paragraph-break humanizer

A single recorded inhale. The most powerful free quality lever in the
list — listeners hear the pause-WITH-breath as "a person reading,"
and pause-WITHOUT-breath as "a synth being read." Stewart and Glass
both swear by this trick.

**Specs:**
- 44.1 kHz, 24-bit, mono WAV
- Total length ~0.3 s (the inhale itself, not the silence around it)
- Peak around -18 dBFS (the breath sits well below the voice; if it's
  louder, it sounds melodramatic)
- Recorded with the same mic / room signature the voice clone will use
  (otherwise the breath sounds borrowed-in from a different acoustic
  space)
- ONE sample, not a library. Don rec's once, the same breath ships
  forever — listeners habituate to a recurring sample as "the narrator's
  breathing pattern."

The breath replaces a slice (not the whole) of the sentence-end gap
between two paragraphs. Implementation: render the gap as
`silence_pre + breath + silence_post` with the slice timing chosen so the
total gap duration matches the current `gapBefore` output.

## How to drop these in

1. Record / source the file at the spec above.
2. Save it at the exact path: `audio/assets/<name>.wav`.
3. Re-run the relevant pipeline step:
   - `intro.wav` → re-run `scripts/audio-post-process.mjs <post-dir>`
     on every already-processed MP3 (cheap, no Kokoro round-trip).
   - `chapter-sting.wav` and `breath.wav` → re-run the full
     `scripts/render-post-audio.mjs <post-dir>` (slow, since Kokoro
     re-synthesis is involved unless the chunks haven't changed).

The pipeline never throws when an asset is missing — it just falls back
to the current (no-asset) behavior. So this directory can ship with
zero files and the system keeps working; each asset that lands here
silently upgrades the next render.

## Versioning

When the assets change (re-recorded `intro.wav`, swapped `chapter-
sting.wav`, etc.), bump `PIPELINE_VERSION` in
`scripts/audio-post-process.mjs` and `scripts/render-post-audio.mjs` so
the cache invalidates and the next run re-processes every piece.
