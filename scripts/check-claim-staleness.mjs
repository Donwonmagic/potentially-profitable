#!/usr/bin/env node
/**
 * check-claim-staleness.mjs — the fact gate checks that a claim IS sourced. Nothing
 * checked whether the source had gone stale.
 *
 * data/sourced-claims.json is the registry docs/fact-check.md treats as absolute: every
 * published number must trace to an entry here. Each entry carries `date_verified`. Today
 * (2026-07-28) all 47 are fresh — the oldest is 75 days — so this gate is PREVENTIVE, and
 * that is exactly when it is cheap to add. Left ungated, a vendor pricing page verified in
 * May 2026 keeps backing a published dollar figure in 2029 and nobody notices, because
 * nothing in CI ever looks at the date again.
 *
 * OFFLINE BY CONSTRUCTION. The container has no network and no keys, so this cannot re-open
 * a source. Age is the only honest offline signal, and it is enough to force a human back
 * to the page.
 *
 * VOLATILITY IS INFERRED, NOT HAND-MAINTAINED. A blanket age limit is either noise (it
 * nags about structural facts that do not decay) or useless (it lets a price rot). Rather
 * than add a `volatility` field to 47 entries — an editorial judgment made 47 times, which
 * then drifts — the class is derived MECHANICALLY from the claim text:
 *
 *   VOLATILE   — the claim states a dollar amount, a percentage, or a specific year.
 *                Those are the numbers that go out of date: vendor pricing, published
 *                rates, wholesale levels, year-stamped statistics.
 *   STRUCTURAL — no such figure. A statement about how GPOs work does not decay the way
 *                a GPO's price tier does.
 *
 * The inference is visible in the output, so a wrong call is a visible wrong call rather
 * than a silent one.
 *
 * TWO TIERS, so this reminds before it blocks: a WARN window that prints loudly and still
 * exits 0, and a FAIL window well beyond it. Deliberately clock-dependent — like the
 * dispatch's 38-day freshness gate, going red IS the reminder. `MUNTIN_TODAY=YYYY-MM-DD`
 * pins the clock for testing.
 *
 *   node scripts/check-claim-staleness.mjs
 *   node scripts/check-claim-staleness.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Days. Volatile claims get ~1yr before the nag and ~1.5yr before the block; structural
// facts get 3 and 4 years. Generous on purpose — this is a backstop, not a treadmill.
export const LIMITS = {
  volatile: { warn: 365, fail: 550 },
  structural: { warn: 1095, fail: 1460 },
};

/** A dollar figure, a percent, or a specific year — the things that go out of date. */
export function classify(entry) {
  const text = [entry && entry.claim, entry && entry.notes].filter(Boolean).join(' ');
  const hasMoney = /\$\s?\d/.test(text);
  const hasPct = /\d\s?%/.test(text);
  const hasYear = /\b(19|20)\d{2}\b/.test(text);
  return (hasMoney || hasPct || hasYear) ? 'volatile' : 'structural';
}

export function daysBetween(fromIso, toIso) {
  const a = Date.parse(fromIso + 'T00:00:00Z'), b = Date.parse(toIso + 'T00:00:00Z');
  if (!isFinite(a) || !isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

export function audit(claims, todayIso, limits = LIMITS) {
  const bad = [], warn = [], fail = [];
  const rows = [];
  for (const [id, e] of Object.entries(claims)) {
    const dv = e && e.date_verified;
    const age = dv ? daysBetween(dv, todayIso) : null;
    if (age == null) { bad.push({ id, why: `date_verified missing or unparseable (${JSON.stringify(dv)})` }); continue; }
    if (age < 0) { bad.push({ id, why: `date_verified ${dv} is in the future` }); continue; }
    const kind = classify(e);
    const lim = limits[kind];
    const row = { id, kind, age, dv };
    rows.push(row);
    if (age > lim.fail) fail.push(row);
    else if (age > lim.warn) warn.push(row);
  }
  rows.sort((a, b) => b.age - a.age);
  return { rows, bad, warn, fail };
}

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  let fail = 0, ran = 0;
  const t = (n, c) => { ran++; if (!c) { console.error('  ✗', n); fail++; } };

  t('a dollar figure is volatile', classify({ claim: 'Plans start at $9 a month.' }) === 'volatile');
  t('a percentage is volatile', classify({ claim: 'Operators save roughly 10–30% on supply.' }) === 'volatile');
  t('a specific year is volatile', classify({ claim: 'USDA reported the 2026 cutout level.' }) === 'volatile');
  t('a mechanism with no figure is structural', classify({ claim: 'A GPO aggregates volume to reach pricing tiers.' }) === 'structural');
  t('notes are searched too, not just the claim', classify({ claim: 'x', notes: 'list price is $40' }) === 'volatile');
  t('a bare number is NOT enough to call it volatile', classify({ claim: 'There are 3 ways to do this.' }) === 'structural');

  t('day arithmetic', daysBetween('2026-01-01', '2026-01-31') === 30);
  t('unparseable date -> null, never NaN days', daysBetween('nope', '2026-01-01') === null);

  const claims = {
    fresh_price: { claim: 'costs $10', date_verified: '2026-07-01' },
    aging_price: { claim: 'costs $10', date_verified: '2025-06-01' },   // 422d -> warn
    rotten_price: { claim: 'costs $10', date_verified: '2024-01-01' },  // 939d -> fail
    old_structural: { claim: 'a GPO aggregates volume', date_verified: '2024-01-01' }, // 939d -> ok
    no_date: { claim: 'costs $10' },
    future: { claim: 'costs $10', date_verified: '2027-01-01' },
  };
  const a = audit(claims, '2026-07-28');
  t('fresh volatile claim is silent', !a.warn.concat(a.fail).some((r) => r.id === 'fresh_price'));
  t('aging volatile claim warns', a.warn.some((r) => r.id === 'aging_price'));
  t('rotten volatile claim fails', a.fail.some((r) => r.id === 'rotten_price'));
  t('the SAME age is fine for a structural claim', !a.warn.concat(a.fail).some((r) => r.id === 'old_structural'));
  t('a missing date is malformed, not merely stale', a.bad.some((r) => r.id === 'no_date'));
  t('a future date is caught', a.bad.some((r) => r.id === 'future' && /future/.test(r.why)));
  t('malformed entries are excluded from the age rows', !a.rows.some((r) => r.id === 'no_date' || r.id === 'future'));
  t('rows are sorted oldest first', a.rows[0].age >= a.rows[a.rows.length - 1].age);
  t('every surviving row carries its inferred class', a.rows.every((r) => r.kind === 'volatile' || r.kind === 'structural'));

  if (fail) { console.error(`check-claim-staleness self-test: ${fail} of ${ran} failed.`); process.exit(1); }
  console.log(`check-claim-staleness self-test: ${ran}/${ran} passed (volatility inference, date arithmetic, two tiers, malformed dates).`);
  process.exit(0);
}

// ── run ──────────────────────────────────────────────────────────────────────
function run() {
  const today = process.env.MUNTIN_TODAY || new Date().toISOString().slice(0, 10);
  const reg = JSON.parse(fs.readFileSync(path.join(repo, 'data/sourced-claims.json'), 'utf8'));
  const claims = reg.claims || {};
  if (!Object.keys(claims).length) {
    console.error('✗ claim-staleness: no claims found — the registry is the fact gate; an empty read is a broken read.');
    process.exit(1);
  }
  const { rows, bad, warn, fail } = audit(claims, today);

  for (const b of bad) console.error(`  ✗ ${b.id}: ${b.why}`);
  for (const r of fail) console.error(`  ✗ ${r.id} (${r.kind}) verified ${r.dv}, ${r.age}d ago — past the ${LIMITS[r.kind].fail}d limit. Re-open the source and bump date_verified, or retire the claim.`);
  for (const r of warn) console.log(`  ! ${r.id} (${r.kind}) verified ${r.dv}, ${r.age}d ago — re-verify before ${LIMITS[r.kind].fail}d.`);

  if (bad.length || fail.length) {
    console.error(`✗ claim-staleness: ${bad.length} malformed, ${fail.length} past the re-verify limit of ${rows.length + bad.length} claim(s).`);
    process.exit(1);
  }
  const oldest = rows[0];
  const nVol = rows.filter((r) => r.kind === 'volatile').length;
  console.log(`✓ claim-staleness: ${rows.length} claim(s) (${nVol} volatile / ${rows.length - nVol} structural), ${warn.length} due for re-verification, oldest ${oldest.age}d (${oldest.id}, ${oldest.dv}).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
