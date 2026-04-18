#!/usr/bin/env node
// Pre-render a blog post's "audio edition" MP3 with Piper (open-source
// neural TTS) and emit a chunk-timing manifest so the runtime player
// can keep paragraph-level highlighting in sync.
//
// Why this exists
// ---------------
// The runtime read-aloud feature falls back to the browser's Web Speech
// API, whose voice quality varies wildly by device. For flagship posts
// we'd rather ship a branded MP3. Piper is MIT-licensed, runs on CPU,
// and produces voices on par with cloud TTS — same "free tier" spirit
// that got us off Formspree. No SaaS, no API keys.
//
// Requirements
// ------------
//   - piper  (https://github.com/rhasspy/piper) on $PATH
//   - ffmpeg (for WAV → MP3 transcode) on $PATH
//   - a .onnx voice model + its .json config
//
// Usage
// -----
//   node scripts/render-post-audio.mjs \
//     blog/why-your-restaurant-loses-reservations-every-night \
//     --model voices/en_US-amy-medium.onnx
//
//   # or every post that opts in via the listen button:
//   node scripts/render-post-audio.mjs --all --model voices/en_US-amy-medium.onnx
//
// Writes
// ------
//   <post>/audio.mp3   — the narration
//   <post>/audio.json  — the manifest the runtime fetches
//   Then wire up the post's #listen-btn with
//     data-audio-src="audio.mp3"
//   and site.js automatically switches to studio mode on play.
//
// Zero npm deps. POSIX Node only.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

/* -------------------- args -------------------- */
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));
const optVal = (name) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : null;
};
const model = optVal('--model');
const speaker = optVal('--speaker') || '0';
const dryRun = flags.has('--dry-run');
if (!dryRun) {
  if (!model) fail('--model <path/to/voice.onnx> is required. Download a voice from the Piper releases page.');
  if (!fs.existsSync(model)) fail(`Model not found at ${model}`);
  if (!which('piper')) fail('`piper` not found on PATH. Install from https://github.com/rhasspy/piper/releases');
  if (!which('ffmpeg')) fail('`ffmpeg` not found on PATH.');
}

const targets = flags.has('--all') ? findPostsWithListenBtn() : positional;
if (!targets.length) fail('Pass a post directory (e.g. blog/post-slug) or --all.');

for (const t of targets) renderPost(path.resolve(repoRoot, t));

/* -------------------- main -------------------- */
function renderPost(postDir) {
  const indexPath = path.join(postDir, 'index.html');
  if (!fs.existsSync(indexPath)) fail(`${indexPath} does not exist`);
  const html = fs.readFileSync(indexPath, 'utf8');

  const chunks = extractChunks(html);
  if (!chunks.length) fail(`No audio-eligible chunks found in ${indexPath}`);
  console.log(`[${path.basename(postDir)}] ${chunks.length} chunks`);

  if (dryRun) {
    chunks.forEach((c, i) => {
      const preview = c.text.length > 90 ? c.text.slice(0, 87) + '…' : c.text;
      console.log(`  ${String(i + 1).padStart(3)}. [${c.kind}] ${preview}`);
      console.log(`       selector: ${c.selector}`);
    });
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-render-'));
  const wavs = [];
  const manifestChunks = [];

  let cursor = 0;
  const GAP = 0.35; // seconds of silence between chunks, for pacing
  const gapWav = path.join(tmpDir, '_gap.wav');
  renderSilence(gapWav, GAP);

  chunks.forEach((chunk, i) => {
    const wav = path.join(tmpDir, `c${String(i).padStart(4, '0')}.wav`);
    runPiper(chunk.text, wav);
    const dur = wavDuration(wav);
    const start = cursor;
    const end = start + dur;
    cursor = end + GAP;
    wavs.push(wav, gapWav);
    manifestChunks.push({
      id: i,
      kind: chunk.kind,
      selector: chunk.selector,
      text: chunk.text,
      start: round(start),
      end:   round(end),
    });
    process.stdout.write(`  · chunk ${i + 1}/${chunks.length} (${dur.toFixed(2)}s)\r`);
  });
  console.log('');

  // Concatenate all the WAVs (chunk + gap, chunk + gap …) then MP3.
  const concatList = path.join(tmpDir, 'concat.txt');
  fs.writeFileSync(concatList,
    wavs.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const combinedWav = path.join(tmpDir, '_all.wav');
  run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', combinedWav]);

  const mp3Out = path.join(postDir, 'audio.mp3');
  run('ffmpeg', ['-y', '-i', combinedWav, '-codec:a', 'libmp3lame', '-q:a', '4', mp3Out]);

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    model: path.basename(model),
    total: round(cursor),
    chunks: manifestChunks,
  };
  fs.writeFileSync(path.join(postDir, 'audio.json'), JSON.stringify(manifest, null, 2));

  // Clean up tmp; keep intermediates if --keep-tmp was passed (for debug).
  if (!flags.has('--keep-tmp')) fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`  ✓ ${path.relative(repoRoot, mp3Out)}  (${manifest.total.toFixed(1)}s)`);
}

function runPiper(text, outWav) {
  // Piper reads text on stdin, writes WAV to --output_file.
  const proc = spawnSync('piper', [
    '--model', model,
    '--speaker', speaker,
    '--output_file', outWav,
  ], { input: text, encoding: 'utf8' });
  if (proc.status !== 0) {
    fail(`piper failed (${proc.status}): ${proc.stderr || proc.stdout}`);
  }
}

function renderSilence(outWav, seconds) {
  run('ffmpeg', ['-y', '-f', 'lavfi', '-i', `anullsrc=r=22050:cl=mono`,
                '-t', String(seconds), '-c:a', 'pcm_s16le', outWav]);
}

function wavDuration(wav) {
  // ffprobe isn't always present — but ffmpeg can tell us via `-i` stderr.
  const out = spawnSync('ffmpeg', ['-i', wav, '-hide_banner'], { encoding: 'utf8' });
  const m = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(out.stderr || '');
  if (!m) return 0;
  return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
}

/* -------------------- chunk extraction --------------------
 * Mirrors the runtime logic in assets/site.js so the manifest
 * chunk[i] always corresponds to the same DOM element the runtime
 * would highlight. Selectors are written to be stable across edits:
 * an nth-of-type chain rooted at #post-body.
 */
function extractChunks(html) {
  // Narrow the search to the article body. We look for id="post-body"
  // and read until the closing </article> of that element.
  const bodyMatch = /<article[^>]*id="post-body"[^>]*>([\s\S]*?)<\/article>/i.exec(html);
  if (!bodyMatch) return [];
  const body = bodyMatch[1];

  // Walk through top-level-ish elements. We use a minimal hand-rolled
  // parser so we can preserve document order and build nth-of-type
  // selectors. It recognises the tags we care about and skips through
  // anything else verbatim.
  const TAG_RE = /<(h2|h3|p|ul|ol|figure|div|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  const out = [];
  const counts = new Map(); // tag → count so we can build nth-of-type

  let m;
  while ((m = TAG_RE.exec(body)) !== null) {
    const [, tagLower, attrs, inner] = m;
    const tag = tagLower.toLowerCase();
    const n = (counts.get(tag) || 0) + 1;
    counts.set(tag, n);
    const baseSel = `#post-body > ${tag}:nth-of-type(${n})`;
    const attrBlob = attrs || '';

    // Skip CTAs, further-reading, and sources subsections
    if (/class="[^"]*(inline-cta|further-reading|sources)[^"]*"/i.test(attrBlob)) continue;

    if (tag === 'h2' || tag === 'h3') {
      const t = stripTags(inner);
      if (t.length >= 2) out.push({ text: t, kind: 'heading', selector: baseSel });
      continue;
    }
    if (tag === 'p') {
      // Pull quote paragraphs
      if (/class="[^"]*pull-quote[^"]*"/i.test(attrBlob)) {
        out.push({ text: stripTags(inner), kind: 'quote', selector: baseSel });
      } else {
        const t = stripTags(inner);
        if (t.length >= 2) out.push({ text: t, kind: 'body', selector: baseSel });
      }
      continue;
    }
    if (tag === 'ul' || tag === 'ol') {
      const LI_RE = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let li, li_n = 0;
      while ((li = LI_RE.exec(inner)) !== null) {
        li_n++;
        const t = stripTags(li[1]);
        if (t.length >= 2) out.push({ text: t, kind: 'list', selector: `${baseSel} > li:nth-of-type(${li_n})` });
      }
      continue;
    }
    if (tag === 'figure') {
      // Same priority as the runtime: data-audio-alt → inner
      // role="img"[aria-label] → figcaption.
      const audioAltMatch = /data-audio-alt="([\s\S]*?)"/i.exec(attrBlob)
                          || /data-audio-alt="([\s\S]*?)"/i.exec(inner);
      const ariaLabelMatch = /role="img"[^>]*aria-label="([\s\S]*?)"/i.exec(inner);
      const captionMatch   = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(inner);
      let text = '';
      if (audioAltMatch) text = decodeEntities(audioAltMatch[1]).trim();
      else if (ariaLabelMatch) text = decodeEntities(ariaLabelMatch[1]).trim();
      else if (captionMatch)   text = stripTags(captionMatch[1]);
      if (text.length >= 2) out.push({ text, kind: 'figure', selector: baseSel });
      continue;
    }
    if (tag === 'blockquote') {
      const t = stripTags(inner);
      if (t.length >= 2) out.push({ text: t, kind: 'quote', selector: baseSel });
      continue;
    }
    // Plain <div> wrappers (like .callout) — we don't descend. If your
    // content has speakable text inside a div you don't want missed,
    // either switch it to a <p> or give the div a data-audio-alt.
  }

  return out;
}

function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}
function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

/* -------------------- discovery / utils -------------------- */
function findPostsWithListenBtn() {
  const blogDir = path.join(repoRoot, 'blog');
  if (!fs.existsSync(blogDir)) return [];
  return fs.readdirSync(blogDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'drafts')
    .map((d) => path.join('blog', d.name))
    .filter((p) => {
      const idx = path.join(repoRoot, p, 'index.html');
      if (!fs.existsSync(idx)) return false;
      return fs.readFileSync(idx, 'utf8').includes('id="listen-btn"');
    });
}

function which(bin) {
  const out = spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin]);
  return out.status === 0;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) fail(`${cmd} failed: ${r.stderr || r.stdout}`);
  return r;
}

function round(n) { return Math.round(n * 1000) / 1000; }

function fail(msg) {
  console.error(`[render-post-audio] ${msg}`);
  process.exit(1);
}
