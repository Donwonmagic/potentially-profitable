#!/usr/bin/env node
// Stamp the Cost Index seed's `generatedAt` into the Dataset / DataCatalog
// JSON-LD `dateModified` on the methodology pages (EN + ES) and — if it
// carries the catalog — the hub.
//
// Why: freshness is a top AI-citation factor. The index IS refreshed every
// business day (data/cost-index.js#generatedAt), but the structured-data `dateModified`
// machines read did not move with it. This wires the one to the other so the
// machine-readable freshness signal always matches the live read.
//
// Source of truth: the top-level `generatedAt` in data/cost-index.js (the
// browser seed the dashboard actually reads). We only touch the JSON-LD VALUE
// in place — we never regenerate a page (the operator's vendor owns the hub /
// per-ingredient page builders; this stamp must be safe to run between rebuilds).
//
//   node scripts/inject-cost-index-dataset-date.mjs           # stamps in place
//   node scripts/inject-cost-index-dataset-date.mjs --check   # exits non-zero if stale
//
// Idempotent: a second run makes no change. The --check mode is wired into
// scripts/check-all.mjs; the non-check invocation belongs in the cost-index
// refresh workflow so the stamp tracks each daily read.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

// --- Read generatedAt from the browser seed (a JS module, not JSON). ---------
const seedPath = path.join(REPO, 'data', 'cost-index.js');
const seedSrc  = fs.readFileSync(seedPath, 'utf8');
const genMatch = seedSrc.match(/"generatedAt"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
if (!genMatch) {
  console.error('inject-cost-index-dataset-date: could not read top-level "generatedAt" from data/cost-index.js');
  process.exit(2);
}
const generatedAt = genMatch[1];

// Pages that carry a Dataset and/or DataCatalog JSON-LD node. The hub is
// included so its DataCatalog gets the same stamp — but ONLY the dateModified
// value is edited in place; the page is never regenerated here.
const TARGETS = [
  'cost-index/methodology/index.html',
  'es/cost-index/methodology/index.html',
  'cost-index/index.html',
  'es/cost-index/index.html',
];

// On the JSON-LD node openers we care about, set (or insert) "dateModified".
// We match a node by its @type opener and operate only up to the end of that
// object's own scalar fields — by anchoring on the @type + @id pair and editing
// the dateModified that already sits in (or gets inserted right after) that
// opener. Both node families here always carry an @id immediately after @type.
const NODE_TYPES = ['Dataset', 'DataCatalog'];

function stampNode(html, type) {
  // Anchor: {"@type":"<type>","@id":"...."
  const opener = new RegExp(
    '\\{"@type":"' + type + '","@id":"[^"]*"'
  );
  const m = html.match(opener);
  if (!m) return { html, changed: false, present: false };

  const start = m.index;
  const openerEnd = start + m[0].length;

  // Is there already a "dateModified" for THIS node? Scan only within this
  // node's object (stop at the next node opener or end of the @graph array).
  const nextNode = html.slice(openerEnd).search(/\{"@type":"/);
  const nodeEnd = nextNode === -1 ? html.length : openerEnd + nextNode;
  const nodeBody = html.slice(openerEnd, nodeEnd);

  const dmRe = /"dateModified":"(\d{4}-\d{2}-\d{2})"/;
  const dmMatch = nodeBody.match(dmRe);

  if (dmMatch) {
    if (dmMatch[1] === generatedAt) return { html, changed: false, present: true };
    const updated = nodeBody.replace(dmRe, `"dateModified":"${generatedAt}"`);
    return { html: html.slice(0, openerEnd) + updated + html.slice(nodeEnd), changed: true, present: true };
  }

  // No dateModified yet — insert it right after the @id (the opener match).
  const insert = `,"dateModified":"${generatedAt}"`;
  return { html: html.slice(0, openerEnd) + insert + html.slice(openerEnd), changed: true, present: true };
}

let totalChanged = 0;
let staleFiles = [];

for (const rel of TARGETS) {
  const file = path.join(REPO, rel);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  let fileChanged = false;
  let stampedAny = false;

  for (const type of NODE_TYPES) {
    const res = stampNode(html, type);
    if (res.present) stampedAny = true;
    if (res.changed) { html = res.html; fileChanged = true; }
  }

  if (!stampedAny) continue; // no Dataset/DataCatalog on this page — skip silently

  if (fileChanged) {
    totalChanged++;
    staleFiles.push(rel);
    if (!checkOnly) fs.writeFileSync(file, html);
    console.log(`${checkOnly ? 'would stamp' : 'stamped'} dateModified=${generatedAt}: ${rel}`);
  }
}

if (checkOnly) {
  if (totalChanged > 0) {
    console.error(`\ncost-index dataset date: STALE — ${totalChanged} file(s) do not carry dateModified=${generatedAt}. Run: node scripts/inject-cost-index-dataset-date.mjs`);
    process.exit(1);
  }
  console.log(`cost-index dataset date: OK — JSON-LD dateModified matches seed generatedAt (${generatedAt}).`);
} else {
  console.log(`\nstamped ${totalChanged} file(s) with dateModified=${generatedAt}.`);
}
