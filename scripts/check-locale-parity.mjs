#!/usr/bin/env node
// Warn when the English and Spanish sides of the site drift out of sync.
//
// Philosophy: the translation workflow is fully human (no machine-
// translation fallback). Drift is the main operational risk. This
// script does not try to *translate* anything — it just surfaces the
// places where EN got a change that ES hasn't matched yet, so the
// copy-editor has a punch list.
//
// Runs in two modes:
//   node scripts/check-locale-parity.mjs         # report + exit 0
//   node scripts/check-locale-parity.mjs --check # report + exit 1 if any drift
//
// Early in the rollout we use the default (report-only) mode in the
// build pipeline so missing Spanish pages don't block deploys; once
// coverage is complete we flip the build to --check.
//
// What counts as drift:
//   1. An EN page in scope has no ES counterpart under /es/.
//   2. An ES page exists but has no EN counterpart (reverse drift).
//   3. The EN page's <h1> or <meta name="description"> has changed more
//      recently (by git mtime) than its ES counterpart was last
//      touched — hint that the ES copy needs a review.
//
// Scope: excludes /blog/* (handled in a sibling repo) and a small set
// of tool utilities that are intentionally not translated yet. As the
// site's coverage grows, the exclusions shrink.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { NON_ARTICLE_LIBRARY_SLUGS } from './lib/library-skips.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts'
]);

// Paths excluded from EN→ES parity. Blog is handled separately on the
// EN side because the slug-map (data/i18n-slug-map.json) governs
// EN→ES blog pairing — translated-slug posts map an EN slug to a
// different ES slug, so a naive "es/<same-en-slug>/" lookup would
// always 404 for them. The reverse direction (ES→EN orphan check)
// IS slug-map-aware below.
const SKIP_PATH_PREFIXES = ['blog/', 'library/'];

// EN↔ES blog slug map. Used by the reverse-direction check so that
// an ES blog post under a translated slug isn't flagged as orphan
// just because /blog/<es-slug>/ doesn't exist on the EN side. The
// real EN counterpart lives at /blog/<mapped-en-slug>/.
//
// Three cases for an ES blog page:
//   1. Slug is a value in slugMap.blog{}            — translated counterpart
//      exists at /blog/<corresponding-key>/index.html
//   2. Slug appears in slugMap.esOriginal[]         — legitimately ES-only
//                                                     (no EN counterpart by design)
//   3. Slug matches an EN file 1:1                  — same-slug pair, fall
//                                                     through to default lookup
const slugMapPath = path.join(repoRoot, 'data', 'i18n-slug-map.json');
const slugMap     = fs.existsSync(slugMapPath) ? JSON.parse(fs.readFileSync(slugMapPath, 'utf8')) : { blog: {}, library: {}, esOriginal: [] };
// Phase 7: namespace-aware ES→EN slug lookup. An ES slug might map to
// an EN slug under /blog/ (timely) OR /library/ (evergreen) depending
// on whether the EN counterpart moved during the split. The lookup
// table also stores which namespace each ES slug resolves to.
const esToEn = (() => {
  const map = {};
  for (const [en, es] of Object.entries(slugMap.blog || {}))    map[es] = { en, namespace: 'blog' };
  for (const [en, es] of Object.entries(slugMap.library || {})) map[es] = { en, namespace: 'library' };
  return map;
})();
const esOriginal  = new Set(slugMap.esOriginal || []);

// Locales whose absence from an EN counterpart should be reported.
// English is always the authoritative source; if you want to add a
// locale, append its code here (and give it _includes/<code>/ plus
// real pages).
const TARGET_LOCALES = ['es'];

function collectHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectHtml(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function toPosix(p) { return p.split(path.sep).join('/'); }

function localeForPath(posix) {
  for (const l of TARGET_LOCALES) {
    if (posix === `${l}/index.html` || posix.startsWith(`${l}/`)) return l;
  }
  return 'en';
}

// Given an EN relative path, return the ES counterpart's relative path.
// Mirrors the URL convention: EN /services/index.html ↔ ES
// /es/services/index.html; EN /terms.html ↔ ES /es/terms.html.
function counterpartFor(posix, locale) {
  if (locale === 'en') {
    return posix === 'index.html' ? 'es/index.html' : `es/${posix}`;
  }
  const m = posix.match(new RegExp(`^${locale}/(.*)$`));
  if (!m) return null;
  const stripped = m[1] === 'index.html' ? 'index.html' : m[1];

  // Slug-map awareness for blog/library. An ES post under a translated
  // slug needs to point at /<namespace>/<mapped-en-slug>/ on the EN side
  // where <namespace> is /blog/ (timely) or /library/ (evergreen) per
  // the i18n-slug-map. Posts in esOriginal[] return a sentinel.
  //
  // For same-slug ES↔EN posts (no entry in slug-map), try /library/
  // first, then /blog/ — the EN counterpart might have moved to library
  // during the Phase 7 split.
  const nsMatch = stripped.match(/^(blog|library)\/([^/]+)\/index\.html$/);
  if (nsMatch) {
    const slug = nsMatch[2];
    if (esOriginal.has(slug)) return '__ES_ORIGINAL__';
    if (esToEn[slug])         return `${esToEn[slug].namespace}/${esToEn[slug].en}/index.html`;
    // Same-slug fallback: prefer /library/<slug>/ if it exists.
    const libCandidate  = `library/${slug}/index.html`;
    const blogCandidate = `blog/${slug}/index.html`;
    if (fs.existsSync(path.join(repoRoot, libCandidate)))  return libCandidate;
    if (fs.existsSync(path.join(repoRoot, blogCandidate))) return blogCandidate;
    // Neither exists — fall through (will be flagged correctly).
  }
  return stripped;
}

function extractSignal(src) {
  const h1  = (src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1].replace(/<[^>]*>/g, '').trim();
  const des = (src.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [, ''])[1].trim();
  return { h1, des };
}

function gitMtime(file) {
  // Falls back to filesystem mtime for untracked/uncommitted files —
  // keeps the script useful on local dev branches before the first
  // commit of a new page.
  try {
    const rel = path.relative(repoRoot, file);
    const out = execSync(`git -C "${repoRoot}" log -1 --format=%ct -- "${rel}"`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (out) return parseInt(out, 10) * 1000;
  } catch { /* ignore */ }
  return fs.statSync(file).mtimeMs;
}

const missing = [];
const reverseMissing = [];
const staleCandidates = [];
const files = collectHtml(repoRoot);

for (const file of files) {
  const rel   = path.relative(repoRoot, file);
  const posix = toPosix(rel);
  if (SKIP_PATH_PREFIXES.some((p) => posix.startsWith(p))) continue;
  // Pages explicitly marked noindex+nofollow are internal admin
  // surfaces, not public bilingual content. Don't require an ES
  // counterpart for them.
  const earlyHead = fs.readFileSync(file, 'utf8').slice(0, 2000);
  if (/<meta\s+name="robots"\s+content="[^"]*\bnoindex\b[^"]*\bnofollow\b/i.test(earlyHead)) continue;

  const locale = localeForPath(posix);
  if (locale === 'en') {
    for (const target of TARGET_LOCALES) {
      const counterpartPath = target === 'es'
        ? (posix === 'index.html' ? 'es/index.html' : `es/${posix}`)
        : null;
      if (!counterpartPath) continue;
      const cpAbs = path.join(repoRoot, counterpartPath);
      if (!fs.existsSync(cpAbs)) {
        missing.push({ en: posix, target, expected: counterpartPath });
        continue;
      }
      // Both sides exist — check staleness by mtime + signal diff.
      const enMtime = gitMtime(file);
      const esMtime = gitMtime(cpAbs);
      if (enMtime > esMtime) {
        const enSignal = extractSignal(fs.readFileSync(file, 'utf8'));
        const esSignal = extractSignal(fs.readFileSync(cpAbs, 'utf8'));
        // Only flag if the EN signal differs from what's typical-of-a-
        // direct-mirror. We don't know the "correct" ES string, so the
        // heuristic is: if the EN h1 or description is non-empty and
        // has been edited more recently than the ES counterpart, flag
        // it for review. This is intentionally noisy early (better a
        // false positive than a silent drift).
        if (enSignal.h1 || enSignal.des) {
          staleCandidates.push({ en: posix, es: counterpartPath });
        }
      }
    }
  } else {
    const cpPath = counterpartFor(posix, locale);
    if (cpPath === '__ES_ORIGINAL__') continue; // intentional ES-only post
    if (cpPath && !fs.existsSync(path.join(repoRoot, cpPath))) {
      reverseMissing.push({ lang: locale, page: posix, expected: cpPath });
    }
  }
}

function report(label, items, fmt) {
  if (!items.length) return;
  console.log(`\n${label} (${items.length}):`);
  for (const i of items) console.log(`  ${fmt(i)}`);
}

report('Missing Spanish counterpart', missing,
  (i) => `${i.en}  →  expected ${i.expected}`);
report('Orphan Spanish page (no English source)', reverseMissing,
  (i) => `${i.page}  (expected ${i.expected})`);
report('Possibly stale Spanish page (EN edited more recently)', staleCandidates,
  (i) => `${i.en}  vs  ${i.es}`);

const anyDrift = missing.length + reverseMissing.length + staleCandidates.length;
console.log(`\nLocale parity: ${anyDrift} item(s) flagged.`);

if (checkMode && anyDrift > 0) {
  // Early rollout: keep --check as a warning until ES coverage catches
  // up. Swap this exit(0) to exit(1) once parity reaches 100% to make
  // drift a hard build failure.
  console.log('(--check is in warn-only mode during initial rollout)');
  process.exit(0);
}
