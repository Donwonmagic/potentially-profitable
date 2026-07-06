#!/usr/bin/env node
/**
 * check-cost-index-dispatch-fresh.mjs — keep the Cost Index blog dispatch in step
 * with the data. The dispatch (blog/cost-index-week-<asOf>/ — dated slug family,
 * kept across the cadence pivot) is a build step that has to be RUN against the
 * refreshed index; it's easy to forget, so the published write-up drifts behind the
 * data (exactly what happened the week of 2026-06-16). This gate fails CI when the
 * vendored data is more than an edition-cycle newer than the latest published
 * dispatch — "you have fresh data but a stale post; run the dispatch."
 *
 * MONTHLY cadence aware (2026-07-06 pivot; weekly before): the dispatch may lag the
 * data by up to MAX_LAG_DAYS — a first-Tuesday cycle can stretch to 35 days
 * (first Tuesday on the 1st -> next on the 5th), plus slack — before this
 * complains, so the Mon/Wed/Fri data refresh doesn't demand a mid-cycle post.
 *
 *   node scripts/check-cost-index-dispatch-fresh.mjs            # gate
 *   node scripts/check-cost-index-dispatch-fresh.mjs --self-test
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_LAG_DAYS = 38;  // a max first-Tuesday cycle (35d) + slack before a fresh-data post is "overdue"

function dataAsOf() {
  // The seed the dashboard + dispatch read; generatedAt is the freshness stamp.
  try {
    const m = readFileSync(path.join(repo, 'data/cost-index.js'), 'utf8').match(/"generatedAt"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
    if (m) return m[1];
  } catch { /* fall through */ }
  try {
    const d = JSON.parse(readFileSync(path.join(repo, 'data/cost-index.json'), 'utf8'));
    return d.generatedAt || null;
  } catch { return null; }
}

function latestDispatch() {
  let best = null;
  try {
    for (const e of readdirSync(path.join(repo, 'blog'), { withFileTypes: true })) {
      const m = e.isDirectory() && e.name.match(/^cost-index-week-(\d{4}-\d{2}-\d{2})$/);
      if (m && (!best || m[1] > best)) best = m[1];
    }
  } catch { /* none */ }
  return best;
}

function days(a, b) { return Math.round((Date.parse(a) - Date.parse(b)) / 86400000); }

function selfTest() {
  const checks = [
    ['fresh dispatch (same day) passes', days('2026-06-16', '2026-06-16') <= MAX_LAG_DAYS],
    ['a normal month behind still passes', days('2026-08-04', '2026-07-07') <= MAX_LAG_DAYS],
    ['a max first-Tuesday cycle (35d) passes', days('2026-09-05', '2026-08-01') <= MAX_LAG_DAYS],
    ['six weeks behind fails', days('2026-08-15', '2026-07-01') > MAX_LAG_DAYS],
    ['a fully skipped cycle would be caught', days('2026-09-08', '2026-07-07') > MAX_LAG_DAYS],
  ];
  const failed = checks.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`dispatch-fresh self-test: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();

const asOf = dataAsOf();
const latest = latestDispatch();
if (!asOf) { console.log('Dispatch freshness: no data asOf found — skipping (informational).'); process.exit(0); }
if (!latest) { console.error('✗ no Cost Index dispatch published yet — run: node scripts/build-cost-index-dispatch.mjs'); process.exit(1); }

const lag = days(asOf, latest);
if (lag > MAX_LAG_DAYS) {
  console.error(`✗ the Cost Index data is ${lag} days newer (asOf ${asOf}) than the latest dispatch (week of ${latest}). Publish the dispatch write-up: node scripts/build-cost-index-dispatch.mjs (then the chain + check-all).`);
  process.exit(1);
}
console.log(`✓ Cost Index dispatch is current — week of ${latest}, data asOf ${asOf} (${Math.max(0, lag)}d lag, ≤ ${MAX_LAG_DAYS}).`);
