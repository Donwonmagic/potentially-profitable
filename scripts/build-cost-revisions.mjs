#!/usr/bin/env node
/**
 * build-cost-revisions.mjs — the public REVISIONS / audit trail for the Cost Index.
 *
 * The single biggest authority signal a price-reporting agency has (BLS PPI, IOSCO PD391,
 * Urner-Barry "price change" notices): when a PREVIOUSLY-PUBLISHED reading changes, you say
 * so — openly, with the before/after — instead of silently overwriting it. Today muntin's
 * vendor step overwrites a print for a given date in place; git has the diff, but nothing
 * public records "the ribeye reading for 2026-06-13 was corrected from $X to $Y." This adds
 * that ledger.
 *
 * Mechanism (pure, deterministic, hermetic — no `now`, no git calls, no network):
 *   - Project the authoritative published feed (every cost-index/<slug>/series.json) to a
 *     compact { slug: { date: cents } } "vintage".
 *   - Diff the current vintage against the committed previous vintage
 *     (data/cost-index-readings.prev.json):
 *       · a date present in BOTH with a changed value  -> a REVISION
 *       · a date present in PREV but gone now           -> a WITHDRAWAL
 *       · a date only in NOW                            -> a normal new print (not a revision)
 *   - Append any new events (deduped by a content-derived id) to the append-only log
 *     (data/cost-revisions.json + public cost-index/revisions.json), then roll the prev
 *     vintage forward to current.
 *
 * Honest empty state: with no prior corrections the log reads "no revisions recorded" — itself
 * a credibility signal, and true today. Scope: revisions are detected within the published
 * series window (~26 prints/ingredient); prints aged out of that window are historical.
 *
 *   node scripts/build-cost-revisions.mjs            # detect, append, roll prev forward
 *   node scripts/build-cost-revisions.mjs --check    # CI: fail if readings drifted from prev, or copies out of sync
 *   node scripts/build-cost-revisions.mjs --self-test
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CI_DIR = path.join(repo, 'cost-index');
const PREV = path.join(repo, 'data/cost-index-readings.prev.json');
const LOG = path.join(repo, 'data/cost-revisions.json');
const PUBLIC_LOG = path.join(repo, 'cost-index/revisions.json');
const ORIGIN = 'https://muntin.digital';
const EPS_CENTS = 1;   // ignore sub-cent float noise; a real revision moves at least a cent

function rd(p, fallback) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; } }

// Compact vintage of the published feed: { slug: { "YYYY-MM-DD": integerCents } }, sorted.
function readingsProjection() {
  const out = {};
  const slugs = readdirSync(CI_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(path.join(CI_DIR, e.name, 'series.json')))
    .map((e) => e.name).sort();
  for (const slug of slugs) {
    const s = rd(path.join(CI_DIR, slug, 'series.json'), null);
    if (!s || !Array.isArray(s.observations)) continue;
    const byDate = {};
    for (const o of s.observations) {
      if (typeof o.priceUsd === 'number' && typeof o.date === 'string') byDate[o.date] = Math.round(o.priceUsd * 100);
    }
    if (Object.keys(byDate).length) {
      out[slug] = Object.fromEntries(Object.keys(byDate).sort().map((d) => [d, byDate[d]]));
    }
  }
  return out;
}

// Pure diff: prev/now are projections. Returns events sorted deterministically.
function diffVintages(prev, now) {
  const events = [];
  for (const slug of Object.keys(now).sort()) {
    const p = prev[slug] || {}, n = now[slug];
    for (const date of Object.keys(n).sort()) {
      if (date in p && Math.abs(n[date] - p[date]) >= EPS_CENTS) {
        const before = p[date], after = n[date];
        events.push({
          id: `R:${slug}:${date}:${before}->${after}`,
          type: 'revision', ingredient: slug, date,
          beforeCents: before, afterCents: after,
          deltaPct: before ? Math.round(((after - before) / before) * 10000) / 10000 : null,
        });
      }
    }
  }
  for (const slug of Object.keys(prev).sort()) {
    const p = prev[slug], n = now[slug] || {};
    for (const date of Object.keys(p).sort()) {
      if (!(date in n)) {
        events.push({ id: `W:${slug}:${date}:${p[date]}`, type: 'withdrawal', ingredient: slug, date, beforeCents: p[date], afterCents: null, deltaPct: null });
      }
    }
  }
  return events;
}

function logDoc(revisions) {
  return {
    _doc: 'Append-only audit trail of changes to PREVIOUSLY-PUBLISHED Cost Index readings. A revision = a date whose published wholesale reference changed between vintages; a withdrawal = a previously-published date no longer published. Built deterministically by scripts/build-cost-revisions.mjs from the per-ingredient series.json feeds; CI keeps it in sync (--check). An empty list means no published reading has ever been revised.',
    _version: 1,
    origin: ORIGIN,
    methodology: `${ORIGIN}/cost-index/methodology/#revision`,
    count: revisions.length,
    revisions,
  };
}

// Append new events (deduped by id) to an existing log, preserving prior order.
function mergeLog(existing, events) {
  const seen = new Set((existing.revisions || []).map((r) => r.id));
  const merged = (existing.revisions || []).slice();
  for (const e of events) if (!seen.has(e.id)) { merged.push(e); seen.add(e.id); }
  return merged;
}

function writeLog(revisions) {
  const json = JSON.stringify(logDoc(revisions), null, 2) + '\n';
  writeFileSync(LOG, json);
  writeFileSync(PUBLIC_LOG, json);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();

  if (process.argv.includes('--check')) {
    const now = readingsProjection();
    const prev = rd(PREV, null);
    const problems = [];
    if (prev == null) problems.push('missing data/cost-index-readings.prev.json — run the build to seed it');
    else if (JSON.stringify(prev) !== JSON.stringify(now)) {
      const pending = diffVintages(prev, now);
      problems.push(`published readings changed since the last revisions build (${pending.length} pending event(s)) — run: node scripts/build-cost-revisions.mjs`);
    }
    const logTxt = existsSync(LOG) ? readFileSync(LOG, 'utf8') : '';
    const pubTxt = existsSync(PUBLIC_LOG) ? readFileSync(PUBLIC_LOG, 'utf8') : '';
    if (logTxt !== pubTxt) problems.push('public cost-index/revisions.json differs from data/cost-revisions.json');
    if (problems.length) { problems.forEach((p) => console.error('✗ ' + p)); process.exit(1); }
    console.log(`✓ revisions ledger in sync (${(rd(LOG, { count: 0 }).count)} recorded).`);
    return;
  }

  // Default: detect → append → roll prev forward.
  const now = readingsProjection();
  const prev = rd(PREV, {});
  const events = diffVintages(prev, now);
  const existing = rd(LOG, { revisions: [] });
  const merged = mergeLog(existing, events);
  writeLog(merged);
  writeFileSync(PREV, JSON.stringify(now, null, 2) + '\n');
  console.log(`Cost-index revisions: +${events.length} new event(s) this vintage, ${merged.length} total recorded.`);
}

function selfTest() {
  const r2 = (x) => Math.round(x * 10000) / 10000;
  const prev = { ribeye: { '2026-06-01': 1200, '2026-06-08': 1250 }, onion: { '2026-06-01': 40 } };
  const now  = { ribeye: { '2026-06-01': 1200, '2026-06-08': 1300, '2026-06-15': 1280 }, onion: {} };
  const ev = diffVintages(prev, now);
  const rev = ev.filter((e) => e.type === 'revision');
  const wd = ev.filter((e) => e.type === 'withdrawal');
  const checks = [
    ['changed print -> one revision', rev.length === 1 && rev[0].ingredient === 'ribeye' && rev[0].date === '2026-06-08'],
    ['revision carries before/after/delta', rev[0] && rev[0].beforeCents === 1250 && rev[0].afterCents === 1300 && rev[0].deltaPct === r2(50 / 1250)],
    ['new print is NOT a revision', !ev.some((e) => e.date === '2026-06-15')],
    ['vanished print -> one withdrawal', wd.length === 1 && wd[0].ingredient === 'onion' && wd[0].date === '2026-06-01'],
    ['identical vintages -> zero events', diffVintages(now, now).length === 0],
    ['ids unique', new Set(ev.map((e) => e.id)).size === ev.length],
    ['deterministic (rebuild equal)', JSON.stringify(diffVintages(prev, now)) === JSON.stringify(ev)],
    ['merge dedups by id', mergeLog({ revisions: ev }, ev).length === ev.length],
  ];
  const failed = checks.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`cost-revisions self-test: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

main();
