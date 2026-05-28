#!/usr/bin/env python3
"""
F5-TTS voice-cloned synthesis helper. Called by
scripts/render-post-audio.mjs when the render script is in
--engine f5 mode.

Why a separate process
----------------------
F5-TTS loads a ~1.5 GB model + vocoder on startup (~30 s on CPU,
~10 s on Apple Silicon MPS). Spawning it once per chunk would be
ruinously slow. Instead we load once, consume the whole chunk list
from stdin as JSON, and write one WAV per chunk id.

Unlike Kokoro (fixed voice catalog), F5-TTS clones a voice from a
reference recording at synthesis time — so every call needs a
(reference audio, reference transcript) pair. Those are passed as
CLI args rather than per-chunk because they're constant across a
whole post.

Protocol
--------
Stdin JSON:
  { "chunks": [{"id": 0, "text": "..."}, ...] }

CLI args:
  --ref-audio    path/to/ref.wav|.mp3|.m4a   (the voice to clone)
  --ref-text     path/to/ref.txt             (exact transcript of ref audio)
  --output-dir   path/to/wavs/               (output directory)
  --speed        1.0                          (speaking speed multiplier)
  --nfe-step     32                           (quality vs. speed; 32 default)
  --device       cpu|cuda|mps|auto            (auto-detect by default)
  --ckpt-file    path/to/model.safetensors    (optional fine-tuned weights,
                                               e.g. the F5-Spanish checkpoint)
  --vocab-file   path/to/vocab.txt            (vocab that pairs with --ckpt-file)
  --model-name   F5TTS_Base|F5TTS_v1_Base     (architecture for the checkpoint;
                                               F5-Spanish needs F5TTS_Base)

Multilingual note
-----------------
The bundled F5-TTS model only really knows English + Chinese. To clone
a voice in another language (e.g. Don narrating Spanish) you point
--ckpt-file / --vocab-file at a language fine-tune such as
jpgallegoar/F5-Spanish (architecture: F5TTS_Base) and supply a
reference clip of the speaker talking in that language.

Output:
  <output-dir>/c0000.wav, c0001.wav, ...  (one per chunk id)

Stderr: progress per chunk ("<id> <duration_audio> <wall_clock>").
Stdout: final JSON summary. Non-zero exit on any failure.

First-run note
--------------
On first use F5-TTS downloads the model from HuggingFace (~1.5 GB).
Subsequent runs read from the local cache. Requires ~8 GB RAM on
CPU, or ~6 GB on Apple Silicon MPS.
"""
import argparse
import json
import os
import sys
import time

from f5_tts.api import F5TTS


def resolve_ref_text(ref_text_arg: str) -> str:
    """Accept either an inline string or a path to a .txt file."""
    if os.path.isfile(ref_text_arg):
        with open(ref_text_arg, "r", encoding="utf-8") as f:
            return f.read().strip()
    return ref_text_arg.strip()


def build_tts(args):
    """Construct F5TTS, tolerating API drift across f5-tts versions.

    Newer releases take the architecture as `model=`, older ones as
    `model_type=`. We only pass a model name when the caller supplied
    one (a fine-tune like F5-Spanish needs F5TTS_Base); otherwise we
    let F5TTS pick its bundled default. ckpt_file / vocab_file are
    passed through whenever provided.
    """
    import inspect

    base = {"device": args.device}
    if args.ckpt_file:
        base["ckpt_file"] = args.ckpt_file
    if args.vocab_file:
        base["vocab_file"] = args.vocab_file

    sig = None
    try:
        sig = set(inspect.signature(F5TTS.__init__).parameters.keys())
    except (TypeError, ValueError):
        sig = None

    if args.model_name:
        # Pick whichever model-name kwarg this version exposes.
        if sig is None or "model" in sig:
            base["model"] = args.model_name
        elif "model_type" in sig:
            base["model_type"] = args.model_name

    # Drop any kwargs this version doesn't accept so we fail loud only
    # on genuine errors, not on a renamed parameter.
    if sig is not None:
        base = {k: v for k, v in base.items() if k in sig}

    return F5TTS(**base)


def main() -> int:
    p = argparse.ArgumentParser(description="F5-TTS voice-cloned synthesis")
    p.add_argument("--ref-audio",  required=True,
                   help="Path to the reference audio (wav/mp3/m4a)")
    p.add_argument("--ref-text",   required=True,
                   help="Either the transcript string or a path to a .txt file")
    p.add_argument("--output-dir", required=True, help="WAVs are written here")
    p.add_argument("--speed",      type=float, default=1.0,
                   help="Speaking speed multiplier (1.0 = natural)")
    p.add_argument("--nfe-step",   type=int,   default=32,
                   help="Sampling steps; lower = faster, higher = cleaner")
    p.add_argument("--cfg-strength", type=float, default=2.0,
                   help="Classifier-free-guidance strength; higher keeps "
                        "output closer to gen_text and reduces reference bleed")
    p.add_argument("--device",     default=None,
                   help="cpu|cuda|mps|auto (default: auto-detect)")
    p.add_argument("--ckpt-file",  default="",
                   help="Optional fine-tuned checkpoint (.safetensors/.pt)")
    p.add_argument("--vocab-file", default="",
                   help="Vocab file that pairs with --ckpt-file")
    p.add_argument("--model-name", default="",
                   help="Architecture name for the checkpoint "
                        "(e.g. F5TTS_Base for the F5-Spanish fine-tune)")
    args = p.parse_args()

    if args.ckpt_file and not os.path.isfile(args.ckpt_file):
        print(json.dumps({"ok": False, "error": f"ckpt file not found: {args.ckpt_file}"}))
        return 1
    if args.vocab_file and not os.path.isfile(args.vocab_file):
        print(json.dumps({"ok": False, "error": f"vocab file not found: {args.vocab_file}"}))
        return 1

    if not os.path.isfile(args.ref_audio):
        print(json.dumps({"ok": False, "error": f"ref audio not found: {args.ref_audio}"}))
        return 1

    ref_text = resolve_ref_text(args.ref_text)
    if not ref_text:
        print(json.dumps({"ok": False, "error": "ref text is empty"}))
        return 1

    data = json.load(sys.stdin)
    chunks = data.get("chunks") or []
    if not chunks:
        print(json.dumps({"ok": False, "error": "no chunks"}))
        return 1

    os.makedirs(args.output_dir, exist_ok=True)

    t_load = time.time()
    tts = build_tts(args)
    print(f"# loaded F5-TTS in {time.time()-t_load:.1f}s", file=sys.stderr)

    total_audio = 0.0
    total_wall  = 0.0
    for c in chunks:
        cid  = int(c["id"])
        text = (c.get("text") or "").strip()
        if not text:
            continue
        out = os.path.join(args.output_dir, f"c{cid:04d}.wav")
        t0 = time.time()
        # infer returns (wav_np, sample_rate, spec) and writes file_wave too
        wav, sr, _ = tts.infer(
            ref_file=args.ref_audio,
            ref_text=ref_text,
            gen_text=text,
            speed=args.speed,
            nfe_step=args.nfe_step,
            cfg_strength=args.cfg_strength,
            file_wave=out,
            remove_silence=False,
            # Quiet the per-call progress bars so our own stderr lines stay clean.
            show_info=lambda *a, **k: None,
            progress=None,
        )
        dt = time.time() - t0
        dur = len(wav) / sr if sr else 0.0
        total_audio += dur
        total_wall  += dt
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
