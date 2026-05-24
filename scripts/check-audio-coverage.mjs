#!/usr/bin/env node
/**
 * Audio coverage audit.
 *
 * Reads data/article-audio.json (the source-of-truth manifest of which
 * written pieces ship a studio audio edition in which languages) and
 * verifies the on-disk MP3s and chunk-timing manifests are present
 * and content-current.
 *
 * Two failure modes:
 *
 *   1. MISSING — declared (slug × lang) has no audio.<lang>.mp3 or
 *      audio.<lang>.json on disk. The piece's "Listen" button will
 *      either 404 in studio-audio mode or fall back to the browser
 *      Web Speech API.
 *
 *   2. STALE — the article HTML's prose has changed since the audio
 *      was rendered. The audio narrates an old version of the text;
 *      the on-page highlight will still track because the chunks are
 *      derived from the live DOM, but the AUDIO content drifts from
 *      what's on screen. Detected by comparing the article's content
 *      hash to the contentHash field stored in audio.<lang>.json.
 *
 *   3. ENGLISH-IN-FOREIGN — the audio.<lang>.json (lang ≠ en) has
 *      chunks whose `text` field is in English instead of the target
 *      language. Symptom of a render run that used
 *      --use-existing-translations against a stale manifest. The
 *      audio file is a foreign Kokoro voice reading English text;
 *      the on-page highlight tracks English chunks. Not what a
 *      reader who picked French would expect.
 *
 * Exit codes
 * ----------
 *   0 — every declared (slug × lang) is present and current.
 *   1 — at least one MISSING or STALE entry. Run `node
 *       scripts/render-post-audio.mjs --manifest data/article-audio.json`
 *       to re-render.
 *
 * The check is wired into scripts/check-all.mjs as warn-only during
 * the studio-audio rollout (so check-all stays green while the
 * coverage gap is being closed). Promote to fail-CI by removing
 * --warn from the check-all entry once coverage is complete.
 *
 * Usage:
 *   node scripts/check-audio-coverage.mjs                # report + exit code
 *   node scripts/check-audio-coverage.mjs --check        # alias
 *   node scripts/check-audio-coverage.mjs --warn         # exit 0 even on issues (warn-only)
 *   node scripts/check-audio-coverage.mjs --json         # machine-readable
 *   node scripts/check-audio-coverage.mjs --pending      # list slugs that need rendering
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const args     = new Set(process.argv.slice(2));
const warnOnly = args.has('--warn');
const jsonOut  = args.has('--json');
const listPending = args.has('--pending');

const MANIFEST_PATH = path.join(repoRoot, 'data', 'article-audio.json');
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`Audio coverage: manifest not found at ${path.relative(repoRoot, MANIFEST_PATH)}`);
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// Section → on-disk root. Each piece in the manifest lives at
// <root>/<slug>/index.html, with audio.{lang}.mp3 + audio.{lang}.json
// as siblings.
const SECTIONS = [
  { key: 'blog',        root: path.join(repoRoot, 'blog') },
  { key: 'es-blog',     root: path.join(repoRoot, 'es', 'blog') },
  { key: 'research',    root: path.join(repoRoot, 'learn', 'research') },
  { key: 'checklists',  root: path.join(repoRoot, 'learn', 'checklists') },
  { key: 'course',      root: path.join(repoRoot, 'course') },
  { key: 'es-course',   root: path.join(repoRoot, 'es', 'course') },
];

/**
 * Sha-256 of the article's prose-extraction-relevant content.
 * Mirrors the chunk extractor in scripts/render-post-audio.mjs:
 * we hash the post-body region of the HTML stripped of timestamps
 * and other render-injected sentinels so a no-content edit (cache-
 * bust hash bump, etc.) doesn't mark the audio stale.
 */
function articleContentHash(htmlPath) {
  const raw = fs.readFileSync(htmlPath, 'utf8');
  // Extract just the post-body region. If we can't find one, hash
  // the whole file — overconservative is fine for this audit.
  const m = raw.match(/<article\b[^>]*\bid="post-body"[^>]*>([\s\S]*?)<\/article>/i);
  const body = m ? m[1] : raw;
  // Strip render-time injected sentinels that don't affect narrated
  // content (cache-bust hashes, dateModified strings, fieldnote
  // counts, hreflang blocks, listen-script tags).
  const stripped = body
    .replace(/<!-- [a-z-]+:start -->[\s\S]*?<!-- [a-z-]+:end -->/g, '')
    .replace(/\?v=[a-f0-9]+/g, '')
    .replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(stripped).digest('hex').slice(0, 16);
}

/**
 * Heuristic: is this audio.<lang>.json's chunk text in `lang`, or is it
 * still English? Used to flag the ENGLISH-IN-FOREIGN failure mode.
 *
 * The check looks at the first 5 body-kind chunks (skipping headings
 * which are often loanwords or proper nouns) and counts how many
 * contain stop-words exclusive to the target language vs English.
 * If <30% of the chunks have target-language stop-words, we conclude
 * the manifest contains English text.
 */
const STOP_WORDS = {
  es: ['el ', 'la ', 'que ', 'una ', 'los ', 'las ', 'para ', 'con ', 'son '],
  fr: ['le ', 'la ', 'les ', 'une ', 'pour ', 'que ', 'dans ', 'avec ', 'sont ', 'est '],
  it: ['il ', 'la ', 'che ', 'una ', 'gli ', 'per ', 'con ', 'sono ', 'di '],
  pt: ['o ', 'a ', 'que ', 'uma ', 'os ', 'as ', 'para ', 'com ', 'são ', 'é '],
  zh: ['的', '是', '和', '在', '了', '我', '你', '不', '一', '有'],
};
const ENGLISH_STOPS = ['the ', 'a ', 'an ', 'is ', 'are ', 'and ', 'or ', 'but ', 'with ', 'for '];

function isInTargetLanguage(chunks, lang) {
  if (!STOP_WORDS[lang]) return true;
  const bodyChunks = chunks.filter((c) => c.kind === 'body').slice(0, 5);
  if (!bodyChunks.length) return true;
  const targetHits = bodyChunks.filter((c) => {
    const t = (c.text || '').toLowerCase();
    return STOP_WORDS[lang].some((sw) => t.includes(sw));
  }).length;
  const englishHits = bodyChunks.filter((c) => {
    const t = (c.text || '').toLowerCase();
    return ENGLISH_STOPS.some((sw) => t.includes(sw));
  }).length;
  // Target language wins if it has at least as many hits AND English
  // doesn't dominate. Tuned to the mixed case (target-language prose
  // with embedded English brand names — should pass).
  return targetHits >= Math.max(1, Math.floor(bodyChunks.length * 0.3))
    && targetHits >= englishHits * 0.6;
}

/* -------------------- Audit -------------------- */

const issues = [];           // {kind, section, slug, lang, detail}
const pendingSlugs = new Set(); // for --pending output
let totalDeclared = 0;
let totalRendered = 0;
let totalCurrent = 0;

for (const section of SECTIONS) {
  const entries = manifest[section.key] || {};
  for (const [slug, spec] of Object.entries(entries)) {
    if (slug.startsWith('_')) continue;
    if (!spec || typeof spec !== 'object' || !Array.isArray(spec.languages)) continue;
    // Pieces marked "deferred" are intentionally excluded from the
    // current rollout — usually because the article's HTML structure
    // needs a fix before chunks extract cleanly. The audit reports
    // them as deferred (not as MISSING) so the bulk render command
    // doesn't waste compute trying to render them and the audit
    // exit code stays clean.
    if (spec.status === 'deferred') {
      issues.push({ kind: 'DEFERRED', section: section.key, slug, lang: '*',
        detail: spec.defer_reason || 'manifest entry marked status: deferred' });
      continue;
    }

    const articlePath = path.join(section.root, slug, 'index.html');
    if (!fs.existsSync(articlePath)) {
      issues.push({ kind: 'MISSING-ARTICLE', section: section.key, slug, lang: '*',
        detail: `Manifest declares ${section.key}/${slug} but ${path.relative(repoRoot, articlePath)} does not exist.` });
      continue;
    }

    const currentHash = articleContentHash(articlePath);
    const articleDir  = path.dirname(articlePath);

    for (const lang of spec.languages) {
      totalDeclared++;
      const mp3Name  = lang === 'en' ? 'audio.mp3'  : `audio.${lang}.mp3`;
      const jsonName = lang === 'en' ? 'audio.json' : `audio.${lang}.json`;
      const mp3Path  = path.join(articleDir, mp3Name);
      const jsonPath = path.join(articleDir, jsonName);
      const mp3OK    = fs.existsSync(mp3Path);
      const jsonOK   = fs.existsSync(jsonPath);

      if (!mp3OK || !jsonOK) {
        issues.push({ kind: 'MISSING', section: section.key, slug, lang,
          detail: `${mp3OK ? '' : mp3Name} ${jsonOK ? '' : jsonName} not on disk`.trim() });
        pendingSlugs.add(`${section.key}/${slug}`);
        continue;
      }

      totalRendered++;

      let parsed;
      try { parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); }
      catch (e) {
        issues.push({ kind: 'INVALID-JSON', section: section.key, slug, lang, detail: e.message });
        continue;
      }

      if (parsed.contentHash && parsed.contentHash !== currentHash) {
        issues.push({ kind: 'STALE', section: section.key, slug, lang,
          detail: `audio rendered against contentHash=${parsed.contentHash}, article is now ${currentHash}` });
        pendingSlugs.add(`${section.key}/${slug}`);
        continue;
      }
      if (!parsed.contentHash) {
        // Audio was rendered before content-hashing was wired in — treat
        // as a soft warn (operator should re-render to bake in the hash
        // for future drift detection).
        issues.push({ kind: 'NO-HASH', section: section.key, slug, lang,
          detail: 'audio.json predates contentHash field; re-render to enable drift detection' });
      }

      if (lang !== 'en' && !isInTargetLanguage(parsed.chunks || [], lang)) {
        issues.push({ kind: 'ENGLISH-IN-FOREIGN', section: section.key, slug, lang,
          detail: `audio.${lang}.json chunks appear to contain English text — re-render with --force-retranslate` });
        pendingSlugs.add(`${section.key}/${slug}`);
        continue;
      }

      totalCurrent++;
    }
  }
}

/* -------------------- Output -------------------- */

if (listPending) {
  for (const s of [...pendingSlugs].sort()) console.log(s);
  process.exit(0);
}

if (jsonOut) {
  console.log(JSON.stringify({
    declared: totalDeclared,
    rendered: totalRendered,
    current:  totalCurrent,
    issues,
  }, null, 2));
  process.exit(issues.length && !warnOnly ? 1 : 0);
}

// NO-HASH is a soft warn (pre-contentHash audio); DEFERRED is by-design.
// Anything else is a hard issue that should fail the gate when it's
// promoted from --warn to --check.
const hardIssues = issues.filter((i) => i.kind !== 'NO-HASH' && i.kind !== 'DEFERRED');

if (issues.length === 0) {
  console.log(`Audio coverage: ${totalCurrent} of ${totalDeclared} declared editions current; everything in manifest is rendered and content-current.`);
  process.exit(0);
}

console.log(`Audio coverage${warnOnly ? ' (warn-only)' : ''}: ${totalCurrent} of ${totalDeclared} declared editions are current; ${hardIssues.length} issue(s):`);

const byKind = {};
for (const i of issues) (byKind[i.kind] ||= []).push(i);
for (const [kind, list] of Object.entries(byKind).sort()) {
  console.log(`  ${kind} (${list.length})`);
  for (const i of list.slice(0, 8)) {
    console.log(`    · ${i.section}/${i.slug} [${i.lang}]  ${i.detail}`);
  }
  if (list.length > 8) console.log(`    … and ${list.length - 8} more`);
}

console.log(`
Run:
  node scripts/render-post-audio.mjs --manifest data/article-audio.json --languages en,es,fr,it,pt,zh \\
    --kokoro-model <path-to-kokoro-v1.0.onnx> \\
    --kokoro-voices <path-to-voices-v1.0.bin> \\
    --force-retranslate

See docs/audio-pipeline.md for full operator runbook.`);

if (warnOnly) process.exit(0);
process.exit(hardIssues.length > 0 ? 1 : 0);
