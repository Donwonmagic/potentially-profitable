#!/usr/bin/env node
/**
 * Taxonomy migration — nine topics to four, under the closed-month doctrine.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * data/topics.json is the smallest file on the site with the largest reach. It
 * is stamped into the topic chip on every glossary term, the ItemList on
 * /learn/topics/, the eyebrow above every article, the DefinedTermSet, and the
 * cluster ids in data/tools.json. It is, in other words, the first thing a
 * crawler or a language model reads to decide what this company is about — and
 * six of its nine entries name the retired web-design line, five of whose hub
 * pages are ALREADY noindex while still generating 27-46 inbound editorial links
 * apiece. Freezing the page did not remove it from the taxonomy that produces
 * the links to it.
 *
 * The proposal is data/topics.proposed.json. This script is what turns it into
 * a commit, and what proves — before anything is written — that the swap will
 * not break a build.
 *
 * WHAT IT DOES NOT DO
 *
 * It does not rename a slug. Slugs are final-forever (CLAUDE.md), and
 * /learn/topics/operations-margin/ carries 70 inbound editorial links, so that
 * topic changes its DISPLAY NAME and keeps its URL. It does not delete a page:
 * a retired topic's hub keeps its file and its URL, stops being regenerated, and
 * still answers any external backlink. It does not write the two new pillar
 * essays — those are founder voice and data/topic-essays.json says so.
 *
 * Usage:
 *   node scripts/migrate-topics.mjs              # --plan (default): print the exact worklist, write nothing
 *   node scripts/migrate-topics.mjs --preflight  # just the blocking checks, exit 1 if any would break a build
 *   node scripts/migrate-topics.mjs --apply --force
 *        Writes data/topics.json and the data/library-tags.json remap.
 *        --force is required and deliberate: the deploy is red today (queue Q-005),
 *        and a taxonomy swap landing on top of a red deploy cannot be verified.
 *        Run the eight builders in data/topics.proposed.json#_ordering afterwards.
 *
 * Exit codes: 0 planned/applied cleanly · 1 a preflight check would break a build.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const p = (f) => path.join(REPO, f);
const read = (f) => JSON.parse(fs.readFileSync(p(f), 'utf8'));

/**
 * Glossary sections whose topic must move. Every retiring section is re-pointed
 * at a surviving topic or dropped — a section left pointing at a retired slug
 * silently loses its chip, which is how the 2026-07-28 glossary link-graph bug
 * froze four pages a live page still linked.
 */
export const SECTION_REMAP = {
  basics: { from: ['conversions'], to: [], why: 'website basics — retired line, no surviving topic. Terms keep their pages and lose their chip.' },
  mobile: { from: ['speed-mobile'], to: [], why: 'Core Web Vitals — retired line, no surviving topic.' },
  conversions: { from: ['conversions'], to: [], why: 'reservation funnel — retired line, no surviving topic.' },
  trust: { from: ['trust-reviews'], to: [], why: 'reviews and photos — retired line. Company trust moves to /security/ and /close/limits/, which are not library topics.' },
  findability: { from: ['local-seo'], to: [], why: 'map pack — retired line, the largest retired-line category (1,688 of 3,611 hits).' },
  subtypes: { from: ['operations-margin', 'local-seo'], to: ['operations-margin'], why: 'restaurant subtypes — keeps its margin half, drops its local-SEO half.' },
  'restaurant-numbers': { from: ['operations-margin'], to: ['operations-margin', 'count-and-close'], why: 'prime cost, food cost, the identity — gains the close topic, which is what those numbers are FOR.' },
  'data-literacy': { from: ['brand-design'], to: ['cost-data'], why: 'reading a chart honestly was filed under brand-design, which was always wrong; it belongs with the basis.' },
  'brand-design': { from: ['brand-design'], to: [], why: 'type and palette — retired line, no surviving topic.' },
  'cost-data': { from: ['cost-data'], to: ['cost-data'], why: 'unchanged.' },
};

export function preflight(proposed, topics, tools, tags) {
  const fails = [];
  const surviving = new Set(proposed.topics.map((t) => t.slug));
  const retiring = new Set(proposed.retiredTopics.map((t) => t.slug));

  // No slug may be renamed — a surviving slug must already exist, or be genuinely new.
  const today = new Set(topics.topics.map((t) => t.slug));
  for (const t of proposed.topics) {
    if (!today.has(t.slug) && !/^(invoices-and-vendors|count-and-close)$/.test(t.slug)) {
      fails.push(`topics.proposed introduces slug "${t.slug}" that is neither existing nor a declared addition — a rename in disguise`);
    }
  }
  // Every existing slug is accounted for: survives or retires. No silent drops.
  for (const s of today) {
    if (!surviving.has(s) && !retiring.has(s)) fails.push(`existing topic "${s}" is neither kept nor listed in retiredTopics — silent drop`);
  }
  // tools.json cluster ids must resolve after the swap, or build-tools-index.mjs:47 throws.
  for (const c of tools.clusters) {
    if (!surviving.has(c.id)) fails.push(`data/tools.json cluster "${c.id}" would not resolve — build-tools-index.mjs:47 throws on an unknown cluster id`);
  }
  // Every glossary section must have a remap decision.
  for (const sec of Object.keys(tags.glossary_section_to_topics)) {
    if (!SECTION_REMAP[sec]) fails.push(`glossary section "${sec}" has no entry in SECTION_REMAP — it would keep pointing at a topic that no longer exists`);
  }
  for (const [sec, r] of Object.entries(SECTION_REMAP)) {
    for (const t of r.to) if (!surviving.has(t)) fails.push(`SECTION_REMAP["${sec}"] targets "${t}", which does not survive`);
  }
  // Per-term overrides.
  const orphanedTerms = [];
  for (const [term, list] of Object.entries(tags.glossary_term_overrides)) {
    if (term === '_doc') continue;
    const kept = (list || []).filter((t) => surviving.has(t));
    if (!kept.length) orphanedTerms.push(term);
  }
  return { fails, orphanedTerms, surviving: [...surviving], retiring: [...retiring] };
}

export function remapTags(tags, surviving) {
  const out = JSON.parse(JSON.stringify(tags));
  for (const [sec, r] of Object.entries(SECTION_REMAP)) {
    if (out.glossary_section_to_topics[sec]) out.glossary_section_to_topics[sec] = r.to;
  }
  for (const [term, list] of Object.entries(out.glossary_term_overrides)) {
    if (term === '_doc') continue;
    out.glossary_term_overrides[term] = (list || []).filter((t) => surviving.has(t));
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const proposed = read('data/topics.proposed.json');
  const topics = read('data/topics.json');
  const tools = read('data/tools.json');
  const tags = read('data/library-tags.json');

  const pre = preflight(proposed, topics, tools, tags);

  if (pre.fails.length) {
    console.error(`✗ preflight — ${pre.fails.length} blocking issue(s):`);
    for (const f of pre.fails) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`✓ preflight — ${topics.topics.length} topics today → ${pre.surviving.length} surviving, ${pre.retiring.length} retiring; tools.json clusters resolve; every glossary section has a remap decision`);
  if (pre.orphanedTerms.length) {
    console.log(`  note: ${pre.orphanedTerms.length} glossary term override(s) lose every topic and will render without a chip: ${pre.orphanedTerms.join(', ')}`);
  }
  if (argv.includes('--preflight')) return;

  const nextTags = remapTags(tags, new Set(pre.surviving));
  const changedSections = Object.entries(SECTION_REMAP).filter(([s, r]) => JSON.stringify(tags.glossary_section_to_topics[s]) !== JSON.stringify(r.to));

  if (!argv.includes('--apply')) {
    console.log('\n── PLAN (nothing written) ───────────────────────────────');
    console.log('data/topics.json  topics[]:');
    for (const t of proposed.topics) console.log(`  KEEP/NEW  ${t.slug.padEnd(22)} ${t.name}  — ${t.change.split('.')[0]}`);
    for (const t of proposed.retiredTopics) console.log(`  RETIRE    ${t.slug.padEnd(22)} hub indexable today: ${t.hubIndexableToday}, ${t.inboundEditorialLinks} inbound editorial links (URL kept)`);
    console.log(`\ndata/library-tags.json  ${changedSections.length} of ${Object.keys(tags.glossary_section_to_topics).length} glossary sections remap:`);
    for (const [s, r] of changedSections) console.log(`  ${s.padEnd(20)} ${JSON.stringify(r.from)} → ${JSON.stringify(r.to)}  (${r.why})`);
    console.log('\nthen, in order:');
    console.log(`  ${proposed._ordering}`);
    console.log('\nrun with --apply --force to write. --force is required because the deploy is red today (queue Q-005).');
    return;
  }
  if (!argv.includes('--force')) {
    console.error('✗ --apply needs --force. The deploy is red (queue Q-005) and a taxonomy swap landing on a red deploy cannot be verified.');
    process.exit(1);
  }

  const nextTopics = {
    _doc: topics._doc.replace(/^The seven topics/, 'The four topics'),
    _retired: proposed.retiredTopics,
    _retiredNote: proposed._retiredTopicDisposition,
    _decisionOfRecord: proposed._decisionOfRecord,
    topics: proposed.topics.map(({ change, enPagesToday, ...t }) => t),
  };
  fs.writeFileSync(p('data/topics.json'), JSON.stringify(nextTopics, null, 2) + '\n');
  fs.writeFileSync(p('data/library-tags.json'), JSON.stringify(nextTags, null, 2) + '\n');
  console.log('✓ wrote data/topics.json (4 topics, 7 retired) and data/library-tags.json');
  console.log('  NOT DONE YET — run the builders in data/topics.proposed.json#_ordering, then node scripts/check-all.mjs');
}

if (process.argv[1] === __filename) main();
