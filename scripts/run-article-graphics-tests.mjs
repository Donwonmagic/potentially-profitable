#!/usr/bin/env node
/**
 * Wrapper that invokes `node --test scripts/test-article-graphics.mjs`
 * as a child process so it can sit in `scripts/check-all.mjs` next to
 * the gate it tests. Exits with the test runner's status code.
 *
 * Why a wrapper: `check-all.mjs` runs each entry as
 *   spawnSync(node, ['scripts/<script>', ...args])
 * which passes the script first and node flags can only come before.
 * `node --test <file>` puts the flag before the file, so check-all
 * can't invoke it directly. This wrapper bridges the two by spawning
 * with the right argument order.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(__filename);

const r = spawnSync(
  process.execPath,
  ['--test', path.join(scriptsDir, 'test-article-graphics.mjs')],
  { stdio: 'inherit' },
);
process.exit(r.status ?? 1);
