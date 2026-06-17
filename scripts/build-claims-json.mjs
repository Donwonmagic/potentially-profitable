#!/usr/bin/env node
/**
 * Build /claims.json — the public, machine-readable claim ledger.
 *
 * Projects data/sourced-claims.json (the internal registry) into a
 * sanitized public artifact at the web root: every externally-verifiable
 * factual claim the library asserts, paired with its primary public
 * source and the date it was last checked. This is the "cite-me" trust
 * ledger — an answer engine (or a skeptical operator) can fetch
 * /claims.json and resolve any number on the site to a dated primary
 * source. No competitor in restaurant tech publishes one.
 *
 * Sanitization: drops the internal `notes` and `url_status` fields, and
 * omits the operator-experience claims (first-hand, no public URL — those
 * are documented at /about/#timeline). Output is sorted by id and carries
 * an `as_of` derived from the newest date_verified (NOT wall-clock time)
 * so the build is deterministic and the --check idempotency gate is stable.
 *
 *   node scripts/build-claims-json.mjs          # write claims.json
 *   node scripts/build-claims-json.mjs --check  # exit 1 if out of sync
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

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
    used_in: c.used_in || [],
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const asOf = claims.reduce(
  (max, c) => (c.date_verified && c.date_verified > max ? c.date_verified : max),
  '',
);

const out = {
  _doc:
    'Public, machine-readable claim ledger for muntin.digital. Every externally-verifiable factual claim used across the library, paired with its primary public source and the date it was last checked. Generated from data/sourced-claims.json by scripts/build-claims-json.mjs — do not edit by hand. Operator-experience claims (first-hand, no public URL) are documented at https://muntin.digital/about/#timeline.',
  as_of: asOf,
  count: claims.length,
  claims,
};

const target = path.join(repoRoot, 'claims.json');
const next = JSON.stringify(out, null, 2) + '\n';
const prev = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';

if (checkMode) {
  if (prev !== next) {
    console.error(
      'claims.json out of sync with data/sourced-claims.json — run: node scripts/build-claims-json.mjs',
    );
    process.exit(1);
  }
  console.log(`claims.json: in sync (${claims.length} claims, as of ${asOf}).`);
} else {
  fs.writeFileSync(target, next);
  console.log(`claims.json: wrote ${claims.length} claims (as of ${asOf}).`);
}
