#!/usr/bin/env node
/**
 * Heartbeat (SEO) — stamp index/hub pages with a TRUTHFUL article:modified_time.
 *
 * Collection hubs (homepage, blog index, library index) carried no dateModified,
 * so build-sitemap emitted no <lastmod> for them — the highest-traffic pages gave
 * crawlers no freshness signal. This injects an `article:modified_time` OG meta
 * (which build-sitemap reads) derived from the hub's NEWEST CHILD's own
 * dateModified — i.e. the date the hub last genuinely changed (a hub re-renders
 * when a new child lands). Honest by construction: never a hand-typed or "today"
 * date, only the real newest-child date.
 *
 * Hubs whose children carry no dateModified are SKIPPED unless a real date
 * source exists: the glossary hub is dated from data/glossary-added.json (newest
 * term-added date); tools/ is still SKIPPED (no dated source yet) — we
 * do not invent a date. They stay lastmod-less until a real date source is wired.
 *
 * Idempotent + sentinel-wrapped.  node scripts/inject-hub-modified-time.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const START = '<!-- hub-modified:start (scripts/inject-hub-modified-time.mjs) -->';
const END   = '<!-- /hub-modified:end -->';

function maxDateModified(dir) {
  let abs = path.join(repoRoot, dir);
  let best = '';
  let entries = [];
  try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch { return ''; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const f = path.join(abs, e.name, 'index.html');
    let src;
    try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
    for (const m of src.matchAll(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/g)) {
      if (m[1] > best) best = m[1];
    }
  }
  return best;
}

const nb = maxDateModified('blog'), nbEs = maxDateModified('es/blog');
const nl = maxDateModified('library'), nlEs = maxDateModified('es/library');
const mx = (...d) => d.filter(Boolean).sort().pop() || '';

// The glossary's term pages carry no per-page dateModified, but
// data/glossary-added.json records the date each term was added — its newest
// entry is the date the glossary hub last genuinely gained a term (a truthful
// freshness signal, not a build-time stamp). One shared source feeds EN + ES,
// since the term set mirrors across locales.
function newestGlossaryAdded() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/glossary-added.json'), 'utf8'));
    const dates = (j.added || []).map((e) => e && e.date).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d || ''));
    return dates.sort().pop() || '';
  } catch { return ''; }
}
const ng = newestGlossaryAdded();

// hub file -> truthful date (newest child it surfaces). Skip when no source.
const HUBS = {
  'index.html': mx(nb, nl),
  'es/index.html': mx(nbEs, nlEs),
  'blog/index.html': nb,
  'es/blog/index.html': nbEs,
  'library/index.html': nl,
  'es/library/index.html': nlEs,
  'glossary/index.html': ng,
  'es/glossary/index.html': ng,
};

let changed = 0; const stale = [];
for (const [rel, date] of Object.entries(HUBS)) {
  if (!date) continue;
  const f = path.join(repoRoot, rel);
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (!/<\/head>/i.test(src)) continue;
  const block = `${START}\n<meta property="article:modified_time" content="${date}" />\n${END}`;
  const re = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  let next;
  if (re.test(src)) next = src.replace(re, block);
  else next = src.replace(/(<\/head>)/i, `${block}\n$1`);
  if (next !== src) {
    if (checkOnly) stale.push(rel);
    else fs.writeFileSync(f, next);
    changed++;
  }
}

if (checkOnly && stale.length) {
  console.error(`hub-modified: ${stale.length} hub(s) stale: ${stale.join(', ')}`);
  process.exit(1);
}
console.log(`hub-modified: ${checkOnly ? 'all current' : `${changed} hub(s) stamped`} (blog ${nb||'—'}, library ${nl||'—'}, glossary ${ng||'—'}).`);
