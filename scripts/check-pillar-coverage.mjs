#!/usr/bin/env node
/**
 * Topical-authority — pillar coverage.
 *
 * Every library + blog article should belong to a topic pillar so it earns a
 * topic chip, topic-page membership, and a place in the topic graph. Pillar
 * membership lives in data/library-tags.json#blog_posts (the `topics[]` array;
 * topics[0] is the canonical pillar); the 8 pillars are data/topics.json. There
 * is no separate pillar-map — library-tags.json IS the source of truth, and
 * this gate keeps it from drifting:
 *
 *   1. every on-disk library/<slug>/ and blog/<slug>/ has an entry with >=1
 *      valid pillar (no pillar-orphan), except dated OFF_FUNNEL_WAIVERS;
 *   2. topics[0] is one of the 8 pillars;
 *   3. no topics[] references a non-existent pillar;
 *   4. depth floor: each pillar has >= FLOOR member articles (reported).
 *
 * Warn-first during rollout (matches the repo convention); --check flips the
 * hard rules (1-3) to fail-CI. The depth floor (4) is always advisory.
 *
 *   node scripts/check-pillar-coverage.mjs           # report + exit 0
 *   node scripts/check-pillar-coverage.mjs --check   # exit 1 on a pillar-orphan / bad pillar
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkMode = process.argv.includes('--check');

const FLOOR = 4;
// Off-funnel / generated landing surfaces that are intentionally NOT part of
// the article topic graph (catalog/gallery pages, not pillar articles). Dated
// 2026-06-18; revisit if any becomes a real article.
const OFF_FUNNEL_WAIVERS = new Set([
  'ingredient-yields',        // generated yield-table catalog
  'menu-design-cuisines',     // generated cuisine gallery (non-article per build-llms-txt)
  'menu-design-themes',       // generated theme gallery (non-article per build-llms-txt)
]);

const pillars = new Set(JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/topics.json'), 'utf8')).topics.map((t) => t.slug));
const tags = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/library-tags.json'), 'utf8')).blog_posts;

function dirSlugs(rel) {
  const full = path.join(repoRoot, rel);
  try {
    return fs.readdirSync(full, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== 'drafts')
      .map((e) => e.name)
      .filter((s) => fs.existsSync(path.join(full, s, 'index.html')));
  } catch { return []; }
}

const onDisk = [...dirSlugs('library'), ...dirSlugs('blog')];

const orphans = [];      // on-disk, no entry or no valid pillar
const badPrimary = [];   // topics[0] not a pillar
const badRefs = [];      // topics[] references unknown pillar
for (const slug of onDisk) {
  if (OFF_FUNNEL_WAIVERS.has(slug)) continue;
  const entry = tags[slug];
  const topics = (entry && entry.topics) || [];
  const valid = topics.filter((t) => pillars.has(t));
  if (valid.length === 0) { orphans.push(slug); continue; }
  if (!pillars.has(topics[0])) badPrimary.push(`${slug} (topics[0]="${topics[0]}")`);
  for (const t of topics) if (!pillars.has(t)) badRefs.push(`${slug} → "${t}"`);
}

// Depth floor (membership = any topic), advisory.
const counts = Object.fromEntries([...pillars].map((p) => [p, 0]));
for (const [, v] of Object.entries(tags)) for (const t of (v.topics || [])) if (counts[t] !== undefined) counts[t]++;
const thin = Object.entries(counts).filter(([, n]) => n < FLOOR);

const hardFails = orphans.length + badPrimary.length + badRefs.length;

if (hardFails === 0 && thin.length === 0) {
  console.log(`Pillar coverage: clean — ${onDisk.length} pages, every one in a valid pillar; all ${pillars.size} pillars >= ${FLOOR}.`);
  process.exit(0);
}

if (orphans.length) console.log(`Pillar-orphans (no valid pillar): ${orphans.join(', ')}`);
if (badPrimary.length) console.log(`Bad primary pillar (topics[0]): ${badPrimary.join('; ')}`);
if (badRefs.length) console.log(`Unknown pillar referenced: ${badRefs.join('; ')}`);
if (thin.length) console.log(`Thin pillars (< ${FLOOR} members, advisory): ${thin.map(([p, n]) => `${p}=${n}`).join(', ')}`);
console.log(`\nSource of truth: data/library-tags.json#blog_posts (topics[0] = canonical pillar). Waive an off-funnel surface in OFF_FUNNEL_WAIVERS (dated).`);

if (checkMode && hardFails > 0) process.exit(1);
process.exit(0);
