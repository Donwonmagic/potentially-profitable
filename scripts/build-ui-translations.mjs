#!/usr/bin/env node
// Generate per-post UI translation maps for infographic labels,
// callout text, CTA buttons — anything tagged with class="i18n" in
// a post's HTML.
//
// Output shape
// ------------
// <post>/translations.<lang>.json :
//   { "English string as found in HTML": "Translated string", ... }
//
// Runtime (assets/site.js applyUITranslations) fetches this when the
// user picks a language and applies it by walking every .i18n
// element, looking up its original English textContent, and swapping.
//
// Usage
// -----
//   node scripts/build-ui-translations.mjs <post-dir> --languages es
//   node scripts/build-ui-translations.mjs --all --languages es,fr
//
// Zero npm deps. Delegates the actual translation to
// scripts/lib/translate.py (which uses document-level context +
// glossary preservation — same pipeline as the audio chunks).

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

const args = process.argv.slice(2);
const VALUED = new Set(['--languages']);
const flags = new Set(args.filter((a) => a.startsWith('--') && !VALUED.has(a)));
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) { if (VALUED.has(a)) i++; continue; }
  positional.push(a);
}
const optVal = (name) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : null;
};

const languages = (optVal('--languages') || 'es')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

const targets = flags.has('--all') ? discoverPosts() : positional;
if (!targets.length) fail('Pass a post directory (e.g. blog/post-slug) or --all.');

for (const t of targets) processPost(path.resolve(repoRoot, t));

function processPost(postDir) {
  const indexPath = path.join(postDir, 'index.html');
  if (!fs.existsSync(indexPath)) fail(`${indexPath} does not exist`);
  const html = fs.readFileSync(indexPath, 'utf8');

  const strings = extractI18nStrings(html);
  if (!strings.length) {
    console.log(`[${path.basename(postDir)}] no .i18n elements — skipping`);
    return;
  }
  console.log(`[${path.basename(postDir)}] ${strings.length} i18n strings`);

  for (const lang of languages) {
    const payload = {
      target: lang,
      chunks: strings.map((s, i) => ({ id: i, text: s })),
    };
    const proc = spawnSync('python3', [
      path.join(repoRoot, 'scripts', 'lib', 'translate.py'),
    ], {
      input: JSON.stringify(payload),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'inherit'],
      maxBuffer: 8 * 1024 * 1024,
    });
    if (proc.status !== 0) fail(`translate.py exited ${proc.status}: ${proc.stdout}`);
    const parsed = JSON.parse(proc.stdout);
    if (!parsed.ok) fail(`translate.py returned error: ${parsed.error}`);

    const map = {};
    for (const c of parsed.chunks) {
      const english = strings[c.id];
      map[english] = c.text;
    }

    const outPath = path.join(postDir, `translations.${lang}.json`);
    fs.writeFileSync(outPath, JSON.stringify(map, null, 2) + '\n');
    console.log(`  ✓ translations.${lang}.json  (${Object.keys(map).length} keys)`);
  }
}

/* -------------------- i18n string extraction --------------------
 * Walk the HTML and find every element whose class list contains
 * "i18n". Return the inner textContent of each (trimmed, whitespace-
 * normalised) as a de-duplicated array, preserving document order of
 * first occurrence.
 *
 * Simple HTML parser: we don't need full DOM semantics, just the
 * ability to find opening tags carrying class="...i18n..." and
 * pair them with their closing tags. The regex-based walker below
 * handles nested children (the i18n element may contain other
 * elements like <small>) by skipping over any opening tag until the
 * matching closing tag at the same depth.
 */
function extractI18nStrings(html) {
  const out = [];
  const seen = new Set();

  // Scan for opening tags with class containing "i18n".
  const openRe = /<([a-z0-9-]+)\b([^>]*)>/gi;
  let m;
  while ((m = openRe.exec(html)) !== null) {
    const [, tag, attrs] = m;
    if (attrs.includes('/>')) continue; // self-closing, no content
    // Match only if class attribute contains the bare "i18n" token
    // (not "i18n-something" or "notes-i18n").
    const classMatch = /\bclass="([^"]*)"/i.exec(attrs);
    if (!classMatch) continue;
    const classes = classMatch[1].split(/\s+/);
    if (!classes.includes('i18n')) continue;

    // Find matching closing tag, accounting for nested same-tag pairs.
    const closeRe = new RegExp(`</${tag}\\s*>`, 'i');
    const openNested = new RegExp(`<${tag}\\b`, 'gi');
    const startContent = m.index + m[0].length;
    let depth = 1;
    let pos = startContent;
    let endContent = -1;
    while (depth > 0) {
      closeRe.lastIndex = pos;
      const close = html.slice(pos).search(closeRe);
      if (close === -1) break;
      const closeAbs = pos + close;
      // Count nested openings of same tag between pos and closeAbs.
      const between = html.slice(pos, closeAbs);
      openNested.lastIndex = 0;
      let nested = 0;
      while (openNested.exec(between)) nested++;
      if (nested === 0) {
        depth -= 1;
        endContent = closeAbs;
        pos = closeAbs + 1;
      } else {
        depth += nested - 1;
        pos = closeAbs + 1;
        endContent = closeAbs;
      }
    }
    if (endContent === -1) continue;
    const inner = html.slice(startContent, endContent);
    const text = textOf(inner);
    if (!text) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function textOf(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–');
}

/* -------------------- utils -------------------- */
function discoverPosts() {
  const blogDir = path.join(repoRoot, 'blog');
  const posts = [];
  for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'drafts') {
      for (const d of fs.readdirSync(path.join(blogDir, 'drafts'), { withFileTypes: true })) {
        if (d.isDirectory()) posts.push(path.join('blog', 'drafts', d.name));
      }
      continue;
    }
    const idx = path.join(blogDir, entry.name, 'index.html');
    if (fs.existsSync(idx)) posts.push(path.join('blog', entry.name));
  }
  return posts;
}

function fail(msg) {
  console.error(`[build-ui-translations] ${msg}`);
  process.exit(1);
}
