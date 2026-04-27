#!/usr/bin/env node
// Idempotent installer: drop <!-- tool-knit --><!-- /tool-knit -->
// sentinels just before </main> on every live tool page (EN + ES) that
// doesn't already have them. Once installed, scripts/inject-tool-knit.mjs
// fills the block on every build.
//
// Run once when adding the knit module to a new tool. Re-running is
// safe — pages that already carry the sentinels are skipped.
//
//   node scripts/add-tool-knit-sentinels.mjs           # writes
//   node scripts/add-tool-knit-sentinels.mjs --dry-run # preview only

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const dryRun     = process.argv.includes('--dry-run');

const tools = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'tools.json'), 'utf8'));

const SNIPPET = '\n<!-- tool-knit --><!-- /tool-knit -->\n';
const MAIN_CLOSE_RE = /<\/main>/;
const SENTINEL_RE = /<!-- tool-knit -->[\s\S]*?<!-- \/tool-knit -->/;

function pagePath(slug, locale) {
  const url = locale === 'en' ? tools.tools[slug].url_en : tools.tools[slug].url_es;
  const stripped = url.replace(/^\/+/, '').replace(/\/$/, '');
  return path.join(REPO, stripped, 'index.html');
}

let installed = 0;
let alreadyHad = 0;
const missing = [];

for (const [slug, t] of Object.entries(tools.tools)) {
  if (t.status !== 'live') continue;
  for (const locale of ['en', 'es']) {
    const fp  = pagePath(slug, locale);
    const rel = path.relative(REPO, fp);
    if (!fs.existsSync(fp)) { missing.push(rel); continue; }
    const src = fs.readFileSync(fp, 'utf8');
    if (SENTINEL_RE.test(src)) { alreadyHad++; continue; }
    if (!MAIN_CLOSE_RE.test(src)) {
      console.error(`${rel}: no </main> found — skipping`);
      continue;
    }
    const next = src.replace(MAIN_CLOSE_RE, `${SNIPPET}</main>`);
    if (!dryRun) fs.writeFileSync(fp, next);
    installed++;
    console.log(`${dryRun ? 'would install' : 'installed'}: ${rel}`);
  }
}

if (missing.length) {
  console.warn('\nmissing tool pages:');
  for (const r of missing) console.warn('  ' + r);
}

console.log(`\n${dryRun ? 'would install' : 'installed'} ${installed} sentinel(s); ${alreadyHad} already had them.`);
