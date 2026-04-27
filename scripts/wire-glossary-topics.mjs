#!/usr/bin/env node
// Stamp data-topics="topic1 topic2 ..." onto every <article class="gloss-term">
// in glossary/index.html and es/glossary/index.html.
//
// Topics come from data/library-tags.json:
//   1. Section-level default — each .gloss-section's id maps via
//      glossary_section_to_topics{} to one or more learn-topic slugs.
//   2. Per-term override — glossary_term_overrides{} replaces (not
//      augments) the section default for terms that span sections.
//
// The stamped attribute drives the topic-cluster filter chips on the
// index. Idempotent: re-running with the same library-tags is a no-op.
//
// Reports any term whose computed topics list is empty (e.g.
// "subtypes" maps to []) so the author can decide whether to add an
// override.
//
//   node scripts/wire-glossary-topics.mjs           # rewrites in place
//   node scripts/wire-glossary-topics.mjs --check   # exits non-zero if anything would change
//   node scripts/wire-glossary-topics.mjs --report  # prints the slug → topics mapping

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');
const reportOnly = process.argv.includes('--report');

const tags   = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'library-tags.json'), 'utf8'));
const topics = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'topics.json'),       'utf8'));
const validTopics = new Set(topics.topics.map((t) => t.slug));

const sectionMap   = tags.glossary_section_to_topics  || {};
const overrideMap  = tags.glossary_term_overrides     || {};

// Validate the mapping references real topic slugs.
const errors = [];
for (const [sec, list] of Object.entries(sectionMap)) {
  if (sec === '_doc') continue;
  for (const t of list) if (!validTopics.has(t)) errors.push(`section "${sec}" maps to unknown topic "${t}"`);
}
for (const [slug, list] of Object.entries(overrideMap)) {
  if (slug === '_doc') continue;
  for (const t of list) if (!validTopics.has(t)) errors.push(`override "${slug}" maps to unknown topic "${t}"`);
}
if (errors.length) {
  console.error('library-tags.json has invalid topic references:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(2);
}

// Walk the index page and stamp.
const TARGETS = [
  { file: 'glossary/index.html'    },
  { file: 'es/glossary/index.html' },
];

// Match a section opening with its id, then for every .gloss-term
// inside that section up to the next section, stamp data-topics
// based on (override ?? section_default).
const SECTION_RE = /<section class="gloss-section" id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
const TERM_RE    = /<article class="gloss-term"\s+id="([^"]+)"([^>]*)>/g;

let changed = 0;
const allMappings = {}; // slug → topics[]
const unmapped = [];

for (const { file } of TARGETS) {
  const fp  = path.join(REPO, file);
  const src = fs.readFileSync(fp, 'utf8');

  let next = src;
  // Use replace with a function: rebuild each section block with
  // updated <article> tags inside. Sections we don't recognize are
  // left alone (no section default; only an explicit override applies).
  next = next.replace(SECTION_RE, (sectionMatch, sectionId, body) => {
    const sectionTopics = sectionMap[sectionId] || [];
    const newBody = body.replace(TERM_RE, (termMatch, termId, attrs) => {
      const computed = overrideMap[termId] !== undefined ? overrideMap[termId] : sectionTopics;
      // Record (last writer wins, but EN and ES should agree).
      allMappings[termId] = computed;
      if (computed.length === 0) unmapped.push(`${file}: ${termId} (section "${sectionId}")`);
      // Build the new attribute list: drop any existing data-topics,
      // then append a fresh one. Preserve everything else verbatim.
      const cleaned = attrs.replace(/\s+data-topics="[^"]*"/g, '');
      const stamped = computed.length
        ? ` data-topics="${computed.join(' ')}"`
        : '';
      return `<article class="gloss-term" id="${termId}"${cleaned}${stamped}>`;
    });
    return sectionMatch.replace(body, newBody);
  });

  if (next !== src) {
    if (!checkOnly && !reportOnly) fs.writeFileSync(fp, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : reportOnly ? 'would update' : 'updated'}: ${file}`);
  }
}

if (reportOnly) {
  console.log('\nslug → topics:');
  for (const [slug, list] of Object.entries(allMappings).sort()) {
    console.log(`  ${slug.padEnd(36)} ${list.join(', ') || '(none)'}`);
  }
}

if (unmapped.length) {
  console.warn(`\n${unmapped.length} term(s) without a topic mapping (consider adding an override in library-tags.json):`);
  for (const u of unmapped.slice(0, 20)) console.warn('  ' + u);
  if (unmapped.length > 20) console.warn(`  … and ${unmapped.length - 20} more.`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${TARGETS.length} index page(s).`);
if (checkOnly && changed > 0) process.exit(1);
