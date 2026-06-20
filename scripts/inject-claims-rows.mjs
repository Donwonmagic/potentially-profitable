#!/usr/bin/env node
/**
 * Inject the claim-ledger rows into the human /claims/ pages.
 *
 * The public claim ledger has two faces, both projected from the single
 * registry data/sourced-claims.json:
 *   - /claims.json     — machine-readable (scripts/build-claims-json.mjs)
 *   - /claims/         — human-readable (this script)
 *
 * This injector fills the sentinel-bounded region
 *   <!-- claims:rows:start --> … <!-- claims:rows:end -->
 * on claims/index.html (EN) and es/claims/index.html (ES) with one row per
 * externally-verifiable claim — the claim text, its primary source (linked),
 * and the date it was last verified — plus a lead line carrying the count and
 * the as-of date. Claims are sorted by id and the as-of is derived from the
 * newest date_verified (NOT wall-clock), so the build is deterministic and the
 * --check idempotency gate is stable. The surrounding prose is hand-authored
 * and left untouched.
 *
 * Operator-experience claims (registry.operator_experience_claims) are
 * deliberately omitted — first-hand, no public URL — exactly as /claims.json
 * omits them; they're documented at /about/#timeline.
 *
 *   node scripts/inject-claims-rows.mjs          # write the rows
 *   node scripts/inject-claims-rows.mjs --check  # exit 1 if out of sync
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkMode = process.argv.includes('--check');

const registry = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'data', 'sourced-claims.json'), 'utf8'),
);

const claims = Object.entries(registry.claims || {})
  .map(([id, c]) => ({
    id,
    claim: c.claim,
    source_name: c.source_name,
    source_url: c.source_url,
    date_verified: c.date_verified,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const asOf = claims.reduce(
  (max, c) => (c.date_verified && c.date_verified > max ? c.date_verified : max),
  '',
);

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const LOCALES = {
  'claims/index.html': {
    lead: (n) =>
      `<strong>${n}</strong> externally-verifiable claims, each checked against a primary public source. Last verified ${asOf}.`,
    srcLabel: 'Source:',
    verified: 'verified',
  },
  'es/claims/index.html': {
    lead: (n) =>
      `<strong>${n}</strong> afirmaciones verificables, cada una contrastada con una fuente pública primaria. Última verificación: ${asOf}.`,
    srcLabel: 'Fuente:',
    verified: 'verificado el',
  },
};

const RE = /<!-- claims:rows:start -->[\s\S]*?<!-- claims:rows:end -->/;

function regionFor(cfg) {
  const rows = claims
    .map(
      (c) =>
        `        <li style="margin:0 0 16px;padding:0 0 16px;border-bottom:1px solid var(--line)">
          <p style="font-size:16px;line-height:1.55;color:var(--ink);margin:0 0 5px">${esc(c.claim)}</p>
          <p style="font-size:13px;line-height:1.5;color:var(--stone);margin:0">${cfg.srcLabel} <a href="${esc(c.source_url)}" style="color:var(--teal);border-bottom:1px dashed currentColor;text-decoration:none">${esc(c.source_name)}</a> &middot; ${cfg.verified} ${esc(c.date_verified)}</p>
        </li>`,
    )
    .join('\n');
  return `<!-- claims:rows:start -->
      <p style="font-size:15px;line-height:1.6;color:var(--ink-soft);margin:0 0 22px">${cfg.lead(claims.length)}</p>
      <ul style="list-style:none;padding:0;margin:0">
${rows}
      </ul>
      <!-- claims:rows:end -->`;
}

let changed = 0;
const stale = [];
for (const [rel, cfg] of Object.entries(LOCALES)) {
  const file = path.join(repoRoot, rel);
  const src = fs.readFileSync(file, 'utf8');
  if (!RE.test(src)) {
    console.error(`inject-claims-rows: sentinel region not found in ${rel}`);
    process.exit(1);
  }
  const next = src.replace(RE, regionFor(cfg));
  if (next !== src) {
    if (checkMode) stale.push(rel);
    else {
      fs.writeFileSync(file, next);
      changed++;
    }
  }
}

if (checkMode) {
  if (stale.length) {
    console.error(
      `claims rows out of sync (${stale.join(', ')}) — run: node scripts/inject-claims-rows.mjs`,
    );
    process.exit(1);
  }
  console.log(`claims rows: in sync (${claims.length} claims, as of ${asOf}).`);
} else {
  console.log(`claims rows: wrote ${claims.length} claims to ${changed} page(s) (as of ${asOf}).`);
}
