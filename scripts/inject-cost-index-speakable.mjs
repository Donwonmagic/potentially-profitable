#!/usr/bin/env node
/**
 * AEO — SpeakableSpecification for Cost Index ingredient pages.
 *
 * The per-ingredient pages are the site's data moat and a prime
 * "what does X cost wholesale" answer surface, but they shipped without
 * speakable markup. This stamps a WebPage node carrying a
 * SpeakableSpecification into each ingredient page's JSON-LD, so voice and
 * answer engines lift the ingredient name + its answer-first reading.
 *
 * Two page shapes (both emitted by build-cost-index-pages.mjs):
 *   - reading pages — JSON-LD @graph has a Dataset node, no WebPage. We ADD a
 *     WebPage node (mainEntity → the Dataset) with cssSelector ["h1",".ci-answer"].
 *   - pending pages — @graph already has a WebPage node, no Dataset. We ADD a
 *     speakable key to it with cssSelector ["h1",".ci-read__head"].
 *
 * Post-processor (runs after build-cost-index-pages.mjs, like
 * inject-cost-index-dataset-date.mjs): the generator owns the page body; this
 * owns the speakable JSON-LD. Idempotent — skips a page whose WebPage node
 * already carries speakable. Hub / methodology / sources / embed pages (no
 * Dataset and no per-ingredient WebPage) are left untouched.
 *
 *   node scripts/inject-cost-index-speakable.mjs           # write
 *   node scripts/inject-cost-index-speakable.mjs --check   # exit 1 on drift
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const ROOTS = ['cost-index', 'es/cost-index'];
// Non-ingredient cost-index pages: the hub + editorial/data surfaces.
const SKIP = new Set(['methodology', 'sources', 'embed']);

const LD_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;

function h1Text(html) {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : null;
}
function canonOf(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : null;
}

function processFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const ld = src.match(LD_RE);
  if (!ld) return null;
  let data;
  try { data = JSON.parse(ld[1]); } catch { return null; }
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : null;
  if (!graph) return null;

  const dataset = graph.find((n) => n['@type'] === 'Dataset');
  const webpage = graph.find((n) => n['@type'] === 'WebPage');
  // Neither shape → not an ingredient page (hub/catalog). Leave it.
  if (!dataset && !webpage) return null;

  const es = file.split(path.sep).join('/').startsWith('es/');
  const inLanguage = es ? 'es-US' : 'en-US';

  if (webpage && !dataset) {
    // Pending page: add speakable to the existing WebPage node.
    if (webpage.speakable) return null; // idempotent
    webpage.speakable = { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.ci-read__head'] };
  } else if (dataset) {
    // Reading page: if a WebPage with speakable already exists, done.
    if (webpage && webpage.speakable) return null;
    const canon = canonOf(src) || dataset.url;
    if (!canon) return null;
    if (webpage) {
      webpage.speakable = { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.ci-answer'] };
    } else {
      const node = {
        '@type': 'WebPage',
        '@id': canon + '#page',
        url: canon,
        inLanguage,
        isPartOf: { '@id': 'https://muntin.digital/#website' },
        mainEntity: { '@id': (dataset['@id'] || canon + '#dataset') },
        speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.ci-answer'] },
      };
      const name = h1Text(src);
      if (name) node.name = name;
      // Insert ahead of the Dataset so the page node reads first.
      graph.unshift(node);
    }
  }

  const next = src.replace(LD_RE, () => `<script type="application/ld+json">${JSON.stringify(data)}</script>`);
  return next === src ? null : next;
}

function* walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue;
      yield* walk(p);
    } else if (e.name === 'index.html') {
      yield p;
    }
  }
}

let changed = 0;
const changedFiles = [];
for (const root of ROOTS) {
  for (const file of walk(path.join(repoRoot, root))) {
    const next = processFile(file);
    if (next != null) {
      changed++;
      changedFiles.push(path.relative(repoRoot, file));
      if (!checkOnly) fs.writeFileSync(file, next);
    }
  }
}

if (changed === 0) {
  console.log('Cost-index speakable: in sync — every ingredient page carries a speakable WebPage node.');
  process.exit(0);
}
console.log(`Cost-index speakable: ${checkOnly ? 'would update' : 'updated'} ${changed} page(s).`);
for (const f of changedFiles.slice(0, 10)) console.log(`  ${f}`);
if (changedFiles.length > 10) console.log(`  … and ${changedFiles.length - 10} more.`);
if (checkOnly && changed > 0) process.exit(1);
process.exit(0);
