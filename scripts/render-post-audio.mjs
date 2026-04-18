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
  const segments = []; // list of {wav, dur} to concatenate, in order
  const manifestChunks = [];

  // Pre-rendered silence buffers at varied durations. Adaptive gaps
  // make transitions feel natural instead of metronomic: a section
  // break gets a longer pause than a paragraph break, which gets a
  // longer pause than list-item to list-item.
  const GAP_CACHE = new Map();
  function gapWav(seconds) {
    const key = seconds.toFixed(3);
    if (GAP_CACHE.has(key)) return GAP_CACHE.get(key);
    const p = path.join(tmpDir, `_gap_${key}.wav`);
    renderSilence(p, seconds);
    GAP_CACHE.set(key, p);
    return p;
  }
  function gapBefore(chunk, prev) {
    if (!prev) return 0;                                 // first chunk
    if (chunk.kind === 'heading') return 0.80;           // section break
    if (chunk.kind === 'figure')  return 0.55;           // before graphic
    if (prev.kind === 'heading')  return 0.45;           // after heading
    if (prev.kind === 'figure')   return 0.50;           // after graphic
    if (chunk.kind === 'list' && prev.kind === 'list') return 0.22; // item to item
    if (chunk.kind === 'quote' || prev.kind === 'quote') return 0.55;
    // Sentence-final punctuation in the previous chunk gets a natural
    // beat; mid-sentence continuations use less silence.
    const prevEndsSentence = /[.!?]$/.test(prev.text);
    return prevEndsSentence ? 0.32 : 0.22;
  }

  let cursor = 0;
  chunks.forEach((chunk, i) => {
    const rawWav = path.join(tmpDir, `c${String(i).padStart(4, '0')}.wav`);
    runPiper(chunk.text, rawWav);
    // Trim leading/trailing silence piper adds around each utterance.
    // This is the single biggest win against "robotic, word-at-a-time"
    // playback: without trimming, every chunk carries ~150-300 ms of
    // dead air on each side that compounds into staccato cuts between
    // paragraphs. After trimming we explicitly insert the gap we chose
    // above, which the listener hears as deliberate pacing.
    const wav = path.join(tmpDir, `t${String(i).padStart(4, '0')}.wav`);
    trimSilence(rawWav, wav);
    const dur = wavDuration(wav);
    const gap = gapBefore(chunk, chunks[i - 1]);
    if (gap > 0) segments.push(gapWav(gap));
    segments.push(wav);

    const start = cursor + gap;
    const end = start + dur;
    cursor = end;
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

  // Concatenate all the WAVs (gap, chunk, gap, chunk, …) into one file.
  const concatList = path.join(tmpDir, 'concat.txt');
  fs.writeFileSync(concatList,
    segments.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
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
  // Piper reads text on stdin, writes WAV to --output_file. The
  // synthesis params below are tuned for slightly longer natural beats
  // between sentences and a touch more prosodic variation than the
  // defaults — the result feels more "read aloud" than "announced".
  const proc = spawnSync('piper', [
    '--model', model,
    '--speaker', speaker,
    '--output_file', outWav,
    '--sentence-silence', '0.30',
    '--length-scale', '1.0',
    '--noise-scale', '0.667',
    '--noise-w-scale', '0.85',
  ], { input: text, encoding: 'utf8' });
  if (proc.status !== 0) {
    fail(`piper failed (${proc.status}): ${proc.stderr || proc.stdout}`);
  }
}

function renderSilence(outWav, seconds) {
  run('ffmpeg', ['-y', '-f', 'lavfi', '-i', `anullsrc=r=22050:cl=mono`,
                '-t', String(seconds), '-c:a', 'pcm_s16le', outWav]);
}

// Strip leading + trailing silence from a WAV using ffmpeg's
// silenceremove filter. Thresholds picked for piper's ~-50dB noise
// floor: anything quieter than -45dB for >0.08s is treated as silence.
// The re-encode to pcm_s16le matches the piper WAV format so downstream
// concat doesn't need a re-encode step.
function trimSilence(inputWav, outWav) {
  run('ffmpeg', ['-y', '-i', inputWav, '-af',
    'silenceremove=start_periods=1:start_duration=0.08:start_threshold=-45dB:' +
    'stop_periods=1:stop_duration=0.08:stop_threshold=-45dB:detection=rms',
    '-c:a', 'pcm_s16le', outWav]);
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
      let t = stripTags(inner);
      // Headings don't end with punctuation in the HTML, which trips
      // the synth's sentence-final intonation — append a period so the
      // line lands with a proper fall rather than a declarative drift.
      if (t.length >= 2 && !/[.!?…]$/.test(t)) t += '.';
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
      if (audioAltMatch) text = normalizeForSpeech(decodeEntities(audioAltMatch[1]).trim());
      else if (ariaLabelMatch) text = normalizeForSpeech(decodeEntities(ariaLabelMatch[1]).trim());
      else if (captionMatch)   text = stripTags(captionMatch[1]);
      if (text.length >= 2) out.push({ text, kind: 'figure', selector: baseSel });
      continue;
    }
    if (tag === 'blockquote') {
      const t = stripTags(inner);
      if (t.length >= 2) out.push({ text: t, kind: 'quote', selector: baseSel });
      continue;
    }
    if (tag === 'div') {
      // Top-level div wrappers (visual callouts like .revenue-math)
      // only produce a spoken chunk when the author has opted in with
      // data-audio-alt. That value is the authored prose version of
      // the visual block — we emit it as one "figure" chunk so the
      // runtime highlights the whole box while it's being read.
      const audioAltMatch = /data-audio-alt="([\s\S]*?)"/i.exec(attrBlob);
      if (audioAltMatch) {
        const text = normalizeForSpeech(decodeEntities(audioAltMatch[1]).trim());
        if (text.length >= 2) out.push({ text, kind: 'figure', selector: baseSel });
      }
      continue;
    }
  }

  return out;
}

function stripTags(s) {
  return normalizeForSpeech(decodeEntities(s.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim());
}

/* Text → speech normalization.
 * Piper and most TTS engines read symbols and acronyms literally unless
 * coached: "#1" becomes "hash one", "SEO" becomes "see-oh", "2026"
 * becomes "two thousand twenty-six" instead of "twenty twenty-six".
 * These substitutions coach the synthesizer into the pronunciation a
 * reader would actually pick given the context of a restaurant-
 * marketing blog. Keep in sync with the runtime copy in
 * assets/site.js so Web Speech fallback behaves the same way.
 */
function normalizeForSpeech(str) {
  if (!str) return str;

  // Acronyms the synth otherwise mangles. Spelled out letter-by-letter
  // with spaces so Piper pronounces each letter. Whole-word only.
  const ACRONYMS = ['SEO','CTA','URL','PDF','POS','API','DNS','CDN','CMS','DIY','CEO','ROI','UX','UI','HTML','CSS','HTTPS','FAQ','GBP','NAP'];
  const ACRONYM_RE = new RegExp('\\b(' + ACRONYMS.join('|') + ')\\b', 'g');

  // Short honorifics + common latinisms. Expanded so the synth doesn't
  // stumble on the abbreviating period.
  const EXPANSIONS = {
    'Mr.': 'Mister', 'Mrs.': 'Missus', 'Ms.': 'Miss', 'Dr.': 'Doctor',
    'vs.': 'versus', 'etc.': 'et cetera', 'i.e.': 'that is',
    'e.g.': 'for example', 'approx.': 'approximately',
  };

  return str
    // "#1" / "# 1" / "#10" → "number 1" (numeric only; leaves hashtags alone)
    .replace(/#\s*(\d+)/g, 'number $1')
    // "$33,000" / "$55" → "33,000 dollars" / "55 dollars"
    .replace(/\$(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)/g, '$1 dollars')
    // "×" → " times " in arithmetic-looking contexts (e.g. "50 × $55")
    .replace(/(\d)\s*×\s*(\d|\$)/g, '$1 times $2')
    // "4pm" / "8 AM" / "10p.m." → "4 PM" / "8 AM" / "10 PM" (uppercase
    // so piper reads it as the abbreviation, not "pm" which slurs)
    .replace(/(\d)\s*([ap])\.?\s*m\.?\b/gi, (_, n, ap) => `${n} ${ap.toUpperCase()}M`)
    // Known acronyms — letter-by-letter with spaces so piper spells them
    .replace(ACRONYM_RE, (w) => w.split('').join(' '))
    // "2026" / "2024" → "twenty twenty-six" (common-era years in 20xx)
    .replace(/\b20(\d{2})\b/g, (_, xx) => {
      const n = parseInt(xx, 10);
      return 'twenty ' + numberWord(n);
    })
    // Honorifics + latinisms
    .replace(/\b(Mr|Mrs|Ms|Dr|vs|etc|i\.e|e\.g|approx)\.(?=\s|$)/g, (m) => EXPANSIONS[m] || m)
    // Narrow-no-break-space (U+202F) and non-breaking space (U+00A0)
    // can trip word boundaries; normalize to plain space.
    .replace(/[\u00A0\u202F]/g, ' ')
    // Collapse any whitespace we introduced
    .replace(/\s+/g, ' ')
    .trim();
}

// Small helper for numberWord up to 99 — enough for year suffix digits
function numberWord(n) {
  if (n === 0) return 'hundred';
  const ones = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10), o = n % 10;
  return o ? tens[t] + '-' + ones[o] : tens[t];
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
  // Walk blog/ and blog/drafts/ for any post that has opted into
  // the audio edition via #listen-btn. Drafts are included so their
  // audio is pre-rendered and ready the moment they ship.
  const roots = [path.join(repoRoot, 'blog'), path.join(repoRoot, 'blog', 'drafts')];
  const out = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      if (d.name === 'drafts') continue; // handled via second root
      const postDir = path.join(root, d.name);
      const idx = path.join(postDir, 'index.html');
      if (!fs.existsSync(idx)) continue;
      if (fs.readFileSync(idx, 'utf8').includes('id="listen-btn"')) {
        out.push(path.relative(repoRoot, postDir));
      }
    }
  }
  return out;
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
