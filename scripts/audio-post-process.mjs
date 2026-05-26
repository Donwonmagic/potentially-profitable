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
 *   4. aecho — 80 ms tail at ~4% wet for a subtle "voice in a room"
 *      cue, the single largest "human" signal we can apply without
 *      changing the voice itself.
 *   5. loudnorm — EBU R128 to -16 LUFS / TP -1.5 dBFS / LRA 11. This
 *      is the podcast-industry default; output sits at the same
 *      perceived loudness as The Daily, NYT Audio, etc., so a listener
 *      switching to or from another show doesn't hit a volume cliff.
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
 * Usage
 * -----
 *   # In place on a single MP3 (writes <file>.processed.mp3 then
 *   # atomically renames over the original, keeping the original
 *   # backed up as <file>.raw.mp3 unless --no-backup):
 *   node scripts/audio-post-process.mjs blog/<slug>/audio.mp3
 *
 *   # Whole post (every audio.*.mp3):
 *   node scripts/audio-post-process.mjs blog/<slug>
 *
 *   # Show what would happen without writing anything:
 *   node scripts/audio-post-process.mjs blog/<slug> --dry-run
 *
 *   # Force re-process even if pipeline_version tag matches:
 *   node scripts/audio-post-process.mjs blog/<slug> --force
 *
 *   # Print before/after EBU R128 loudness stats:
 *   node scripts/audio-post-process.mjs blog/<slug>/audio.mp3 --measure
 *
 * Requirements
 * ------------
 *   ffmpeg + ffprobe on $PATH. The Debian/Ubuntu `ffmpeg` package
 *   includes all the filters used here (acompressor, deesser,
 *   equalizer, aecho, loudnorm).
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Bump this whenever the FILTER chain below changes so previously-
// processed MP3s get re-processed on next run. Format: yyyymmdd.N
// so version comparisons are total-orderable as strings.
const PIPELINE_VERSION = '20260526.1';

// The filter chain. Edit here, bump PIPELINE_VERSION. Order matters:
// EQ before compression so the compressor responds to the shaped
// signal; compression before reverb so the room tail isn't crushed;
// loudnorm last so it normalizes the final mix.
const FILTER_CHAIN = [
  // Gentle low-mid warmth + glassiness tame
  'equalizer=f=200:width_type=h:width=80:g=1.5',
  'equalizer=f=3500:width_type=h:width=1500:g=-2',
  // De-essing. i=intensity, f=ratio, s=output mode (o=oversampling)
  'deesser=i=0.35:f=0.45:s=o',
  // Very light glue. Kokoro is already heavily limited internally;
  // pushing harder eats dynamics without making it sound better.
  'acompressor=threshold=-22dB:ratio=2.2:attack=20:release=200:makeup=1.5',
  // Subtle room. Single tap, 80 ms, 8% mix. Stronger reverb starts
  // sounding "in a hallway" — we want "in a small studio."
  'aecho=0.85:0.08:80:0.12',
  // Broadcast loudness target. linear=true keeps headroom predictable
  // for the MP3 encoder.
  'loudnorm=I=-16:TP=-1.5:LRA=11:linear=true',
].join(',');

/* -------------------- args -------------------- */
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const targets = args.filter((a) => !a.startsWith('--'));
const dryRun  = flags.has('--dry-run');
const force   = flags.has('--force');
const measure = flags.has('--measure');
const noBackup = flags.has('--no-backup');

if (targets.length === 0) {
  console.error('usage: audio-post-process.mjs <mp3 or post dir> [...] [--dry-run|--force|--measure|--no-backup]');
  process.exit(2);
}

/* -------------------- helpers -------------------- */
function which(cmd) {
  const r = spawnSync('which', [cmd]);
  return r.status === 0;
}
if (!which('ffmpeg') || !which('ffprobe')) {
  console.error('ffmpeg and ffprobe must be on $PATH');
  process.exit(1);
}

function readPipelineVersion(mp3Path) {
  // ffprobe reads ID3 TXXX frames as "tag:<key>=<value>" in stream/format.
  // We tag with a global TXXX:pipeline_version frame.
  const r = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format_tags=pipeline_version',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    mp3Path,
  ], { encoding: 'utf8' });
  return r.stdout.trim() || null;
}

function measureLoudness(mp3Path, label) {
  if (!measure) return;
  const r = spawnSync('ffmpeg', [
    '-i', mp3Path,
    '-af', 'loudnorm=print_format=summary',
    '-f', 'null', '-',
  ], { encoding: 'utf8' });
  const lines = r.stderr.split('\n');
  const summary = lines.slice(-15).join('\n');
  // Extract just the integrated + range + true peak lines
  const i = lines.find((l) => l.includes('Input Integrated:'));
  const lra = lines.find((l) => l.includes('Input LRA:'));
  const tp = lines.find((l) => l.includes('Input True Peak:'));
  console.log(`  ${label} ${[i, lra, tp].filter(Boolean).map((s) => s.trim()).join('  ·  ')}`);
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

  measureLoudness(mp3Path, 'before:');

  const dir = path.dirname(mp3Path);
  const base = path.basename(mp3Path, '.mp3');
  const tmp = path.join(dir, `${base}.processed.mp3`);
  const backup = path.join(dir, `${base}.raw.mp3`);

  // Re-encode through the filter chain. Preserve sample rate (24k for
  // Kokoro) + mono. 96k VBR-ish bitrate keeps voice clean without
  // bloating file size; the source was ~60k so a small bump is fine.
  const r = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-y',
    '-i', mp3Path,
    '-af', FILTER_CHAIN,
    '-codec:a', 'libmp3lame',
    '-b:a', '96k',
    '-ar', '24000',
    '-ac', '1',
    '-metadata', `pipeline_version=${PIPELINE_VERSION}`,
    tmp,
  ], { encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) {
    console.error(`ffmpeg failed on ${mp3Path}`);
    try { fs.unlinkSync(tmp); } catch (_) {}
    return false;
  }

  // Atomic swap. Keep a .raw.mp3 backup of the pre-processed source so
  // the chain can be retuned + re-applied without re-rendering TTS.
  if (!noBackup && !fs.existsSync(backup)) {
    fs.renameSync(mp3Path, backup);
  } else {
    fs.unlinkSync(mp3Path);
  }
  fs.renameSync(tmp, mp3Path);

  measureLoudness(mp3Path, 'after: ');
  return true;
}

function discover(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (!target.endsWith('.mp3')) {
      console.error(`skip: ${target} is not an mp3`);
      return [];
    }
    // Don't process backup files.
    if (target.endsWith('.raw.mp3') || target.endsWith('.processed.mp3')) return [];
    return [target];
  }
  if (stat.isDirectory()) {
    return fs.readdirSync(target)
      .filter((f) => f.startsWith('audio') && f.endsWith('.mp3'))
      .filter((f) => !f.endsWith('.raw.mp3') && !f.endsWith('.processed.mp3'))
      .map((f) => path.join(target, f));
  }
  return [];
}

let processed = 0, skipped = 0, failed = 0;
for (const t of targets) {
  const mp3s = discover(t);
  for (const mp3 of mp3s) {
    const ok = processOne(mp3);
    if (ok && !dryRun) processed++;
    else if (!ok) skipped++;
  }
}
console.log(`\ndone: ${processed} processed, ${skipped} skipped${dryRun ? ' (dry run)' : ''}`);
