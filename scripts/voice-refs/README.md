# Voice reference files (local-only)

F5-TTS voice cloning reads one reference audio file here + a matching
transcript, and renders all English MP3s in that voice.

## Files (gitignored — never committed)

```
don-reference.wav     ~20 s recording of Don reading the script below
don-reference.txt     the exact transcript (so F5-TTS can align
                      voice features to phonemes)
```

## Script

> Hi, I'm Don from Muntin Digital — I manage two restaurants and build
> websites for operators across the DMV. Most restaurant sites quietly
> leak about a third of their mobile traffic before a diner even tries
> to book a table. This post breaks down the six places that leak
> usually happens.

## Re-render with the cloned voice

```
node scripts/render-post-audio.mjs --all \
  --engine f5 \
  --f5-ref-audio scripts/voice-refs/don-reference.wav \
  --f5-ref-text  scripts/voice-refs/don-reference.txt \
  --languages en
```

(F5-TTS engine integration lands in a follow-up commit.)
