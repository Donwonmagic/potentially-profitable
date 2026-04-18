#!/usr/bin/env python3
"""
Kokoro synthesis helper, called by scripts/render-post-audio.mjs when
the render script is in --engine kokoro mode.

Why a separate process
----------------------
Kokoro loads a ~310 MB ONNX model on startup. Spawning it once per
chunk would be ruinously slow. Instead we load the model once, consume
the whole chunk list from stdin as JSON, and write one WAV file per
chunk to --output-dir. The Node parent treats this as a black box that
turns text into WAVs.

Protocol
--------
Stdin:
  {"chunks": [
    {"id": 0, "text": "..."},
    {"id": 1, "text": "..."},
    ...
  ]}

Output:
  <output-dir>/c0000.wav, c0001.wav, ...   (one per chunk id)

Stderr: one progress line per chunk ("<id> <duration>") so the parent
can show a progress counter.

Stdout: final JSON with {"ok": true, "count": N} on success. Any
exception exits non-zero and bubbles up.
"""
import argparse
import json
import os
import sys
import time

from kokoro_onnx import Kokoro
import soundfile as sf


def main() -> int:
    p = argparse.ArgumentParser(description="Batch Kokoro TTS synthesis")
    p.add_argument("--model",      required=True, help="Path to kokoro ONNX model")
    p.add_argument("--voices",     required=True, help="Path to voices.bin")
    p.add_argument("--voice",      default="am_michael",
                   help="Voice ID (e.g. am_michael, am_fenrir, bm_daniel)")
    p.add_argument("--speed",      type=float, default=1.0,
                   help="Speaking speed multiplier (1.0 = natural)")
    p.add_argument("--lang",       default="en-us",
                   help="Language tag for phonemizer")
    p.add_argument("--output-dir", required=True, help="WAVs are written here")
    args = p.parse_args()

    data = json.load(sys.stdin)
    chunks = data.get("chunks") or []
    if not chunks:
        print(json.dumps({"ok": False, "error": "no chunks"}))
        return 1

    os.makedirs(args.output_dir, exist_ok=True)

    t_load = time.time()
    k = Kokoro(args.model, args.voices)
    print(f"# loaded in {time.time()-t_load:.1f}s", file=sys.stderr)

    total_audio = 0.0
    total_wall  = 0.0
    for c in chunks:
        cid  = int(c["id"])
        text = (c.get("text") or "").strip()
        if not text:
            continue
        t0 = time.time()
        samples, rate = k.create(text, voice=args.voice, speed=args.speed, lang=args.lang)
        dt = time.time() - t0
        dur = len(samples) / rate
        total_audio += dur
        total_wall  += dt
        out = os.path.join(args.output_dir, f"c{cid:04d}.wav")
        sf.write(out, samples, rate)
        # One compact progress line per chunk — parent can parse or ignore
        print(f"{cid} {dur:.3f} {dt:.3f}", file=sys.stderr, flush=True)

    print(json.dumps({
        "ok": True,
        "count": len(chunks),
        "audio_seconds": round(total_audio, 2),
        "wall_seconds":  round(total_wall, 2),
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
