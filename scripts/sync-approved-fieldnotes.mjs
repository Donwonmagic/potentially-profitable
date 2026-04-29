#!/usr/bin/env node
/**
 * Phase F.5 (Field Notes) — build-time data sync.
 *
 * Optionally fetches the canonical merged-fieldnotes JSON from the
 * Worker's /api/admin/submissions/publish-data endpoint and
 * overwrites data/article-fieldnotes.json.
 *
 * Runs as part of the build chain in wrangler.jsonc:146 IMMEDIATELY
 * BEFORE inject-article-fieldnotes.mjs. Idempotent — if the merged
 * KV state matches the local file, no diff.
 *
 * The script no-ops with a friendly log line when neither
 * CLOUDFLARE_API_TOKEN nor PUBLISH_FIELDNOTES_URL are set, so:
 *   - Local builds without credentials still pass.
 *   - CI without secrets still passes (the data file ships from
 *     whatever Don last committed).
 *   - Don's flow: review submissions in /admin/submissions/, click
 *     "Sync to data file" to download, commit via GitHub mobile.
 *
 * Future automation (out of scope today): graduate to a GitHub
 * Action that runs this script and opens a PR; or invoke directly
 * from CF Pages Build using wrangler kv:bulk-get.
 *
 * Usage:
 *   PUBLISH_FIELDNOTES_URL=https://muntin.digital/api/admin/submissions/publish-data \
 *   CLOUDFLARE_API_TOKEN=... \
 *     node scripts/sync-approved-fieldnotes.mjs
 *
 *   node scripts/sync-approved-fieldnotes.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const TARGET = path.join(repoRoot, 'data', 'article-fieldnotes.json');
const URL_   = process.env.PUBLISH_FIELDNOTES_URL || '';
const TOKEN  = process.env.CLOUDFLARE_API_TOKEN || process.env.MUNTIN_ADMIN_TOKEN || '';

async function main() {
  if (!URL_ || !TOKEN) {
    console.log('sync-approved-fieldnotes: no PUBLISH_FIELDNOTES_URL+CLOUDFLARE_API_TOKEN; skipping (data file ships from git).');
    return;
  }
  let res;
  try {
    res = await fetch(URL_, {
      headers: {
        'cookie': 'muntin_session=' + TOKEN,
      },
    });
  } catch (err) {
    console.warn('sync-approved-fieldnotes: fetch failed; keeping committed data file.', err && err.message);
    return;
  }
  if (!res.ok) {
    console.warn('sync-approved-fieldnotes: ' + res.status + ' from publish-data; keeping committed data file.');
    return;
  }
  const json = await res.json();
  const out = JSON.stringify(json, null, 2) + '\n';
  const prev = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, 'utf8') : '';
  if (prev === out) {
    console.log('sync-approved-fieldnotes: data file matches KV state; no change.');
    return;
  }
  if (checkOnly) {
    console.log('sync-approved-fieldnotes: would update data/article-fieldnotes.json (KV state diverges).');
    process.exit(1);
  }
  fs.writeFileSync(TARGET, out);
  console.log('sync-approved-fieldnotes: wrote data/article-fieldnotes.json from KV state.');
}

main().catch((err) => {
  console.error('sync-approved-fieldnotes: unexpected error', err);
  // Do NOT fail the build — last-known-good data file ships.
});
