#!/usr/bin/env node
/**
 * ESL inline bridge: every article (EN <-> ES) gets a small
 * contextual link at the top of #post-body that lets a reader
 * switch to the other language without going up to the nav.
 *
 * The pattern is the same one the auditor praised on /es/about/:
 *
 *   <a href="/<other-locale>/<slug>/" lang="<lang>" hreflang="<lang>">
 *     Read this article in English →
 *   </a>  (or "Leer este artículo en español →")
 *
 * Stamped between sentinels so re-runs are idempotent. Only
 * applied when both EN and ES versions exist on disk — the same
 * existence check used in stamp-hreflang.mjs prevents claiming
 * a phantom alternate.
 *
 *   node scripts/inject-esl-bridge.mjs           # rewrite
 *   node scripts/inject-esl-bridge.mjs --check   # exit 1 on diff
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- esl-bridge:start -->[\s\S]*?<!-- esl-bridge:end -->/;
const POST_BODY_RE = /<article([^>]*\bid="post-body"[^>]*)>/i;

function readHreflangAlternate(src, locale) {
  // For EN files we want the ES alternate; for ES files we want EN.
  const want = locale === 'es' ? 'en' : 'es';
  const m = src.match(new RegExp(`<link rel="alternate" hreflang="${want}" href="([^"]+)"`));
  return m ? m[1] : null;
}

function buildBridge(otherUrl, locale) {
  if (locale === 'es') {
    return [
      '<!-- esl-bridge:start -->',
      `<p class="esl-bridge" style="font-size:14px;color:var(--ink-soft);margin:0 0 24px;padding:0;border-left:2px solid var(--teal);padding-left:12px"><a href="${otherUrl}" lang="en" hreflang="en">Read this article in English &rarr;</a></p>`,
      '<!-- esl-bridge:end -->',
    ].join('\n');
  }
  return [
    '<!-- esl-bridge:start -->',
    `<p class="esl-bridge" style="font-size:14px;color:var(--ink-soft);margin:0 0 24px;padding:0;border-left:2px solid var(--teal);padding-left:12px"><a href="${otherUrl}" lang="es" hreflang="es">Leer este art&iacute;culo en espa&ntilde;ol &rarr;</a></p>`,
    '<!-- esl-bridge:end -->',
  ].join('\n');
}

function articleFiles() {
  const out = [];
  for (const dir of ['blog', 'es/blog', 'library', 'es/library']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    const locale = dir.startsWith('es') ? 'es' : 'en';
    for (const slug of fs.readdirSync(root)) {
      if (slug === 'drafts' || slug === 'index.html') continue;
      const file = path.join(root, slug, 'index.html');
      if (fs.existsSync(file)) out.push({ file, slug, locale });
    }
  }
  return out;
}

let changed = 0;
let skipped = 0;
for (const { file, slug, locale } of articleFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const otherUrl = readHreflangAlternate(src, locale);

  // No alternate? Don't stamp a bridge.
  if (!otherUrl) { skipped++; continue; }

  const block = buildBridge(otherUrl, locale);

  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    // Insert immediately after the opening <article id="post-body">.
    next = src.replace(POST_BODY_RE, (m, attrs) => `<article${attrs}>\n${block}`);
    if (next === src) { skipped++; continue; }
  }

  if (next === src) { skipped++; continue; }
  if (!checkOnly) fs.writeFileSync(file, next);
  changed++;
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
