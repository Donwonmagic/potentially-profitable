#!/usr/bin/env node
/**
 * Phase G.1 (Growth) — render a "Last verified: YYYY-MM-DD" stamp
 * on every tool page header, between sentinels:
 *
 *   <!-- tool-verified:start -->
 *   <p class="tool-verified">Last verified:
 *     <time datetime="YYYY-MM-DD">Month DD, YYYY</time>
 *   </p>
 *   <!-- tool-verified:end -->
 *
 * Date is derived from `git log -1 --format=%cI <tool-dir>` —
 * the tool's most recent commit timestamp. Reflects whether the
 * tool's logic / output / spec has been touched recently, which
 * is what AI engines + crawlers cite for freshness.
 *
 * Locale-aware: EN renders "Last verified", ES renders
 * "Última revisión".
 *
 * Usage:
 *   node scripts/inject-tool-verified-stamp.mjs           # rewrite
 *   node scripts/inject-tool-verified-stamp.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- tool-verified:start -->[\s\S]*?<!-- tool-verified:end -->/;

function gitMtime(dir) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${dir}"`, { cwd: repoRoot, encoding: 'utf8' }).trim();
    if (out) return out.slice(0, 10);
  } catch (_) { /* fall through */ }
  // Fallback: filesystem mtime of the index.html itself.
  try {
    const st = fs.statSync(path.join(dir, 'index.html'));
    return st.mtime.toISOString().slice(0, 10);
  } catch (_) {
    return new Date().toISOString().slice(0, 10);
  }
}

function fmtDate(iso, locale) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

function renderStamp(dateIso, locale) {
  const label = locale === 'es' ? 'Última revisión' : 'Last verified';
  return [
    '<!-- tool-verified:start -->',
    `      <p class="tool-verified">${label}: <time datetime="${dateIso}">${fmtDate(dateIso, locale)}</time></p>`,
    '      <!-- tool-verified:end -->',
  ].join('\n      ');
}

function findToolPages() {
  const out = [];
  for (const root of ['tools', 'es/tools']) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;
    function walk(rel) {
      const full = path.join(fullRoot, rel);
      for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const sub = path.join(rel, entry.name);
        const idx = path.join(fullRoot, sub, 'index.html');
        if (fs.existsSync(idx)) {
          out.push({ file: idx, dir: path.join(fullRoot, sub), locale: root.startsWith('es') ? 'es' : 'en' });
        }
        walk(sub);
      }
    }
    walk('');
  }
  return out;
}

let changed = 0;
const pages = findToolPages();
for (const { file, dir, locale } of pages) {
  const src = fs.readFileSync(file, 'utf8');
  const dateIso = gitMtime(dir);
  const block = renderStamp(dateIso, locale);

  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    // First-time insert: place the stamp directly after the H1.
    const h1M = src.match(/<\/h1>/);
    if (!h1M) continue;
    const insertion = `</h1>\n      ${block}`;
    next = src.replace('</h1>', insertion);
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${pages.length} tool page(s).`);
if (checkOnly && changed > 0) process.exit(1);
