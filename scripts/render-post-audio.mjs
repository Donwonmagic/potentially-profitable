#!/usr/bin/env node
// Pre-render a blog post's "audio edition" MP3 and emit a chunk-timing
// manifest so the runtime player can keep paragraph-level highlighting
// in sync with the narration.
//
// Engines
// -------
// Three open-source neural TTS engines are supported:
//
//   - kokoro (default) — Kokoro 82M via kokoro-onnx. Apache 2.0, runs
//     on CPU, genuinely fluid sentence-to-sentence narration because
//     the model attends over multi-sentence input natively. Shells out
//     to scripts/lib/kokoro_render.py which holds the model in memory
//     across all chunks of a post. Used for all non-English languages.
//
//   - f5 — F5-TTS voice cloning. MIT-licensed, clones the voice in
//     scripts/voice-refs/don-reference.m4a for English narration.
//     English-only; non-English languages in the same run still use
//     Kokoro so the pipeline stays one command.
//
//   - piper — Piper neural TTS. MIT-licensed, faster, but narrates one
//     utterance at a time so it feels more "announced" than read. Kept
//     as a fallback for machines where Kokoro can't run.
//
// Requirements
// ------------
//   Shared: ffmpeg on $PATH for WAV concat + MP3 transcode.
//   Kokoro: python3 with kokoro-onnx + soundfile (pip install kokoro-onnx
//           soundfile), the kokoro-v1.0.onnx model, and the voices-v1.0.bin
//           file. Both assets come from thewh1teagle/kokoro-onnx GitHub
//           releases.
//   F5:     python3 with f5-tts (pip install f5-tts). The F5-TTS model
//           (~1.5 GB) downloads automatically from HuggingFace on first
//           run. Reference audio + transcript are expected at
//           scripts/voice-refs/don-reference.m4a and don-reference.txt.
//   Piper:  piper on $PATH plus an .onnx voice model.
//
// Usage
// -----
//   # Kokoro (default — all languages):
//   node scripts/render-post-audio.mjs blog/<slug> \
//     --kokoro-model /path/to/kokoro-v1.0.onnx \
//     --kokoro-voices /path/to/voices-v1.0.bin
//
//   # F5 for English + Kokoro for other languages in one command:
//   node scripts/render-post-audio.mjs --all --engine f5 \
//     --kokoro-model ... --kokoro-voices ...
//
//   # F5 English only (skip Kokoro deps):
//   node scripts/render-post-audio.mjs --all --engine f5 --languages en
//
//   # Piper fallback:
//   node scripts/render-post-audio.mjs blog/<slug> \
//     --engine piper --model /path/to/voice.onnx
//
// Writes
// ------
//   <post>/audio.mp3   — the narration
//   <post>/audio.json  — the manifest the runtime fetches
//   Then wire up the post's #listen-btn with data-audio-src="audio.mp3"
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
// Options that take a value — their value must be skipped when
// collecting positional args, otherwise paths get mistaken for posts.
const VALUED = new Set([
  '--engine', '--model', '--speaker',
  '--kokoro-model', '--kokoro-voices', '--kokoro-voice',
  '--kokoro-speed', '--kokoro-lang',
  '--kokoro-voice-es', '--kokoro-voice-fr', '--kokoro-voice-it',
  '--kokoro-voice-pt', '--kokoro-voice-hi', '--kokoro-voice-ja',
  '--kokoro-voice-zh',
  '--languages',
  '--manifest',
  '--pronunciation',
  '--f5-ref-audio', '--f5-ref-text', '--f5-speed', '--f5-nfe-step',
  '--f5-cfg-strength', '--f5-device',
  // F5 multilingual: which languages F5 voice-cloning handles (default
  // en), plus per-language reference + checkpoint overrides. The base
  // English voice uses the stock F5TTS model; Spanish routes through a
  // fine-tuned checkpoint (e.g. jpgallegoar/F5-Spanish) with Don's
  // Spanish reference clip.
  '--f5-languages',
  '--f5-ckpt', '--f5-vocab', '--f5-model-name',
  '--f5-ref-audio-es', '--f5-ref-text-es',
  '--f5-ckpt-es', '--f5-vocab-es', '--f5-model-name-es',
  '--source-lang',
]);
const flags = new Set(args.filter((a) => a.startsWith('--') && !VALUED.has(a)));
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) {
    if (VALUED.has(a)) i++; // skip its value
    continue;
  }
  positional.push(a);
}
const optVal = (name) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : null;
};
// Let the operator override which Python interpreter we shell out
// to for the Kokoro / F5 / translator helpers. On GitHub Codespaces
// the default `python3` points at a bleeding-edge 3.14 from linuxbrew
// where pydantic-core can't build, while the managed 3.12 that has
// f5-tts actually installed lives at `python3.12`. Any environment
// with a mismatch between what pip installed into and what the shell
// resolves `python3` to can be fixed with `PYTHON=python3.12 node …`.
const PYTHON_BIN = process.env.PYTHON || 'python3';

const engine = (optVal('--engine') || 'kokoro').toLowerCase();
if (!['kokoro', 'piper', 'f5'].includes(engine)) fail(`Unknown --engine "${engine}"; must be kokoro, piper, or f5.`);

// Languages to render per post. "en" is the source language;
// additional BCP-47 language codes (es, fr, it, pt, zh, etc.)
// trigger a translation pass via scripts/lib/translate.py before
// the TTS step. Output files are named audio.mp3/json for English
// (backward compat) and audio.<lang>.mp3/json for every other
// language. Default is "en" alone; pass --languages explicitly to
// render only a specific subset (useful for incremental re-renders
// that skip languages already on disk).
const languages = (optVal('--languages') || 'en')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

// Piper-mode inputs
const model   = optVal('--model');
const speaker = optVal('--speaker') || '0';

// Kokoro-mode inputs
const kokoroModel  = optVal('--kokoro-model');
const kokoroVoices = optVal('--kokoro-voices');
const kokoroVoice  = optVal('--kokoro-voice') || 'am_michael';
const kokoroSpeed  = optVal('--kokoro-speed') || '1.0';
const kokoroLang   = optVal('--kokoro-lang')  || 'en-us';

// Per-language Kokoro voice + phonemizer tag. Picks a soft male voice
// where one exists (to match the English am_fenrir character), falling
// back to the best-rated voice in that language otherwise. Override
// per language via --kokoro-voice-<lang>; --kokoro-voice still wins
// for English. Tags are what Kokoro's espeak phonemizer expects.
const LANG_VOICE = {
  en: kokoroVoice,                // inherits --kokoro-voice
  es: optVal('--kokoro-voice-es') || 'em_alex',
  fr: optVal('--kokoro-voice-fr') || 'ff_siwis',
  it: optVal('--kokoro-voice-it') || 'im_nicola',
  pt: optVal('--kokoro-voice-pt') || 'pm_alex',
  hi: optVal('--kokoro-voice-hi') || 'hm_omega',
  ja: optVal('--kokoro-voice-ja') || 'jm_kumo',
  zh: optVal('--kokoro-voice-zh') || 'zm_yunxi',
};
const LANG_KOKORO_TAG = {
  en: 'en-us', es: 'es', fr: 'fr-fr', it: 'it',
  pt: 'pt-br', hi: 'hi', ja: 'ja', zh: 'cmn',
};

// F5-TTS inputs (voice cloning — English only for now; F5's multilingual
// support is limited compared to Kokoro, and the point of F5 on this
// site is specifically "Don's English voice"). Reference audio + text
// transcript live in scripts/voice-refs/ by default.
//
// Defaults tuned after first-listen feedback on Don's own voice:
//   speed=0.9          — reads a touch slower than the reference pace,
//                        which tended to rush. Tweakable via --f5-speed.
//   nfe-step=48        — bumped from 32 to reduce "reference bleed"
//                        (where F5-TTS echoes phrases from the ref
//                        transcript when they overlap content phrases
//                        — e.g. the reservations post repeating
//                        "this post breaks down…"). Costs ~50% more
//                        compute per chunk but noticeably cleaner.
//   cfg-strength=3     — same rationale; stronger classifier-free
//                        guidance keeps the model closer to gen_text
//                        and away from the reference.
const f5RefAudio = optVal('--f5-ref-audio') || 'scripts/voice-refs/don-reference.m4a';
const f5RefText  = optVal('--f5-ref-text')  || 'scripts/voice-refs/don-reference.txt';
// 0.75 default after listener feedback that 0.9 produced rushed output
// (~240 wpm vs. the ~150 wpm of natural narration). F5's speed scalar
// is relative to the reference clip, but its internal pacing tends to
// drift fast; pulling the scalar down anchors it back toward natural
// audiobook cadence. Override with --f5-speed.
const f5Speed    = optVal('--f5-speed')     || '0.75';
const f5NfeStep  = optVal('--f5-nfe-step')  || '48';
const f5CfgStrength = optVal('--f5-cfg-strength') || '3';
const f5Device   = optVal('--f5-device')    || '';

// Which languages the F5 voice-cloning engine handles. Everything not
// in this list falls back to Kokoro (with that language's catalog
// voice). Default: English only. Pass --f5-languages en,es once Don's
// Spanish reference clip + the F5-Spanish checkpoint are in place so
// the Spanish narration is *his* voice instead of Kokoro's em_alex.
const f5Languages = (optVal('--f5-languages') || 'en')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

// Resolve the per-language F5 reference + checkpoint. English uses the
// stock F5TTS base model (no ckpt override needed) with Don's English
// reference. Any other language needs (a) its own reference clip of
// Don speaking that language and (b) a checkpoint that knows the
// language — the base model only really knows English + Chinese, so
// Spanish points at a fine-tune (jpgallegoar/F5-Spanish) via
// --f5-ckpt-es / --f5-vocab-es. Falls back to the don-reference.<lang>
// naming convention so a fully-provisioned voice-refs/ dir "just works".
function f5ConfigFor(lang) {
  if (lang === 'en') {
    return {
      refAudio:  f5RefAudio,
      refText:   f5RefText,
      ckpt:      optVal('--f5-ckpt')       || '',
      vocab:     optVal('--f5-vocab')      || '',
      modelName: optVal('--f5-model-name') || '',
    };
  }
  return {
    refAudio:  optVal(`--f5-ref-audio-${lang}`) || `scripts/voice-refs/don-reference.${lang}.m4a`,
    refText:   optVal(`--f5-ref-text-${lang}`)  || `scripts/voice-refs/don-reference.${lang}.txt`,
    ckpt:      optVal(`--f5-ckpt-${lang}`)       || '',
    vocab:     optVal(`--f5-vocab-${lang}`)      || '',
    modelName: optVal(`--f5-model-name-${lang}`) || '',
  };
}

// Output-file naming. The page's SOURCE language is the unsuffixed
// default (audio.mp3 / audio.json) — that's what data-audio-src points
// at and what plays by default. Every other language gets a suffix
// (audio.<lang>.mp3). For English pages sourceLang==='en', so this is
// identical to the legacy behavior; for /es/ pages the native Spanish
// lands at audio.mp3 instead of being mislabeled as the "en" slot.
function audioName(lang, sourceLang, ext) {
  return lang === sourceLang ? `audio.${ext}` : `audio.${lang}.${ext}`;
}

const dryRun = flags.has('--dry-run');
if (!dryRun) {
  if (!which('ffmpeg')) fail('`ffmpeg` not found on PATH.');
  if (engine === 'piper') {
    if (!model) fail('--model <path/to/voice.onnx> is required for piper engine.');
    if (!fs.existsSync(model)) fail(`Piper model not found at ${model}`);
    if (!which('piper')) fail('`piper` not found on PATH. Install from https://github.com/rhasspy/piper/releases');
  } else if (engine === 'kokoro') {
    if (!kokoroModel)  fail('--kokoro-model <path/to/kokoro-v1.0.onnx> is required.');
    if (!kokoroVoices) fail('--kokoro-voices <path/to/voices-v1.0.bin> is required.');
    if (!fs.existsSync(kokoroModel))  fail(`Kokoro model not found at ${kokoroModel}`);
    if (!fs.existsSync(kokoroVoices)) fail(`Kokoro voices not found at ${kokoroVoices}`);
    if (!which('python3')) fail('`python3` not found on PATH.');
  } else if (engine === 'f5') {
    if (!which('python3')) fail('`python3` not found on PATH. Install Python 3.10+.');
    // Quiet import check so the user gets a friendly error if pip install f5-tts hasn't run.
    const probe = spawnSync(PYTHON_BIN, ['-c', 'import f5_tts'], { stdio: 'pipe' });
    if (probe.status !== 0) {
      fail(`\`f5-tts\` not importable from \`${PYTHON_BIN}\`. Either:\n` +
           `  1. Install it into that interpreter:  ${PYTHON_BIN} -m pip install --break-system-packages f5-tts\n` +
           `  2. Or point the script at a different Python that already has it:\n` +
           `       PYTHON=python3.12 node scripts/render-post-audio.mjs --engine f5 ...`);
    }
    // Verify a reference clip exists for every requested language that
    // F5 is set to clone. A non-en F5 language also needs its
    // fine-tuned checkpoint (the base model only knows en + zh).
    for (const lang of languages) {
      if (!f5Languages.includes(lang)) continue;
      const cfg = f5ConfigFor(lang);
      const refAudioPath = path.resolve(repoRoot, cfg.refAudio);
      const refTextPath  = path.resolve(repoRoot, cfg.refText);
      if (!fs.existsSync(refAudioPath)) fail(`F5 ${lang} reference audio not found at ${refAudioPath}`);
      if (!fs.existsSync(refTextPath))  fail(`F5 ${lang} reference transcript not found at ${refTextPath}`);
      if (lang !== 'en' && !cfg.ckpt) {
        fail(`F5 ${lang} needs a fine-tuned checkpoint — pass --f5-ckpt-${lang} (and --f5-vocab-${lang}). ` +
             `The base model only speaks English + Chinese.`);
      }
      if (cfg.ckpt && !fs.existsSync(path.resolve(repoRoot, cfg.ckpt))) {
        fail(`F5 ${lang} checkpoint not found at ${path.resolve(repoRoot, cfg.ckpt)}`);
      }
    }
    // Any requested language NOT cloned by F5 falls back to Kokoro, so
    // we need Kokoro's model + voices for those.
    const needsKokoro = languages.some((l) => !f5Languages.includes(l));
    if (needsKokoro) {
      if (!kokoroModel || !kokoroVoices) {
        fail('F5 clones --f5-languages (default en); other languages still use Kokoro — ' +
             'pass --kokoro-model and --kokoro-voices too, widen --f5-languages, or narrow --languages.');
      }
      if (!fs.existsSync(kokoroModel))  fail(`Kokoro model not found at ${kokoroModel}`);
      if (!fs.existsSync(kokoroVoices)) fail(`Kokoro voices not found at ${kokoroVoices}`);
    }
  }
}

// Three ways to specify what to render:
//   --manifest <path>  : read data/article-audio.json (or any compatible
//                        spec file) and render every declared piece. The
//                        manifest is the source of truth for the studio-
//                        audio rollout — see docs/audio-pipeline.md.
//   --all              : walk blog/ + blog/drafts/ for every page that
//                        already has id="listen-btn" markup. Predates
//                        the manifest; covers blog only.
//   <positional paths> : render just those specific post directories.
//
// The three are additive — pass any combination, the targets get deduped.
const manifestPath = optVal('--manifest');
const targetsFromManifest = manifestPath ? loadManifestTargets(manifestPath) : [];
const targetsFromAll = flags.has('--all') ? findPostsWithListenBtn() : [];
const allTargets = [...new Set([...targetsFromAll, ...targetsFromManifest, ...positional])];
if (!allTargets.length) fail('Pass --manifest <path>, --all, or a post directory (e.g. blog/post-slug).');

/* -------------------- pronunciation overrides -------------------- */
// Loaded lazily on first synthesizeKokoro call. The dictionary lives at
// data/audio-pronunciation.json (overridable via --pronunciation <path>).
// Format: { "global": {...}, "<lang>": { "<term>": { "say-as"|"ipa"|"spell" } } }
//
// At synthesis time we substitute terms in the chunk text BEFORE Kokoro
// sees them, so the model speaks the phonetic respelling instead of
// mangling the proper noun. The audio.<lang>.json manifest stores the
// CANONICAL text (what's on screen) — the substitution is purely for
// the audio path. The on-page highlight stays in sync because it tracks
// the canonical text through the runtime DOM.
//
// NOTE: must be declared *before* the renderPost() loop kicks off, since
// renderPost → synthesizeKokoro → applyPronunciation → loadPronunciation
// reads this binding synchronously. Hoisting it above the loop avoids a
// TDZ error from `let`.
let _pronunciationCache = null;

// Same TDZ reasoning as _pronunciationCache: course renders invoke
// extractCourseChunks → extractCourseChunksFromBody, which references
// COURSE_SKIP_CLASS_RE synchronously. The function declarations are
// hoisted but `const` is not, so the constant has to sit above the
// renderPost() entry-point loop. (The full rationale for what the regex
// skips lives next to extractCourseChunks further down the file.)
const COURSE_SKIP_CLASS_RE = /class="[^"]*(course-plain|course-mc|course-save-strip|inline-cta|further-reading|sources|course-objectives)[^"]*"/i;

for (const t of allTargets) renderPost(path.resolve(repoRoot, t));
function loadPronunciation() {
  if (_pronunciationCache !== null) return _pronunciationCache;
  const customPath = optVal('--pronunciation');
  const defaultPath = path.join(repoRoot, 'data', 'audio-pronunciation.json');
  const tryPath = customPath || defaultPath;
  if (!fs.existsSync(tryPath)) {
    _pronunciationCache = { global: {}, byLang: {} };
    return _pronunciationCache;
  }
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(tryPath, 'utf8')); }
  catch (_) {
    console.warn(`pronunciation dict at ${tryPath} not parseable — skipping overrides`);
    _pronunciationCache = { global: {}, byLang: {} };
    return _pronunciationCache;
  }
  // Strip top-level _doc / _format / _status fields — those are
  // documentation, not entries.
  const stripMeta = (obj) => {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
      if (k.startsWith('_')) continue;
      if (v && typeof v === 'object') out[k] = v;
    }
    return out;
  };
  _pronunciationCache = {
    global: stripMeta(parsed.global || {}),
    byLang: {
      en: stripMeta(parsed.en || {}),
      es: stripMeta(parsed.es || {}),
      fr: stripMeta(parsed.fr || {}),
      it: stripMeta(parsed.it || {}),
      pt: stripMeta(parsed.pt || {}),
      hi: stripMeta(parsed.hi || {}),
      ja: stripMeta(parsed.ja || {}),
      zh: stripMeta(parsed.zh || {}),
    },
  };
  return _pronunciationCache;
}

/**
 * Apply per-locale pronunciation overrides to a chunk's text. The
 * substitution is applied to a COPY for synthesis — the original
 * `text` field on the chunk (which lands in audio.<lang>.json) is
 * untouched, so the on-page highlighter still tracks the canonical
 * prose word-by-word.
 *
 * We escape regex specials in the source term, do a global case-
 * sensitive replace, and prefer locale-specific entries over global
 * entries. For acronyms with `spell: true` (GBP → "G B P"), the
 * substitution is the spaced spelling. For `say-as` (Polyface →
 * "POH-lee-face"), the substitution is the respelling. For `ipa`
 * (some terms), Kokoro doesn't support IPA inline — we fall back to
 * `say-as` if both are present, or skip the entry if only IPA is.
 *
 * `expand_first_use` (e.g. "GBP" → expand to "Google Business Profile"
 * the first time it appears, then leave subsequent occurrences) is
 * tracked per-render via a Set the caller passes in.
 */
function applyPronunciation(text, lang, expanded /* Set */) {
  const dict = loadPronunciation();
  const merged = { ...(dict.global || {}), ...(dict.byLang[lang] || {}) };
  let out = text;
  // Order entries by descending term length so multi-word entries
  // (e.g. "Google Business Profile") substitute before single-word
  // entries (e.g. "Google") that are substrings.
  const entries = Object.entries(merged).sort((a, b) => b[0].length - a[0].length);
  for (const [term, rule] of entries) {
    if (!rule || typeof rule !== 'object') continue;
    let replacement;
    if (rule.spell) {
      replacement = String(term).split('').join(' ');
    } else if (rule['say-as']) {
      replacement = rule['say-as'];
    } else if (rule.espeak) {
      replacement = rule.espeak;
    } else if (rule.ipa) {
      // Kokoro plain-text engine can't ingest raw IPA — skip rather
      // than mispronounce. Operator should add a `say-as` fallback.
      continue;
    } else {
      continue;
    }
    if (rule.expand_first_use) {
      const key = `${lang}::${term}`;
      if (!expanded.has(key)) {
        replacement = `${rule.expand_first_use} (${replacement})`;
        expanded.add(key);
      }
    }
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + escaped + '\\b', 'g');
    out = out.replace(re, replacement);
  }
  return out;
}

/**
 * Read the article-audio.json-shaped manifest and return the post
 * directory paths (repo-relative) that need rendering.
 */
function loadManifestTargets(manifestRel) {
  const p = path.resolve(repoRoot, manifestRel);
  if (!fs.existsSync(p)) fail(`--manifest path does not exist: ${p}`);
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  const SECTION_DIRS = {
    blog:        'blog',
    'es-blog':   'es/blog',
    research:    'learn/research',
    checklists:  'learn/checklists',
  };
  const out = [];
  for (const [section, dir] of Object.entries(SECTION_DIRS)) {
    const entries = m[section] || {};
    for (const [slug, spec] of Object.entries(entries)) {
      if (slug.startsWith('_')) continue;
      if (!spec || typeof spec !== 'object' || !Array.isArray(spec.languages)) continue;
      // Skip pieces marked deferred — usually because their HTML
      // structure needs a fix before chunks extract cleanly. They're
      // still in the manifest so the audit can track them; they just
      // don't render until the defer_reason is resolved.
      if (spec.status === 'deferred') {
        console.log(`[manifest] skipping ${section}/${slug}: deferred — ${spec.defer_reason || 'no reason given'}`);
        continue;
      }
      out.push(path.join(dir, slug));
    }
  }
  return out;
}

/* -------------------- main -------------------- */
function renderPost(postDir) {
  const indexPath = path.join(postDir, 'index.html');
  if (!fs.existsSync(indexPath)) fail(`${indexPath} does not exist`);
  const html = fs.readFileSync(indexPath, 'utf8');

  // Course lessons get a different chunk model than articles: the opener
  // and takeaway sections are voiced, widget sections become pause
  // markers, and the UDL plain-language alternative is excluded. See
  // extractCourseChunks() for the full contract.
  const relPath = path.relative(repoRoot, postDir).replace(/\\/g, '/');
  const isCourse = /(^|\/)(course|es\/course)\//.test(relPath);

  // The language the page's HTML is *written in*. Everything under
  // /es/ is hand-authored Spanish (course lessons, library articles);
  // the rest is English. The renderer synthesizes the source-language
  // chunks DIRECTLY (no round-trip through the machine translator), and
  // only the OTHER requested languages get translated. Before this, the
  // source was hard-assumed to be English, so rendering an /es/ page's
  // Spanish track Google-translated already-Spanish text back to itself
  // and skipped the hand translation entirely. Override with
  // --source-lang if a path ever breaks the /es/ heuristic.
  const sourceLang = (optVal('--source-lang') || (/^es\//.test(relPath) ? 'es' : 'en')).toLowerCase();

  const chunks = isCourse ? extractCourseChunks(html) : extractChunks(html);
  if (!chunks.length) fail(`No audio-eligible chunks found in ${indexPath}`);
  console.log(`[${path.basename(postDir)}] ${chunks.length} chunks${isCourse ? ' (course mode)' : ''}${sourceLang !== 'en' ? ` [source=${sourceLang}]` : ''}`);

  if (dryRun) {
    chunks.forEach((c, i) => {
      const preview = c.text.length > 90 ? c.text.slice(0, 87) + '…' : c.text;
      console.log(`  ${String(i + 1).padStart(3)}. [${c.kind}] ${preview}`);
      console.log(`       selector: ${c.selector}`);
    });
    return;
  }

  // Render once per requested language. English is synthesized from
  // the extracted chunks directly; every other language goes through
  // scripts/lib/translate.py first (document-context batched, with a
  // glossary that preserves brand + acronym terms). The chunks' kind
  // and selector are preserved so the runtime's highlight sync lines
  // up across languages.
  for (const lang of languages) {
    // Skip languages whose output MP3 + manifest are already on disk.
    // Re-invoking the translator for a completed language is expensive
    // (slow) and risky (Google's unauth endpoint will 503 under load);
    // the render should be resumable across runs without re-doing
    // completed work. Pass --force-retranslate to override.
    const mp3Name  = audioName(lang, sourceLang, 'mp3');
    const jsonName = audioName(lang, sourceLang, 'json');
    const mp3Path  = path.join(postDir, mp3Name);
    const jsonPath = path.join(postDir, jsonName);
    if (!flags.has('--force-retranslate')
        && fs.existsSync(mp3Path)
        && fs.existsSync(jsonPath)) {
      console.log(`  · skip ${lang}: ${mp3Name} already present`);
      continue;
    }

    let langChunks = chunks;
    if (lang !== sourceLang) {
      // --use-existing-translations: skip the translator call and use
      // the chunks[] already present in audio.<lang>.json. This is how
      // we ship native (hand-written or Claude-written) translations
      // without round-tripping through Google Translate. The extractor
      // still provides kind/selector/etc. metadata; we only replace
      // the `text` field per-chunk from the existing manifest.
      if (flags.has('--use-existing-translations') && fs.existsSync(jsonPath)) {
        const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const byId = new Map();
        for (const c of (existing.chunks || [])) byId.set(c.id, c);
        langChunks = chunks.map((c) => {
          const prev = byId.get(c.id);
          return prev ? { ...c, text: prev.text } : c;
        });
        console.log(`  · using existing ${lang} translations (${langChunks.length} chunks)`);
      } else {
        console.log(`  · translating ${chunks.length} chunks → ${lang}`);
        langChunks = translateChunksFor(chunks, lang);
      }
    }
    renderLanguage(postDir, langChunks, lang, sourceLang);
  }

  // Auto-commit + push each article's audio as soon as its full
  // language set is on disk, so a crash mid-bulk-render never costs
  // more than the in-flight article's worth of work. Opt-in: pass
  // --commit-per-article. Failures here log a warning but never
  // abort the run — the next article keeps rendering.
  if (flags.has('--commit-per-article') && !dryRun) {
    commitArticleAudio(postDir, sourceLang);
  }
}

/* -------------------- per-article auto-commit -------------------- */
// Stages the audio.* files for `postDir`, makes a focused commit, and
// pushes to the current branch's upstream. Best-effort: any git error
// (no upstream, push rejected, hook failure) gets logged and the
// render keeps going with the next article. The local commit still
// stands so the operator can sort it out manually later.
function commitArticleAudio(postDir, sourceLang = 'en') {
  const slug = path.relative(repoRoot, postDir);
  // Build the explicit file list rather than a glob — spawnSync with
  // an args array doesn't expand globs, and we want to be precise
  // about what we stage anyway (audio.*.mp3 + audio.*.json only,
  // no other files in the post directory).
  const filesToAdd = [];
  for (const lang of languages) {
    const mp3Name  = audioName(lang, sourceLang, 'mp3');
    const jsonName = audioName(lang, sourceLang, 'json');
    for (const name of [mp3Name, jsonName]) {
      const p = path.join(postDir, name);
      if (fs.existsSync(p)) filesToAdd.push(path.relative(repoRoot, p));
    }
  }
  if (!filesToAdd.length) {
    console.log(`  ↑ nothing to commit for ${slug}`);
    return;
  }

  const gitOpts = { cwd: repoRoot, encoding: 'utf8' };
  const add = spawnSync('git', ['add', ...filesToAdd], gitOpts);
  if (add.status !== 0) {
    console.warn(`  ⚠ git add failed for ${slug}: ${add.stderr || add.stdout}`);
    return;
  }
  // If everything we staged was already at HEAD, there's nothing
  // new to commit — skip cleanly. `git diff --cached --quiet` exits
  // 0 when staged tree matches HEAD, 1 when there's a real diff.
  const diff = spawnSync('git', ['diff', '--cached', '--quiet'], gitOpts);
  if (diff.status === 0) {
    console.log(`  ↑ no audio changes to commit for ${slug}`);
    return;
  }

  const subject = `audio: ${slug}`;
  const body = `https://claude.ai/code/session_01U1euc349u61qrXArzPm8HT`;
  const commit = spawnSync('git', ['commit', '-m', subject, '-m', body], gitOpts);
  if (commit.status !== 0) {
    console.warn(`  ⚠ git commit failed for ${slug}: ${commit.stderr || commit.stdout}`);
    return;
  }
  console.log(`  ✓ committed ${slug}`);

  // Push to the current branch's upstream. The Don-side use case is a
  // long bulk render on his Mac pushing to the cloud session's branch,
  // so we always push (no --no-push escape hatch needed yet). Two
  // network-failure retries with linear backoff cover most flakes.
  const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], gitOpts).stdout.trim();
  for (let attempt = 0; attempt < 3; attempt++) {
    const push = spawnSync('git', ['push', 'origin', branch], gitOpts);
    if (push.status === 0) {
      console.log(`  ↑ pushed ${slug} to origin/${branch}`);
      return;
    }
    const wait = 2000 * (attempt + 1);
    console.warn(`  ⚠ git push attempt ${attempt + 1} failed (retrying in ${wait}ms): ${push.stderr || ''}`);
    spawnSync('sleep', [String(wait / 1000)]);
  }
  console.warn(`  ⚠ git push gave up for ${slug} — commit is local; push manually with: git push origin ${branch}`);
}

function renderLanguage(postDir, chunks, lang, sourceLang = 'en') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `audio-render-${lang}-`));
  const segments = [];
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

  // Production-layer assets (Track 1C). Resolved once per render. The
  // chapter-sting plays at section-break boundaries; the breath sample
  // plays at sentence-end paragraph breaks. Both are optional — if the
  // file is absent, the gap stays as pure silence and the pipeline keeps
  // running unchanged. See audio/assets/README.md for the recording spec.
  const STING_PATH  = path.join(repoRoot, 'audio', 'assets', 'chapter-sting.wav');
  const BREATH_PATH = path.join(repoRoot, 'audio', 'assets', 'breath.wav');
  const useSting  = fs.existsSync(STING_PATH);
  const useBreath = fs.existsSync(BREATH_PATH);
  const BOUNDARY_CACHE = new Map();

  // Produce the WAV for the gap between `prev` and `chunk`. When an
  // asset applies, the cache key includes the boundary kind so the
  // sting-padded clip and the breath-padded clip don't collide with
  // the pure-silence clip of the same duration.
  function boundaryWav(chunk, prev, seconds) {
    if (seconds <= 0) return null;
    const isHeadingBoundary = chunk.kind === 'heading' && useSting;
    const isParaBreak = !isHeadingBoundary && useBreath
      && prev && /[.!?]$/.test(prev.text)
      && chunk.kind !== 'list' && (!prev || prev.kind !== 'list');
    if (!isHeadingBoundary && !isParaBreak) {
      return gapWav(seconds);
    }
    const kind = isHeadingBoundary ? 'sting' : 'breath';
    const key = `${kind}_${seconds.toFixed(3)}`;
    if (BOUNDARY_CACHE.has(key)) return BOUNDARY_CACHE.get(key);
    const out = path.join(tmpDir, `_${key}.wav`);
    if (isHeadingBoundary) {
      // Sting-leading: [sting][silence_filler]. Filler covers whatever
      // duration remains; if the sting itself is longer than the gap,
      // amix/concat caps it to the boundary duration.
      renderStingGap(out, STING_PATH, seconds);
    } else {
      // Breath-centered: [silence_pre][breath][silence_post]. The breath
      // sits ~40 % into the gap so the listener hears the previous
      // sentence settle, then the inhale, then the leading edge of
      // the next sentence.
      renderBreathGap(out, BREATH_PATH, seconds);
    }
    BOUNDARY_CACHE.set(key, out);
    return out;
  }

  // Gap values tuned for natural "breath" spots. Bumped ~50% from the
  // first-render values after listener feedback that the playback felt
  // rushed and breathless: 0.35s between body sentences reads as a UI
  // beep, not a human pause. Real narrators leave 0.7-1.0s at paragraph
  // breaks and ~1.2-1.5s at section transitions. Tune by ear on Don's
  // cloned voice — the cloned timbre is unforgiving of rushed pacing.
  function gapBefore(chunk, prev) {
    if (!prev) return 0;
    // Course-mode chunk kinds — opener / wrap / widget-pause — get
    // their own gap timing. Opener and wrap chunks read at a slightly
    // slower pace than body; the gap between them is longer than
    // sentence-end so the listener feels the lesson framing settle.
    if (chunk.kind === 'opener' && prev.kind !== 'opener')   return 1.20; // entering opener
    if (prev.kind === 'opener' && chunk.kind !== 'opener')   return 1.60; // leaving opener for body
    if (chunk.kind === 'opener')  return 0.85;                              // opener-to-opener
    if (chunk.kind === 'wrap' && prev.kind !== 'wrap')       return 1.70; // entering wrap (closes the lesson)
    if (chunk.kind === 'wrap')    return 0.80;                              // wrap-to-wrap
    // widget-pause: the chunk itself is silent (no synth). Lead-in
    // gap is a real beat so the listener registers the prior thought
    // before the widget surfaces. Trailing gap is handled by the
    // runtime when the operator commits the widget.
    if (chunk.kind === 'widget-pause') return 0.65;
    if (prev.kind === 'widget-pause')  return 0.55;
    if (chunk.kind === 'heading') return 1.50;           // section break — feels like a chapter
    if (chunk.kind === 'figure')  return 1.10;           // before graphic
    if (prev.kind === 'heading')  return 0.95;           // after heading
    if (prev.kind === 'figure')   return 1.00;           // after graphic
    if (chunk.kind === 'list' && prev.kind === 'list') return 0.50;
    if (chunk.kind === 'quote' || prev.kind === 'quote') return 1.00;
    const prevEndsSentence = /[.!?]$/.test(prev.text);
    return prevEndsSentence ? 0.80 : 0.55;
  }

  // For F5-cloned languages we log the reference voice name (not a
  // Kokoro catalog ID) into the manifest so downstream consumers can
  // tell who's narrating. Languages F5 doesn't handle still use
  // Kokoro's catalog voice.
  const useF5 = engine === 'f5' && f5Languages.includes(lang);
  const f5cfg = useF5 ? f5ConfigFor(lang) : null;
  const voice = useF5
    ? ('f5:' + path.basename(path.resolve(repoRoot, f5cfg.refAudio)))
    : (LANG_VOICE[lang] || LANG_VOICE.en);
  const kokoroTag = LANG_KOKORO_TAG[lang] || 'en-us';

  // Batch-synthesize every chunk's raw WAV up front. For Kokoro this
  // keeps the 300 MB model in memory across chunks instead of reloading
  // per call. For Piper each utterance is cheap enough that we still
  // shell out in a loop.
  const rawDir = path.join(tmpDir, 'raw');
  fs.mkdirSync(rawDir, { recursive: true });
  // F5-TTS voice-clones the languages listed in --f5-languages (default
  // en). For any other language we fall back to Kokoro with that
  // language's mapped voice + tag, so a bilingual render still works
  // even when only some languages have a cloned voice provisioned.
  if (useF5) {
    synthesizeF5(chunks, rawDir, f5cfg, lang);
  } else if (engine === 'kokoro' || engine === 'f5') {
    synthesizeKokoro(chunks, rawDir, { voice, lang: kokoroTag });
  } else {
    synthesizePiper(chunks, rawDir);
  }

  // Lesson Mode (Phase 3.4) — optional hand-recorded opener / wrap.
  // Don records audio.opener.<lang>.{wav,mp3} and audio.wrap.<lang>.{wav,
  // mp3} alongside the lesson HTML. When present, they prepend / append
  // the body narration with a small gap. Sidecar .txt file lets him
  // expose the script as the caption strip (read by listen.js for the
  // "Don is saying:" line). All three files are independently optional;
  // any missing one no-ops, and the chain still runs end-to-end.
  const openerAsset = findRecordedAsset(postDir, 'opener', lang);
  const wrapAsset   = findRecordedAsset(postDir, 'wrap',   lang);
  const openerGapSec = openerAsset ? 0.45 : 0;  // settle before body
  const wrapGapSec   = wrapAsset   ? 0.70 : 0;  // breath into wrap
  let cursor = 0;
  if (openerAsset) {
    const openerWav = openerAsset.wav;
    const dur = wavDuration(openerWav);
    segments.push(openerWav);
    manifestChunks.push({
      id: 'opener',
      kind: 'opener-recorded',
      selector: null,
      text: openerAsset.script || '',
      start: 0,
      end:   round(dur),
      recorded: true,
    });
    cursor = dur;
    if (openerGapSec > 0) {
      segments.push(gapWav(openerGapSec));
      cursor += openerGapSec;
    }
  }
  chunks.forEach((chunk, i) => {
    const gap = gapBefore(chunk, chunks[i - 1]);

    // Widget-pause chunks (Lesson Mode) — synthetic zero-duration
    // markers. No raw audio synthesized for them; the runtime player
    // halts on encountering one and waits for widget commit or
    // manual resume. Record the boundary in the manifest plus the
    // widget metadata so the runtime knows what to wait for.
    if (chunk.kind === 'widget-pause') {
      if (gap > 0) segments.push(gapWav(gap));
      const start = cursor + gap;
      cursor = start;
      const entry = {
        id: i,
        kind: 'widget-pause',
        selector: chunk.selector,
        start: round(start),
        end:   round(start),
      };
      if (chunk.widget)     entry.widget = chunk.widget;
      if (chunk.contextKey) entry.contextKey = chunk.contextKey;
      if (chunk.label)      entry.label = chunk.label;
      manifestChunks.push(entry);
      return;
    }

    const rawWav = path.join(rawDir, `c${String(i).padStart(4, '0')}.wav`);
    const wav = path.join(tmpDir, `t${String(i).padStart(4, '0')}.wav`);
    // F5 generates real breath sounds at chunk boundaries — stripping
    // them produces the rushed, breathless feel listeners complain
    // about. Kokoro's boundaries are dead silence we want gone, so it
    // keeps the trim.
    if (useF5) {
      fs.copyFileSync(rawWav, wav);
    } else {
      trimSilence(rawWav, wav);
    }
    const dur = wavDuration(wav);
    if (gap > 0) {
      // Lesson Mode + Track 1C — pick the right buffer for the gap:
      // pure silence by default, but chapter-sting at heading
      // transitions and breath-sample at paragraph breaks when those
      // assets are on disk. Asset-absent path returns the same silence
      // gapWav() would.
      const boundary = boundaryWav(chunk, chunks[i - 1], gap);
      if (boundary) segments.push(boundary);
    }
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
  });

  // Lesson Mode (Phase 3.4) — append the wrap recording, if present.
  if (wrapAsset) {
    if (wrapGapSec > 0) {
      segments.push(gapWav(wrapGapSec));
      cursor += wrapGapSec;
    }
    const wrapWav = wrapAsset.wav;
    const dur = wavDuration(wrapWav);
    segments.push(wrapWav);
    manifestChunks.push({
      id: 'wrap',
      kind: 'wrap-recorded',
      selector: null,
      text: wrapAsset.script || '',
      start: round(cursor),
      end:   round(cursor + dur),
      recorded: true,
    });
    cursor += dur;
  }

  // The source language keeps the unsuffixed audio.mp3 / audio.json
  // names (what data-audio-src points at); other languages get
  // audio.<lang>.mp3 / audio.<lang>.json alongside. For English pages
  // sourceLang==='en', so this matches the legacy convention exactly.
  const mp3Name  = audioName(lang, sourceLang, 'mp3');
  const jsonName = audioName(lang, sourceLang, 'json');
  const mp3Out = path.join(postDir, mp3Name);

  // Single-pass concat → MP3 via the concat *filter* (not the demuxer).
  // The filter regenerates timestamps from scratch, sidestepping the
  // DTS-monotonicity errors that ffmpeg 8.x raises when the demuxer
  // stitches a long sequence of same-rate WAVs. Each segment is a
  // separate -i input; the filter merges them and libmp3lame writes
  // the final file in one shot. Fewer disk writes, no DTS warnings.
  const ffmpegArgs = ['-y'];
  for (const seg of segments) ffmpegArgs.push('-i', seg);
  const concatFilter = `concat=n=${segments.length}:v=0:a=1[out]`;
  ffmpegArgs.push(
    '-filter_complex', concatFilter,
    '-map', '[out]',
    '-codec:a', 'libmp3lame',
    '-q:a', '4',
    mp3Out,
  );
  run('ffmpeg', ffmpegArgs);

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    engine: engine,
    // Model name logged into the manifest. F5-cloned languages report
    // their reference audio; everything else reports its TTS model
    // path. Null-safe so an F5-only run without --kokoro-model doesn't
    // crash here.
    model: (() => {
      const src =
        engine === 'piper' ? model :
        useF5              ? f5cfg.refAudio :
                             kokoroModel;
      return src ? path.basename(src) : 'unknown';
    })(),
    voice,
    language: lang,
    total: round(cursor),
    chunks: manifestChunks,
  };
  fs.writeFileSync(path.join(postDir, jsonName), JSON.stringify(manifest, null, 2));

  // Cleanup tmp dir. fs.rmSync is Node 14.14+; older Node (Colab's
  // apt-installed default) uses rmdirSync. Fall back through the
  // options, and swallow any failure — a stale tmp dir in /tmp is a
  // non-fatal leak, the output MP3 + manifest are already safely
  // written before we get here.
  if (!flags.has('--keep-tmp')) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); }
    catch (_) {
      try { fs.rmdirSync(tmpDir, { recursive: true }); }
      catch (_) {
        try { spawnSync('rm', ['-rf', tmpDir]); } catch (_) {}
      }
    }
  }
  console.log(`  ✓ ${path.relative(repoRoot, mp3Out)}  (${manifest.total.toFixed(1)}s)  voice=${voice}`);
}

/* -------------------- translation -------------------- */
function translateChunksFor(chunks, targetLang) {
  const helper = path.join(repoRoot, 'scripts', 'lib', 'translate.py');
  const payload = JSON.stringify({
    target: targetLang,
    chunks: chunks.map((c) => ({ id: c.id !== undefined ? c.id : chunks.indexOf(c), text: c.text })),
  });
  const proc = spawnSync(PYTHON_BIN, [helper], {
    input: payload,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'],
    maxBuffer: 16 * 1024 * 1024,
  });
  if (proc.status !== 0) {
    fail(`translate helper exited ${proc.status}: ${proc.stdout || '(no stdout)'}`);
  }
  let parsed;
  try { parsed = JSON.parse(proc.stdout); }
  catch (e) { fail(`translate helper returned non-JSON: ${proc.stdout.slice(0, 200)}`); }
  if (!parsed.ok) fail(`translate helper failed: ${parsed.error}`);
  // Merge translated text back onto the original chunks so kind +
  // selector survive. Index by id so reordering by the translator
  // (shouldn't happen, but defensive) doesn't scramble the manifest.
  const byId = new Map(parsed.chunks.map((c) => [c.id, c.text]));
  return chunks.map((c, i) => ({
    ...c,
    text: byId.has(i) ? byId.get(i) : c.text,
  }));
}

/* -------------------- synthesis dispatch -------------------- */

function synthesizeKokoro(chunks, outDir, opts = {}) {
  // Spawn the Python helper once, stream in the chunk list as JSON.
  // Progress lines on stderr are relayed so the operator sees which
  // chunk is being synthesized; final JSON on stdout is ignored here.
  // voice + lang are per-language so a multilingual render uses the
  // right Kokoro voice for each language without reloading the model.
  const helper = path.join(repoRoot, 'scripts', 'lib', 'kokoro_render.py');
  const args = [
    helper,
    '--model',      kokoroModel,
    '--voices',     kokoroVoices,
    '--voice',      opts.voice || kokoroVoice,
    '--speed',      kokoroSpeed,
    '--lang',       opts.lang  || kokoroLang,
    '--output-dir', outDir,
  ];
  // Apply per-locale pronunciation overrides ONLY to what Kokoro hears.
  // The original chunk.text — which lands in audio.<lang>.json and
  // drives the on-page highlight — stays canonical. Acronym expansion
  // (`expand_first_use`) is tracked across the whole render via the
  // shared Set so "GBP (Google Business Profile)" only appears once.
  const expanded = new Set();
  const phoneticChunks = chunks.map((c, i) => ({
    id: i,
    // Widget-pause chunks (Lesson Mode) carry no spoken text. The
    // Python helper writes a silent placeholder WAV when text is
    // empty, keeping the c{id}.wav numbering contiguous; the
    // renderPost loop returns early for widget-pause chunks so the
    // placeholder is never concatenated into the output.
    text: c.kind === 'widget-pause'
      ? ''
      : applyPronunciation(c.text, (opts.lang || 'en-us').split('-')[0], expanded),
  }));
  const payload = JSON.stringify({ chunks: phoneticChunks });
  const proc = spawnSync(PYTHON_BIN, args, {
    input: payload,
    encoding: 'utf8',
    // Piped stderr shows progress; show it live by writing through.
    stdio: ['pipe', 'pipe', 'inherit'],
    maxBuffer: 16 * 1024 * 1024,
  });
  if (proc.status !== 0) {
    fail(`kokoro helper failed (${proc.status}): ${proc.stdout || '(no stdout)'}`);
  }
}

function synthesizeF5(chunks, outDir, cfg = null, lang = 'en') {
  // Spawn the F5-TTS Python helper once, stream the chunk list as
  // JSON. Model + vocoder stay in RAM across all chunks of the post.
  // Reference audio + transcript are passed via CLI args (they're
  // constant across chunks). `cfg` (from f5ConfigFor) carries the
  // per-language reference + optional fine-tuned checkpoint; falls back
  // to the English defaults when omitted.
  const refAudio  = cfg && cfg.refAudio ? cfg.refAudio : f5RefAudio;
  const refText   = cfg && cfg.refText  ? cfg.refText  : f5RefText;
  const ckptFile  = cfg && cfg.ckpt     ? cfg.ckpt     : '';
  const vocabFile = cfg && cfg.vocab    ? cfg.vocab    : '';
  const modelName = cfg && cfg.modelName ? cfg.modelName : '';

  const refAudioAbs = path.resolve(repoRoot, refAudio);
  if (!fs.existsSync(refAudioAbs)) {
    fail(`F5 reference audio not found: ${refAudioAbs}\n` +
         `  (record it, or pass --f5-ref-audio${cfg ? '-<lang>' : ''} <path>)`);
  }

  const helper = path.join(repoRoot, 'scripts', 'lib', 'f5_render.py');
  const args = [
    helper,
    '--ref-audio',  refAudioAbs,
    '--ref-text',   path.resolve(repoRoot, refText),
    '--speed',         f5Speed,
    '--nfe-step',      f5NfeStep,
    '--cfg-strength',  f5CfgStrength,
    '--output-dir',    outDir,
  ];
  // A fine-tuned checkpoint (e.g. F5-Spanish) needs its own weights +
  // vocab; the base English model uses F5TTS's bundled defaults.
  if (ckptFile)  { args.push('--ckpt-file',  path.resolve(repoRoot, ckptFile)); }
  if (vocabFile) { args.push('--vocab-file', path.resolve(repoRoot, vocabFile)); }
  if (modelName) { args.push('--model-name', modelName); }
  if (f5Device) { args.push('--device', f5Device); }
  const payload = JSON.stringify({
    // Apply pronunciation overrides to the text F5 hears (same shape as
    // synthesizeKokoro). audio.<lang>.json keeps the canonical spelling
    // so the on-page highlight still matches the rendered text; only
    // the synthesis input is phoneticized.
    chunks: (() => {
      const expanded = new Set();
      return chunks.map((c, i) => ({
        id: i,
        // Widget-pause: see synthesizeKokoro for rationale.
        text: c.kind === 'widget-pause'
          ? ''
          : applyPronunciation(c.text, lang, expanded),
      }));
    })(),
  });
  const proc = spawnSync(PYTHON_BIN, args, {
    input: payload,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'],
    maxBuffer: 16 * 1024 * 1024,
  });
  if (proc.status !== 0) {
    fail(`f5 helper failed (${proc.status}): ${proc.stdout || '(no stdout)'}`);
  }
}

function synthesizePiper(chunks, outDir) {
  chunks.forEach((chunk, i) => {
    const out = path.join(outDir, `c${String(i).padStart(4, '0')}.wav`);
    // Widget-pause: see synthesizeKokoro for rationale.
    runPiper(chunk.kind === 'widget-pause' ? '' : chunk.text, out);
    process.stdout.write(`  · chunk ${i + 1}/${chunks.length}\r`);
  });
  console.log('');
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

// Look for a hand-recorded opener / wrap sidecar in the lesson dir.
// Tries .wav, .mp3, .m4a, .flac in that order. Returns { wav, script }
// where `wav` is a normalized 22050 mono WAV staged in a tmp file for
// concat compatibility, and `script` is the optional caption text
// from the sidecar .txt (read for the audio.json manifest). Returns
// null when no asset is found — the pipeline falls back to body-only
// narration with no opener / wrap.
//
// Per-locale resolution: looks for audio.<role>.<lang>.{ext} (e.g.,
// audio.opener.en.wav). EN is the canonical record; other locales
// are independent — Don records es separately. No fallback across
// locales: if audio.opener.fr.wav doesn't exist, the FR rendering
// just has no opener, even when EN does. The brand-recognition
// value of "Don's voice on the opener" doesn't transfer across
// languages he doesn't speak.
function findRecordedAsset(postDir, role, lang) {
  const exts = ['wav', 'mp3', 'm4a', 'flac'];
  let foundSrc = null;
  for (const ext of exts) {
    const p = path.join(postDir, `audio.${role}.${lang}.${ext}`);
    if (fs.existsSync(p)) { foundSrc = p; break; }
  }
  if (!foundSrc) return null;

  // Normalize to a 22050 mono WAV in a tmp file so the concat filter
  // accepts the stream alongside the Kokoro outputs (same sample rate,
  // same channel layout). Original asset is untouched.
  const tmp = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), `recorded-${role}-${lang}-`)),
    `${role}.wav`
  );
  run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', foundSrc,
    '-ar', '22050', '-ac', '1',
    '-c:a', 'pcm_s16le',
    tmp,
  ]);

  // Optional sidecar .txt holds the spoken script. Used for the
  // audio.json text field so the runtime's caption strip ("Don is
  // saying:") can show the line during opener / wrap playback.
  // Skipped silently if absent.
  const txtPath = path.join(postDir, `audio.${role}.${lang}.txt`);
  let script = '';
  if (fs.existsSync(txtPath)) {
    try { script = fs.readFileSync(txtPath, 'utf8').trim(); } catch (_) {}
  }
  return { wav: tmp, script };
}

// Render the heading-boundary gap: chapter sting on the leading edge,
// silence filler to total `seconds`. The sting is resampled to 22050 mono
// to match the silence buffers' format; `apad` extends a short sting to
// the target duration, `atrim` caps a long sting at the target.
function renderStingGap(outWav, stingPath, seconds) {
  const total = seconds.toFixed(3);
  const filter = [
    `[0:a] aresample=22050,aformat=channel_layouts=mono,apad=whole_dur=${total},atrim=end=${total},asetpts=PTS-STARTPTS [out]`,
  ].join(';');
  run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', stingPath,
    '-filter_complex', filter,
    '-map', '[out]',
    '-c:a', 'pcm_s16le',
    outWav,
  ]);
}

// Render the paragraph-break gap: silence_pre + breath + silence_post,
// totaling `seconds`. The breath sits ~40 % through the gap so the
// previous sentence has time to settle before the inhale. If the breath
// is longer than the gap, it's trimmed to fit (rare — breath samples
// should be ≤0.35 s per the asset README).
function renderBreathGap(outWav, breathPath, seconds) {
  const total = seconds;
  const preFrac = 0.40;
  const breathProbe = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    breathPath,
  ], { encoding: 'utf8' });
  const breathDur = Math.min(parseFloat(breathProbe.stdout) || 0.30, total * 0.85);
  const preSec  = Math.max(0, (total - breathDur) * preFrac).toFixed(3);
  const postSec = Math.max(0, total - parseFloat(preSec) - breathDur).toFixed(3);
  const filter = [
    `[0:a] aresample=22050,aformat=channel_layouts=mono,atrim=end=${breathDur.toFixed(3)},asetpts=PTS-STARTPTS [breath]`,
    `aevalsrc=0:d=${preSec}:s=22050:c=mono [pre]`,
    `aevalsrc=0:d=${postSec}:s=22050:c=mono [post]`,
    `[pre][breath][post] concat=n=3:v=0:a=1 [out]`,
  ].join(';');
  run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', breathPath,
    '-filter_complex', filter,
    '-map', '[out]',
    '-c:a', 'pcm_s16le',
    outWav,
  ]);
}

// Strip leading + trailing silence from a WAV. Done in two passes
// (strip-leading, reverse, strip-leading, reverse) rather than a
// single silenceremove call: with stop_periods=1, ffmpeg truncates
// at the first mid-utterance pause it sees, because its state
// machine treats the first qualifying silence period as "end of
// audio". The reverse + strip-leading + reverse pattern is the
// canonical workaround — it handles only leading silence each pass,
// leaving internal pauses between sentences intact.
//
// Parameters tuned conservatively against Kokoro output so trailing
// consonant tails (like the "-er" in "never") and quiet onsets (the
// "I'" in "I'm going") are never cut:
//   threshold=-60dB: Kokoro's noise floor sits around -70dB, and
//     quietest speech syllables are ~-45dB. -60dB is safely between.
//   start_duration=0.03: as soon as 30ms of non-silence is seen the
//     filter stops trimming. Longer durations can chew into real
//     speech syllables (they're often shorter than 0.1s).
function trimSilence(inputWav, outWav) {
  const flt = 'silenceremove=start_periods=1:start_duration=0.03:start_threshold=-60dB:detection=rms,' +
              'areverse,' +
              'silenceremove=start_periods=1:start_duration=0.03:start_threshold=-60dB:detection=rms,' +
              'areverse';
  run('ffmpeg', ['-y', '-i', inputWav, '-af', flt, '-c:a', 'pcm_s16le', outWav]);
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
  // — usually on an <article> in blog/research articles, sometimes on
  // a <div> in long-form structured pieces (checklists). Either is
  // fine; the runtime player (assets/js/listen.js) uses
  // document.getElementById('post-body') without caring about element
  // type, so the extractor matches that flexibility.
  let bodyMatch = /<(article|div|main|section)[^>]*\bid="post-body"[^>]*>([\s\S]*?)<\/\1>/i.exec(html);
  if (!bodyMatch) {
    // Fallback: tolerant scan that finds the open tag and the matching
    // close, useful when the close tag isn't the same element type
    // (rare but happens with hand-written wrappers).
    const openRe = /<(?:article|div|main|section)[^>]*\bid="post-body"[^>]*>/i;
    const m = openRe.exec(html);
    if (m) {
      // Best-effort: take everything after the opening tag until the
      // first </article> or </main> or </section>.
      const after = html.slice(m.index + m[0].length);
      const closeRe = /<\/(article|main|section)>/i;
      const cm = closeRe.exec(after);
      if (cm) bodyMatch = [m[0] + after.slice(0, cm.index) + cm[0], '', after.slice(0, cm.index)];
    }
  }
  if (!bodyMatch) return [];
  const body = bodyMatch[2] || bodyMatch[1];

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

// Course lesson chunk extractor — Lesson Mode (Move 3, Phase 3.1).
//
// Lessons differ from articles structurally and pedagogically. The
// chunk model here honors four findings from the May 2026 instructional
// audit (docs/course-instructional-audit.md) and the cognitive-load /
// modality principles those audits cite:
//
//   1. <section class="course-widget"> blocks are interactive surfaces
//      the operator engages with. Narrating their labels aloud collides
//      with the operator's working memory (Mayer's modality principle).
//      We emit a synthetic { kind: 'widget-pause', widget: <name>,
//      contextKey: <key> } chunk in their place. The runtime player
//      (assets/js/listen.js) auto-pauses on these.
//
//   2. <details class="course-plain"> is the UDL plain-language
//      ALTERNATIVE channel (G-A2). Voicing it on top of the body
//      duplicates the same content. Skip entirely.
//
//   3. <section class="course-hero"> contains the lesson opener (eyebrow,
//      h1, the promise paragraph). These are the framing/stakes that
//      Don's audio should set BEFORE the body. We voice them with
//      kind: 'opener' so the runtime can stitch in a hand-recorded
//      opener WAV later without re-rendering.
//
//   4. <section class="course-takeaways"> + the final h2 are the lesson's
//      conclusion — operator hears what was accomplished + the carry-
//      forward to the next lesson. Voiced with kind: 'wrap'.
//
// Skipped without voicing: course-mc (interactive button + cele card),
// course-save-strip (procedural housekeeping), inline-cta / further-
// reading / sources (existing convention).
//
// (COURSE_SKIP_CLASS_RE is declared near the top of the module, above the
// top-level renderPost() loop, to avoid a TDZ throw when course renders
// hit extractCourseChunksFromBody before this point in the file executes.)

function extractCourseChunks(html) {
  const out = [];

  // 1. Voice the hero block as 'opener' chunks. Hero typically sits
  //    OUTSIDE #post-body (in the page header region), so it's pulled
  //    out separately and pushed onto the front of the chunk list.
  const heroMatch = /<section[^>]*class="[^"]*\bcourse-hero\b[^"]*"[^>]*>([\s\S]*?)<\/section>/i.exec(html);
  if (heroMatch) {
    const heroInner = heroMatch[1];
    const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(heroInner);
    if (h1) {
      let t = stripTags(h1[1]);
      if (t.length >= 2 && !/[.!?…]$/.test(t)) t += '.';
      if (t.length >= 2) out.push({ text: t, kind: 'opener', selector: '.course-hero h1' });
    }
    const promise = /<p[^>]*class="[^"]*\bpromise\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(heroInner);
    if (promise) {
      const t = stripTags(promise[1]);
      if (t.length >= 2) out.push({ text: t, kind: 'opener', selector: '.course-hero .promise' });
    }
  }

  // 2. Walk #post-body. Lessons contain nested <article> tags
  //    (.compare-card pairs in voice lessons, .ti-input wrappers,
  //    etc.), so non-greedy /<\/article>/ matches the wrong close
  //    tag. Locate the matching close via depth-counting.
  const body = findMatchingBlock(html, /<(article|div)[^>]*\bid="post-body"[^>]*>/i);
  if (!body) return out;

  // Strip <script>...</script> blocks before parsing — the celebration
  // card has inline JavaScript with template strings like '<p class=
  // "course-cele-quote">…</p>' that the TAG_RE would otherwise pick up
  // as spoken chunks.
  const cleanBody = body.replace(/<script\b[\s\S]*?<\/script>/gi, '');

  out.push(...extractCourseChunksFromBody(cleanBody, '#post-body'));
  return out;
}

// Walk one body segment and emit chunks for its descendants. Called by
// extractCourseChunks() on the post-body, then recursively on container
// divs that hold nested widgets (e.g. .compare-grid wrapping article
// pairs, or .course-callout wrapping a widget). Document order is
// preserved across the recursion so widget-pause markers land in the
// right place in the audio timeline.
function extractCourseChunksFromBody(body, parentSel) {
  const out = [];
  const TAG_RE = /<(h2|h3|p|ul|ol|figure|div|blockquote|section|details|aside|article)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  const counts = new Map();
  let m;
  while ((m = TAG_RE.exec(body)) !== null) {
    const [, tagLower, attrs, inner] = m;
    const tag = tagLower.toLowerCase();
    const n = (counts.get(tag) || 0) + 1;
    counts.set(tag, n);
    const baseSel = `${parentSel} > ${tag}:nth-of-type(${n})`;
    const attrBlob = attrs || '';

    if (COURSE_SKIP_CLASS_RE.test(attrBlob)) continue;

    // course-widget → emit a single pause marker chunk. The runtime
    // player auto-pauses on this kind and waits for the widget's
    // commit event (mtn:context-change) before advancing.
    if (tag === 'section' && /class="[^"]*\bcourse-widget\b[^"]*"/i.test(attrBlob)) {
      const widgetAttr = /data-widget="([^"]+)"/i.exec(attrBlob);
      const ctxKey    = /data-context-key="([^"]+)"/i.exec(attrBlob);
      const labelAttr = /data-label="([^"]+)"/i.exec(attrBlob);
      out.push({
        text: '',  // No spoken text — the chunk is a pause marker.
        kind: 'widget-pause',
        widget: widgetAttr ? widgetAttr[1] : '',
        contextKey: ctxKey ? ctxKey[1] : '',
        label: labelAttr ? labelAttr[1] : '',
        selector: baseSel,
      });
      continue;
    }

    // course-takeaways → voice its inner h2 + paragraphs with
    // kind: 'wrap'. Lets the player know we're closing the lesson.
    if (tag === 'section' && /class="[^"]*\bcourse-takeaways\b[^"]*"/i.test(attrBlob)) {
      const wrapH2 = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
      const wrapP  = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
      let hm;
      while ((hm = wrapH2.exec(inner)) !== null) {
        let t = stripTags(hm[1]);
        if (t.length >= 2 && !/[.!?…]$/.test(t)) t += '.';
        if (t.length >= 2) out.push({ text: t, kind: 'wrap', selector: `${baseSel} h2` });
      }
      let pm;
      while ((pm = wrapP.exec(inner)) !== null) {
        const t = stripTags(pm[1]);
        if (t.length >= 2) out.push({ text: t, kind: 'wrap', selector: `${baseSel} p` });
      }
      continue;
    }

    // Container divs (.course-callout, .compare-grid, etc.) — recurse
    // into their inner HTML so nested course-widget blocks and prose
    // get voiced/paused at the right document position. The recursive
    // call inherits the surrounding section's class skipping behavior.
    if (tag === 'div' && !/data-audio-alt/i.test(attrBlob)) {
      out.push(...extractCourseChunksFromBody(inner, baseSel));
      continue;
    }
    // <article> nests inside .compare-grid / .compare-card pairs in
    // voice lessons. Recurse so their paragraphs voice in document order
    // (no nth-of-type bumps; their inner counts reset at this depth).
    if (tag === 'article' || tag === 'aside') {
      out.push(...extractCourseChunksFromBody(inner, baseSel));
      continue;
    }

    // h2/h3/p/ul/ol/figure/blockquote — same logic as the article path.
    if (tag === 'h2' || tag === 'h3') {
      let t = stripTags(inner);
      if (t.length >= 2 && !/[.!?…]$/.test(t)) t += '.';
      if (t.length >= 2) out.push({ text: t, kind: 'heading', selector: baseSel });
      continue;
    }
    if (tag === 'p') {
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
      const audioAltMatch  = /data-audio-alt="([\s\S]*?)"/i.exec(attrBlob)
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
  }

  return out;
}

// Find the substring between an opening tag matched by `openRe` and
// its depth-aware closing tag. Handles nested same-name tags (e.g.
// <article id="post-body"> containing <article class="compare-card">).
// Returns the inner content without the surrounding open/close tags,
// or null when no match is found.
function findMatchingBlock(html, openRe) {
  const m = openRe.exec(html);
  if (!m) return null;
  const tagName = m[0].match(/^<(\w+)/)[1].toLowerCase();
  const innerStart = m.index + m[0].length;
  const tagRe = new RegExp(`<(/?)${tagName}\\b[^>]*>`, 'gi');
  tagRe.lastIndex = innerStart;
  let depth = 1;
  let t;
  while ((t = tagRe.exec(html)) !== null) {
    if (t[1] === '/') {
      depth--;
      if (depth === 0) return html.slice(innerStart, t.index);
    } else {
      depth++;
    }
  }
  return null;
}

function stripTags(s) {
  return normalizeForSpeech(decodeEntities(s
    // Inline pronunciation overrides: <span data-say="liv">live</span>
    // keeps the visible word but feeds the TTS the phonetic respelling.
    // Useful for English heteronyms ("live" the verb vs. "live" the
    // adjective, "read" past vs. present, "lead" the noun vs. verb)
    // where Kokoro guesses wrong from context. Replace before the
    // generic tag strip so the override value survives.
    .replace(/<([a-z]+)\b[^>]*\sdata-say="([^"]*)"[^>]*>[\s\S]*?<\/\1>/gi, ' $2 ')
    // <code>...</code> with HTML-entity-encoded angle brackets (e.g.
    // `&lt;img alt=""&gt;` shown inline as a code reference) decodes
    // back to literal `<img alt="">` after decodeEntities — the synth
    // would otherwise read it as "less than I M G alt equals greater
    // than", which sounds awful and conveys nothing. Strip the code
    // block content to a brief placeholder ("(code)") so the
    // surrounding narration still reads coherently.
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, inner) => {
      const decoded = decodeEntities(inner);
      // Inline code that's already speakable (no angle brackets, just
      // a class name or attribute key like `data-audio-alt`) reads
      // fine — keep the inner text verbatim. Code that contains
      // angle brackets gets the placeholder.
      return /[<>]/.test(decoded) ? ' (code) ' : ' ' + decoded + ' ';
    })
    .replace(/<[^>]+>/g, ' '))
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

  // Contraction expansions. Kokoro's am_puck (and most espeak-ng voices)
  // produce a faint hitch at the apostrophe-s / apostrophe-t boundary
  // that listeners hear as a glitch — sometimes audible enough to read
  // as "apostrophe s" being literally spoken. Expanding to the full
  // form sidesteps the phoneme transition entirely. Trades a tiny bit
  // of conversational warmth for clean enunciation; F5-TTS doesn't
  // need this trick because its prosody is learned from the reference
  // audio, not from espeak phonemes. Order matters: long-form negations
  // ("won't", "can't") match before the generic "Xn't" pattern.
  // Possessive 's ("DoorDash's") is intentionally untouched — only
  // contractions with high-frequency function-word stems are expanded.
  const CONTRACTIONS = [
    // Negations (most common offenders)
    [/\b(W|w)on't\b/g,    (_, c) => (c === 'W' ? 'Will' : 'will') + ' not'],
    [/\b(C|c)an't\b/g,    (_, c) => c === 'C' ? 'Cannot' : 'cannot'],
    [/\b(S|s)han't\b/g,   (_, c) => (c === 'S' ? 'Shall' : 'shall') + ' not'],
    [/\b([A-Za-z]+)n't\b/g, (_, w) => `${w} not`],
    // 're / 've / 'll / 'd / 'm
    [/\b([A-Za-z]+)'re\b/g, (_, w) => `${w} are`],
    [/\b([A-Za-z]+)'ve\b/g, (_, w) => `${w} have`],
    [/\b([A-Za-z]+)'ll\b/g, (_, w) => `${w} will`],
    [/\b([A-Za-z]+)'d\b/g,  (_, w) => `${w} would`],
    [/\b(I|i)'m\b/g,        (_, c) => `${c} am`],
    // 's contractions on short pronouns/let. Possessive 's stays.
    [/\b(I|i)t's\b/g,    (_, c) => `${c}t is`],
    [/\b(T|t)hat's\b/g,  (_, c) => `${c}hat is`],
    [/\b(H|h)ere's\b/g,  (_, c) => `${c}ere is`],
    [/\b(T|t)here's\b/g, (_, c) => `${c}here is`],
    [/\b(W|w)hat's\b/g,  (_, c) => `${c}hat is`],
    [/\b(L|l)et's\b/g,   (_, c) => `${c}et us`],
    [/\b(H|h)e's\b/g,    (_, c) => `${c}e is`],
    [/\b(S|s)he's\b/g,   (_, c) => `${c}he is`],
    [/\b(W|w)ho's\b/g,   (_, c) => `${c}ho is`],
    [/\b(W|w)here's\b/g, (_, c) => `${c}here is`],
  ];

  let pre = str;
  for (const [re, rep] of CONTRACTIONS) pre = pre.replace(re, rep);

  return pre
    // Em-dash and ellipsis → comma / period. Kokoro and Piper render
    // these characters as nothing (no pause) by default, so the listener
    // hears two clauses crash together. Substituting a comma for the
    // em-dash, and a period for the ellipsis, makes the synth honor the
    // pause the writer intended. Cost: a tiny prosody simplification.
    // Benefit: prose with em-dashes and ellipses stops sounding
    // breathless. The runtime twin lives in assets/js/listen.js.
    .replace(/\s*[—–]\s*/g, ', ')   // em-dash, en-dash → comma
    .replace(/\s*\.\.\.\s*/g, '. ')           // three-period ellipsis → period
    .replace(/\s*…\s*/g, '. ')           // U+2026 ellipsis → period
    // ALL-CAPS standalone words ≥ 3 chars get title-cased so the synth
    // doesn't spell them letter-by-letter (the ACRONYMS list above
    // handles the deliberately-spelled ones). Skips single letters,
    // two-letter words ("OK", "NO"), and rows that look like Roman
    // numerals (allows "I" as the pronoun).
    .replace(/\b([A-Z]{3,})\b/g, (m) => {
      if (m.length >= 3 && /^[A-Z]+$/.test(m) && !ACRONYMS.includes(m)) {
        return m[0] + m.slice(1).toLowerCase();
      }
      return m;
    })
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
