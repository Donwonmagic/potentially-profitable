#!/usr/bin/env node
/**
 * build-cost-index-reads.mjs — the measured-read spine (M/W/F), separate from the
 * published-edition spine.
 *
 * WHY A SECOND SPINE. `data/cost-index-editions.json` is a record of PUBLICATIONS: one
 * frozen entry per hand-written dispatch, rendered by build-cost-index-archive.mjs as
 * "every dispatch edition … a permanent, citable record", and used by computeWoW() to
 * anchor edition-over-edition claims. Appending refresh observations to it would (a) flood
 * the dispatch archive with things that were never published and (b) silently redefine
 * "edition-over-edition" as "two-days-over-two-days", which is exactly the commensurability
 * hazard ADR-011 exists to prevent. A measured read and a published edition are different
 * objects, so they get different files.
 *
 * THE HONESTY PROBLEM THIS SOLVES. The refresh runs Mon/Wed/Fri, but the basket rides
 * mostly MONTHLY public series — at the time of writing 10 of its 16 contributors sat at
 * 2026-04-01. Appending one row per refresh would republish identical numbers under a
 * fresher-looking date three times a week: manufactured freshness. So:
 *
 *   - A new entry is appended ONLY when the read actually changes (signature = data
 *     vintage + basket pct/dir/confidence/agreement/coverage/contributor counts).
 *   - When it has NOT changed, the existing entry's `lastCheckedAt` is advanced in place.
 *     "We looked on this date and nothing moved" is a true, useful statement.
 *   - Every entry carries BOTH dates, never collapsed: `dataAsOf` (the vintage of the
 *     underlying public series) and `firstSeenAt` / `lastCheckedAt` (when we observed it).
 *
 * It never publishes a post and never sends an email — ADR-012 stands; the dispatch stays
 * monthly, hand-written and hand-published. This is a data artifact only.
 *
 * Outputs: data/cost-index-reads.json (internal, append-only)
 *          cost-index/reads.json + cost-index/reads.csv (public, CC0 — a deterministic
 *          recompute of public-domain US government data per ADR-015 Decision 2).
 *
 *   node scripts/build-cost-index-reads.mjs                 # append/confirm today's read
 *   node scripts/build-cost-index-reads.mjs --check         # exit 1 if outputs are stale
 *   node scripts/build-cost-index-reads.mjs --self-test
 *   READ_DATE=2026-07-28 node scripts/build-cost-index-reads.mjs   # pin the observation date
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const SRC = 'data/cost-index.json';
const SPINE = 'data/cost-index-reads.json';
const PUB_JSON = 'cost-index/reads.json';
const PUB_CSV = 'cost-index/reads.csv';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';

const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));

// ── model ────────────────────────────────────────────────────────────────────
// The read as observed today, from the committed measured data. Never estimated.
export function readFrom(costIndex) {
  const b = costIndex.basket || {};
  const ing = costIndex.ingredients || {};
  // Freshest data date among the basket's own contributors — the honest "how current is
  // the thing the basket is made of" figure, which is NOT the same as basket.asOf.
  let freshest = null;
  for (const c of (b.contributors || [])) {
    const pts = (ing[c.ingredient] || {}).points || [];
    const d = pts.length ? pts[pts.length - 1].asOf : null;
    if (d && (!freshest || d > freshest)) freshest = d;
  }
  const cov = costIndex.coverage || {};
  return {
    dataAsOf: b.asOf || null,
    freshestContributorAsOf: freshest,
    pct: typeof b.pct === 'number' ? Number(b.pct.toFixed(6)) : null,
    dir: b.dir || null,
    agreement: typeof b.agreement === 'number' ? Number(b.agreement.toFixed(4)) : null,
    confidence: b.confidence || null,
    coverage: typeof b.coverage === 'number' ? Number(b.coverage.toFixed(4)) : null,
    nContributing: b.nContributing ?? null,
    nDeclared: b.nDeclared ?? null,
    measuredIngredients: cov.measured ?? null,
  };
}

// Two reads are "the same read" when every measured field matches. Observation dates are
// deliberately excluded — that is the whole point.
export function sameRead(a, b) {
  if (!a || !b) return false;
  const keys = ['dataAsOf', 'freshestContributorAsOf', 'pct', 'dir', 'agreement', 'confidence', 'coverage', 'nContributing', 'nDeclared', 'measuredIngredients'];
  return keys.every((k) => a[k] === b[k]);
}

export function appendRead(spine, read, readDate) {
  const reads = Array.isArray(spine.reads) ? spine.reads.slice() : [];
  const last = reads.length ? reads[reads.length - 1] : null;
  if (last && sameRead(last, read)) {
    // unchanged — advance the confirmation date in place, never mint a duplicate row
    if (last.lastCheckedAt !== readDate) {
      reads[reads.length - 1] = { ...last, lastCheckedAt: readDate };
      return { reads, action: 'confirmed' };
    }
    return { reads, action: 'noop' };
  }
  reads.push({ ...read, firstSeenAt: readDate, lastCheckedAt: readDate });
  return { reads, action: 'appended' };
}

const DOC = 'Append-only log of the MEASURED Cost Index basket read, observed on the Mon/Wed/Fri '
  + 'refresh. A row is added only when the read actually CHANGES; when it does not, that row\'s '
  + 'lastCheckedAt advances, so "we looked and nothing moved" is recorded honestly rather than '
  + 'republished as fresh. dataAsOf is the vintage of the underlying public series; firstSeenAt / '
  + 'lastCheckedAt are when Muntin observed it — the two are never collapsed. This is NOT the '
  + 'dispatch archive: published editions live in data/cost-index-editions.json and are '
  + 'hand-written monthly (ADR-011, ADR-012). A wholesale reference, never a delivered price, '
  + 'never a forecast.';

const COLS = ['firstSeenAt', 'lastCheckedAt', 'dataAsOf', 'freshestContributorAsOf', 'pct', 'dir', 'agreement', 'confidence', 'coverage', 'nContributing', 'nDeclared', 'measuredIngredients'];

export function toCsv(reads) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [COLS.join(',')].concat(reads.map((r) => COLS.map((c) => esc(r[c])).join(','))).join('\n') + '\n';
}

export function buildOutputs(reads) {
  const latest = reads.length ? reads[reads.length - 1] : null;
  const internal = { _doc: DOC, count: reads.length, reads };
  const pub = {
    name: 'Muntin Restaurant Cost Index — measured basket reads',
    description: DOC,
    license: CC0,
    methodology: 'https://muntin.digital/cost-index/methodology/',
    count: reads.length,
    latest,
    reads,
  };
  return {
    internal: JSON.stringify(internal, null, 2) + '\n',
    pub: JSON.stringify(pub, null, 2) + '\n',
    csv: toCsv(reads),
  };
}

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  let fail = 0; const t = (n, c) => { if (!c) { console.error('  ✗', n); fail++; } };
  const base = { dataAsOf: '2026-06-01', freshestContributorAsOf: '2026-06-05', pct: -0.005, dir: 'down', agreement: 0.5, confidence: 'medium', coverage: 1, nContributing: 16, nDeclared: 16, measuredIngredients: 101 };

  let s = { reads: [] };
  let r = appendRead(s, base, '2026-07-24'); s = { reads: r.reads };
  t('first observation appends', r.action === 'appended' && s.reads.length === 1);

  r = appendRead(s, base, '2026-07-27'); s = { reads: r.reads };
  t('unchanged read does NOT duplicate', r.action === 'confirmed' && s.reads.length === 1);
  t('unchanged read advances lastCheckedAt', s.reads[0].lastCheckedAt === '2026-07-27');
  t('unchanged read preserves firstSeenAt', s.reads[0].firstSeenAt === '2026-07-24');

  r = appendRead(s, base, '2026-07-27');
  t('same day twice is a no-op', r.action === 'noop');

  const moved = { ...base, pct: 0.011, dir: 'up' };
  r = appendRead(s, moved, '2026-07-29'); s = { reads: r.reads };
  t('a changed read appends a new row', r.action === 'appended' && s.reads.length === 2);
  t('new row carries its own firstSeenAt', s.reads[1].firstSeenAt === '2026-07-29');
  t('prior row keeps its history', s.reads[0].lastCheckedAt === '2026-07-27');

  // a data-vintage change alone is a real change
  r = appendRead(s, { ...moved, dataAsOf: '2026-07-01' }, '2026-07-31');
  t('new data vintage appends even at the same level', r.action === 'appended');

  t('sameRead ignores observation dates', sameRead({ ...base }, { ...base }));
  t('sameRead detects a confidence change', !sameRead(base, { ...base, confidence: 'low' }));

  const out = buildOutputs(s.reads);
  t('csv has a header + one row per read', out.csv.trim().split('\n').length === s.reads.length + 1);
  t('public json declares CC0', JSON.parse(out.pub).license === CC0);
  t('public json exposes latest', JSON.parse(out.pub).latest.pct === 0.011);
  t('doc states the two-date rule', DOC.includes('never collapsed'));
  t('doc disclaims delivered price + forecast', /never a delivered price/.test(DOC) && /never a forecast/.test(DOC));

  const readModel = readFrom({ basket: { asOf: '2026-06-01', pct: 0.5, dir: 'up', agreement: 1, confidence: 'high', coverage: 1, nContributing: 2, nDeclared: 2, contributors: [{ ingredient: 'a' }, { ingredient: 'b' }] }, ingredients: { a: { points: [{ asOf: '2026-05-01' }] }, b: { points: [{ asOf: '2026-06-05' }] } }, coverage: { measured: 7 } });
  t('freshest contributor is the MAX contributor date', readModel.freshestContributorAsOf === '2026-06-05');
  t('dataAsOf is basket.asOf, not the freshest', readModel.dataAsOf === '2026-06-01');

  if (fail) { console.error(`build-cost-index-reads self-test: ${fail} failure(s).`); process.exit(1); }
  console.log('build-cost-index-reads self-test: 17/17 passed (append-on-change, confirm-in-place, two-date discipline, CC0 outputs).');
  process.exit(0);
}

// ── run ──────────────────────────────────────────────────────────────────────
const readDate = process.env.READ_DATE || new Date().toISOString().slice(0, 10);
const spine = fs.existsSync(path.join(repo, SPINE)) ? rd(SPINE) : { reads: [] };
const read = readFrom(rd(SRC));
const { reads, action } = appendRead(spine, read, readDate);
const out = buildOutputs(reads);

const targets = [[SPINE, out.internal], [PUB_JSON, out.pub], [PUB_CSV, out.csv]];

if (CHECK) {
  let drift = 0;
  for (const [rel, content] of targets) {
    const cur = fs.existsSync(path.join(repo, rel)) ? fs.readFileSync(path.join(repo, rel), 'utf8') : '';
    // --check must not fail merely because the clock advanced; compare the READ CONTENT,
    // not today's confirmation stamp.
    const norm = (s) => s.replace(/"lastCheckedAt": "\d{4}-\d{2}-\d{2}"/g, '"lastCheckedAt": "*"').replace(/,\d{4}-\d{2}-\d{2},/g, ',*,');
    if (norm(cur) !== norm(content)) { console.error(`DRIFT: ${rel} is stale — run: node scripts/build-cost-index-reads.mjs`); drift++; }
  }
  if (drift) process.exit(1);
  console.log(`✓ cost-index reads: ${reads.length} recorded read(s) in sync; latest data vintage ${read.dataAsOf}.`);
} else {
  for (const [rel, content] of targets) fs.writeFileSync(path.join(repo, rel), content);
  const verb = action === 'appended' ? 'APPENDED a new read' : action === 'confirmed' ? 'confirmed unchanged' : 'already recorded today';
  console.log(`cost-index reads: ${verb} — ${reads.length} read(s) on file, data vintage ${read.dataAsOf}, observed ${readDate}.`);
}
