#!/usr/bin/env node
/**
 * Phase H — flip the site to a new weekly batch in one command.
 *
 * The Sunday-night-to-Monday-morning publishing cadence needs a one-
 * command operator gesture to flip the site over from Week N to
 * Week N+1. This script:
 *
 *   1. Reads data/library-batches.json, finds the batch entry, sets
 *      `current_batch` to the supplied key
 *   2. Runs scripts/inject-batch-banner.mjs to push the new banner
 *      across every page
 *   3. Reports what was flipped + what URL the banner now points at
 *
 * Usage:
 *
 *   # add the new batch entry to data/library-batches.json first, then:
 *   node scripts/promote-batch.mjs 2026-w2
 *
 *   # to verify what the current state would be without flipping:
 *   node scripts/promote-batch.mjs --dry-run
 *
 *   # to take the banner DOWN entirely (quiet week, no new batch):
 *   node scripts/promote-batch.mjs --hide
 *
 * Idempotent: re-running with the same key is a no-op.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const hide   = args.includes('--hide');
const newKey = args.find(a => !a.startsWith('--'));

const manifestPath = path.join(REPO, 'data/library-batches.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (!hide && !newKey) {
  console.error('usage: promote-batch.mjs <batch-key> | --hide | --dry-run');
  console.error(`available batches: ${Object.keys(manifest.batches).join(', ')}`);
  console.error(`current_batch: ${manifest.current_batch}`);
  process.exit(2);
}

if (hide) {
  if (manifest.current_batch === null) {
    console.log('current_batch already null. Nothing to do.');
    process.exit(0);
  }
  console.log(`Hiding batch banner (was: ${manifest.current_batch})`);
  manifest.current_batch = null;
} else {
  if (!manifest.batches[newKey]) {
    console.error(`error: batch "${newKey}" not in data/library-batches.json`);
    console.error(`available: ${Object.keys(manifest.batches).join(', ')}`);
    console.error('add the batch entry first, then re-run.');
    process.exit(1);
  }
  if (manifest.current_batch === newKey) {
    console.log(`current_batch already "${newKey}". Re-running injector to refresh stamps.`);
  } else {
    console.log(`Flipping current_batch: ${manifest.current_batch} → ${newKey}`);
    const b = manifest.batches[newKey];
    console.log(`  date:       ${b.date}`);
    console.log(`  expires:    ${b.expires}`);
    console.log(`  headline:   ${b.headline_en}`);
    console.log(`  overview:   ${b.overview_en}`);
    manifest.current_batch = newKey;
  }
}

if (dryRun) {
  console.log('--dry-run set; not writing manifest, not running injector.');
  process.exit(0);
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('Wrote data/library-batches.json.');
console.log('Running scripts/inject-batch-banner.mjs ...');
const result = spawnSync('node', [path.join(REPO, 'scripts/inject-batch-banner.mjs')], { stdio: 'inherit', cwd: REPO });
if (result.status !== 0) {
  console.error(`inject-batch-banner exited ${result.status}`);
  process.exit(result.status);
}
console.log('\nDone. Commit + push to deploy:');
console.log('  git add -A && git commit -m "batch: promote ' + (hide ? '(hide)' : newKey) + '" && git push');
