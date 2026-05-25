#!/usr/bin/env node
/**
 * Drift check for the §COURSE-MOBILE block.
 *
 * Re-runs scripts/inject-course-mobile-css.mjs in --check mode and
 * exits non-zero if any course page would change — i.e., somebody hand-
 * edited the sentinel block or removed it. This is the single source
 * of truth that the rules are byte-identical across all 50+ stamped
 * course pages.
 *
 * Wired into scripts/check-all.mjs so PR CI catches drift before merge.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const injector   = path.join(repoRoot, 'scripts', 'inject-course-mobile-css.mjs');

const result = spawnSync(process.execPath, [injector, '--check'], {
  cwd: repoRoot,
  stdio: 'inherit'
});

if (result.status !== 0) {
  console.error('\ncheck-course-mobile-css: drift detected. Run `node scripts/inject-course-mobile-css.mjs` to refresh.');
  process.exit(1);
}
process.exit(0);
