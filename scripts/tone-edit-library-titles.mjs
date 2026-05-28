#!/usr/bin/env node
// One-shot tone editor — Phase 7 library posts.
//
// De-times the 7 library article titles that still carry "2026" or
// equivalent year markers despite the slug rename in Wave 4a. Each
// rule is a per-article (article slug, find → replace) tuple; the
// find string occurs in every place the title is mentioned (page
// <title>, meta description, og:title, og:description, JSON-LD
// headline / name, AudioObject name, H1) so a single substring
// replacement catches all of them.
//
// Idempotent: re-running on already-edited files is a no-op.
//
// Usage:
//   node scripts/tone-edit-library-titles.mjs
//   node scripts/tone-edit-library-titles.mjs --apply

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const apply      = process.argv.includes('--apply');

// Each entry: { slug, replacements: [[from, to], ...] }
// The from-strings are the EXACT bytes that appear in the file; case
// and punctuation matter. Multiple replacements per article catch
// description variants that differ from the title.
const RULES = [
  {
    slug: 'custom-restaurant-website-pricing',
    replacements: [
      ['How Much Does a Custom Restaurant Website Cost in 2026?', 'How Much Does a Custom Restaurant Website Cost?'],
      ['Custom restaurant website costs in 2026, itemized',       'Custom restaurant website costs, itemized'],
    ],
  },
  {
    slug: 'does-my-restaurant-need-a-website',
    replacements: [
      ['Does My Restaurant Need a Website in 2026? The Honest Answer', 'Does My Restaurant Need a Website? The Honest Answer'],
      ['whether your restaurant needs its own website in 2026',        'whether your restaurant needs its own website'],
      // H1 has a flourish span — match exactly.
      ['Does my restaurant need a website <span class="serif-italic">in 2026?</span>',
       'Does my restaurant need <span class="serif-italic">a website?</span>'],
    ],
  },
  {
    slug: 'how-to-set-up-google-business-profile-for-your-restaurant',
    replacements: [
      ['How to Set Up Google Business Profile for Your Restaurant (2026 Guide)',
       'How to Set Up Google Business Profile for Your Restaurant'],
      ['How to Set Up Google Business Profile for Your Restaurant (2026)',
       'How to Set Up Google Business Profile for Your Restaurant'],
    ],
  },
  {
    slug: 'restaurant-app-decision',
    replacements: [
      ['Should Your Restaurant Actually Make an App in 2026?',
       'Should Your Restaurant Actually Make an App?'],
    ],
  },
  {
    slug: 'service-charge-vs-tipping-model',
    replacements: [
      ['Service charges vs tipping: the operator’s math for 2026',
       'Service charges vs tipping: the operator’s math'],
      ["Service charges vs tipping: the operator's math for 2026",
       "Service charges vs tipping: the operator's math"],
    ],
  },
  {
    slug: 'third-party-delivery-comparison',
    replacements: [
      ['Uber Eats vs DoorDash vs Grubhub: the honest math for independent restaurants, 2026',
       'Uber Eats vs DoorDash vs Grubhub: the honest math for independent restaurants'],
      ['Uber Eats vs DoorDash vs Grubhub: The Honest Math, 2026',
       'Uber Eats vs DoorDash vs Grubhub: The Honest Math'],
    ],
  },
  {
    slug: 'third-party-delivery-economics',
    replacements: [
      ['An honest DoorDash math for independent restaurants, 2026',
       'An honest DoorDash math for independent restaurants'],
      ['DoorDash math for 2026',
       'DoorDash math'],
      ['DoorDash order at an independent DMV restaurant in 2026',
       'DoorDash order at an independent DMV restaurant'],
    ],
  },
];

let articlesTouched = 0;
let replacementsApplied = 0;

for (const { slug, replacements } of RULES) {
  const file = path.join(repoRoot, 'library', slug, 'index.html');
  if (!fs.existsSync(file)) {
    console.log(`SKIP  library/${slug}/  (not found)`);
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  let out = src;
  let appliedHere = 0;
  for (const [from, to] of replacements) {
    if (!out.includes(from)) continue;
    const count = out.split(from).length - 1;
    out = out.split(from).join(to);
    appliedHere += count;
  }
  if (appliedHere === 0) {
    console.log(`(clean) library/${slug}/`);
    continue;
  }
  if (apply) fs.writeFileSync(file, out);
  console.log(`${apply ? 'EDITED' : 'would edit'}  library/${slug}/  (${appliedHere} replacements)`);
  articlesTouched++;
  replacementsApplied += appliedHere;
}

console.log(`\n${apply ? 'edited' : 'would edit'} ${articlesTouched} article(s); ${replacementsApplied} replacement(s) total.`);
if (!apply && articlesTouched > 0) console.log('Re-run with --apply to write.');
