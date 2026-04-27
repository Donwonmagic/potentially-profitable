#!/usr/bin/env node
// Idempotent installer: drop <!-- glossary-knit --><!-- /glossary-knit -->
// sentinels just before </main> on every glossary term page (EN + ES)
// that doesn't already have them. Once installed,
// scripts/wire-glossary-knit.mjs fills the block on every build.
//
// Mirrors scripts/add-tool-knit-sentinels.mjs (Phase 3) but walks the
// glossary tree instead of data/tools.json.
//
//   node scripts/add-glossary-knit-sentinels.mjs           # writes
//   node scripts/add-glossary-knit-sentinels.mjs --dry-run # preview only

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const dryRun     = process.argv.includes('--dry-run');

const SNIPPET = '\n<!-- glossary-knit --><!-- /glossary-knit -->\n';
const MAIN_CLOSE_RE = /<\/main>/;
const SENTINEL_RE   = /<!-- glossary-knit -->[\s\S]*?<!-- \/glossary-knit -->/;

function entryFiles() {
  const out = [];
  for (const base of ['glossary', 'es/glossary']) {
    const dir = path.join(REPO, base);
    if (!fs.existsSync(dir)) continue;
    for (const slug of fs.readdirSync(dir)) {
      const fp = path.join(dir, slug, 'index.html');
      if (fs.existsSync(fp)) out.push(fp);
    }
  }
  return out;
}

let installed = 0;
let alreadyHad = 0;
const noMain = [];

for (const fp of entryFiles()) {
  const rel = path.relative(REPO, fp);
  // Skip the listing index pages. (NOTE: glossary/sitemap/ is a real
  // term entry — "Sitemap" — not a directory listing, so don't skip
  // it.)
  if (/(?:^|\/)glossary\/index\.html$/.test(rel)) continue;
  const src = fs.readFileSync(fp, 'utf8');
  if (SENTINEL_RE.test(src)) { alreadyHad++; continue; }
  if (!MAIN_CLOSE_RE.test(src)) { noMain.push(rel); continue; }
  const next = src.replace(MAIN_CLOSE_RE, `${SNIPPET}</main>`);
  if (!dryRun) fs.writeFileSync(fp, next);
  installed++;
}

if (noMain.length) {
  console.warn(`\n${noMain.length} entry page(s) lacked </main> — skipped:`);
  for (const r of noMain.slice(0, 6)) console.warn('  ' + r);
  if (noMain.length > 6) console.warn(`  … and ${noMain.length - 6} more.`);
}

console.log(`${dryRun ? 'would install' : 'installed'} ${installed} sentinel pair(s); ${alreadyHad} already had them.`);
