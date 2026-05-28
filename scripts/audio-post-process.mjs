#!/usr/bin/env node
/**
 * Audio post-processing pipeline ("Layer 1, maximized") — applied to
 * Kokoro-rendered MP3s to lift them from raw-TTS to produced-editorial.
 *
 * Why this exists
 * ---------------
 * The reader's "sounds artificial" complaint about TTS is, in large
 * part, a PRODUCTION problem, not a voice-model problem. Kokoro's
 * synthesized audio is flat (-24 LUFS, 2.9 LU range), tonally cool
 * (digital-glassy 3-5 kHz peak), and sits in a vacuum (no room cue).
 * A short ffmpeg chain closes most of the gap at $0 marginal cost —
 * which matters as the article and course libraries grow and any
 * commercial-TTS swap would compound per-render.
 *
 * The chain (in order)
 * --------------------
 *   1. equalizer — gentle 200 Hz bump (+1.5 dB) for chest warmth,
 *      gentle 3.5 kHz dip (-2 dB) to take the digital glassiness off
 *      Kokoro's worst frequency band.
 *   2. deesser — light sibilance control; Kokoro's "s" / "sh" peaks
 *      are the most "AI demo" tell after the loudness floor.
 *   3. acompressor — VERY light. Kokoro output is already 2.9 LU LRA
 *      (radio-narrow) so heavy compression would suck dynamics out
 *      of an already-flat signal. Threshold high, ratio low — just
 *      enough glue.
 *   4. aecho — a single 80 ms tap at -22 dB (decay 0.08) for a
 *      subtle "voice in a small studio" cue. NOTE on syntax: ffmpeg's
 *      `aecho` parameter order is `in_gain : out_gain : delays :
 *      decays`. `out_gain` is a master scalar on the SUMMED signal
 *      (dry + echo), NOT a wet-only mix. The mix happens via
 *      `decays`. Earlier versions of this script used out_gain=0.08
 *      and lost 22 dB of the dry signal — the audit caught it.
 *      Now: in_gain=1, out_gain=1, decays=0.08.
 *   5. loudnorm — EBU R128 to -16 LUFS / TP -1.5 dBFS / LRA 11. This
 *      is the podcast-industry default; output sits at the same
 *      perceived loudness as The Daily, NYT Audio, etc., so a listener
 *      switching to or from another show doesn't hit a volume cliff.
 *      Applied in TWO PASSES: first pass measures input_I / input_LRA
 *      / input_TP / input_thresh / target_offset; second pass feeds
 *      those back as measured_* values with linear=true so the gain
 *      is constant across the file, not dynamically pumping a signal
 *      whose history might fool the streaming algorithm.
 *   6. Pink-noise bed — added as a SECOND input stream and mixed
 *      under the voice via -filter_complex. amplitude=0.012 at the
 *      lavfi source, further attenuated by volume=-6dB on the bed
 *      side of amix. Net level ~-44 dBFS RMS — well below the
 *      voice's perceived loudness, audible only as ambient warmth
 *      rather than discrete noise. Fills the unnatural digital
 *      silences between TTS phonemes with the kind of low-level
 *      ambience that signals "produced editorial radio" rather
 *      than "raw AI demo". Disable per-run with `--no-bed`.
 *
 * Skipped: arnndn (RNNoise). Useful for recorded audio with ambient
 * noise; Kokoro output has no ambient noise to remove — running it
 * is a needless quality-degradation risk.
 *
 * Pipeline versioning
 * -------------------
 * Output MP3s carry an ID3 TXXX:pipeline_version tag set to the
 * PIPELINE_VERSION constant below. Re-running the script skips files
 * already tagged with the current version (cheap idempotency). Bump
 * the constant when the chain changes to invalidate cached output.
 *
 * Re-run input source
 * -------------------
 * If a `.raw.mp3` backup exists alongside the target, that's the
 * input for the FFMPEG pipeline — not the live (already-processed)
 * file. Otherwise the filter chain compounds on top of itself across
 * runs (EQ tilts double, loudnorm targets shift, etc.).
 *
 * Usage
 * -----
 *   # Single file (in place; saves <file>.raw.mp3 backup on first run):
 *   node scripts/audio-post-process.mjs blog/<slug>/audio.mp3
 *
 *   # Whole post (every audio*.mp3 in the directory):
 *   node scripts/audio-post-process.mjs blog/<slug>
 *
 *   # Preview without writing:
 *   node scripts/audio-post-process.mjs blog/<slug> --dry-run
 *
 *   # Force re-process even if pipeline_version tag matches:
 *   node scripts/audio-post-process.mjs blog/<slug> --force
 *
 *   # Print before/after EBU R128 loudness:
 *   node scripts/audio-post-process.mjs blog/<slug>/audio.mp3 --measure
 *
 * Requirements
 * ------------
 *   ffmpeg + ffprobe on $PATH (Debian/Ubuntu `ffmpeg` package ships
 *   all required filters: acompressor, deesser, equalizer, aecho,
 *   loudnorm).
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Bump this whenever the FILTER chain below changes so previously-
// processed MP3s get re-processed on next run. Format: yyyymmdd.N
// so version comparisons are total-orderable as strings.
//
// .2 — fixed aecho parameter misread (out_gain was attenuating the
//      entire signal by 22 dB) and converted loudnorm to true two-
//      pass with linear=true. Audit findings #1 and #2.
// .3 — added pink-noise bed at ~-44 dBFS RMS under the voice. Fills
//      the digital silences between phonemes with a thin warmth
//      that listeners can't consciously hear but registers as
//      "produced" rather than "AI demo". Disable via `--no-bed`
//      if it turns out to be objectionable at scale.
// .4 — optional intro tag (audio/assets/intro.wav) prepended ahead
//      of the voice. Detected at run time: when the file exists, the
//      output starts with the branded opener and a brief gap; when
//      it doesn't, the chain is unchanged. Disable per-run with
//      `--no-intro`. See audio/assets/README.md for recording spec.
const PIPELINE_VERSION = '20260528.4';

// VOICE chain WITHOUT loudnorm. The bed is added as a second input
// stream and mixed in via -filter_complex; the chain below shapes the
// voice signal before that mix.
const VOICE_CHAIN = [
  // Gentle low-mid warmth + glassiness tame
  'equalizer=f=200:width_type=h:width=80:g=1.5',
  'equalizer=f=3500:width_type=h:width=1500:g=-2',
  // De-essing. s=output mode (i=input bypass, o=processed, e=ess-only
  // for tuning) — NOT oversampling, despite an earlier comment error.
  'deesser=i=0.35:f=0.45:s=o',
  // Very light glue. Kokoro is already heavily limited internally;
  // pushing harder eats dynamics without making it sound better.
  'acompressor=threshold=-22dB:ratio=2.2:attack=20:release=200:makeup=1.5',
  // Subtle room: single tap at 80 ms, -22 dB relative to dry. in_gain
  // and out_gain are both 1 so the dry signal passes unchanged; the
  // echo's level is controlled by `decays` alone.
  'aecho=in_gain=1:out_gain=1:delays=80:decays=0.08',
].join(',');

// BED layer. Pink noise at amplitude 0.012, attenuated 6dB further,
// then mixed under the voice. Net level ~-44 dBFS RMS — below the
// voice's -23 LUFS by ~21 dB. Audible only as ambient warmth, not
// as discrete noise. The bed continues across the entire duration
// (amix's `duration=first` clips it to the voice).
const BED_FILTER = 'volume=-6dB';
const LOUDNORM_TARGETS = 'I=-16:TP=-1.5:LRA=11';

/* -------------------- args -------------------- */
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const targets = args.filter((a) => !a.startsWith('--'));
const dryRun  = flags.has('--dry-run');
const force   = flags.has('--force');
const measure = flags.has('--measure');
const noBackup = flags.has('--no-backup');
const noBed    = flags.has('--no-bed');
const noIntro  = flags.has('--no-intro');

if (targets.length === 0) {
  console.error('usage: audio-post-process.mjs <mp3 or post dir> [...] [--dry-run|--force|--measure|--no-backup|--no-bed|--no-intro]');
  process.exit(2);
}

// Intro tag: if audio/assets/intro.wav exists relative to the repo root,
// prepend it (plus a short post-intro gap) before the voice. Absent →
// no-op. Path is resolved from this script's location so the discovery
// works regardless of cwd. See audio/assets/README.md for the spec.
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const INTRO_PATH = path.join(REPO_ROOT, 'audio', 'assets', 'intro.wav');
const INTRO_GAP_MS = 350;
const useIntro = !noIntro && fs.existsSync(INTRO_PATH);

/* -------------------- helpers -------------------- */
function which(cmd) {
  return spawnSync('which', [cmd]).status === 0;
}
if (!which('ffmpeg') || !which('ffprobe')) {
  console.error('ffmpeg and ffprobe must be on $PATH');
  process.exit(1);
}

function readPipelineVersion(mp3Path) {
  const r = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format_tags=pipeline_version',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    mp3Path,
  ], { encoding: 'utf8' });
  return r.stdout.trim() || null;
}

// Build the full filter graph used by both passes. The graph mixes
// the voice (input 0, processed through VOICE_CHAIN) with the bed
// (input 1, pink noise from lavfi, attenuated). When the intro tag
// asset is present it's input 2 (or 1 when --no-bed), prepended to
// the voice via `concat` before the bed-mix and the terminal
// loudnorm. The terminal loudnorm node is appended by the caller
// (with different args for measure-vs-apply).
//
// Input-stream layout (driven by --no-bed and --no-intro):
//   default     : [0] voice  [1] bed (lavfi)  [2] intro (file)
//   --no-bed    : [0] voice                   [1] intro (file)
//   --no-intro  : [0] voice  [1] bed (lavfi)
//   both off    : [0] voice (no extra inputs)
function buildFilterComplex(loudnormArgs) {
  const introIdx = noBed ? 1 : 2;
  // Brief silence between intro and voice so the brand tag doesn't
  // collide phonetically with the article's first sentence.
  const introTrailGapSec = (INTRO_GAP_MS / 1000).toFixed(3);

  // Helper: produce the voice-stream label, optionally with the
  // intro spliced in front. Output label: [voiced].
  const voiceWithIntro = useIntro
    ? [
        `[${introIdx}:a] aresample=24000,aformat=channel_layouts=mono [intro]`,
        `aevalsrc=0:d=${introTrailGapSec}:s=24000:c=mono [intro_pad]`,
        `[0:a] ${VOICE_CHAIN} [voice]`,
        `[intro][intro_pad][voice] concat=n=3:v=0:a=1 [voiced]`,
      ]
    : [`[0:a] ${VOICE_CHAIN} [voiced]`];

  if (noBed) {
    return [
      ...voiceWithIntro,
      `[voiced] loudnorm=${loudnormArgs} [out]`,
    ].join(';');
  }
  return [
    ...voiceWithIntro,
    `[1:a] ${BED_FILTER} [bed]`,
    `[voiced][bed] amix=inputs=2:duration=first:dropout_transition=0,loudnorm=${loudnormArgs} [out]`,
  ].join(';');
}

// Pink-noise lavfi source. amplitude tunes the per-sample peak; the
// VOICE_CHAIN-side BED_FILTER (volume=-6dB) provides the final mix
// attenuation. Duration is large so it always outlasts the voice;
// amix's duration=first clips the output to the voice's length.
const BED_INPUT_ARGS = ['-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=0.012:duration=9999'];

// Intro tag input — a real file on disk, not lavfi. Read only when
// `useIntro` is true; ignored otherwise.
const INTRO_INPUT_ARGS = ['-i', INTRO_PATH];

// First-pass measurement — run the WHOLE graph (voice chain + bed
// mix + loudnorm in measure mode) so the measurement reflects what
// pass 2 will actually normalize. Single-pass loudnorm-with-bed
// would otherwise underestimate the integrated loudness because it
// only sees the voice chain.
function measureThroughChain(inputPath) {
  const cmd = ['-hide_banner', '-nostats', '-i', inputPath];
  if (!noBed) cmd.push(...BED_INPUT_ARGS);
  if (useIntro) cmd.push(...INTRO_INPUT_ARGS);
  cmd.push(
    '-filter_complex', buildFilterComplex(`${LOUDNORM_TARGETS}:print_format=json`),
    '-map', '[out]',
    '-f', 'null', '-',
  );
  const r = spawnSync('ffmpeg', cmd, { encoding: 'utf8' });
  return parseLoudnormJson(r.stderr);
}

// Direct measurement of an arbitrary file's loudness, WITHOUT the
// pipeline chain (used for "after" reporting on an already-processed
// file — re-running the chain would double-process and produce
// numbers that don't reflect what the file actually sounds like).
function measureFile(inputPath) {
  const r = spawnSync('ffmpeg', [
    '-hide_banner', '-nostats',
    '-i', inputPath,
    '-af', `loudnorm=${LOUDNORM_TARGETS}:print_format=json`,
    '-f', 'null', '-',
  ], { encoding: 'utf8' });
  return parseLoudnormJson(r.stderr);
}

function parseLoudnormJson(stderr) {
  // The JSON block is the last `{ ... }` group in stderr.
  const openIdx = stderr.lastIndexOf('{');
  const closeIdx = stderr.lastIndexOf('}');
  if (openIdx < 0 || closeIdx < openIdx) return null;
  try {
    return JSON.parse(stderr.slice(openIdx, closeIdx + 1));
  } catch (_) {
    return null;
  }
}

function buildAppliedLoudnormArgs(m) {
  return [
    LOUDNORM_TARGETS,
    `measured_I=${m.input_i}`,
    `measured_LRA=${m.input_lra}`,
    `measured_TP=${m.input_tp}`,
    `measured_thresh=${m.input_thresh}`,
    `offset=${m.target_offset}`,
    'linear=true',
  ].join(':');
}

function processOne(mp3Path) {
  if (!fs.existsSync(mp3Path)) {
    console.error(`skip: ${mp3Path} not found`);
    return false;
  }
  const existing = readPipelineVersion(mp3Path);
  if (existing === PIPELINE_VERSION && !force) {
    console.log(`skip: ${path.relative(process.cwd(), mp3Path)} (already at pipeline ${PIPELINE_VERSION})`);
    return false;
  }
  if (existing && existing !== PIPELINE_VERSION) {
    console.log(`reprocess: ${path.relative(process.cwd(), mp3Path)} (was ${existing} → ${PIPELINE_VERSION})`);
  } else if (!existing) {
    console.log(`process: ${path.relative(process.cwd(), mp3Path)}`);
  }
  if (dryRun) return true;

  const dir = path.dirname(mp3Path);
  const base = path.basename(mp3Path, '.mp3');
  const tmp = path.join(dir, `${base}.processed.mp3`);
  const backup = path.join(dir, `${base}.raw.mp3`);

  // Audit fix: re-process from the RAW backup when available so the
  // filter chain doesn't compound on top of itself across runs. On
  // first run, the source IS the raw input.
  const inputPath = fs.existsSync(backup) ? backup : mp3Path;

  // Pass 1 — measure loudness through the chain so pass 2 can apply
  // linear (constant-gain) normalization. Single-pass loudnorm with
  // linear=true silently falls back to dynamic mode without these.
  const measured = measureThroughChain(inputPath);
  if (!measured) {
    console.error(`measurement failed on ${mp3Path} — leaving file unchanged`);
    return false;
  }
  if (measure) {
    // The "before" numbers are the chain-shaped signal's loudness —
    // what the loudnorm pass 2 will normalize. The raw input would
    // measure differently; we want the values that drive pass 2.
    console.log(`  before: I=${measured.input_i} LUFS · LRA=${measured.input_lra} LU · TP=${measured.input_tp} dBTP · target_offset=${measured.target_offset}`);
  }

  const loudnormArgs = buildAppliedLoudnormArgs(measured);

  // Pass 2 — apply. Same filter graph as the measurement pass, just
  // with measured loudnorm args instead of print_format=json.
  const applyCmd = ['-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath];
  if (!noBed) applyCmd.push(...BED_INPUT_ARGS);
  if (useIntro) applyCmd.push(...INTRO_INPUT_ARGS);
  applyCmd.push(
    '-filter_complex', buildFilterComplex(loudnormArgs),
    '-map', '[out]',
    '-codec:a', 'libmp3lame',
    '-b:a', '96k',
    '-ar', '24000',
    '-ac', '1',
    '-metadata', `pipeline_version=${PIPELINE_VERSION}`,
    tmp,
  );
  const r = spawnSync('ffmpeg', applyCmd, { encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) {
    console.error(`ffmpeg failed on ${mp3Path}`);
    try { fs.unlinkSync(tmp); } catch (_) {}
    return false;
  }

  // Swap. Not atomic (two filesystem ops), so we order things such
  // that an interruption between them leaves a recoverable state:
  //   - tmp.processed.mp3 = newly produced output
  //   - source.mp3        = either raw (first run) or stale-processed
  //   - backup.raw.mp3    = raw, if backup-on-first-run already ran
  // We save source → backup BEFORE renaming tmp → source. If killed
  // between those, the user still has both files (just different
  // names than expected) and can manually finish.
  if (!noBackup && !fs.existsSync(backup)) {
    fs.renameSync(mp3Path, backup);
  } else if (fs.existsSync(mp3Path)) {
    // Backup already exists OR --no-backup: the live source is being
    // discarded in favor of the new output. Backup is preserved.
    fs.unlinkSync(mp3Path);
  }
  fs.renameSync(tmp, mp3Path);

  if (measure) {
    // Measure the OUTPUT file directly — no chain pass — so the
    // numbers reflect what the file actually sounds like, not what
    // it would sound like if pushed through the chain a second time.
    const after = measureFile(mp3Path);
    if (after) {
      console.log(`  after:  I=${after.input_i} LUFS · LRA=${after.input_lra} LU · TP=${after.input_tp} dBTP`);
    }
  }
  return true;
}

function discover(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (!target.endsWith('.mp3')) {
      console.error(`skip: ${target} is not an mp3`);
      return [];
    }
    if (target.endsWith('.raw.mp3') || target.endsWith('.processed.mp3')) return [];
    return [target];
  }
  if (stat.isDirectory()) {
    return fs.readdirSync(target)
      // Match the actual artifact names render-post-audio.mjs emits:
      // audio.mp3 and audio.<2-3 char lang>.mp3. Exclude backup/temp
      // siblings and unrelated audio* names like audio-promo.mp3.
      .filter((f) => /^audio(\.[a-z]{2,3})?\.mp3$/.test(f))
      .map((f) => path.join(target, f));
  }
  return [];
}

let processed = 0, skipped = 0, would = 0;
for (const t of targets) {
  const mp3s = discover(t);
  for (const mp3 of mp3s) {
    const ok = processOne(mp3);
    if (ok) {
      if (dryRun) would++;
      else processed++;
    } else {
      skipped++;
    }
  }
}
if (dryRun) {
  console.log(`\ndone (dry run): ${would} would be processed, ${skipped} would be skipped`);
} else {
  console.log(`\ndone: ${processed} processed, ${skipped} skipped`);
}
