#!/usr/bin/env node
// One-shot migration: wrap the small set of hand-maintained literal counts
// ("97-term glossary", "glosario de 97 términos", etc.) in
// <!-- count:KEY -->VALUE<!-- /count --> sentinels so that
// scripts/inject-site-counts.mjs can keep them current going forward.
//
// Why this exists: scripts/sync-includes.mjs only syncs a page footer
// when the existing footer contains FOOTER_MAIN_FUNNEL_MARKER
// ('/resources/restaurant-website-checklist/'), which is not present in
// the canonical _includes/footer.html. Result: page footers were
// effectively frozen at hand-write time and accumulated drift.
//
// Idempotent: re-running this is a no-op because each replacement is
// guarded by a "literal not already wrapped" precondition.
//
// Meta tags (<meta name="description">, <meta property="og:description">)
// cannot contain HTML comments, so those literal counts are hard-updated
// in place by their owning page's normal editing flow — not here.
//
//   node scripts/migrate-count-literals.mjs           # rewrites in place
//   node scripts/migrate-count-literals.mjs --check   # exits non-zero if anything would change

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

// Each rule pairs an existing literal phrase (kept verbatim from the
// site's actual copy) with the sentinel-wrapped replacement. The
// `guard` regex keeps the rewrite idempotent: if the surrounding text
// already includes any count:KEY sentinel, skip.
const RULES = [
  // EN foot-blurb (appears in every static page footer that wasn't
  // synced because of the missing FOOTER_MAIN_FUNNEL_MARKER).
  {
    find:    'and a 97-term glossary, with the studio',
    replace: 'and a <!-- count:glossary.terms -->97<!-- /count -->-term glossary, with the studio',
  },
  // ES foot-blurb counterpart.
  {
    find:    'un glosario de 97 t&eacute;rminos, con el estudio',
    replace: 'un glosario de <!-- count:glossary.terms -->97<!-- /count --> t&eacute;rminos, con el estudio',
  },
  // EN homepage body — "What's inside" sentence.
  {
    find:    'a 97-term <a href="/glossary/">glossary</a>',
    replace: 'a <!-- count:glossary.terms -->97<!-- /count -->-term <a href="/glossary/">glossary</a>',
  },
  // ES homepage body counterpart.
  {
    find:    '<a href="/es/glossary/">glosario</a> de 97 t&eacute;rminos',
    replace: '<a href="/es/glossary/">glosario</a> de <!-- count:glossary.terms -->97<!-- /count --> t&eacute;rminos',
  },
  // EN glossary entry "Browse all" header (~115 pages).
  {
    find:    '<span class="serif-italic">97 terms.</span>',
    replace: '<span class="serif-italic"><!-- count:glossary.terms -->97<!-- /count --> terms.</span>',
  },
  // ES glossary entry counterpart.
  {
    find:    '<span class="serif-italic">97 términos.</span>',
    replace: '<span class="serif-italic"><!-- count:glossary.terms -->97<!-- /count --> términos.</span>',
  },
  // Phase 5.5 — /resources/ folded into /learn/checklists/. Page
  // footers don't get synced (same FOOTER_MAIN_FUNNEL_MARKER quirk),
  // so the hand-frozen Library-column links in static pages need a
  // one-shot literal swap. The matched strings are deliberately
  // narrow (the exact <li> wrapper) so we don't accidentally rewrite
  // a future contextual link to the old path.
  {
    find:    '<li><a href="/resources/">Checklists &amp; guides</a></li>',
    replace: '<li><a href="/learn/checklists/">Checklists &amp; guides</a></li>',
  },
  {
    find:    '<li><a href="/es/resources/">Listas y recursos</a></li>',
    replace: '<li><a href="/es/learn/checklists/">Listas y recursos</a></li>',
  },
  // Contextual deep-links to the checklist itself, scattered across
  // blog posts, topic pages, the About and For-Restaurants pages.
  // The 301 redirect handles them, but rewriting in place avoids the
  // hop. Idempotent — guarded by the find-string still being present.
  {
    find:    '/resources/restaurant-website-checklist/',
    replace: '/learn/checklists/restaurant-website-checklist/',
  },
];

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

let changed = 0;
const perRule = Object.create(null);

for (const file of collectHtml(REPO)) {
  let src  = fs.readFileSync(file, 'utf8');
  let next = src;
  for (const r of RULES) {
    if (!next.includes(r.find)) continue;
    // Idempotency: if the find-string is already adjacent to a count
    // sentinel for the same key, skip it. The replace's wrapping is
    // unique enough that a second run finds no work.
    if (next.includes(r.replace)) continue;
    next = next.split(r.find).join(r.replace);
    perRule[r.find] = (perRule[r.find] || 0) + 1;
  }
  if (next !== src) {
    if (!checkOnly) fs.writeFileSync(file, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(REPO, file)}`);
  }
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s).`);
for (const [find, n] of Object.entries(perRule)) {
  console.log(`  ${n.toString().padStart(4)} × "${find.slice(0, 60)}${find.length > 60 ? '…' : ''}"`);
}

if (checkOnly && changed > 0) process.exit(1);
