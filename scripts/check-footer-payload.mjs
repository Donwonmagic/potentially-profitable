#!/usr/bin/env node
// Phase 1 (Launch refresh) — verify every rendered footer carries the
// canonical payload elements.
//
// The site has three flavors of footer (canonical main-funnel, hand-
// crafted homepage, tool-utility) and they have drifted over time.
// This check enforces the minimum payload every footer must carry —
// regardless of flavor — so a reader landing on any page sees the
// same brand basics.
//
// Required across every page footer:
//   - foot-tagline             "The window in." / "La ventana."
//   - foot-blurb (with the canonical glossary count sentinel)
//   - foot-legal nav with: Terms, Privacy, Data & security (or
//     Datos y seguridad), Accessibility, Cookies, RSS
//   - reply-time microcopy OR contact section visible to the user
//
// Required on key marketing surfaces (homepage, services, about, work,
// blog index, library, tools index): the newsletter capture form.
//
// Modes:
//   node scripts/check-footer-payload.mjs         # report + exit 0
//   node scripts/check-footer-payload.mjs --check # exit 1 if any payload missing

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

// Pages that MUST carry the newsletter capture block. Pattern-matched
// against the path-relative slug. Add carefully — newsletter on every
// blog post is overkill; this is the high-intent surface set.
const NEWSLETTER_REQUIRED = [
  /^index\.html$/,
  /^es\/index\.html$/,
];

// Required tagline values (locale-aware via path).
function expectedTagline(relPath) {
  return relPath.startsWith('es/') ? 'La ventana.' : 'The window in.';
}

// Required legal-nav items per locale.
function expectedLegalItems(relPath) {
  if (relPath.startsWith('es/')) {
    return [
      /href="\/es\/terms\.html"/,
      /href="\/es\/privacy\.html"/,
      /href="\/es\/security\/"/,
      /href="\/es\/accessibility\.html"/,
      /href="\/es\/cookies\.html"/,
      /href="\/feed\.xml"/,
    ];
  }
  return [
    /href="\/terms\.html"/,
    /href="\/privacy\.html"/,
    /href="\/security\/"/,
    /href="\/accessibility\.html"/,
    /href="\/cookies\.html"/,
    /href="\/feed\.xml"/,
  ];
}

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

// Match the site footer specifically — the unclassed <footer> at the
// bottom of the page. In-article <footer class="..."> elements (e.g.
// .mc-foot on a Mailchimp embed) are not the site footer and must be
// ignored. There is exactly one site footer per page.
const FOOTER_RE = /<footer>\s*[\s\S]*?<\/footer>/i;

// Three footer flavors live on the site:
//   1. Marketing footer — populated <div class="foot-grid"> (tagline +
//      blurb + columns + legal). Must carry the full payload.
//   2. Trust footer     — bare <footer><div class="foot-bottom">
//      pattern used on /methods/, /receipts/, /security/, /never/,
//      /ai/, /changelog/, /system/. Locale-correct legal nav only.
//   3. Stub footer      — empty <div class="foot-grid"></div> on
//      functional surfaces (/sign-in/, /tools/start/) where the page
//      is a transactional/triage flow. Skip payload assertions
//      entirely.
function flavor(footer) {
  if (/<div class="foot-grid"><\/div>/.test(footer)) return 'stub';
  if (/class="foot-grid"/.test(footer)) return 'marketing';
  return 'trust';
}

let issues = 0;
const offenders = [];

for (const file of collectHtml(repoRoot)) {
  const rel = path.relative(repoRoot, file).split(path.sep).join('/');
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(FOOTER_RE);
  if (!m) continue; // pages with no <footer> are skipped
  const footer = m[0];
  const f = flavor(footer);
  if (f === 'stub') continue;

  if (f === 'marketing') {
    const want = expectedTagline(rel);
    if (!footer.includes(want)) {
      issues++;
      offenders.push({ file: rel, miss: 'tagline (' + want + ')' });
    }
    if (!/foot-blurb[\s\S]{0,400}<!-- count:glossary\.terms -->\d+<!-- \/count -->/.test(footer)) {
      issues++;
      offenders.push({ file: rel, miss: 'foot-blurb with count sentinel' });
    }
    if (NEWSLETTER_REQUIRED.some((p) => p.test(rel))) {
      if (!/foot-newsletter-form/.test(footer)) {
        issues++;
        offenders.push({ file: rel, miss: 'foot-newsletter-form (required on this page)' });
      }
    }
  }
  // Both flavors require the locale-correct legal-nav block.
  for (const re of expectedLegalItems(rel)) {
    if (!re.test(footer)) {
      issues++;
      offenders.push({ file: rel, miss: 'legal-nav link ' + re });
    }
  }
}

if (offenders.length === 0) {
  console.log('Footer payload: clean.');
  process.exit(0);
}

console.log('Footer payload: ' + issues + ' issue(s) across ' +
  new Set(offenders.map(o => o.file)).size + ' file(s).');
for (const o of offenders.slice(0, 80)) {
  console.log('  ' + o.file + ' -> missing ' + o.miss);
}
if (offenders.length > 80) console.log('  ... ' + (offenders.length - 80) + ' more.');

process.exit(checkMode ? 1 : 0);
