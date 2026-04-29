#!/usr/bin/env node
// Sprint 2 (Cohesion) — flag drift between tool-knit.json and
// library-tags.json glossary mappings.
//
// Two declarations of the same relationship live in the repo:
//
//   data/tool-knit.json    — drives the tool page's "Glossary" column
//                            in the bottom "Keep going" knit aside.
//                            Curated short list (cap 3 per tool).
//
//   data/library-tags.json — drives the glossary entry's "Used in"
//                            column. Comprehensive — every tool that
//                            references the term should appear here
//                            so the term back-links correctly.
//
// Cohesion rule: every term shown on a tool's Glossary column MUST
// exist in that tool's library-tags glossary_terms[]. Otherwise the
// tool's page links to the term, but the term has no back-link to
// the tool — broken loop.
//
// The reverse (lt-only terms not in tk) is fine — library-tags is
// the long list; tool-knit is the curated highlights.
//
// Modes:
//   node scripts/check-knit-coverage.mjs         # report + exit 0 (warn-only)
//   node scripts/check-knit-coverage.mjs --check # report + exit 1 if drift
//
// Sprint 2: warn-only. Sprint 16 (CI guardrails) flips to fail-CI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const tk = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'tool-knit.json'),    'utf8'));
const lt = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data', 'library-tags.json'), 'utf8'));

// tool-knit uses slug "restaurant-audit"; library-tags uses URL-style
// key "audits/restaurant". The same normalization wire-glossary-knit
// uses (scripts/wire-glossary-knit.mjs:143).
function tkSlugToLtKey(slug) {
  return slug === 'restaurant-audit' ? 'audits/restaurant' : slug;
}

const drift = [];

for (const [tkSlug, tkMeta] of Object.entries(tk.tools || {})) {
  const tkTerms = tkMeta.glossary || [];
  if (!tkTerms.length) continue;

  const ltKey  = tkSlugToLtKey(tkSlug);
  const ltMeta = (lt.tools && lt.tools[ltKey]) || null;
  if (!ltMeta) {
    drift.push({
      tool: tkSlug,
      kind: 'tool-missing-from-library-tags',
      detail: `tool-knit declares glossary terms [${tkTerms.join(', ')}] for "${tkSlug}", but data/library-tags.json has no entry for "${ltKey}".`,
    });
    continue;
  }
  const ltTerms = ltMeta.glossary_terms ||
                  (ltMeta.glossary_term ? [ltMeta.glossary_term] : []);
  const missing = tkTerms.filter((t) => !ltTerms.includes(t));
  if (missing.length) {
    drift.push({
      tool: tkSlug,
      kind: 'term-missing-back-link',
      detail: `${tkSlug} shows [${missing.join(', ')}] on its page but those term(s) don't list it in their "Used in" column. Add to data/library-tags.json tools["${ltKey}"].glossary_terms[].`,
    });
  }
}

if (drift.length) {
  console.log(`Knit coverage: ${drift.length} drift(s):\n`);
  for (const d of drift) {
    console.log(`  [${d.kind}] ${d.tool}`);
    console.log(`    ${d.detail}\n`);
  }
  console.log('After fixing data/library-tags.json, run:');
  console.log('  node scripts/wire-glossary-knit.mjs');
  console.log('to refresh every glossary term page\'s "Used in" column.');
} else {
  console.log('Knit coverage: clean.');
}

if (checkMode && drift.length > 0) {
  // Sprint 16 — promoted to fail-CI.
  process.exit(1);
}
