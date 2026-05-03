#!/usr/bin/env node
// Phase 1 (Launch refresh) — flag contact-CTA verbs outside the canon.
//
// The launch refresh locks a 12-string CTA canon. This script catches
// retired verbs that would otherwise drift back into pages over time.
//
// Retired strings (EN):
//   "Send to Don"          (use "Send the note" inside an article foot
//                           form; "Email Don" / "Write to Don" elsewhere)
//   "Send & book your call"  (fold into the standard call-to-action)
//   "Read the case study"  (use "See the case study" on work cards)
//   "See the work"          (allowed only as a section/portfolio button
//                           targeting /work/ index — flag everywhere else)
//   "Email Don about ..."  (mid-prose body links should say
//                           "Write to Don about ...")
//
// Retired strings (ES):
//   "Enviar a Don"         (use "Enviar la nota" in field-note forms)
//   "Ver el trabajo"       (use "Ver el caso" on work cards)
//
// Modes:
//   node scripts/check-cta-canon.mjs         # report + exit 0
//   node scripts/check-cta-canon.mjs --check # exit 1 if any retired strings present

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

// (label, regex). Regex matches the offending string inside HTML.
// Each pattern carries its allowed-context exception inline.
const PATTERNS = [
  ['EN: "Send to Don" button',
   />Send to Don</g],
  ['EN: "Send & book your call"',
   />Send (?:&amp;|&) book your call</g],
  ['EN: "Read the case study" card-CTA',
   /(?:service-card-cta|restaurant-case-cta|gallery-cta)["'][^>]*>\s*Read the case study/g],
  ['EN: "See the work" card-CTA (use "See the case study" on per-case cards)',
   /(?:service-card-cta|restaurant-case-cta|gallery-cta)["'][^>]*>\s*See the work\s*</g],
  ['EN: "Email Don about ..." mid-prose link',
   /<a[^>]*>Email Don about [^<]+<\/a>/g],
  ['ES: "Enviar a Don" button',
   />Enviar a Don</g],
  ['ES: "Ver el trabajo" card-CTA',
   /(?:service-card-cta|restaurant-case-cta|gallery-cta)["'][^>]*>\s*Ver el trabajo\s*</g],
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

let totalHits = 0;
const offenders = [];

for (const file of collectHtml(repoRoot)) {
  const src = fs.readFileSync(file, 'utf8');
  for (const [label, re] of PATTERNS) {
    re.lastIndex = 0;
    const m = src.match(re);
    if (m) {
      totalHits += m.length;
      offenders.push({ file: path.relative(repoRoot, file), label, count: m.length });
    }
  }
}

if (offenders.length === 0) {
  console.log('CTA canon: clean.');
  process.exit(0);
}

console.log('CTA canon: ' + totalHits + ' off-canon string(s) found.');
for (const o of offenders) {
  console.log('  ' + o.file + ' — ' + o.label + ' (' + o.count + ')');
}
console.log('');
console.log('Replace per the canon:');
console.log('  Send to Don            -> Send the note (field-note forms)');
console.log('  Send & book your call  -> Email Don / Write to Don');
console.log('  Read the case study    -> See the case study (work cards)');
console.log('  See the work           -> See the case study (on per-case cards)');
console.log('  Email Don about ...    -> Write to Don about ... (mid-prose)');
console.log('  Enviar a Don           -> Enviar la nota (ES field-note forms)');
console.log('  Ver el trabajo         -> Ver el caso (ES work cards)');

process.exit(checkMode ? 1 : 0);
